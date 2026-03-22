"use client";

import { Menu } from "lucide-react";
import { motion } from "framer-motion";
import { CreditBadge } from "@/components/dashboard/CreditBadge";
import { useMerchant } from "@/hooks/useMerchant";
import { useCredits } from "@/hooks/useCredits";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface NavbarProps {
  onMenuToggle: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { merchant } = useMerchant();
  const { balance, loading: creditsLoading } = useCredits();

  return (
    <motion.nav
      className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-white/20 px-4 sm:px-6 py-3"
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-brand-50 text-muted-foreground hover:text-slate-900 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="hidden lg:inline text-sm text-muted-foreground font-sans">
            {getGreeting()}{merchant?.business_name ? `, ${merchant.business_name}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <CreditBadge balanceSeconds={balance} loading={creditsLoading} />
          <span className="hidden sm:inline lg:hidden text-sm text-muted-foreground font-sans">
            {merchant?.business_name || "Loading..."}
          </span>
        </div>
      </div>
    </motion.nav>
  );
}
