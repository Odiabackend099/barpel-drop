"use client";

import { PhoneIncoming, PhoneOutgoing, Eye } from "lucide-react";
import { SENTIMENT_CONFIG, CALL_TYPE_COLORS } from "@/lib/constants";
import type { CallLog } from "@/lib/mockApi";
import React from "react";

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
            <th className="text-left py-3 px-2 text-xs font-medium text-[#8AADA6]">Order #</th>
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
            const emojiIcons: Record<string, string> = { happy: "\u{1F60A}", neutral: "\u{1F610}", angry: "\u{1F620}" };

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
                  <td className="py-3 px-2 text-sm text-[#1B2A4A] font-mono">{call.caller_number}</td>
                  <td className="py-3 px-2 text-sm text-[#1B2A4A] font-mono">{call.order_number || "-"}</td>
                  <td className="py-3 px-2">
                    <Badge color={CALL_TYPE_COLORS[call.call_type] || "#8AADA6"}>{call.call_type}</Badge>
                  </td>
                  <td className="py-3 px-2 text-sm text-[#1B2A4A]">
                    {Math.floor(call.duration_secs / 60)}m {call.duration_secs % 60}s
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
                    <td colSpan={9} className="py-4 px-4">
                      <div className="bg-[#F0F9F8] border border-[#D0EDE8] rounded-lg p-4">
                        <p className="text-xs text-[#8AADA6] mb-2 font-medium uppercase tracking-wide">Transcript</p>
                        <p className="text-sm text-[#1B2A4A] whitespace-pre-wrap">{call.transcript}</p>
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
