"""A Postgres-backed sliding-window rate limiter.

State lives in the `rate_limit_hits` table, shared by every worker, so the configured
allowance is enforced once across the whole deployment rather than once per process (the
in-memory version this replaced multiplied the limit by the worker count and reset on
restart). Each request that passes records one hit; a check counts the hits still inside
the window and rejects when they reach the limit.

Correctness under concurrency comes from a per-bucket advisory lock: two workers checking
the same key are serialized so the count-then-insert can't race, while different keys
never contend. The table is kept bounded by pruning a bucket's expired hits on every
check and sweeping globally on a timer.
"""

import threading
import time

from fastapi import HTTPException, Request

from app.auth.db import get_connection
from app.config import get_settings

# How often (per process) to sweep globally-expired rows. The per-bucket prune already
# keeps active keys tidy; this clears rows left behind by keys that stopped being hit.
_SWEEP_INTERVAL_SECONDS = 60.0

_sweep_lock = threading.Lock()
_last_sweep = 0.0


def _maybe_sweep() -> None:
    """At most once per _SWEEP_INTERVAL_SECONDS in this process, delete hits older than
    the largest configured window. Runs in its own committed transaction so it survives
    regardless of how the surrounding check turns out."""
    global _last_sweep
    now = time.monotonic()
    with _sweep_lock:
        if now - _last_sweep < _SWEEP_INTERVAL_SECONDS:
            return
        _last_sweep = now

    settings = get_settings()
    max_window = max(settings.auth_rate_window_seconds, settings.analyze_rate_window_seconds)
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM rate_limit_hits WHERE hit_at < now() - make_interval(secs => %s)",
            (max_window,),
        )


def check_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    """Record one hit for `key`, raising 429 if it exceeds `limit` in the window."""
    _maybe_sweep()

    with get_connection() as conn:
        # Serialize concurrent checks for this key across workers; the lock is held for
        # the transaction and released on commit or rollback.
        conn.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (key,))

        conn.execute(
            "DELETE FROM rate_limit_hits WHERE bucket = %s"
            " AND hit_at < now() - make_interval(secs => %s)",
            (key, window_seconds),
        )

        row = conn.execute(
            "SELECT count(*) AS hits,"
            " EXTRACT(EPOCH FROM (min(hit_at) + make_interval(secs => %s) - now())) AS retry_after"
            " FROM rate_limit_hits WHERE bucket = %s",
            (window_seconds, key),
        ).fetchone()

        if row["hits"] >= limit:
            # Reject before inserting, so a throttled request doesn't extend the window.
            retry_after = max(1, int(row["retry_after"] or 0))
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please wait a moment and try again.",
                headers={"Retry-After": str(retry_after)},
            )

        conn.execute("INSERT INTO rate_limit_hits (bucket) VALUES (%s)", (key,))


def client_key(request: Request, prefix: str) -> str:
    """Identify the caller by IP. Behind a proxy this needs the forwarded header,
    which means trusting the proxy — so it is only read when one is present."""
    forwarded = request.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0].strip() if forwarded else (
        request.client.host if request.client else "unknown"
    )
    return f"{prefix}:{ip}"


def reset() -> None:
    """Test hook — clear all recorded hits and the process sweep timer."""
    global _last_sweep
    with _sweep_lock:
        _last_sweep = 0.0
    with get_connection() as conn:
        conn.execute("DELETE FROM rate_limit_hits")
