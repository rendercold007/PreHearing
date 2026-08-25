import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteCase, formatSavedAt, listCases } from "../api/cases";
import type { CaseSummary } from "../types";
import { AppHeader } from "../components/AppHeader";

export function CasesPage() {
    const [cases, setCases] = useState<CaseSummary[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [confirmingId, setConfirmingId] = useState<number | null>(null);

    useEffect(() => {
        listCases()
            .then(setCases)
            .catch((err) =>
                setError(err instanceof Error ? err.message : "Could not load your cases."),
            );
    }, []);

    async function handleDelete(id: number) {
        setConfirmingId(null);
        const previous = cases;
        setCases((current) => current?.filter((item) => item.id !== id) ?? null);
        try {
            await deleteCase(id);
        } catch (err) {
            setCases(previous ?? null);
            setError(err instanceof Error ? err.message : "Could not delete that case.");
        }
    }

    return (
        <main>
            <AppHeader />

            <div className="page-content">
                <h1 className="page-title">Case history</h1>

                {error && <p role="alert">{error}</p>}

                {cases === null && !error && <p className="case-empty">Loading your cases…</p>}

                {cases !== null && cases.length === 0 && (
                    <p className="case-empty">
                        No saved cases yet. <Link to="/app">Analyze a case</Link> and it will appear
                        here.
                    </p>
                )}

                {cases !== null && cases.length > 0 && (
                    <ul className="case-list">
                        {cases.map((item) => (
                            <li key={item.id} className="case-item">
                                <div className="case-item-main">
                                    <Link to={`/cases/${item.id}`} className="case-title">
                                        {item.title}
                                    </Link>
                                    <p className="case-meta">
                                        {formatSavedAt(item.created_at)}
                                        {item.filenames.length > 0 && ` · ${item.filenames.join(", ")}`}
                                        {item.warning_count > 0 &&
                                            ` · ${item.warning_count} warning${item.warning_count === 1 ? "" : "s"}`}
                                    </p>
                                </div>
                                <div className="case-actions">
                                    <Link to={`/cases/${item.id}`} className="case-action">
                                        Open
                                    </Link>
                                    {confirmingId === item.id ? (
                                        <>
                                            <button
                                                type="button"
                                                className="case-action danger"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                Confirm delete
                                            </button>
                                            <button
                                                type="button"
                                                className="case-action"
                                                onClick={() => setConfirmingId(null)}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            className="case-action danger"
                                            onClick={() => setConfirmingId(item.id)}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}
