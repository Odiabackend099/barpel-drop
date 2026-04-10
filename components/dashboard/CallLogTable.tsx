"use client";

import { PhoneIncoming, PhoneOutgoing, Eye, Play } from "lucide-react";
import { SENTIMENT_CONFIG, CALL_TYPE_COLORS, CALL_TYPE_LABELS } from "@/lib/constants";
import type { CallLog } from "@/lib/mockApi";
import React from "react";
import { AudioPlayerModal } from "@/components/dashboard/AudioPlayerModal";

const emojiIcons: Record<string, string> = {
  positive: "\u{1F60A}",
  neutral: "\u{1F610}",
  negative: "\u{1F620}",
};

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

interface CallLogTableProps {
  calls: CallLog[];
  expandedId: string | null;
  onToggle: (id: string) => void;
}

export function CallLogTable({ calls, expandedId, onToggle }: CallLogTableProps) {
  const [audioCall, setAudioCall] = React.useState<CallLog | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-brand-100">
            <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Direction</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Caller</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Type</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Duration</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Sentiment</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Summary</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Credits</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => {
            const sentimentKey = call.sentiment as keyof typeof SENTIMENT_CONFIG;
            const sentiment = SENTIMENT_CONFIG[sentimentKey];
            const isExpanded = expandedId === call.id;
            const recordingUrl = call.recording_url;

            return (
              <React.Fragment key={call.id}>
                <tr className="border-b border-brand-100/50 hover:bg-brand-50/50 transition-colors">
                  <td className="py-3 px-2">
                    <Badge color={call.direction === "inbound" ? "#00A99D" : "#7DD9C0"}>
                      {call.direction === "inbound" ? (
                        <PhoneIncoming className="w-3 h-3 inline mr-1" />
                      ) : (
                        <PhoneOutgoing className="w-3 h-3 inline mr-1" />
                      )}
                      {call.direction === "inbound" ? "IN" : "OUT"}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-sm text-[#1B2A4A] font-mono">{call.caller_number || "Browser Call"}</td>
                  <td className="py-3 px-2">
                    <Badge color={CALL_TYPE_COLORS[call.call_type] || "#8AADA6"}>{CALL_TYPE_LABELS[call.call_type] || call.call_type}</Badge>
                  </td>
                  <td className="py-3 px-2 text-sm text-[#1B2A4A]">
                    {Math.floor(call.duration_seconds / 60)}m {call.duration_seconds % 60}s
                  </td>
                  <td className="py-3 px-2">
                    {sentiment ? (
                      <span style={{ color: sentiment.color }}>
                        {emojiIcons[call.sentiment]} {sentiment.label}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-3 px-2 text-sm text-[#4A7A6D] max-w-xs truncate">{call.ai_summary || "-"}</td>
                  <td className="py-3 px-2 text-sm font-mono text-[#4A7A6D]">{call.credits_charged}s</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1">
                      {(call.transcript || call.ai_summary) && (
                        <button
                          onClick={() => onToggle(call.id)}
                          aria-expanded={isExpanded}
                          aria-label="View call details"
                          title="View transcript & details"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isExpanded
                              ? "bg-brand-600/20 text-brand-600"
                              : "hover:bg-[#F0F9F8] text-muted-foreground hover:text-[#1B2A4A]"
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {recordingUrl && (
                        <button
                          onClick={() => setAudioCall(call)}
                          title="Play recording"
                          className="p-1.5 rounded-lg hover:bg-[#F0F9F8] text-muted-foreground hover:text-[#1B2A4A] transition-colors"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {isExpanded && call.transcript && (
                  <tr>
                    <td colSpan={8} className="py-4 px-4">
                      <div className="space-y-3">
                        {call.ai_summary && (
                          <div className="bg-[#F0F9F8] border border-brand-100 rounded-lg p-4">
                            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">AI Summary</p>
                            <p className="text-sm text-[#1B2A4A]">{call.ai_summary}</p>
                          </div>
                        )}
                        {call.tool_results && (call.tool_results as unknown[]).length > 0 && (
                          <div className="bg-[#F0F9F8] border border-brand-100 rounded-lg p-4">
                            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Tool Results</p>
                            <div className="space-y-1">
                              {(call.tool_results as Array<{ name?: string; result?: string }>).map((tr, i) => (
                                <p key={i} className="text-sm text-[#1B2A4A] font-mono">
                                  <span className="text-brand-600 font-semibold">{tr.name || "tool"}</span>: {tr.result || JSON.stringify(tr)}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="bg-[#F0F9F8] border border-brand-100 rounded-lg p-4">
                          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Transcript</p>
                          <p className="text-sm text-[#1B2A4A] whitespace-pre-wrap">{call.transcript}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <AudioPlayerModal
        open={audioCall !== null}
        onClose={() => setAudioCall(null)}
        call={audioCall}
      />
    </div>
  );
}
