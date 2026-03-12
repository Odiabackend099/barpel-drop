import { z } from "zod";

/**
 * Validates all required environment variables at startup.
 * Call this in API routes or server-side code to fail fast
 * if any required env var is missing.
 *
 * Variable names align with spec Part Six (B-12).
 */

const serverSchema = z.object({
  // Supabase
  SUPABASE_SERVICE_KEY: z.string().min(1),

  // Vapi (renamed from VAPI_API_KEY / VAPI_SECRET per spec Part Six)
  VAPI_PRIVATE_KEY: z.string().min(1),
  VAPI_WEBHOOK_SECRET: z.string().min(1),

  // Twilio — SUBACCOUNT credentials only (renamed from TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)
  TWILIO_SUBACCOUNT_SID: z.string().min(1),
  TWILIO_SUBACCOUNT_AUTH_TOKEN: z.string().min(1),
  // Optional — UK/US address SIDs for number provisioning (may be managed manually)
  TWILIO_UK_ADDRESS_SID: z.string().min(1).optional(),
  TWILIO_US_ADDRESS_SID: z.string().min(1).optional(),

  // Shopify (renamed from SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET per spec Part Six)
  SHOPIFY_API_KEY: z.string().min(1),
  SHOPIFY_API_SECRET: z.string().min(1),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),

  // AfterShip (optional for now per spec)
  AFTERSHIP_API_KEY: z.string().min(1).optional(),

  // App
  NEXT_PUBLIC_BASE_URL: z.string().url(),

  // Cron — must be non-empty to prevent the undefined === undefined bypass
  CRON_SECRET: z.string().min(1),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_BASE_URL: z.string().url(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_VAPI_PUBLIC_KEY: z.string().min(1),
  // Optional — controls mock API in local dev only
  NEXT_PUBLIC_USE_MOCK_API: z.string().optional().default("false"),
  // Optional — monitoring
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

let _serverEnv: ServerEnv | null = null;

/** Returns validated server env vars. Throws on first call if any are missing. */
export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv;
  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Missing or invalid environment variables: ${missing}`);
  }
  _serverEnv = result.data;
  return _serverEnv;
}

/** Validates client-side env vars (safe to call at build time). */
export function validateClientEnv() {
  return clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_VAPI_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,
    NEXT_PUBLIC_USE_MOCK_API: process.env.NEXT_PUBLIC_USE_MOCK_API,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  });
}
