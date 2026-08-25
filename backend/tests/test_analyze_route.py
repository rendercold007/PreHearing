import json

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api import routes
from app.auth.routes import CurrentUser, get_current_user
from app.cases.store import get_case, list_cases
from app.ingest.parser import DocumentChunk
from app.models.schemas import (
    Argument,
    CaseUnderstanding,
    HearingPrep,
    Issue,
    StressTestPoint,
)

UNDERSTANDING = CaseUnderstanding(
    case_type="civil", parties=[], key_facts=[], claims=[], disputed_points=[], summary="A case."
)
ISSUES = [Issue(statement="An issue", issue_type="legal")]
ARGUMENTS = [Argument(point="A point")]
STRESS = [StressTestPoint(category="weakness", point="A weakness")]
PREP = HearingPrep(brief="Brief", outline=[], checklist=[])


@pytest.fixture
def client(monkeypatch, user_id):
    app = FastAPI()
    app.include_router(routes.router, prefix="/api")
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=user_id, email="test@example.com", token="tok"
    )

    monkeypatch.setattr(
        routes,
        "parse_documents",
        lambda files: [DocumentChunk("case.pdf", "page 1", "Some case text")],
    )
    monkeypatch.setattr(routes, "extract_understanding", lambda chunks, model: UNDERSTANDING)
    monkeypatch.setattr(routes, "identify_issues", lambda u, model: ISSUES)
    monkeypatch.setattr(routes, "generate_arguments", lambda u, i, r, model: ARGUMENTS)
    monkeypatch.setattr(routes, "stress_test", lambda u, i, a, r, model: STRESS)
    monkeypatch.setattr(routes, "assemble_hearing_prep", lambda u, i, a, s, model: PREP)
    monkeypatch.setattr(routes, "research_issues", lambda i, model, adverse=False: [])

    return TestClient(app)


def post_file(client):
    return client.post(
        "/api/analyze", files={"files": ("case.pdf", b"%PDF-fake", "application/pdf")}
    )


def events_of(response):
    return [json.loads(line) for line in response.text.splitlines() if line.strip()]


def result_of(response):
    results = [e for e in events_of(response) if e["type"] == "result"]
    assert len(results) == 1, "expected exactly one result event"
    return results[0]["analysis"]


def test_full_success_streams_stages_then_result(client):
    response = post_file(client)
    assert response.status_code == 200
    events = events_of(response)

    stage_events = [(e["stage"], e["status"]) for e in events if e["type"] == "stage"]
    for stage in ("understanding", "issues", "research", "adverse_research",
                  "arguments", "stress_test", "prepare"):
        assert (stage, "started") in stage_events
        assert (stage, "done") in stage_events

    assert events[-1]["type"] == "result"
    analysis = events[-1]["analysis"]
    assert analysis["warnings"] == []
    assert analysis["hearing_prep"]["brief"] == "Brief"


def test_successful_run_is_saved_to_case_history(client, user_id):
    response = post_file(client)
    case_id = [e for e in events_of(response) if e["type"] == "result"][0]["case_id"]

    saved = list_cases(user_id)
    assert [row["id"] for row in saved] == [case_id]
    assert saved[0]["filenames"] == ["case.pdf"]
    assert get_case(user_id, case_id)["analysis"].understanding.summary == "A case."


def test_save_failure_warns_instead_of_losing_the_analysis(client, monkeypatch):
    def boom(user_id, analysis, filenames):
        raise RuntimeError("disk on fire")

    monkeypatch.setattr(routes, "save_case", boom)
    response = post_file(client)
    analysis = result_of(response)

    assert analysis["hearing_prep"]["brief"] == "Brief"  # the run itself survives
    assert "case history" in analysis["warnings"][0]


def test_failed_stage_degrades_instead_of_500(client, monkeypatch):
    def boom(u, i, a, r, model):
        raise RuntimeError("model returned garbage")

    monkeypatch.setattr(routes, "stress_test", boom)
    response = post_file(client)
    assert response.status_code == 200
    analysis = result_of(response)
    assert analysis["stress_test"] == []
    assert len(analysis["warnings"]) == 1
    assert "Stress Test" in analysis["warnings"][0]
    assert analysis["arguments"] != []  # other stages unaffected
    assert analysis["hearing_prep"] is not None


def test_failed_prep_returns_null(client, monkeypatch):
    def boom(u, i, a, s, model):
        raise RuntimeError("boom")

    monkeypatch.setattr(routes, "assemble_hearing_prep", boom)
    response = post_file(client)
    assert response.status_code == 200
    assert result_of(response)["hearing_prep"] is None


def test_failed_understanding_streams_error(client, monkeypatch):
    def boom(chunks, model):
        raise RuntimeError("boom")

    monkeypatch.setattr(routes, "extract_understanding", boom)
    response = post_file(client)
    assert response.status_code == 200
    events = events_of(response)
    assert events[-1]["type"] == "error"
    assert not any(e["type"] == "result" for e in events)


def test_no_extractable_text_is_400(client, monkeypatch):
    monkeypatch.setattr(routes, "parse_documents", lambda files: [])
    assert post_file(client).status_code == 400
