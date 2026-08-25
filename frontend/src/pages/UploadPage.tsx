import {useEffect, useState} from "react";
import type {FormEvent} from "react";
import { Dropzone } from "../components/Dropzone";

const STAGES: { key: string; label: string }[] = [
    { key: "understanding", label: "Understanding the case" },
    { key: "issues", label: "Identifying issues" },
    { key: "research", label: "Researching authorities" },
    { key: "adverse_research", label: "Researching the other side's authorities" },
    { key: "arguments", label: "Building arguments" },
    { key: "stress_test", label: "Stress-testing the case" },
    { key: "prepare", label: "Assembling the hearing pack" },
];

interface UploadPageProps{
    status: "idle" | "loading" | "error" | "done";
    error: string | null;
    progress: Record<string, "running" | "done">;
    onFilesSelected: (files: File[]) => void;
}

function formatElapsed(seconds: number): string {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function UploadPage({status, error, progress, onFilesSelected} : UploadPageProps){
    const [files, setFiles] = useState<File[]>([]);
    const [validation, setValidation] = useState<string | null>(null);
    const [elapsed, setElapsed] = useState(0);

    const loading = status === "loading";
    const doneCount = STAGES.filter((stage) => progress[stage.key] === "done").length;
    const percent = Math.round((doneCount / STAGES.length) * 100);

    useEffect(() => {
        if (!loading) return;
        setElapsed(0);
        const started = Date.now();
        const timer = window.setInterval(
            () => setElapsed(Math.floor((Date.now() - started) / 1000)),
            1000,
        );
        return () => window.clearInterval(timer);
    }, [loading]);

    function handleSubmit(event : FormEvent){
        event.preventDefault();
        if(files.length === 0){
            setValidation("Choose at least one PDF or DOCX file to analyze.");
            return;
        }
        setValidation(null);
        onFilesSelected(files);
    }

    return(
        <section className="upload-section">
            <h1 className="page-title">New analysis</h1>
            <p className="page-lede">
                Upload the pleadings and exhibits for one case. Everything you add is analyzed
                together as a single matter.
            </p>

            <form onSubmit={handleSubmit} className="upload-form">
                <Dropzone
                    files={files}
                    onFilesChange={(next) => {
                        setFiles(next);
                        setValidation(null);
                    }}
                    disabled={loading}
                />
                {!loading && (
                    <button type="submit" className="analyze-button">
                        {files.length > 1 ? `Analyze ${files.length} files` : "Analyze case"}
                    </button>
                )}
            </form>

            {validation && <p className="upload-validation" role="alert">{validation}</p>}

            {loading && (
                <div className="analysis-progress">
                    <div className="progress-head">
                        <span>Analyzing — this usually takes a couple of minutes</span>
                        <span className="progress-elapsed">{formatElapsed(elapsed)}</span>
                    </div>
                    <div
                        className="progress-track"
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div className="progress-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <ul className="stage-progress">
                        {STAGES.map((stage) => {
                            const state = progress[stage.key];
                            return (
                                <li key={stage.key} className={`stage-${state ?? "pending"}`}>
                                    <span className="stage-marker">
                                        {state === "done" ? "✓" : state === "running" ? "…" : "○"}
                                    </span>{" "}
                                    {stage.label}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {error && <p role="alert">{error}</p>}
        </section>
    );
}
