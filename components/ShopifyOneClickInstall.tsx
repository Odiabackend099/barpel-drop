"use client";

import { useState } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { ShopifyIcon } from "@/components/brand/ShopifyIcon";
import { ShopifyStoreInput } from "@/components/ShopifyStoreInput";

interface ShopifyOneClickInstallProps {
  returnTo: "onboarding" | "integrations";
  loading?: boolean;
  errorMessage?: string;
  deniedWarning?: boolean;
  onFallbackConnect?: (shop: string) => void;
  useCustomDistribution?: boolean;
}

export function ShopifyOneClickInstall({
  returnTo,
  loading = false,
  errorMessage,
  deniedWarning,
  onFallbackConnect,
  useCustomDistribution = false,
}: ShopifyOneClickInstallProps) {
  const [showFallback, setShowFallback] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const isLoading = loading || navigating;

  function handleOneClick() {
    setNavigating(true);
    window.location.href = `/api/shopify/oauth/start?returnTo=${returnTo}`;
  }

  return (
    <div className="space-y-4">
      {deniedWarning && (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-xs text-amber-700">
            You declined Shopify access. Connect now or skip and connect later
            from your dashboard.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs text-red-600">{errorMessage}</p>
        </div>
      )}

      {useCustomDistribution ? (
        // Custom distribution: store URL input is the only path — no managed install button.
        // onFallbackConnect must be provided by the parent; without it nothing renders.
        onFallbackConnect ? (
          <ShopifyStoreInput
            onConnect={onFallbackConnect}
            loading={isLoading}
            autoFocus
          />
        ) : (
          <p className="text-xs text-red-500 text-center">
            Configuration error: store connection unavailable.
          </p>
        )
      ) : (
        <>
          <button
            onClick={handleOneClick}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 shadow-brand hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting to Shopify...
              </>
            ) : (
              <>
                <ShopifyIcon size={16} />
                Connect with Shopify
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 text-center">
            You&apos;ll be redirected to Shopify to log in and approve access.
          </p>

          {onFallbackConnect && (
            <div>
              <button
                type="button"
                onClick={() => setShowFallback((v) => !v)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors mx-auto"
              >
                I know my store URL
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showFallback ? "rotate-180" : ""}`}
                />
              </button>

              {showFallback && (
                <div className="mt-3">
                  <ShopifyStoreInput
                    onConnect={onFallbackConnect}
                    loading={isLoading}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
