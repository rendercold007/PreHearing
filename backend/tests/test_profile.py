import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.auth import routes as auth_routes


@pytest.fixture
def client() -> TestClient:
    app = FastAPI()
    app.include_router(auth_routes.router, prefix="/api")
    return TestClient(app)


@pytest.fixture
def auth_headers(client) -> dict:
    response = client.post(
        "/api/auth/signup", json={"email": "lawyer@example.com", "password": "password123"}
    )
    return {"Authorization": f"Bearer {response.json()['token']}"}


def test_new_account_has_no_name_yet(client, auth_headers):
    body = client.get("/api/auth/me", headers=auth_headers).json()
    assert body["email"] == "lawyer@example.com"
    assert body["name"] == ""
    assert body["created_at"]


def test_name_can_be_set_and_is_returned_afterwards(client, auth_headers):
    response = client.patch("/api/auth/me", json={"name": "  Aditi Rao  "}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Aditi Rao"  # trimmed

    assert client.get("/api/auth/me", headers=auth_headers).json()["name"] == "Aditi Rao"


def test_name_can_be_cleared(client, auth_headers):
    client.patch("/api/auth/me", json={"name": "Aditi Rao"}, headers=auth_headers)
    client.patch("/api/auth/me", json={"name": ""}, headers=auth_headers)
    assert client.get("/api/auth/me", headers=auth_headers).json()["name"] == ""


def test_absurdly_long_name_is_rejected(client, auth_headers):
    response = client.patch("/api/auth/me", json={"name": "x" * 81}, headers=auth_headers)
    assert response.status_code == 422


def test_profile_requires_authentication(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.patch("/api/auth/me", json={"name": "Anon"}).status_code == 401


def test_migration_adds_name_to_an_existing_database(monkeypatch, tmp_path):
    """A database created before the name column existed still upgrades cleanly."""
    import sqlite3

    from app.auth import db

    path = tmp_path / "legacy.db"
    legacy = sqlite3.connect(path)
    legacy.executescript(
        """
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT INTO users (email, password_hash) VALUES ('old@example.com', 'x');
        """
    )
    legacy.commit()
    legacy.close()

    monkeypatch.setattr(db, "DB_PATH", path)
    db.init_db()

    with db.get_connection() as conn:
        row = conn.execute("SELECT email, name FROM users").fetchone()
    assert (row["email"], row["name"]) == ("old@example.com", "")
