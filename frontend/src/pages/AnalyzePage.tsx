import {useState} from "react";
import { Link } from "react-router-dom";
import {analyzeCaseFiles, QuotaExceededError} from "../api/client";
import type {StageProgress} from "./UploadPage";
import type {CaseAnalysis} from "../types";
import {UploadPage} from "./UploadPage";
import { AnalysisResult } from "../components/AnalysisResult";
import { AppLayout } from "../components/AppLayout";

type Status = "idle" | "loading" | "error" | "done";

export function AnalyzePage(){
    const [status, setStatus] = useState<Status>("idle");
    const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
    const [caseId, setCaseId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<StageProgress>({});
    const [quotaHit, setQuotaHit] = useState(false);

    async function handleFilesSelected(files: File[]){
        setStatus("loading");
        setError(null);
        setQuotaHit(false);
        setProgress({});

        try {
            const result = await analyzeCaseFiles(files, (event) => {
                setProgress((prev) => ({
                    ...prev,
                    [event.stage]: event.status === "started" ? "running" : event.status,
                }));
            });
            setAnalysis(result.analysis);
            setCaseId(result.caseId);
            setStatus("done");
        }
        catch (err){
          setQuotaHit(err instanceof QuotaExceededError);
          setError(err instanceof Error ? err.message : "Something went wrong.");
          setStatus("error");
        }
    }

    function handleReset(){
        setAnalysis(null);
        setCaseId(null);
        setError(null);
        setQuotaHit(false);
        setStatus("idle");
        setProgress({});
    }

    return(
        <AppLayout>
            {status === "error" && quotaHit ? (
                <div className="quota-wall">
                    <h2>You've used all your analyses this month</h2>
                    <p>{error}</p>
                    <div className="quota-wall-actions">
                        <Link to="/pricing" className="quota-wall-cta">View plans</Link>
                        <button type="button" className="secondary-button" onClick={handleReset}>
                            Back
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {status !== "done" && (
                        <UploadPage status={status} error={error} progress={progress} onFilesSelected={handleFilesSelected} />
                    )}

                    {status === "done" && analysis && (
                        <AnalysisResult
                            analysis={analysis}
                            caseId={caseId}
                            onAnalyzeAnother={handleReset}
                        />
                    )}
                </>
            )}
        </AppLayout>
    );
}
