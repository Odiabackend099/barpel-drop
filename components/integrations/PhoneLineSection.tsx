"use client";

import { useState } from "react";
import {
  Phone,
  Copy,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  PauseCircle,
  PlayCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TestCallModal } from "@/components/dashboard/TestCallModal";
import { OutboundCallModal } from "@/components/dashboard/OutboundCallModal";
import { BYOCModal } from "@/components/integrations/BYOCModal";
import { getCarriersForCountry } from "@/lib/carriers";
import type { MerchantData } from "@/lib/mockApi";

interface PhoneLineSectionProps {
  merchant: MerchantData | null;
  onDelete: () => Promise<void>;
  onTogglePause: (pause: boolean) => Promise<void>;
  onOpenCountrySelector: () => void;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-100">
        <span className="w-2 h-2 rounded-full bg-brand-300 animate-pulse" />
        Active
      </span>
    );
  }
  if (status === "suspended") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-200">
        <PauseCircle className="w-3 h-3" />
        Paused
      </span>
    );
  }
  if (status === "provisioning") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-200">
        <Loader2 className="w-3 h-3 animate-spin" />
        Setting up your number...
      </span>
    );
  }
  if (status === "pending") {
    return null;
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
        <Clock className="w-3 h-3" />
        Being set up manually
      </span>
    );
  }
  return null;
}

