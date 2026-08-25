import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchProfile, getStoredSession, updateName, type AccountProfile } from "../api/auth";
import { formatSavedAt, listCases } from "../api/cases";
import type { CaseSummary } from "../types";
import { useAuth } from "../auth/AuthContext";
import { Avatar } from "../components/Avatar";
import { AppLayout } from "../components/AppLayout";

const RECENT_LIMIT = 5;

export function ProfilePage() {
    const { email, name, setName, logout } = useAuth();
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
            <h1 className="page-title">Profile</h1>
            <p className="page-lede">Your account and what it holds.</p>

            {error && <p role="alert">{error}</p>}

            <section className="profile-card">
                <div className="profile-identity">
                    <Avatar email={email ?? ""} name={name} size="lg" />

                    {editing ? (
                        <div className="profile-edit">
                            <label className="profile-edit-label" htmlFor="profile-name">
                                Display name
                            </label>
                            <div className="profile-edit-row">
                                <input
                                    id="profile-name"
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
                                <button type="button" onClick={() => void handleSave()} disabled={saving}>
                                    {saving ? "Saving…" : "Save"}
                                </button>
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => setEditing(false)}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>
                            {saveError && <p role="alert">{saveError}</p>}
                        </div>
                    ) : (
                        <div className="profile-identity-text">
                            <p className="profile-name">
                                {name || <span className="profile-name-empty">No name set</span>}
                            </p>
                            <p className="profile-email">{email}</p>
                            <p className="profile-sub">
                                {profile
                                    ? `Member since ${formatSavedAt(profile.created_at)}`
                                    : "Loading account details…"}
                            </p>
                        </div>
                    )}

                    {!editing && (
                        <button type="button" className="secondary-button profile-edit-button" onClick={startEditing}>
                            {name ? "Edit name" : "Add name"}
                        </button>
                    )}
                </div>

                <dl className="profile-facts">
                    <div>
                        <dt>Saved cases</dt>
                        <dd>{cases === null ? "—" : cases.length}</dd>
                    </div>
                    <div>
                        <dt>Visibility</dt>
                        <dd>Private to this account</dd>
                    </div>
                </dl>

                <p className="profile-note">
                    Your uploaded documents are read in memory and not retained. Saved analyses stay
                    in your case history until you delete them.
                </p>

                <button type="button" className="secondary-button" onClick={handleLogout}>
                    Sign out
                </button>
            </section>

            <section className="profile-card">
                <div className="profile-section-head">
                    <h2>Case history</h2>
                    {cases !== null && cases.length > RECENT_LIMIT && (
                        <Link to="/cases" className="profile-see-all">
                            View all {cases.length} →
                        </Link>
                    )}
                </div>

                {cases === null && <p className="case-empty">Loading your cases…</p>}

                {cases !== null && cases.length === 0 && (
                    <p className="case-empty">
                        No saved cases yet. <Link to="/app">Analyze a case</Link> and it will appear
                        here.
                    </p>
                )}

                {cases !== null && cases.length > 0 && (
                    <ul className="profile-case-list">
                        {cases.slice(0, RECENT_LIMIT).map((item) => (
                            <li key={item.id} className="profile-case-item">
                                <Link to={`/cases/${item.id}`} className="case-title">
                                    {item.title}
                                </Link>
                                <span className="case-meta">{formatSavedAt(item.created_at)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </AppLayout>
    );
}
