"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Sparkles,
  CreditCard,
  Rocket,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Phone,
} from "lucide-react";
import { BarpelLogo } from "@/components/brand/BarpelLogo";
import { createClient } from "@/lib/supabase/client";
import { CREDIT_PACKAGES } from "@/lib/constants";
import { BYOCModal } from "@/components/integrations/BYOCModal";
import confetti from "canvas-confetti";
import { track } from "@/lib/analytics";
import {
  CALL_FORWARDING_CODES,
  COUNTRY_NAMES,
  getCarriersForCountry,
  getUssdCode,
  getCancelCode,
} from "@/lib/callForwarding/ussdCodes";

const STEPS = [
  { icon: Store, label: "Business Name" },
  { icon: Sparkles, label: "Connect Store" },
  { icon: CreditCard, label: "Get Credits" },
  { icon: Phone, label: "AI Phone Line" },
  { icon: Rocket, label: "Ready!" },
];

// Hero-style card entry/exit animation
const cardEnter = {
  initial: { opacity: 0, scale: 0.96, y: 16 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 1.02, y: -16 },
};

const springTransition = {
  type: "spring" as const,
  stiffness: 360,
  damping: 30,
};

// Ghost card gradient accents per step transition
const GHOST_ACCENTS = [
  "from-[#00A99D] to-emerald-400",    // step 1 → 2
  "from-teal-400 to-cyan-400",        // step 2 → 3
  "from-purple-400 to-pink-400",      // step 3 → 4
  "from-amber-400 to-orange-400",     // step 4 → 5
];

