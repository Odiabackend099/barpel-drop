"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Phone,
  Plug,
  Bot,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
  Settings,
  LifeBuoy,
} from "lucide-react";
import { BarpelLogo } from "@/components/brand/BarpelLogo";
import { useCredits } from "@/hooks/useCredits";
import { SupportModal } from "@/components/dashboard/SupportModal";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/calls", icon: Phone, label: "Call Logs" },
  { href: "/dashboard/integrations", icon: Plug, label: "Integrations" },
  { href: "/dashboard/voice", icon: Bot, label: "AI Voice" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { balance, loading: creditsLoading } = useCredits();
  const [supportOpen, setSupportOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  const balanceMinutes = Math.floor(balance / 60);

  // Progress bar color based on balance thresholds
  const barColor =
    balance >= 600
      ? "bg-[#00A99D]" // teal: 10+ min
      : balance >= 60
      ? "bg-amber-400" // amber: 1-10 min
      : "bg-red-500"; // red: < 1 min

  const barPercent = Math.min((balance / 15000) * 100, 100);
  const isLow = balance < 60;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-[#F0F9F8] border-r border-[#D0EDE8] flex flex-col
          transition-all duration-200
          lg:relative lg:translate-x-0
          ${collapsed ? "w-16" : "w-60"}
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header — logo + brand + collapse toggle (always at top) */}
        <div className="p-3 border-b border-[#D0EDE8]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <BarpelLogo size={collapsed ? 26 : 32} />
              {!collapsed && (
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#1B2A4A] font-display truncate">BARPEL DROP AI</div>
                  <div className="text-[10px] text-[#8AADA6] tracking-wide font-sans">MERCHANT DASHBOARD</div>
                </div>
              )}
            </div>
            <button
              onClick={onToggleCollapse}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="shrink-0 p-1.5 rounded-md text-[#8AADA6] hover:text-[#1B2A4A] hover:bg-[#D0EDE8]/50 transition-colors"
            >
              {collapsed
                ? <PanelLeftOpen className="w-4 h-4" />
                : <PanelLeftClose className="w-4 h-4" />
              }
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${collapsed ? "p-2" : "p-4"} space-y-1`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center ${collapsed ? "justify-center" : ""} gap-3 ${collapsed ? "px-2" : "px-3"} py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                  active
                    ? "bg-white text-[#00A99D] border-l-2 border-[#00A99D] shadow-sm"
                    : "text-[#4A7A6D] hover:text-[#1B2A4A] hover:bg-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Help & Support */}
        <div className={`${collapsed ? "px-2" : "px-4"} pb-1`}>
          <button
            onClick={() => setSupportOpen(true)}
            title="Help & Support"
            className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-3"} ${collapsed ? "px-2" : "px-3"} py-2 rounded-lg text-sm transition-colors text-[#8AADA6] hover:text-[#4A7A6D] hover:bg-[#D0EDE8]/40`}
          >
            <LifeBuoy className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Help &amp; Support</span>}
          </button>
        </div>

        {/* Credit Widget */}
        <div className={`${collapsed ? "px-2" : "px-4"} pb-2`}>
          {collapsed ? (
            <Link
              href="/dashboard/billing"
              title={creditsLoading ? "Loading..." : `${balanceMinutes} credits`}
              className={`flex items-center justify-center p-2 rounded-lg ${isLow ? "animate-pulse" : ""}`}
            >
              <Zap className={`w-4 h-4 ${isLow ? "text-red-500" : "text-[#00A99D]"}`} />
            </Link>
          ) : (
            <div className="bg-white rounded-lg border border-[#D0EDE8] p-3">
              {creditsLoading ? (
                <div className="h-8 bg-[#F0F9F8] rounded animate-pulse" />
              ) : (
                <>
                  <div className="h-1.5 bg-[#F0F9F8] rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all ${isLow ? "animate-pulse" : ""}`}
                      style={{ width: `${Math.max(barPercent, balance > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${isLow ? "text-red-600" : "text-[#4A7A6D]"} font-sans`}>
                      {balanceMinutes} credits
                    </span>
                    <Link
                      href="/dashboard/billing"
                      className="text-[10px] text-[#00A99D] hover:underline font-sans"
                    >
                      Top up &rarr;
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!collapsed && (
          <p className="text-[10px] text-[#8AADA6] text-center py-3 font-sans border-t border-[#D0EDE8]">
            Powered by Vapi + Twilio
          </p>
        )}
      </aside>

      <SupportModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        userEmail={userEmail}
      />
    </>
  );
}
