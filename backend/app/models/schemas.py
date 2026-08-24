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
    counter_argument: str | None = None
    rebuttal: str | None = None


class StressTestPoint(BaseModel):
    category: str
    point: str
    suggested_response: str | None = None

class OutlinePoint(BaseModel):
    heading: str
    talking_points: list[str] = Field(default_factory=list)


class ChecklistItem(BaseModel):
    category: str
    item: str


class HearingPrep(BaseModel):
    brief: str
    outline: list[OutlinePoint]
    checklist: list[ChecklistItem]


class CaseAnalysis(BaseModel):
    understanding: CaseUnderstanding
    issues: list[Issue]
    arguments: list[Argument]
    stress_test: list[StressTestPoint]
    hearing_prep: HearingPrep
