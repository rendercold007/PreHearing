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

export function clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
}

async function authRequest(path: string, email: string, password: string): Promise<AuthSession> {
    const response = await fetch(`${API_BASE_URL}/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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

export function signup(email: string, password: string): Promise<AuthSession> {
    return authRequest("signup", email, password);
}

export function login(email: string, password: string): Promise<AuthSession> {
    return authRequest("login", email, password);
}

export async function validateSession(token: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
}

export async function logout(token: string): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
}
