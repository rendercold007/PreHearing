import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatSavedAt, getCase } from "../api/cases";
import type { CaseDetail } from "../types";
import { AnalysisResult } from "../components/AnalysisResult";
import { AppHeader } from "../components/AppHeader";

export function CaseDetailPage() {
    const { caseId } = useParams();
    const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const id = Number(caseId);
        if (!Number.isInteger(id)) {
            setError("That case link is not valid.");
            return;
        }
        getCase(id)
            .then(setCaseDetail)
            .catch((err) =>
                setError(err instanceof Error ? err.message : "Could not load that case."),
            );
    }, [caseId]);

    return (
        <main>
            <AppHeader />

            <div className="page-content">
                <Link to="/cases" className="back-link">
                    ← Case history
                </Link>

                {error && <p role="alert">{error}</p>}

                {!caseDetail && !error && <p className="case-empty">Loading case…</p>}

                {caseDetail && (
                    <>
                        <h1 className="page-title">{caseDetail.title}</h1>
                        <p className="case-meta">
                            Analyzed {formatSavedAt(caseDetail.created_at)}
                            {caseDetail.filenames.length > 0 &&
                                ` · ${caseDetail.filenames.join(", ")}`}
                        </p>
                        <AnalysisResult analysis={caseDetail.analysis} caseId={caseDetail.id} />
                    </>
                )}
            </div>
        </main>
    );
}
