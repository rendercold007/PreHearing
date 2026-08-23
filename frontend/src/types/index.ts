export interface Party {
    name: string;
    role: string;
}

export interface CaseUnderstanding {
    case_type: string;
    parties: Party[];
    key_facts: string[];
    claims: string[];
    disputed_points: string[];
    summary: string;
}

export interface Issue{
    statement: string;
    issue_type: string;
    related_facts: string[];
}
export interface Argument {
    point: string;
    supporting_facts: string[];
    legal_basis: string | null;
}

export interface StressTestPoint {
  category: string;
  point: string;
  suggested_response: string | null;
}


export interface CaseAnalysis {
    understanding: CaseUnderstanding;
    issues: Issue[];
    arguments: Argument[];
    stress_test: StressTestPoint[];
}