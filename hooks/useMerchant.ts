"use client";

import { useState, useEffect, useRef } from "react";
import type { MerchantData } from "@/lib/mockApi";
import { createClient } from "@/lib/supabase/client";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

export function useMerchant() {
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (useMock) {
      import("@/lib/mockApi").then(({ mockMerchant }) => {
        setMerchant(mockMerchant);
        setLoading(false);
      });
      return;
    }

    const supabase = createClient();

    async function fetchMerchant() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        userIdRef.current = user.id;

        const { data, error: dbError } = await supabase
          .from("merchants")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (dbError) throw dbError;
        setMerchant(data as MerchantData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load merchant data");
      } finally {
        setLoading(false);
      }
    }

    fetchMerchant();

    // Realtime subscription — auto-refresh when provisioning completes or merchant data changes
    const channel = supabase
      .channel("merchant-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "merchants" },
        (payload) => {
          if (payload.new && userIdRef.current && payload.new.user_id === userIdRef.current) {
            setMerchant(payload.new as MerchantData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateCustomPrompt = async (prompt: string) => {
    if (useMock) {
      setMerchant((prev) => (prev ? { ...prev, custom_prompt: prompt } : null));
      return;
    }

    const res = await fetch("/api/merchant/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ custom_prompt: prompt }),
    });
    if (!res.ok) {
      throw new Error("Failed to update AI voice prompt");
    }
    setMerchant((prev) => (prev ? { ...prev, custom_prompt: prompt } : null));
  };

  return { merchant, loading, error, updateCustomPrompt };
}
