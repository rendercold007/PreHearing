import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchProfile, getStoredSession, updateName, type AccountProfile } from "../api/auth";
import { formatSavedAt, listCases } from "../api/cases";
import type { CaseSummary } from "../types";
import { useAuth } from "../auth/AuthContext";
import { Avatar } from "../components/Avatar";
import { AppLayout } from "../components/AppLayout";
import {
    btnPrimary,
    btnSecondary,
    caseEmpty,
    caseTitle,
    dangerAlert,
    pageLede,
    pageTitle,
    surfaceCard,
} from "../ui";

const RECENT_LIMIT = 5;

export function ProfilePage() {
    const { email, name, isPaid, setName, logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<AccountProfile | null>(null);
    const [cases, setCases] = useState<CaseSummary[] | null>(null);
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

    return (
        <AppLayout>
            <h1 className={pageTitle}>Profile</h1>
            <p className={pageLede}>Your account and what it holds.</p>

            {error && <p role="alert" className={dangerAlert}>{error}</p>}

            <section className={`${surfaceCard} mb-6 p-7`}>
                <div className="flex items-center gap-4">
                    <Avatar email={email ?? ""} name={name} size="lg" paid={isPaid} />

                    {editing ? (
                        <div className="min-w-0 flex-1">
                            <label
                                className="mb-[0.3rem] block text-[0.78rem] uppercase tracking-[0.06em] text-muted"
                                htmlFor="profile-name"
                            >
                                Display name
                            </label>
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    id="profile-name"
                                    className="min-w-[180px] flex-1 rounded-card border border-line bg-base px-3 py-[0.55rem] text-[0.95rem] text-fg focus:border-line-hover focus:outline-none"
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
                                <button
                                    type="button"
                                    className={btnSecondary}
                                    onClick={() => setEditing(false)}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>
                            {saveError && <p role="alert" className={dangerAlert}>{saveError}</p>}
                        </div>
                    ) : (
                        <div className="min-w-0">
                            <p className="m-0 text-[1.25rem] font-semibold">
                                {name || <span className="font-medium text-muted">No name set</span>}
                            </p>
                            <p className="mt-[0.15rem] mb-0 text-[0.95rem] font-medium text-fg">{email}</p>
                            <p className="mt-[0.2rem] mb-0 text-[0.88rem] text-muted">
                                {profile
                                    ? `Member since ${formatSavedAt(profile.created_at)}`
                                    : "Loading account details…"}
                            </p>
                        </div>
                    )}

                    {!editing && (
                        <button type="button" className={`${btnSecondary} ml-auto`} onClick={startEditing}>
                            {name ? "Edit name" : "Add name"}
                        </button>
                    )}
                </div>

                <dl className="my-7 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 border-y border-line py-5">
                    <div>
                        <dt className="text-[0.78rem] uppercase tracking-[0.06em] text-muted">Saved cases</dt>
                        <dd className="mt-[0.3rem] mb-0 text-[1.1rem] font-semibold">{cases === null ? "—" : cases.length}</dd>
                    </div>
                    <div>
                        <dt className="text-[0.78rem] uppercase tracking-[0.06em] text-muted">Visibility</dt>
                        <dd className="mt-[0.3rem] mb-0 text-[1.1rem] font-semibold">Private to this account</dd>
                    </div>
                </dl>

                <p className="my-4 text-[0.88rem] text-muted">
                    Your uploaded documents are read in memory and not retained. Saved analyses stay
                    in your case history until you delete them.
                </p>

                <button type="button" className={btnSecondary} onClick={handleLogout}>
                    Sign out
                </button>
            </section>

            <section className={`${surfaceCard} mb-6 p-7`}>
                <div className="mb-4 flex items-baseline justify-between gap-4">
                    <h2 className="m-0 text-[1.25rem]">Case history</h2>
                    {cases !== null && cases.length > RECENT_LIMIT && (
                        <Link to="/cases" className="text-[0.88rem] text-accent no-underline hover:underline">
                            View all {cases.length} →
                        </Link>
                    )}
                </div>

                {cases === null && <p className={caseEmpty}>Loading your cases…</p>}

                {cases !== null && cases.length === 0 && (
                    <p className={caseEmpty}>
                        No saved cases yet. <Link to="/app" className="text-accent">Analyze a case</Link> and it will appear
                        here.
                    </p>
                )}

                {cases !== null && cases.length > 0 && (
                    <ul className="m-0 grid list-none gap-[0.15rem] p-0">
                        {cases.slice(0, RECENT_LIMIT).map((item) => (
                            <li
                                key={item.id}
                                className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line py-[0.7rem] last:border-b-0"
                            >
                                <Link to={`/cases/${item.id}`} className={caseTitle}>
                                    {item.title}
                                </Link>
                                <span className="m-0 whitespace-nowrap text-[0.85rem] text-muted">{formatSavedAt(item.created_at)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </AppLayout>
    );
}
