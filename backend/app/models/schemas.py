from pydantic import BaseModel, Field


class Party(BaseModel):
    name: str
    role: str


class CaseUnderstanding(BaseModel):
    case_type: str
    parties: list[Party]
    key_facts: list[str]
    claims: list[str]
    disputed_points: list[str]
    summary: str


class Issue(BaseModel):
    statement: str
    issue_type: str
    related_facts: list[str] = Field(default_factory=list)


class Argument(BaseModel):
    point: str
    supporting_facts: list[str] = Field(default_factory=list)
    legal_basis: str | None = None


class StressTestPoint(BaseModel):
    category: str
    point: str
    suggested_response: str | None = None

class CaseAnalysis(BaseModel):
    understanding: CaseUnderstanding
    issues: list[Issue]
    arguments: list[Argument]
    