from pydantic import BaseModel, Field


class Party(BaseModel):
    name: str
    role: str


class CaseUnderstanding(BaseModel):
    case_type: str
    parties: list[Party]
    key_facts: list[str]
    claims: list[str]
    legal_issues: list[str]
    summary: str


class Argument(BaseModel):
    point: str
    supporting_facts: list[str] = Field(default_factory=list)
    legal_basis: str | None = None


class CaseAnalysis(BaseModel):
    understanding: CaseUnderstanding
    arguments: list[Argument]
    