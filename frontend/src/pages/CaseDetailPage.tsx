import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatSavedAt, getCase } from "../api/cases";
import type { CaseDetail } from "../types";
import { AnalysisResult } from "../components/AnalysisResult";
import { AppLayout } from "../components/AppLayout";

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
        <AppLayout>
                <Link to="/cases" className="back-link">
                    ← Case history
                </Link>

                {error && <p role="alert">{error}</p>}

                {!caseDetail && !error && <p className="case-empty">Loading case…</p>}

                {caseDetail && (
                    <>
                        {/* The result header below carries the case type, so the saved
                            title would only repeat it — show the run's provenance instead. */}
                        <p className="case-meta detail-meta">
                            Analyzed {formatSavedAt(caseDetail.created_at)}
                            {caseDetail.filenames.length > 0 &&
                                ` · ${caseDetail.filenames.join(", ")}`}
                        </p>
                        <AnalysisResult analysis={caseDetail.analysis} caseId={caseDetail.id} />
                    </>
                )}
        </AppLayout>
    );
}
