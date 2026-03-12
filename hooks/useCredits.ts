"use client";

import { useState, useEffect, useRef } from "react";
import type { CreditTransaction } from "@/lib/mockApi";
import { createClient } from "@/lib/supabase/client";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

export function useCredits() {
  const [balance, setBalance] = useState(0);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

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

    async function fetchBalance() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      userIdRef.current = user.id;

      const { data } = await supabase
        .from("merchants")
        .select("credit_balance")
        .eq("user_id", user.id)
        .single();

      if (data) setBalance(data.credit_balance ?? 0);
      setLoading(false);
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
            setBalance((payload.new as { credit_balance: number }).credit_balance ?? 0);
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
  const usagePercent = totalCapacity > 0 ? (balance / totalCapacity) * 100 : 0;

  return { balance, balanceMinutes, balanceSeconds, totalCapacity, usagePercent, transactions, loading };
}
