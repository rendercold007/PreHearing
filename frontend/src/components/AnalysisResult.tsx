import { useState } from "react";
import { Link } from "react-router-dom";
import { downloadCaseExport, type ExportFormat } from "../api/cases";
import type { CaseAnalysis, IssueResearch } from "../types";
import { UnderstandingPage } from "../pages/UnderstandingPage";
import { IssuesPage } from "../pages/IssuesPage";
import { ResearchPage } from "../pages/ResearchPage";
import { ArgumentsPage } from "../pages/ArgumentsPage";
import { StressTestPage } from "../pages/StressTestPage";
import { PreparePage } from "../pages/PreparePage";
import { Card } from "./Card";
import { Modal } from "./Modal";
import { btnPrimary, btnSecondary, warnAlert, warnAlertTitle } from "../ui";

type SectionKey = "understanding" | "issues" | "research" | "arguments" | "stressTest" | "prepare";

/** Stage 04 runs twice — once for our authorities, once flipped to the opponent's. */
type ResearchPass = "supporting" | "adverse";

function segmentedOption(active: boolean): string {
    return `cursor-pointer rounded-lg border-0 bg-transparent px-[0.9rem] py-[0.4rem] text-[0.88rem] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        active ? "bg-accent-soft font-semibold text-accent" : "text-muted hover:text-fg"
    }`;
}

function truncate(text: string, max: number): string {
    const trimmed = text.trim();
    return trimmed.length > max ? `${trimmed.slice(0, max).trim()}…` : trimmed;
}

function countAuthorities(research: IssueResearch[]): number {
    return research.reduce((total, item) => total + item.authorities.length, 0);
}

function researchPreview(analysis: CaseAnalysis): string {
    const supporting = countAuthorities(analysis.research);
    const opposing = countAuthorities(analysis.adverse_research);
    if (supporting === 0 && opposing === 0) return "No research results.";

    const issueCount = Math.max(analysis.research.length, analysis.adverse_research.length);
    return `${supporting} supporting and ${opposing} opposing authorities across ${issueCount} issue${issueCount === 1 ? "" : "s"}.`;
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
            preview: researchPreview(analysis),
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
    /** Only a fresh run can be reset; a saved case has nothing to reset to. */
    onAnalyzeAnother?: () => void;
}

