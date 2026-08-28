from datetime import datetime, timezone

from app.auth.db import get_connection
from app.config import get_settings


def _current_period() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")

def get_subscription(user_id: int) -> dict | None:
    with get_connection() as conn:
        return conn.execute(
            "SELECT * FROM subscriptions WHERE user_id = %s", (user_id,)
        ).fetchone()    

def upsert_subscription(
    user_id: int,
    plan: str,
    status: str,
    razorpay_subscription_id: str | None = None,
    razorpay_customer_id: str | None = None,
    current_period_end: datetime | None = None,
) -> None:

    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO subscriptions (
                user_id, plan, status, razorpay_subscription_id,
                razorpay_customer_id, current_period_end, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, now())
            ON CONFLICT (user_id) DO UPDATE SET
                plan = EXCLUDED.plan,
                status = EXCLUDED.status,
                razorpay_subscription_id = EXCLUDED.razorpay_subscription_id,
                razorpay_customer_id = EXCLUDED.razorpay_customer_id,
                current_period_end = EXCLUDED.current_period_end,
                updated_at = now()
            """,
            (user_id, plan, status,razorpay_subscription_id,
            razorpay_customer_id, current_period_end),
        )

def quota_status(user_id: int) -> dict:
    settings = get_settings()
    period = _current_period()
    with get_connection() as conn:
        sub = conn.execute(
            "SELECT plan, status FROM subscriptions WHERE user_id = %s", (user_id,)
        ).fetchone()
        used_row = conn.execute(
            "SELECT used FROM usage_counters WHERE user_id = %s AND period = %s",
            (user_id, period),
        ).fetchone()

    plan = sub["plan"] if sub and sub["status"] == "active" else "free"
    limit = settings.quota_for_plan(plan)
    used = used_row["used"] if used_row else 0
    return{
        "plan": plan,
        "limit": limit,
        "used": used,
        "remaining": max(limit - used, 0),
    }

def increment_usage(user_id: int) -> None:
    period = _current_period()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO usage_counters (user_id, period, used)
            VALUES(%s,%s, 1)
            ON CONFLICT (user_id, period) DO UPDATE SET used = usage_counters.used + 1
            """,
            (user_id, period),
        )                           