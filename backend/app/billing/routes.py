import json
import logging
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from app.auth.db import get_connection
from app.auth.routes import CurrentUser, get_current_user
from app.billing.razorpay_client import create_subscription, verify_webhook_signature
from app.billing.store import quota_status, upsert_subscription
from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing")


class CheckoutRequest(BaseModel):
    plan: str # "pro" | "plus"


class CheckoutResponse(BaseModel):
    subscription_id: str
    key_id: str
    plan: str

class BillingStatus(BaseModel):
    plan: str
    limit: int
    used: int 
    remaining: int
    billing_enabled: bool


def _plan_id_for(settings, plan: str) -> str:
    return{
        "pro": settings.razorpay_plan_pro,
        "plus": settings.razorpay_plan_plus,
    }.get(plan, "")

@router.post("/checkout", response_model=CheckoutResponse)
def create_checkout(
    payload: CheckoutRequest, user: CurrentUser = Depends(get_current_user)
) -> CheckoutResponse:
    settings = get_settings()
    if not settings.razorpay_key_id:
        raise HTTPException(status_code=503, detail="Billing is not processed.")

    plan_id = _plan_id_for(settings, payload.plan)
    if not plan_id:
        raise HTTPException(status_code=400, detail="Unknown plan.")

    try:
        subscription = create_subscription(plan_id, notes={"user_id": str(user.id)})
    except httpx.HTTPError:
        logger.exception("Razorpay subscription creation failed")
        raise HTTPException(
            status_code=502, detail="Could not start checkout. Please try again."
        ) from None

    upsert_subscription(
        user_id=user.id,
        plan=payload.plan,
        status=subscription.get("status", "created"),
        razorpay_subscription_id=subscription["id"],
    )
    return CheckoutResponse(
        subscription_id=subscription["id"],
        key_id=settings.razorpay_key_id,
        plan=payload.plan,
    )


@router.get("/status", response_model=BillingStatus)
async def billing_status(user: CurrentUser = Depends(get_current_user)) -> BillingStatus:
    settings = get_settings()
    status = await run_in_threadpool(quota_status, user.id)
    return BillingStatus(**status, billing_enabled=bool(settings.razorpay_key_id))

@router.post("/webhook")
async def razorpay_webhook(request: Request) -> dict:
    settings = get_settings()
    if not settings.razorpay_webhook_secret:
        raise HTTPException(status_code=503, detail="Billing is not processed.")

    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    if not verify_webhook_signature(body, signature):
        raise HTTPException(status_code=400, detail="Invalid signature.")

    event_id = request.headers.get("X-Razorpay-Event-Id", "")
    payload = json.loads(body)
    await run_in_threadpool(_process_webhook, event_id, payload)
    return {"status": "ok"}

def _process_webhook(event_id: str, payload: dict) -> None:
    with get_connection() as conn:
        if event_id:
            cursor = conn.execute(
                "INSERT INTO billing_webhook_events (event_id) VALUES (%s) "
                "ON CONFLICT (event_id) DO NOTHING",
                (event_id,),
            )
            if cursor.rowcount == 0:
                logger.info("Duplicate Razorpay webhook %s ignored", event_id)
                return

        entity = payload.get("payload", {}).get("subscription", {}).get("entity")
        if not entity:
            return

        current_end = entity.get("current_end")
        period_end = (
            datetime.fromtimestamp(current_end, tz=timezone.utc) if current_end else None
        )
        cursor = conn.execute(
            "UPDATE subscriptions SET status = %s, current_period_end = %s,"
            " updated_at = now() WHERE razorpay_subscription_id = %s",
            (entity.get("status", ""), period_end, entity.get("id")),
        )
        if cursor.rowcount == 0:
            logger.warning(
                "Webhook for unkown subscription %s (event %s)",
                entity.get("id"),
                event_id,
            )                            


