"use client";

import { useState, useEffect } from "react";
import { Star, Check, TrendingUp, CreditCard as CardIcon, Zap } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays } from "date-fns";

// Stable mock usage data for development — generated at runtime, not imported from mockApi
const usageData = Array.from({ length: 30 }, (_, i) => ({
  date: format(subDays(new Date(), 29 - i), "MMM dd"),
  credits: Math.floor(Math.random() * 200) + 50,
}));

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

export default function BillingPage() {
  const [successMessage, setSuccessMessage] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const { balanceMinutes, balanceSeconds, balance, usagePercent, transactions, loading } = useCredits();

  // Handle return from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true" || params.get("session_id")) {
      setSuccessMessage("Payment successful — credits added to your account!");
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      window.history.replaceState({}, "", "/dashboard/billing");
      return () => clearTimeout(timer);
    }
  }, []);

  const handleBuy = async (packageId: string) => {
    setIsCheckingOut(packageId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package_id: packageId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // silently fail
    } finally {
      setIsCheckingOut(null);
    }
  };

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
        <p className="text-sm text-muted-foreground font-sans">Manage your voice credits</p>
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
                  {balanceMinutes}
                  <span className="text-xl text-muted-foreground">min</span> {balanceSeconds}
                  <span className="text-xl text-muted-foreground">s</span>
                </p>
              </div>
              <div className="w-16 h-16 bg-[#C8F0E8] rounded-full flex items-center justify-center">
                <CardIcon className="w-8 h-8 text-[#00A99D]" />
              </div>
            </div>
            <div className="mt-4 h-2 bg-[#F0F9F8] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00A99D] to-[#7DD9C0] rounded-full transition-all"
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Credit Packages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CREDIT_PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
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
              <p className="text-3xl font-bold text-[#1B2A4A] mt-2">${(pkg.priceUsdCents / 100).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground font-sans">{pkg.minutes} minutes</p>
              <p className="text-xs text-muted-foreground mt-1 font-sans">${pkg.perMin.toFixed(2)}/min</p>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#4A7A6D] font-sans">
                <Check className="w-4 h-4 text-[#00A99D]" />
                WISMO calls
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
              onClick={() => handleBuy(pkg.id)}
              disabled={isCheckingOut === pkg.id}
              className={`w-full mt-4 inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                "popular" in pkg && pkg.popular
                  ? "bg-gradient-to-r from-[#00A99D] to-[#7DD9C0] text-white hover:shadow-lg hover:-translate-y-0.5"
                  : "bg-white border border-[#D0EDE8] text-[#1B2A4A] hover:border-[#00A99D] hover:bg-[#F0F9F8]"
              }`}
            >
              {isCheckingOut === pkg.id && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              Buy Now
            </button>
          </div>
        ))}
      </div>

      {/* Usage Chart */}
      <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[#00A99D]" />
          <h3 className="text-sm font-bold text-[#1B2A4A] font-sans">Credit Usage (Last 30 Days)</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={usageData}>
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
                          txn.type === "credit" ? "text-[#00A99D]" : "text-[#E74C3C]"
                        }`}
                      >
                        {txn.type === "credit" ? "+" : ""}
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
