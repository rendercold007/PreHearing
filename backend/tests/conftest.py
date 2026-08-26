import os
import uuid

import psycopg
import pytest

from app.auth import db
from app.config import get_settings

# Base Postgres DSN with no per-test schema. Defaults to the docker-compose service;
# point TEST_DATABASE_URL (or DATABASE_URL) at another database to run elsewhere.
BASE_DSN = (
    os.environ.get("TEST_DATABASE_URL")
    or os.environ.get("DATABASE_URL")
    or "postgresql://prehearing:prehearing@localhost:5432/prehearing"
)


@pytest.fixture(autouse=True)
def fake_settings(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    monkeypatch.setenv("OPENROUTER_MODEL_CHEAP", "test/cheap")
    monkeypatch.setenv("OPENROUTER_MODEL_MID", "test/mid")
    monkeypatch.setenv("OPENROUTER_MODEL_STRONG", "test/strong")
    monkeypatch.setenv("INDIANKANOON_API_TOKEN", "")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def clear_rate_limits(temp_db):
    """Clear the limiter between tests. Depends on temp_db so the schema and pool exist
    before reset() touches the rate_limit_hits table (and so its teardown runs first,
    while they still exist)."""
    from app.auth import ratelimit

    ratelimit.reset()
    yield
    ratelimit.reset()


@pytest.fixture(autouse=True)
def temp_db(monkeypatch):
    """Every test gets its own Postgres schema — created fresh, dropped after — so
    tests never see each other's rows and never touch a real database. The schema is
    made the search_path via PGOPTIONS, so the pool's connections land in it."""
    schema = f"test_{uuid.uuid4().hex}"
    with psycopg.connect(BASE_DSN, autocommit=True) as admin:
        admin.execute(f'CREATE SCHEMA "{schema}"')

    monkeypatch.setenv("DATABASE_URL", BASE_DSN)
    monkeypatch.setenv("PGOPTIONS", f"-c search_path={schema}")
    get_settings.cache_clear()
    db.reset_pool()
    db.init_db()
    yield
    db.reset_pool()
    with psycopg.connect(BASE_DSN, autocommit=True) as admin:
        admin.execute(f'DROP SCHEMA "{schema}" CASCADE')


def _create_user(email: str) -> int:
    with db.get_connection() as conn:
        row = conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (%s, 'x') RETURNING id",
            (email,),
        ).fetchone()
    return row["id"]


@pytest.fixture
def user_id() -> int:
    return _create_user("test@example.com")


@pytest.fixture
def other_user_id() -> int:
    return _create_user("other@example.com")
