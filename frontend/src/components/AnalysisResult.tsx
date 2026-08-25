import { useState } from "react";
import type { CaseAnalysis } from "../types";
import { UnderstandingPage } from "../pages/UnderstandingPage";
import { IssuesPage } from "../pages/IssuesPage";
import { ResearchPage } from "../pages/ResearchPage";
import { ArgumentsPage } from "../pages/ArgumentsPage";
import { StressTestPage } from "../pages/StressTestPage";
import { PreparePage } from "../pages/PreparePage";
import { Card } from "./Card";
import { Modal } from "./Modal";
import { AiDisclaimer } from "./AiDisclaimer";

type SectionKey = "understanding" | "issues" | "research" | "arguments" | "stressTest" | "prepare";

function truncate(text: string, max: number): string {
    const trimmed = text.trim();
    return trimmed.length > max ? `${trimmed.slice(0, max).trim()}…` : trimmed;
}

function buildSections(analysis: CaseAnalysis) {
    return [
        {
            key: "understanding" as const,
            icon: "📄",
            title: "Case Understanding",
            preview: truncate(analysis.understanding.summary, 140),
        },
        {
            key: "issues" as const,
            icon: "⚖️",
            title: "Issues Before the Court",
            preview:
                analysis.issues.length === 0
                    ? "No issues were identified."
                    : `${analysis.issues.length} issue${analysis.issues.length === 1 ? "" : "s"} identified — leading with "${truncate(analysis.issues[0].statement, 80)}"`,
        },
         {
            key: "research" as const,
            icon: "📚",
            title: "Research",
            preview:
                analysis.research.length === 0
                    ? "No research results."
                    : `${analysis.research.reduce((n, r) => n + r.authorities.length, 0)} authorities found across ${analysis.research.length} issue${analysis.research.length === 1 ? "" : "s"}.`,
        },
        {
            key: "arguments" as const,
            icon: "🎯",
            title: "Arguments for Hearing",
            preview:
                analysis.arguments.length === 0
                    ? "No arguments were generated."
                    : `${analysis.arguments.length} argument${analysis.arguments.length === 1 ? "" : "s"} prepared, each with a counter-argument and rebuttal.`,
        },
        {
            key: "stressTest" as const,
            icon: "🛡️",
            title: "Stress Test",
            preview:
                analysis.stress_test.length === 0
                    ? "No weaknesses or objections were identified."
                    : `${analysis.stress_test.length} weakness${analysis.stress_test.length === 1 ? "" : "es"} and objection${analysis.stress_test.length === 1 ? "" : "s"} flagged.`,
        },
        {
            key: "prepare" as const,
            icon: "📑",
            title: "Prepare",
            preview: analysis.hearing_prep ? truncate(analysis.hearing_prep.brief, 140): "The Prepare pack could not be generated on this run.",
        },
    ];
}

/** The six result cards + their modals — shared by a fresh run and a saved case. */
interface AnalysisResultProps {
    analysis: CaseAnalysis;
    /** Saved-case id — enables the Word export, which the backend renders from storage. */
    caseId: number | null;
}

export function AnalysisResult({ analysis, caseId }: AnalysisResultProps) {
    const [openSection, setOpenSection] = useState<SectionKey | null>(null);

    return (
        <>
            {analysis.warnings.length > 0 && (
                <div className="alert" role="alert">
                    {analysis.warnings.map((w) => (
                        <p key={w}>{w}</p>
                    ))}
                </div>
            )}

            <AiDisclaimer />

            <div className="card-grid">
                {buildSections(analysis).map((section) => (
                    <Card
                        key={section.key}
                        icon={section.icon}
                        title={section.title}
                        preview={section.preview}
                        onClick={() => setOpenSection(section.key)}
                    />
                ))}
            </div>

            {openSection === "understanding" && (
                <Modal title="Case Understanding" onClose={() => setOpenSection(null)}>
                    <UnderstandingPage understanding={analysis.understanding} />
                </Modal>
            )}
            {openSection === "issues" && (
                <Modal title="Issues Before the Court" onClose={() => setOpenSection(null)}>
                    <IssuesPage issues={analysis.issues} />
                </Modal>
            )}
            {openSection === "research" && (
                <Modal title="Research" onClose={() => setOpenSection(null)}>
                    <ResearchPage research={analysis.research} />
                </Modal>
            )}
            {openSection === "arguments" && (
                <Modal title="Arguments for Hearing" onClose={() => setOpenSection(null)}>
                    <ArgumentsPage arguments={analysis.arguments} />
                </Modal>
            )}
            {openSection === "stressTest" && (
                <Modal title="Stress Test" onClose={() => setOpenSection(null)}>
                    <StressTestPage stressTest={analysis.stress_test} />
                </Modal>
            )}
            {openSection === "prepare" && analysis.hearing_prep && (
                <Modal title="Prepare" onClose={() => setOpenSection(null)}>
                    <PreparePage hearingPrep={analysis.hearing_prep} caseId={caseId} />
                </Modal>
            )}
        </>
    );
}
