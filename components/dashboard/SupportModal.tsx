"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Technical Issue",
  "Billing & Payments",
  "Account & Settings",
  "Feature Request",
  "Other",
] as const;

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
  userEmail: string | null;
}

export function SupportModal({ open, onClose, userEmail }: SupportModalProps) {
  const [state, setState] = useState<"form" | "success">("form");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticketRef, setTicketRef] = useState("");

  const canSubmit =
    category &&
    subject.trim().length >= 3 &&
    message.trim().length >= 10 &&
    !submitting;

  const reset = () => {
    setState("form");
    setCategory("");
    setSubject("");
    setMessage("");
    setSubmitting(false);
    setTicketRef("");
  };

  const handleClose = () => {
    if (!submitting) {
      reset();
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to submit");
      }

      setTicketRef(data.ticketRef);
      setState("success");
      toast.success("Support request submitted!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        {state === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-[#1B2A4A]">Help & Support</DialogTitle>
              <DialogDescription className="text-[#4A7A6D]">
                Describe your issue and we&apos;ll get back to you within a few hours on
                business days.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="support-category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="support-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="support-subject">Subject</Label>
                  <span className="text-xs text-[#8AADA6]">
                    {subject.length}/120
                  </span>
                </div>
                <Input
                  id="support-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value.slice(0, 120))}
                  placeholder="Brief summary of your issue"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="support-message">Message</Label>
                  <span className="text-xs text-[#8AADA6]">
                    {message.length}/2000
                  </span>
                </div>
                <Textarea
                  id="support-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                  placeholder="Please describe the issue in detail..."
                  rows={4}
                  disabled={submitting}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="bg-[#00A99D] hover:bg-[#008F85] text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Send request"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#00A99D]">
                <CheckCircle2 className="w-5 h-5" />
                Request submitted
              </DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="bg-[#F0FAF9] border border-[#D0EDE8] rounded-lg p-4 text-center">
                <p className="text-xs text-[#8AADA6] mb-1">Your ticket reference</p>
                <p className="text-xl font-bold font-mono text-[#1B2A4A]">
                  {ticketRef}
                </p>
              </div>

              <p className="text-sm text-[#4A7A6D]">
                We&apos;ll reply to{" "}
                <strong className="text-[#1B2A4A]">{userEmail}</strong> within a
                few hours on business days (Mon–Fri, 9am–6pm PT).
              </p>

              <p className="text-xs text-[#8AADA6]">
                In the meantime, you can check our{" "}
                <a
                  href="/contact"
                  className="text-[#00A99D] hover:underline"
                >
                  FAQ & Contact page
                </a>{" "}
                for quick answers.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="bg-[#00A99D] hover:bg-[#008F85] text-white">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
