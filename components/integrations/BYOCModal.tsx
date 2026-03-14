"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BYOCModalProps {
  open: boolean;
  onClose: () => void;
}

export function BYOCModal({ open, onClose }: BYOCModalProps) {
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid =
    accountSid.startsWith("AC") &&
    authToken.length >= 20 &&
    phoneNumber.startsWith("+");

  const handleClose = () => {
    if (loading) return;
    setAccountSid("");
    setAuthToken("");
    setPhoneNumber("");
    setShowToken(false);
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/provisioning/byoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountSid, authToken, phoneNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      // Success — close modal. Realtime subscription updates the UI.
      handleClose();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="backdrop-blur-sm max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#1B2A4A] font-display">
            Connect Your Phone Number
          </DialogTitle>
          <DialogDescription className="text-sm font-sans">
            Use your own Twilio account to connect a phone number to your AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Account SID */}
          <div className="space-y-1.5">
            <Label htmlFor="byoc-sid" className="text-xs font-medium">
              Twilio Account SID
            </Label>
            <Input
              id="byoc-sid"
              placeholder="AC..."
              value={accountSid}
              onChange={(e) => setAccountSid(e.target.value.trim())}
              disabled={loading}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground font-sans">
              Find this at console.twilio.com → Account Info
            </p>
          </div>

          {/* Auth Token */}
          <div className="space-y-1.5">
            <Label htmlFor="byoc-token" className="text-xs font-medium">
              Twilio Auth Token
            </Label>
            <div className="relative">
              <Input
                id="byoc-token"
                type={showToken ? "text" : "password"}
                placeholder="Your auth token"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value.trim())}
                disabled={loading}
                className="font-mono text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showToken ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground font-sans">
              Find this at console.twilio.com → Account Info
            </p>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <Label htmlFor="byoc-phone" className="text-xs font-medium">
              Your Twilio Phone Number
            </Label>
            <Input
              id="byoc-phone"
              placeholder="+14707620377"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.trim())}
              disabled={loading}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground font-sans">
              Must be in E.164 format: +[country][number]
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 font-sans">
              Make sure this number is not in use elsewhere. Your AI will answer
              all calls to it.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive font-sans">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-[#00A99D] to-[#7DD9C0] text-white"
            disabled={!isValid || loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect My Number →"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
