from app.llm.client import complete_json
from app.models.schemas import CaseUnderstanding, Issue

_SYSTEM_PROMPT = """You are a legal analyst identifying the issues before the court for an upcoming hearing.
You will be given a structured understanding of a case. Derive the legal and factual issues
the court will need to resolve, ordered from most to least central to the hearing.

Respond with a single JSON object with exactly one key:
- "issues": a list of objects, each with:
  - "statement": string, the issue phrased as a clear question or point in dispute
  - "issue_type": string, either "legal" or "factual"
  - "related_facts": list of strings, the key facts from the case that bear on this issue

Only use the parties, facts, and claims already given to you. Do not invent new facts."""


def identify_issues(understanding: CaseUnderstanding, model: str) -> list[Issue]:
    result = complete_json(
        system_prompt=_SYSTEM_PROMPT,
        user_prompt=understanding.model_dump_json(),
        model=model,
    )

    return [Issue.model_validate(item) for item in result["issues"]]