"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

export interface Integration {
  id: string;
  platform: string;
  shop_domain: string | null;
  shop_name: string | null;
  connection_active: boolean;
  last_synced_at: string | null;
  outbound_consent_confirmed_at: string | null;
  created_at: string;
}

export function useIntegrations(merchantId?: string) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    if (useMock) {
      const { mockIntegrations } = await import("@/lib/mockApi");
      setIntegrations(mockIntegrations as Integration[]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/integrations/list");
      if (!res.ok) throw new Error("Failed to fetch integrations");
      const data = await res.json();
      setIntegrations(data.integrations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();

    if (useMock) return;

    const supabase = createClient();

    // Realtime subscription — auto-refresh when integrations change (e.g. after OAuth)
    const channel = supabase
      .channel("integration-updates")
      .on(
        "postgres_changes",
        merchantId
          ? { event: "*" as const, schema: "public", table: "integrations", filter: `merchant_id=eq.${merchantId}` }
          : { event: "*" as const, schema: "public", table: "integrations" },
        () => fetchIntegrations()
      )
      .subscribe();

    // Polling fallback for when Realtime is blocked by RLS
    // (OAuth callback uses admin client to write, which may not trigger client Realtime)
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    if (typeof window !== "undefined" && window.location.search.includes("connected=shopify")) {
      let pollCount = 0;
      pollInterval = setInterval(() => {
        pollCount++;
        fetchIntegrations();
        if (pollCount >= 10) {
          // Stop polling after 20 seconds (10 * 2s)
          if (pollInterval) clearInterval(pollInterval);
        }
      }, 2000);
    }

    return () => {
      supabase.removeChannel(channel);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [fetchIntegrations, merchantId]);

  const shopifyIntegration = integrations.find(
    (i) => i.platform === "shopify" && i.connection_active
  ) ?? null;

  const isShopifyConnected = shopifyIntegration !== null;
  const shopifyShopName = shopifyIntegration?.shop_name ?? shopifyIntegration?.shop_domain ?? null;

  return {
    integrations,
    shopifyIntegration,
    isShopifyConnected,
    shopifyShopName,
    loading,
    error,
    refetch: fetchIntegrations,
  };
}
