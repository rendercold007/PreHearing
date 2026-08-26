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
        "/api/auth/signup",
        json={
            "name": "Aditi Rao",
            "email": "lawyer@example.com",
            "password": "password123",
        },
    )
    return {"Authorization": f"Bearer {response.json()['token']}"}


def test_new_account_keeps_the_name_given_at_signup(client, auth_headers):
    body = client.get("/api/auth/me", headers=auth_headers).json()
    assert body["email"] == "lawyer@example.com"
    assert body["name"] == "Aditi Rao"
    assert body["created_at"]


@pytest.mark.parametrize("name", [None, "", "   "])
def test_signup_requires_a_name(client, name):
    payload = {"email": "new@example.com", "password": "password123"}
    if name is not None:
        payload["name"] = name
    assert client.post("/api/auth/signup", json=payload).status_code == 422


def test_signup_trims_the_name(client):
    response = client.post(
        "/api/auth/signup",
        json={"name": "  Vikram Shah  ", "email": "vs@example.com", "password": "password123"},
    )
    headers = {"Authorization": f"Bearer {response.json()['token']}"}
    assert client.get("/api/auth/me", headers=headers).json()["name"] == "Vikram Shah"


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


def test_expired_session_is_rejected_and_deleted(client, auth_headers):
    """The 401 is the visible half. The delete is the half that silently regressed:
    the connection's context manager rolls back when the block raises, so an
    uncommitted delete followed by `raise HTTPException` never removes the row."""
    from datetime import datetime, timedelta, timezone

    from app.auth import db

    token = auth_headers["Authorization"].removeprefix("Bearer ")
    past = datetime.now(timezone.utc) - timedelta(days=1)
    with db.get_connection() as conn:
        conn.execute("UPDATE sessions SET expires_at = %s WHERE token = %s", (past, token))

    assert client.get("/api/auth/me", headers=auth_headers).status_code == 401

    with db.get_connection() as conn:
        remaining = conn.execute(
            "SELECT count(*) AS n FROM sessions WHERE token = %s", (token,)
        ).fetchone()["n"]
    assert remaining == 0, "expired session row was not cleaned up"


def test_profile_requires_authentication(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.patch("/api/auth/me", json={"name": "Anon"}).status_code == 401


def test_migration_adds_name_to_an_existing_database(monkeypatch):
    """A database created before the name column existed still upgrades cleanly:
    init_db()'s ALTER TABLE ... ADD COLUMN IF NOT EXISTS backfills it."""
    import os
    import uuid

    import psycopg

    from app.auth import db

    base_dsn = os.environ["DATABASE_URL"]  # set by the temp_db fixture to the base DSN
    schema = f"legacy_{uuid.uuid4().hex}"
    with psycopg.connect(base_dsn, autocommit=True) as admin:
        admin.execute(f'CREATE SCHEMA "{schema}"')
        admin.execute(
            f'CREATE TABLE "{schema}".users ('
            " id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,"
            " email TEXT NOT NULL UNIQUE,"
            " password_hash TEXT NOT NULL,"
            " created_at TIMESTAMPTZ NOT NULL DEFAULT now())"
        )
        admin.execute(
            f"INSERT INTO \"{schema}\".users (email, password_hash)"
            " VALUES ('old@example.com', 'x')"
        )

    # Re-point the pool at the legacy schema and run the schema setup over it, then put
    # it back so the fixtures' own teardown still has a live schema to work against.
    prev_pgoptions = os.environ.get("PGOPTIONS")
    monkeypatch.setenv("PGOPTIONS", f"-c search_path={schema}")
    db.reset_pool()
    db.init_db()

    with db.get_connection() as conn:
        row = conn.execute("SELECT email, name FROM users").fetchone()
    assert (row["email"], row["name"]) == ("old@example.com", "")

    db.reset_pool()
    with psycopg.connect(base_dsn, autocommit=True) as admin:
        admin.execute(f'DROP SCHEMA "{schema}" CASCADE')

    if prev_pgoptions is not None:
        monkeypatch.setenv("PGOPTIONS", prev_pgoptions)
    else:
        monkeypatch.delenv("PGOPTIONS", raising=False)
    db.reset_pool()
