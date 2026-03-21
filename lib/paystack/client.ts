/**
 * Thin Paystack REST API client.
 * Server-side only — never import this in client components.
 *
 * Uses fetch directly — no heavy SDK needed for the 3 endpoints we call:
 *   POST /transaction/initialize
 *   GET  /transaction/verify/:reference
 *   POST /subscription/disable
 */

const PAYSTACK_API = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Missing PAYSTACK_SECRET_KEY");
  return key;
}

function headers() {
  return {
    Authorization: `Bearer ${secretKey()}`,
    "Content-Type": "application/json",
  };
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    reference: string;
    status: string;           // 'success' | 'failed' | 'abandoned'
    amount: number;           // in subunits
    currency: string;
    customer: { email: string; customer_code: string };
    plan?: { plan_code: string };
    subscription_code?: string;
    authorization?: { reusable: boolean; authorization_code: string };
  };
}

export interface PaystackDisableResponse {
  status: boolean;
  message: string;
}

/**
 * Initialize a Paystack transaction.
 * Pass `plan` to create a subscription on first charge.
 */
export async function initializeTransaction(params: {
  email: string;
  amount: number;      // in subunits (cents for USD, kobo for NGN)
  currency: string;
  reference: string;
  plan?: string;       // plan code (PLN_xxx) — creates a subscription
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitializeResponse> {
  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paystack initialize failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<PaystackInitializeResponse>;
}

/**
 * Verify a transaction by reference.
 * Always call this server-side before granting value.
 */
export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  const res = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: headers(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paystack verify failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<PaystackVerifyResponse>;
}

/**
 * Disable (cancel) a Paystack subscription.
 * Requires the subscription code (SUB_xxx) and email_token from the customer email.
 * For self-service cancellation from the dashboard, use the management API instead.
 */
export async function disableSubscription(params: {
  code: string;         // subscription code: SUB_xxx
  token: string;        // email_token from the subscription object
}): Promise<PaystackDisableResponse> {
  const res = await fetch(`${PAYSTACK_API}/subscription/disable`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paystack disable subscription failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<PaystackDisableResponse>;
}

/**
 * Fetch a subscription by code.
 * Used to get the email_token needed to cancel.
 */
export async function getSubscription(code: string): Promise<{
  status: boolean;
  data: { subscription_code: string; email_token: string; status: string };
}> {
  const res = await fetch(`${PAYSTACK_API}/subscription/${encodeURIComponent(code)}`, {
    headers: headers(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paystack get subscription failed (${res.status}): ${text}`);
  }
  return res.json();
}
