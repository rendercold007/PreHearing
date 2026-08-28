import type { Plan } from "../api/billing";

export interface PlanCard {
    id: Plan;
    name: string;
    price: string;
    cadence: string;
    quota: string;
    features: string[];
    /** Visually featured card on the pricing displays (the "most popular" tier). */
    highlight?: boolean;
}

// SINGLE SOURCE OF TRUTH for what customers see — used by both the public landing-page
// pricing section and the in-app /pricing page. The price strings here are display copy;
// they MUST match the actual amounts configured on your Razorpay Plans (Live mode), or
// customers will be shown one price and charged another.
export const PLAN_CARDS: PlanCard[] = [
    {
        id: "free",
        name: "Free",
        price: "₹0",
        cadence: "forever",
        quota: "2 analyses / month",
        features: ["Full 7-stage analysis", "Case history", "PDF & Word export"],
    },
    {
        id: "pro",
        name: "Pro",
        price: "₹599",
        cadence: "per month",
        quota: "30 analyses / month",
        features: ["Everything in Free", "30 analyses each month", "Priority support"],
        highlight: true,
    },
    {
        id: "plus",
        name: "Plus",
        price: "₹1,199",
        cadence: "per month",
        quota: "75 analyses / month",
        features: ["Everything in Pro", "75 analyses each month", "Highest monthly quota"],
    },
];
