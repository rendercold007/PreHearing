import json

from app.llm.client import complete_json
from app.models.schemas import Argument, CaseUnderstanding, Issue, StressTestPoint

_SYSTEM_PROMPT = """You are opposing counsel's strategist, stress-testing a lawyer's case before a hearing.
You will be given the case understanding, the issues before the court, and the arguments
the lawyer plans to make. Identify how the other side would attack this case: adverse
considerations, factual weaknesses, likely objections, and questions a judge might raise.

Respond with a single JSON object with exactly one key:
- "stress_test_points": a list of objects, each with:
  - "category": string, one of "adverse consideration", "factual weakness", "likely objection", "judge question"
  - "point": string, the concern itself, stated clearly
  - "suggested_response": string or null, how the lawyer could preempt or counter this concern

Only use the facts, issues, and arguments given to you. Do not invent new facts or citations."""


def stress_test(
    understanding: CaseUnderstanding,
    issues: list[Issue],
    arguments: list[Argument],
    model: str,
) -> list[StressTestPoint]:
    payload = {
        "understanding": understanding.model_dump(),
        "issues": [issue.model_dump() for issue in issues],
        "arguments": [argument.model_dump() for argument in arguments],
    }
    result = complete_json(
        system_prompt=_SYSTEM_PROMPT,
        user_prompt=json.dumps(payload),
        model=model,
    )
    return [StressTestPoint.model_validate(item) for item in result["stress_test_points"]]