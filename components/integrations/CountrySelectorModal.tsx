"use client";

import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
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

interface CountrySelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (country: string) => void;
  defaultCountry?: string;
}

const COUNTRY_OPTIONS = [
  {
    code: "GB",
    flag: "\u{1F1EC}\u{1F1E7}",
    label: "United Kingdom (+44)",
    description: "Best for global businesses",
    recommended: true,
  },
  {
    code: "US",
    flag: "\u{1F1FA}\u{1F1F8}",
    label: "United States (+1)",
    description: "US-based customers",
    recommended: false,
  },
  {
    code: "CA",
    flag: "\u{1F1E8}\u{1F1E6}",
    label: "Canada (+1)",
    description: "Canadian customers",
    recommended: false,
  },
  {
    code: "NG",
    flag: "\u{1F30D}",
    label: "Nigeria / Ghana / Kenya",
    description: "You\u2019ll get a UK number for international reach",
    recommended: false,
  },
] as const;

export function CountrySelectorModal({
  open,
  onClose,
  onSelect,
  defaultCountry,
}: CountrySelectorModalProps) {
  const [selected, setSelected] = useState<string>(
    defaultCountry ?? "GB"
  );

  // Re-sync selection when the modal opens or defaultCountry changes
  // (merchant data may load after the component mounts)
  useEffect(() => {
    if (open) setSelected(defaultCountry ?? "GB");
  }, [open, defaultCountry]);

  const handleContinue = () => {
    onSelect(selected);
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-[#1B2A4A]">
            <Globe className="w-5 h-5 text-[#00A99D]" />
            Choose your number&apos;s country
          </AlertDialogTitle>
          <AlertDialogDescription className="sr-only">
            Select the country for your AI phone number. Your choice determines the number&apos;s prefix and routing.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          {COUNTRY_OPTIONS.map((option) => (
            <button
              key={option.code}
              onClick={() => setSelected(option.code)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selected === option.code
                  ? "border-[#00A99D] bg-[#00A99D]/5 ring-1 ring-[#00A99D]"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{option.flag}</span>
                  <div>
                    <p className="text-sm font-medium text-[#1B2A4A]">
                      {option.label}
                      {option.recommended && (
                        <span className="ml-2 text-[10px] font-bold tracking-wide uppercase text-[#00A99D] bg-[#00A99D]/10 px-1.5 py-0.5 rounded">
                          Recommended
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selected === option.code
                      ? "border-[#00A99D]"
                      : "border-gray-300"
                  }`}
                >
                  {selected === option.code && (
                    <div className="w-2 h-2 rounded-full bg-[#00A99D]" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <Button
            onClick={handleContinue}
            className="bg-gradient-to-r from-[#00A99D] to-[#7DD9C0] text-white hover:shadow-lg"
          >
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
