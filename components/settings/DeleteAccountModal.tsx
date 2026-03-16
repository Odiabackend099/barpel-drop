"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isConfirmed = confirmation === "DELETE";

  const handleDelete = async () => {
    if (!isConfirmed || deleting) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Failed to delete account"
        );
      }

      toast.success("Account deleted. Goodbye.");

      // Clear state and redirect after brief delay
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete account"
      );
      setDeleting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !deleting) {
      setConfirmation("");
      onClose();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete your account?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#4A7A6D]">
            This cannot be undone. This will permanently:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="space-y-1.5 text-sm text-[#4A7A6D] pl-4">
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">&#x2022;</span>
            Release your phone number
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">&#x2022;</span>
            Disconnect your Shopify store
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">&#x2022;</span>
            Delete all your call history
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">&#x2022;</span>
            Cancel your subscription
          </li>
        </ul>

        <div className="mt-2">
          <label
            htmlFor="delete-confirmation"
            className="text-sm font-medium text-[#1B2A4A]"
          >
            Type <span className="font-bold">DELETE</span> to confirm:
          </label>
          <Input
            id="delete-confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="DELETE"
            className="mt-1.5"
            disabled={deleting}
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting} onClick={() => handleOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={handleDelete}
            disabled={!isConfirmed || deleting}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Everything"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
