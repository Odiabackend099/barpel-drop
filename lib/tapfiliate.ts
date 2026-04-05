/**
 * Tapfiliate REST API client for server-side conversion tracking.
 *
 * Used by the Dodo webhook handler to record conversions when
 * affiliate-referred customers subscribe. All calls are best-effort:
 * failures are logged but never block the payment flow.
 *
 * Docs: https://tapfiliate.com/docs/rest/
 */

const TAPFILIATE_API_BASE = "https://api.tapfiliate.com/1.6";
const TAPFILIATE_TIMEOUT_MS = 5_000;

interface TapfiliateConversionPayload {
  /** Tapfiliate customer_id — we use the Barpel merchant_id */
  customer_id: string;
  /** Unique conversion ID — prevents duplicates */
  external_id: string;
  /** Dollar amount of the transaction */
  amount: number;
}

interface TapfiliateCustomerPayload {
  /** Click ID from Tapfiliate JS tracking (stored in cookie) */
  click_id: string;
  /** Our internal merchant/user ID */
  customer_id: string;
  /** Customer lifecycle status */
  status: "trial" | "new";
}

interface TapfiliateResult {
  ok: boolean;
  error?: string;
}

function getApiKey(): string | undefined {
  return process.env.TAPFILIATE_API_KEY;
}

async function tapfiliateRequest(
  path: string,
  body: Record<string, unknown>,
): Promise<TapfiliateResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { ok: false, error: "TAPFILIATE_API_KEY not configured" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TAPFILIATE_TIMEOUT_MS);

  try {
    const res = await fetch(`${TAPFILIATE_API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Tapfiliate ${res.status}: ${text}` };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Record a conversion in Tapfiliate.
 *
 * For SaaS with recurring/lifetime commissions, we track by customer_id
 * (merchant_id). Tapfiliate auto-attributes the conversion to the original
 * referring affiliate. The external_id must be unique per conversion.
 */
export async function createConversion(
  payload: TapfiliateConversionPayload,
): Promise<TapfiliateResult> {
  if (!payload.customer_id || !payload.external_id || payload.amount <= 0) {
    return { ok: false, error: "Invalid conversion payload" };
  }

  return tapfiliateRequest("/conversions/", {
    customer_id: payload.customer_id,
    external_id: payload.external_id,
    amount: payload.amount,
  });
}

/**
 * Register a customer in Tapfiliate.
 *
 * Called during signup when a click_id is available from the Tapfiliate JS
 * tracking cookie. Links the customer to the referring affiliate.
 */
export async function createCustomer(
  payload: TapfiliateCustomerPayload,
): Promise<TapfiliateResult> {
  if (!payload.click_id || !payload.customer_id) {
    return { ok: false, error: "Invalid customer payload" };
  }

  return tapfiliateRequest("/customers/", {
    click_id: payload.click_id,
    customer_id: payload.customer_id,
    status: payload.status,
  });
}
