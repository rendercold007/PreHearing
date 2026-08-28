import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteCase, formatSavedAt, listCases } from "../api/cases";
import type { CaseSummary } from "../types";
import { AppLayout } from "../components/AppLayout";
import { caseEmpty, caseMeta, caseTitle, dangerAlert, pageTitle } from "../ui";

const CASE_ACTION =
    "cursor-pointer rounded-full border border-line bg-transparent px-3 py-[0.35rem] text-[0.85rem] text-muted no-underline transition-colors hover:border-line-hover hover:text-fg";
const CASE_ACTION_DANGER =
    "cursor-pointer rounded-full border border-line bg-transparent px-3 py-[0.35rem] text-[0.85rem] text-muted no-underline transition-colors hover:border-danger hover:bg-danger-bg hover:text-danger";

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
        <AppLayout>
                <h1 className={pageTitle}>Case history</h1>

                {error && <p role="alert" className={dangerAlert}>{error}</p>}

                {cases === null && !error && <p className={caseEmpty}>Loading your cases…</p>}

                {cases !== null && cases.length === 0 && (
                    <p className={caseEmpty}>
                        No saved cases yet. <Link to="/app" className="text-accent">Analyze a case</Link> and it will appear
                        here.
                    </p>
                )}

                {cases !== null && cases.length > 0 && (
                    <ul className="m-0 mt-6 grid list-none gap-3 p-0">
                        {cases.map((item) => (
                            <li
                                key={item.id}
                                className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-surface px-5 py-4 transition-colors hover:border-line-hover hover:bg-surface-hover"
                            >
                                <div className="min-w-0">
                                    <Link to={`/cases/${item.id}`} className={caseTitle}>
                                        {item.title}
                                    </Link>
                                    <p className={caseMeta}>
                                        {formatSavedAt(item.created_at)}
                                        {item.filenames.length > 0 && ` · ${item.filenames.join(", ")}`}
                                        {item.warning_count > 0 &&
                                            ` · ${item.warning_count} warning${item.warning_count === 1 ? "" : "s"}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link to={`/cases/${item.id}`} className={CASE_ACTION}>
                                        Open
                                    </Link>
                                    {confirmingId === item.id ? (
                                        <>
                                            <button
                                                type="button"
                                                className={CASE_ACTION_DANGER}
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                Confirm delete
                                            </button>
                                            <button
                                                type="button"
                                                className={CASE_ACTION}
                                                onClick={() => setConfirmingId(null)}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            className={CASE_ACTION_DANGER}
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
        </AppLayout>
    );
}
