"use client";

import type React from "react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

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
    <motion.div
      className="bg-white border border-brand-100 rounded-xl p-5 shadow-sm cursor-default"
      whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(13,148,136,0.12)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <motion.p
            className="text-2xl font-bold text-slate-900"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            {value}
          </motion.p>
        </div>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      {progress && typeof progressValue === "number" && (
        <div className="mt-3 h-1.5 bg-brand-50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(progressValue, 100)}%`, backgroundColor: color }}
          />
        </div>
      )}
    </motion.div>
  );
}
