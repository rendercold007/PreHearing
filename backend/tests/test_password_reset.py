from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.auth import routes as auth_routes


@pytest.fixture
def sent(monkeypatch):
    """Capture (to, reset_url) instead of calling Resend."""
    captured: list[tuple[str, str]] = []
    monkeypatch.setattr(
        auth_routes,
        "send_password_reset_email",
        lambda to, reset_url: captured.append((to, reset_url)),
    )
    return captured


@pytest.fixture
def client() -> TestClient:
    app = FastAPI()
    app.include_router(auth_routes.router, prefix="/api")
    return TestClient(app)


def _signup(client, email="lawyer@example.com", password="password123"):
    response = client.post(
        "/api/auth/signup",
        json={"name": "Aditi", "email": email, "password": password},
    )
    return response.json()["token"]


def _token_from(reset_url: str) -> str:
    return parse_qs(urlparse(reset_url).query)["token"][0]


def test_full_reset_flow(client, sent):
    _signup(client)

    forgot = client.post("/api/auth/forgot-password", json={"email": "lawyer@example.com"})
    assert forgot.status_code == 200
    assert len(sent) == 1
    to, reset_url = sent[0]
    assert to == "lawyer@example.com"

    token = _token_from(reset_url)
    reset = client.post(
        "/api/auth/reset-password", json={"token": token, "password": "newpassword456"}
    )
    assert reset.status_code == 200

    # New password works; old one no longer does.
    assert client.post(
        "/api/auth/login", json={"email": "lawyer@example.com", "password": "newpassword456"}
    ).status_code == 200
    assert client.post(
        "/api/auth/login", json={"email": "lawyer@example.com", "password": "password123"}
    ).status_code == 401


def test_unknown_email_returns_generic_message_and_sends_nothing(client, sent):
    response = client.post("/api/auth/forgot-password", json={"email": "nobody@example.com"})
    assert response.status_code == 200
    assert "reset link has been sent" in response.json()["message"]
    assert sent == []  # no account, no email — and the response doesn't reveal that


def test_reset_invalidates_existing_sessions(client, sent):
    old_token = _signup(client)
    # The old session is valid before the reset.
    assert client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {old_token}"}
    ).status_code == 200

    client.post("/api/auth/forgot-password", json={"email": "lawyer@example.com"})
    token = _token_from(sent[0][1])
    client.post("/api/auth/reset-password", json={"token": token, "password": "newpassword456"})

    # After the reset every prior session is gone.
    assert client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {old_token}"}
    ).status_code == 401


def test_token_is_single_use(client, sent):
    _signup(client)
    client.post("/api/auth/forgot-password", json={"email": "lawyer@example.com"})
    token = _token_from(sent[0][1])

    assert client.post(
        "/api/auth/reset-password", json={"token": token, "password": "newpassword456"}
    ).status_code == 200
    # Second use of the same link is rejected.
    assert client.post(
        "/api/auth/reset-password", json={"token": token, "password": "another789xx"}
    ).status_code == 400


def test_expired_token_is_rejected(client, sent):
    from app.auth import db

    _signup(client)
    client.post("/api/auth/forgot-password", json={"email": "lawyer@example.com"})
    token = _token_from(sent[0][1])

    past = datetime.now(timezone.utc) - timedelta(minutes=1)
    with db.get_connection() as conn:
        conn.execute("UPDATE password_reset_tokens SET expires_at = %s", (past,))

    assert client.post(
        "/api/auth/reset-password", json={"token": token, "password": "newpassword456"}
    ).status_code == 400


def test_garbage_token_is_rejected(client):
    assert client.post(
        "/api/auth/reset-password", json={"token": "not-a-real-token", "password": "newpassword456"}
    ).status_code == 400


def test_superseding_link_invalidates_the_previous_one(client, sent):
    _signup(client)
    client.post("/api/auth/forgot-password", json={"email": "lawyer@example.com"})
    first_token = _token_from(sent[0][1])
    client.post("/api/auth/forgot-password", json={"email": "lawyer@example.com"})
    second_token = _token_from(sent[1][1])

    # Requesting a second link deletes the first one's row.
    assert client.post(
        "/api/auth/reset-password", json={"token": first_token, "password": "newpassword456"}
    ).status_code == 400
    assert client.post(
        "/api/auth/reset-password", json={"token": second_token, "password": "newpassword456"}
    ).status_code == 200
