"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  Users,
  AlertTriangle,
  TrendingDown,
  Shield,
  BarChart3,
} from "lucide-react";
import { MerchantList } from "@/components/admin/MerchantList";

interface AdminStats {
  mrr: number;
  activeSubscribers: number;
  churnCount: number;
  churnRate: number;
  dunningCount: number;
  paymentSuccessRate: number;
  totalMerchants: number;
  planBreakdown: Record<string, number>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.status === 403 || res.status === 401) {
          setError("Unauthorized — your email is not in the admin list.");
          return;
        }
        if (!res.ok) {
          setError("Failed to load stats.");
          return;
        }
        const data = await res.json();
        setStats(data);
      } catch {
        setError("Failed to load stats.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#1B2A4A] tracking-tight mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#D0EDE8] p-6 animate-pulse">
              <div className="h-4 w-24 bg-[#F0F9F8] rounded mb-3" />
              <div className="h-8 w-20 bg-[#F0F9F8] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-white rounded-xl border border-[#E74C3C]/20 p-8 text-center">
          <Shield className="w-10 h-10 text-[#E74C3C] mx-auto mb-3" />
          <p className="text-[#1B2A4A] font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: "Monthly Recurring Revenue",
      value: `$${stats.mrr.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "#00A99D",
    },
    {
      label: "Active Subscribers",
      value: stats.activeSubscribers.toString(),
      icon: Users,
      color: "#00A99D",
    },
    {
      label: "Payment Success Rate",
      value: `${stats.paymentSuccessRate}%`,
      icon: BarChart3,
      color: stats.paymentSuccessRate >= 95 ? "#00A99D" : stats.paymentSuccessRate >= 85 ? "#F5A623" : "#E74C3C",
    },
    {
      label: "In Dunning",
      value: stats.dunningCount.toString(),
      icon: AlertTriangle,
      color: stats.dunningCount > 0 ? "#F5A623" : "#00A99D",
    },
    {
      label: "Churn (All Time)",
      value: stats.churnCount.toString(),
      icon: TrendingDown,
      color: "#8AADA6",
    },
    {
      label: "Total Merchants",
      value: stats.totalMerchants.toString(),
      icon: Users,
      color: "#8AADA6",
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-[#1B2A4A] tracking-tight mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-[#D0EDE8] p-6 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
              <span className="text-xs font-medium text-[#8AADA6] uppercase tracking-wider">
                {card.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-[#1B2A4A]">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      {Object.keys(stats.planBreakdown).length > 0 && (
        <div className="bg-white rounded-xl border border-[#D0EDE8] p-6">
          <h2 className="text-sm font-medium text-[#8AADA6] uppercase tracking-wider mb-4">
            Active Subscribers by Plan
          </h2>
          <div className="flex gap-6">
            {Object.entries(stats.planBreakdown).map(([plan, count]) => (
              <div key={plan} className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#1B2A4A] capitalize">{plan}</span>
                <span className="text-sm text-[#8AADA6]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Merchant List */}
      <div className="mt-8 border-t border-[#D0EDE8] pt-8">
        <h2 className="text-lg font-semibold text-[#1B2A4A] mb-4">Merchants</h2>
        <MerchantList />
      </div>
    </div>
  );
}
