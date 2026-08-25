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
    counter_argument: string | null;
    rebuttal: string | null;
}

export interface StressTestPoint {
  category: string;
  point: string;
  suggested_response: string | null;
}


export interface OutlinePoint {
    heading: string;
    talking_points: string[];
}

export interface ChecklistItem {
    category: string;
    item: string;
}

export interface HearingPrep {
    brief: string;
    outline: OutlinePoint[];
    checklist: ChecklistItem[];
}

export interface CaseAnalysis {
    understanding: CaseUnderstanding;
    issues: Issue[];
    arguments: Argument[];
    stress_test: StressTestPoint[];
    hearing_prep: HearingPrep;
    research: IssueResearch[];
}

export interface Authority {
    doc_id: string;
    title: string;
    court: string;
    date: string;
    url: string;
    snippet: string;
    relevance: string;
}

export interface IssueResearch{
    issue_statement: string;
    queries: string[];
    authorities: Authority[];
}