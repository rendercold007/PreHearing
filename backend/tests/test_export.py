import io

import pytest
from docx import Document
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.auth.routes import CurrentUser, get_current_user
from app.cases import routes as case_routes
from app.cases.store import save_case
from app.export.docx_builder import build_hearing_pack, export_filename
from app.export.pdf_builder import build_hearing_pack_pdf, export_filename_pdf
from app.models.schemas import (
    Argument,
    Authority,
    CaseAnalysis,
    CaseUnderstanding,
    ChecklistItem,
    Citation,
    CitedFact,
    HearingPrep,
    Issue,
    OutlinePoint,
)

ANALYSIS = CaseAnalysis(
    understanding=CaseUnderstanding(
        case_type="civil suit",
        parties=[],
        key_facts=[],
        claims=[],
        disputed_points=[],
        summary="A dispute over a lease.",
    ),
    issues=[Issue(statement="Was the notice valid?", issue_type="legal")],
    arguments=[
        Argument(
            point="The notice was validly served.",
            supporting_facts=[
                CitedFact(
                    text="The notice was couriered on 3 March.",
                    citations=[Citation(source_document="notice.pdf", location="page 2")],
                )
            ],
            authorities=[
                Authority(
                    doc_id="1",
                    title="Sharma v. State",
                    court="Supreme Court",
                    date="2019",
                    url="https://indiankanoon.org/doc/1/",
                )
            ],
            legal_basis="Section 106, Transfer of Property Act",
            counter_argument="Service was never acknowledged.",
            rebuttal="The courier receipt shows delivery.",
        )
    ],
    stress_test=[],
    hearing_prep=HearingPrep(
        brief="The lease was validly terminated.",
        outline=[OutlinePoint(heading="Open on validity", talking_points=["Start with the notice"])],
        checklist=[ChecklistItem(category="documents", item="Carry the courier receipt")],
    ),
)


def text_of(content: bytes) -> str:
    document = Document(io.BytesIO(content))
    return "\n".join(paragraph.text for paragraph in document.paragraphs)


def test_pack_contains_brief_outline_arguments_citations_and_checklist():
    body = text_of(build_hearing_pack("Lease dispute", ANALYSIS))

    assert "Lease dispute" in body
    assert "AI-GENERATED" in body
    assert "The lease was validly terminated." in body
    assert "Open on validity" in body and "Start with the notice" in body
    assert "1. The notice was validly served." in body
    assert "notice.pdf, page 2" in body  # citation travels with the fact
    assert "Sharma v. State" in body and "https://indiankanoon.org/doc/1/" in body
    assert "Anticipated counter-argument: Service was never acknowledged." in body
    assert "Carry the courier receipt" in body


def test_pack_survives_a_missing_prepare_stage():
    analysis = ANALYSIS.model_copy(update={"hearing_prep": None})
    body = text_of(build_hearing_pack("Lease dispute", analysis))

    assert "The Prepare pack could not be generated." in body
    assert "The notice was validly served." in body  # arguments still export


def test_run_warnings_are_carried_into_the_document():
    analysis = ANALYSIS.model_copy(update={"warnings": ["Research failed and was skipped."]})
    assert "Research failed and was skipped." in text_of(build_hearing_pack("Case", analysis))


@pytest.mark.parametrize(
    ("title", "expected"),
    [
        ("Sharma v. State — civil suit", "sharma-v-state-civil-suit.docx"),
        ("!!!", "hearing-pack.docx"),
    ],
)
def test_export_filename_is_slugified(title, expected):
    assert export_filename(title) == expected


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


def test_export_endpoint_returns_a_word_document(client_for, user_id):
    case_id = save_case(user_id, ANALYSIS, ["lease.pdf"])
    response = client_for(user_id).get(f"/api/cases/{case_id}/export.docx")

    assert response.status_code == 200
    assert response.headers["content-type"] == case_routes.DOCX_MEDIA_TYPE
    assert "attachment; filename=" in response.headers["content-disposition"]
    assert response.content[:2] == b"PK"  # a .docx is a zip
    assert "The lease was validly terminated." in text_of(response.content)


def test_export_is_scoped_to_the_owner(client_for, user_id, other_user_id):
    case_id = save_case(user_id, ANALYSIS, ["lease.pdf"])
    assert client_for(other_user_id).get(f"/api/cases/{case_id}/export.docx").status_code == 404


# --- PDF export ---------------------------------------------------------------


def test_pdf_pack_renders_for_a_full_analysis():
    content = build_hearing_pack_pdf("Lease dispute", ANALYSIS)
    assert content[:5] == b"%PDF-"
    assert len(content) > 1000  # non-trivial rendered document


def test_pdf_pack_survives_a_missing_prepare_stage():
    analysis = ANALYSIS.model_copy(update={"hearing_prep": None})
    content = build_hearing_pack_pdf("Lease dispute", analysis)
    assert content[:5] == b"%PDF-"


@pytest.mark.parametrize(
    ("title", "expected"),
    [
        ("Sharma v. State — civil suit", "sharma-v-state-civil-suit.pdf"),
        ("!!!", "hearing-pack.pdf"),
    ],
)
def test_pdf_export_filename_is_slugified(title, expected):
    assert export_filename_pdf(title) == expected


def test_pdf_export_endpoint_returns_a_pdf(client_for, user_id):
    case_id = save_case(user_id, ANALYSIS, ["lease.pdf"])
    response = client_for(user_id).get(f"/api/cases/{case_id}/export.pdf")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment; filename=" in response.headers["content-disposition"]
    assert response.headers["content-disposition"].endswith('.pdf"')
    assert response.content[:5] == b"%PDF-"


def test_pdf_export_is_scoped_to_the_owner(client_for, user_id, other_user_id):
    case_id = save_case(user_id, ANALYSIS, ["lease.pdf"])
    assert client_for(other_user_id).get(f"/api/cases/{case_id}/export.pdf").status_code == 404
