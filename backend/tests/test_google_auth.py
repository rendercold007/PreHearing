import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.auth import routes as auth_routes
from app.config import get_settings


@pytest.fixture
def client() -> TestClient:
    app = FastAPI()
    app.include_router(auth_routes.router, prefix="/api")
    return TestClient(app)


@pytest.fixture
def configured(monkeypatch):
    """Turn the feature on and stub Google verification to return whatever claims a
    test wants, so no token signing or network is involved."""
    monkeypatch.setattr(get_settings(), "google_client_id", "test-client-id", raising=False)

    claims = {
        "sub": "google-sub-123",
        "email": "lawyer@example.com",
        "email_verified": True,
        "name": "Aditi Rao",
    }

    def fake_verify(credential, client_id):
        if credential == "bad":
            raise ValueError("invalid token")
        return claims

    monkeypatch.setattr(auth_routes, "verify_google_token", fake_verify)
    return claims


def _google(client, credential="good"):
    return client.post("/api/auth/google", json={"credential": credential})


def _count_users(email: str) -> int:
    from app.auth import db

    with db.get_connection() as conn:
        return conn.execute(
            "SELECT count(*) AS n FROM users WHERE email = %s", (email,)
        ).fetchone()["n"]


def test_new_google_user_is_created_and_signed_in(client, configured):
    response = _google(client)
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "lawyer@example.com"

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {body['token']}"})
    assert me.status_code == 200
    assert me.json()["name"] == "Aditi Rao"
    assert _count_users("lawyer@example.com") == 1


def test_repeated_google_login_reuses_the_same_account(client, configured):
    _google(client)
    _google(client)
    assert _count_users("lawyer@example.com") == 1  # not duplicated


def test_google_links_to_an_existing_email_password_account(client, configured):
    # A password account exists first.
    client.post(
        "/api/auth/signup",
        json={"name": "Aditi", "email": "lawyer@example.com", "password": "password123"},
    )
    assert _count_users("lawyer@example.com") == 1

    # Signing in with Google on the same email links rather than duplicating.
    assert _google(client).status_code == 200
    assert _count_users("lawyer@example.com") == 1

    # And the original password still logs in.
    assert client.post(
        "/api/auth/login", json={"email": "lawyer@example.com", "password": "password123"}
    ).status_code == 200


def test_google_only_account_cannot_password_login(client, configured):
    _google(client)  # creates a passwordless account
    assert client.post(
        "/api/auth/login", json={"email": "lawyer@example.com", "password": "whatever12"}
    ).status_code == 401


def test_unverified_email_is_rejected(client, configured):
    configured["email_verified"] = False
    assert _google(client).status_code == 401


def test_invalid_token_is_rejected(client, configured):
    assert _google(client, credential="bad").status_code == 401


def test_google_disabled_when_not_configured(client, monkeypatch):
    # google_client_id defaults to "" — feature off.
    monkeypatch.setattr(get_settings(), "google_client_id", "", raising=False)
    assert _google(client).status_code == 503
