"use client";

import { useState, useEffect } from "react";
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
  const [disableOpen, setDisableOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [optimisticEnabled, setOptimisticEnabled] = useState<boolean | null>(null);
  const [stats, setStats] = useState<{ detected: number; called: number; recovered: number } | null>(null);

  const displayEnabled = optimisticEnabled ?? isEnabled;
  const phoneNumber = merchant?.support_phone || null;

  // Fetch stats when enabled
  useEffect(() => {
    if (!displayEnabled) return;
    fetch("/api/integrations/cart-stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setStats(d); })
      .catch(() => {});
  }, [displayEnabled]);

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      setConsentOpen(true);
    } else {
      setDisableOpen(true);
    }
  };

  const handleConfirmDisable = async () => {
    setDisableOpen(false);
    setOptimisticEnabled(false);
    setToggling(true);
    try {
      const res = await fetch("/api/integrations/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "shopify", revoke: true }),
      });
      if (!res.ok) {
        setOptimisticEnabled(null);
      }
    } catch {
      setOptimisticEnabled(null);
    } finally {
      setToggling(false);
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
        setOptimisticEnabled(null);
      }
    } catch {
      setOptimisticEnabled(null);
    } finally {
      setToggling(false);
    }
  };

  return (
    <>
      <div className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative ${!isShopifyConnected ? "opacity-60" : ""}`}>
        {!isShopifyConnected && (
          <div className="absolute inset-0 rounded-xl bg-white/50 flex items-center justify-center z-10">
            <p className="text-sm text-slate-400 font-sans font-medium px-4 text-center">
              Connect your Shopify store first to enable cart recovery
            </p>
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-brand-light">
            <ShoppingCart className="w-6 h-6 text-brand-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 font-sans">Recover Abandoned Carts</h3>
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
            <p className="text-sm text-muted-foreground mb-1 font-sans">
              When a customer adds items to their cart but doesn&apos;t buy, your AI automatically
              calls them back 15 minutes later to answer questions and recover the sale.
            </p>
            <p className="text-xs text-muted-foreground/70 mb-3 font-sans">
              Only fires for carts over $100 where the customer has a phone number on file.
            </p>

            {/* Caller ID section — shown when enabled */}
            {displayEnabled && phoneNumber && (
              <div className="border-t border-slate-200 pt-3 mt-3">
                <p className="text-xs text-slate-500 font-sans mb-2">
                  Which number will customers see when your AI calls them?
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-brand-light rounded-lg border border-slate-200">
                    <Phone className="w-3.5 h-3.5 text-brand-600" />
                    <span className="text-sm font-mono text-slate-900">{phoneNumber}</span>
                    <Badge color="#00A99D">Active</Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Stats section — shown when enabled */}
            {displayEnabled && stats && (
              <div className="border-t border-slate-200 pt-3 mt-3">
                <p className="text-xs text-slate-400 font-sans mb-2">Last 30 days</p>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <span className="text-xs text-slate-400 font-sans">Carts detected</span>
                    <p className="text-sm font-bold text-slate-900">{stats.detected}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-sans">Calls made</span>
                    <p className="text-sm font-bold text-slate-900">{stats.called}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-sans">Recovered</span>
                    <p className="text-sm font-bold text-slate-900">{stats.recovered}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Consent Confirmation Modal (enable) */}
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
              className="bg-gradient-to-r from-brand-600 to-brand-400 text-white"
            >
              Yes, I confirm — Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Modal */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pause Cart Recovery?</DialogTitle>
            <DialogDescription className="pt-2">
              Pending cart recovery calls will be cancelled. You can re-enable at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDisableOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDisable}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              Yes, Pause
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
