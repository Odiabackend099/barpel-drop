"use client";

import { useState, useEffect, useCallback } from "react";
import { useMerchant } from "@/hooks/useMerchant";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { DeleteAccountModal } from "@/components/settings/DeleteAccountModal";
import {
  User,
  Bell,
  Shield,
  AlertTriangle,
  Loader2,
  Download,
  ExternalLink,
  KeyRound,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface NotificationPreferences {
  low_balance_sms: boolean;
  monthly_summary_email: boolean;
  payment_receipt_email: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  low_balance_sms: true,
  monthly_summary_email: true,
  payment_receipt_email: true,
};

export default function SettingsPage() {
  const { merchant, loading } = useMerchant();

  // Profile state
  const [businessName, setBusinessName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Notification state
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [savingNotification, setSavingNotification] = useState<string | null>(null);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Sync merchant data into local state
  useEffect(() => {
    if (merchant) {
      setBusinessName(merchant.business_name ?? "");
      const mp = merchant as unknown as Record<string, unknown>;
      if (mp.notification_preferences && typeof mp.notification_preferences === "object") {
        setPrefs({ ...DEFAULT_PREFS, ...(mp.notification_preferences as NotificationPreferences) });
      }
    }
  }, [merchant]);

  const hasNameChanged =
    merchant && businessName.trim() !== (merchant.business_name ?? "");

  // --- Profile ---

  const handleSaveProfile = async () => {
    const name = businessName.trim();
    if (name.length < 2 || name.length > 60) {
      toast.error("Business name must be 2-60 characters");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/merchant/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_name: name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Update failed");
      }
      toast.success("Business name updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResetPassword = async () => {
    const email = merchant?.email;
    if (!email || typeof email !== "string") {
      toast.error("No email address found");
      return;
    }

    setResettingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard/settings`,
      });
      if (error) throw error;
      toast.success("Password reset email sent. Check your inbox.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setResettingPassword(false);
    }
  };

  // --- Notifications ---

  const updateNotificationPref = useCallback(
    async (key: keyof NotificationPreferences, value: boolean) => {
      const previousPrefs = { ...prefs };
      const newPrefs = { ...prefs, [key]: value };

      // Optimistic update
      setPrefs(newPrefs);
      setSavingNotification(key);

      try {
        const res = await fetch("/api/merchant/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notification_preferences: newPrefs }),
        });
        if (!res.ok) {
          throw new Error("Failed to save");
        }
      } catch {
        // Rollback on error
        setPrefs(previousPrefs);
        toast.error("Failed to update notification preference");
      } finally {
        setSavingNotification(null);
      }
    },
    [prefs]
  );

  // --- Export ---

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `barpel-data-export.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  // --- Loading skeleton ---

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-[#1B2A4A]">Settings</h1>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-40 bg-[#F0F9F8] rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#1B2A4A]">Settings</h1>

      {/* Section 1: Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[#1B2A4A] text-base">
            <User className="w-4 h-4 text-[#00A99D]" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="business-name"
              className="text-sm font-medium text-[#1B2A4A]"
            >
              Business name
            </label>
            <div className="flex gap-2 mt-1.5">
              <Input
                id="business-name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your business name"
                maxLength={60}
              />
              <Button
                onClick={handleSaveProfile}
                disabled={!hasNameChanged || savingProfile}
                className="bg-[#00A99D] hover:bg-[#008F85] text-white shrink-0"
              >
                {savingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium text-[#1B2A4A]">
              Email address
            </label>
            <p className="text-sm text-[#4A7A6D] mt-1">
              {merchant?.email ?? "—"}
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-[#1B2A4A]">
                Password
              </label>
              <p className="text-xs text-[#8AADA6]">
                Send a password reset link to your email
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetPassword}
              disabled={resettingPassword}
            >
              {resettingPassword ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4 mr-1.5" />
              )}
              Change password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[#1B2A4A] text-base">
            <Bell className="w-4 h-4 text-[#00A99D]" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#1B2A4A]">
                Low balance warning
              </p>
              <p className="text-xs text-[#8AADA6]">
                SMS when you have less than 10 minutes remaining
              </p>
            </div>
            <Switch
              checked={prefs.low_balance_sms}
              onCheckedChange={(v) => updateNotificationPref("low_balance_sms", v)}
              disabled={savingNotification === "low_balance_sms"}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#1B2A4A]">
                Monthly usage summary
              </p>
              <p className="text-xs text-[#8AADA6]">
                Email summary on the 1st of each month
              </p>
            </div>
            <Switch
              checked={prefs.monthly_summary_email}
              onCheckedChange={(v) =>
                updateNotificationPref("monthly_summary_email", v)
              }
              disabled={savingNotification === "monthly_summary_email"}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#1B2A4A]">
                Payment receipts
              </p>
              <p className="text-xs text-[#8AADA6]">
                Email after each payment
              </p>
            </div>
            <Switch
              checked={prefs.payment_receipt_email}
              onCheckedChange={(v) =>
                updateNotificationPref("payment_receipt_email", v)
              }
              disabled={savingNotification === "payment_receipt_email"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Data & Privacy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[#1B2A4A] text-base">
            <Shield className="w-4 h-4 text-[#00A99D]" />
            Data &amp; Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#1B2A4A]">
                Download my data
              </p>
              <p className="text-xs text-[#8AADA6]">
                Export your account, calls, and billing data as a ZIP file
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              className="border-[#00A99D] text-[#00A99D] hover:bg-[#00A99D]/5"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1.5" />
              )}
              Download
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#1B2A4A]">
                Privacy policy
              </p>
              <p className="text-xs text-[#8AADA6]">
                How we handle your data
              </p>
            </div>
            <Link href="/privacy">
              <Button variant="ghost" size="sm" className="text-[#00A99D]">
                <ExternalLink className="w-4 h-4 mr-1.5" />
                View
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Danger Zone */}
      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-600 text-base">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#1B2A4A]">
                Delete account
              </p>
              <p className="text-xs text-[#8AADA6] max-w-sm">
                Permanently deletes your account, releases your phone number,
                disconnects your Shopify store, and removes all personal data.
                Billing history is retained for 7 years as required by law.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              className="border-red-300 text-red-600 hover:bg-red-50 shrink-0"
            >
              Delete My Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