export function PhoneLineSection({
  merchant,
  onDelete,
  onTogglePause,
  onOpenCountrySelector,
}: PhoneLineSectionProps) {
  const [copied, setCopied] = useState(false);
  const [testCallOpen, setTestCallOpen] = useState(false);
  const [outboundCallOpen, setOutboundCallOpen] = useState(false);
  const [forwardingOpen, setForwardingOpen] = useState(false);
  const [byocOpen, setBYOCOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pausing, setPausing] = useState(false);

  const phoneNumber = merchant?.support_phone || null;
  const provisioningStatus = merchant?.provisioning_status ?? "pending";
  const isSuspended = provisioningStatus === "suspended";
  const isActive =
    (provisioningStatus === "active" || isSuspended) && phoneNumber;
  const carriers = getCarriersForCountry(merchant?.country);

  const handleCopy = () => {
    if (!phoneNumber) return;
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRelease = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePause = async () => {
    setPausing(true);
    try {
      await onTogglePause(!isSuspended);
    } finally {
      setPausing(false);
    }
  };

  const cleanNumber = phoneNumber?.replace(/\s/g, "") ?? "";

  return (
    <>
      <div
        className="rounded-xl p-5 text-white"
        style={{ background: "linear-gradient(135deg, #0d9488, #0b7f74)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm opacity-80 font-sans">
                Your AI Support Line
              </p>

              {/* STATE 4 + suspended: Show phone number */}
              {isActive && (
                <p className="text-2xl font-bold tracking-tight font-mono">
                  {phoneNumber}
                </p>
              )}

              {/* STATE 2: Provisioning */}
              {provisioningStatus === "provisioning" && (
                <p className="text-lg font-medium opacity-80 font-sans">
                  Setting up your number...
                </p>
              )}

              {/* STATE 1: Pending */}
              {provisioningStatus === "pending" && (
                <p className="text-sm opacity-80 font-sans">
                  Get a phone number for your AI to answer calls
                </p>
              )}

              {/* needs_address sub-state */}
              {provisioningStatus === "needs_address" && (
                <p className="text-sm opacity-80 font-sans">
                  Your UK number requires manual setup. Expected within 24
                  hours.
                </p>
              )}

              {/* STATE 3: Failed */}
              {provisioningStatus === "failed" && (
                <p className="text-sm text-red-200 font-sans">
                  {merchant?.provisioning_error ||
                    "An error occurred during setup."}
                </p>
              )}
            </div>
          </div>

          {/* Copy button — active/suspended only */}
          {isActive && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Copy className="w-3 h-3 mr-1" />
              {copied ? "Copied!" : "Copy Number"}
            </Button>
          )}
        </div>

        {/* Status badge */}
        <div className="mt-2">
          <StatusBadge status={provisioningStatus} />
        </div>

        {/* AI Assistant info — active/suspended */}
        {isActive && merchant?.business_name && (
          <p className="mt-2 text-sm opacity-70 font-sans">
            AI Assistant: {merchant.business_name} Support
          </p>
        )}

        {/* Provisioning progress bar — provisioning state */}
        {provisioningStatus === "provisioning" && (
          <div className="mt-4">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/60 rounded-full animate-pulse w-2/3" />
            </div>
            <p className="text-xs opacity-60 mt-2 font-sans">
              Usually under 30 seconds
            </p>
          </div>
        )}

        {/* ── ACTION BUTTONS ── */}

        {/* STATE 4: Active — Test, Call, Pause, Release */}
        {isActive && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {merchant?.vapi_agent_id && (
              <>
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
              </>
            )}

            {/* Pause / Resume */}
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={handleTogglePause}
              disabled={pausing}
            >
              {isSuspended ? (
                <>
                  <PlayCircle className="w-3 h-3 mr-1" />
                  {pausing ? "Resuming..." : "Resume AI Line"}
                </>
              ) : (
                <>
                  <PauseCircle className="w-3 h-3 mr-1" />
                  {pausing ? "Pausing..." : "Pause AI Line"}
                </>
              )}
            </Button>

            {/* Release Number */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-red-500/30 hover:bg-red-500/50 text-white border-red-400/30"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Release Number
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Release your AI phone number?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Your number{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {phoneNumber}
                    </span>{" "}
                    will be permanently released. Customers will no longer be
                    able to reach your AI. You can get a new number at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRelease}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleting ? "Releasing..." : "Yes, Release Number"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* STATE 1: Pending — Get AI Number + BYOC */}
        {provisioningStatus === "pending" && (
          <div className="mt-4 flex flex-col gap-2">
            <Button
              size="sm"
              onClick={onOpenCountrySelector}
              className="bg-white text-brand-600 hover:bg-white/90 font-semibold w-fit"
            >
              <Phone className="w-3 h-3 mr-1" />
              Get My AI Number
            </Button>
            <button
              onClick={() => setBYOCOpen(true)}
              className="text-xs text-white/70 hover:text-white underline underline-offset-2 w-fit font-sans"
            >
              Already have a Twilio number? Bring your own &rarr;
            </button>
          </div>
        )}

        {/* STATE 3: Failed — Try Again + BYOC */}
        {provisioningStatus === "failed" && (
          <div className="mt-3 flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={onOpenCountrySelector}
            >
              <Phone className="w-3 h-3 mr-1" />
              Try Again
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={() => setBYOCOpen(true)}
            >
              Use My Own Number
            </Button>
          </div>
        )}

        {/* needs_address sub-state — BYOC alternative */}
        {provisioningStatus === "needs_address" && (
          <div className="mt-3">
            <p className="text-xs text-white/70 mb-2">
              While we set up your UK number manually, you can connect your own
              Twilio number instantly:
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={() => setBYOCOpen(true)}
            >
              <Phone className="w-3 h-3 mr-1" />
              Connect Your Own Number
            </Button>
          </div>
        )}

        {/* Call forwarding subsection — active/suspended only */}
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
                  Turn on call forwarding from your existing number to your
                  Barpel line. Your customers call your store number as usual —
                  Barpel&apos;s AI answers automatically.
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
                    <TabsContent
                      key={carrier.name}
                      value={carrier.name}
                      className="mt-3"
                    >
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-sm font-mono text-white">
                          {carrier.getInstructions(cleanNumber)}
                        </p>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <p className="text-xs opacity-60 font-sans">
                  These codes may vary by region. Contact your carrier if they
                  don&apos;t work.
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
      <BYOCModal open={byocOpen} onClose={() => setBYOCOpen(false)} />
    </>
  );
}
