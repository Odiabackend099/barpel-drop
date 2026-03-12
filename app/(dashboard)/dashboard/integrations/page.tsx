"use client";

import { useState } from "react";
import { ShoppingBag, Phone, Clock, Copy, CheckCircle, RefreshCw } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useMerchant } from "@/hooks/useMerchant";
import { normalizeShopDomain } from "@/lib/shopify/oauth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { TestCallModal } from "@/components/dashboard/TestCallModal";
import { OutboundCallModal } from "@/components/dashboard/OutboundCallModal";

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

export default function IntegrationsPage() {
  const { merchant, loading } = useMerchant();
  const [copied, setCopied] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testCallOpen, setTestCallOpen] = useState(false);
  const [outboundCallOpen, setOutboundCallOpen] = useState(false);
  const [shopifyDialogOpen, setShopifyDialogOpen] = useState(false);
  const [shopDomain, setShopDomain] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  const phoneNumber = merchant?.support_phone || merchant?.phone_number || "+234 801 234 5678";
  const isConnected = merchant?.shopify_connected ?? false;
  const provisioningStatus = merchant?.provisioning_status ?? "active";

  const handleCopy = () => {
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/integrations/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "shopify" }),
      });
    } finally {
      setDisconnecting(false);
      setDisconnectOpen(false);
    }
  };

  const retryProvisioning = async () => {
    await fetch("/api/provisioning/retry", { method: "POST" });
  };

  const handleConnectShopify = async () => {
    const fullDomain = normalizeShopDomain(shopDomain);

    if (!/^[a-z0-9-]+\.myshopify\.com$/i.test(fullDomain)) {
      setConnectError("Enter a valid Shopify store URL (e.g. your-store.myshopify.com)");
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
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setConnectError("Network error. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2A4A] font-display tracking-tight mb-1">Integrations</h1>
        <p className="text-sm text-muted-foreground font-sans">Connect your store platforms and manage your AI phone line</p>
      </div>

      {/* Section 1 — AI Phone Line */}
      <div
        className="rounded-xl p-5 text-white"
        style={{ background: "linear-gradient(135deg, #00A99D, #0d8a80)" }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm opacity-80">Your AI Support Line</p>
              <p className="text-2xl font-bold tracking-tight font-mono">{phoneNumber}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <Copy className="w-3 h-3 mr-1" />
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>

        {provisioningStatus === "active" && merchant?.vapi_agent_id && (
          <div className="mt-4 flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={() => setTestCallOpen(true)}
            >
              Test in Browser
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={() => setOutboundCallOpen(true)}
            >
              Call a Number
            </Button>
          </div>
        )}

        {provisioningStatus === "failed" && (
          <div className="mt-3">
            <p className="text-sm text-red-200">
              Setup failed. {merchant?.provisioning_error || "An error occurred during provisioning."}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={retryProvisioning}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry Setup
            </Button>
          </div>
        )}

        {provisioningStatus === "provisioning" && (
          <p className="text-sm opacity-80 mt-2">
            Setting up your number... This usually takes under a minute. Refresh to check.
          </p>
        )}
      </div>

      {/* Section 2 — Shopify Connection */}
      <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#96BF4820" }}>
              <ShoppingBag className="w-6 h-6" style={{ color: "#96BF48" }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-[#1B2A4A] font-sans">Shopify</h3>
                {isConnected ? (
                  <Badge color="#00A99D">Connected</Badge>
                ) : (
                  <Badge color="#8AADA6">Not Connected</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2 font-sans">
                Connect your Shopify store to enable order tracking
              </p>
              {isConnected && (
                <div className="flex items-center gap-4 text-xs text-[#4A7A6D] font-sans">
                  <span className="font-mono">
                    {merchant?.shopify_domain || "your-store.myshopify.com"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last synced recently
                  </span>
                </div>
              )}
            </div>
          </div>
          <div>
            {isConnected ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-red-50"
                onClick={() => setDisconnectOpen(true)}
              >
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#00A99D] to-[#7DD9C0] text-white"
                onClick={() => setShopifyDialogOpen(true)}
              >
                Connect Shopify
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Section 3 — Outbound Calling */}
      <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#F0F9F8]">
            <Phone className="w-6 h-6 text-[#00A99D]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-[#1B2A4A] font-sans">Outbound Calling</h3>
              <Badge color="#8AADA6">Not enabled</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3 font-sans">
              Enable outbound calling for abandoned cart recovery. Requires customer consent.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5" />
                Caller ID: {merchant?.phone_number || "Not configured"}
              </div>
              <Button variant="outline" size="sm">
                Set up caller ID verification
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4 — Coming Soon */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Coming Soon</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* TikTok Shop */}
          <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm cursor-not-allowed pointer-events-none opacity-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-black/10">
                <ShoppingBag className="w-6 h-6 text-black/60" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-[#1B2A4A] font-sans">TikTok Shop</h3>
                  <Badge color="#8AADA6">Coming Soon</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-sans">Sync with TikTok Shop for order management</p>
              </div>
            </div>
          </div>

          {/* WooCommerce */}
          <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm cursor-not-allowed pointer-events-none opacity-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#96588A20" }}>
                <ShoppingBag className="w-6 h-6" style={{ color: "#96588A80" }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-[#1B2A4A] font-sans">WooCommerce</h3>
                  <Badge color="#8AADA6">Coming Soon</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-sans">Connect your WooCommerce store</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <DialogContent className="backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Disconnect {merchant?.shopify_domain || "Shopify"}?</DialogTitle>
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

      {/* Connect Shopify Dialog */}
      <Dialog open={shopifyDialogOpen} onOpenChange={(open) => { setShopifyDialogOpen(open); if (!open) { setConnectError(""); setShopDomain(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect your Shopify store</DialogTitle>
            <DialogDescription>
              Enter your Shopify store URL to start the connection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-sans">Store URL</label>
              <input
                type="text"
                value={shopDomain}
                onChange={(e) => { setShopDomain(e.target.value); setConnectError(""); }}
                onKeyDown={(e) => e.key === "Enter" && shopDomain.trim() && handleConnectShopify()}
                placeholder="yourstore.myshopify.com"
                className="w-full px-4 py-3 rounded-xl border border-[#D0EDE8] bg-[#F0F9F8] text-sm text-[#1B2A4A] placeholder:text-[#8AADA6] focus:outline-none focus:ring-2 focus:ring-[#00A99D]/30 focus:border-[#00A99D] transition-colors font-sans"
                autoFocus
              />
              {shopDomain.trim() && !connectError && (
                <p className="text-xs text-[#8AADA6] mt-1 font-sans">
                  {normalizeShopDomain(shopDomain)}
                </p>
              )}
            </div>
            {connectError && <p className="text-xs text-red-500 font-sans">{connectError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShopifyDialogOpen(false)} disabled={connecting}>
              Cancel
            </Button>
            <Button
              disabled={connecting || !shopDomain.trim()}
              onClick={handleConnectShopify}
              className="bg-gradient-to-r from-[#00A99D] to-[#7DD9C0] text-white"
            >
              {connecting ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Connecting...</> : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Call Modal */}
      {merchant?.vapi_agent_id && (
        <TestCallModal
          open={testCallOpen}
          onClose={() => setTestCallOpen(false)}
          assistantId={merchant.vapi_agent_id}
        />
      )}

      {/* Outbound Call Modal */}
      <OutboundCallModal
        open={outboundCallOpen}
        onClose={() => setOutboundCallOpen(false)}
      />
    </div>
  );
}
