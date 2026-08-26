import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "../components/Logo";
import { resetPassword } from "../api/auth";

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") ?? "";
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setSubmitting(true);
        try {
            await resetPassword(token, password);
            navigate("/login", {
                replace: true,
                state: { notice: "Your password has been reset. Please log in." },
            });
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
                    <h1 className="auth-title">Choose a new password</h1>

                    {token ? (
                        <>
                            <p className="auth-subtitle">Enter a new password for your account.</p>

                            <form className="auth-form" onSubmit={handleSubmit}>
                                <label className="auth-field">
                                    <span>New password</span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />
                                    <small>At least 8 characters.</small>
                                </label>

                                <label className="auth-field">
                                    <span>Confirm new password</span>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />
                                </label>

                                {error && <p role="alert">{error}</p>}

                                <button type="submit" disabled={submitting}>
                                    {submitting ? "Saving…" : "Reset password"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <p className="auth-subtitle">
                                This reset link is missing its token. Request a new one to continue.
                            </p>
                            <p className="auth-switch">
                                <Link to="/forgot-password">Request a new reset link</Link>
                            </p>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}
