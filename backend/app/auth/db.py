from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.config import get_settings

# Schema is idempotent DDL (no migration files): every statement is safe to re-run at
# startup, and columns added after a database already exists are ADDed IF NOT EXISTS.
_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
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

-- Columns added after the tables first shipped. ADD COLUMN IF NOT EXISTS is a no-op
-- on a database that already has them, and creates them on one that predates them.
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
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
