/**
 * PostHog analytics wrapper.
 * Provides type-safe event tracking for key business events.
 * Only initialises in browser with a valid API key.
 */

import posthog from "posthog-js";

let initialised = false;

/** Initialise PostHog (call once in a client provider). */
export function initAnalytics() {
  if (initialised) return;
  if (typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
  if (!key) return;

  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
  });

  initialised = true;
}

type EventMap = {
  signup: { method: "google" | "magic_link" };
  shopify_connected: { merchant_id: string };
  credits_purchased: { package_id: string; amount_cents: number };
  call_completed: { duration_seconds: number; call_type: string; sentiment: string };
  onboarding_step: { step: number; action: "entered" | "completed" | "skipped" };
  persona_saved: Record<string, never>;
};

/** Track a typed business event. */
export function track<E extends keyof EventMap>(event: E, properties: EventMap[E]) {
  if (typeof window === "undefined") return;
  posthog.capture(event, properties);
}

/** Identify a user after login. */
export function identifyUser(userId: string, traits?: Record<string, string>) {
  if (typeof window === "undefined") return;
  posthog.identify(userId, traits);
}
