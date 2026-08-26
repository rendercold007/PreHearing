import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// Minimal shape of the Google Identity Services global we use (loaded in index.html).
interface GoogleCredentialResponse {
    credential: string;
}

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize(config: {
                        client_id: string;
                        callback: (response: GoogleCredentialResponse) => void;
                    }): void;
                    renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
                };
            };
        };
    }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function GoogleSignInButton() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from ?? "/app";
    const [error, setError] = useState<string | null>(null);

    // The GIS callback is registered once; route it through a ref so it never calls a
    // stale handler after a re-render.
    const handleRef = useRef<(credential: string) => void>(() => {});
    handleRef.current = async (credential: string) => {
        setError(null);
        try {
            await loginWithGoogle(credential);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Google sign-in failed.");
        }
    };

    useEffect(() => {
        if (!CLIENT_ID) return;
        let cancelled = false;

        function tryInit() {
            if (cancelled) return;
            const gid = window.google?.accounts?.id;
            if (!gid || !containerRef.current) {
                // The GIS script loads async — retry until it's ready.
                window.setTimeout(tryInit, 100);
                return;
            }
            gid.initialize({
                client_id: CLIENT_ID as string,
                callback: (response) => handleRef.current(response.credential),
            });
            gid.renderButton(containerRef.current, {
                theme: "filled_black",
                size: "large",
                text: "continue_with",
                shape: "rectangular",
                width: 320,
            });
        }

        tryInit();
        return () => {
            cancelled = true;
        };
    }, []);

    if (!CLIENT_ID) return null;

    return (
        <div className="google-signin">
            <div className="auth-divider"><span>or</span></div>
            <div ref={containerRef} className="google-signin-button" />
            {error && <p role="alert">{error}</p>}
        </div>
    );
}
