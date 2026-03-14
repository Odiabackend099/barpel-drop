"use client";

import { PhoneIncoming, PhoneOutgoing, Eye } from "lucide-react";
import { SENTIMENT_CONFIG, CALL_TYPE_COLORS, CALL_TYPE_LABELS } from "@/lib/constants";
import type { CallLog } from "@/lib/mockApi";
import React from "react";

/** Mask phone number: show country code + last 4 digits */
function maskPhone(num: string): string {
  if (!num || num.length < 6) return num || "";
  // Country code is +X or +XX or +XXX
  const ccEnd = num.startsWith("+") ? (num.length > 12 ? 3 : 2) : 0;
  return `${num.slice(0, ccEnd)} *** *** ${num.slice(-4)}`;
}

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
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#D0EDE8]">
            <th className="text-left py-3 px-2 text-xs font-medium text-[#8AADA6]">Direction</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-[#8AADA6]">Caller</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-[#8AADA6]">Type</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-[#8AADA6]">Duration</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-[#8AADA6]">Sentiment</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-[#8AADA6]">Summary</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-[#8AADA6]">Credits</th>
            <th className="text-left py-3 px-2 text-xs font-medium text-[#8AADA6]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => {
            const sentimentKey = call.sentiment as keyof typeof SENTIMENT_CONFIG;
            const sentiment = SENTIMENT_CONFIG[sentimentKey];
            const isExpanded = expandedId === call.id;
            const emojiIcons: Record<string, string> = { positive: "\u{1F60A}", neutral: "\u{1F610}", negative: "\u{1F620}" };

            return (
              <React.Fragment key={call.id}>
                <tr className="border-b border-[#D0EDE8]/50 hover:bg-[#F0F9F8]/50 transition-colors">
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
                  <td className="py-3 px-2 text-sm text-[#1B2A4A] font-mono">{maskPhone(call.caller_number)}</td>
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
                    {call.transcript && (
                      <button
                        onClick={() => onToggle(call.id)}
                        aria-expanded={isExpanded}
                        aria-label="View call details"
                        className={`p-1.5 rounded-lg transition-colors ${
                          isExpanded
                            ? "bg-[#00A99D]/20 text-[#00A99D]"
                            : "hover:bg-[#F0F9F8] text-[#8AADA6] hover:text-[#1B2A4A]"
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
                {isExpanded && call.transcript && (
                  <tr>
                    <td colSpan={8} className="py-4 px-4">
                      <div className="space-y-3">
                        {call.ai_summary && (
                          <div className="bg-[#F0F9F8] border border-[#D0EDE8] rounded-lg p-4">
                            <p className="text-xs text-[#8AADA6] mb-2 font-medium uppercase tracking-wide">AI Summary</p>
                            <p className="text-sm text-[#1B2A4A]">{call.ai_summary}</p>
                          </div>
                        )}
                        {call.tool_results && (call.tool_results as unknown[]).length > 0 && (
                          <div className="bg-[#F0F9F8] border border-[#D0EDE8] rounded-lg p-4">
                            <p className="text-xs text-[#8AADA6] mb-2 font-medium uppercase tracking-wide">Tool Results</p>
                            <div className="space-y-1">
                              {(call.tool_results as Array<{ name?: string; result?: string }>).map((tr, i) => (
                                <p key={i} className="text-sm text-[#1B2A4A] font-mono">
                                  <span className="text-[#00A99D] font-semibold">{tr.name || "tool"}</span>: {tr.result || JSON.stringify(tr)}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="bg-[#F0F9F8] border border-[#D0EDE8] rounded-lg p-4">
                          <p className="text-xs text-[#8AADA6] mb-2 font-medium uppercase tracking-wide">Transcript</p>
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
    </div>
  );
}
