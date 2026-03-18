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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { BarpelLogo } from "@/components/brand/BarpelLogo";
import { createClient } from "@/lib/supabase/client";
import { CREDIT_PACKAGES } from "@/lib/constants";
import { BYOCModal } from "@/components/integrations/BYOCModal";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import confetti from "canvas-confetti";
import { track } from "@/lib/analytics";

const DUMMY_FLW_CONFIG = {
  public_key: "", tx_ref: "", amount: 0, currency: "USD",
  payment_options: "card",
  customer: { email: "", name: "" },
  customizations: { title: "", description: "", logo: "" },
};

const STEPS = [
  { icon: Store, label: "Business Name" },
  { icon: Sparkles, label: "Connect Store" },
  { icon: CreditCard, label: "Get Minutes" },
  { icon: Phone, label: "AI Phone Line" },
  { icon: Rocket, label: "Ready!" },
];

const fadeSlide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const COUNTRIES = [
  { value: "NG", label: "Nigeria", flag: "\u{1F1F3}\u{1F1EC}" },
  { value: "GB", label: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}" },
  { value: "US", label: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
  { value: "CA", label: "Canada", flag: "\u{1F1E8}\u{1F1E6}" },
  { value: "GH", label: "Ghana", flag: "\u{1F1EC}\u{1F1ED}" },
  { value: "KE", label: "Kenya", flag: "\u{1F1F0}\u{1F1EA}" },
];

const FORWARDING_CODES: Array<{ carrier: string; how: string }> = [
  { carrier: "MTN Nigeria", how: "Dial *21*[number]# then press Call" },
  { carrier: "Airtel Nigeria", how: "Dial *21*[number]# then press Call" },
  { carrier: "Glo Nigeria", how: "Dial *21*[number]# then press Call" },
  { carrier: "EE UK", how: "Call 150 \u2192 Settings \u2192 Divert calls \u2192 All calls" },
  { carrier: "Vodafone UK", how: "Dial **21*[number]# then press Call" },
  { carrier: "O2 UK", how: "Call 1747 then follow the prompts" },
  { carrier: "AT&T US", how: "Dial *21*[number]# or use MyAT&T app \u2192 More \u2192 Settings \u2192 Call Forwarding" },
  { carrier: "T-Mobile US", how: "Dial **21*[number]# then press Call" },
  { carrier: "Rogers Canada", how: "Dial *72[number] then press Call" },
];

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

  // Step 3: credit balance from DB (Ticket 3)
  const [creditBalance, setCreditBalance] = useState(0);

  // Step 4: provisioning status (Ticket 4)
  const [provisioningStatus, setProvisioningStatus] = useState("pending");
  const [provisioningError, setProvisioningError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Step 5 tab state
  const [activeTab, setActiveTab] = useState<"A" | "B" | "C">("A");
  const [showForwarding, setShowForwarding] = useState(false);
  // Step 4: BYOC modal
  const [byocOpen, setBYOCOpen] = useState(false);

  // Bug 1: Flutterwave state for Step 3
  const [flwConfig, setFlwConfig] = useState<object>(DUMMY_FLW_CONFIG);
  const [readyToPay, setReadyToPay] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);

  // Bug 2: Shopify store name input for Step 2
  const [shopifyStoreName, setShopifyStoreName] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFlutterPayment = useFlutterwave(flwConfig as any);

  const supabase = createClient();

  // On mount: fetch onboarding_step from DB and jump to it; also handle shopify_denied param
  useEffect(() => {
    if (searchParams.get("shopify_denied") === "1") {
      setShopifyDenied(true);
    }
    // shopifyConnected / connectedShopName are set from the integrations DB query below
    // (the callback sends ?shopify_connected=1, but the DB is the source of truth)
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

      // Ticket 2/3/4: extended select — includes id, credit_balance, provisioning fields
      const { data } = await supabase
        .from("merchants")
        .select("id, onboarding_step, country, business_name, support_phone, credit_balance, provisioning_status, provisioning_error, onboarded_at")
        .eq("user_id", user.id)
        .single();

      if (data) {
        // Redirect merchants who already completed onboarding back to dashboard
        if (data.provisioning_status === "active" && data.onboarded_at) {
          router.replace("/dashboard");
          return;
        }

        const step = Math.min(Math.max(Number(data.onboarding_step) || 1, 1), 5);
        // If shopify was denied, errored, or just connected, stay on step 2 to show the relevant UI
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

        // Ticket 2: Check integrations table for existing Shopify connection (single source of truth)
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

  // Bug 1: Open Flutterwave modal after config is committed to state
  useEffect(() => {
    if (!readyToPay) return;
    setReadyToPay(false);
    handleFlutterPayment({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: async (response: any) => {
        closePaymentModal();
        if (response.status === "successful") {
          await fetch("/api/billing/flutterwave/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transaction_id: response.transaction_id,
              tx_ref: response.tx_ref,
            }),
          });
          await saveToDb({ onboarding_step: 4 });
          goToStep(4);
        }
        setBillingLoading(false);
      },
      onClose: () => {
        setBillingLoading(false);
        setReadyToPay(false);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToPay]);

  // Ticket 4: Supabase Realtime subscription for provisioning updates
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
          // Guard against backwards transitions: once provisioning has started,
          // don't allow a stale DB event (e.g. from Gate 5 updating provision_count
          // without changing provisioning_status) to revert the UI back to "pending".
          if (n.provisioning_status) {
            setProvisioningStatus((prev) => {
              const order = ["pending", "provisioning", "needs_address", "failed", "active", "suspended"];
              const prevIdx = order.indexOf(prev);
              const newIdx = order.indexOf(n.provisioning_status);
              // Only update if the new status is equal or further along,
              // OR if it's an explicit terminal state (failed/needs_address/active)
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
      // Small delay so the "Phone line ready!" message is visible briefly
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

  // Shopify connection polling — when merchant is on step 2 and not yet connected,
  // poll the integrations table every 3s (up to 30s) so the UI auto-updates if
  // OAuth completes in a different tab or window.
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

  // Ticket 4: Polling fallback — if Realtime doesn't deliver within 10s, poll every 5s
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

  // Ticket 5: Step 1 no longer fires provisioning — just saves business name + country
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
    if (!shopifyStoreName.trim()) {
      setError("Please enter your store name.");
      return;
    }
    setConnectingShopify(true);
    setError("");
    track("onboarding_step", { step: 2, action: "completed" });
    const shop = `${shopifyStoreName.trim().toLowerCase()}.myshopify.com`;
    window.location.href = `/api/shopify/oauth/start?returnTo=onboarding&shop=${encodeURIComponent(shop)}`;
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
      const res = await fetch("/api/billing/flutterwave/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: packageId }),
      });
      const config = await res.json();
      if (!res.ok) {
        setError(config.error ?? "Something went wrong. Please try again.");
        setBillingLoading(false);
        return;
      }
      setFlwConfig(config);
      track("onboarding_step", { step: 3, action: "completed" });
      setReadyToPay(true);
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

  // Ticket 5: Step 4 "Finish Setup" — runs abuse gates, then fires provisioning
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
      // Provisioning is now triggered server-side by /api/onboarding/complete.
      // Just update UI state — Realtime/polling picks up status changes.
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

  return (
    <div className="min-h-screen bg-[#F0F9F8] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#D0EDE8] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarpelLogo size={28} />
            <span className="font-display font-bold text-navy text-lg tracking-tight">Barpel</span>
          </div>
          <span className="text-xs text-[#8AADA6]">Step {currentStep} of 5</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-[#D0EDE8]">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            {STEPS.map((step, i) => {
              const stepNum = i + 1;
              const isActive = stepNum === currentStep;
              const isDone = stepNum < currentStep;
              return (
                <div key={step.label} className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      isDone
                        ? "bg-teal text-white"
                        : isActive
                          ? "bg-teal text-white"
                          : "bg-[#D0EDE8] text-[#8AADA6]"
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : stepNum}
                  </div>
                  <span
                    className={`text-xs hidden sm:block ${
                      isActive ? "text-navy font-medium" : "text-[#8AADA6]"
                    }`}
                  >
                    {step.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px ${isDone ? "bg-teal" : "bg-[#D0EDE8]"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* ─── Step 1: Business Name + Country ─── */}
            {currentStep === 1 && (
              <motion.div key="step1" {...fadeSlide} transition={{ duration: 0.3 }}>
                <div className="bg-white rounded-2xl border border-[#D0EDE8] p-8 shadow-sm">
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
                    className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-full bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Continue"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 2: Connect Store ─── */}
            {currentStep === 2 && (
              <motion.div key="step2" {...fadeSlide} transition={{ duration: 0.3 }}>
                <div className="bg-white rounded-2xl border border-[#D0EDE8] p-8 shadow-sm">
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
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition-colors"
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

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-navy mb-1">
                          Enter your store name
                        </label>
                        <input
                          type="text"
                          value={shopifyStoreName}
                          onChange={(e) => setShopifyStoreName(e.target.value)}
                          placeholder="powerfit-gadgets"
                          className="w-full px-4 py-3 rounded-xl border border-[#D0EDE8] text-sm text-navy placeholder-[#8AADA6] focus:outline-none focus:ring-2 focus:ring-teal/40"
                          onKeyDown={(e) => e.key === "Enter" && handleConnectShopify()}
                        />
                        <p className="mt-1 text-xs text-[#8AADA6]">
                          This is the part before .myshopify.com
                        </p>
                      </div>

                      <button
                        onClick={handleConnectShopify}
                        disabled={connectingShopify}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                </div>
              </motion.div>
            )}

            {/* ─── Step 3: Get Minutes ─── */}
            {currentStep === 3 && (
              <motion.div key="step3" {...fadeSlide} transition={{ duration: 0.3 }}>
                <div className="bg-white rounded-2xl border border-[#D0EDE8] p-8 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-[#F0F9F8] flex items-center justify-center mb-6">
                    <CreditCard className="w-6 h-6 text-teal" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-navy mb-2 tracking-tight">
                    Get call minutes
                  </h2>
                  <p className="text-sm text-[#4A7A6D] mb-6">
                    {freeMinutes > 0
                      ? `Choose a plan or start with your ${freeMinutes} free minutes to try it out.`
                      : "Choose a plan to get started with AI support calls."}
                  </p>

                  {/* PRIMARY: Use free minutes — shown when available */}
                  {freeMinutes > 0 && (
                    <button
                      onClick={handleSkipBilling}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition-colors mb-2"
                    >
                      Start with {freeMinutes} free minutes — no card required
                    </button>
                  )}

                  {/* Divider — only shown when free minutes exist */}
                  {freeMinutes > 0 && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-[#D0EDE8]" />
                      <span className="text-xs text-[#8AADA6]">or upgrade now</span>
                      <div className="flex-1 h-px bg-[#D0EDE8]" />
                    </div>
                  )}

                  {/* SECONDARY: Paid plans */}
                  <div className="space-y-3">
                    {CREDIT_PACKAGES.map((pkg) => (
                      <button
                        key={pkg.id}
                        onClick={() => handleBuyCredits(pkg.id)}
                        disabled={billingLoading}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors hover:bg-[#F0F9F8] disabled:opacity-50 disabled:cursor-not-allowed ${
                          "popular" in pkg && pkg.popular ? "border-teal bg-[#F0F9F8]" : "border-[#D0EDE8]"
                        }`}
                      >
                        <div>
                          <span className="font-semibold text-navy text-sm">{pkg.name}</span>
                          <span className="text-xs text-[#8AADA6] ml-2">
                            {pkg.minutes} min &middot; ${pkg.perMin}/min
                          </span>
                        </div>
                        <span className="font-bold text-navy">
                          ${(pkg.priceUsdCents / 100).toFixed(0)}
                        </span>
                      </button>
                    ))}
                  </div>

                  {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

                  <button
                    onClick={() => goToStep(2)}
                    className="mt-4 flex items-center gap-1 text-xs text-[#8AADA6] hover:text-navy transition-colors mx-auto"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 4: AI Phone Line ─── */}
            {currentStep === 4 && (
              <motion.div key="step4" {...fadeSlide} transition={{ duration: 0.3 }}>
                <div className="bg-white rounded-2xl border border-[#D0EDE8] p-8 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-[#F0F9F8] flex items-center justify-center mx-auto mb-6">
                    <Phone className="w-6 h-6 text-teal" />
                  </div>

                  {/* Before provisioning — show options */}
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

                      {/* Primary: Get AI Number */}
                      <button
                        onClick={handleCompleteOnboarding}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Phone className="w-4 h-4" />
                        {saving ? "Setting up..." : "Get My AI Number \u2014 Free"}
                      </button>
                      <p className="text-center text-xs text-[#8AADA6] mt-1.5">
                        This uses your free trial minutes.
                      </p>

                      <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-[#D0EDE8]" />
                        <span className="text-xs text-[#8AADA6]">or</span>
                        <div className="flex-1 h-px bg-[#D0EDE8]" />
                      </div>

                      {/* Secondary: BYOC */}
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

                      {/* Tertiary: Skip */}
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

                  {/* Provisioning in progress */}
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

                  {/* Provisioning complete — auto-advance to step 5 */}
                  {provisioningStatus === "active" && phoneNumber && (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <Check className="w-8 h-8 text-teal" />
                      <p className="text-sm text-[#4A7A6D]">Phone line ready!</p>
                      <button
                        onClick={() => goToStep(5)}
                        className="mt-2 flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition-colors"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* needs_address */}
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
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition-colors"
                      >
                        Continue to Dashboard
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* ─── Step 5: Ready! ─── */}
            {currentStep === 5 && (
              <motion.div key="step5" {...fadeSlide} transition={{ duration: 0.3 }}>
                <div className="bg-white rounded-2xl border border-[#D0EDE8] p-8 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-[#C8F0E8] flex items-center justify-center mx-auto mb-6">
                    <Rocket className="w-8 h-8 text-teal" />
                  </div>

                  {/* Provisioned or BYOC — show phone number */}
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

                      {/* Phone number display */}
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

                      {/* Africa note */}
                      {isAfrica && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                          <p className="text-xs text-blue-700">
                            This is a virtual UK number. Your customers can call it internationally. We recommend setting up call forwarding from the Integrations page.
                          </p>
                        </div>
                      )}

                      {/* Three-option instruction tabs */}
                      <div className="mb-6">
                        <div className="flex border border-[#D0EDE8] rounded-xl overflow-hidden">
                          {(["A", "B", "C"] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(tab)}
                              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                                activeTab === tab
                                  ? "bg-teal text-white"
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
                          <div className="mt-4 p-4 bg-[#F0F9F8] rounded-xl border border-[#D0EDE8] space-y-3 text-sm">
                            <p className="text-[#4A7A6D]">
                              Forward your existing number to your Barpel AI line so all calls go to your AI automatically.
                            </p>
                            <button
                              onClick={() => setShowForwarding(!showForwarding)}
                              className="flex items-center gap-2 text-teal font-semibold text-xs"
                            >
                              {showForwarding ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              {showForwarding ? "Hide" : "Show"} carrier codes
                            </button>
                            {showForwarding && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-[#D0EDE8]">
                                      <th className="text-left py-1.5 text-[#8AADA6] font-medium">Carrier</th>
                                      <th className="text-left py-1.5 text-[#8AADA6] font-medium">How to forward</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {FORWARDING_CODES.map((row) => (
                                      <tr key={row.carrier} className="border-b border-[#D0EDE8]/50">
                                        <td className="py-2 pr-4 font-medium text-navy whitespace-nowrap">{row.carrier}</td>
                                        <td className="py-2 text-[#4A7A6D]">
                                          {row.how.replace("[your Barpel number]", phoneNumber).replace("[number]", phoneNumber)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === "C" && (
                          <div className="mt-4 p-4 bg-[#F0F9F8] rounded-xl border border-[#D0EDE8] space-y-3 text-sm text-[#4A7A6D]">
                            <p>
                              Enter your existing number and we&apos;ll verify it so outbound calls show your store number on customers&apos; screens.
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="+44... or +1... (E.164 format)"
                                className="flex-1 px-3 py-2 rounded-lg border border-[#D0EDE8] bg-white text-navy text-sm focus:outline-none focus:border-teal"
                              />
                              <button className="px-3 py-2 rounded-lg bg-teal text-white text-xs font-semibold hover:bg-teal/90 transition-colors">
                                Verify Number
                              </button>
                            </div>
                            <p className="text-xs text-[#8AADA6]">
                              Optional — you can set this up later from the Integrations page.
                            </p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleGoToDashboard}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition-colors"
                      >
                        Go to My Dashboard
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    /* Skipped — no phone number */
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
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition-colors mb-3"
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* BYOC Modal — available on Step 4 */}
      <BYOCModal open={byocOpen} onClose={() => setBYOCOpen(false)} />
    </div>
  );
}
