"use client";

import { Suspense, useState, useEffect } from "react";
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
import { normalizeShopDomain } from "@/lib/shopify/oauth";

const STEPS = [
  { icon: Store, label: "Business Name" },
  { icon: Sparkles, label: "Connect Store" },
  { icon: CreditCard, label: "Get Minutes" },
  { icon: Rocket, label: "Ready!" },
];

const fadeSlide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const COUNTRIES = [
  { value: "NG", label: "Nigeria", flag: "🇳🇬" },
  { value: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { value: "US", label: "United States", flag: "🇺🇸" },
  { value: "CA", label: "Canada", flag: "🇨🇦" },
  { value: "GH", label: "Ghana", flag: "🇬🇭" },
  { value: "KE", label: "Kenya", flag: "🇰🇪" },
];

const FORWARDING_CODES: Array<{ carrier: string; how: string }> = [
  { carrier: "MTN Nigeria", how: "Dial *21*[number]# then press Call" },
  { carrier: "Airtel Nigeria", how: "Dial *21*[number]# then press Call" },
  { carrier: "Glo Nigeria", how: "Dial *21*[number]# then press Call" },
  { carrier: "EE UK", how: "Call 150 → Settings → Divert calls → All calls" },
  { carrier: "Vodafone UK", how: "Dial **21*[number]# then press Call" },
  { carrier: "O2 UK", how: "Call 1747 then follow the prompts" },
  { carrier: "AT&T US", how: "Dial *21*[number]# or use MyAT&T app → More → Settings → Call Forwarding" },
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
  const [phoneNumber, setPhoneNumber] = useState("+1 (555) 012-3456");
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(true);
  const [shopifyDenied, setShopifyDenied] = useState(false);
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [connectedShopName, setConnectedShopName] = useState("");
  const [shopDomain, setShopDomain] = useState("");
  const [connectingShopify, setConnectingShopify] = useState(false);

  // Step 4 tab state
  const [activeTab, setActiveTab] = useState<"A" | "B" | "C">("A");
  const [showForwarding, setShowForwarding] = useState(false);

  const supabase = createClient();

  // On mount: fetch onboarding_step from DB and jump to it; also handle shopify_denied param
  useEffect(() => {
    if (searchParams.get("shopify_denied") === "1") {
      setShopifyDenied(true);
    }
    if (searchParams.get("connected") === "shopify") {
      setShopifyConnected(true);
      setConnectedShopName(searchParams.get("shop_name") ?? "");
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
      };
      setError(messages[shopifyErrorCode] ?? "Shopify connection failed. Please try again.");
    }

    async function syncStep() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoadingStep(false);
        return;
      }
      const { data } = await supabase
        .from("merchants")
        .select("onboarding_step, country, business_name, support_phone")
        .eq("user_id", user.id)
        .single();

      if (data) {
        const step = Math.min(Math.max(Number(data.onboarding_step) || 1, 1), 4);
        // If shopify was denied, errored, or just connected, stay on step 2 to show the relevant UI
        const resolvedStep =
          searchParams.get("shopify_denied") === "1" || searchParams.get("connected") === "shopify" || searchParams.get("shopify_error")
            ? 2
            : step;
        setCurrentStep(resolvedStep);
        if (data.country) setCountry(data.country);
        if (data.business_name) setBusinessName(data.business_name);
        if (data.support_phone) setPhoneNumber(data.support_phone);
      }
      setLoadingStep(false);
    }
    syncStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveToDb(updates: Record<string, unknown>) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("merchants")
      .update(updates)
      .eq("user_id", user.id);
  }

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
      goToStep(2);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConnectShopify() {
    const fullDomain = normalizeShopDomain(shopDomain);

    if (!/^[a-z0-9-]+\.myshopify\.com$/i.test(fullDomain)) {
      setError("Enter just the store name, for example: powerfit-gadgets");
      return;
    }

    setConnectingShopify(true);
    setError("");
    try {
      const res = await fetch("/api/shopify/oauth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopDomain: fullDomain }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start Shopify connection.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setConnectingShopify(false);
    }
  }

  async function handleSkipShopify() {
    // Setting onboarded_at here means /onboarding won't show again even if tab is closed
    await saveToDb({ onboarding_step: 3, onboarded_at: new Date().toISOString() });
    goToStep(3);
  }

  async function handleBuyCredits(packageId: string) {
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: packageId,
          successUrl: `${window.location.origin}/onboarding?step=4`,
          cancelUrl: `${window.location.origin}/onboarding?step=3`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Failed to start checkout.");
    }
  }

  async function handleSkipBilling() {
    // Setting onboarded_at here means /onboarding won't show again even if tab is closed
    await saveToDb({ onboarding_step: 4, onboarded_at: new Date().toISOString() });
    goToStep(4);
  }

  async function handleFinish() {
    await saveToDb({
      onboarding_step: 4,
      onboarded_at: new Date().toISOString(),
    });
    router.push("/dashboard");
  }

  function handleCopyPhone() {
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isAfrica = ["NG", "GH", "KE"].includes(country);

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
          <span className="text-xs text-[#8AADA6]">Step {currentStep} of 4</span>
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

                      <div className="mb-4">
                        <label className="text-xs text-[#8AADA6] mb-1 block font-sans">Your store name</label>
                        <input
                          type="text"
                          value={shopDomain}
                          onChange={(e) => { setShopDomain(e.target.value); setError(""); }}
                          onKeyDown={(e) => e.key === "Enter" && shopDomain.trim() && handleConnectShopify()}
                          placeholder="powerfit-gadgets"
                          className="w-full px-4 py-3 rounded-xl border border-[#D0EDE8] bg-[#F0F9F8] text-sm text-navy placeholder:text-[#8AADA6] focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-colors font-sans"
                          autoFocus
                        />
                        <p className="text-xs text-[#8AADA6] mt-1 font-sans">
                          This is the name before .myshopify.com in your store URL
                        </p>
                      </div>

                      <button
                        onClick={handleConnectShopify}
                        disabled={connectingShopify || !shopDomain.trim()}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {connectingShopify ? "Connecting..." : "Connect My Shopify Store"}
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

                      <button
                        onClick={handleSkipShopify}
                        className="mt-4 text-sm text-[#8AADA6] hover:text-navy transition-colors mx-auto block"
                      >
                        Skip for now
                      </button>

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
                    Choose a plan or start with 5 free minutes to try it out.
                  </p>

                  <div className="space-y-3">
                    {CREDIT_PACKAGES.map((pkg) => (
                      <button
                        key={pkg.id}
                        onClick={() => handleBuyCredits(pkg.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors hover:bg-[#F0F9F8] ${
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
                    onClick={handleSkipBilling}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-full border border-[#D0EDE8] text-[#4A7A6D] font-medium text-sm hover:bg-[#F0F9F8] transition-colors"
                  >
                    Use 5 free minutes instead
                  </button>

                  <button
                    onClick={() => goToStep(2)}
                    className="mt-4 flex items-center gap-1 text-xs text-[#8AADA6] hover:text-navy transition-colors mx-auto"
                  >
                    <ArrowLeft className="w-3 h-3" /> Back
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 4: Ready! ─── */}
            {currentStep === 4 && (
              <motion.div key="step4" {...fadeSlide} transition={{ duration: 0.3 }}>
                <div className="bg-white rounded-2xl border border-[#D0EDE8] p-8 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-[#C8F0E8] flex items-center justify-center mx-auto mb-6">
                    <Rocket className="w-8 h-8 text-teal" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-navy mb-2 text-center tracking-tight">
                    You&apos;re all set!
                  </h2>
                  <p className="text-sm text-[#4A7A6D] mb-6 text-center">
                    Your AI support line is live. Share this number with your customers.
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
                        This is a virtual UK number. Your customers can call it internationally. We recommend setting up call forwarding below so customers can reach you on a local number.
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

                    {/* Option A */}
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
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                          <p className="text-xs text-amber-700">
                            <strong>Note:</strong> Do NOT add it to Shopify Settings → Contact Information — that field is cosmetic only and won&apos;t be seen by customers.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Option B */}
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

                    {/* Option C */}
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
                    onClick={handleFinish}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition-colors"
                  >
                    Go to My Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
