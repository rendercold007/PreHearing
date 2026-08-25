import json

from app.llm.client import complete_json
from app.models.schemas import (
    Argument,
    CaseUnderstanding,
    CitedFact,
    Issue,
    IssueResearch,
)
from app.research.researcher import flatten_authorities, select_by_number

_SYSTEM_PROMPT = """You are a lawyer's assistant preparing arguments for a hearing.
You will be given a structured understanding of a case and the list of issues the court
must resolve, ordered from most to least central. The case facts are given as a numbered
list. You may also be given a numbered list of legal authorities (case law found for the
issues, with a note on why each is relevant). Produce the strongest arguments the lawyer
can make at the hearing, addressing these issues and grounded only in the facts given.

For each argument, also anticipate the strongest counter-argument opposing counsel is
likely to raise against it, and the rebuttal that answers that counter-argument.

Respond with a single JSON object with exactly one key:
- "arguments": a list of objects, each with:
  - "point": string, the argument itself
  - "supporting_facts": list of integers, the numbers of the facts that back this argument
  - "authorities": list of integers, the numbers of the listed authorities that support
    this argument (empty list if none of them genuinely apply, or if none were listed)
  - "legal_basis": string or null, a statute/precedent/legal principle if applicable
  - "counter_argument": string or null, the strongest counter-argument opposing counsel is likely to raise
  - "rebuttal": string or null, how the lawyer should respond to that counter-argument

Only use the facts, claims, and issues given to you. Only use fact numbers and authority
numbers that appear in the numbered lists — never cite a case that is not listed. Do not
invent facts or citations."""


def _resolve_supporting_facts(raw, facts: list[CitedFact]) -> list[CitedFact]:
    resolved = select_by_number(raw, facts)
    for item in raw if isinstance(raw, list) else []:
        if isinstance(item, str) and item.strip():
            resolved.append(CitedFact(text=item.strip()))
    return resolved


def generate_arguments(
    understanding: CaseUnderstanding,
    issues: list[Issue],
    research: list[IssueResearch],
    model: str,
) -> list[Argument]:
    facts = understanding.key_facts
    authorities = flatten_authorities(research)
    payload = {
        "understanding": {
            **understanding.model_dump(exclude={"key_facts"}),
            "key_facts": [f"[{i}] {fact.text}" for i, fact in enumerate(facts, start=1)],
        },
        "issues": [issue.model_dump() for issue in issues],
        "authorities": [
            f"[{i}] {a.title} ({a.court}, {a.date}) — {a.relevance}"
            for i, a in enumerate(authorities, start=1)
        ],
    }

    result = complete_json(
        system_prompt=_SYSTEM_PROMPT,
        user_prompt=json.dumps(payload),
        model=model,
    )

    arguments: list[Argument] = []
    for item in result["arguments"]:
        supporting = _resolve_supporting_facts(item.get("supporting_facts"), facts)
        selected = select_by_number(item.get("authorities"), authorities)
        arguments.append(
            Argument.model_validate(
                {
                    **item,
                    "supporting_facts": [fact.model_dump() for fact in supporting],
                    "authorities": [authority.model_dump() for authority in selected],
                }
            )
        )
    return arguments
