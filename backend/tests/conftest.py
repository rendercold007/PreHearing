import pytest

from app.auth import db
from app.config import get_settings


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
def clear_rate_limits():
    """The limiter's window is process-global, so one test's requests would otherwise
    count against the next one's allowance."""
    from app.auth import ratelimit

    ratelimit.reset()
    yield
    ratelimit.reset()


@pytest.fixture(autouse=True)
def temp_db(tmp_path, monkeypatch):
    """Every test gets its own SQLite file — never the developer's prehearing.db."""
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "test.db")
    db.init_db()


def _create_user(email: str) -> int:
    with db.get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, 'x')", (email,)
        )
    return cursor.lastrowid


@pytest.fixture
def user_id() -> int:
    return _create_user("test@example.com")


@pytest.fixture
def other_user_id() -> int:
    return _create_user("other@example.com")
