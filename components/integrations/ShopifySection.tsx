"use client";

import { useState } from "react";
import { ShoppingBag, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

interface ShopifySectionProps {
  shopifyIntegration: Integration | null;
  isShopifyConnected: boolean;
  onRefetch: () => void;
}

export function ShopifySection({
  shopifyIntegration,
  isShopifyConnected,
  onRefetch,
}: ShopifySectionProps) {
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const shopName = shopifyIntegration?.shop_name || shopifyIntegration?.shop_domain || "Shopify";

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/integrations/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "shopify" }),
      });
      onRefetch();
    } finally {
      setDisconnecting(false);
      setDisconnectOpen(false);
    }
  };

  const handleConnectShopify = () => {
    setConnecting(true);
    // Navigate to the GET route — same OAuth flow as onboarding Step 2
    window.location.href = "/api/shopify/oauth/start?returnTo=integrations";
  };

  const lastSyncText = shopifyIntegration?.last_synced_at
    ? formatDistanceToNow(new Date(shopifyIntegration.last_synced_at), { addSuffix: true })
    : "Never";

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div
              className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: "#96BF4820" }}
            >
              <ShoppingBag className="w-6 h-6" style={{ color: "#96BF48" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900 font-sans">Shopify Store</h3>
                {isShopifyConnected ? (
                  <Badge color="#00A99D">Connected: {shopName}</Badge>
                ) : (
                  <Badge color="#8AADA6">Not Connected</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2 font-sans">
                Connect your Shopify store so your AI can look up orders and track deliveries for your customers
              </p>
              {isShopifyConnected && shopifyIntegration && (
                <div className="flex items-center gap-4 text-xs text-slate-500 font-sans">
                  <span className="font-mono">{shopifyIntegration.shop_domain}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Synced {lastSyncText}
                  </span>
                </div>
              )}

              {/* One-button connect — no input field, no modal */}
              {!isShopifyConnected && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    disabled={connecting}
                    onClick={handleConnectShopify}
                    className="bg-gradient-to-r from-brand-600 to-brand-400 text-white whitespace-nowrap"
                  >
                    {connecting ? (
                      <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Connecting…</>
                    ) : (
                      "Connect My Store"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Disconnect button — only when connected */}
          {isShopifyConnected && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-red-50"
              onClick={() => setDisconnectOpen(true)}
            >
              Disconnect
            </Button>
          )}
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <DialogContent className="backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Disconnect {shopName}?</DialogTitle>
            <DialogDescription>
              Your AI will not be able to look up orders until you reconnect.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={disconnecting} onClick={handleDisconnect}>
              {disconnecting ? "Disconnecting..." : "Yes, Disconnect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
