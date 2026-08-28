import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchProfile, getStoredSession, updateName, type AccountProfile } from "../api/auth";
import { formatSavedAt, formatSavedDate, listCases } from "../api/cases";
import { fetchBillingStatus, type BillingStatus, type Plan } from "../api/billing";
import type { CaseSummary } from "../types";
import { useAuth } from "../auth/AuthContext";
import { Avatar } from "../components/Avatar";
import { AppLayout } from "../components/AppLayout";
import { btnPrimary, btnSecondary, dangerAlert, pageLede, pageTitle } from "../ui";

const RECENT_LIMIT = 5;

const STAT_TILE =
    "rounded-2xl border border-line bg-white/[0.02] p-5 transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-line-hover motion-reduce:hover:translate-y-0";
const STAT_LABEL = "font-mono text-[0.7rem] uppercase tracking-[0.09em] text-muted";

function PlanBadge({ plan }: { plan: Plan }) {
    if (plan === "free") {
        return (
            <span className="font-mono rounded-full border border-line px-2.5 py-1 text-[0.7rem] uppercase tracking-[0.08em] text-muted">
                Free
            </span>
        );
    }
    return (
        <span className="font-mono rounded-full bg-[linear-gradient(145deg,var(--color-accent),var(--color-coral))] px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-gold-ink">
            {plan}
        </span>
    );
}

