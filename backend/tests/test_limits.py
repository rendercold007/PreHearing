"""Guardrails: upload limits, the extractor's chunk budget, and rate limiting."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api import routes
from app.auth import ratelimit
from app.auth.routes import CurrentUser, get_current_user
from app.config import get_settings
from app.ingest.parser import DocumentChunk, budget_chunks
from app.main import app as real_app
from tests.test_analyze_route import (
    ARGUMENTS,
    ISSUES,
    PREP,
    STRESS,
    UNDERSTANDING,
    result_of,
)


@pytest.fixture
def client(monkeypatch, user_id):
    app = FastAPI()
    app.include_router(routes.router, prefix="/api")
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=user_id, email="test@example.com", token="tok"
    )
    monkeypatch.setattr(routes, "extract_understanding", lambda chunks, model: UNDERSTANDING)
    monkeypatch.setattr(routes, "identify_issues", lambda u, model: ISSUES)
    monkeypatch.setattr(routes, "generate_arguments", lambda u, i, r, model: ARGUMENTS)
    monkeypatch.setattr(routes, "stress_test", lambda u, i, a, r, model: STRESS)
    monkeypatch.setattr(routes, "assemble_hearing_prep", lambda u, i, a, s, model: PREP)
    monkeypatch.setattr(routes, "research_issues", lambda i, model, adverse=False: [])
    return TestClient(app)


def upload(client, count=1, size=10):
    files = [
        ("files", (f"case{n}.pdf", b"x" * size, "application/pdf")) for n in range(count)
    ]
    return client.post("/api/analyze", files=files)


# --- budget_chunks ------------------------------------------------------------


def chunks_of(count, text_len=100):
    return [DocumentChunk("case.pdf", f"page {n}", "x" * text_len) for n in range(count)]


def test_budget_keeps_everything_that_fits():
    chunks = chunks_of(5)
    kept, dropped = budget_chunks(chunks, 100_000)
    assert kept == chunks
    assert dropped == 0


def test_budget_drops_the_tail_and_reports_how_many():
    kept, dropped = budget_chunks(chunks_of(10), 400)
    assert len(kept) < 10
    assert len(kept) + dropped == 10


def test_budget_always_keeps_at_least_one_chunk():
    """A single page longer than the whole budget should still be analysed, not
    turned into an empty run."""
    kept, dropped = budget_chunks(chunks_of(3, text_len=5000), 100)
    assert len(kept) == 1
    assert dropped == 2


def test_truncated_case_warns_the_user(client, monkeypatch):
    monkeypatch.setattr(routes, "parse_documents", lambda files: chunks_of(50, text_len=5000))
    monkeypatch.setattr(get_settings(), "max_prompt_chars", 20_000, raising=False)
    analysis = result_of(upload(client))
    assert any("not read" in w for w in analysis["warnings"])


# --- upload limits ------------------------------------------------------------


def test_too_many_files_is_413(client, monkeypatch):
    monkeypatch.setattr(routes, "parse_documents", lambda files: chunks_of(1))
    settings = get_settings()
    monkeypatch.setattr(settings, "max_files", 2, raising=False)
    response = upload(client, count=3)
    assert response.status_code == 413
    assert "Too many files" in response.json()["detail"]


def test_oversized_file_is_413(client, monkeypatch):
    monkeypatch.setattr(routes, "parse_documents", lambda files: chunks_of(1))
    monkeypatch.setattr(get_settings(), "max_file_mb", 0.000001, raising=False)
    response = upload(client, size=5000)
    assert response.status_code == 413
    assert "the limit is" in response.json()["detail"]


def test_within_limits_still_runs(client, monkeypatch):
    monkeypatch.setattr(routes, "parse_documents", lambda files: chunks_of(2))
    assert upload(client).status_code == 200


def test_content_length_over_the_cap_is_rejected_before_the_body_is_read():
    """The middleware is the only thing that can stop the bytes before Starlette
    spools them to a temp file."""
    settings = get_settings()
    client = TestClient(real_app)
    response = client.post(
        "/api/analyze",
        content=b"",
        headers={"Content-Length": str(settings.max_total_bytes + 1)},
    )
    assert response.status_code == 413


# --- rate limiting ------------------------------------------------------------


def test_analyze_is_throttled_per_user(client, monkeypatch):
    monkeypatch.setattr(routes, "parse_documents", lambda files: chunks_of(1))
    monkeypatch.setattr(get_settings(), "analyze_rate_limit", 2, raising=False)

    assert upload(client).status_code == 200
    assert upload(client).status_code == 200
    blocked = upload(client)
    assert blocked.status_code == 429
    assert blocked.headers["Retry-After"]


def test_login_is_throttled_by_ip(monkeypatch):
    """Each attempt costs 600k pbkdf2 iterations, so wrong passwords must be capped."""
    from fastapi import FastAPI

    from app.auth import routes as auth_routes

    app = FastAPI()
    app.include_router(auth_routes.router, prefix="/api")
    auth_client = TestClient(app)
    auth_client.post(
        "/api/auth/signup",
        json={"name": "A", "email": "a@example.com", "password": "password123"},
    )

    monkeypatch.setattr(get_settings(), "auth_rate_limit", 3, raising=False)
    ratelimit.reset()

    wrong = {"email": "a@example.com", "password": "wrongpassword"}
    assert auth_client.post("/api/auth/login", json=wrong).status_code == 401
    assert auth_client.post("/api/auth/login", json=wrong).status_code == 401
    assert auth_client.post("/api/auth/login", json=wrong).status_code == 401
    assert auth_client.post("/api/auth/login", json=wrong).status_code == 429

    # and the throttle is not hiding a broken login — the right password still works
    ratelimit.reset()
    good = auth_client.post(
        "/api/auth/login", json={"email": "a@example.com", "password": "password123"}
    )
    assert good.status_code == 200
    assert good.json()["token"]


def test_limiter_window_expires():
    ratelimit.reset()
    ratelimit.check_rate_limit("k", limit=1, window_seconds=60)
    with pytest.raises(Exception):
        ratelimit.check_rate_limit("k", limit=1, window_seconds=60)
    # a zero-length window means every previous hit is already outside it
    ratelimit.check_rate_limit("k", limit=1, window_seconds=0)


def test_limiter_state_survives_a_pool_reset():
    """The point of the Postgres backing: a hit recorded before a worker restart (here,
    a pool rebuild) still counts afterwards. An in-memory limiter would forget it."""
    from app.auth import db

    ratelimit.reset()
    ratelimit.check_rate_limit("shared", limit=1, window_seconds=60)

    db.reset_pool()  # stand-in for a fresh worker with its own connections

    with pytest.raises(Exception):
        ratelimit.check_rate_limit("shared", limit=1, window_seconds=60)
