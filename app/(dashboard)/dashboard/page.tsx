"use client";

const LABOR_COST_PER_CALL = 3.40;

import { useState, useEffect } from "react";
import { toast } from "sonner";
import dynamic from 'next/dynamic';
import { m } from "framer-motion";
import { Phone, Clock, CreditCard as CardIcon, TrendingUp, Info } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import { CallLogTable } from "@/components/dashboard/CallLogTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, subDays } from "date-fns";
import type { CallLog } from "@/lib/mockApi";

const CallVolumeChart = dynamic(
  () => import('@/components/dashboard/CallVolumeChart'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded" />,
  }
);

// Stable fallback data for dev (not imported from mockApi directly to avoid prod guard)
const chartData = Array.from({ length: 14 }, (_, i) => ({
  date: format(subDays(new Date(), 13 - i), "MMM dd"),
  count: 0,
}));

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

interface DashboardStats {
  total_calls: number;
  credits_remaining: number;
  avg_handle_time: number;
  chart_data: Array<{ date: string; count: number }>;
  call_types: Record<string, number>;
  recent_calls?: CallLog[];
}

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

const MOCK_STATS: DashboardStats = {
  total_calls: 247,
  credits_remaining: 6234,
  avg_handle_time: 143,
  chart_data: chartData,
  call_types: {
    order_lookup: 98,
    return_request: 45,
    abandoned_cart_recovery: 52,
    general: 52,
  },
};

const CALL_TYPE_LABELS: Record<string, string> = {
  order_lookup: "Order Lookup",
  return_request: "Return Request",
  abandoned_cart_recovery: "Cart Recovery",
  general: "General",
};

const breakdownColors: Record<string, string> = {
  order_lookup: "#00A99D",
  return_request: "#F5A623",
  abandoned_cart_recovery: "#7DD9C0",
  general: "#8AADA6",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (useMock) {
          setStats(MOCK_STATS);
          setLoading(false);
          return;
        }
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          toast.error("Failed to load dashboard stats.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const callsByType = stats?.call_types ?? {};
  const total = Object.values(callsByType).reduce((a, b) => a + b, 0);
  const moneySaved = (stats?.total_calls ?? 0) * LABOR_COST_PER_CALL;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground font-sans">Here&apos;s how your AI is performing</p>
      </div>

      {/* Empty state for zero calls */}
      {!loading && (stats?.total_calls ?? 0) === 0 && (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
          <p className="text-muted-foreground mb-3">Your AI hasn&apos;t handled any calls yet.</p>
          <p className="text-sm text-muted-foreground mb-4">Make sure your number is live on your store.</p>
          <Link href="/dashboard/integrations">
            <Button variant="outline">View Integrations</Button>
          </Link>
        </div>
      )}

      {/* Stats */}
      {(stats?.total_calls ?? 0) > 0 && (
        <>
          <m.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            <m.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}>
            <StatCard
              icon={Phone}
              label="Total Calls (30d)"
              value={(stats?.total_calls ?? 0).toString()}
              color="#00A99D"
            />
            </m.div>
            <m.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}>
            <StatCard
              icon={Clock}
              label="Credits Remaining"
              value={`${Math.floor((stats?.credits_remaining ?? 0) / 60)} credits`}
              color="#7DD9C0"
              progress
              progressValue={((stats?.credits_remaining ?? 0) / 6000) * 100}
            />
            </m.div>
            <m.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}>
            <StatCard
              icon={CardIcon}
              label={
                <div className="flex items-center gap-1">
                  <span>Money Saved</span>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Based on the average cost of a human agent handling one support call (${LABOR_COST_PER_CALL.toFixed(2)})</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
              }
              value={`$${moneySaved.toFixed(2)}`}
              color="#1B2A4A"
            />
            </m.div>
            <m.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}>
            <StatCard
              icon={TrendingUp}
              label="Avg Handle Time"
              value={`${Math.floor((stats?.avg_handle_time ?? 0) / 60)}m ${(stats?.avg_handle_time ?? 0) % 60}s`}
              color="#F5A623"
            />
            </m.div>
          </m.div>

          {/* Charts */}
          <m.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 font-sans">Call volume, last 2 weeks</h3>
              </div>
              <div className="h-64">
                <CallVolumeChart data={stats?.chart_data ?? chartData} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 font-sans">Call Type Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(callsByType).map(([type, count]) => {
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <Badge color={breakdownColors[type] || "#8AADA6"}>{CALL_TYPE_LABELS[type] || type}</Badge>
                      <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: breakdownColors[type] || "#8AADA6",
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right font-sans">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </m.div>

          {/* Recent Calls */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 font-sans">Recent Calls</h3>
            <CallLogTable calls={stats?.recent_calls?.slice(0, 5) ?? []} expandedId={null} onToggle={() => {}} />
          </div>
        </>
      )}
    </div>
  );
}