const COUNTRIES = [
  { value: "NG", label: "Nigeria", flag: "\u{1F1F3}\u{1F1EC}" },
  { value: "GB", label: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}" },
  { value: "US", label: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
  { value: "CA", label: "Canada", flag: "\u{1F1E8}\u{1F1E6}" },
  { value: "GH", label: "Ghana", flag: "\u{1F1EC}\u{1F1ED}" },
  { value: "KE", label: "Kenya", flag: "\u{1F1F0}\u{1F1EA}" },
];

// Old FORWARDING_CODES removed — now using lib/callForwarding/ussdCodes.ts

function UssdCodeBlock({
  label,
  code,
  copied,
  onCopy,
}: {
  label: string;
  code: string;
  copied: string | null;
  onCopy: (v: string | null) => void;
}) {
  const isCopied = copied === code;
  return (
    <div>
      <p className="text-[10px] text-[#8AADA6] mb-1">{label}</p>
      <div className="flex items-center gap-2 bg-[#F0F9F8] border border-[#D0EDE8] rounded-lg px-3 py-2">
        <code className="flex-1 text-base font-mono font-bold text-navy tracking-wide">
          {code}
        </code>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            onCopy(code);
            setTimeout(() => onCopy(null), 2000);
          }}
          className="text-xs text-teal font-medium whitespace-nowrap"
        >
          {isCopied ? "\u2713 Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F0F9F8] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);

  const [businessName, setBusinessName] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(true);
  const [shopifyDenied, setShopifyDenied] = useState(false);
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [connectedShopName, setConnectedShopName] = useState("");
  const [connectingShopify, setConnectingShopify] = useState(false);

  // Step 3: credit balance from DB
  const [creditBalance, setCreditBalance] = useState(0);

  // Step 4: provisioning status
  const [provisioningStatus, setProvisioningStatus] = useState("pending");
  const [provisioningError, setProvisioningError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Step 5 tab state
  const [activeTab, setActiveTab] = useState<"A" | "B" | "C">("A");
  // Call forwarding UI state
  const [fwdCountry, setFwdCountry] = useState("");
  const [fwdCarrier, setFwdCarrier] = useState("");
  const [fwdType, setFwdType] = useState<"conditional" | "all">("conditional");
  const [fwdCopied, setFwdCopied] = useState<string | null>(null);
  // Caller ID verification state
  const [callerIdPhone, setCallerIdPhone] = useState("");
  const [callerIdLoading, setCallerIdLoading] = useState(false);
  const [callerIdCode, setCallerIdCode] = useState<string | null>(null);
  const [callerIdError, setCallerIdError] = useState("");
  // Step 4: BYOC modal
  const [byocOpen, setBYOCOpen] = useState(false);

  const [billingLoading, setBillingLoading] = useState(false);

  const supabase = createClient();

  // On mount: fetch onboarding_step from DB and jump to it; also handle shopify_denied param
  useEffect(() => {
    if (searchParams.get("shopify_denied") === "1") {
      setShopifyDenied(true);
    }
    const shopifyErrorCode = searchParams.get("shopify_error");
    if (shopifyErrorCode) {
      const messages: Record<string, string> = {
        missing_params: "Shopify returned an incomplete response. Please try again.",
        csrf_mismatch: "Session expired during Shopify authorization. Please try again.",
        shop_mismatch: "Store domain mismatch. Please try again.",
        missing_secret: "App configuration error. Contact support.",
        invalid_hmac: "Shopify signature verification failed. Please try again.",
        token_exchange_failed: "Could not get Shopify access token. Check your store domain and try again.",
        vault_store_failed: "Failed to save Shopify credentials. Please try again.",
        merchant_not_found: "Account not found. Please sign out and back in.",
        store_already_connected: "This Shopify store is already connected to another Barpel account. Disconnect it from that account first, or use a different store.",
      };
      setError(messages[shopifyErrorCode] ?? "Shopify connection failed. Please try again.");
      goToStep(2);
    }

    async function syncStep() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoadingStep(false);
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from("merchants")
        .select("id, onboarding_step, country, business_name, support_phone, credit_balance, provisioning_status, provisioning_error, onboarded_at")
        .eq("user_id", user.id)
        .single();

      if (data) {
        if (data.provisioning_status === "active" && data.onboarded_at) {
          router.replace("/dashboard");
          return;
        }

        const step = Math.min(Math.max(Number(data.onboarding_step) || 1, 1), 5);
        const resolvedStep =
          searchParams.get("shopify_denied") === "1" || searchParams.get("shopify_error")
            ? 2
            : step;
        setCurrentStep(resolvedStep);
        if (data.country) setCountry(data.country);
        if (data.business_name) setBusinessName(data.business_name);
        if (data.support_phone) setPhoneNumber(data.support_phone);
        setCreditBalance(data.credit_balance ?? 0);
        setProvisioningStatus(data.provisioning_status ?? "pending");
        setProvisioningError(data.provisioning_error ?? "");

        if (!shopifyConnected && data.id) {
          const { data: shopifyInt } = await supabase
            .from("integrations")
            .select("shop_name, connection_active")
            .eq("merchant_id", data.id)
            .eq("platform", "shopify")
            .eq("connection_active", true)
            .maybeSingle();

          if (shopifyInt) {
            setShopifyConnected(true);
            setConnectedShopName(shopifyInt.shop_name ?? "");
          }
        }
      }
      setLoadingStep(false);
    }
    syncStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Supabase Realtime subscription for provisioning updates
  useEffect(() => {
    if (!userId) return;
    const sub = createClient();
    const channel = sub
      .channel("onboarding-provisioning")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "merchants" },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const n = payload.new as any;
          if (n?.user_id !== userId) return;
          if (n.support_phone) setPhoneNumber(n.support_phone);
          if (n.provisioning_status) {
            setProvisioningStatus((prev) => {
              const order = ["pending", "provisioning", "needs_address", "failed", "active", "suspended"];
              const prevIdx = order.indexOf(prev);
              const newIdx = order.indexOf(n.provisioning_status);
              const isTerminal = ["failed", "needs_address", "active", "suspended"].includes(n.provisioning_status);
              if (isTerminal || newIdx >= prevIdx) return n.provisioning_status;
              return prev;
            });
          }
          setProvisioningError(n.provisioning_error ?? "");
        }
      )
      .subscribe();

    return () => {
      sub.removeChannel(channel);
    };
  }, [userId]);

  // Auto-advance from step 4 to step 5 when provisioning completes
  useEffect(() => {
    if (currentStep === 4 && provisioningStatus === "active" && phoneNumber) {
      const t = setTimeout(() => setCurrentStep(5), 1500);
      return () => clearTimeout(t);
    }
  }, [currentStep, provisioningStatus, phoneNumber]);

  // Fire confetti and track completion when merchant reaches the live Step 5
  useEffect(() => {
    if (currentStep === 5 && provisioningStatus === "active" && phoneNumber) {
      track("onboarding_step", { step: 5, action: "completed" });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#0d9488", "#34d399", "#ffffff"],
      });
    }
  }, [currentStep, provisioningStatus, phoneNumber]);

  // Shopify connection polling
  useEffect(() => {
    if (currentStep !== 2 || shopifyConnected || loadingStep) return;

    let merchantId: string | null = null;
    let pollCount = 0;
    const pollInterval = setInterval(async () => {
      pollCount++;

      if (!merchantId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: m } = await supabase
          .from("merchants")
          .select("id")
          .eq("user_id", user.id)
          .single();
        merchantId = m?.id ?? null;
      }

      if (merchantId) {
        const { data: shopifyInt } = await supabase
          .from("integrations")
          .select("shop_name, connection_active")
          .eq("merchant_id", merchantId)
          .eq("platform", "shopify")
          .eq("connection_active", true)
          .maybeSingle();

        if (shopifyInt) {
          setShopifyConnected(true);
          setConnectedShopName(shopifyInt.shop_name ?? "");
          clearInterval(pollInterval);
          return;
        }
      }

      if (pollCount >= 10) clearInterval(pollInterval);
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [currentStep, shopifyConnected, loadingStep, supabase]);

  // Polling fallback — if Realtime doesn't deliver within 10s, poll every 5s
  useEffect(() => {
    if (currentStep !== 4 && currentStep !== 5) return;
    const terminal = ["active", "failed", "needs_address"];
    if (terminal.includes(provisioningStatus)) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const timerId = setTimeout(() => {
      intervalId = setInterval(async () => {
        const sb = createClient();
        const {
          data: { user },
        } = await sb.auth.getUser();
        if (!user) return;
        const { data } = await sb
          .from("merchants")
          .select("support_phone, provisioning_status, provisioning_error")
          .eq("user_id", user.id)
          .single();
        if (!data) return;
        if (data.support_phone) setPhoneNumber(data.support_phone);
        setProvisioningStatus(data.provisioning_status ?? "pending");
        setProvisioningError(data.provisioning_error ?? "");
        if (terminal.includes(data.provisioning_status)) {
          if (intervalId) clearInterval(intervalId);
        }
      }, 5000);
    }, 10000);

    return () => {
      clearTimeout(timerId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentStep, provisioningStatus]);

  const saveToDb = useCallback(
    async (updates: Record<string, unknown>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("merchants")
        .update(updates)
        .eq("user_id", user.id);
    },
    [supabase]
  );

  function goToStep(step: number) {
    setCurrentStep(step);
  }

  async function handleSaveBusinessName() {
    if (!businessName.trim() || businessName.trim().length < 2) {
      setError("Business name must be at least 2 characters");
      return;
    }
    if (businessName.trim().length > 60) {
      setError("Business name must be 60 characters or less");
      return;
    }
    if (!country) {
      setError("Please select your country");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await saveToDb({
        business_name: businessName.trim(),
        country,
        onboarding_step: 2,
      });
      track("onboarding_step", { step: 1, action: "completed" });
      goToStep(2);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleConnectShopify() {
    setConnectingShopify(true);
    setError("");
    track("onboarding_step", { step: 2, action: "completed" });
    window.location.href = `/api/shopify/oauth/start?returnTo=onboarding`;
  }

  async function handleSkipShopify() {
    track("onboarding_step", { step: 2, action: "skipped" });
    await saveToDb({ onboarding_step: 3 });
    goToStep(3);
  }

  async function handleBuyCredits(packageId: string) {
    setBillingLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing/paystack/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: packageId, billing_cycle: "monthly" }),
      });
      const config = await res.json();
      if (!res.ok) {
        setError(config.error ?? "Something went wrong. Please try again.");
        setBillingLoading(false);
        return;
      }
      const PaystackPop = (await import("@paystack/inline-js")).default;
      track("onboarding_step", { step: 3, action: "completed" });
      PaystackPop.newTransaction({
        key:        config.public_key,
        accessCode: config.access_code,
        onSuccess: async () => {
          await saveToDb({ onboarding_step: 4 });
          goToStep(4);
          setBillingLoading(false);
        },
        onCancel: () => {
          setBillingLoading(false);
        },
      });
    } catch {
      setError("Network error — please check your connection and try again.");
      setBillingLoading(false);
    }
  }

  async function handleDodoBuyCredits(packageId: string) {
    setBillingLoading(true);
    setError("");
    try {
      // Save progress to DB before redirect — preserves step position on return
      await saveToDb({ onboarding_step: 3 });

      const res = await fetch("/api/billing/dodo/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: packageId, billing_cycle: "monthly" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setBillingLoading(false);
        return;
      }
      track("onboarding_step", { step: 3, action: "completed" });
      // Success page checks these flags to redirect back to onboarding on return
      sessionStorage.setItem("pre_checkout_balance", String(creditBalance));
      sessionStorage.setItem("dodo_return_context", "onboarding");
      window.location.href = data.checkout_url;
    } catch {
      setError("Network error — please check your connection and try again.");
      setBillingLoading(false);
    }
  }

  async function handleSkipBilling() {
    track("onboarding_step", { step: 3, action: "skipped" });
    await saveToDb({ onboarding_step: 4 });
    goToStep(4);
  }

  async function handleCompleteOnboarding() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding/complete", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to complete setup.");
        setSaving(false);
        return;
      }
      if (data.already_active) {
        router.push("/dashboard");
        return;
      }
      track("onboarding_step", { step: 4, action: "completed" });
      setProvisioningStatus("provisioning");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleGoToDashboard() {
    router.push("/dashboard");
  }

  function handleCopyPhone() {
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isAfrica = ["NG", "GH", "KE"].includes(country);
  const freeMinutes = Math.floor(creditBalance / 60);

  if (loadingStep) {
    return (
      <div className="min-h-screen bg-[#F0F9F8] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Ghost card accent for the two peek-behind cards
  const ghost1Accent = GHOST_ACCENTS[Math.min(currentStep - 1, GHOST_ACCENTS.length - 1)];
  const ghost2Accent = GHOST_ACCENTS[Math.min(currentStep, GHOST_ACCENTS.length - 1)];

  return (
    <div className="relative min-h-screen bg-[#F0F9F8] flex flex-col overflow-hidden">
      {/* Ambient teal orbs — very low opacity for light bg */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <motion.div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-teal-200/20"
          style={{ filter: "blur(80px)" }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-emerald-200/15"
          style={{ filter: "blur(60px)" }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 6 }}
        />
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-sm border-b border-[#D0EDE8] px-6 py-4" style={{ zIndex: 10 }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarpelLogo size={28} />
            <span className="font-display font-bold text-navy text-lg tracking-tight">Barpel</span>
          </div>
          <span className="text-xs text-[#8AADA6]">Step {currentStep} of 5</span>
        </div>
      </header>

      {/* Progress bar — liquid flowing */}
      <div className="relative bg-white/80 backdrop-blur-sm border-b border-[#D0EDE8]" style={{ zIndex: 10 }}>
        <div className="max-w-2xl mx-auto px-6 pt-4 pb-3">
          {/* Animated fill track */}
          <div className="relative h-1 bg-[#D0EDE8] rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00A99D] to-emerald-400 rounded-full"
              animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 28 }}
            />
            {/* Shimmer sweep */}
            <motion.div
              className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              animate={{ x: ["-64px", "100%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
            />
          </div>
          {/* Step dots + labels */}
          <div className="flex justify-between mt-2.5">
            {STEPS.map((step, i) => {
              const stepNum = i + 1;
              const isDone = stepNum < currentStep;
              const isActive = stepNum === currentStep;
              return (
                <div key={step.label} className="flex flex-col items-center gap-1">
                  <motion.div
                    className={`w-2 h-2 rounded-full ${
                      isDone || isActive ? "bg-[#0d9488]" : "bg-[#D0EDE8]"
                    }`}
                    animate={isActive ? {
                      scale: [1, 1.5, 1],
                      boxShadow: [
                        "0 0 0 0 rgba(13,148,136,0)",
                        "0 0 0 4px rgba(13,148,136,0.2)",
                        "0 0 0 0 rgba(13,148,136,0)",
                      ],
                    } : {}}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span className={`text-[10px] hidden sm:block ${
                    isActive ? "text-[#0d9488] font-semibold" : isDone ? "text-[#0d9488]/60" : "text-[#8AADA6]"
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step content — hero-style card stack */}
      <div className="relative flex-1 flex items-start justify-center px-6 pt-10 pb-8" style={{ zIndex: 10 }}>
        {/* Outer container gives room for ghost cards poking right and up */}
        <div className="w-full max-w-md pr-12 pt-6">
          {/* Card stack wrapper */}
          <div className="relative">

            {/* Ghost card 2 — furthest back, peeks top-right */}
            {currentStep + 1 <= 5 && (
              <motion.div
                key={`ghost2-step${currentStep}`}
                className="absolute inset-0 bg-white rounded-2xl border border-[#D0EDE8] overflow-hidden pointer-events-none"
                style={{ zIndex: 1 }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 0 }}
                animate={{ x: 56, y: -28, scale: 0.88, opacity: 0.4, rotateZ: 3 }}
                transition={springTransition}
              >
                <div className={`h-1 bg-gradient-to-r ${ghost2Accent}`} />
              </motion.div>
            )}

            {/* Ghost card 1 — one step behind, peeks top-right */}
            {currentStep < 5 && (
              <motion.div
                key={`ghost1-step${currentStep}`}
                className="absolute inset-0 bg-white rounded-2xl border border-[#D0EDE8] overflow-hidden pointer-events-none"
                style={{ zIndex: 2 }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 0 }}
                animate={{ x: 28, y: -14, scale: 0.94, opacity: 0.7, rotateZ: 1.5 }}
                transition={springTransition}
              >
                <div className={`h-1 bg-gradient-to-r ${ghost1Accent}`} />
              </motion.div>
            )}

            {/* Front card — active step, full content, sets container height */}
            <div className="relative" style={{ zIndex: 10 }}>
              <AnimatePresence mode="wait">

                {/* ─── Step 1: Business Name + Country ─── */}
                {currentStep === 1 && (
                  <motion.div key="step1" {...cardEnter} transition={springTransition}>
                    <motion.div
                      className="bg-white rounded-2xl border border-[#D0EDE8] overflow-hidden"
                      style={{ boxShadow: "0 20px 40px -8px rgba(0,0,0,0.10), 0 0 32px rgba(0,169,157,0.12)" }}
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="h-1 bg-gradient-to-r from-[#00A99D] to-emerald-400" />
                      <motion.div
                        className="p-8"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#F0F9F8] flex items-center justify-center mb-6">
                          <Store className="w-6 h-6 text-teal" />
                        </div>
                        <h2 className="font-display text-2xl font-bold text-navy mb-2 tracking-tight">
                          What&apos;s your business called?
                        </h2>
                        <p className="text-sm text-[#4A7A6D] mb-6">
                          This is how your AI agent will introduce itself on calls.
                        </p>

                        <div className="space-y-4">
                          <div>
                            <label className="text-xs text-[#8AADA6] mb-1 block font-sans">Business Name</label>
                            <input
                              type="text"
                              value={businessName}
                              onChange={(e) => setBusinessName(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleSaveBusinessName()}
                              placeholder="e.g. PowerFit Gadgets"
                              maxLength={60}
                              className="w-full px-4 py-3 rounded-xl border border-[#D0EDE8] bg-[#F0F9F8] text-navy placeholder:text-[#8AADA6] text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-colors"
                              autoFocus
                            />
                          </div>

                          <div>
                            <label className="text-xs text-[#8AADA6] mb-1 block font-sans">Country</label>
                            <select
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-[#D0EDE8] bg-[#F0F9F8] text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-colors"
                            >
                              <option value="">Select your country</option>
                              {COUNTRIES.map((c) => (
                                <option key={c.value} value={c.value}>
                                  {c.flag} {c.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

                        <button
                          onClick={handleSaveBusinessName}
                          disabled={saving || !businessName.trim() || !country}
                          className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#0d9488] text-white font-semibold text-sm hover:bg-[#0b8276] shadow-[0_4px_14px_0_rgba(13,148,136,0.25)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? "Saving..." : "Continue"}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}

                {/* ─── Step 2: Connect Store ─── */}
                {currentStep === 2 && (
                  <motion.div key="step2" {...cardEnter} transition={springTransition}>
                    <motion.div
                      className="bg-white rounded-2xl border border-[#D0EDE8] overflow-hidden"
                      style={{ boxShadow: "0 20px 40px -8px rgba(0,0,0,0.10), 0 0 32px rgba(0,169,157,0.12)" }}
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="h-1 bg-gradient-to-r from-teal-400 to-cyan-400" />
                      <motion.div
                        className="p-8"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#F0F9F8] flex items-center justify-center mb-6">
                          <Sparkles className="w-6 h-6 text-teal" />
                        </div>
                        <h2 className="font-display text-2xl font-bold text-navy mb-2 tracking-tight">
                          Connect Your Shopify Store
                        </h2>
                        <p className="text-sm text-[#4A7A6D] mb-6">
                          Log into Shopify and approve access in one click.
                        </p>

                        {shopifyConnected ? (
                          <div className="text-center py-4">
                            <div className="w-16 h-16 rounded-full bg-[#C8F0E8] flex items-center justify-center mx-auto mb-4">
                              <Check className="w-8 h-8 text-teal" />
                            </div>
                            <h3 className="font-display text-xl font-bold text-navy mb-1">
                              Connected: {connectedShopName}
                            </h3>
                            <p className="text-sm text-[#4A7A6D] mb-6">
                              Your Shopify store is linked. Your AI can now look up orders in real time.
                            </p>
                            <button
                              onClick={async () => {
                                await saveToDb({ onboarding_step: 3 });
                                goToStep(3);
                              }}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#0d9488] text-white font-semibold text-sm hover:bg-[#0b8276] shadow-[0_4px_14px_0_rgba(13,148,136,0.25)] transition-colors"
                            >
                              Continue <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            {shopifyDenied && (
                              <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                <p className="text-xs text-amber-700">
                                  You declined Shopify access. Connect now or skip and connect later from your dashboard.
                                </p>
                              </div>
                            )}

                            {error && (
                              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                                <p className="text-xs text-red-600">{error}</p>
                              </div>
                            )}

                            <p className="text-sm text-[#4A7A6D] mb-4">
                              You&apos;ll be redirected to Shopify to log in and authorize Barpel.
                            </p>

                            <button
                              onClick={handleConnectShopify}
                              disabled={connectingShopify}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#0d9488] text-white font-semibold text-sm hover:bg-[#0b8276] shadow-[0_4px_14px_0_rgba(13,148,136,0.25)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {connectingShopify ? "Connecting..." : "Connect My Shopify Store"}
                              <ArrowRight className="w-4 h-4" />
                            </button>

                            <button
                              onClick={handleSkipShopify}
                              className="mt-4 text-sm text-[#8AADA6] hover:text-navy transition-colors mx-auto block"
                            >
                              Skip for now — AI will answer calls but can&apos;t look up orders yet
                            </button>
                            <p className="text-xs text-[#8AADA6] mt-1 text-center">
                              You can connect Shopify anytime from your dashboard
                            </p>

                            <button
                              onClick={() => goToStep(1)}
                              className="mt-4 flex items-center gap-1 text-xs text-[#8AADA6] hover:text-navy transition-colors mx-auto"
                            >
                              <ArrowLeft className="w-3 h-3" /> Back
                            </button>
                          </>
                        )}
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}

                {/* ─── Step 3: Get Minutes ─── */}
                {currentStep === 3 && (
                  <motion.div key="step3" {...cardEnter} transition={springTransition}>
                    <motion.div
                      className="bg-white rounded-2xl border border-[#D0EDE8] overflow-hidden"
                      style={{ boxShadow: "0 20px 40px -8px rgba(0,0,0,0.10), 0 0 32px rgba(0,169,157,0.12)" }}
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="h-1 bg-gradient-to-r from-purple-400 to-pink-400" />
                      <motion.div
                        className="p-8"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#F0F9F8] flex items-center justify-center mb-6">
                          <CreditCard className="w-6 h-6 text-teal" />
                        </div>
                        <h2 className="font-display text-2xl font-bold text-navy mb-2 tracking-tight">
                          Get call credits
                        </h2>
                        <p className="text-sm text-[#4A7A6D] mb-6">
                          {freeMinutes > 0
                            ? `Choose a plan or start with your ${freeMinutes} free credits to try it out.`
                            : "Choose a plan to get started with AI support calls."}
                        </p>

                        {freeMinutes > 0 && (
                          <button
                            onClick={handleSkipBilling}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#0d9488] text-white font-semibold text-sm hover:bg-[#0b8276] shadow-[0_4px_14px_0_rgba(13,148,136,0.25)] transition-colors mb-2"
                          >
                            Start with {freeMinutes} free credits — no card required
                          </button>
                        )}

                        {freeMinutes > 0 && (
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-[#D0EDE8]" />
                            <span className="text-xs text-[#8AADA6]">or upgrade now</span>
                            <div className="flex-1 h-px bg-[#D0EDE8]" />
                          </div>
                        )}

                        {/* USD (International) — Dodo Payments */}
                        <p className="text-xs font-semibold text-[#8AADA6] uppercase tracking-wide mb-1">
                          Pay in USD — International Cards
                        </p>
                        <div className="space-y-3">
                          {CREDIT_PACKAGES.map((pkg) => (
                            <button
                              key={`dodo-${pkg.id}`}
                              onClick={() => handleDodoBuyCredits(pkg.id)}
                              disabled={billingLoading}
                              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors hover:bg-[#F0F9F8] disabled:opacity-50 disabled:cursor-not-allowed ${
                                "popular" in pkg && pkg.popular ? "border-teal bg-[#F0F9F8]" : "border-[#D0EDE8]"
                              }`}
                            >
                              <div>
                                <span className="font-semibold text-navy text-sm">{pkg.name}</span>
                                <span className="text-xs text-[#8AADA6] ml-2">
                                  {pkg.credits} credits &middot; ${pkg.perMin}/credit
                                </span>
                              </div>
                              <span className="font-bold text-navy">
                                ${(pkg.priceUsdCents / 100).toFixed(0)}/mo
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* NGN (Nigeria) — Paystack */}
                        {isAfrica && (
                          <>
                            <div className="flex items-center gap-3 my-4">
                              <div className="flex-1 h-px bg-[#D0EDE8]" />
                              <span className="text-xs text-[#8AADA6]">or pay in NGN</span>
                              <div className="flex-1 h-px bg-[#D0EDE8]" />
                            </div>
                            <div className="space-y-3">
                              {CREDIT_PACKAGES.map((pkg) => (
                                <button
                                  key={`pstk-${pkg.id}`}
                                  onClick={() => handleBuyCredits(pkg.id)}
                                  disabled={billingLoading}
                                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#D0EDE8] text-left transition-colors hover:bg-[#F0F9F8] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <div>
                                    <span className="font-semibold text-navy text-sm">{pkg.name}</span>
                                    <span className="text-xs text-[#8AADA6] ml-2">via Paystack</span>
                                  </div>
                                  <span className="font-bold text-navy">
                                    ${(pkg.priceUsdCents / 100).toFixed(0)}/mo
                                  </span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}


                        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

                        <button
                          onClick={() => goToStep(2)}
                          className="mt-4 flex items-center gap-1 text-xs text-[#8AADA6] hover:text-navy transition-colors mx-auto"
                        >
                          <ArrowLeft className="w-3 h-3" /> Back
                        </button>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}

                {/* ─── Step 4: AI Phone Line ─── */}
                {currentStep === 4 && (
                  <motion.div key="step4" {...cardEnter} transition={springTransition}>
                    <motion.div
                      className="bg-white rounded-2xl border border-[#D0EDE8] overflow-hidden"
                      style={{ boxShadow: "0 20px 40px -8px rgba(0,0,0,0.10), 0 0 32px rgba(0,169,157,0.12)" }}
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                      <motion.div
                        className="p-8"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#F0F9F8] flex items-center justify-center mx-auto mb-6">
                          <Phone className="w-6 h-6 text-teal" />
                        </div>

                        {(provisioningStatus === "pending" || provisioningStatus === "failed") && (
                          <>
                            <h2 className="font-display text-2xl font-bold text-navy mb-2 text-center tracking-tight">
                              Get Your AI Phone Line
                            </h2>
                            <p className="text-sm text-[#4A7A6D] mb-6 text-center">
                              Your AI is ready. Now give it a number to answer calls on.
                            </p>

                            {provisioningStatus === "failed" && (
                              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                                <p className="text-xs text-red-600 text-center">
                                  {provisioningError || "Previous setup failed."} Try again below.
                                </p>
                              </div>
                            )}

                            {error && <p className="mb-4 text-xs text-red-500 text-center">{error}</p>}

                            <button
                              onClick={handleCompleteOnboarding}
                              disabled={saving}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#0d9488] text-white font-semibold text-sm hover:bg-[#0b8276] shadow-[0_4px_14px_0_rgba(13,148,136,0.25)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Phone className="w-4 h-4" />
                              {saving ? "Setting up..." : "Get My AI Number \u2014 Free"}
                            </button>
                            <p className="text-center text-xs text-[#8AADA6] mt-1.5">
                              This uses your free credits.
                            </p>

                            <div className="flex items-center gap-3 my-5">
                              <div className="flex-1 h-px bg-[#D0EDE8]" />
                              <span className="text-xs text-[#8AADA6]">or</span>
                              <div className="flex-1 h-px bg-[#D0EDE8]" />
                            </div>

                            <p className="text-sm text-[#4A7A6D] text-center mb-2">
                              Already have a Twilio number?
                            </p>
                            <button
                              onClick={() => setBYOCOpen(true)}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-[#D0EDE8] text-[#4A7A6D] font-medium text-sm hover:bg-[#F0F9F8] transition-colors"
                            >
                              Bring My Own Number
                            </button>

                            <div className="flex items-center gap-3 my-5">
                              <div className="flex-1 h-px bg-[#D0EDE8]" />
                              <span className="text-xs text-[#8AADA6]">or</span>
                              <div className="flex-1 h-px bg-[#D0EDE8]" />
                            </div>

                            <button
                              onClick={async () => {
                                await saveToDb({ onboarding_step: 5, onboarded_at: new Date().toISOString() });
                                goToStep(5);
                              }}
                              className="text-sm text-[#8AADA6] hover:text-navy transition-colors mx-auto block"
                            >
                              Skip for now &mdash; set up from dashboard
                            </button>

                            <button
                              onClick={() => goToStep(3)}
                              className="mt-4 flex items-center gap-1 text-xs text-[#8AADA6] hover:text-navy transition-colors mx-auto"
                            >
                              <ArrowLeft className="w-3 h-3" /> Back
                            </button>
                          </>
                        )}

                        {provisioningStatus === "provisioning" && (
                          <>
                            <h2 className="font-display text-2xl font-bold text-navy mb-2 text-center tracking-tight">
                              Setting up your AI
                            </h2>
                            <div className="flex flex-col items-center gap-3 py-6">
                              <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
                              <p className="text-sm text-[#4A7A6D]">
                                Creating your AI assistant and phone line&hellip;
                              </p>
                              <p className="text-xs text-[#8AADA6]">
                                This usually takes about 30 seconds.
                              </p>
                            </div>
                          </>
                        )}

                        {provisioningStatus === "active" && phoneNumber && (
                          <div className="flex flex-col items-center gap-3 py-4">
                            <Check className="w-8 h-8 text-teal" />
                            <p className="text-sm text-[#4A7A6D]">Phone line ready!</p>
                            <button
                              onClick={() => goToStep(5)}
                              className="mt-2 flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-[#0d9488] text-white font-semibold text-sm hover:bg-[#0b8276] shadow-[0_4px_14px_0_rgba(13,148,136,0.25)] transition-colors"
                            >
                              Continue
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {provisioningStatus === "needs_address" && (
                          <>
                            <h2 className="font-display text-2xl font-bold text-navy mb-2 text-center tracking-tight">
                              Almost there!
                            </h2>
                            <div className="py-4">
                              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <p className="text-sm text-blue-700 text-center">
                                  Your UK number is being set up manually. You&apos;ll receive it within 24 hours.
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                await saveToDb({ onboarding_step: 5, onboarded_at: new Date().toISOString() });
                                goToStep(5);
                              }}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#0d9488] text-white font-semibold text-sm hover:bg-[#0b8276] shadow-[0_4px_14px_0_rgba(13,148,136,0.25)] transition-colors"
                            >
                              Continue to Dashboard
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}

                {/* ─── Step 5: Ready! ─── */}
                {currentStep === 5 && (
                  <motion.div key="step5" {...cardEnter} transition={springTransition}>
                    <motion.div
                      className="bg-white rounded-2xl border border-[#D0EDE8] overflow-hidden"
                      style={{ boxShadow: "0 20px 40px -8px rgba(0,0,0,0.10), 0 0 32px rgba(0,169,157,0.12)" }}
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
                      <motion.div
                        className="p-8"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                      >
                        <div className="w-16 h-16 rounded-full bg-[#C8F0E8] flex items-center justify-center mx-auto mb-6">
                          <Rocket className="w-8 h-8 text-teal" />
                        </div>

                        {provisioningStatus === "active" && phoneNumber ? (
                          <>
                            <h2 className="font-display text-2xl font-bold text-navy mb-2 text-center tracking-tight">
                              Your AI is live! 🎉
                            </h2>
                            <p className="text-sm text-[#4A7A6D] mb-2 text-center">
                              Call your number right now to hear it in action.
                            </p>
                            <p className="text-xs text-[#8AADA6] mb-6 text-center">
                              Share this number with your customers to start taking AI-powered calls.
                            </p>

                            <div className="bg-[#F0F9F8] rounded-xl border border-[#D0EDE8] p-4 flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center">
                                  <Phone className="w-5 h-5 text-teal" />
                                </div>
                                <div className="text-left">
                                  <p className="text-xs text-[#8AADA6]">Your AI phone number</p>
                                  <p className="font-mono font-bold text-xl text-navy">{phoneNumber}</p>
                                </div>
                              </div>
                              <button
                                onClick={handleCopyPhone}
                                className="p-2 rounded-lg hover:bg-[#D0EDE8] transition-colors"
                                title="Copy number"
                              >
                                {copied ? (
                                  <Check className="w-4 h-4 text-teal" />
                                ) : (
                                  <Copy className="w-4 h-4 text-[#8AADA6]" />
                                )}
                              </button>
                            </div>

                            {isAfrica && phoneNumber && (
                              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                <p className="text-xs text-blue-700">
                                  {phoneNumber.startsWith("+1")
                                    ? "This is your US support number. Your customers can reach you internationally. We recommend setting up call forwarding below."
                                    : "This is your international support number. We recommend setting up call forwarding below."}
                                </p>
                              </div>
                            )}

                            <div className="mb-6">
                              <div className="flex border border-[#D0EDE8] rounded-xl overflow-hidden">
                                {(["A", "B", "C"] as const).map((tab) => (
                                  <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                                      activeTab === tab
                                        ? "bg-[#0d9488] text-white"
                                        : "bg-white text-[#4A7A6D] hover:bg-[#F0F9F8]"
                                    }`}
                                  >
                                    {tab === "A" ? "Add to Store" : tab === "B" ? "Call Forwarding" : "Caller ID (Optional)"}
                                  </button>
                                ))}
                              </div>

                              {activeTab === "A" && (
                                <div className="mt-4 p-4 bg-[#F0F9F8] rounded-xl border border-[#D0EDE8] space-y-3 text-sm text-[#1B2A4A]">
                                  <p className="font-semibold">Share your AI support number in these locations:</p>
                                  <ul className="space-y-2 text-[#4A7A6D]">
                                    <li>
                                      <span className="font-medium text-navy">Contact page</span> — Add as the primary support phone number
                                    </li>
                                    <li>
                                      <span className="font-medium text-navy">Footer</span> — Add &ldquo;Questions? Call [number]&rdquo;
                                    </li>
                                    <li>
                                      <span className="font-medium text-navy">Order confirmation email</span> — Add &ldquo;Questions about your order? Call us at [number]&rdquo;
                                    </li>
                                  </ul>
                                </div>
                              )}

                              {activeTab === "B" && (
                                <div className="mt-4 p-4 bg-[#F0F9F8] rounded-xl border border-[#D0EDE8] space-y-4 text-sm">
                                  <p className="text-[#4A7A6D]">
                                    Forward your existing number to your AI line so customers call your store number and the AI answers.
                                  </p>

                                  <div>
                                    <label className="block text-xs font-medium text-navy mb-1">Country</label>
                                    <select
                                      value={fwdCountry}
                                      onChange={(e) => { setFwdCountry(e.target.value); setFwdCarrier(""); }}
                                      className="w-full px-3 py-2 rounded-lg border border-[#D0EDE8] bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                                    >
                                      <option value="">Select your country</option>
                                      {Object.keys(CALL_FORWARDING_CODES).map((code) => (
                                        <option key={code} value={code}>
                                          {COUNTRY_NAMES[code] ?? code}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {fwdCountry && (
                                    <div>
                                      <label className="block text-xs font-medium text-navy mb-1">Carrier / Network</label>
                                      <select
                                        value={fwdCarrier}
                                        onChange={(e) => setFwdCarrier(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-[#D0EDE8] bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                                      >
                                        <option value="">Select your carrier</option>
                                        {getCarriersForCountry(fwdCountry).map((c) => (
                                          <option key={c} value={c}>{c}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  {fwdCarrier && (
                                    <>
                                      <div>
                                        <label className="block text-xs font-medium text-navy mb-2">Forwarding type</label>
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => setFwdType("conditional")}
                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition ${
                                              fwdType === "conditional"
                                                ? "bg-[#0d9488] text-white border-[#0d9488]"
                                                : "bg-white text-[#4A7A6D] border-[#D0EDE8]"
                                            }`}
                                          >
                                            When busy / no answer
                                            <span className="block text-[10px] font-normal mt-0.5 opacity-80">Recommended</span>
                                          </button>
                                          <button
                                            onClick={() => setFwdType("all")}
                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition ${
                                              fwdType === "all"
                                                ? "bg-[#0d9488] text-white border-[#0d9488]"
                                                : "bg-white text-[#4A7A6D] border-[#D0EDE8]"
                                            }`}
                                          >
                                            All calls
                                            <span className="block text-[10px] font-normal mt-0.5 opacity-80">AI answers everything</span>
                                          </button>
                                        </div>
                                      </div>

                                      <div className="bg-white rounded-xl p-4 border border-[#D0EDE8] space-y-3">
                                        <p className="text-xs font-medium text-navy">
                                          Dial {fwdType === "all" ? "this code" : "these codes"} on your {fwdCarrier} phone:
                                        </p>

                                        {fwdType === "all" ? (
                                          <UssdCodeBlock
                                            label="Forward ALL calls"
                                            code={getUssdCode(fwdCountry, fwdCarrier, "forwardAll", phoneNumber)}
                                            copied={fwdCopied}
                                            onCopy={setFwdCopied}
                                          />
                                        ) : (
                                          <>
                                            <UssdCodeBlock
                                              label="When you don&apos;t answer (30 seconds)"
                                              code={getUssdCode(fwdCountry, fwdCarrier, "forwardNoAnswer", phoneNumber)}
                                              copied={fwdCopied}
                                              onCopy={setFwdCopied}
                                            />
                                            <UssdCodeBlock
                                              label="When you&apos;re on another call"
                                              code={getUssdCode(fwdCountry, fwdCarrier, "forwardBusy", phoneNumber)}
                                              copied={fwdCopied}
                                              onCopy={setFwdCopied}
                                            />
                                          </>
                                        )}

                                        <div className="border-t border-[#D0EDE8] pt-2">
                                          <p className="text-[10px] text-[#8AADA6]">
                                            To cancel forwarding later, dial:{" "}
                                            <code className="bg-[#F0F9F8] px-1 rounded font-mono">
                                              {getCancelCode(fwdCountry, fwdCarrier)}
                                            </code>
                                          </p>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}

                              {activeTab === "C" && (
                                <div className="mt-4 p-4 bg-[#F0F9F8] rounded-xl border border-[#D0EDE8] space-y-3 text-sm text-[#4A7A6D]">
                                  <p>
                                    Enter your existing store number. We&apos;ll verify it so outbound calls (like cart recovery) show your number on customers&apos; screens.
                                  </p>

                                  {callerIdError && (
                                    <div className="p-2 bg-red-50 border border-red-100 rounded-lg">
                                      <p className="text-xs text-red-600">{callerIdError}</p>
                                    </div>
                                  )}

                                  {callerIdCode ? (
                                    <div className="space-y-3">
                                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-xs font-medium text-amber-800">
                                          Twilio is calling {callerIdPhone}. Answer and enter this code when prompted:
                                        </p>
                                        <p className="text-2xl font-mono font-bold text-amber-900 mt-1 tracking-widest">
                                          {callerIdCode}
                                        </p>
                                      </div>
                                      <p className="text-xs text-[#8AADA6]">
                                        After you enter the code on the call, your number will be verified for outbound caller ID.
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={callerIdPhone}
                                        onChange={(e) => setCallerIdPhone(e.target.value)}
                                        placeholder="+234... or +1... (E.164 format)"
                                        className="flex-1 px-3 py-2 rounded-lg border border-[#D0EDE8] bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                                      />
                                      <button
                                        onClick={async () => {
                                          if (!callerIdPhone.startsWith("+") || callerIdPhone.length < 10) {
                                            setCallerIdError("Enter a valid phone number in E.164 format (e.g. +2348012345678)");
                                            return;
                                          }
                                          setCallerIdLoading(true);
                                          setCallerIdError("");
                                          try {
                                            const res = await fetch("/api/caller-id/start", {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ phone_number: callerIdPhone }),
                                            });
                                            const data = await res.json();
                                            if (!res.ok) {
                                              setCallerIdError(data.error || "Verification failed");
                                            } else {
                                              setCallerIdCode(data.validation_code);
                                            }
                                          } catch {
                                            setCallerIdError("Network error. Please try again.");
                                          } finally {
                                            setCallerIdLoading(false);
                                          }
                                        }}
                                        disabled={callerIdLoading}
                                        className="px-3 py-2 rounded-lg bg-[#0d9488] text-white text-xs font-semibold hover:bg-[#0b8276] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {callerIdLoading ? "Calling..." : "Verify Number"}
                                      </button>
                                    </div>
                                  )}

                                  <p className="text-xs text-[#8AADA6]">
                                    Optional — you can set this up later from the Integrations page.
                                  </p>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={handleGoToDashboard}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#0d9488] text-white font-semibold text-sm hover:bg-[#0b8276] shadow-[0_4px_14px_0_rgba(13,148,136,0.25)] transition-colors"
                            >
                              Go to My Dashboard
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <h2 className="font-display text-2xl font-bold text-navy mb-2 text-center tracking-tight">
                              Welcome to Barpel!
                            </h2>
                            <p className="text-sm text-[#4A7A6D] mb-6 text-center">
                              Your account is ready. Add a phone number anytime to start taking AI-powered calls.
                            </p>

                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-6">
                              <p className="text-sm text-amber-700 text-center">
                                Add a phone number to start taking calls
                              </p>
                            </div>

                            <button
                              onClick={handleGoToDashboard}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#0d9488] text-white font-semibold text-sm hover:bg-[#0b8276] shadow-[0_4px_14px_0_rgba(13,148,136,0.25)] transition-colors mb-3"
                            >
                              Go to Dashboard
                              <ArrowRight className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => router.push("/dashboard/integrations")}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-[#D0EDE8] text-[#4A7A6D] font-medium text-sm hover:bg-[#F0F9F8] transition-colors"
                            >
                              Set up phone line
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* BYOC Modal — available on Step 4 */}
      <BYOCModal open={byocOpen} onClose={() => setBYOCOpen(false)} />
    </div>
  );
}
