import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { useAuth } from "../auth/AuthContext";
import {
    authCard,
    authField,
    authFieldLabel,
    authForm,
    authLink,
    authSubtitle,
    authSwitch,
    authTitle,
    btnPrimary,
    mainPad,
    siteHeader,
    textInput,
} from "../ui";

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
        <main className={mainPad}>
            <header className={siteHeader}>
                <Logo />
            </header>

            <div className="flex justify-center py-12">
                <section className={authCard}>
                    <h1 className={authTitle}>{isSignup ? "Create your account" : "Welcome back"}</h1>
                    <p className={authSubtitle}>
                        {isSignup
                            ? "Sign up to start analyzing your case files."
                            : "Log in to continue to your case analysis."}
                    </p>

                    {!isSignup && notice && (
                        <p
                            className="mb-5 rounded-lg border border-accent bg-accent-soft px-4 py-3 text-[0.9rem] text-fg"
                            role="status"
                        >
                            {notice}
                        </p>
                    )}

                    <form className={authForm} onSubmit={handleSubmit}>
                        {isSignup && (
                            <label className={authField}>
                                <span className={authFieldLabel}>Full name</span>
                                <input
                                    className={textInput}
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoComplete="name"
                                    maxLength={80}
                                    required
                                />
                            </label>
                        )}

                        <label className={authField}>
                            <span className={authFieldLabel}>Email</span>
                            <input
                                className={textInput}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </label>

                        <label className={authField}>
                            <span className={authFieldLabel}>Password</span>
                            <input
                                className={textInput}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete={isSignup ? "new-password" : "current-password"}
                                minLength={8}
                                required
                            />
                            {isSignup && <small className="text-[0.78rem] text-muted">At least 8 characters.</small>}
                        </label>

                        {isSignup && (
                            <label className={authField}>
                                <span className={authFieldLabel}>Confirm password</span>
                                <input
                                    className={textInput}
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />
                            </label>
                        )}

                        {error && (
                            <p role="alert" className="m-0 rounded-card bg-danger-bg px-4 py-3 text-[0.88rem] text-danger">
                                {error}
                            </p>
                        )}

                        <button type="submit" className={`${btnPrimary} mt-1`} disabled={submitting}>
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
                        <p className={authSwitch}>
                            <Link to="/forgot-password" className={authLink}>Forgot your password?</Link>
                        </p>
                    )}

                    <p className={authSwitch}>
                        {isSignup ? (
                            <>
                                Already have an account?{" "}
                                <Link to="/login" state={{ from }} className={authLink}>Log in</Link>
                            </>
                        ) : (
                            <>
                                New to Casper?{" "}
                                <Link to="/signup" state={{ from }} className={authLink}>Create an account</Link>
                            </>
                        )}
                    </p>
                </section>
            </div>
        </main>
    );
}
