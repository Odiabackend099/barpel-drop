"use client";

import { useMerchant } from "@/hooks/useMerchant";
import { useIntegrations } from "@/hooks/useIntegrations";
import { Skeleton } from "@/components/ui/skeleton";
import { PhoneLineSection } from "@/components/integrations/PhoneLineSection";
import { ShopifySection } from "@/components/integrations/ShopifySection";
import { AbandonedCartSection } from "@/components/integrations/AbandonedCartSection";
import { ComingSoonSection } from "@/components/integrations/ComingSoonSection";

export default function IntegrationsPage() {
  const { merchant, loading: merchantLoading } = useMerchant();
  const {
    shopifyIntegration,
    isShopifyConnected,
    loading: intLoading,
    refetch,
  } = useIntegrations(merchant?.id);

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
      <div>
        <h1 className="text-2xl font-bold text-[#1B2A4A] font-display tracking-tight mb-1">
          Integrations
        </h1>
        <p className="text-sm text-muted-foreground font-sans">
          Connect your store and manage your AI phone line
        </p>
      </div>

      <PhoneLineSection merchant={merchant} />

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
