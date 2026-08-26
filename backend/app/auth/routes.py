import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from psycopg.errors import UniqueViolation
from pydantic import BaseModel, Field, field_validator

from app.auth.db import get_connection
from app.auth.ratelimit import check_rate_limit, client_key
from app.auth.security import (
    hash_password,
    hash_token,
    new_reset_token,
    new_session_token,
    verify_password,
)
from app.config import get_settings
from app.email.client import send_password_reset_email

logger = logging.getLogger(__name__)

SESSION_LIFETIME = timedelta(days=7)

router = APIRouter(prefix="/auth")

_bearer = HTTPBearer(auto_error=False)


class Credentials(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if "@" not in value or "." not in value.split("@")[-1]:
            raise ValueError("Enter a valid email address.")
        return value


class SignupCredentials(Credentials):
    name: str = Field(min_length=1, max_length=80)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Enter your name.")
        return value


class AuthResponse(BaseModel):
    token: str
    email: str


class MeResponse(BaseModel):
    email: str
    name: str
    created_at: str


class ProfileUpdate(BaseModel):
    name: str = Field(max_length=80)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return value.strip()


class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    password: str = Field(min_length=8, max_length=128)


class MessageResponse(BaseModel):
    message: str


@dataclass
class CurrentUser:
    id: int
    email: str
    token: str
    created_at: str = ""
    name: str = ""


def _throttle_auth(request: Request, action: str) -> None:
    settings = get_settings()
    check_rate_limit(
        client_key(request, action),
        settings.auth_rate_limit,
        settings.auth_rate_window_seconds,
    )


def _create_session(conn: psycopg.Connection, user_id: int) -> str:
    token = new_session_token()
    expires_at = datetime.now(timezone.utc) + SESSION_LIFETIME
    conn.execute(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES (%s, %s, %s)",
        (token, user_id, expires_at),
    )
    return token


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated.")

    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT users.id, users.email, users.name,
                   to_char(users.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
                       AS created_at,
                   sessions.expires_at
            FROM sessions JOIN users ON users.id = sessions.user_id
            WHERE sessions.token = %s
            """,
            (credentials.credentials,),
        ).fetchone()

        if row is None:
            raise HTTPException(status_code=401, detail="Invalid or expired session.")

        if row["expires_at"] < datetime.now(timezone.utc):
            conn.execute("DELETE FROM sessions WHERE token = %s", (credentials.credentials,))
            # The context manager rolls back when the block exits via an exception, so
            # the delete has to be committed before raising or it never happens.
            conn.commit()
            raise HTTPException(status_code=401, detail="Invalid or expired session.")

    return CurrentUser(
        id=row["id"],
        email=row["email"],
        token=credentials.credentials,
        created_at=row["created_at"],
        name=row["name"],
    )


@router.post("/signup", response_model=AuthResponse, status_code=201)
def signup(credentials: SignupCredentials, request: Request) -> AuthResponse:
    _throttle_auth(request, "signup")
    with get_connection() as conn:
        try:
            row = conn.execute(
                "INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s)"
                " RETURNING id",
                (credentials.email, hash_password(credentials.password), credentials.name),
            ).fetchone()
        except UniqueViolation:
            raise HTTPException(
                status_code=409, detail="An account with this email already exists."
            ) from None
        token = _create_session(conn, row["id"])
    return AuthResponse(token=token, email=credentials.email)


@router.post("/login", response_model=AuthResponse)
def login(credentials: Credentials, request: Request) -> AuthResponse:
    # Verifying a password runs 600k pbkdf2 iterations, so an unthrottled login
    # endpoint is both a credential-stuffing surface and a CPU-exhaustion one.
    _throttle_auth(request, "login")
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, password_hash FROM users WHERE email = %s",
            (credentials.email,),
        ).fetchone()

        if row is None or not verify_password(credentials.password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Incorrect email or password.")

        token = _create_session(conn, row["id"])
    return AuthResponse(token=token, email=credentials.email)


@router.get("/me", response_model=MeResponse)
def me(user: CurrentUser = Depends(get_current_user)) -> MeResponse:
    return MeResponse(email=user.email, name=user.name, created_at=user.created_at)


@router.patch("/me", response_model=MeResponse)
def update_me(
    update: ProfileUpdate, user: CurrentUser = Depends(get_current_user)
) -> MeResponse:
    with get_connection() as conn:
        conn.execute("UPDATE users SET name = %s WHERE id = %s", (update.name, user.id))
    return MeResponse(email=user.email, name=update.name, created_at=user.created_at)


@router.post("/logout", status_code=204)
def logout(user: CurrentUser = Depends(get_current_user)) -> None:
    with get_connection() as conn:
        conn.execute("DELETE FROM sessions WHERE token = %s", (user.token,))


_GENERIC_RESET_MESSAGE = "If an account exists for that email, a reset link has been sent."


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, request: Request) -> MessageResponse:
    # Always return the same message whether or not the email matches an account, so this
    # endpoint can't be used to enumerate who has signed up.
    _throttle_auth(request, "forgot-password")
    settings = get_settings()

    reset_url: str | None = None
    with get_connection() as conn:
        user = conn.execute(
            "SELECT id FROM users WHERE email = %s", (payload.email,)
        ).fetchone()
        if user is not None:
            # Supersede any earlier link for this user so only the newest one works.
            conn.execute(
                "DELETE FROM password_reset_tokens WHERE user_id = %s", (user["id"],)
            )
            token = new_reset_token()
            expires_at = datetime.now(timezone.utc) + timedelta(
                minutes=settings.password_reset_ttl_minutes
            )
            conn.execute(
                "INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)"
                " VALUES (%s, %s, %s)",
                (hash_token(token), user["id"], expires_at),
            )
            reset_url = f"{settings.app_base_url.rstrip('/')}/reset-password?token={token}"

    # Send after the transaction so a slow email call never holds a DB connection. A send
    # failure is logged, not surfaced — telling the caller would also leak account existence.
    if reset_url is not None:
        try:
            send_password_reset_email(payload.email, reset_url)
        except Exception:
            logger.exception("Failed to send password reset email")

    return MessageResponse(message=_GENERIC_RESET_MESSAGE)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, request: Request) -> MessageResponse:
    _throttle_auth(request, "reset-password")
    now = datetime.now(timezone.utc)

    with get_connection() as conn:
        row = conn.execute(
            "SELECT token_hash, user_id, expires_at, used_at"
            " FROM password_reset_tokens WHERE token_hash = %s",
            (hash_token(payload.token),),
        ).fetchone()

        if row is None or row["used_at"] is not None or row["expires_at"] < now:
            raise HTTPException(
                status_code=400, detail="This reset link is invalid or has expired."
            )

        conn.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (hash_password(payload.password), row["user_id"]),
        )
        conn.execute(
            "UPDATE password_reset_tokens SET used_at = %s WHERE token_hash = %s",
            (now, row["token_hash"]),
        )
        # Invalidate every active session so a resettee (or an attacker who prompted the
        # reset) is forced to sign in again everywhere with the new password.
        conn.execute("DELETE FROM sessions WHERE user_id = %s", (row["user_id"],))

    return MessageResponse(message="Your password has been reset. You can now sign in.")
