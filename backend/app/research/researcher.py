from app.config import get_settings
from app.llm.client import complete_json
from app.models.schemas import Authority, Issue, IssueResearch
from app.research.kanoon import search_kanoon

QUERY_SYSTEM_PROMPT = """You are a legal research assistant for Indian courts.
Given one issue from a case, produce short keyword search queries for the Indian Kanoon
case-law search engine. Use legal terms of art , statute names, and doctrine names - not
full sentences. Search legal concept only: never include case-specific details such as 
dates, party names, place names, or monetary amounts, and never put quotation marks
aorund query terms. Respond as JSON: {"queries": ["...", "..."]}"""

RERANK_SYSTEM_PROMPT = """You are a legal research assistant. You are given an issue and a
numbered list of search results (title, court, snippet). Select up to 3 results that are 
genuinely useful authorities for arguing this issue, and for each explain in one sentence
why it is relevant. Respond as JSON:
{"selected": [{"index": 1, "relevance": "..."}]}
Only use index numbers from the list. If nothing is relevant, return {"selected": []}."""

def _generate_queries(issue: Issue, model: str) -> list[str]:
    result = complete_json(QUERY_SYSTEM_PROMPT, f"Issue: {issue.statement}", model)
    queries = [q.strip() for q in result.get("queries", []) if isinstance(q, str) and q.strip()]
    return queries[:2]


def _rerank(issue: Issue, hits: list[Authority], model: str):
    if not hits:
        return []
    listing = "\n".join(
        f"{i + 1}. {hit.title} ({hit.court}, {hit.date})\n {hit.snippet}"
        for i, hit in enumerate(hits)
    )
    result = complete_json(
        RERANK_SYSTEM_PROMPT, f"Issue: {issue.statement}\n\nResults:\n{listing}", model
    )

    selected: list[Authority] = []
    for item in result.get("selected", [])[:3]:
        index = item.get("index")
        if isinstance(index, int) and 1 <= index <= len(hits):
            hit = hits[index-1]
            hit.relevance = str(item.get("relevance", ""))
            selected.append(hit)
    return selected        
    

def research_issues(issues: list[Issue], model: str) -> list[IssueResearch]:
    token = get_settings().indiankanoon_api_token
    if not token:
        return []

    results: list[IssueResearch] = []
    for issue in issues[:5]:
        queries = _generate_queries(issue, model)
        hits_by_id: dict[str, Authority] = {}
        for query in queries:
            for hit in search_kanoon(query, token):
                hits_by_id.setdefault(hit.doc_id, hit)
        results.append(
            IssueResearch(
                issue_statement=issue.statement,
                queries=queries,
                authorities=_rerank(issue, list(hits_by_id.values()), model),
            )
        )
    return results    