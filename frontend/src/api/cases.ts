import type { CaseDetail, CaseSummary } from "../types";
import { clearSession, getStoredSession } from "./auth";
import { API_BASE_URL } from "./config";

async function request(path: string, init?: RequestInit): Promise<Response> {
    const session = getStoredSession();
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: session ? { Authorization: `Bearer ${session.token}` } : undefined,
    });

    if (response.status === 401) {
        clearSession();
        throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.detail ?? `Request failed with status ${response.status}`);
    }

    return response;
}

export async function listCases(): Promise<CaseSummary[]> {
    return (await request("/cases")).json();
}

export async function getCase(id: number): Promise<CaseDetail> {
    return (await request(`/cases/${id}`)).json();
}

export async function deleteCase(id: number): Promise<void> {
    await request(`/cases/${id}`, { method: "DELETE" });
}

function filenameFrom(disposition: string | null): string {
    const match = disposition?.match(/filename="([^"]+)"/);
    return match?.[1] ?? "hearing-pack.docx";
}

/** The export needs a Bearer header, so it is fetched as a blob rather than linked to. */
export async function downloadCaseExport(id: number): Promise<void> {
    const response = await request(`/cases/${id}/export.docx`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filenameFrom(response.headers.get("Content-Disposition"));
    link.click();
    URL.revokeObjectURL(url);
}

/** SQLite stores UTC without a timezone marker — tag it so it isn't read as local time. */
export function formatSavedAt(createdAt: string): string {
    const parsed = new Date(`${createdAt.replace(" ", "T")}Z`);
    if (Number.isNaN(parsed.getTime())) return createdAt;
    return parsed.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
