"use client";

import { useState, useEffect } from "react";
import { Sparkles, Check, Mic, Trash2, AlertTriangle } from "lucide-react";
import { PERSONA_TEMPLATES, ELEVENLABS_VOICES } from "@/lib/constants";
import { useMerchant } from "@/hooks/useMerchant";
import { Skeleton } from "@/components/ui/skeleton";
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

function SaveButton({
  onClick,
  isSaving,
  saveSuccess,
  label = "Save",
}: {
  onClick: () => void;
  isSaving: boolean;
  saveSuccess: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
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
        label
      )}
    </button>
  );
}

export default function VoicePage() {
  const { merchant, loading, updateAiVoice, deleteAiVoice } = useMerchant();

  // Section 1 — Greeting
  const [greeting, setGreeting] = useState("");
  const [savingGreeting, setSavingGreeting] = useState(false);
  const [greetingSaved, setGreetingSaved] = useState(false);

  // Section 2 — Personality
  const [prompt, setPrompt] = useState("");
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);

  // Section 3 — Voice
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [savingVoice, setSavingVoice] = useState(false);
  const [voiceSaved, setVoiceSaved] = useState(false);

  // Section 4 — Delete
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const brandName = merchant?.business_name || "Your Store";
  const isActive = merchant?.provisioning_status === "active";

  // Sync merchant data into local state once loaded (lazy-init pattern)
  useEffect(() => {
    if (merchant) {
      if (!greeting && merchant.ai_first_message) setGreeting(merchant.ai_first_message);
      if (!prompt && merchant.custom_prompt) setPrompt(merchant.custom_prompt);
      if (!selectedVoiceId) {
        setSelectedVoiceId(merchant.ai_voice_id || "EXAVITQu4vr4xnSDxMaL");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant?.id]);

  const applyTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt.replace("[Brand]", brandName));
  };

  const handleSaveGreeting = async () => {
    setSavingGreeting(true);
    try {
      await updateAiVoice({ ai_first_message: greeting });
      setGreetingSaved(true);
      setTimeout(() => setGreetingSaved(false), 3000);
    } finally {
      setSavingGreeting(false);
    }
  };

  const handleSavePrompt = async () => {
    setSavingPrompt(true);
    try {
      await updateAiVoice({ custom_prompt: prompt });
      setPromptSaved(true);
      setTimeout(() => setPromptSaved(false), 3000);
    } finally {
      setSavingPrompt(false);
    }
  };

  const handleSelectVoice = async (voiceId: string) => {
    if (voiceId === selectedVoiceId) return;
    setSelectedVoiceId(voiceId);
    setSavingVoice(true);
    try {
      await updateAiVoice({ ai_voice_id: voiceId, ai_voice_provider: "11labs" });
      setVoiceSaved(true);
      setTimeout(() => setVoiceSaved(false), 3000);
    } finally {
      setSavingVoice(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAiVoice();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Failed to remove AI phone line");
    } finally {
      setIsDeleting(false);
    }
  };

  // Provisioning banner — shown when phone line not yet active
  if (!loading && !isActive) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A] font-display tracking-tight mb-1">
            Customize Your AI
          </h1>
          <p className="text-sm text-muted-foreground font-sans">
            Tell your AI how to speak to your customers.
          </p>
        </div>

        <div
          className="bg-white border rounded-xl p-6 shadow-sm"
          style={{ borderColor: "#F5A62340", boxShadow: "0 0 20px #F5A62310" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: "#F5A62315" }}
            >
              <AlertTriangle className="w-4 h-4" style={{ color: "#F5A623" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1B2A4A] font-sans mb-1">
                Your AI phone line is being set up
              </p>
              <p className="text-sm text-[#4A7A6D] font-sans">
                Voice customization will be available once provisioning completes. This
                usually takes under a minute. The page will update automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2A4A] font-display tracking-tight mb-1">
          Customize Your AI
        </h1>
        <p className="text-sm text-muted-foreground font-sans">
          Tell your AI how to speak to your customers.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Greeting                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Mic className="w-4 h-4 text-[#00A99D]" />
          <h3 className="text-sm font-bold text-[#1B2A4A] font-sans">
            Your AI&apos;s Greeting
          </h3>
        </div>
        <p className="text-xs text-muted-foreground font-sans mb-4">
          What does your AI say when a customer calls?
        </p>

        {loading ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : (
          <>
            <textarea
              value={greeting}
              onChange={(e) => setGreeting(e.target.value.slice(0, 200))}
              placeholder={`Thank you for calling ${brandName} support. How can I help you today?`}
              className="w-full h-20 px-4 py-3 bg-white border border-[#D0EDE8] rounded-lg text-[#1B2A4A] placeholder:text-[#8AADA6] resize-none focus:outline-none focus:border-[#00A99D] focus:ring-2 focus:ring-[#00A99D]/10 font-sans text-sm"
            />
            <div className="flex justify-between mt-2 mb-4">
              <span className="text-xs text-muted-foreground font-sans">
                {greeting.length}/200 characters
              </span>
              {greeting.length >= 200 && (
                <span className="text-xs text-amber-500 font-sans">Character limit reached</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <SaveButton
                onClick={handleSaveGreeting}
                isSaving={savingGreeting}
                saveSuccess={greetingSaved}
                label="Save Greeting"
              />
              {greetingSaved && <Badge color="#00A99D">Greeting saved</Badge>}
            </div>
          </>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: Personality                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[#00A99D]" />
          <h3 className="text-sm font-bold text-[#1B2A4A] font-sans">
            Your AI&apos;s Personality
          </h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
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

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
              placeholder={`Example: You are Emma, a friendly support agent for ${brandName}. Always greet customers warmly and resolve issues quickly.`}
              className="w-full h-40 px-4 py-3 bg-white border border-[#D0EDE8] rounded-lg text-[#1B2A4A] placeholder:text-[#8AADA6] resize-none focus:outline-none focus:border-[#00A99D] focus:ring-2 focus:ring-[#00A99D]/10 font-sans text-sm"
            />
            <p className="text-xs text-[#8AADA6] font-sans mt-1.5 mb-3">
              Describe your brand voice. Examples: formal and professional, friendly and casual,
              brief and to the point.
            </p>
            <div className="flex justify-between mb-4">
              <span className="text-xs text-muted-foreground font-sans">
                {prompt.length}/500 characters
              </span>
              {prompt.length >= 500 && (
                <span className="text-xs text-amber-500 font-sans">Character limit reached</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <SaveButton
                onClick={handleSavePrompt}
                isSaving={savingPrompt}
                saveSuccess={promptSaved}
                label="Save Personality"
              />
              {promptSaved && <Badge color="#00A99D">Changes saved successfully</Badge>}
            </div>
          </>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3: Voice Selection                                          */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="bg-white border rounded-xl p-5 shadow-sm"
        style={{ borderColor: "#7DD9C040", boxShadow: "0 0 20px #7DD9C015" }}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-[#1B2A4A] font-sans">AI Voice</h3>
          {voiceSaved && <Badge color="#00A99D">Voice updated</Badge>}
          {savingVoice && (
            <span className="text-xs text-[#8AADA6] font-sans">Saving...</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-sans mb-4">
          Choose your AI&apos;s voice. Click to select.
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ELEVENLABS_VOICES.map((voice) => {
              const isSelected = selectedVoiceId === voice.id;
              return (
                <button
                  key={voice.id}
                  onClick={() => handleSelectVoice(voice.id)}
                  disabled={savingVoice}
                  className="p-3 text-left rounded-lg border transition-all disabled:opacity-60"
                  style={{
                    backgroundColor: isSelected ? "#F0F9F8" : "#FAFAFA",
                    borderColor: isSelected ? "#00A99D" : "#D0EDE8",
                    borderWidth: isSelected ? "2px" : "1px",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#1B2A4A] text-sm font-sans">
                        {voice.label}
                      </p>
                      <p className="text-xs text-[#8AADA6] font-sans">{voice.description}</p>
                    </div>
                    {isSelected && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#00A99D" }}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4: Danger Zone                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white border border-red-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Trash2 className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-bold text-red-600 font-sans">Remove AI Phone Line</h3>
        </div>
        <p className="text-sm text-[#4A7A6D] font-sans mb-4">
          This will disconnect your AI support line and release your phone number. Your customers
          will no longer be able to reach your AI assistant. You can set up a new line at any time.
        </p>

        {deleteError && (
          <p className="text-xs text-red-500 font-sans mb-3">{deleteError}</p>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-red-300 text-red-600 hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Remove AI Phone Line
                </>
              )}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove AI phone line?</AlertDialogTitle>
              <AlertDialogDescription>
                {merchant?.support_phone ? (
                  <>
                    Your phone number <strong>{merchant.support_phone}</strong> will be released.
                  </>
                ) : (
                  "Your AI phone number will be released."
                )}{" "}
                This cannot be undone. Your customers will no longer be able to reach your AI
                assistant until you set up a new line.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
