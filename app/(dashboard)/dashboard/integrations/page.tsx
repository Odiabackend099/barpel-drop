"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
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
        <h1 className="text-2xl font-bold text-[#1B2A4A] font-display tracking-tight mb-1">
          Integrations
        </h1>
        <p className="text-sm text-muted-foreground font-sans">
          Connect your store and manage your AI phone line
        </p>
      </div>

      {provisioningError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {provisioningError}
        </div>
      )}

      <PhoneLineSection
        merchant={merchant}
        onDelete={deleteAiVoice}
        onTogglePause={togglePause}
        onOpenCountrySelector={() => setCountryModalOpen(true)}
      />

      <CountrySelectorModal
        open={countryModalOpen}
        onClose={() => setCountryModalOpen(false)}
        onSelect={handleCountrySelect}
        defaultCountry={merchant?.country}
      />

      <ShopifySection
        shopifyIntegration={shopifyIntegration}
        isShopifyConnected={isShopifyConnected}
        onRefetch={refetch}
      />

      <AbandonedCartSection
        merchant={merchant}
        shopifyIntegration={shopifyIntegration}
        isShopifyConnected={isShopifyConnected}
      />

      <ComingSoonSection />
    </div>
  );
}
