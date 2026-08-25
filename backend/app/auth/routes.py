import sqlite3
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator

from app.auth.db import get_connection
from app.auth.security import hash_password, new_session_token, verify_password

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


@dataclass
class CurrentUser:
    id: int
    email: str
    token: str
    created_at: str = ""
    name: str = ""


def _create_session(conn: sqlite3.Connection, user_id: int) -> str:
    token = new_session_token()
    expires_at = (datetime.now(timezone.utc) + SESSION_LIFETIME).isoformat()
    conn.execute(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
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
            SELECT users.id, users.email, users.name, users.created_at, sessions.expires_at
            FROM sessions JOIN users ON users.id = sessions.user_id
            WHERE sessions.token = ?
            """,
            (credentials.credentials,),
        ).fetchone()

        if row is None:
            raise HTTPException(status_code=401, detail="Invalid or expired session.")

        if datetime.fromisoformat(row["expires_at"]) < datetime.now(timezone.utc):
            conn.execute("DELETE FROM sessions WHERE token = ?", (credentials.credentials,))
            raise HTTPException(status_code=401, detail="Invalid or expired session.")

    return CurrentUser(
        id=row["id"],
        email=row["email"],
        token=credentials.credentials,
        created_at=row["created_at"],
        name=row["name"],
    )


@router.post("/signup", response_model=AuthResponse, status_code=201)
def signup(credentials: Credentials) -> AuthResponse:
    with get_connection() as conn:
        try:
            cursor = conn.execute(
                "INSERT INTO users (email, password_hash) VALUES (?, ?)",
                (credentials.email, hash_password(credentials.password)),
            )
        except sqlite3.IntegrityError:
            raise HTTPException(
                status_code=409, detail="An account with this email already exists."
            ) from None
        token = _create_session(conn, cursor.lastrowid)
    return AuthResponse(token=token, email=credentials.email)


@router.post("/login", response_model=AuthResponse)
def login(credentials: Credentials) -> AuthResponse:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, password_hash FROM users WHERE email = ?",
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
        conn.execute("UPDATE users SET name = ? WHERE id = ?", (update.name, user.id))
    return MeResponse(email=user.email, name=update.name, created_at=user.created_at)


@router.post("/logout", status_code=204)
def logout(user: CurrentUser = Depends(get_current_user)) -> None:
    with get_connection() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (user.token,))
