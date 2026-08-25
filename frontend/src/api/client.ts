import type { CaseAnalysis } from "../types";
import { clearSession, getStoredSession } from "./auth";

const API_BASE_URL = "http://localhost:8000/api";

export interface StageEvent {
    stage: string;
    /** "failed" means the stage crashed and was skipped — the run continues without it. */
    status: "started" | "done" | "failed";
}

export interface AnalysisRun {
    analysis: CaseAnalysis;
    /** null when the run could not be saved to case history — export is unavailable then. */
    caseId: number | null;
}

export async function analyzeCaseFiles(
    files: File[],
    onStage?: (event: StageEvent) => void,
): Promise<AnalysisRun>{
    const formData = new FormData();
    for(const file of files){
    formData.append("files",file);
    }

    const session = getStoredSession();

    const response = await fetch(`${API_BASE_URL}/analyze`,{
        method: "POST",
        headers: session ? { Authorization: `Bearer ${session.token}` } : undefined,
        body: formData,
    });

    if(response.status === 401){
        clearSession();
        throw new Error("Your session has expired. Please log in again.");
    }

    if(!response.ok){
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.detail ?? `Request failed with status ${response.status}`;
        throw new Error(message);
    }

    if(!response.body){
        throw new Error("Streaming is not supported in this browser.");
    }

    // The backend streams NDJSON: stage progress events, then one result (or error) event.
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let result: AnalysisRun | null = null;

    const handleLine = (line: string) => {
        if(!line.trim()) return;
        const event = JSON.parse(line);
        if(event.type === "stage"){
            onStage?.({ stage: event.stage, status: event.status });
        } else if(event.type === "result"){
            result = { analysis: event.analysis as CaseAnalysis, caseId: event.case_id ?? null };
        } else if(event.type === "error"){
            throw new Error(event.detail ?? "Analysis failed.");
        }
    };

    for(;;){
        const { done, value } = await reader.read();
        if(done) break;
        buffer += decoder.decode(value, { stream: true });
        let newline: number;
        while((newline = buffer.indexOf("\n")) >= 0){
            const line = buffer.slice(0, newline);
            buffer = buffer.slice(newline + 1);
            handleLine(line);
        }
    }
    handleLine(buffer);

    if(!result){
        throw new Error("The analysis ended unexpectedly. Please try again.");
    }
    return result;
}
