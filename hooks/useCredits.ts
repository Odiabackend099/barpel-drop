"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CreditTransaction } from "@/lib/mockApi";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

export function useCredits() {
  const [balance, setBalance] = useState(0);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [usageData, setUsageData] = useState<{ date: string; credits: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [planStatus, setPlanStatus] = useState<string | null>(null);
  const [dodoPlan, setDodoPlan] = useState<string | null>(null);
  const [dodoSubscriptionId, setDodoSubscriptionId] = useState<string | null>(null);
  const [dodoCustomerId, setDodoCustomerId] = useState<string | null>(null);
  const [shopifyPlan, setShopifyPlan] = useState<string | null>(null);
  const [shopifySubscriptionId, setShopifySubscriptionId] = useState<string | null>(null);
  const [shopifyBillingCycle, setShopifyBillingCycle] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const refreshBalance = useCallback(async () => {
    const supabase = supabaseRef.current;
    if (!supabase || !userIdRef.current) return;
    const { data } = await supabase
      .from("merchants")
      .select("credit_balance")
      .eq("user_id", userIdRef.current)
      .single();
    if (data) setBalance(data.credit_balance ?? 0);
  }, []);

  useEffect(() => {
    if (useMock) {
      // Dynamic import so mockApi is never imported at module level in production
      import("@/lib/mockApi").then(({ mockMerchant, mockTransactions }) => {
        setBalance(mockMerchant.credits_remaining_secs);
        setTotalCapacity(mockMerchant.credits_total_secs);
        setTransactions(mockTransactions);
        setLoading(false);
      });
      return;
    }

    const supabase = createClient();
    supabaseRef.current = supabase;

    async function fetchBalance() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          setLoading(false);
          return;
        }
        const user = session.user;
        userIdRef.current = user.id;

        const { data, error: dbError } = await supabase
          .from("merchants")
          .select("credit_balance, plan_status, dodo_plan, dodo_subscription_id, dodo_customer_id, shopify_plan, shopify_subscription_id, shopify_billing_cycle")
          .eq("user_id", user.id)
          .single();

        if (dbError) throw dbError;

        if (data) {
          setBalance(data.credit_balance ?? 0);
          setPlanStatus(data.plan_status ?? null);
          setDodoPlan(data.dodo_plan ?? null);
          setDodoSubscriptionId(data.dodo_subscription_id ?? null);
          setDodoCustomerId(data.dodo_customer_id ?? null);
          setShopifyPlan(data.shopify_plan ?? null);
          setShopifySubscriptionId(data.shopify_subscription_id ?? null);
          setShopifyBillingCycle(data.shopify_billing_cycle ?? null);
        }
      } catch (err) {
        console.error("[useCredits] Failed to fetch balance:", err);
        toast.error("Failed to load credit balance. Please try refreshing.");
      } finally {
        setLoading(false);
      }

      // Fetch usage chart data
      fetch("/api/credits/usage-chart")
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d?.usage) setUsageData(d.usage); })
        .catch((err) => {
          console.error("[useCredits] Failed to fetch usage chart:", err);
          toast.error("Failed to load usage data.");
        });
    }

    fetchBalance();

    // Realtime subscription — credit updates within 2 seconds of a call ending
    const channel = supabase
      .channel("credit-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "merchants",
        },
        (payload) => {
          if (payload.new && userIdRef.current && payload.new.user_id === userIdRef.current) {
            const row = payload.new as Record<string, unknown>;
            setBalance((row.credit_balance as number) ?? 0);
            if ("plan_status" in row) setPlanStatus((row.plan_status as string) ?? null);
            if ("dodo_plan" in row) setDodoPlan((row.dodo_plan as string) ?? null);
            if ("dodo_subscription_id" in row) setDodoSubscriptionId((row.dodo_subscription_id as string) ?? null);
            if ("dodo_customer_id" in row) setDodoCustomerId((row.dodo_customer_id as string) ?? null);
            if ("shopify_plan" in row) setShopifyPlan((row.shopify_plan as string) ?? null);
            if ("shopify_subscription_id" in row) setShopifySubscriptionId((row.shopify_subscription_id as string) ?? null);
            if ("shopify_billing_cycle" in row) setShopifyBillingCycle((row.shopify_billing_cycle as string) ?? null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const balanceMinutes = Math.floor(balance / 60);
  const balanceSeconds = balance % 60;
  const credits = Math.floor(balance / 60);
  const usagePercent = totalCapacity > 0 ? (balance / totalCapacity) * 100 : 0;

  return { balance, balanceMinutes, balanceSeconds, credits, totalCapacity, usagePercent, transactions, usageData, loading, refreshBalance, planStatus, dodoPlan, dodoSubscriptionId, dodoCustomerId, shopifyPlan, shopifySubscriptionId, shopifyBillingCycle };
}
