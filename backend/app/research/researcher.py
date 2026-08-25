from concurrent.futures import ThreadPoolExecutor

from app.config import get_settings
from app.llm.client import complete_json
from app.models.schemas import Authority, Issue, IssueResearch
from app.research.kanoon import search_kanoon

QUERY_SYSTEM_PROMPT = """You are a legal research assistant for Indian courts.
You are given a numbered list of issues from one case. For each issue, produce up to 2
short keyword search queries for the Indian Kanoon case-law search engine. Use legal
terms of art, statute names, and doctrine names - not full sentences. Search legal
concepts only: never include case-specific details such as dates, party names, place
names, or monetary amounts, and never put quotation marks around query terms.
Respond as JSON:
{"issues": [{"index": 1, "queries": ["...", "..."]}]}
Only use index numbers from the list."""

ADVERSE_QUERY_SYSTEM_PROMPT = """You are opposing counsel's legal researcher for Indian courts.
You are given a numbered list of issues from one case. For each issue, produce up to 2
short keyword search queries for the Indian Kanoon case-law search engine to find
authorities that CUT AGAINST the case being presented - the case law the other side
would cite on that issue. Use legal terms of art, statute names, and doctrine names -
not full sentences. Search legal concepts only: never include case-specific details such
as dates, party names, place names, or monetary amounts, and never put quotation marks
around query terms.
Respond as JSON:
{"issues": [{"index": 1, "queries": ["...", "..."]}]}
Only use index numbers from the list."""

RERANK_SYSTEM_PROMPT = """You are a legal research assistant. You are given an issue and a
numbered list of search results (title, court, snippet). Select up to 3 results that are
genuinely useful authorities for arguing this issue, and for each explain in one sentence
why it is relevant. Respond as JSON:
{"selected": [{"index": 1, "relevance": "..."}]}
Only use index numbers from the list. If nothing is relevant, return {"selected": []}."""

ADVERSE_RERANK_SYSTEM_PROMPT = """You are opposing counsel's legal researcher. You are given
an issue and a numbered list of search results (title, court, snippet). Select up to 3
results that the OPPOSING side could genuinely rely on against this issue, and for each
explain in one sentence how it would be used against the case. Respond as JSON:
{"selected": [{"index": 1, "relevance": "..."}]}
Only use index numbers from the list. If nothing is relevant, return {"selected": []}."""


def flatten_authorities(research: list[IssueResearch]) -> list[Authority]:
    """All authorities across issues, deduplicated by doc_id, order preserved."""
    by_id: dict[str, Authority] = {}
    for item in research:
        for authority in item.authorities:
            by_id.setdefault(authority.doc_id, authority)
    return list(by_id.values())


def select_by_number(raw, pool: list) -> list:
    """Resolve a list of 1-based numbers from the LLM against a server-side pool,
    dropping out-of-range, non-int, and duplicate selections."""
    resolved = []
    seen: set[int] = set()
    for item in raw if isinstance(raw, list) else []:
        if isinstance(item, int) and 1 <= item <= len(pool) and item not in seen:
            seen.add(item)
            resolved.append(pool[item - 1])
    return resolved


def _generate_queries(issues: list[Issue], model: str, system_prompt: str) -> dict[int, list[str]]:
    """One LLM call producing queries for every issue, keyed by 1-based issue number."""
    listing = "\n".join(f"[{i}] {issue.statement}" for i, issue in enumerate(issues, start=1))
    result = complete_json(system_prompt, f"Issues:\n{listing}", model)

    queries_by_issue: dict[int, list[str]] = {}
    raw_issues = result.get("issues")
    for item in raw_issues if isinstance(raw_issues, list) else []:
        if not isinstance(item, dict):
            continue
        index = item.get("index")
        if not (isinstance(index, int) and 1 <= index <= len(issues)):
            continue
        raw_queries = item.get("queries")
        queries = [
            q.strip()
            for q in (raw_queries if isinstance(raw_queries, list) else [])
            if isinstance(q, str) and q.strip()
        ][:2]
        if queries:
            queries_by_issue.setdefault(index, queries)
    return queries_by_issue


def _rerank(issue: Issue, hits: list[Authority], model: str, system_prompt: str):
    if not hits:
        return []
    listing = "\n".join(
        f"{i + 1}. {hit.title} ({hit.court}, {hit.date})\n {hit.snippet}"
        for i, hit in enumerate(hits)
    )
    result = complete_json(
        system_prompt, f"Issue: {issue.statement}\n\nResults:\n{listing}", model
    )

    selected: list[Authority] = []
    for item in result.get("selected", []):
        if len(selected) == 3:
            break
        if not isinstance(item, dict):
            continue
        index = item.get("index")
        if isinstance(index, int) and 1 <= index <= len(hits):
            hit = hits[index - 1]
            hit.relevance = str(item.get("relevance", ""))
            selected.append(hit)
    return selected


def _research_one(
    issue: Issue, queries: list[str], token: str, model: str, rerank_prompt: str
) -> IssueResearch | None:
    try:
        hits_by_id: dict[str, Authority] = {}
        for query in queries:
            for hit in search_kanoon(query, token):
                hits_by_id.setdefault(hit.doc_id, hit)
        return IssueResearch(
            issue_statement=issue.statement,
            queries=queries,
            authorities=_rerank(issue, list(hits_by_id.values()), model, rerank_prompt),
        )
    except Exception:
        return None  # one issue's research failing shouldn't lose the others


def research_issues(issues: list[Issue], model: str, adverse: bool = False) -> list[IssueResearch]:
    token = get_settings().indiankanoon_api_token
    if not token:
        return []

    issues = issues[:5]
    query_prompt = ADVERSE_QUERY_SYSTEM_PROMPT if adverse else QUERY_SYSTEM_PROMPT
    rerank_prompt = ADVERSE_RERANK_SYSTEM_PROMPT if adverse else RERANK_SYSTEM_PROMPT

    queries_by_issue = _generate_queries(issues, model, query_prompt)
    tasks = [
        (issue, queries_by_issue[i])
        for i, issue in enumerate(issues, start=1)
        if i in queries_by_issue
    ]
    if not tasks:
        return []

    with ThreadPoolExecutor(max_workers=len(tasks)) as pool:
        results = list(
            pool.map(
                lambda task: _research_one(task[0], task[1], token, model, rerank_prompt),
                tasks,
            )
        )
    return [result for result in results if result is not None]
