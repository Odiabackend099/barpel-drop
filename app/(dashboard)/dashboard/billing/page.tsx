"use client";

import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { Star, Check, TrendingUp, CreditCard as CardIcon, Zap, XCircle, RefreshCw, ExternalLink } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CREDIT_PACKAGES } from "@/lib/constants";
import { useCredits } from "@/hooks/useCredits";
import { useIntegrations } from "@/hooks/useIntegrations";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type BillingCycle = "monthly" | "annual";

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide"
      style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      {children}
    </span>
  );
}

/**
 * Dodo plan card — USD international billing.
 * Calls /api/billing/dodo/initiate → redirects to Dodo-hosted checkout page.
 * On completion, user is redirected to /dashboard/billing/success.
 * The webhook is the authoritative credit path.
 */
function DodoPlanCard({ pkg, billingCycle, currentBalance }: { pkg: typeof CREDIT_PACKAGES[number]; billingCycle: BillingCycle; currentBalance: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuyNow = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/dodo/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: pkg.id, billing_cycle: billingCycle }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      // Store current balance so success page can detect the credit was actually granted
      sessionStorage.setItem("pre_checkout_balance", String(currentBalance));
      window.location.href = data.checkout_url;
    } catch {
      setError("Network error — please check your connection and try again.");
      setLoading(false);
    }
  };

  const displayPrice = billingCycle === "annual"
    ? (pkg.annualPriceUsdCents / 100).toFixed(0)
    : (pkg.priceUsdCents / 100).toFixed(2);

  const priceLabel = billingCycle === "annual"
    ? `$${displayPrice}/year`
    : `$${displayPrice}/month`;

  const monthlyEquiv = billingCycle === "annual"
    ? `$${Math.round(pkg.annualPriceUsdCents / 12 / 100)}/mo`
    : null;

  return (
    <div
      className={`bg-white border rounded-xl p-5 shadow-sm relative ${"popular" in pkg && pkg.popular ? "border-brand-600" : "border-slate-200"}`}
    >
      {"popular" in pkg && pkg.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge color="#00A99D">
            <Star className="w-3 h-3 mr-1" />
            BEST VALUE
          </Badge>
        </div>
      )}
      <div className="text-center pt-2">
        <h3 className="text-lg font-bold text-slate-900 font-sans">{pkg.name}</h3>
        <p className="text-3xl font-bold text-slate-900 mt-2">{priceLabel}</p>
        {monthlyEquiv && (
          <p className="text-sm text-brand-600 font-semibold">{monthlyEquiv} · Save 10%</p>
        )}
        <p className="text-sm text-muted-foreground font-sans">{pkg.credits} credits/month</p>
        <p className="text-xs text-muted-foreground mt-1 font-sans">
          ${pkg.perMin.toFixed(2)}/credit · Overage: +${"overage" in pkg ? (pkg as { overage: number }).overage.toFixed(2) : "0.99"}/credit
        </p>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-sans">
          <Check className="w-4 h-4 text-brand-600" />
          Order tracking calls
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 font-sans">
          <Check className="w-4 h-4 text-brand-600" />
          Return triage
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 font-sans">
          <Check className="w-4 h-4 text-brand-600" />
          Abandoned cart recovery
        </div>
      </div>
      <button
        onClick={handleBuyNow}
        disabled={loading}
        className={`w-full mt-4 inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
          "popular" in pkg && pkg.popular
            ? "bg-gradient-to-r from-brand-600 to-brand-400 text-white hover:shadow-lg hover:-translate-y-0.5"
            : "bg-white border border-slate-200 text-slate-900 hover:border-brand-600 hover:bg-brand-light"
        }`}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {loading ? "Redirecting to checkout..." : "Subscribe — USD"}
      </button>
      <p className="text-center text-[10px] text-muted-foreground mt-2 font-sans">
        Secured by Dodo Payments · International cards accepted
      </p>
      {error && (
        <div className="flex items-center gap-2 mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg">
          <Zap className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  const [successMessage, setSuccessMessage] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [mounted, setMounted] = useState(false);
  const { balance, credits, transactions, usageData, loading, refreshBalance, planStatus, dodoPlan, dodoSubscriptionId, dodoCustomerId, shopifyPlan, shopifySubscriptionId, shopifyBillingCycle } = useCredits();
  const { shopifyIntegration } = useIntegrations();

  const isShopifyMerchant = !!shopifyPlan;
  const shopDomain = shopifyIntegration?.shop_domain;
  const storeHandle = shopDomain?.replace(".myshopify.com", "") ?? null;
  const appHandle = process.env.NEXT_PUBLIC_SHOPIFY_APP_HANDLE || null;
  const shopifyAdminUrl = shopDomain
    ? storeHandle && appHandle
      ? `https://admin.shopify.com/store/${storeHandle}/charges/${appHandle}/pricing_plans`
      : `https://${shopDomain}/admin/settings/billing`
    : "https://admin.shopify.com/";
  const activePlan = shopifyPlan ?? dodoPlan;
  const hasActiveDodo = !!dodoSubscriptionId && !isShopifyMerchant;
  const hasActiveSubscription = !!(shopifySubscriptionId ?? dodoSubscriptionId);

  // Format usage data for chart — convert ISO dates to "MMM dd".
  // Parse date parts directly from the ISO string to avoid timezone-driven
  // server/client mismatch (new Date("YYYY-MM-DD") is UTC midnight, which
  // can roll back a day in negative-offset timezones → React hydration error).
  const chartData = usageData.map((d) => {
    const [year, month, day] = d.date.split("-").map(Number);
    const label = format(new Date(year, month - 1, day), "MMM dd");
    return { date: label, credits: d.credits };
  });

  // Determine plan capacity for progress bar scaling
  const currentPkg = CREDIT_PACKAGES.find((p) => p.id === activePlan);
  const planCapacitySeconds = currentPkg ? currentPkg.credits * 60 : 15000;

  // Color-coded progress bar — scales against current plan's allocation
  const barPercent = Math.min((balance / planCapacitySeconds) * 100, 100);
  const barColor = balance >= 600
    ? "from-brand-600 to-brand-400"     // green: 10+ minutes
    : balance >= 60
    ? "from-amber-400 to-amber-300"      // amber: 1-10 minutes
    : "from-red-500 to-red-400";         // red: < 1 minute

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    window.history.replaceState({}, "", "/dashboard/billing");

    if (
      params.get("status") === "success" ||
      params.get("trxref") ||
      params.get("reference")
    ) {
      setSuccessMessage("Payment successful — credits will appear shortly!");
      const t1 = setTimeout(() => refreshBalance(), 3000);
      const t2 = setTimeout(() => refreshBalance(), 8000);
      const t3 = setTimeout(() => setSuccessMessage(""), 10000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [refreshBalance]);

  return (
    <m.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
    >
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-20 right-6 z-50 bg-brand-muted border border-[#7DD9C0] text-brand-600 px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in shadow-lg font-sans">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight mb-1">Billing</h1>
        <p className="text-sm text-muted-foreground font-sans">Manage your plan and track spending</p>
      </div>

      {/* Low balance warning */}
      {!loading && balance < 300 && balance > 0 && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <Zap className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            Running low — your AI will stop answering calls at 0 credits.
          </p>
        </div>
      )}

      {/* Zero balance warning */}
      {!loading && balance <= 0 && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <Zap className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-700">
            No credits remaining — top up to keep your AI line active.
          </p>
        </div>
      )}

      {/* Current Balance */}
      <div
        className="bg-white border rounded-xl p-5 shadow-sm"
        style={{ borderColor: "rgba(13,148,136,0.25)", boxShadow: "0 0 20px rgba(13,148,136,0.08)" }}
      >
        {loading ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-sans">Current Balance</p>
                <p className="text-4xl font-bold text-slate-900">
                  {credits}
                  <span className="text-xl text-muted-foreground ml-2">credits remaining</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">1 credit = 1 minute of AI call time</p>
              </div>
              <div className="w-16 h-16 bg-brand-muted rounded-full flex items-center justify-center">
                <CardIcon className="w-8 h-8 text-brand-600" />
              </div>
            </div>
            <div className="mt-4 h-2 bg-brand-light rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all`}
                style={{ width: `${Math.max(barPercent, balance > 0 ? 2 : 0)}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Current Plan Badge */}
      {!loading && activePlan && hasActiveSubscription && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-muted rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-brand-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-sans">Current Plan</p>
                <p className="text-lg font-bold text-slate-900 capitalize">{activePlan}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {planStatus?.startsWith("past_due") && (
                <Badge color="#E74C3C">PAYMENT OVERDUE</Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shopify Billing Panel — shown only to Shopify-billed merchants */}
      {!loading && isShopifyMerchant && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-brand-muted rounded-full flex items-center justify-center">
              <CardIcon className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-sans">Billing managed by Shopify</p>
              <p className="text-lg font-bold text-slate-900 capitalize">{shopifyPlan} Plan · {shopifyBillingCycle ?? "monthly"}</p>
            </div>
          </div>
          {appHandle && (
            <a
              href={shopifyAdminUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-lg hover:border-brand-600 hover:bg-brand-light transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Manage Subscription
            </a>
          )}
          <p className="text-xs text-muted-foreground mt-3 font-sans">
            Your subscription is billed through Shopify. To upgrade, downgrade, or cancel, visit your Shopify Admin.
          </p>
        </div>
      )}

      {/* Billing Cycle Toggle — hidden for Shopify merchants */}
      {!loading && !isShopifyMerchant && (
        <div className="flex items-center justify-center gap-3 py-2">
          <span
            className={`text-sm font-medium transition-colors ${
              billingCycle === "monthly" ? "text-slate-900" : "text-muted-foreground"
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
            className="relative w-12 h-6 bg-brand-600 rounded-full transition-colors"
            aria-label="Toggle billing period"
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                billingCycle === "annual" ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium transition-colors ${
              billingCycle === "annual" ? "text-slate-900" : "text-muted-foreground"
            }`}
          >
            Annual
          </span>
          {billingCycle === "annual" && (
            <span className="px-2 py-0.5 text-xs font-bold text-brand-600 bg-brand-muted rounded-full">
              Save 10%
            </span>
          )}
        </div>
      )}

      {/* Credit Packages — hidden for Shopify merchants (they upgrade via Shopify Admin) */}
      {!loading && !isShopifyMerchant && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <DodoPlanCard key={`dodo-${pkg.id}-${billingCycle}`} pkg={pkg} billingCycle={billingCycle} currentBalance={balance} />
          ))}
        </div>
      )}

      {/* Subscription Management — Dodo Payments (hidden for Shopify merchants) */}
      {!loading && hasActiveDodo && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1 font-sans">Manage USD Subscription</h3>
          {planStatus === "past_due" && (
            <div className="flex items-center gap-2 mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg">
              <Zap className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <p className="text-xs text-red-700">
                Payment failed.{" "}
                {dodoCustomerId && (
                  <a
                    href={`/api/billing/dodo/customer-portal?customer_id=${dodoCustomerId}`}
                    className="underline font-medium"
                  >
                    Update payment method
                  </a>
                )}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {dodoCustomerId && (
              <a
                href={`/api/billing/dodo/customer-portal?customer_id=${dodoCustomerId}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-lg hover:border-brand-600 hover:bg-brand-light transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Update Payment Method
              </a>
            )}

            <button
              disabled={cancelLoading}
              onClick={async () => {
                const ok = window.confirm(
                  "Cancel your USD subscription?\n\n" +
                  "You'll keep your remaining credits until the end of the current billing period.\n" +
                  "Note: Annual plans are non-refundable."
                );
                if (!ok) return;
                setCancelLoading(true);
                try {
                  const res = await fetch("/api/billing/dodo/cancel", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ subscription_id: dodoSubscriptionId }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok) {
                    setSuccessMessage(data.message ?? "Subscription cancelled.");
                    setTimeout(() => setSuccessMessage(""), 10000);
                  } else {
                    alert(data.error ?? "Failed to cancel. Please try again.");
                  }
                } catch {
                  alert("Network error — please try again.");
                } finally {
                  setCancelLoading(false);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#E74C3C] bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
            >
              <XCircle className={`w-4 h-4 ${cancelLoading ? "animate-spin" : ""}`} />
              Cancel Subscription
            </button>
          </div>
        </div>
      )}

      {/* Usage Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-bold text-slate-900 font-sans">Credit Usage (Last 30 Days)</h3>
        </div>
        <div className="h-48">
          {mounted && (
            <ResponsiveContainer width="100%" height={192}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E74C3C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#E74C3C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#8AADA6", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8AADA6", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #D0EDE8",
                    borderRadius: "8px",
                    boxShadow: "0 4px 20px rgba(0,169,157,0.15)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="credits"
                  stroke="#E74C3C"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#usageGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Transaction History */}
      {loading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : (
        transactions.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 font-sans">Transaction History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground font-sans">Date</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground font-sans">Description</th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground font-sans">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-slate-200/50">
                      <td className="py-2.5 px-2 text-sm text-slate-500 font-sans">
                        {format(new Date(txn.date), "MMM dd, yyyy")}
                      </td>
                      <td className="py-2.5 px-2 text-sm text-slate-900 font-sans">{txn.description}</td>
                      <td
                        className={`py-2.5 px-2 text-sm text-right font-mono ${
                          (txn.type === "purchase" || txn.type === "credit") ? "text-brand-600" : "text-[#E74C3C]"
                        }`}
                      >
                        {(txn.type === "purchase" || txn.type === "credit") ? "+" : "-"}
                        {Math.floor(Math.abs(txn.amount) / 60)} credits
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </m.div>
  );
}
