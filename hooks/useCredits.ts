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
  const [flwPlan, setFlwPlan] = useState<string | null>(null);
  const [flwSubscriptionId, setFlwSubscriptionId] = useState<string | null>(null);
  const [planStatus, setPlanStatus] = useState<string | null>(null);
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
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        userIdRef.current = user.id;

        const { data, error: dbError } = await supabase
          .from("merchants")
          .select("credit_balance, flw_plan, flw_subscription_id, plan_status")
          .eq("user_id", user.id)
          .single();

        if (dbError) throw dbError;

        if (data) {
          setBalance(data.credit_balance ?? 0);
          setFlwPlan(data.flw_plan ?? null);
          setFlwSubscriptionId(data.flw_subscription_id ?? null);
          setPlanStatus(data.plan_status ?? null);
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
            if ("flw_plan" in row) setFlwPlan((row.flw_plan as string) ?? null);
            if ("flw_subscription_id" in row) setFlwSubscriptionId((row.flw_subscription_id as string) ?? null);
            if ("plan_status" in row) setPlanStatus((row.plan_status as string) ?? null);
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

  return { balance, balanceMinutes, balanceSeconds, credits, totalCapacity, usagePercent, transactions, usageData, loading, refreshBalance, flwPlan, flwSubscriptionId, planStatus };
}
