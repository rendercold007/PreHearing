from pydantic import BaseModel, Field


class Party(BaseModel):
    name: str
    role: str


class Citation(BaseModel):
    source_document: str
    location: str


class CitedFact(BaseModel):
    text: str
    citations: list[Citation] = Field(default_factory=list)


class CaseUnderstanding(BaseModel):
    case_type: str
    parties: list[Party]
    key_facts: list[CitedFact]
    claims: list[str]
    disputed_points: list[str]
    summary: str


class Issue(BaseModel):
    statement: str
    issue_type: str
    related_facts: list[str] = Field(default_factory=list)


class Authority(BaseModel):
    doc_id: str
    title: str
    court: str = ""
    date: str = ""
    url: str
    snippet: str = ""
    relevance: str = ""


class Argument(BaseModel):
    point: str
    supporting_facts: list[CitedFact] = Field(default_factory=list)
    authorities: list[Authority] = Field(default_factory=list)
    legal_basis: str | None = None
    counter_argument: str | None = None
    rebuttal: str | None = None


class StressTestPoint(BaseModel):
    category: str
    point: str
    authorities: list[Authority] = Field(default_factory=list)
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

class IssueResearch(BaseModel):
    issue_statement: str
    queries: list[str]
    authorities: list[Authority]  


class CaseAnalysis(BaseModel):
    understanding: CaseUnderstanding
    issues: list[Issue]
    arguments: list[Argument]
    stress_test: list[StressTestPoint]
    hearing_prep: HearingPrep | None = None
    research: list[IssueResearch] = []
    # The adverse pass feeds the stress test; it is also surfaced on its own so the
    # user can read the authorities the other side would rely on.
    adverse_research: list[IssueResearch] = []
    warnings: list[str] = []
