import {useEffect, useState} from "react";
import type {FormEvent} from "react";
import { Dropzone } from "../components/Dropzone";
import { btnPrimary, dangerAlert, pageLede, pageTitle, surfaceCard } from "../ui";

type StageState = "running" | "done" | "failed" | "pending";

function stageRowClass(state: StageState): string {
    const tone = state === "pending" ? "text-muted" : "text-fg";
    const pulse = state === "running" ? " animate-stage-pulse motion-reduce:animate-none" : "";
    return `text-[0.9rem] ${tone}${pulse}`;
}

function stageMarkerClass(state: StageState): string {
    const color =
        state === "failed" ? "text-danger" : state === "pending" ? "text-muted" : "text-accent";
    return `inline-block w-[1.2rem] ${color}`;
}

const STAGES: { key: string; label: string }[] = [
    { key: "understanding", label: "Understanding the case" },
    { key: "issues", label: "Identifying issues" },
    { key: "research", label: "Researching authorities" },
    { key: "adverse_research", label: "Researching the other side's authorities" },
    { key: "arguments", label: "Building arguments" },
    { key: "stress_test", label: "Stress-testing the case" },
    { key: "prepare", label: "Assembling the hearing pack" },
];

export type StageProgress = Record<string, "running" | "done" | "failed">;

interface UploadPageProps{
    status: "idle" | "loading" | "error" | "done";
    error: string | null;
    progress: StageProgress;
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
    const doneCount = STAGES.filter(
        (stage) => progress[stage.key] === "done" || progress[stage.key] === "failed",
    ).length;
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
        <section className={`${surfaceCard} mb-6 p-5 sm:p-8`}>
            <h1 className={pageTitle}>New analysis</h1>
            <p className={pageLede}>
                Upload the pleadings and exhibits for one case. Everything you add is analyzed
                together as a single matter.
            </p>

            <form onSubmit={handleSubmit} className="block">
                <Dropzone
                    files={files}
                    onFilesChange={(next) => {
                        setFiles(next);
                        setValidation(null);
                    }}
                    disabled={loading}
                />
                {!loading && (
                    <button type="submit" className={`${btnPrimary} mx-auto mt-5 block`}>
                        {files.length > 1 ? `Analyze ${files.length} files` : "Analyze case"}
                    </button>
                )}
            </form>

            {validation && (
                <p className="mt-3 text-[0.88rem] text-danger" role="alert">{validation}</p>
            )}

            {loading && (
                <div className="mt-7 border-t border-line pt-6">
                    <div className="flex items-baseline justify-between gap-4 text-[0.88rem] text-muted">
                        <span>Analyzing — this usually takes a couple of minutes</span>
                        <span className="tabular-nums text-fg">{formatElapsed(elapsed)}</span>
                    </div>
                    <div
                        className="mt-[0.6rem] h-1 overflow-hidden rounded-full bg-white/[0.07]"
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-hover))] transition-[width] duration-[400ms] motion-reduce:transition-none"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                    <ul className="mt-5 flex flex-col gap-[0.45rem] rounded-card border border-line bg-surface px-[1.1rem] py-[0.9rem]">
                        {STAGES.map((stage) => {
                            const state = (progress[stage.key] ?? "pending") as StageState;
                            return (
                                <li key={stage.key} className={stageRowClass(state)}>
                                    <span className={stageMarkerClass(state)}>
                                        {state === "done"
                                            ? "✓"
                                            : state === "failed"
                                              ? "✕"
                                              : state === "running"
                                                ? "…"
                                                : "○"}
                                    </span>{" "}
                                    {stage.label}
                                    {state === "failed" && (
                                        <span className="text-[0.82rem] text-muted"> — skipped</span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {error && <p role="alert" className={dangerAlert}>{error}</p>}
        </section>
    );
}
