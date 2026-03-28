"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Zap,
  Phone,
  Clock,
  CreditCard,
  Plug,
  RefreshCw,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { HealthBadge } from "@/components/admin/HealthBadge";
import { AdminNotes } from "@/components/admin/AdminNotes";
import type { HealthStatus } from "@/lib/admin-health-score";

interface MerchantDetail {
  merchant: {
    id: string;
    businessName: string;
    email: string;
    country: string;
    plan: string;
    planStatus: string;
    creditBalance: number;
    creditMinutes: number;
    accountActive: boolean;
    provisioningStatus: string;
    onboardedAt: string | null;
    createdAt: string;
    lastSignInAt: string | null;
    health: HealthStatus;
  };
  callStats: {
    total: number;
    byType: Record<string, number>;
    bySentiment: Record<string, number>;
    calls7d: number;
    calls30d: number;
    totalDuration: number;
    totalCreditsUsed: number;
    lastCallAt: string | null;
  };
  recentCalls: Array<{
    id: string;
    direction: string;
    call_type: string;
    duration_seconds: number;
    sentiment: string;
    ai_summary: string;
    started_at: string;
    credits_charged: number;
  }>;
  creditTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    balance_after: number;
    description: string;
    created_at: string;
  }>;
  billingTransactions: Array<{
    id: string;
    plan: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    created_at: string;
  }>;
  integrations: Array<{
    platform: string;
    shop_domain: string;
    shop_name: string;
    connection_active: boolean;
  }>;
  notes: Array<{
    id: string;
    merchant_id: string;
    author_email: string;
    content: string;
    created_at: string;
    updated_at: string;
  }>;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#00A99D",
  neutral: "#8AADA6",
  negative: "#E74C3C",
};

const PLAN_STATUS_COLORS: Record<string, string> = {
  active: "#00A99D",
  none: "#8AADA6",
  past_due_restricted: "#F5A623",
  past_due_final: "#E74C3C",
  cancelled: "#E74C3C",
};

