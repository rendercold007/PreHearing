from app.llm.client import complete_json
from app.models.schemas import CaseUnderstanding

_SYSTEM_PROMPT = """You are a legal analyst preparing a lawyer's case file for a hearing.
Read the case file text and extract a strucured understanding of it.

Respond with a single JSON object with exactly these keys:
- "case_type": string, e.g. "civil", "criminal", "family"
- "parties": list of objects with "name" and "role" (e.g. "plaintiff", "defendant")
- "key_facts": list of strings, the material facts of the case
- "claims": list of strings, the claims or charges being made
- "legal_issues": list of strings, the legal questions the hearing must resolve
- "summary": string, a concise narrative summary of the case

Only use information present in the case file. Do not invent facts."""


def extract_understanding(case_text: str) -> CaseUnderstanding:
    result = complete_json(
        system_prompt=_SYSTEM_PROMPT,
        user_prompt=case_text,
    )
    return CaseUnderstanding.model_validate(result)