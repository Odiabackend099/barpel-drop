"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, Download, PhoneIncoming, PhoneOutgoing, Volume2 } from "lucide-react";
import { CALL_TYPE_LABELS } from "@/lib/constants";
import type { CallLog } from "@/lib/mockApi";

interface AudioPlayerModalProps {
  open: boolean;
  onClose: () => void;
  call: CallLog | null;
}

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export function AudioPlayerModal({ open, onClose, call }: AudioPlayerModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) {
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setError(false);
    }
  }, [open]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => setError(true));
    }
    setPlaying((p) => !p);
  }, [playing]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleDownload = async () => {
    if (!call?.recording_url) return;
    try {
      const res = await fetch(call.recording_url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `call-${call.id.slice(0, 8)}.wav`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(call.recording_url, "_blank");
    }
  };

  if (!call?.recording_url) return null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="tracking-tight flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#00A99D]" />
            Call Recording
          </DialogTitle>
          <DialogDescription className="sr-only">
            Play back a call recording.
          </DialogDescription>
        </DialogHeader>

        {/* Call metadata */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs text-muted-foreground block">Caller</span>
            <span className="text-[#1B2A4A] font-mono text-xs">
              {call.caller_number || "Browser Call"}
            </span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Direction</span>
            <span className="inline-flex items-center gap-1 text-xs text-[#1B2A4A]">
              {call.direction === "inbound" ? (
                <PhoneIncoming className="w-3 h-3 text-[#00A99D]" />
              ) : (
                <PhoneOutgoing className="w-3 h-3 text-[#7DD9C0]" />
              )}
              {call.direction === "inbound" ? "Inbound" : "Outbound"}
            </span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Type</span>
            <span className="text-[#1B2A4A] text-xs">
              {CALL_TYPE_LABELS[call.call_type] || call.call_type}
            </span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Duration</span>
            <span className="text-[#1B2A4A] text-xs">
              {Math.floor(call.duration_seconds / 60)}m {call.duration_seconds % 60}s
            </span>
          </div>
        </div>

        {/* Audio player */}
        <div className="bg-[#F0F9F8] border border-[#D0EDE8] rounded-lg p-4 space-y-3">
          <audio
            ref={audioRef}
            src={call.recording_url}
            onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
            onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
            onEnded={() => setPlaying(false)}
            onError={() => setError(true)}
            preload="metadata"
          />

          {error ? (
            <p className="text-sm text-[#E74C3C] text-center py-2">
              Unable to load recording. The file may have expired.
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-[#00A99D] text-white flex items-center justify-center hover:bg-[#008F85] transition-colors shrink-0"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div className="flex-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-[#D0EDE8] rounded-full appearance-none cursor-pointer accent-[#00A99D]"
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground w-20 text-right shrink-0">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          )}
        </div>

        {/* Download */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
