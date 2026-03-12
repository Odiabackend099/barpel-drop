"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Phone, Plug, Bot, CreditCard } from "lucide-react";
import { BarpelLogo } from "@/components/brand/BarpelLogo";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/calls", icon: Phone, label: "Call Logs" },
  { href: "/dashboard/integrations", icon: Plug, label: "Integrations" },
  { href: "/dashboard/voice", icon: Bot, label: "AI Voice" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

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
          fixed top-0 left-0 z-50 h-screen w-60 bg-[#F0F9F8] border-r border-[#D0EDE8] flex flex-col
          transition-transform duration-200
          lg:relative lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-4 border-b border-[#D0EDE8]">
          <div className="flex items-center gap-3">
            <BarpelLogo size={36} />
            <div>
              <div className="text-sm font-bold text-[#1B2A4A] font-display">BARPEL DROP AI</div>
              <div className="text-[10px] text-[#8AADA6] tracking-wide font-sans">MERCHANT DASHBOARD</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                  active
                    ? "bg-white text-[#00A99D] border-l-2 border-[#00A99D] shadow-sm"
                    : "text-[#4A7A6D] hover:text-[#1B2A4A] hover:bg-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#D0EDE8]">
          <p className="text-[10px] text-[#8AADA6] text-center font-sans">Powered by Vapi + Twilio</p>
        </div>
      </aside>
    </>
  );
}
