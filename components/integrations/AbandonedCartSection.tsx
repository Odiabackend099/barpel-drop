"use client";

import { useState } from "react";
import { ShoppingCart, Phone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { MerchantData } from "@/lib/mockApi";
import type { Integration } from "@/hooks/useIntegrations";

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide"
      style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      {children}
    </span>
  );
}

interface AbandonedCartSectionProps {
  merchant: MerchantData | null;
  shopifyIntegration: Integration | null;
  isShopifyConnected: boolean;
}

export function AbandonedCartSection({
  merchant,
  shopifyIntegration,
  isShopifyConnected,
}: AbandonedCartSectionProps) {
  const isEnabled = !!shopifyIntegration?.outbound_consent_confirmed_at;
  const [consentOpen, setConsentOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [optimisticEnabled, setOptimisticEnabled] = useState<boolean | null>(null);

  const displayEnabled = optimisticEnabled ?? isEnabled;
  const phoneNumber = merchant?.support_phone || null;

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      // Show consent modal
      setConsentOpen(true);
    } else {
      // Disable without confirmation
      setOptimisticEnabled(false);
      setToggling(true);
      try {
        const res = await fetch("/api/integrations/consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: "shopify", revoke: true }),
        });
        if (!res.ok) {
          setOptimisticEnabled(null); // revert
        }
      } catch {
        setOptimisticEnabled(null); // revert
      } finally {
        setToggling(false);
      }
    }
  };

  const handleConfirmConsent = async () => {
    setOptimisticEnabled(true);
    setConsentOpen(false);
    setToggling(true);
    try {
      const res = await fetch("/api/integrations/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "shopify" }),
      });
      if (!res.ok) {
        setOptimisticEnabled(null); // revert
      }
    } catch {
      setOptimisticEnabled(null); // revert
    } finally {
      setToggling(false);
    }
  };

  return (
    <>
      <div className={`bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm relative ${!isShopifyConnected ? "opacity-60" : ""}`}>
        {!isShopifyConnected && (
          <div className="absolute inset-0 rounded-xl bg-white/50 flex items-center justify-center z-10">
            <p className="text-sm text-[#8AADA6] font-sans font-medium px-4 text-center">
              Connect your Shopify store first to enable cart recovery
            </p>
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#F0F9F8]">
            <ShoppingCart className="w-6 h-6 text-[#00A99D]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#1B2A4A] font-sans">Recover Abandoned Carts</h3>
                {displayEnabled ? (
                  <Badge color="#00A99D">Enabled</Badge>
                ) : (
                  <Badge color="#8AADA6">Disabled</Badge>
                )}
              </div>
              {isShopifyConnected && (
                <div className="flex items-center gap-2">
                  <label htmlFor="cart-recovery-toggle" className="text-xs text-muted-foreground font-sans">
                    {displayEnabled ? "On" : "Off"}
                  </label>
                  <Switch
                    id="cart-recovery-toggle"
                    checked={displayEnabled}
                    onCheckedChange={handleToggle}
                    disabled={toggling || !isShopifyConnected}
                  />
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3 font-sans">
              When a customer adds items to their cart but doesn&apos;t buy, your AI automatically
              calls them back 15 minutes later to answer questions and recover the sale.
            </p>

            {/* Caller ID section — shown when enabled */}
            {displayEnabled && phoneNumber && (
              <div className="border-t border-[#D0EDE8] pt-3 mt-3">
                <p className="text-xs text-[#4A7A6D] font-sans mb-2">
                  Which number will customers see when your AI calls them?
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#F0F9F8] rounded-lg border border-[#D0EDE8]">
                    <Phone className="w-3.5 h-3.5 text-[#00A99D]" />
                    <span className="text-sm font-mono text-[#1B2A4A]">{phoneNumber}</span>
                    <Badge color="#00A99D">Active</Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Consent Confirmation Modal */}
      <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Abandoned Cart Recovery</DialogTitle>
            <DialogDescription className="pt-2">
              By enabling this, you confirm your store tells customers they may receive
              follow-up calls. This is required by law.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConsentOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmConsent}
              className="bg-gradient-to-r from-[#00A99D] to-[#7DD9C0] text-white"
            >
              Yes, I confirm — Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
