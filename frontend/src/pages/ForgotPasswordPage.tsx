import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { requestPasswordReset } from "../api/auth";
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
        <main className={mainPad}>
            <header className={siteHeader}>
                <Logo />
            </header>

            <div className="flex justify-center py-12">
                <section className={authCard}>
                    <h1 className={authTitle}>Reset your password</h1>

                    {sent ? (
                        <>
                            <p className={authSubtitle}>
                                If an account exists for <strong>{email}</strong>, we've sent a
                                link to reset your password. Check your inbox — the link expires
                                in an hour.
                            </p>
                            <p className={authSwitch}>
                                <Link to="/login" className={authLink}>Back to log in</Link>
                            </p>
                        </>
                    ) : (
                        <>
                            <p className={authSubtitle}>
                                Enter your email and we'll send you a link to set a new password.
                            </p>

                            <form className={authForm} onSubmit={handleSubmit}>
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

                                {error && (
                                    <p role="alert" className="m-0 rounded-card bg-danger-bg px-4 py-3 text-[0.88rem] text-danger">
                                        {error}
                                    </p>
                                )}

                                <button type="submit" className={`${btnPrimary} mt-1`} disabled={submitting}>
                                    {submitting ? "Sending…" : "Send reset link"}
                                </button>
                            </form>

                            <p className={authSwitch}>
                                Remembered it? <Link to="/login" className={authLink}>Log in</Link>
                            </p>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}
