"use client";

import type { HealthStatus } from "@/lib/admin-health-score";

const CONFIG: Record<HealthStatus, { label: string; color: string }> = {
  healthy: { label: "Healthy", color: "#00A99D" },
  "at-risk": { label: "At Risk", color: "#F5A623" },
  churned: { label: "Churned", color: "#E74C3C" },
};

export function HealthBadge({ status }: { status: HealthStatus }) {
  const { label, color } = CONFIG[status];
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{
        backgroundColor: `${color}15`,
        border: `1px solid ${color}30`,
        color,
      }}
    >
      {label}
    </span>
  );
}
