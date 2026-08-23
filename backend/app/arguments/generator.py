import json
from app.llm.client import complete_json
from app.models.schemas import Argument, CaseUnderstanding, Issue

_SYSTEM_PROMPT = """You are a lawyer's assistant preparing arguments for a hearing.
You will be given a structured understanding of a case and the list of issues the court
must resolve, ordered from most to least central. Produce the strongest arguments the
lawyer can make at the hearing, addressing these issues and grounded only in the facts given.

Respond with a single JSON object with exactly one key:
- "arguments": a list of objects, each with:
  - "point": string, the argument itself
  - "supporting_facts": list of strings, facts from the case that back this argument
  - "legal_basis": string or null, a statute/precedent/legal principle if applicable

Only use the facts, claims, and issues given to you. Do not invent facts or citations."""

def generate_arguments(understanding: CaseUnderstanding, issues: list[Issue], model: str) -> list[Argument]:
    payload = {
      "understanding": understanding.model_dump(),
      "issues": [issue.model_dump() for issue in issues],
    }
    
    result = complete_json(
        system_prompt=_SYSTEM_PROMPT,
        user_prompt=json.dumps(payload),
        model=model,
    )
    return [Argument.model_validate(item) for item in result["arguments"]]