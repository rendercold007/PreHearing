from app.llm.client import complete_json
from app.models.schemas import Argument, CaseUnderstanding

_SYSTEM_PROMPT = """You are a lawyer's assistant preparing arguments for a hearing.
You will be given a structured understanding of a case. Produce the strongest arguments
the lawyer can make at the hearing, grounded only in the facts and issues provided.

Respond with a single JSON object with exactly one key:
- "arguments": a list of objects, each with:
  - "point": string, the argument itself
  - "supporting_facts": list of strings, facts from the case that back this argument
  - "legal_basis": string or null, a statute/precedent/legal principle if applicable

Only use the facts, claims, and issues given to you. Do not invent facts or citations."""

def generate_arguments(understanding: CaseUnderstanding, model: str) -> list[Argument]:
    result = complete_json(
        system_prompt=_SYSTEM_PROMPT,
        user_prompt=understanding.model_dump_json(),
        model=model,
    )
    return [Argument.model_validate(item) for item in result["arguments"]]