"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check, Loader2 } from "lucide-react";

/**
 * /dashboard/billing/success
 *
 * Post-checkout return page for Dodo Payments redirect flow.
 * Dodo redirects here after payment; the webhook fires async to grant credits.
 *
 * Strategy:
 * 1. On mount: compare current credit_balance against pre_checkout_balance from sessionStorage.
 *    If already higher → webhook already fired before we loaded → show success immediately.
 * 2. Subscribe to Supabase Realtime on the merchants row.
 *    On balance increase or plan_status = 'active' → show success.
 * 3. Fallback after 30s → show "processing" message (credits will appear within minutes).
 *
 * If ?from=onboarding → redirect to /onboarding?step=4 after success.
 */
function SuccessContent() {
  const router      = useRouter();
  // Check if this checkout was initiated from onboarding (set in sessionStorage before redirect)
  const fromOnboarding = typeof window !== "undefined"
    && sessionStorage.getItem("dodo_return_context") === "onboarding";

  const [status, setStatus] = useState<"waiting" | "success" | "timeout">("waiting");
  const [planName, setPlanName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: merchant } = await supabase
        .from("merchants")
        .select("credit_balance, plan_status, dodo_plan")
        .eq("user_id", user.id)
        .single();

      if (!merchant) return;

      const preCheckoutBalance = Number(
        sessionStorage.getItem("pre_checkout_balance") ?? "-1"
      );

      // Check if webhook already fired before this page loaded
      if (merchant.credit_balance > preCheckoutBalance && merchant.plan_status === "active") {
        sessionStorage.removeItem("pre_checkout_balance");
        sessionStorage.removeItem("dodo_return_context");
        setPlanName(merchant.dodo_plan);
        setStatus("success");
        return;
      }

      // Subscribe to Realtime changes on this merchant's row
      channel = supabase
        .channel("dodo-success-check")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "merchants", filter: `user_id=eq.${user.id}` },
          (payload) => {
            const row = payload.new as Record<string, unknown>;
            const newBalance = row.credit_balance as number;
            const newStatus  = row.plan_status as string;
            if (newBalance > preCheckoutBalance && newStatus === "active") {
              sessionStorage.removeItem("pre_checkout_balance");
              sessionStorage.removeItem("dodo_return_context");
              setPlanName(row.dodo_plan as string ?? null);
              setStatus("success");
            }
          }
        )
        .subscribe();

      // 30-second fallback
      timeoutId = setTimeout(() => {
        setStatus("timeout");
      }, 30_000);
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
      clearTimeout(timeoutId);
    };
  }, []);

  // After success, redirect onboarding flow
  useEffect(() => {
    if (status === "success" && fromOnboarding) {
      const t = setTimeout(() => {
        router.push("/onboarding?step=4");
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [status, fromOnboarding, router]);

  if (status === "success") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-[#C8F0E8] rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-[#00A99D]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1B2A4A] mb-2">Plan Activated!</h1>
          {planName && (
            <p className="text-[#4A7A6D] mb-1 capitalize">
              Your <strong>{planName}</strong> plan is now active.
            </p>
          )}
          <p className="text-sm text-muted-foreground mb-6">
            Credits have been added to your account.
          </p>
          {fromOnboarding ? (
            <p className="text-sm text-[#00A99D]">Continuing setup...</p>
          ) : (
            <button
              onClick={() => router.push("/dashboard/billing")}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#00A99D] to-[#7DD9C0] text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm"
            >
              Go to Billing
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === "timeout") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-[#F0F9F8] rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-[#00A99D] animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-[#1B2A4A] mb-2">Payment Received</h1>
          <p className="text-[#4A7A6D] mb-6">
            Your payment is being processed. Credits will appear in your account within a few
            minutes. You can close this page.
          </p>
          <button
            onClick={() => router.push("/dashboard/billing")}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#00A99D] to-[#7DD9C0] text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm"
          >
            Go to Billing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-16 h-16 bg-[#F0F9F8] rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-[#00A99D] animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-[#1B2A4A] mb-2">Activating your plan...</h1>
        <p className="text-sm text-muted-foreground">
          Confirming payment with Dodo Payments. This usually takes a few seconds.
        </p>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return <SuccessContent />;
}
