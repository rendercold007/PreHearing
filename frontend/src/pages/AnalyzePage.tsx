import {useState} from "react";
import {analyzeCaseFiles} from "../api/client";
import type {CaseAnalysis} from "../types";
import {UploadPage} from "./UploadPage";
import { AnalysisResult } from "../components/AnalysisResult";
import { AppHeader } from "../components/AppHeader";

type Status = "idle" | "loading" | "error" | "done";

export function AnalyzePage(){
    const [status, setStatus] = useState<Status>("idle");
    const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
    const [caseId, setCaseId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<Record<string, "running" | "done">>({});

    async function handleFilesSelected(files: File[]){
        setStatus("loading");
        setError(null);
        setProgress({});

        try {
            const result = await analyzeCaseFiles(files, (event) => {
                setProgress((prev) => ({
                    ...prev,
                    [event.stage]: event.status === "done" ? "done" : "running",
                }));
            });
            setAnalysis(result.analysis);
            setCaseId(result.caseId);
            setStatus("done");
        }
        catch (err){
          setError(err instanceof Error ? err.message : "Something went wrong.");
          setStatus("error");
        }
    }

    function handleReset(){
        setAnalysis(null);
        setCaseId(null);
        setError(null);
        setStatus("idle");
        setProgress({});
    }

    return(
        <main>
            <AppHeader />

            <div className="page-content">
            {status != "done" &&(
                <UploadPage status={status} error={error} progress={progress} onFilesSelected={handleFilesSelected} />
            )}

            {status === "done" && analysis && (
                <>
                <button onClick={handleReset}>Analyze another case</button>
                {caseId !== null && <p className="saved-note">Saved to your case history.</p>}
                <AnalysisResult analysis={analysis} caseId={caseId} />
                </>
            )}
            </div>
        </main>
    );
}
