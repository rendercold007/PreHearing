import {useState} from "react";
import {analyzeCaseFiles} from "../api/client";
import type {CaseAnalysis} from "../types";
import {UploadPage} from "./UploadPage";
import { UnderstandingPage } from "./UnderstandingPage";
import {IssuesPage} from "./IssuesPage";
import {ArgumentsPage} from "./ArgumentsPage";
import { StressTestPage } from "./StressTestPage";
import { PreparePage } from "./PreparePage";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { Logo } from "../components/Logo";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import {ResearchPage} from "./ResearchPage";

type Status = "idle" | "loading" | "error" | "done";
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
            preview: truncate(analysis.hearing_prep.brief, 140),
        },
    ];
}

export function AnalyzePage(){
    const [status, setStatus] = useState<Status>("idle");
    const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [openSection, setOpenSection] = useState<SectionKey | null>(null);
    const { email, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout(){
        logout();
        navigate("/");
    }

    async function handleFilesSelected(files: File[]){
        setStatus("loading");
        setError(null);

        try {
            const result = await analyzeCaseFiles(files);
            setAnalysis(result);
            setStatus("done");
        }
        catch (err){
          setError(err instanceof Error ? err.message : "Something went wrong.");
          setStatus("error");
        }
    }

    function handleReset(){
        setAnalysis(null);
        setError(null);
        setStatus("idle");
        setOpenSection(null);
    }

    return(
        <main>
            <header className="site-header">
                <Logo />
                <div className="user-menu">
                    <span className="user-email">{email}</span>
                    <button type="button" className="logout-button" onClick={handleLogout}>
                        Sign out
                    </button>
                </div>
            </header>

            <div className="page-content">
            {status != "done" &&(
                <UploadPage status={status} error={error} onFilesSelected={handleFilesSelected} />
            )}

            {status === "done" && analysis && (
                <>
                <button onClick={handleReset}>Analyze another case</button>

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
                {openSection === "prepare" && (
                    <Modal title="Prepare" onClose={() => setOpenSection(null)}>
                        <PreparePage hearingPrep={analysis.hearing_prep} />
                    </Modal>
                )}
                </>
            )}
            </div>
        </main>
    );
}
