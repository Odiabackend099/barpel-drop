"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ShopifyIcon } from "@/components/brand/ShopifyIcon";

interface ShopifyStoreInputProps {
  onConnect: (shopDomain: string) => void;
  loading?: boolean;
  autoFocus?: boolean;
}

export function ShopifyStoreInput({
  onConnect,
  loading = false,
  autoFocus = false,
}: ShopifyStoreInputProps) {
  const [storeName, setStoreName] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Order matters: lowercase first, then strip domain suffix (so a pasted full URL
    // loses ".myshopify.com" before the protocol strip), then strip invalid chars.
    value = value.toLowerCase();
    value = value.replace(/\.myshopify\.com.*/g, "");
    value = value.replace(/https?:\/\//g, "");
    value = value.replace(/[^a-z0-9-]/g, "");
    setStoreName(value);
    setError("");
  };

  const handleSubmit = () => {
    if (!storeName.trim()) {
      setError("Please enter your store name");
      return;
    }
    if (storeName.length < 2) {
      setError("Store name is too short");
      return;
    }
    onConnect(`${storeName}.myshopify.com`);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Your Shopify store name
        </label>

        {/* Input + suffix in one visual row */}
        <div
          className={`flex items-center border rounded-xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 ${
            error ? "border-red-400" : "border-slate-200"
          }`}
        >
          <input
            type="text"
            value={storeName}
            onChange={handleChange}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="powerfit-gadgets"
            autoFocus={autoFocus}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="flex-1 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 bg-white focus:outline-none"
          />
          <div
            className={`px-3 py-2.5 text-sm border-l border-slate-200 select-none whitespace-nowrap bg-slate-50 ${
              storeName ? "text-slate-500" : "text-slate-300"
            }`}
          >
            .myshopify.com
          </div>
        </div>

        {/* Live preview */}
        {storeName && (
          <p className="text-xs text-slate-400 mt-1.5 ml-0.5">
            Connecting to:{" "}
            <span className="text-brand-600 font-medium">
              {storeName}.myshopify.com
            </span>
          </p>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 mt-1.5 ml-0.5">{error}</p>
        )}
      </div>

      <p className="text-xs text-slate-400">
        This is the part before .myshopify.com in your store URL. Find it in
        Shopify admin under Settings → Domains.
      </p>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 shadow-brand hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <ShopifyIcon size={16} />
            Connect My Shopify Store
          </>
        )}
      </button>
    </div>
  );
}
