"""Razorpay billing over httpx â thin wrapper, same style as email/client.py and
research/kanoon.py, no Razorpay SDK.

Two responsibilities:
  * create a subscription against a Plan (server-side, authenticated with the key
    id/secret) â the frontend then opens Razorpay Checkout on the returned id;
  * verify signatures on anything the browser or Razorpay hands back â the webhook
    (the source of truth for subscription status) and the post-checkout handshake â
    so a forged "you're subscribed" payload can never be trusted.
"""

import hashlib
import hmac
import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

RAZORPAY_API = "https://api.razorpay.com/v1"

def create_subscription(plan_id: str, total_count: int = 12, notes: dict | None = None) -> dict:
    settings = get_settings()
    response = httpx.post(
        f"{RAZORPAY_API}/subscriptions",
        auth=(settings.razorpay_key_id, settings.razorpay_key_secret),
        json={
            "plan_id": plan_id,
            "total_count": total_count,
            "customer_notify": 1,
            "notes": notes or {},
        },
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    settings = get_settings()
    expected = hmac.new(
        settings.razorpay_webhook_secret.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature or "")


def verify_subscription_payment(subscription_id: str, payment_id: str, signature: str) -> bool:
    settings = get_settings()
    message = f"{payment_id}|{subscription_id}".encode()
    expected = hmac.new(
        settings.razorpay_key_secret.encode(),
        message,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature or "")