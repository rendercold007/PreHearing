import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { useAuth } from "../auth/AuthContext";
import { PLAN_CARDS } from "../data/plans";
import {
    createCheckout,
    fetchBillingStatus,
    openCheckout,
    type BillingStatus,
    type Plan,
} from "../api/billing";
import {
    btnPrimary,
    btnSecondary,
    dangerAlert,
    pageLede,
    pageTitle,
    pricingAmount,
    pricingCadence,
    pricingCard,
    pricingCardCurrent,
    pricingBadge,
    pricingFeatureItem,
    pricingFeatures,
    pricingGrid,
    pricingName,
    pricingPrice,
    pricingQuota,
} from "../ui";

export function PricingPage() {
    const { email } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState<BillingStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState<Plan | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    function loadStatus() {
        fetchBillingStatus()
            .then(setStatus)
            .catch((err) =>
                setError(err instanceof Error ? err.message : "Could not load your plan."),
            );
    }

    useEffect(loadStatus, []);

    async function handleUpgrade(plan: Plan) {
        setError(null);
        setNotice(null);
        setPending(plan);
        try {
            const checkout = await createCheckout(plan);
            openCheckout(checkout, {
                email: email ?? undefined,
                onSuccess: () => {
                    setNotice(
                        "Payment received — your plan is activating. This can take a few seconds.",
                    );
                    setPending(null);
                    // The webhook activates the subscription server-side; give it a
                    // moment, then re-read status so the card flips to "Current plan".
                    setTimeout(loadStatus, 4000);
                },
                onDismiss: () => setPending(null),
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not start checkout.");
            setPending(null);
        }
    }

    const currentPlan = status?.plan ?? "free";

    return (
        <AppLayout>
            <h1 className={pageTitle}>Plans &amp; pricing</h1>
            <p className={pageLede}>
                {status
                    ? `You're on the ${currentPlan} plan — ${status.used}/${status.limit} analyses used this month.`
                    : "Choose the plan that fits your caseload."}
            </p>

            {status && !status.billing_enabled && (
                <p role="alert" className={dangerAlert}>Billing isn't configured on this environment yet.</p>
            )}
            {error && <p role="alert" className={dangerAlert}>{error}</p>}
            {notice && (
                <p className="rounded-card border border-line-hover bg-accent-soft px-4 py-3 text-fg">{notice}</p>
            )}

            <div className={pricingGrid}>
                {PLAN_CARDS.map((planCard) => {
                    const isCurrent = planCard.id === currentPlan;
                    const isPaid = planCard.id !== "free";
                    return (
                        <section
                            key={planCard.id}
                            className={`${pricingCard}${isCurrent ? ` ${pricingCardCurrent}` : ""}`}
                        >
                            {planCard.highlight && !isCurrent && (
                                <span className={pricingBadge}>Most popular</span>
                            )}
                            <h2 className={pricingName}>{planCard.name}</h2>
                            <p className={pricingPrice}>
                                <span className={pricingAmount}>{planCard.price}</span>{" "}
                                <span className={pricingCadence}>{planCard.cadence}</span>
                            </p>
                            <p className={pricingQuota}>{planCard.quota}</p>
                            <ul className={pricingFeatures}>
                                {planCard.features.map((feature) => (
                                    <li key={feature} className={pricingFeatureItem}>{feature}</li>
                                ))}
                            </ul>
                            {isCurrent ? (
                                <button type="button" disabled className={btnSecondary}>
                                    Current plan
                                </button>
                            ) : isPaid ? (
                                <button
                                    type="button"
                                    className={btnPrimary}
                                    onClick={() => void handleUpgrade(planCard.id)}
                                    disabled={pending !== null || !status?.billing_enabled}
                                >
                                    {pending === planCard.id
                                        ? "Starting..."
                                        : `Upgrade to ${planCard.name}`}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className={btnSecondary}
                                    onClick={() => navigate("/app")}
                                >
                                    Get started
                                </button>
                            )}
                        </section>
                    );
                })}
            </div>
        </AppLayout>
    );
}
