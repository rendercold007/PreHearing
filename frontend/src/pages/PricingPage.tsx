import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { useAuth } from "../auth/AuthContext";
import {
    createCheckout,
    fetchBillingStatus,
    openCheckout,
    type BillingStatus,
    type Plan,
} from "../api/billing";

interface PlanCard {
    id: Plan;
    name: string;
    price: string;
    cadence: string;
    quota: string;
    features: string[];
}

const PLANS: PlanCard[] = [
    {
        id: "free",
        name: "Free",
        price: "\u20B90",
        cadence: "forever",
        quota: "2 analyses / month",
        features: ["Full 7-stage analysis", "Case history", "PDF & Word export"],
    },
    {
        id: "pro",
        name: "Pro",
        price: "\u20B9599",
        cadence: "per month",
        quota: "30 analyses / month",
        features: ["Everything in Free", "30 analyses each month", "Priority support"],
    },
    {
        id: "plus",
        name: "Plus",
        price: "\u20B91,199",
        cadence: "per month",
        quota: "75 analyses / month",
        features: ["Everything in Pro", "75 analyses each month", "Highest monthly quota"],
    },
];

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
                        "Payment received \u2014 your plan is activating. This can take a few seconds.",
                    );
                    setPending(null);
                    // The webhook activates the subscription server-si
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
            <h1 className="page-title">Plans &amp; pricing</h1>
            <p className="page-lede">
                {status
                    ? `You're on the ${currentPlan} plan \u2014 ${status.used}/${status.limit} analyses used this month.`
                    : "Choose the plan that fits your caseload."}
            </p>

            {status && !status.billing_enabled && (
                <p role="alert">Billing isn't configured on this environment yet.</p>
            )}
            {error && <p role="alert">{error}</p>}
            {notice && <p className="pricing-notice">{notice}</p>}

            <div className="pricing-grid">
                {PLANS.map((planCard) => {
                    const isCurrent = planCard.id === currentPlan;
                    const isPaid = planCard.id !== "free";
                    return (
                        <section
                            key={planCard.id}
                            className={`pricing-card${isCurrent ? " pricing-card-current" : ""}`}
                        >
                            <h2 className="pricing-name">{planCard.name}</h2>
                            <p className="pricing-price">
                                <span className="pricing-amount">{planCard.price}</span>{" "}
                                <span className="pricing-cadence">{planCard.cadence}</span>
                            </p>
                            <p className="pricing-quota">{planCard.quota}</p>
                            <ul className="pricing-features">
                                {planCard.features.map((feature) => (
                                    <li key={feature}>{feature}</li>
                                ))}
                            </ul>
                            {isCurrent ? (
                                <button type="button" disabled className="secondary-button">
                                    Current plan
                                </button>
                            ) : isPaid ? (
                                <button
                                    type="button"
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
                                    className="secondary-button"
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