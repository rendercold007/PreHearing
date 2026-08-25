import json

from app.auth.db import get_connection
from app.models.schemas import CaseAnalysis, CaseUnderstanding

TITLE_MAX = 120


def build_title(understanding: CaseUnderstanding, filenames: list[str]) -> str:
    """A human-readable label for the case-history list.

    Prefers the parties ("Sharma v. State"), falls back to the uploaded filenames.
    """
    names = [party.name.strip() for party in understanding.parties[:2] if party.name.strip()]
    if len(names) == 2:
        subject = " v. ".join(names)
    elif names:
        subject = names[0]
    else:
        subject = ", ".join(filenames) or "Untitled case"

    case_type = understanding.case_type.strip()
    title = f"{subject} — {case_type}" if case_type else subject
    return title[:TITLE_MAX].strip()


def save_case(user_id: int, analysis: CaseAnalysis, filenames: list[str]) -> int:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO cases (user_id, title, filenames, warning_count, analysis)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                user_id,
                build_title(analysis.understanding, filenames),
                json.dumps(filenames),
                len(analysis.warnings),
                analysis.model_dump_json(),
            ),
        )
    return cursor.lastrowid


def _summary(row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "filenames": json.loads(row["filenames"]),
        "warning_count": row["warning_count"],
        "created_at": row["created_at"],
    }


def list_cases(user_id: int) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, title, filenames, warning_count, created_at
            FROM cases WHERE user_id = ? ORDER BY id DESC
            """,
            (user_id,),
        ).fetchall()
    return [_summary(row) for row in rows]


def get_case(user_id: int, case_id: int) -> dict | None:
    """Scoped by user_id so one account can never read another's case."""
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT id, title, filenames, warning_count, created_at, analysis
            FROM cases WHERE id = ? AND user_id = ?
            """,
            (case_id, user_id),
        ).fetchone()

    if row is None:
        return None
    return _summary(row) | {"analysis": CaseAnalysis.model_validate_json(row["analysis"])}


def delete_case(user_id: int, case_id: int) -> bool:
    with get_connection() as conn:
        cursor = conn.execute(
            "DELETE FROM cases WHERE id = ? AND user_id = ?", (case_id, user_id)
        )
    return cursor.rowcount > 0
