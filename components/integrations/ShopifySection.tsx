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
import { normalizeShopDomain } from "@/lib/shopify/oauth";
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
  const [shopDomain, setShopDomain] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

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

  const handleConnectShopify = async () => {
    const fullDomain = normalizeShopDomain(shopDomain);
    if (!/^[a-z0-9-]+\.myshopify\.com$/i.test(fullDomain)) {
      setConnectError("Enter a valid store URL — e.g. your-store.myshopify.com");
      return;
    }
    setConnecting(true);
    setConnectError("");
    try {
      const res = await fetch("/api/shopify/oauth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopDomain: fullDomain }),
      });
      const data = await res.json();
      if (!res.ok) {
        setConnectError(data.error || "Failed to start Shopify connection.");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setConnectError("Network error. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  const lastSyncText = shopifyIntegration?.last_synced_at
    ? formatDistanceToNow(new Date(shopifyIntegration.last_synced_at), { addSuffix: true })
    : "Never";

  return (
    <>
      <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm">
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
                <h3 className="font-bold text-[#1B2A4A] font-sans">Shopify Store</h3>
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
                <div className="flex items-center gap-4 text-xs text-[#4A7A6D] font-sans">
                  <span className="font-mono">{shopifyIntegration.shop_domain}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Synced {lastSyncText}
                  </span>
                </div>
              )}

              {/* Inline connect form — only shown when not connected */}
              {!isShopifyConnected && (
                <div className="mt-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shopDomain}
                      onChange={(e) => { setShopDomain(e.target.value); setConnectError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && shopDomain.trim() && handleConnectShopify()}
                      placeholder="yourstore.myshopify.com"
                      className="flex-1 px-3 py-2 rounded-lg border border-[#D0EDE8] bg-[#F0F9F8] text-sm text-[#1B2A4A] placeholder:text-[#8AADA6] focus:outline-none focus:ring-2 focus:ring-[#00A99D]/30 focus:border-[#00A99D] transition-colors font-sans"
                    />
                    <Button
                      size="sm"
                      disabled={connecting || !shopDomain.trim()}
                      onClick={handleConnectShopify}
                      className="bg-gradient-to-r from-[#00A99D] to-[#7DD9C0] text-white whitespace-nowrap"
                    >
                      {connecting ? (
                        <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Connecting…</>
                      ) : (
                        "Connect My Store"
                      )}
                    </Button>
                  </div>
                  {connectError && (
                    <p className="text-xs text-red-500 mt-1 font-sans">{connectError}</p>
                  )}
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