export function AnalysisResult({ analysis, caseId, onAnalyzeAnother }: AnalysisResultProps) {
    const [openSection, setOpenSection] = useState<SectionKey | null>(null);
    const [researchPass, setResearchPass] = useState<ResearchPass>("supporting");
    const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
    const [exportError, setExportError] = useState<string | null>(null);

    const parties = analysis.understanding.parties.map((party) => party.name).filter(Boolean);
    const authorityCount = analysis.research.reduce((n, r) => n + r.authorities.length, 0);
    const stats = [
        `${analysis.issues.length} issue${analysis.issues.length === 1 ? "" : "s"}`,
        `${analysis.arguments.length} argument${analysis.arguments.length === 1 ? "" : "s"}`,
        `${authorityCount} authorit${authorityCount === 1 ? "y" : "ies"}`,
        `${analysis.stress_test.length} stress-test point${analysis.stress_test.length === 1 ? "" : "s"}`,
    ];

    async function handleExport(id: number, format: ExportFormat) {
        setExportingFormat(format);
        setExportError(null);
        try {
            await downloadCaseExport(id, format);
        } catch (err) {
            setExportError(
                err instanceof Error ? err.message : "The export could not be downloaded.",
            );
        } finally {
            setExportingFormat(null);
        }
    }

    return (
        <>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-5 rounded-card border border-line border-l-[3px] border-l-accent bg-surface p-6">
                <div className="min-w-0 flex-[1_1_20rem] [overflow-wrap:break-word]">
                    <p className="m-0 text-[1.25rem] font-semibold capitalize">{analysis.understanding.case_type}</p>
                    {parties.length > 0 && <p className="mt-[0.15rem] text-fg">{parties.join(" · ")}</p>}
                    <p className="mt-[0.35rem] text-[0.85rem] text-muted">{stats.join(" · ")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {caseId !== null && (
                        <>
                            <button
                                type="button"
                                className={btnPrimary}
                                onClick={() => handleExport(caseId, "pdf")}
                                disabled={exportingFormat !== null}
                            >
                                {exportingFormat === "pdf" ? "Preparing…" : "Export as PDF"}
                            </button>
                            <button
                                type="button"
                                className={btnSecondary}
                                onClick={() => handleExport(caseId, "docx")}
                                disabled={exportingFormat !== null}
                            >
                                {exportingFormat === "docx" ? "Preparing…" : "Export as Word"}
                            </button>
                        </>
                    )}
                    {onAnalyzeAnother && (
                        <>
                            <button type="button" className={btnSecondary} onClick={onAnalyzeAnother}>
                                Analyze another case
                            </button>
                            <Link to="/cases" className={btnSecondary}>
                                Case history
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {exportError && (
                <div className={warnAlert} role="alert">
                    <p className={`my-[0.2rem] ${warnAlertTitle}`}>Export failed</p>
                    <p className="my-[0.2rem]">{exportError}</p>
                </div>
            )}

            {analysis.warnings.length > 0 && (
                <div className={warnAlert} role="alert">
                    <p className={`my-[0.2rem] ${warnAlertTitle}`}>
                        {analysis.warnings.length === 1
                            ? "One stage did not complete"
                            : `${analysis.warnings.length} stages did not complete`}
                    </p>
                    {analysis.warnings.map((w, index) => (
                        <p key={`${index}:${w}`} className="my-[0.2rem]">{w}</p>
                    ))}
                </div>
            )}

            <div className="mt-7 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
                {buildSections(analysis).map((section, index) => (
                    <div
                        key={section.key}
                        className="animate-card-in motion-reduce:animate-none"
                        style={{ animationDelay: `${index * 60}ms` }}
                    >
                        <Card
                            icon={section.icon}
                            title={section.title}
                            preview={section.preview}
                            onClick={() => setOpenSection(section.key)}
                        />
                    </div>
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
                <Modal
                    title="Research"
                    onClose={() => {
                        setOpenSection(null);
                        setResearchPass("supporting");
                    }}
                >
                    <div
                        className="mb-[0.6rem] inline-flex gap-1 rounded-[10px] border border-line bg-white/[0.02] p-1"
                        role="tablist"
                        aria-label="Research pass"
                    >
                        <button
                            type="button"
                            role="tab"
                            id="research-tab-supporting"
                            aria-selected={researchPass === "supporting"}
                            aria-controls="research-panel"
                            className={segmentedOption(researchPass === "supporting")}
                            onClick={() => setResearchPass("supporting")}
                        >
                            Supporting ({countAuthorities(analysis.research)})
                        </button>
                        <button
                            type="button"
                            role="tab"
                            id="research-tab-adverse"
                            aria-selected={researchPass === "adverse"}
                            aria-controls="research-panel"
                            className={segmentedOption(researchPass === "adverse")}
                            onClick={() => setResearchPass("adverse")}
                        >
                            Opposing ({countAuthorities(analysis.adverse_research)})
                        </button>
                    </div>
                    <p className="mb-4 text-[0.85rem] text-muted">
                        {researchPass === "supporting"
                            ? "Authorities that support the case as pleaded."
                            : "Authorities the other side would rely on — these feed the stress test."}
                    </p>
                    <div
                        id="research-panel"
                        role="tabpanel"
                        aria-labelledby={`research-tab-${researchPass}`}
                    >
                        <ResearchPage
                            research={
                                researchPass === "supporting"
                                    ? analysis.research
                                    : analysis.adverse_research
                            }
                        />
                    </div>
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
                    <PreparePage hearingPrep={analysis.hearing_prep} />
                </Modal>
            )}
        </>
    );
}
