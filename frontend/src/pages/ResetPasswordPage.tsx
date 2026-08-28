import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "../components/Logo";
import { resetPassword } from "../api/auth";
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
        <main className={mainPad}>
            <header className={siteHeader}>
                <Logo />
            </header>

            <div className="flex justify-center py-12">
                <section className={authCard}>
                    <h1 className={authTitle}>Choose a new password</h1>

                    {token ? (
                        <>
                            <p className={authSubtitle}>Enter a new password for your account.</p>

                            <form className={authForm} onSubmit={handleSubmit}>
                                <label className={authField}>
                                    <span className={authFieldLabel}>New password</span>
                                    <input
                                        className={textInput}
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />
                                    <small className="text-[0.78rem] text-muted">At least 8 characters.</small>
                                </label>

                                <label className={authField}>
                                    <span className={authFieldLabel}>Confirm new password</span>
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

                                {error && (
                                    <p role="alert" className="m-0 rounded-card bg-danger-bg px-4 py-3 text-[0.88rem] text-danger">
                                        {error}
                                    </p>
                                )}

                                <button type="submit" className={`${btnPrimary} mt-1`} disabled={submitting}>
                                    {submitting ? "Saving…" : "Reset password"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <p className={authSubtitle}>
                                This reset link is missing its token. Request a new one to continue.
                            </p>
                            <p className={authSwitch}>
                                <Link to="/forgot-password" className={authLink}>Request a new reset link</Link>
                            </p>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}
