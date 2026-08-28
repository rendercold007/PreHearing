"""Billing: quota logic, subscription state, and the Razorpay webhook.

No network and no Razorpay keys needed — checkout's Razorpay API call isn't exercised
here (that needs a live key); everything else (quota, status, signature verification,
webhook-driven activation, dedup) runs fully offline against the throwaway test schema.
"""

import hashlib
import hmac
import json

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.auth.routes import CurrentUser, get_current_user
from app.billing import routes as billing_routes
from app.billing.razorpay_client import verify_webhook_signature
from app.billing.store import (
    get_subscription,
    increment_usage,
    quota_status,
    upsert_subscription,
)
from app.config import get_settings

WEBHOOK_SECRET = "whsec_test"


def _sign(body: bytes, secret: str = WEBHOOK_SECRET) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


# --- quota / plan resolution (store, called directly) ---


def test_quota_defaults_to_free(user_id):
    assert quota_status(user_id) == {"plan": "free", "limit": 2, "used": 0, "remaining": 2}


def test_increment_usage_counts_down_the_month(user_id):
    increment_usage(user_id)
    increment_usage(user_id)
    status = quota_status(user_id)
    assert status["used"] == 2
    assert status["remaining"] == 0


def test_active_subscription_grants_its_plan_quota(user_id):
    upsert_subscription(user_id, plan="pro", status="active", razorpay_subscription_id="sub_1")
    status = quota_status(user_id)
    assert status["plan"] == "pro"
    assert status["limit"] == 30


def test_inactive_subscription_falls_back_to_free(user_id):
    # A halted/cancelled subscription must not keep granting paid quota.
    upsert_subscription(user_id, plan="pro", status="halted", razorpay_subscription_id="sub_1")
    status = quota_status(user_id)
    assert status["plan"] == "free"
    assert status["limit"] == 2


def test_upsert_replaces_the_single_row_per_user(user_id):
    upsert_subscription(user_id, plan="pro", status="created", razorpay_subscription_id="sub_1")
    upsert_subscription(user_id, plan="plus", status="active", razorpay_subscription_id="sub_2")
    sub = get_subscription(user_id)
    assert sub["plan"] == "plus"
    assert sub["status"] == "active"
    assert sub["razorpay_subscription_id"] == "sub_2"


# --- signature verification (razorpay_client) ---


def test_webhook_signature_accepts_valid_and_rejects_the_rest(monkeypatch):
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", WEBHOOK_SECRET)
    get_settings.cache_clear()
    body = b'{"hello":"world"}'
    assert verify_webhook_signature(body, _sign(body)) is True
    assert verify_webhook_signature(body, "deadbeef") is False
    assert verify_webhook_signature(body, "") is False


# --- routes via TestClient ---


@pytest.fixture
def billing_client():
    def build(current_user_id: int) -> TestClient:
        app = FastAPI()
        app.include_router(billing_routes.router, prefix="/api")
        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            id=current_user_id, email="test@example.com", token="tok"
        )
        return TestClient(app)

    return build


def test_status_endpoint_reports_free_and_billing_disabled(billing_client, user_id):
    # No RAZORPAY_KEY_ID in the test env, so billing_enabled is false.
    resp = billing_client(user_id).get("/api/billing/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["plan"] == "free"
    assert data["limit"] == 2
    assert data["billing_enabled"] is False


def test_checkout_503_when_billing_not_configured(billing_client, user_id):
    resp = billing_client(user_id).post("/api/billing/checkout", json={"plan": "pro"})
    assert resp.status_code == 503


def test_webhook_activates_the_subscription(billing_client, user_id, monkeypatch):
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", WEBHOOK_SECRET)
    get_settings.cache_clear()

    # Checkout already recorded the subscription in 'created' state.
    upsert_subscription(user_id, plan="pro", status="created", razorpay_subscription_id="sub_abc")

    payload = {
        "event": "subscription.activated",
        "payload": {
            "subscription": {
                "entity": {"id": "sub_abc", "status": "active", "current_end": 1735689600}
            }
        },
    }
    body = json.dumps(payload).encode()
    resp = billing_client(user_id).post(
        "/api/billing/webhook",
        content=body,
        headers={"X-Razorpay-Signature": _sign(body), "X-Razorpay-Event-Id": "evt_1"},
    )
    assert resp.status_code == 200

    # Now active → quota reflects the pro plan.
    status = quota_status(user_id)
    assert status["plan"] == "pro"
    assert status["limit"] == 30


def test_webhook_rejects_a_bad_signature(billing_client, user_id, monkeypatch):
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", WEBHOOK_SECRET)
    get_settings.cache_clear()
    resp = billing_client(user_id).post(
        "/api/billing/webhook",
        content=b'{"event":"x"}',
        headers={"X-Razorpay-Signature": "wrong", "X-Razorpay-Event-Id": "evt_2"},
    )
    assert resp.status_code == 400


def test_webhook_dedupes_a_repeated_event(billing_client, user_id, monkeypatch):
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", WEBHOOK_SECRET)
    get_settings.cache_clear()
    upsert_subscription(user_id, plan="pro", status="created", razorpay_subscription_id="sub_dup")

    def deliver(new_status: str):
        payload = {
            "event": "subscription.charged",
            "payload": {"subscription": {"entity": {"id": "sub_dup", "status": new_status}}},
        }
        body = json.dumps(payload).encode()
        return billing_client(user_id).post(
            "/api/billing/webhook",
            content=body,
            headers={"X-Razorpay-Signature": _sign(body), "X-Razorpay-Event-Id": "evt_same"},
        )

    assert deliver("active").status_code == 200
    # Same event id, different status — dedup must drop it, so status stays 'active'.
    assert deliver("halted").status_code == 200
    assert get_subscription(user_id)["status"] == "active"


# --- the gate on /api/analyze ---


def test_analyze_route_402_once_quota_is_exhausted(user_id):
    from app.api import routes as api_routes

    app = FastAPI()
    app.include_router(api_routes.router, prefix="/api")
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=user_id, email="test@example.com", token="tok"
    )
    client = TestClient(app)

    # Burn the two free analyses; the gate runs before any parsing/LLM work, so no
    # pipeline stubbing is needed — the third request is refused up front.
    increment_usage(user_id)
    increment_usage(user_id)

    resp = client.post(
        "/api/analyze", files={"files": ("c.pdf", b"%PDF-fake", "application/pdf")}
    )
    assert resp.status_code == 402
