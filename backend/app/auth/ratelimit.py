"""A small in-process sliding-window rate limiter.

Deliberately dependency-free and deliberately simple. The important caveat: the
window state lives in this process, so with more than one uvicorn worker each
worker enforces its own allowance. That makes this a real mitigation for a
single-process deployment and a placeholder for a shared store (Redis, or a table)
if this ever scales out.
"""

import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

_hits: dict[str, deque[float]] = defaultdict(deque)
_lock = threading.Lock()


def check_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    """Record one hit for `key`, raising 429 if it exceeds `limit` in the window."""
    now = time.monotonic()
    cutoff = now - window_seconds

    with _lock:
        hits = _hits[key]
        while hits and hits[0] < cutoff:
            hits.popleft()

        if len(hits) >= limit:
            retry_after = max(1, int(hits[0] + window_seconds - now))
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please wait a moment and try again.",
                headers={"Retry-After": str(retry_after)},
            )

        hits.append(now)


def client_key(request: Request, prefix: str) -> str:
    """Identify the caller by IP. Behind a proxy this needs the forwarded header,
    which means trusting the proxy — so it is only read when one is present."""
    forwarded = request.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0].strip() if forwarded else (
        request.client.host if request.client else "unknown"
    )
    return f"{prefix}:{ip}"


def reset() -> None:
    """Test hook — the window is process-global, so it has to be clearable."""
    with _lock:
        _hits.clear()
