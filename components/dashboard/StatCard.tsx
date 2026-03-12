"use client";

import type React from "react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string | React.ReactNode;
  value: string;
  color: string;
  progress?: boolean;
  progressValue?: number;
}

export function StatCard({ icon: Icon, label, value, color, progress, progressValue }: StatCardProps) {
  return (
    <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#8AADA6] mb-1">{label}</p>
          <p className="text-2xl font-bold text-[#1B2A4A]">{value}</p>
        </div>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      {progress && typeof progressValue === "number" && (
        <div className="mt-3 h-1.5 bg-[#F0F9F8] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(progressValue, 100)}%`, backgroundColor: color }}
          />
        </div>
      )}
    </div>
  );
}
