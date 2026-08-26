"""Transactional email via Resend (https://resend.com), over httpx — same thin-wrapper
style as research/kanoon.py, no extra SDK.

When RESEND_API_KEY is unset the send is skipped and the reset link is logged instead, so
password reset can be exercised in local dev without wiring up a real email account.
"""

import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


def _send(to: str, subject: str, html: str) -> None:
    settings = get_settings()
    response = httpx.post(
        RESEND_API_URL,
        headers={"Authorization": f"Bearer {settings.resend_api_key}"},
        json={"from": settings.resend_from, "to": [to], "subject": subject, "html": html},
        timeout=15,
    )
    response.raise_for_status()


def send_password_reset_email(to: str, reset_url: str) -> None:
    settings = get_settings()
    subject = "Reset your PreHearing password"
    html = (
        "<p>We received a request to reset your PreHearing password.</p>"
        f'<p><a href="{reset_url}">Choose a new password</a>. '
        f"This link expires in {settings.password_reset_ttl_minutes} minutes.</p>"
        "<p>If you didn't request this, you can safely ignore this email.</p>"
    )

    if not settings.resend_api_key:
        # Dev convenience: no email provider configured, so surface the link in the log.
        logger.warning("RESEND_API_KEY unset — password reset link for %s: %s", to, reset_url)
        return

    _send(to, subject, html)
