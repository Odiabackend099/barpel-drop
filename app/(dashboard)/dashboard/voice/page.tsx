"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Check, Mic, Trash2, AlertTriangle, Play, Pause as PauseIcon, ChevronDown, Volume2, PauseCircle, PlayCircle } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import Vapi from "@vapi-ai/web";
import { PERSONA_TEMPLATES, VAPI_VOICES } from "@/lib/constants";
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

const VALID_VAPI_IDS = VAPI_VOICES.map((v) => v.id) as string[];

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
  const { merchant, loading, updateAiVoice, deleteAiVoice, togglePause } = useMerchant();

  // Section 1 — Greeting
  const [greeting, setGreeting] = useState("");
  const [savingGreeting, setSavingGreeting] = useState(false);
  const [greetingSaved, setGreetingSaved] = useState(false);

  // Section 2 — Personality
  const [prompt, setPrompt] = useState("");
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  // Greeting suggestion (shown when persona template is applied)
  const [suggestedGreeting, setSuggestedGreeting] = useState<string | null>(null);

  // Section 3 — Voice
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [savingVoice, setSavingVoice] = useState(false);
  const [voiceSaved, setVoiceSaved] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);

  // Section 4 — Pause / Delete
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPausing, setIsPausing] = useState(false);

  const brandName = merchant?.business_name || "Your Store";
  const isActive = merchant?.provisioning_status === "active";
  const isSuspended = merchant?.provisioning_status === "suspended";

  // Legacy ElevenLabs voice detection
  const isLegacyVoice =
    merchant?.ai_voice_id && !VALID_VAPI_IDS.includes(merchant.ai_voice_id);

  // Sync merchant data into local state once loaded (lazy-init pattern)
  useEffect(() => {
    if (merchant) {
      if (!greeting && merchant.ai_first_message) setGreeting(merchant.ai_first_message);
      if (!prompt && merchant.custom_prompt) setPrompt(merchant.custom_prompt);
      if (!selectedVoiceId) {
        // If merchant has a valid Vapi voice, use it; otherwise leave empty
        const storedVoice = merchant.ai_voice_id || "";
        setSelectedVoiceId(VALID_VAPI_IDS.includes(storedVoice) ? storedVoice : "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant?.id]);

  // Cleanup Vapi preview call on unmount
  useEffect(() => {
    return () => {
      vapiRef.current?.end();
      vapiRef.current = null;
    };
  }, []);

  const replaceName = (s: string) => s.replaceAll("{BUSINESS_NAME}", brandName);

  const applyTemplate = (template: (typeof PERSONA_TEMPLATES)[number]) => {
    setPrompt(replaceName(template.prompt));
    setActiveTemplateId(template.id);

    // Show greeting suggestion instead of auto-filling
    const suggested = replaceName(template.greeting);
    if (greeting !== suggested) {
      setSuggestedGreeting(suggested);
    }
  };

  const applyGreetingSuggestion = () => {
    if (suggestedGreeting) {
      setGreeting(suggestedGreeting);
      setSuggestedGreeting(null);
    }
  };

  /**
   * Starts a live Vapi web call to preview the ACTUAL voice.
   * Uses { startAudioOff: true } so mic starts muted (Chrome 140+ compatible).
   * The AI says one greeting then the call auto-ends after speech finishes.
   */
  const handlePlayPreview = useCallback(
    async (voiceId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setPreviewError(null);

      // Toggle off if same voice is already playing
      if (playingVoiceId === voiceId) {
        vapiRef.current?.end();
        return;
      }

      // Stop any current preview
      if (vapiRef.current) {
        vapiRef.current.end();
        vapiRef.current = null;
      }

      setPlayingVoiceId(voiceId);

      const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
      if (!publicKey) {
        setPlayingVoiceId(null);
        setPreviewError("Preview unavailable");
        return;
      }

      // startAudioOff: true = mic starts muted (Chrome 140+ compatible)
      const vapi = new Vapi(publicKey, undefined, undefined, { startAudioOff: true });
      vapiRef.current = vapi;

      // Auto-end shortly after the AI finishes speaking its greeting
      vapi.on("speech-end", () => {
        setTimeout(() => vapi.end(), 400);
      });

      vapi.on("call-end", () => {
        setPlayingVoiceId(null);
        vapiRef.current = null;
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vapi.on("error", (err: any) => {
        console.error("[voice-preview] error:", err);
        setPlayingVoiceId(null);
        vapiRef.current = null;
        setPreviewError("Preview unavailable — try again");
        setTimeout(() => setPreviewError(null), 4000);
      });

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (vapi.start as any)({
          firstMessage: "Hi! I'm your AI support assistant. How can I help you today?",
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            systemPrompt:
              "You are a voice preview demo. Say only your greeting, then stay completely silent.",
          },
          voice: { provider: "vapi", voiceId },
          maxDurationSeconds: 15,
          silenceTimeoutSeconds: 10,
        });
      } catch (err) {
        console.error("[voice-preview] start failed:", err);
        setPlayingVoiceId(null);
        vapiRef.current = null;
      }
    },
    [playingVoiceId]
  );

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
    setVoiceDropdownOpen(false);
    setSavingVoice(true);
    try {
      await updateAiVoice({ ai_voice_id: voiceId, ai_voice_provider: "vapi" });
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

  const femaleVoices = VAPI_VOICES.filter((v) => v.gender === "female");
  const maleVoices = VAPI_VOICES.filter((v) => v.gender === "male");

  const handleTogglePause = async () => {
    setIsPausing(true);
    try {
      await togglePause(!isSuspended);
    } catch {
      // Realtime will revert if it failed
    } finally {
      setIsPausing(false);
    }
  };

  // Provisioning banner — shown when phone line not yet active (but not when suspended)
  if (!loading && !isActive && !isSuspended) {
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

      {/* Suspended banner */}
      {isSuspended && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <PauseCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Your AI line is paused</p>
            <p className="text-xs text-amber-600">Calls will not be answered until you resume.</p>
          </div>
          <button
            onClick={handleTogglePause}
            disabled={isPausing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors disabled:opacity-50"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Resume
          </button>
        </div>
      )}

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
              onChange={(e) => {
                setGreeting(e.target.value.slice(0, 200));
                setSuggestedGreeting(null);
              }}
              placeholder={`Thank you for calling ${brandName} support. How can I help you today?`}
              className="w-full h-20 px-4 py-3 bg-white border border-[#D0EDE8] rounded-lg text-[#1B2A4A] placeholder:text-[#8AADA6] resize-none focus:outline-none focus:border-[#00A99D] focus:ring-2 focus:ring-[#00A99D]/10 font-sans text-sm"
            />

            {/* Greeting suggestion banner */}
            {suggestedGreeting && (
              <div className="mt-2 p-3 rounded-lg border border-[#00A99D]/20 bg-[#00A99D]/5 backdrop-blur-sm">
                <p className="text-xs text-[#1B2A4A] font-sans mb-1.5">
                  <span className="font-semibold">Suggested greeting:</span>{" "}
                  &ldquo;{suggestedGreeting}&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={applyGreetingSuggestion}
                    className="text-xs font-semibold text-[#00A99D] hover:text-[#008F85] transition-colors"
                  >
                    Apply
                  </button>
                  <span className="text-[#D0EDE8]">|</span>
                  <button
                    onClick={() => setSuggestedGreeting(null)}
                    className="text-xs text-[#8AADA6] hover:text-[#4A7A6D] transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

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
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {PERSONA_TEMPLATES.map((t) => {
                const isSelected = activeTemplateId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className="p-3 text-left rounded-lg border transition-all hover:scale-[1.01]"
                    style={{
                      backgroundColor: isSelected ? "#F0F9F8" : "#FAFAFA",
                      borderColor: isSelected ? "#00A99D" : "#D0EDE8",
                      borderWidth: isSelected ? "2px" : "1px",
                    }}
                  >
                    <p className="font-medium text-[#1B2A4A] text-sm font-sans">{t.label}</p>
                    <p className="text-xs text-[#8AADA6] font-sans mt-0.5">{t.description}</p>
                  </button>
                );
              })}
            </div>

            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value.slice(0, 500));
                setActiveTemplateId(null);
              }}
              placeholder={`Example: Be a friendly support agent for ${brandName}. Always greet customers warmly and resolve issues quickly.`}
              className="w-full h-40 px-4 py-3 bg-white border border-[#D0EDE8] rounded-lg text-[#1B2A4A] placeholder:text-[#8AADA6] resize-none focus:outline-none focus:border-[#00A99D] focus:ring-2 focus:ring-[#00A99D]/10 font-sans text-sm"
            />
            <p className="text-xs text-[#8AADA6] font-sans mt-1.5 mb-3">
              Describe your brand voice. Pick a template above or write your own.
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
          Choose your AI&apos;s voice. Click to select — use the play button to hear the actual Vapi voice.
        </p>
        {previewError && (
          <p className="text-xs text-red-500 font-sans mb-3">{previewError}</p>
        )}

        {/* Legacy voice migration banner */}
        {isLegacyVoice && (
          <div className="mb-4 p-3 rounded-lg border border-[#F5A623]/30 bg-[#F5A623]/5">
            <p className="text-xs text-[#1B2A4A] font-sans">
              <span className="font-semibold">Your current voice is no longer available.</span>{" "}
              We&apos;ve upgraded to higher-quality Vapi native voices. Please select a new voice below.
            </p>
          </div>
        )}

        {loading ? (
          <Skeleton className="h-14 w-full rounded-lg" />
        ) : (
          <Popover open={voiceDropdownOpen} onOpenChange={setVoiceDropdownOpen}>
            {/* ── Trigger button ── */}
            <PopoverTrigger asChild>
              <button
                className="w-full p-3 rounded-lg border text-left transition-all hover:bg-[#F0F9F8] focus:outline-none focus:ring-2 focus:ring-[#00A99D]/20 disabled:opacity-60"
                style={{
                  borderColor: voiceDropdownOpen ? "#00A99D" : "#D0EDE8",
                  borderWidth: voiceDropdownOpen ? "2px" : "1px",
                  boxShadow: "0 1px 3px rgba(0,169,157,0.08)",
                }}
                disabled={savingVoice}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #00A99D22, #7DD9C033)" }}
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#00A99D]" />
                    </div>
                    <div className="min-w-0">
                      {selectedVoiceId ? (
                        <>
                          <p className="font-semibold text-[#1B2A4A] text-sm font-sans leading-tight">
                            {VAPI_VOICES.find((v) => v.id === selectedVoiceId)?.label ?? selectedVoiceId}
                          </p>
                          <p className="text-xs text-[#8AADA6] font-sans mt-0.5 truncate">
                            {VAPI_VOICES.find((v) => v.id === selectedVoiceId)?.description}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-[#8AADA6] font-sans">Select a voice</p>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    className="w-4 h-4 text-[#8AADA6] flex-shrink-0 transition-transform duration-200"
                    style={{ transform: voiceDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </div>
              </button>
            </PopoverTrigger>

            {/* ── Dropdown list ── */}
            <PopoverContent
              align="start"
              className="p-2 border border-[#D0EDE8] rounded-xl shadow-lg"
              style={{
                width: "var(--radix-popover-trigger-width)",
                maxHeight: "420px",
                overflowY: "auto",
                backgroundColor: "#FFFFFF",
              }}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {/* Female section */}
              <p className="text-[10px] font-semibold text-[#8AADA6] uppercase tracking-widest px-2 pt-1 pb-2">
                Female Voices
              </p>
              <div className="space-y-1 mb-3">
                {femaleVoices.map((voice) => {
                  const isSelected = selectedVoiceId === voice.id;
                  const isPlaying = playingVoiceId === voice.id;
                  return (
                    <button
                      key={voice.id}
                      onClick={() => handleSelectVoice(voice.id)}
                      className="w-full p-2.5 rounded-lg border text-left transition-all hover:bg-[#F0F9F8]"
                      style={{
                        backgroundColor: isSelected ? "#F0F9F8" : "transparent",
                        borderColor: isSelected ? "#00A99D" : "transparent",
                        borderWidth: "1.5px",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[#1B2A4A] text-sm font-sans">
                              {voice.label}
                            </span>
                            {isPlaying && (
                              <span className="relative flex h-2 w-2 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A99D] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00A99D]" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#8AADA6] font-sans mt-0.5 leading-tight">
                            {voice.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Play button — stopPropagation keeps dropdown open */}
                          <div
                            onClick={(e) => handlePlayPreview(voice.id, e)}
                            className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95"
                            style={{
                              background: isPlaying
                                ? "linear-gradient(135deg, #00A99D, #7DD9C0)"
                                : "#F0F9F8",
                            }}
                          >
                            {isPlaying ? (
                              <PauseIcon className="w-3 h-3 text-white" />
                            ) : (
                              <Play className="w-3 h-3 text-[#00A99D] ml-0.5" />
                            )}
                          </div>
                          {/* Selected checkmark */}
                          {isSelected && (
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: "#00A99D" }}
                            >
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="border-t border-[#D0EDE8] mx-2 mb-3" />

              {/* Male section */}
              <p className="text-[10px] font-semibold text-[#8AADA6] uppercase tracking-widest px-2 pb-2">
                Male Voices
              </p>
              <div className="space-y-1">
                {maleVoices.map((voice) => {
                  const isSelected = selectedVoiceId === voice.id;
                  const isPlaying = playingVoiceId === voice.id;
                  return (
                    <button
                      key={voice.id}
                      onClick={() => handleSelectVoice(voice.id)}
                      className="w-full p-2.5 rounded-lg border text-left transition-all hover:bg-[#F0F9F8]"
                      style={{
                        backgroundColor: isSelected ? "#F0F9F8" : "transparent",
                        borderColor: isSelected ? "#00A99D" : "transparent",
                        borderWidth: "1.5px",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[#1B2A4A] text-sm font-sans">
                              {voice.label}
                            </span>
                            {isPlaying && (
                              <span className="relative flex h-2 w-2 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A99D] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00A99D]" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#8AADA6] font-sans mt-0.5 leading-tight">
                            {voice.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div
                            onClick={(e) => handlePlayPreview(voice.id, e)}
                            className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95"
                            style={{
                              background: isPlaying
                                ? "linear-gradient(135deg, #00A99D, #7DD9C0)"
                                : "#F0F9F8",
                            }}
                          >
                            {isPlaying ? (
                              <PauseIcon className="w-3 h-3 text-white" />
                            ) : (
                              <Play className="w-3 h-3 text-[#00A99D] ml-0.5" />
                            )}
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
                      </div>
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4: Pause + Danger Zone                                     */}
      {/* ------------------------------------------------------------------ */}

      {/* Pause AI Line — soft option */}
      {isActive && (
        <div className="bg-white border border-amber-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <PauseCircle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-[#1B2A4A] font-sans">Pause AI Line</h3>
              </div>
              <p className="text-sm text-[#4A7A6D] font-sans">
                Temporarily stop answering calls. Your number and AI configuration are preserved.
              </p>
            </div>
            <button
              onClick={handleTogglePause}
              disabled={isPausing}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-amber-300 text-amber-600 hover:bg-amber-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PauseCircle className="w-4 h-4" />
              {isPausing ? "Pausing..." : "Pause"}
            </button>
          </div>
        </div>
      )}

      {/* Resume option when suspended */}
      {isSuspended && (
        <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <PlayCircle className="w-4 h-4 text-[#00A99D]" />
                <h3 className="text-sm font-bold text-[#1B2A4A] font-sans">Resume AI Line</h3>
              </div>
              <p className="text-sm text-[#4A7A6D] font-sans">
                Your AI line is paused. Resume to start answering calls again.
              </p>
            </div>
            <button
              onClick={handleTogglePause}
              disabled={isPausing}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-[#00A99D] to-[#7DD9C0] text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayCircle className="w-4 h-4" />
              {isPausing ? "Resuming..." : "Resume"}
            </button>
          </div>
        </div>
      )}

      {/* Remove AI Phone Line — destructive */}
      <div className="bg-white border border-red-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Trash2 className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-bold text-red-600 font-sans">Remove AI Phone Line</h3>
        </div>
        <p className="text-sm text-[#4A7A6D] font-sans mb-4">
          This permanently removes your AI assistant and releases your phone number. Your customers
          will not be able to reach your AI after this. You can set up a new line at any time from
          the Integrations page.
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
              <AlertDialogTitle>Remove your AI phone line?</AlertDialogTitle>
              <AlertDialogDescription>
                {merchant?.support_phone ? (
                  <>
                    Your number <strong>{merchant.support_phone}</strong> will be released. This cannot be undone.
                  </>
                ) : (
                  "Your AI phone number will be released. This cannot be undone."
                )}{" "}
                Your customers will not be able to reach your AI assistant after this.
                You can set up a new line at any time from the Integrations page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, Remove Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
