import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuth } from "../auth/AuthContext";

interface AuthPageProps {
    mode: "login" | "signup";
}

export function AuthPage({ mode }: AuthPageProps) {
    const isSignup = mode === "signup";
    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from ?? "/app";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);

        if (isSignup && password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setSubmitting(true);
        try {
            if (isSignup) {
                await signup(email, password);
            } else {
                await login(email, password);
            }
            navigate(from, { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main>
            <header className="site-header">
                <Logo />
            </header>

            <div className="auth-page">
                <section className="auth-card">
                    <h1 className="auth-title">{isSignup ? "Create your account" : "Welcome back"}</h1>
                    <p className="auth-subtitle">
                        {isSignup
                            ? "Sign up to start analyzing your case files."
                            : "Log in to continue to your case analysis."}
                    </p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <label className="auth-field">
                            <span>Email</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </label>

                        <label className="auth-field">
                            <span>Password</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete={isSignup ? "new-password" : "current-password"}
                                minLength={8}
                                required
                            />
                            {isSignup && <small>At least 8 characters.</small>}
                        </label>

                        {isSignup && (
                            <label className="auth-field">
                                <span>Confirm password</span>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />
                            </label>
                        )}

                        {error && <p role="alert">{error}</p>}

                        <button type="submit" disabled={submitting}>
                            {submitting
                                ? isSignup
                                    ? "Creating account…"
                                    : "Logging in…"
                                : isSignup
                                  ? "Sign up"
                                  : "Log in"}
                        </button>
                    </form>

                    <p className="auth-switch">
                        {isSignup ? (
                            <>
                                Already have an account?{" "}
                                <Link to="/login" state={{ from }}>Log in</Link>
                            </>
                        ) : (
                            <>
                                New to PreHearing?{" "}
                                <Link to="/signup" state={{ from }}>Create an account</Link>
                            </>
                        )}
                    </p>
                </section>
            </div>
        </main>
    );
}
