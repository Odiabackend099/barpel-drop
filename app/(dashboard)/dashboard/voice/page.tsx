"use client";

import { useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { PERSONA_TEMPLATES } from "@/lib/constants";
import { useMerchant } from "@/hooks/useMerchant";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function VoicePage() {
  const { merchant, loading, updateCustomPrompt } = useMerchant();
  const [prompt, setPrompt] = useState(merchant?.custom_prompt || "");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync initial prompt once merchant data loads
  if (!loading && merchant && prompt === "" && merchant.custom_prompt) {
    setPrompt(merchant.custom_prompt);
  }

  const brandName = merchant?.business_name || "Your Store";

  const applyTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt.replace("[Brand]", brandName));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCustomPrompt(prompt);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const previewGreeting = () => {
    if (!prompt) return `Hello! Thank you for calling ${brandName} support. How can I help you today?`;
    const lower = prompt.toLowerCase();
    if (lower.includes("professional") || lower.includes("formal")) {
      return `Good day! Thank you for contacting ${brandName}. My name is Alex, and I'll be assisting you today. How may I be of service?`;
    }
    if (lower.includes("friendly") || lower.includes("casual")) {
      return `Hey there! Thanks for calling ${brandName}! I'm Alex, and I'm here to help. What's going on?`;
    }
    if (lower.includes("luxury") || lower.includes("vip")) {
      return `Welcome to ${brandName}. It is my pleasure to assist you today. How may I make your experience exceptional?`;
    }
    if (lower.includes("urgent") || lower.includes("fast") || lower.includes("brief") || lower.includes("efficient")) {
      return `Hello! This is ${brandName} support. I'm here to resolve your issue quickly. What can I help you with?`;
    }
    if (lower.includes("empathetic") || lower.includes("patient")) {
      return `Hello, welcome to ${brandName}. I understand how important this is to you and I'm here to take care of you. How can I help?`;
    }
    return `Hello! Thank you for calling ${brandName} support. How can I help you today?`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2A4A] font-display tracking-tight mb-1">Customize Your AI</h1>
        <p className="text-sm text-muted-foreground font-sans">Tell your AI how to speak to your customers.</p>
      </div>

      {/* Quick Templates */}
      <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[#00A99D]" />
          <h3 className="text-sm font-bold text-[#1B2A4A] font-sans">Quick Start Templates</h3>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PERSONA_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t.prompt)}
                className="p-3 text-left bg-[#F0F9F8] rounded-lg border border-[#D0EDE8] hover:border-[#00A99D]/50 hover:bg-white transition-all"
              >
                <p className="font-medium text-[#1B2A4A] text-sm font-sans">{t.label}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Voice Editor */}
      <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#1B2A4A] mb-4 font-sans">Voice Prompt</h3>
        {loading ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : (
          <>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
              placeholder={`Example: You are Emma, a friendly support agent for ${brandName}. Always greet customers warmly and resolve issues quickly.`}
              className="w-full h-40 px-4 py-3 bg-white border border-[#D0EDE8] rounded-lg text-[#1B2A4A] placeholder:text-[#8AADA6] resize-none focus:outline-none focus:border-[#00A99D] focus:ring-2 focus:ring-[#00A99D]/10 font-sans text-sm"
            />
            <div className="flex justify-between mt-2 mb-4">
              <span className="text-xs text-muted-foreground font-sans">{prompt.length}/500 characters</span>
              {prompt.length >= 500 && <span className="text-xs text-amber-500 font-sans">Character limit reached</span>}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all px-4 py-2.5 text-sm bg-gradient-to-r from-[#00A99D] to-[#7DD9C0] text-white hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  "Save Prompt"
                )}
              </button>
              {saveSuccess && <Badge color="#00A99D">Changes saved successfully</Badge>}
            </div>
          </>
        )}
      </div>

      {/* Preview */}
      <div
        className="bg-white border rounded-xl p-5 shadow-sm"
        style={{ borderColor: "#7DD9C040", boxShadow: "0 0 20px #7DD9C015" }}
      >
        <h3 className="text-sm font-bold text-[#1B2A4A] mb-4 font-sans">Greeting Preview</h3>
        <div className="p-4 bg-[#F0F9F8] rounded-lg">
          <p className="text-xs text-muted-foreground mb-2 font-sans">Based on your prompt, your AI will greet callers like:</p>
          <p className="text-[#1B2A4A] italic font-sans">&ldquo;{previewGreeting()}&rdquo;</p>
        </div>
      </div>

      {/* Store Policies */}
      <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm opacity-60">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-[#1B2A4A] font-sans">Store Policies</h3>
          <Badge color="#8AADA6">Pro Feature</Badge>
        </div>
        <p className="text-[#4A7A6D] text-sm font-sans">
          Add your return policy, shipping times, and FAQs. Your AI will reference these automatically during calls.
        </p>
      </div>
    </div>
  );
}
