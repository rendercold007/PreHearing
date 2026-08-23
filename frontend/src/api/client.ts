import type { CaseAnalysis } from "../types";

const API_BASE_URL = "http://localhost:8000/api";

export async function analyzeCaseFiles(files: File[]): Promise<CaseAnalysis>{
    const formData = new FormData();
    for(const file of files){
    formData.append("files",file);
    }
    
    const response = await fetch(`${API_BASE_URL}/analyze`,{
        method: "POST",
        body: formData,
    });

    if(!response.ok){
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.detail ?? `Request failed with status ${response.status}`;
        throw new Error(message);
    }

    return response.json();
}