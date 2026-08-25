from app.models.schemas import Authority, Issue
from app.research import researcher
from app.research.researcher import (
    ADVERSE_QUERY_SYSTEM_PROMPT,
    ADVERSE_RERANK_SYSTEM_PROMPT,
    QUERY_SYSTEM_PROMPT,
    RERANK_SYSTEM_PROMPT,
    _generate_queries,
    _rerank,
    research_issues,
)


def make_issue() -> Issue:
    return Issue(statement="Whether the contract was validly terminated", issue_type="legal")


def make_hits(n: int) -> list[Authority]:
    return [
        Authority(doc_id=str(i), title=f"Case {i}", url=f"https://indiankanoon.org/doc/{i}/")
        for i in range(1, n + 1)
    ]


def fake_llm(monkeypatch, result: dict):
    monkeypatch.setattr(researcher, "complete_json", lambda *args, **kwargs: result)


def test_rerank_selects_and_attaches_relevance(monkeypatch):
    fake_llm(monkeypatch, {"selected": [{"index": 2, "relevance": "on point"}]})
    selected = _rerank(make_issue(), make_hits(3), "test/mid", RERANK_SYSTEM_PROMPT)
    assert [a.doc_id for a in selected] == ["2"]
    assert selected[0].relevance == "on point"


def test_rerank_ignores_out_of_range_indices(monkeypatch):
    fake_llm(
        monkeypatch,
        {
            "selected": [
                {"index": 0, "relevance": "x"},
                {"index": 99, "relevance": "x"},
                {"index": -1, "relevance": "x"},
                {"index": 1, "relevance": "good"},
            ]
        },
    )
    selected = _rerank(make_issue(), make_hits(2), "test/mid", RERANK_SYSTEM_PROMPT)
    assert [a.doc_id for a in selected] == ["1"]


def test_rerank_ignores_non_int_indices(monkeypatch):
    fake_llm(monkeypatch, {"selected": [{"index": "1", "relevance": "x"}, {"relevance": "x"}]})
    assert _rerank(make_issue(), make_hits(2), "test/mid", RERANK_SYSTEM_PROMPT) == []


def test_rerank_caps_at_three(monkeypatch):
    fake_llm(monkeypatch, {"selected": [{"index": i, "relevance": "x"} for i in range(1, 6)]})
    assert len(_rerank(make_issue(), make_hits(5), "test/mid", RERANK_SYSTEM_PROMPT)) == 3


def test_rerank_empty_hits_skips_llm(monkeypatch):
    def boom(*args, **kwargs):
        raise AssertionError("LLM should not be called with no hits")

    monkeypatch.setattr(researcher, "complete_json", boom)
    assert _rerank(make_issue(), [], "test/mid", RERANK_SYSTEM_PROMPT) == []


def test_generate_queries_batch_validates_and_caps(monkeypatch):
    fake_llm(
        monkeypatch,
        {
            "issues": [
                {"index": 1, "queries": ["  breach of contract ", "", 42, "specific relief", "extra"]},
                {"index": 99, "queries": ["out of range"]},
                {"index": "2", "queries": ["non-int index"]},
                "not a dict",
            ]
        },
    )
    issues = [make_issue(), Issue(statement="Damages", issue_type="factual")]
    assert _generate_queries(issues, "test/cheap", QUERY_SYSTEM_PROMPT) == {
        1: ["breach of contract", "specific relief"]
    }


def test_research_issues_adverse_uses_flipped_prompts(monkeypatch):
    monkeypatch.setenv("INDIANKANOON_API_TOKEN", "test-token")
    researcher.get_settings.cache_clear()

    seen_prompts: list[str] = []

    def capture(system_prompt, user_prompt, model):
        seen_prompts.append(system_prompt)
        if "queries" in system_prompt:
            return {"issues": [{"index": 1, "queries": ["adverse query"]}]}
        return {"selected": [{"index": 1, "relevance": "against us"}]}

    monkeypatch.setattr(researcher, "complete_json", capture)
    monkeypatch.setattr(researcher, "search_kanoon", lambda query, token: make_hits(1))

    results = research_issues([make_issue()], "test/cheap", adverse=True)
    assert seen_prompts == [ADVERSE_QUERY_SYSTEM_PROMPT, ADVERSE_RERANK_SYSTEM_PROMPT]
    assert results[0].authorities[0].relevance == "against us"


def test_research_issues_runs_issues_in_parallel_and_skips_failures(monkeypatch):
    monkeypatch.setenv("INDIANKANOON_API_TOKEN", "test-token")
    researcher.get_settings.cache_clear()

    def fake_complete(system_prompt, user_prompt, model):
        if "queries" in system_prompt:
            return {"issues": [{"index": 1, "queries": ["q1"]}, {"index": 2, "queries": ["q2"]}]}
        return {"selected": [{"index": 1, "relevance": "ok"}]}

    def fake_search(query, token):
        if query == "q1":
            raise RuntimeError("kanoon down for this query")
        return make_hits(1)

    monkeypatch.setattr(researcher, "complete_json", fake_complete)
    monkeypatch.setattr(researcher, "search_kanoon", fake_search)

    issues = [make_issue(), Issue(statement="Damages", issue_type="factual")]
    results = research_issues(issues, "test/cheap")
    assert [r.issue_statement for r in results] == ["Damages"]
    assert results[0].authorities[0].relevance == "ok"
