import { clearSession, getStoredSession } from "./auth";
import { API_BASE_URL } from "./config";

export type Plan = "free" | "pro" | "plus";

export interface BillingStatus {
    plan: Plan;
    limit: number;
    used: number;
    remaining: number;
    billing_enabled: boolean;
}

export interface CheckoutResponse {
    subscription_id: string;
    key_id: string;
    plan: string;
}

async function request(path: string, init?: RequestInit): Promise<Response> {
    const session = getStoredSession();
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
            ...(session ? { Authorization: `Bearer ${session.token}`} : {}),
            ...(init?.body ? {"Content-Type": "application/json"}: {}),
        },
    });

    if (response.status === 401){
        clearSession();
        throw new Error("Your session has expired. Please log in again.");
    }
    if(!response.ok){
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.detail ?? `Request failed with status ${response.status}`);  
    }
    return response;
}

export async function fetchBillingStatus(): Promise<BillingStatus> {
    return (await request("/billing/status")).json();
}

export async function createCheckout(plan: Plan): Promise<CheckoutResponse> {
    return(
        await request("/billing/checkout", {
            method: "POST",
            body: JSON.stringify({plan}),
        })
    ).json();
}

interface RazorpayOptions {
    key: string;
    subscription_id: string;
    name: string;
    description?: string;
    prefill?: {email?: string};
    theme?: {color?: string};
    handler?: () => void;
    modal?: {ondismiss?: () => void };
}

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => {open: () => void};
    }
}

export function openCheckout(
    checkout: CheckoutResponse,
    opts: { email?: string; onSuccess: () => void; onDismiss?: () => void },
): void {
    const rzp = new window.Razorpay({
        key: checkout.key_id,
        subscription_id: checkout.subscription_id,
        name: "Casper",
        description: `Casper ${checkout.plan} plan`,
        prefill: opts.email ? { email: opts.email } : undefined,
        theme: { color: "#c9a24e" }, // adjust to your gold accent
        handler: () => opts.onSuccess(),
        modal: { ondismiss: opts.onDismiss },
    });
    rzp.open();
}