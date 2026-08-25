from app.arguments import generator
from app.ingest.parser import DocumentChunk
from app.models.schemas import (
    Authority,
    CaseUnderstanding,
    Citation,
    CitedFact,
    Issue,
    IssueResearch,
)
from app.understand import extractor


def make_chunks() -> list[DocumentChunk]:
    return [
        DocumentChunk("plaint.pdf", "page 1", "Plaint text"),
        DocumentChunk("reply.docx", "paragraph 4", "Reply text"),
    ]


def base_understanding_result(key_facts) -> dict:
    return {
        "case_type": "civil",
        "parties": [],
        "key_facts": key_facts,
        "claims": [],
        "disputed_points": [],
        "summary": "A case.",
    }


def fake_extract_llm(monkeypatch, key_facts):
    monkeypatch.setattr(
        extractor,
        "complete_json",
        lambda **kwargs: base_understanding_result(key_facts),
    )


def test_extractor_resolves_chunk_citations(monkeypatch):
    fake_extract_llm(monkeypatch, [{"text": "Contract signed in 2019.", "chunks": [2, 1]}])
    understanding = extractor.extract_understanding(make_chunks(), "test/mid")
    fact = understanding.key_facts[0]
    assert fact.text == "Contract signed in 2019."
    assert [(c.source_document, c.location) for c in fact.citations] == [
        ("reply.docx", "paragraph 4"),
        ("plaint.pdf", "page 1"),
    ]


def test_extractor_drops_invalid_chunk_indices(monkeypatch):
    fake_extract_llm(
        monkeypatch,
        [{"text": "A fact.", "chunks": [0, 99, "2", 1, 1]}],
    )
    understanding = extractor.extract_understanding(make_chunks(), "test/mid")
    fact = understanding.key_facts[0]
    assert [(c.source_document, c.location) for c in fact.citations] == [
        ("plaint.pdf", "page 1")
    ]


def test_extractor_tolerates_plain_string_facts(monkeypatch):
    fake_extract_llm(monkeypatch, ["Just a string fact.", "", {"chunks": [1]}, 42])
    understanding = extractor.extract_understanding(make_chunks(), "test/mid")
    assert [f.text for f in understanding.key_facts] == ["Just a string fact."]
    assert understanding.key_facts[0].citations == []


def make_understanding() -> CaseUnderstanding:
    return CaseUnderstanding(
        case_type="civil",
        parties=[],
        key_facts=[
            CitedFact(
                text="Contract signed in 2019.",
                citations=[Citation(source_document="plaint.pdf", location="page 1")],
            ),
            CitedFact(text="Payment stopped in 2021."),
        ],
        claims=[],
        disputed_points=[],
        summary="A case.",
    )


def fake_generator_llm(monkeypatch, arguments):
    monkeypatch.setattr(
        generator, "complete_json", lambda **kwargs: {"arguments": arguments}
    )


def make_research() -> list[IssueResearch]:
    shared = Authority(doc_id="100", title="Shared v. Case", url="https://indiankanoon.org/doc/100/")
    return [
        IssueResearch(
            issue_statement="Validity",
            queries=["q"],
            authorities=[
                shared,
                Authority(doc_id="200", title="Other v. Case", url="https://indiankanoon.org/doc/200/"),
            ],
        ),
        IssueResearch(issue_statement="Damages", queries=["q"], authorities=[shared]),
    ]


def test_generator_resolves_fact_indices(monkeypatch):
    fake_generator_llm(monkeypatch, [{"point": "The contract is valid.", "supporting_facts": [1]}])
    arguments = generator.generate_arguments(
        make_understanding(), [Issue(statement="Validity", issue_type="legal")], [], "test/strong"
    )
    fact = arguments[0].supporting_facts[0]
    assert fact.text == "Contract signed in 2019."
    assert fact.citations[0].source_document == "plaint.pdf"


def test_generator_drops_invalid_indices_keeps_strings(monkeypatch):
    fake_generator_llm(
        monkeypatch,
        [{"point": "A point.", "supporting_facts": [0, 99, 2, "A stray fact.", None]}],
    )
    arguments = generator.generate_arguments(make_understanding(), [], [], "test/strong")
    facts = arguments[0].supporting_facts
    assert [f.text for f in facts] == ["Payment stopped in 2021.", "A stray fact."]
    assert facts[1].citations == []


def test_generator_resolves_authority_numbers(monkeypatch):
    # authorities flatten to [100, 200] deduped across issues
    fake_generator_llm(
        monkeypatch,
        [{"point": "A point.", "supporting_facts": [], "authorities": [2, 99, 0, "1", 2]}],
    )
    arguments = generator.generate_arguments(
        make_understanding(), [], make_research(), "test/strong"
    )
    assert [a.doc_id for a in arguments[0].authorities] == ["200"]


def test_stress_test_attaches_adverse_authorities(monkeypatch):
    from app.stresstest import tester

    monkeypatch.setattr(
        tester,
        "complete_json",
        lambda **kwargs: {
            "stress_test_points": [
                {
                    "category": "adverse consideration",
                    "point": "They will rely on precedent.",
                    "authorities": [1, 99],
                    "suggested_response": None,
                }
            ]
        },
    )
    points = tester.stress_test(
        make_understanding(), [], [], make_research(), "test/strong"
    )
    assert [a.doc_id for a in points[0].authorities] == ["100"]


def test_generator_no_research_means_no_authorities(monkeypatch):
    fake_generator_llm(
        monkeypatch, [{"point": "A point.", "supporting_facts": [], "authorities": [1]}]
    )
    arguments = generator.generate_arguments(make_understanding(), [], [], "test/strong")
    assert arguments[0].authorities == []
