"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useMerchant } from "@/hooks/useMerchant";
import { useIntegrations } from "@/hooks/useIntegrations";
import { Skeleton } from "@/components/ui/skeleton";
import { PhoneLineSection } from "@/components/integrations/PhoneLineSection";
import { ShopifySection } from "@/components/integrations/ShopifySection";
import { AbandonedCartSection } from "@/components/integrations/AbandonedCartSection";
import { ComingSoonSection } from "@/components/integrations/ComingSoonSection";
import { CountrySelectorModal } from "@/components/integrations/CountrySelectorModal";

function ShopifyConnectedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (searchParams.get("connected") === "shopify") {
      toast.success("Shopify store connected!");
      router.replace("/dashboard/integrations", { scroll: false });
    }
    const shopifyError = searchParams.get("shopify_error");
    if (shopifyError) {
      const messages: Record<string, string> = {
        store_already_connected: "This Shopify store is already connected to another Barpel account. Disconnect it from that account first, or use a different store.",
        vault_store_failed: "Failed to save Shopify credentials. Please try again.",
        token_exchange_failed: "Could not get Shopify access token. Check your store domain and try again.",
        invalid_hmac: "Shopify signature verification failed. Please try again.",
        csrf_mismatch: "Session expired during Shopify authorization. Please try again.",
        merchant_not_found: "Account not found. Please sign out and back in.",
      };
      toast.error(messages[shopifyError] ?? "Shopify connection failed. Please try again.");
      router.replace("/dashboard/integrations", { scroll: false });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function IntegrationsPage() {
  const { merchant, loading: merchantLoading, deleteAiVoice, togglePause } =
    useMerchant();
  const {
    shopifyIntegration,
    isShopifyConnected,
    loading: intLoading,
    refetch,
  } = useIntegrations(merchant?.id);

  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [provisioningError, setProvisioningError] = useState<string | null>(
    null
  );
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling fallback — when provisioning_status is "provisioning", poll every 5s
  // until a terminal state is reached. This covers cases where Realtime doesn't fire.
  useEffect(() => {
    if (!merchant || merchant.provisioning_status !== "provisioning") {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const supabase = createClient();
    pollingRef.current = setInterval(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("merchants")
        .select("provisioning_status")
        .eq("user_id", user.id)
        .single();
      if (
        data &&
        ["active", "failed", "needs_address"].includes(
          data.provisioning_status
        )
      ) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
        window.location.reload();
      }
    }, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [merchant?.provisioning_status]);

  const handleCountrySelect = async (country: string) => {
    setCountryModalOpen(false);
    setProvisioningError(null);
    try {
      const res = await fetch("/api/provisioning/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresUpgrade) {
          toast.error(
            "Your free provision has been used. Upgrade your plan to get a new number."
          );
        } else {
          toast.error(data.error || "Provisioning failed");
        }
        setProvisioningError(data.error || null);
      }
    } catch {
      toast.error("Network error. Please check your connection.");
    }
  };

  if (merchantLoading || intLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <ShopifyConnectedToast />
      </Suspense>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight mb-1">
          Integrations
        </h1>
        <p className="text-sm text-muted-foreground font-sans">
          Your connected services and phone line
        </p>
      </div>

      {provisioningError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {provisioningError}
        </div>
      )}

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="space-y-6"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}>
          <PhoneLineSection
            merchant={merchant}
            onDelete={deleteAiVoice}
            onTogglePause={togglePause}
            onOpenCountrySelector={() => setCountryModalOpen(true)}
          />
        </motion.div>

        <CountrySelectorModal
          open={countryModalOpen}
          onClose={() => setCountryModalOpen(false)}
          onSelect={handleCountrySelect}
          defaultCountry={merchant?.country}
        />

        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}>
          <ShopifySection
            shopifyIntegration={shopifyIntegration}
            isShopifyConnected={isShopifyConnected}
            onRefetch={refetch}
          />
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}>
          <AbandonedCartSection
            merchant={merchant}
            shopifyIntegration={shopifyIntegration}
            isShopifyConnected={isShopifyConnected}
          />
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}>
          <ComingSoonSection />
        </motion.div>
      </motion.div>
    </div>
  );
}
