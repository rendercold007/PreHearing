export interface Party {
    name: string;
    role: string;
}

export interface CaseUnderstanding {
    case_type: string;
    parties: Party[];
    key_facts: string[];
    claims: string[];
    legal_issues: string[];
    summary: string;
}

export interface Argument {
    point: string;
    supporting_facts: string[];
    legal_basis: string | null;
}

export interface CaseAnalysis {
    understanding: CaseUnderstanding;
    arguments: Argument[];
}