export default function MerchantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const merchantId = params.id as string;

  const [data, setData] = useState<MerchantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/crm/merchants/${merchantId}`);
      if (res.status === 403 || res.status === 401) {
        setError("Unauthorized");
        return;
      }
      if (res.status === 404) {
        setError("Merchant not found");
        return;
      }
      if (!res.ok) {
        setError("Failed to load merchant details");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load merchant details");
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="h-6 w-32 bg-[#F0F9F8] rounded animate-pulse mb-6" />
        <div className="h-8 w-64 bg-[#F0F9F8] rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-[#D0EDE8] p-5 animate-pulse"
            >
              <div className="h-4 w-20 bg-[#F0F9F8] rounded mb-3" />
              <div className="h-8 w-16 bg-[#F0F9F8] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <button
          onClick={() => router.push("/dashboard/admin")}
          className="flex items-center gap-1 text-sm text-[#8AADA6] hover:text-[#1B2A4A] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Merchants
        </button>
        <div className="bg-white rounded-xl border border-[#E74C3C]/20 p-8 text-center">
          <p className="text-[#1B2A4A] font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { merchant, callStats, recentCalls, billingTransactions, integrations } = data;

  const planStatusColor = PLAN_STATUS_COLORS[merchant.planStatus] ?? "#8AADA6";

  return (
    <motion.div
      className="p-6 max-w-5xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
    >
      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard/admin")}
        className="flex items-center gap-1 text-sm text-[#8AADA6] hover:text-[#1B2A4A] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Merchants
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-[#1B2A4A] tracking-tight">
              {merchant.businessName || "Unnamed Merchant"}
            </h1>
            <HealthBadge status={merchant.health} />
          </div>
          <p className="text-sm text-[#8AADA6]">
            {merchant.email}
            {merchant.country && ` · ${merchant.country}`}
            {" · Joined "}
            {formatDistanceToNow(new Date(merchant.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
        <button
          onClick={fetchDetail}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#8AADA6] border border-[#D0EDE8] rounded-lg hover:text-[#1B2A4A] hover:border-[#8AADA6] transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Zap}
          label="Credit Balance"
          value={`${merchant.creditMinutes} min`}
          color={merchant.creditMinutes > 10 ? "#00A99D" : merchant.creditMinutes > 0 ? "#F5A623" : "#E74C3C"}
        />
        <StatCard
          icon={Phone}
          label="Total Calls"
          value={String(callStats.total)}
          color="#00A99D"
        />
        <StatCard
          icon={Clock}
          label="Last Login"
          value={
            merchant.lastSignInAt
              ? formatDistanceToNow(new Date(merchant.lastSignInAt), {
                  addSuffix: true,
                })
              : "Never"
          }
          color={merchant.lastSignInAt ? "#00A99D" : "#E74C3C"}
        />
        <StatCard
          icon={CreditCard}
          label="Plan Status"
          value={merchant.planStatus?.replace(/_/g, " ") ?? "None"}
          color={planStatusColor}
        />
      </div>

      {/* Integrations */}
      <Section title="Integrations" icon={Plug}>
        {integrations.length === 0 ? (
          <p className="text-sm text-[#8AADA6]">No integrations connected.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {integrations.map((int, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-[#D0EDE8]"
              >
                <span
                  className={`w-2 h-2 rounded-full ${int.connection_active ? "bg-[#00A99D]" : "bg-[#E74C3C]"}`}
                />
                <span className="text-sm text-[#1B2A4A] font-medium capitalize">
                  {int.platform.replace("_", " ")}
                </span>
                {int.shop_domain && (
                  <span className="text-xs text-[#8AADA6]">
                    {int.shop_domain}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Recent Calls */}
      <Section title={`Recent Calls (${callStats.total} total)`} icon={Phone}>
        {recentCalls.length === 0 ? (
          <p className="text-sm text-[#8AADA6]">No calls yet.</p>
        ) : (
          <>
            {/* Call stats summary */}
            {callStats.total > 0 && (
              <div className="flex flex-wrap gap-4 mb-4">
                {Object.entries(callStats.bySentiment).map(([sentiment, count]) => (
                  <div key={sentiment} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: SENTIMENT_COLORS[sentiment] ?? "#8AADA6" }}
                    />
                    <span className="text-xs text-[#8AADA6] capitalize">
                      {sentiment}: {count}
                    </span>
                  </div>
                ))}
                <span className="text-xs text-[#8AADA6]">
                  Last 7d: {callStats.calls7d} · Last 30d: {callStats.calls30d}
                </span>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] text-[#8AADA6] uppercase tracking-wider">
                    <th className="pb-2 pr-4">Direction</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Duration</th>
                    <th className="pb-2 pr-4">Sentiment</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCalls.map((call) => (
                    <tr key={call.id} className="border-t border-[#D0EDE8]/50">
                      <td className="py-2 pr-4 capitalize text-[#1B2A4A]">
                        {call.direction}
                      </td>
                      <td className="py-2 pr-4 text-[#8AADA6] capitalize">
                        {call.call_type?.replace(/_/g, " ") ?? "—"}
                      </td>
                      <td className="py-2 pr-4 text-[#1B2A4A] tabular-nums">
                        {Math.floor(call.duration_seconds / 60)}m{" "}
                        {call.duration_seconds % 60}s
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                          style={{
                            backgroundColor: `${SENTIMENT_COLORS[call.sentiment] ?? "#8AADA6"}15`,
                            color: SENTIMENT_COLORS[call.sentiment] ?? "#8AADA6",
                          }}
                        >
                          {call.sentiment ?? "—"}
                        </span>
                      </td>
                      <td className="py-2 text-[#8AADA6]">
                        {call.started_at
                          ? formatDistanceToNow(new Date(call.started_at), {
                              addSuffix: true,
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Section>

      {/* Recent Billing */}
      <Section title="Recent Billing" icon={CreditCard}>
        {billingTransactions.length === 0 ? (
          <p className="text-sm text-[#8AADA6]">No billing transactions.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] text-[#8AADA6] uppercase tracking-wider">
                  <th className="pb-2 pr-4">Amount</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Provider</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {billingTransactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-[#D0EDE8]/50">
                    <td className="py-2 pr-4 text-[#1B2A4A] font-medium tabular-nums">
                      {tx.currency === "USD" ? "$" : tx.currency}{" "}
                      {Number(tx.amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                        style={{
                          backgroundColor:
                            tx.status === "completed"
                              ? "#00A99D15"
                              : "#F5A62315",
                          color:
                            tx.status === "completed" ? "#00A99D" : "#F5A623",
                        }}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-[#8AADA6] capitalize">
                      {tx.provider ?? "—"}
                    </td>
                    <td className="py-2 text-[#8AADA6]">
                      {formatDistanceToNow(new Date(tx.created_at), {
                        addSuffix: true,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Notes */}
      <Section title="Internal Notes">
        <AdminNotes merchantId={merchantId} />
      </Section>
    </motion.div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-[#8AADA6]" />}
        <h2 className="text-sm font-medium text-[#8AADA6] uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div className="bg-white rounded-xl border border-[#D0EDE8] p-5">
        {children}
      </div>
    </div>
  );
}
