import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { requestPasswordReset } from "../api/auth";

export function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await requestPasswordReset(email);
            setSent(true);
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
                    <h1 className="auth-title">Reset your password</h1>

                    {sent ? (
                        <>
                            <p className="auth-subtitle">
                                If an account exists for <strong>{email}</strong>, we've sent a
                                link to reset your password. Check your inbox — the link expires
                                in an hour.
                            </p>
                            <p className="auth-switch">
                                <Link to="/login">Back to log in</Link>
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="auth-subtitle">
                                Enter your email and we'll send you a link to set a new password.
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

                                {error && <p role="alert">{error}</p>}

                                <button type="submit" disabled={submitting}>
                                    {submitting ? "Sending…" : "Send reset link"}
                                </button>
                            </form>

                            <p className="auth-switch">
                                Remembered it? <Link to="/login">Log in</Link>
                            </p>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}
