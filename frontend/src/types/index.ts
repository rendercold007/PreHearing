export interface Party {
    name: string;
    role: string;
}

export interface Citation {
    source_document: string;
    location: string;
}

export interface CitedFact {
    text: string;
    citations: Citation[];
}

export interface CaseUnderstanding {
    case_type: string;
    parties: Party[];
    key_facts: CitedFact[];
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
    supporting_facts: CitedFact[];
    authorities: Authority[];
    legal_basis: string | null;
    counter_argument: string | null;
    rebuttal: string | null;
}

export interface StressTestPoint {
  category: string;
  point: string;
  authorities: Authority[];
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
    hearing_prep: HearingPrep | null;
    research: IssueResearch[];
    /** The opponent's authorities — the flipped research pass that feeds the stress test. */
    adverse_research: IssueResearch[];
    warnings: string[];
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

export interface CaseSummary {
    id: number;
    title: string;
    filenames: string[];
    warning_count: number;
    created_at: string;
}

export interface CaseDetail extends CaseSummary {
    analysis: CaseAnalysis;
}
