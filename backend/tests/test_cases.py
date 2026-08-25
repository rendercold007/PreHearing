import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.auth.routes import CurrentUser, get_current_user
from app.cases import routes as case_routes
from app.cases.store import build_title, save_case
from app.models.schemas import (
    Argument,
    CaseAnalysis,
    CaseUnderstanding,
    Issue,
    Party,
)


def make_analysis(summary: str = "A case.", warnings: list[str] | None = None) -> CaseAnalysis:
    return CaseAnalysis(
        understanding=CaseUnderstanding(
            case_type="civil suit",
            parties=[Party(name="Sharma", role="plaintiff"), Party(name="State", role="defendant")],
            key_facts=[],
            claims=[],
            disputed_points=[],
            summary=summary,
        ),
        issues=[Issue(statement="An issue", issue_type="legal")],
        arguments=[Argument(point="A point")],
        stress_test=[],
        warnings=warnings or [],
    )


@pytest.fixture
def client_for():
    def build(current_user_id: int) -> TestClient:
        app = FastAPI()
        app.include_router(case_routes.router, prefix="/api")
        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            id=current_user_id, email="test@example.com", token="tok"
        )
        return TestClient(app)

    return build


def test_build_title_prefers_parties():
    analysis = make_analysis()
    assert build_title(analysis.understanding, ["case.pdf"]) == "Sharma v. State — civil suit"


def test_build_title_falls_back_to_filenames():
    understanding = CaseUnderstanding(
        case_type="", parties=[], key_facts=[], claims=[], disputed_points=[], summary=""
    )
    assert build_title(understanding, ["case.pdf", "exhibit.docx"]) == "case.pdf, exhibit.docx"


def test_saved_case_is_listed_and_readable_in_full(client_for, user_id):
    case_id = save_case(user_id, make_analysis(summary="Contract dispute."), ["case.pdf"])
    client = client_for(user_id)

    listing = client.get("/api/cases")
    assert listing.status_code == 200
    assert listing.json() == [
        {
            "id": case_id,
            "title": "Sharma v. State — civil suit",
            "filenames": ["case.pdf"],
            "warning_count": 0,
            "created_at": listing.json()[0]["created_at"],
        }
    ]

    detail = client.get(f"/api/cases/{case_id}")
    assert detail.status_code == 200
    body = detail.json()
    assert body["analysis"]["understanding"]["summary"] == "Contract dispute."
    assert body["analysis"]["arguments"][0]["point"] == "A point"


def test_listing_is_newest_first_and_counts_warnings(client_for, user_id):
    save_case(user_id, make_analysis(summary="First."), ["a.pdf"])
    save_case(user_id, make_analysis(summary="Second.", warnings=["x", "y"]), ["b.pdf"])

    rows = client_for(user_id).get("/api/cases").json()
    assert [row["filenames"] for row in rows] == [["b.pdf"], ["a.pdf"]]
    assert rows[0]["warning_count"] == 2


def test_cases_are_scoped_to_their_owner(client_for, user_id, other_user_id):
    case_id = save_case(user_id, make_analysis(), ["case.pdf"])
    intruder = client_for(other_user_id)

    assert intruder.get("/api/cases").json() == []
    assert intruder.get(f"/api/cases/{case_id}").status_code == 404
    assert intruder.delete(f"/api/cases/{case_id}").status_code == 404
    # Still there for its owner.
    assert client_for(user_id).get(f"/api/cases/{case_id}").status_code == 200


def test_delete_removes_the_case(client_for, user_id):
    case_id = save_case(user_id, make_analysis(), ["case.pdf"])
    client = client_for(user_id)

    assert client.delete(f"/api/cases/{case_id}").status_code == 204
    assert client.get(f"/api/cases/{case_id}").status_code == 404
    assert client.get("/api/cases").json() == []


def test_case_saved_before_adverse_research_existed_still_loads(client_for, user_id):
    """Cases stored as JSON blobs predate the adverse_research field. The model default
    has to fill it in, and the response has to carry the key so the frontend can rely
    on it without a guard."""
    import json

    from app.auth import db

    analysis_json = json.loads(make_analysis().model_dump_json())
    del analysis_json["adverse_research"]
    with db.get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO cases (user_id, title, filenames, warning_count, analysis) "
            "VALUES (?, 'Old case', '[\"case.pdf\"]', 0, ?)",
            (user_id, json.dumps(analysis_json)),
        )
        case_id = cursor.lastrowid

    body = client_for(user_id).get(f"/api/cases/{case_id}").json()
    assert body["analysis"]["adverse_research"] == []


def test_missing_case_is_404(client_for, user_id):
    assert client_for(user_id).get("/api/cases/999").status_code == 404
