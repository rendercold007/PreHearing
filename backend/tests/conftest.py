import pytest

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
