import json

from app.llm.client import complete_json
from app.models.schemas import (
    Argument,
    CaseUnderstanding,
    Issue,
    IssueResearch,
    StressTestPoint,
)
from app.research.researcher import flatten_authorities, select_by_number

_SYSTEM_PROMPT = """You are opposing counsel's strategist, stress-testing a lawyer's case before a hearing.
You will be given the case understanding, the issues before the court, the arguments
the lawyer plans to make, and possibly a numbered list of adverse authorities - case law
the opposing side could rely on. Identify how the other side would attack this case:
adverse considerations, factual weaknesses, likely objections, and questions a judge
might raise.

Respond with a single JSON object with exactly one key:
- "stress_test_points": a list of objects, each with:
  - "category": string, one of "adverse consideration", "factual weakness", "likely objection", "judge question"
  - "point": string, the concern itself, stated clearly
  - "authorities": list of integers, the numbers of the listed adverse authorities the
    opposing side would rely on for this point (empty list if none apply, or if none were listed)
  - "suggested_response": string or null, how the lawyer could preempt or counter this concern

Only use the facts, issues, and arguments given to you. Only use authority numbers that
appear in the numbered list - never cite a case that is not listed. Do not invent new
facts or citations."""


def stress_test(
    understanding: CaseUnderstanding,
    issues: list[Issue],
    arguments: list[Argument],
    adverse_research: list[IssueResearch],
    model: str,
) -> list[StressTestPoint]:
    adverse_authorities = flatten_authorities(adverse_research)
    payload = {
        "understanding": understanding.model_dump(),
        "issues": [issue.model_dump() for issue in issues],
        "arguments": [argument.model_dump() for argument in arguments],
        "adverse_authorities": [
            f"[{i}] {a.title} ({a.court}, {a.date}) — {a.relevance}"
            for i, a in enumerate(adverse_authorities, start=1)
        ],
    }
    result = complete_json(
        system_prompt=_SYSTEM_PROMPT,
        user_prompt=json.dumps(payload),
        model=model,
    )

    points: list[StressTestPoint] = []
    for item in result["stress_test_points"]:
        selected = select_by_number(item.get("authorities"), adverse_authorities)
        points.append(
            StressTestPoint.model_validate(
                {**item, "authorities": [authority.model_dump() for authority in selected]}
            )
        )
    return points
