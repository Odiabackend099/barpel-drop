"use client";

import { LogOut, Menu } from "lucide-react";
import { BarpelLogo } from "@/components/brand/BarpelLogo";
import { CreditBadge } from "@/components/dashboard/CreditBadge";
import { useMerchant } from "@/hooks/useMerchant";
import { useCredits } from "@/hooks/useCredits";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface NavbarProps {
  onMenuToggle: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { merchant } = useMerchant();
  const { balance, loading: creditsLoading } = useCredits();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-white/20 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-[#F0F9F8] text-[#8AADA6] hover:text-[#1B2A4A] transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <BarpelLogo size={36} />
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-[#1B2A4A] font-display">BARPEL DROP AI</div>
            <div className="text-[10px] text-[#8AADA6] tracking-wide font-sans">MERCHANT DASHBOARD</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <CreditBadge balanceSeconds={balance} loading={creditsLoading} />
          <span className="hidden sm:inline text-sm text-[#4A7A6D] font-sans">
            {merchant?.business_name || "Loading..."}
          </span>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg hover:bg-[#F0F9F8] text-[#8AADA6] hover:text-[#1B2A4A] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