export function ProfilePage() {
    const { email, name, plan, isPaid, setName, logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<AccountProfile | null>(null);
    const [cases, setCases] = useState<CaseSummary[] | null>(null);
    const [billing, setBilling] = useState<BillingStatus | null>(null);
    const [billingReady, setBillingReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        const session = getStoredSession();
        if (!session) return;

        fetchProfile(session.token)
            .then(setProfile)
            .catch((err) =>
                setError(err instanceof Error ? err.message : "Could not load your account."),
            );
        listCases()
            .then(setCases)
            .catch(() => setCases([]));
        fetchBillingStatus()
            .then(setBilling)
            .catch(() => setBilling(null))
            .finally(() => setBillingReady(true));
    }, []);

    function startEditing() {
        setDraft(name);
        setSaveError(null);
        setEditing(true);
    }

    async function handleSave() {
        const session = getStoredSession();
        if (!session) return;

        setSaving(true);
        setSaveError(null);
        try {
            const updated = await updateName(session.token, draft);
            setName(updated.name);
            setProfile(updated);
            setEditing(false);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : "Your name could not be saved.");
        } finally {
            setSaving(false);
        }
    }

    function handleLogout() {
        logout();
        navigate("/");
    }

    const usedPct =
        billing && billing.limit > 0 ? Math.min(100, Math.round((billing.used / billing.limit) * 100)) : 0;

    return (
        <AppLayout>
            <Link
                to="/app"
                className="font-mono mb-3 inline-flex items-center gap-1.5 text-[0.82rem] text-muted no-underline transition-colors hover:text-accent"
            >
                <span aria-hidden="true">←</span> Back to app
            </Link>
            <h1 className={pageTitle}>Profile</h1>
            <p className={pageLede}>Your account, your usage, and everything it holds.</p>

            {error && <p role="alert" className={dangerAlert}>{error}</p>}

            {/* Identity */}
            <section className="mb-4 overflow-hidden rounded-2xl border border-line bg-[radial-gradient(60%_130%_at_100%_0%,rgba(227,178,79,0.1),transparent_60%),rgba(255,255,255,0.02)] p-7">
                {editing ? (
                    <div className="flex flex-wrap items-start gap-5">
                        <Avatar email={email ?? ""} name={name} size="lg" paid={isPaid} />
                        <div className="min-w-0 flex-1">
                            <label className={`${STAT_LABEL} mb-1.5 block`} htmlFor="profile-name">
                                Display name
                            </label>
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    id="profile-name"
                                    className="min-w-[180px] flex-1 rounded-card border border-line bg-canvas px-3 py-[0.55rem] text-[0.95rem] text-fg focus:border-line-hover focus:outline-none"
                                    type="text"
                                    value={draft}
                                    maxLength={80}
                                    autoFocus
                                    placeholder="e.g. Aditi Rao"
                                    onChange={(event) => setDraft(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") void handleSave();
                                        if (event.key === "Escape") setEditing(false);
                                    }}
                                />
                                <button type="button" className={btnPrimary} onClick={() => void handleSave()} disabled={saving}>
                                    {saving ? "Saving…" : "Save"}
                                </button>
                                <button type="button" className={btnSecondary} onClick={() => setEditing(false)} disabled={saving}>
                                    Cancel
                                </button>
                            </div>
                            {saveError && <p role="alert" className={dangerAlert}>{saveError}</p>}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center gap-5">
                        <Avatar email={email ?? ""} name={name} size="lg" paid={isPaid} />
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="m-0 font-display text-[1.6rem] font-bold leading-tight">
                                    {name || <span className="font-medium text-muted">No name set</span>}
                                </h2>
                                <PlanBadge plan={plan} />
                            </div>
                            <p className="mt-1.5 mb-0 text-[0.95rem] text-muted">{email}</p>
                        </div>
                        <button type="button" className={`${btnSecondary} shrink-0`} onClick={startEditing}>
                            {name ? "Edit name" : "Add name"}
                        </button>
                    </div>
                )}
            </section>

            {/* Stat tiles */}
            <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className={STAT_TILE}>
                    <p className={STAT_LABEL}>Saved cases</p>
                    <p className="mt-2 mb-0 font-display text-[1.9rem] font-bold leading-none">
                        {cases === null ? "—" : cases.length}
                    </p>
                </div>

                <div className={STAT_TILE}>
                    <p className={STAT_LABEL}>This month</p>
                    <p className="mt-2 mb-0 font-display text-[1.4rem] font-bold leading-none">
                        {billing ? `${billing.used} / ${billing.limit}` : billingReady ? "—" : "…"}
                    </p>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-coral),var(--color-accent))] transition-[width] duration-500 motion-reduce:transition-none"
                            style={{ width: `${usedPct}%` }}
                        />
                    </div>
                    <p className="font-mono mt-1.5 mb-0 text-[0.7rem] text-muted">
                        {billing ? `${billing.remaining} left` : billingReady ? "unavailable" : "loading…"}
                    </p>
                </div>

                <div className={STAT_TILE}>
                    <p className={STAT_LABEL}>Plan</p>
                    <p className="mt-2 mb-0 font-display text-[1.9rem] font-bold capitalize leading-none">{plan}</p>
                    <Link to="/pricing" className="font-mono mt-2 inline-block text-[0.72rem] text-accent hover:underline">
                        {isPaid ? "Manage →" : "Upgrade →"}
                    </Link>
                </div>

                <div className={STAT_TILE}>
                    <p className={STAT_LABEL}>Member since</p>
                    <p className="mt-2 mb-0 font-display text-[1.15rem] font-semibold leading-tight">
                        {profile ? formatSavedDate(profile.created_at) : "—"}
                    </p>
                    <p className="font-mono mt-1.5 mb-0 text-[0.7rem] text-muted">Private to your account</p>
                </div>
            </div>

            {/* Case history */}
            <section className="mb-4 rounded-2xl border border-line bg-white/[0.02] p-7">
                <div className="mb-4 flex items-baseline justify-between gap-4">
                    <h2 className="m-0 font-display text-[1.2rem] font-semibold">Recent cases</h2>
                    {cases !== null && cases.length > RECENT_LIMIT && (
                        <Link to="/cases" className="font-mono text-[0.78rem] text-accent hover:underline">
                            View all {cases.length} →
                        </Link>
                    )}
                </div>

                {cases === null && <p className="text-muted">Loading your cases…</p>}

                {cases !== null && cases.length === 0 && (
                    <p className="text-muted">
                        No saved cases yet.{" "}
                        <Link to="/app" className="text-accent hover:underline">Analyze a case</Link> and it will
                        appear here.
                    </p>
                )}

                {cases !== null && cases.length > 0 && (
                    <ul className="m-0 flex list-none flex-col gap-2 p-0">
                        {cases.slice(0, RECENT_LIMIT).map((item) => (
                            <li key={item.id}>
                                <Link
                                    to={`/cases/${item.id}`}
                                    className="group flex items-center gap-3.5 rounded-xl border border-line bg-white/[0.015] px-4 py-3 no-underline transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-line-hover hover:bg-surface-hover motion-reduce:hover:translate-y-0"
                                >
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/[0.1] text-accent">
                                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                                            <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                                        </svg>
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="m-0 truncate font-display text-[0.95rem] font-semibold text-fg">{item.title}</p>
                                        <p className="font-mono m-0 truncate text-[0.72rem] text-muted">
                                            {formatSavedAt(item.created_at)}
                                            {item.filenames.length > 0 && ` · ${item.filenames.join(", ")}`}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-muted transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-accent">→</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Account footer */}
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white/[0.02] px-7 py-5">
                <p className="m-0 max-w-[520px] text-[0.85rem] text-muted">
                    Your uploaded documents are read in memory and never retained. Saved analyses stay in your
                    case history until you delete them.
                </p>
                <button type="button" className={`${btnSecondary} shrink-0`} onClick={handleLogout}>
                    Sign out
                </button>
            </section>
        </AppLayout>
    );
}
