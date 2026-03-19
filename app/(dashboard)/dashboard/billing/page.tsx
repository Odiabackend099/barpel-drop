"use client";

import { useState, useEffect } from "react";
import { Star, Check, TrendingUp, CreditCard as CardIcon, Zap, XCircle, RefreshCw } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { CREDIT_PACKAGES } from "@/lib/constants";
import { useCredits } from "@/hooks/useCredits";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// Dummy config to initialize useFlutterwave hook before we have real config.
// The hook requires a valid-shape object at all times — this prevents initialization errors.
const DUMMY_FLW_CONFIG = {
  public_key: "",
  tx_ref: "",
  amount: 0,
  currency: "USD",
  payment_options: "card",
  customer: { email: "", name: "" },
  customizations: { title: "", description: "", logo: "" },
};

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
 * Isolated plan card component — each card has its own useFlutterwave instance.
 * useFlutterwave is a React hook and cannot be called inside a .map() callback.
 * The useEffect + readyToPay pattern solves the stale-closure race condition:
 * setFlwConfig triggers a re-render, after which handleFlutterPayment has the new
 * config and the effect fires to open the modal.
 */
function FlutterwavePlanCard({ pkg, billingCycle }: { pkg: typeof CREDIT_PACKAGES[number]; billingCycle: BillingCycle }) {
  const [loading, setLoading] = useState(false);
  const [flwConfig, setFlwConfig] = useState<object>(DUMMY_FLW_CONFIG);
  const [readyToPay, setReadyToPay] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFlutterPayment = useFlutterwave(flwConfig as any);

  // Opens the modal AFTER flwConfig state has been committed to the render
  useEffect(() => {
    if (!readyToPay) return;
    setReadyToPay(false);

    handleFlutterPayment({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: async (response: any) => {
        closePaymentModal();
        if (response.status === "successful") {
          // Server-side verification — confirm transaction before crediting
          await fetch("/api/billing/flutterwave/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transaction_id: response.transaction_id,
              tx_ref: response.tx_ref,
            }),
          });
          // Supabase Realtime subscription updates the balance automatically — no manual refresh needed
        }
        setLoading(false);
      },
      onClose: () => {
        setLoading(false);
        setReadyToPay(false);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToPay]);

  const handleBuyNow = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/flutterwave/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: pkg.id, billing_cycle: billingCycle }),
      });
      const config = await res.json();
      if (!res.ok) {
        setError(config.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      setFlwConfig(config);
      setReadyToPay(true); // triggers useEffect after re-render with new config
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
      className={`bg-white border rounded-xl p-5 shadow-sm relative ${"popular" in pkg && pkg.popular ? "border-[#00A99D]" : "border-[#D0EDE8]"}`}
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
        <h3 className="text-lg font-bold text-[#1B2A4A] font-sans">{pkg.name}</h3>
        <p className="text-3xl font-bold text-[#1B2A4A] mt-2">{priceLabel}</p>
        {monthlyEquiv && (
          <p className="text-sm text-[#00A99D] font-semibold">{monthlyEquiv} · Save 10%</p>
        )}
        <p className="text-sm text-muted-foreground font-sans">{pkg.minutes} credits/month</p>
        <p className="text-xs text-muted-foreground mt-1 font-sans">
          ${pkg.perMin.toFixed(2)}/credit · Overage: +${"overage" in pkg ? (pkg as { overage: number }).overage.toFixed(2) : "0.99"}/credit
        </p>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-[#4A7A6D] font-sans">
          <Check className="w-4 h-4 text-[#00A99D]" />
          Order tracking calls
        </div>
        <div className="flex items-center gap-2 text-sm text-[#4A7A6D] font-sans">
          <Check className="w-4 h-4 text-[#00A99D]" />
          Return triage
        </div>
        <div className="flex items-center gap-2 text-sm text-[#4A7A6D] font-sans">
          <Check className="w-4 h-4 text-[#00A99D]" />
          Abandoned cart recovery
        </div>
      </div>
      <button
        onClick={handleBuyNow}
        disabled={loading}
        className={`w-full mt-4 inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
          "popular" in pkg && pkg.popular
            ? "bg-gradient-to-r from-[#00A99D] to-[#7DD9C0] text-white hover:shadow-lg hover:-translate-y-0.5"
            : "bg-white border border-[#D0EDE8] text-[#1B2A4A] hover:border-[#00A99D] hover:bg-[#F0F9F8]"
        }`}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {loading ? "Opening payment..." : "Buy Now"}
      </button>
      {/* Trust signal */}
      <p className="text-center text-[10px] text-muted-foreground mt-2 font-sans">
        Secured by Flutterwave · Cancel anytime
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
  const [showResubBanner, setShowResubBanner] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const { balance, credits, transactions, usageData, loading, refreshBalance, flwPlan, flwSubscriptionId, planStatus } = useCredits();

  // Format usage data for chart — convert ISO dates to "MMM dd"
  const chartData = usageData.map((d) => ({
    date: format(new Date(d.date), "MMM dd"),
    credits: d.credits,
  }));

  // Determine plan capacity for progress bar scaling
  const currentPkg = CREDIT_PACKAGES.find((p) => p.id === flwPlan);
  const planCapacitySeconds = currentPkg ? currentPkg.minutes * 60 : 15000;

  // Color-coded progress bar — scales against current plan's allocation
  const barPercent = Math.min((balance / planCapacitySeconds) * 100, 100);
  const barColor = balance >= 600
    ? "from-[#00A99D] to-[#7DD9C0]"     // green: 10+ minutes
    : balance >= 60
    ? "from-amber-400 to-amber-300"      // amber: 1-10 minutes
    : "from-red-500 to-red-400";         // red: < 1 minute

  // Handle return from Flutterwave redirect.
  // Two paths:
  //   ?status=success  — normal modal redirect (no 3DS)
  //   ?response={...}  — 3DS redirect (FLW sends full response object)
  // For the 3DS path, we call verify server-side then poll the balance.
  // The charge.completed webhook is the authoritative credit path; this is the UI feedback path.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    window.history.replaceState({}, "", "/dashboard/billing");

    if (params.get("status") === "success" || params.get("success") === "true") {
      setSuccessMessage("Payment successful — credits added to your account!");
      const t1 = setTimeout(() => refreshBalance(), 3000);
      const t2 = setTimeout(() => refreshBalance(), 8000);
      const t3 = setTimeout(() => setSuccessMessage(""), 10000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }

    const rawResponse = params.get("response");
    if (rawResponse) {
      try {
        const flwResponse = JSON.parse(rawResponse);
        if (flwResponse.status === "successful" && flwResponse.id && flwResponse.txRef) {
          setSuccessMessage("Payment successful — credits added to your account!");
          // Call verify endpoint so credits are added immediately (webhook is the backup)
          fetch("/api/billing/flutterwave/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transaction_id: flwResponse.id, tx_ref: flwResponse.txRef }),
          }).catch(() => {});
          const t1 = setTimeout(() => refreshBalance(), 3000);
          const t2 = setTimeout(() => refreshBalance(), 8000);
          const t3 = setTimeout(() => setSuccessMessage(""), 10000);
          return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
        }
      } catch {
        // Malformed response param — ignore
      }
    }
  }, [refreshBalance]);

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#C8F0E8] border border-[#7DD9C0] text-[#00A99D] px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in shadow-lg font-sans">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-[#1B2A4A] font-display tracking-tight mb-1">Billing</h1>
        <p className="text-sm text-muted-foreground font-sans">Your plan and usage.</p>
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
        style={{ borderColor: "#00A99D40", boxShadow: "0 0 20px #00A99D15" }}
      >
        {loading ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-sans">Current Balance</p>
                <p className="text-4xl font-bold text-[#1B2A4A]">
                  {credits}
                  <span className="text-xl text-muted-foreground ml-2">credits remaining</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">&asymp; {credits} minutes of AI support</p>
              </div>
              <div className="w-16 h-16 bg-[#C8F0E8] rounded-full flex items-center justify-center">
                <CardIcon className="w-8 h-8 text-[#00A99D]" />
              </div>
            </div>
            <div className="mt-4 h-2 bg-[#F0F9F8] rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all`}
                style={{ width: `${Math.max(barPercent, balance > 0 ? 2 : 0)}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Current Plan Badge */}
      {!loading && flwPlan && flwSubscriptionId && (
        <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#C8F0E8] rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-[#00A99D]" />
              </div>
              <div>
                <p className="text-sm text-[#8AADA6] font-sans">Current Plan</p>
                <p className="text-lg font-bold text-[#1B2A4A] capitalize">{flwPlan}</p>
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

      {/* Re-subscribe banner after card update */}
      {showResubBanner && (
        <div className="flex items-center gap-2 p-4 bg-[#F0F9F8] border border-[#D0EDE8] rounded-lg">
          <RefreshCw className="w-4 h-4 text-[#00A99D] shrink-0" />
          <p className="text-sm text-[#1B2A4A]">
            Select a plan below to re-subscribe with your new card. Your remaining credits are kept.
          </p>
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-3 py-2">
        <span
          className={`text-sm font-medium transition-colors ${
            billingCycle === "monthly" ? "text-[#1B2A4A]" : "text-[#8AADA6]"
          }`}
        >
          Monthly
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
          className="relative w-12 h-6 bg-[#00A99D] rounded-full transition-colors"
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
            billingCycle === "annual" ? "text-[#1B2A4A]" : "text-[#8AADA6]"
          }`}
        >
          Annual
        </span>
        {billingCycle === "annual" && (
          <span className="px-2 py-0.5 text-xs font-bold text-[#00A99D] bg-[#C8F0E8] rounded-full">
            Save 10%
          </span>
        )}
      </div>

      {/* Credit Packages — each card manages its own Flutterwave modal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CREDIT_PACKAGES.map((pkg) => (
          <FlutterwavePlanCard key={`${pkg.id}-${billingCycle}`} pkg={pkg} billingCycle={billingCycle} />
        ))}
      </div>

      {/* Subscription Management — cancel + update card */}
      {!loading && flwSubscriptionId && (
        <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#1B2A4A] mb-3 font-sans">Manage Subscription</h3>
          <div className="flex flex-wrap gap-3">
            {/* Update Payment Method */}
            <button
              disabled={cancelLoading}
              onClick={async () => {
                const ok = window.confirm(
                  "To update your card, we'll cancel your current subscription. " +
                  "Then you can re-subscribe with your new card.\n\n" +
                  "Your remaining credits are kept."
                );
                if (!ok) return;
                setCancelLoading(true);
                try {
                  const res = await fetch("/api/billing/flutterwave/cancel", { method: "POST" });
                  if (res.ok) {
                    setSuccessMessage("Subscription cancelled — select a plan to re-subscribe with your new card.");
                    setShowResubBanner(true);
                    setTimeout(() => setSuccessMessage(""), 8000);
                  } else {
                    const data = await res.json();
                    alert(data.error ?? "Failed to cancel. Please try again.");
                  }
                } catch {
                  alert("Network error — please try again.");
                } finally {
                  setCancelLoading(false);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1B2A4A] bg-white border border-[#D0EDE8] rounded-lg hover:border-[#00A99D] hover:bg-[#F0F9F8] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${cancelLoading ? "animate-spin" : ""}`} />
              Update Payment Method
            </button>

            {/* Cancel Subscription */}
            <button
              disabled={cancelLoading}
              onClick={async () => {
                const ok = window.confirm(
                  "Cancel your subscription?\n\n" +
                  "You'll keep your remaining credits but won't be charged again.\n" +
                  "Note: Annual plans are non-refundable."
                );
                if (!ok) return;
                setCancelLoading(true);
                try {
                  const res = await fetch("/api/billing/flutterwave/cancel", { method: "POST" });
                  if (res.ok) {
                    setSuccessMessage("Subscription cancelled. You can re-subscribe anytime.");
                    setTimeout(() => setSuccessMessage(""), 8000);
                  } else {
                    const data = await res.json();
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
      <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[#00A99D]" />
          <h3 className="text-sm font-bold text-[#1B2A4A] font-sans">Credit Usage (Last 30 Days)</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
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
        </div>
      </div>

      {/* Transaction History */}
      {loading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : (
        transactions.length > 0 && (
          <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#1B2A4A] mb-4 font-sans">Transaction History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D0EDE8]">
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground font-sans">Date</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground font-sans">Description</th>
                    <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground font-sans">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-[#D0EDE8]/50">
                      <td className="py-2.5 px-2 text-sm text-[#4A7A6D] font-sans">
                        {format(new Date(txn.date), "MMM dd, yyyy")}
                      </td>
                      <td className="py-2.5 px-2 text-sm text-[#1B2A4A] font-sans">{txn.description}</td>
                      <td
                        className={`py-2.5 px-2 text-sm text-right font-mono ${
                          (txn.type === "purchase" || txn.type === "credit") ? "text-[#00A99D]" : "text-[#E74C3C]"
                        }`}
                      >
                        {(txn.type === "purchase" || txn.type === "credit") ? "+" : ""}
                        {Math.floor(Math.abs(txn.amount) / 60)}m {Math.abs(txn.amount) % 60}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
