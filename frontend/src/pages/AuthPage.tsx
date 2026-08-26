import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { useAuth } from "../auth/AuthContext";

interface AuthPageProps {
    mode: "login" | "signup";
}

export function AuthPage({ mode }: AuthPageProps) {
    const isSignup = mode === "signup";
    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as { from?: string; notice?: string } | null;
    const from = locationState?.from ?? "/app";
    const notice = locationState?.notice;

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);

        if (isSignup && !name.trim()) {
            setError("Please enter your name.");
            return;
        }

        if (isSignup && password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setSubmitting(true);
        try {
            if (isSignup) {
                await signup(name.trim(), email, password);
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

                    {!isSignup && notice && (
                        <p className="auth-notice" role="status">{notice}</p>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {isSignup && (
                            <label className="auth-field">
                                <span>Full name</span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoComplete="name"
                                    maxLength={80}
                                    required
                                />
                            </label>
                        )}

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

                    <GoogleSignInButton />

                    {!isSignup && (
                        <p className="auth-switch">
                            <Link to="/forgot-password">Forgot your password?</Link>
                        </p>
                    )}

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
