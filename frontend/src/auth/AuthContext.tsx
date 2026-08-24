import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
    clearSession,
    getStoredSession,
    login as apiLogin,
    logout as apiLogout,
    signup as apiSignup,
    storeSession,
    validateSession,
} from "../api/auth";

interface AuthContextValue {
    email: string | null;
    isAuthenticated: boolean;
    checking: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [email, setEmail] = useState<string | null>(() => getStoredSession()?.email ?? null);
    const [checking, setChecking] = useState(() => getStoredSession() !== null);

    useEffect(() => {
        const session = getStoredSession();
        if (!session) return;
        validateSession(session.token)
            .then((valid) => {
                if (!valid) {
                    clearSession();
                    setEmail(null);
                }
            })
            .catch(() => undefined) // backend unreachable — keep the session and let API calls surface errors
            .finally(() => setChecking(false));
    }, []);

    async function login(userEmail: string, password: string) {
        const session = await apiLogin(userEmail, password);
        storeSession(session);
        setEmail(session.email);
    }

    async function signup(userEmail: string, password: string) {
        const session = await apiSignup(userEmail, password);
        storeSession(session);
        setEmail(session.email);
    }

    function logout() {
        const session = getStoredSession();
        if (session) void apiLogout(session.token);
        clearSession();
        setEmail(null);
    }

    return (
        <AuthContext.Provider
            value={{ email, isAuthenticated: email !== null, checking, login, signup, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
    return context;
}
