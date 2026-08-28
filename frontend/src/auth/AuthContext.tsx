import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
    SESSION_CLEARED_EVENT,
    clearSession,
    getStoredSession,
    googleAuth as apiGoogleAuth,
    loadSessionProfile,
    login as apiLogin,
    logout as apiLogout,
    signup as apiSignup,
    storeSession,
} from "../api/auth";
import { fetchBillingStatus, type Plan } from "../api/billing";

interface AuthContextValue {
    email: string | null;
    name: string;
    plan: Plan;
    /** True for pro/plus subscribers — drives the star on the avatar. */
    isPaid: boolean;
    isAuthenticated: boolean;
    checking: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    loginWithGoogle: (credential: string) => Promise<void>;
    logout: () => void;
    /** Called after the profile page saves, so the header avatar updates immediately. */
    setName: (name: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [email, setEmail] = useState<string | null>(() => getStoredSession()?.email ?? null);
    const [name, setName] = useState("");
    const [plan, setPlan] = useState<Plan>("free");
    const [checking, setChecking] = useState(() => getStoredSession() !== null);

    async function loadPlan() {
        try {
            const status = await fetchBillingStatus();
            setPlan(status.plan);
        } catch {
            setPlan("free");
        }
    }

    useEffect(() => {
        const session = getStoredSession();
        if (!session) return;
        void loadPlan();
        loadSessionProfile(session.token)
            .then((profile) => {
                if (!profile) {
                    clearSession();
                    setEmail(null);
                    return;
                }
                setName(profile.name);
            })
            .catch(() => undefined) // backend unreachable — keep the session and let API calls surface errors
            .finally(() => setChecking(false));
    }, []);

    // An expired token is discovered by the API layer, which calls clearSession().
    // Listening here is what turns that into a real logout — otherwise isAuthenticated
    // stays true and the user is stranded on a page that can no longer load anything.
    useEffect(() => {
        function handleSessionCleared() {
            setEmail(null);
            setName("");
            setPlan("free");
        }
        window.addEventListener(SESSION_CLEARED_EVENT, handleSessionCleared);
        return () => window.removeEventListener(SESSION_CLEARED_EVENT, handleSessionCleared);
    }, []);

    async function loadName(token: string) {
        try {
            const profile = await loadSessionProfile(token);
            setName(profile?.name ?? "");
        } catch {
            setName("");
        }
    }

    async function login(userEmail: string, password: string) {
        const session = await apiLogin(userEmail, password);
        storeSession(session);
        setEmail(session.email);
        await loadName(session.token);
        void loadPlan();
    }

    async function signup(userName: string, userEmail: string, password: string) {
        const session = await apiSignup(userName, userEmail, password);
        storeSession(session);
        setEmail(session.email);
        setName(userName);
        setPlan("free");
    }

    async function loginWithGoogle(credential: string) {
        const session = await apiGoogleAuth(credential);
        storeSession(session);
        setEmail(session.email);
        await loadName(session.token);
        void loadPlan();
    }

    function logout() {
        const session = getStoredSession();
        if (session) void apiLogout(session.token);
        clearSession();
        setEmail(null);
        setName("");
        setPlan("free");
    }

    return (
        <AuthContext.Provider
            value={{
                email,
                name,
                plan,
                isPaid: plan !== "free",
                isAuthenticated: email !== null,
                checking,
                login,
                signup,
                loginWithGoogle,
                logout,
                setName,
            }}
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
