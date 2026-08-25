const API_BASE_URL = "http://localhost:8000/api";

const TOKEN_KEY = "prehearing_token";
const EMAIL_KEY = "prehearing_email";

export interface AuthSession {
    token: string;
    email: string;
}

export function getStoredSession(): AuthSession | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const email = localStorage.getItem(EMAIL_KEY);
    return token && email ? { token, email } : null;
}

export function storeSession(session: AuthSession): void {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(EMAIL_KEY, session.email);
}

/** Fired after the session is cleared, so AuthContext can drop its in-memory state.
 *  Without this an API layer 401 empties localStorage while the app still believes
 *  it is logged in, and RequireAuth never redirects. */
export const SESSION_CLEARED_EVENT = "prehearing:session-cleared";

export function clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    window.dispatchEvent(new Event(SESSION_CLEARED_EVENT));
}

async function authRequest(
    path: string,
    body: Record<string, string>,
): Promise<AuthSession> {
    const response = await fetch(`${API_BASE_URL}/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const detail = errorBody?.detail;
        const message =
            typeof detail === "string"
                ? detail
                : Array.isArray(detail)
                  ? detail[0]?.msg ?? "Invalid email or password."
                  : `Request failed with status ${response.status}`;
        throw new Error(message);
    }

    return response.json();
}

export function signup(
    name: string,
    email: string,
    password: string,
): Promise<AuthSession> {
    return authRequest("signup", { name, email, password });
}

export function login(email: string, password: string): Promise<AuthSession> {
    return authRequest("login", { email, password });
}

export interface AccountProfile {
    email: string;
    name: string;
    created_at: string;
}

export async function fetchProfile(token: string): Promise<AccountProfile> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Could not load your account details.");
    return response.json();
}

export async function updateName(token: string, name: string): Promise<AccountProfile> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const detail = errorBody?.detail;
        throw new Error(
            typeof detail === "string" ? detail : "Your name could not be saved.",
        );
    }
    return response.json();
}

/** null when the session is no longer valid; throws only if the backend is unreachable. */
export async function loadSessionProfile(token: string): Promise<AccountProfile | null> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error("Could not load your account details.");
    return response.json();
}

export async function logout(token: string): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
}
