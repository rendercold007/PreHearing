from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.config import get_settings

# Schema is idempotent DDL (no migration files): every statement is safe to re-run at
# startup, and columns added after a database already exists are ADDed IF NOT EXISTS.
_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    name TEXT NOT NULL DEFAULT '',
    google_sub TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS cases (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    filenames TEXT NOT NULL,
    warning_count INTEGER NOT NULL DEFAULT 0,
    analysis TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cases_user ON cases(user_id, id DESC);

-- Sliding-window rate limiter: one row per request hit. Shared across workers so the
-- configured allowance is enforced once, not once per process. Pruned per-bucket on
-- each check and swept globally on a timer (see auth/ratelimit.py).
CREATE TABLE IF NOT EXISTS rate_limit_hits (
    bucket TEXT NOT NULL,
    hit_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_bucket ON rate_limit_hits(bucket, hit_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_hit_at ON rate_limit_hits(hit_at);

-- Password-reset tokens. Only a SHA-256 hash of the token is stored (the raw token
-- lives only in the emailed link), single-use (used_at) and expiring (expires_at).
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS subscriptions (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'inactive',
    razorpay_subscription_id TEXT,
    razorpay_customer_id TEXT,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_rzp
    ON subscriptions(razorpay_subscription_id)
    WHERE razorpay_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS usage_counters (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, period)
);    

CREATE TABLE IF NOT EXISTS billing_webhook_events(
    event_id TEXT PRIMARY KEY,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Columns added after the tables first shipped. ADD COLUMN IF NOT EXISTS is a no-op
-- on a database that already has them, and creates them on one that predates them.
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT;
-- Google-only accounts have no password. Drop the old NOT NULL (no-op if already gone).
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
-- google_sub is the stable Google user id; unique among the accounts that have one.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub
    ON users(google_sub) WHERE google_sub IS NOT NULL;
"""

_pool: ConnectionPool | None = None


def get_pool() -> ConnectionPool:
    """The process-wide connection pool, opened lazily against the configured DSN.

    Pooling is what makes Postgres safe under multiple workers and concurrent requests:
    connections are reused rather than opened per request, and returned to the pool on
    context exit — which also closes the connection-leak the old sqlite3 code had.
    """
    global _pool
    if _pool is None:
        _pool = ConnectionPool(
            get_settings().database_url,
            kwargs={"row_factory": dict_row},
            open=True,
        )
    return _pool


def get_connection():
    """A pooled connection as a context manager.

    `with get_connection() as conn:` yields a connection wrapped in a transaction —
    it commits on a clean exit, rolls back on an exception, and returns the connection
    to the pool either way. Same call shape as the old sqlite3 helper.
    """
    return get_pool().connection()


def init_db() -> None:
    with get_connection() as conn:
        # No parameters, so psycopg runs the whole multi-statement script in one call.
        conn.execute(_SCHEMA)


def reset_pool() -> None:
    """Close and drop the pool so the next get_pool() rebuilds it against the current
    DSN. Used at shutdown and by the test suite to re-point the pool per test."""
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None
