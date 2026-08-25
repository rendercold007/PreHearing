import {useRef} from "react";
import type {FormEvent} from "react";

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

export function UploadPage({status, error, progress, onFilesSelected} : UploadPageProps){
    const inputRef = useRef<HTMLInputElement>(null);

    function handleSubmit(event : FormEvent){
        event.preventDefault();
        const files = inputRef.current?.files;
        if(files && files.length>0){
            onFilesSelected(Array.from(files));
        }
    }

    return(
        <section>
            <p>Upload a case file(PDF or DOCX) to generate hearing arguments.</p>

            <form onSubmit={handleSubmit}>
                <input ref={inputRef} type="file" accept=".pdf,.docx" multiple disabled={status === "loading"} />
                <button type="submit" disabled={status === "loading"}>
                    {status === "loading" ? "Analyzing..." : "Analyze"}
                </button>
            </form>

            {status === "loading" && (
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
            )}

            {error && <p role="alert">{error}</p>}
        </section>
    );
}
