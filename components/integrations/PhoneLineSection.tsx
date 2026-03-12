"use client";

import { useState } from "react";
import { Phone, Copy, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TestCallModal } from "@/components/dashboard/TestCallModal";
import { OutboundCallModal } from "@/components/dashboard/OutboundCallModal";
import { getCarriersForCountry } from "@/lib/carriers";
import type { MerchantData } from "@/lib/mockApi";

interface PhoneLineSectionProps {
  merchant: MerchantData | null;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-100">
        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
        Active — Your AI is answering calls
      </span>
    );
  }
  if (status === "pending" || status === "provisioning") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-200">
        <Loader2 className="w-3 h-3 animate-spin" />
        Setting up your number...
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-200">
        <span className="w-2 h-2 rounded-full bg-red-300" />
        Setup failed
      </span>
    );
  }
  if (status === "needs_address") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-200">
        <Loader2 className="w-3 h-3 animate-spin" />
        Being set up manually
      </span>
    );
  }
  return null;
}

export function PhoneLineSection({ merchant }: PhoneLineSectionProps) {
  const [copied, setCopied] = useState(false);
  const [testCallOpen, setTestCallOpen] = useState(false);
  const [outboundCallOpen, setOutboundCallOpen] = useState(false);
  const [forwardingOpen, setForwardingOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const phoneNumber = merchant?.support_phone || null;
  const provisioningStatus = merchant?.provisioning_status ?? "pending";
  const isActive = provisioningStatus === "active" && phoneNumber;
  const carriers = getCarriersForCountry(merchant?.country);

  const handleCopy = () => {
    if (!phoneNumber) return;
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const retryProvisioning = async () => {
    setRetrying(true);
    try {
      await fetch("/api/provisioning/retry", { method: "POST" });
    } finally {
      setRetrying(false);
    }
  };

  // Strip spaces from number for USSD codes
  const cleanNumber = phoneNumber?.replace(/\s/g, "") ?? "";

  return (
    <>
      <div
        className="rounded-xl p-5 text-white"
        style={{ background: "linear-gradient(135deg, #00A99D, #0d8a80)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm opacity-80 font-sans">Your AI Support Line</p>
              {isActive ? (
                <p className="text-2xl font-bold tracking-tight font-mono">{phoneNumber}</p>
              ) : provisioningStatus === "pending" || provisioningStatus === "provisioning" ? (
                <p className="text-lg font-medium opacity-80 font-sans">Setting up your number...</p>
              ) : provisioningStatus === "needs_address" ? (
                <p className="text-sm opacity-80 font-sans">
                  Your number is being set up manually. We&apos;ll notify you within 24 hours.
                </p>
              ) : provisioningStatus === "failed" ? (
                <p className="text-sm text-red-200 font-sans">
                  {merchant?.provisioning_error || "An error occurred during setup."}
                </p>
              ) : provisioningStatus === "active" && !phoneNumber ? (
                <p className="text-sm text-red-200 font-sans">
                  Something went wrong with your phone setup. Please retry.
                </p>
              ) : null}
            </div>
          </div>
          {isActive && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Copy className="w-3 h-3 mr-1" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          )}
        </div>

        {/* Status badge */}
        <div className="mt-2">
          <StatusBadge status={provisioningStatus} />
        </div>

        {/* Description */}
        {isActive && (
          <p className="mt-2 text-sm opacity-70 font-sans">
            Share this number with your customers as your store&apos;s support line
          </p>
        )}

        {/* Action buttons — active state */}
        {isActive && merchant?.vapi_agent_id && (
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

        {/* Retry button — failed state */}
        {(provisioningStatus === "failed" || (provisioningStatus === "active" && !phoneNumber)) && (
          <div className="mt-3">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={retryProvisioning}
              disabled={retrying}
            >
              {retrying ? (
                <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Retrying...</>
              ) : (
                <><RefreshCw className="w-3 h-3 mr-1" />Retry Setup</>
              )}
            </Button>
          </div>
        )}

        {/* Call forwarding subsection */}
        {isActive && carriers.length > 0 && (
          <div className="mt-4 border-t border-white/20 pt-4">
            <button
              onClick={() => setForwardingOpen(!forwardingOpen)}
              className="flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white transition-colors w-full text-left"
            >
              {forwardingOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              Already have a store number? Keep it.
            </button>

            {forwardingOpen && (
              <div className="mt-3 space-y-3">
                <p className="text-sm opacity-80 font-sans">
                  Turn on call forwarding from your existing number to your Barpel line.
                  Your customers call your store number as usual — Barpel&apos;s AI answers automatically.
                </p>

                <Tabs defaultValue={carriers[0]?.name} className="w-full">
                  <TabsList className="bg-white/10 flex-wrap h-auto gap-1 p-1">
                    {carriers.map((carrier) => (
                      <TabsTrigger
                        key={carrier.name}
                        value={carrier.name}
                        className="text-xs text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white"
                      >
                        {carrier.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {carriers.map((carrier) => (
                    <TabsContent key={carrier.name} value={carrier.name} className="mt-3">
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-sm font-mono text-white">
                          {carrier.getInstructions(cleanNumber)}
                        </p>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <p className="text-xs opacity-60 font-sans">
                  These codes may vary by region. Contact your carrier if they don&apos;t work.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {merchant?.vapi_agent_id && (
        <TestCallModal
          open={testCallOpen}
          onClose={() => setTestCallOpen(false)}
          assistantId={merchant.vapi_agent_id}
        />
      )}
      <OutboundCallModal
        open={outboundCallOpen}
        onClose={() => setOutboundCallOpen(false)}
      />
    </>
  );
}
