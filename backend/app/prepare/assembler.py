import json

from app.llm.client import complete_json
from app.models.schemas import Argument, CaseUnderstanding, HearingPrep, Issue, StressTestPoint

_SYSTEM_PROMPT = """You are a lawyer's assistant assembling final hearing preparation materials.
You will be given the case understanding, the issues before the court, the arguments the
lawyer plans to make (each with a counter-argument and rebuttal), and the stress-test points
identifying weaknesses and likely objections. Assemble this into a hearing-ready pack.

Respond with a single JSON object with exactly one key:
- "hearing_prep": an object with:
  - "brief": string, a written hearing brief in prose (case summary, issues, arguments with
    their support, and how anticipated counter-arguments are answered) that a lawyer could
    read directly before the hearing
  - "outline": a list of objects, each with:
    - "heading": string, a section of the oral argument (e.g. an issue or stage of the hearing)
    - "talking_points": list of strings, concise points to speak from, in the order they
      should be raised
  - "checklist": a list of objects, each with:
    - "category": string, e.g. "documents", "logistics", "argument prep"
    - "item": string, a concrete action to complete before the hearing

Only use the facts, issues, arguments, and stress-test points given to you. Do not invent
new facts, citations, or deadlines."""


def assemble_hearing_prep(
    understanding: CaseUnderstanding,
    issues: list[Issue],
    arguments: list[Argument],
    stress_test: list[StressTestPoint],
    model: str,
) -> HearingPrep:
    payload = {
        "understanding": understanding.model_dump(),
        "issues": [issue.model_dump() for issue in issues],
        "arguments": [argument.model_dump() for argument in arguments],
        "stress_test": [point.model_dump() for point in stress_test],
    }
    result = complete_json(
        system_prompt=_SYSTEM_PROMPT,
        user_prompt=json.dumps(payload),
        model=model,
    )
    return HearingPrep.model_validate(result["hearing_prep"])
