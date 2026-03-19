"use client";

import { useState } from "react";
import { Phone, Download, ChevronLeft, ChevronRight, PhoneOff } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { CallLogTable } from "@/components/dashboard/CallLogTable";
import { useCallLogs } from "@/hooks/useCallLogs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function CallsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const {
    calls,
    filterType,
    setFilterType,
    filterSentiment,
    setFilterSentiment,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    stats,
    loading,
    hasFilters,
  } = useCallLogs();

  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/calls/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `barpel-calls-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error("CSV export error:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A] font-display tracking-tight mb-1">Call Logs</h1>
          <p className="text-sm text-muted-foreground font-sans">View and analyze all your AI calls</p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={exporting || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all px-4 py-2.5 text-sm bg-white border border-[#D0EDE8] text-[#1B2A4A] hover:border-[#00A99D] hover:bg-[#F0F9F8] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-28 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <div className="px-4 py-2 bg-[#F0F9F8] rounded-lg border border-[#D0EDE8]">
            <span className="text-xs text-[#8AADA6] font-sans">Total</span>
            <p className="text-lg font-bold text-[#1B2A4A]">{stats.total}</p>
          </div>
          <div className="px-4 py-2 bg-[#F0F9F8] rounded-lg border border-[#D0EDE8]">
            <span className="text-xs text-[#8AADA6] font-sans">Negative</span>
            <p className="text-lg font-bold text-[#E74C3C]">{stats.negative}</p>
          </div>
          <div className="px-4 py-2 bg-[#F0F9F8] rounded-lg border border-[#D0EDE8]">
            <span className="text-xs text-[#8AADA6] font-sans">Avg Duration</span>
            <p className="text-lg font-bold text-[#1B2A4A]">
              {Math.floor(stats.avgDuration / 60)}m {stats.avgDuration % 60}s
            </p>
          </div>
          <div className="px-4 py-2 bg-[#F0F9F8] rounded-lg border border-[#D0EDE8]">
            <span className="text-xs text-[#8AADA6] font-sans">Credits Used</span>
            <p className="text-lg font-bold text-[#1B2A4A]">{stats.totalCredits}s</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs text-[#8AADA6] mb-1 block font-sans">Call Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-white border border-[#D0EDE8] rounded-lg text-sm text-[#1B2A4A] focus:border-[#00A99D] focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="order_lookup">Order Lookup</option>
              <option value="return_request">Return Request</option>
              <option value="abandoned_cart_recovery">Cart Recovery</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#8AADA6] mb-1 block font-sans">Sentiment</label>
            <select
              value={filterSentiment}
              onChange={(e) => setFilterSentiment(e.target.value)}
              className="px-3 py-2 bg-white border border-[#D0EDE8] rounded-lg text-sm text-[#1B2A4A] focus:border-[#00A99D] focus:outline-none"
            >
              <option value="all">All</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
              <option value="positive">Positive</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-[#8AADA6] mb-1 block font-sans">Search</label>
            <input
              type="text"
              placeholder="Search summary or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#D0EDE8] rounded-lg text-sm text-[#1B2A4A] placeholder:text-[#8AADA6] focus:border-[#00A99D] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Calls Table */}
      <div className="bg-white border border-[#D0EDE8] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-4 h-4 text-[#00A99D]" />
          <h3 className="text-sm font-bold text-[#1B2A4A] font-sans">All Calls</h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {/* Overall empty state */}
            {calls.length === 0 && !hasFilters && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <PhoneOff className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight mb-2">No calls yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Your AI hasn&apos;t handled any calls yet. Make sure your number is live on your store.
                </p>
                <Link href="/dashboard/integrations">
                  <Button variant="outline" size="sm">View Integrations</Button>
                </Link>
              </div>
            )}

            {/* Filtered empty state */}
            {calls.length === 0 && hasFilters && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">No calls match your current filters.</p>
              </div>
            )}

            {calls.length > 0 && (
              <CallLogTable
                calls={calls}
                expandedId={expandedId}
                onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
              />
            )}
          </>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#D0EDE8]">
            <span className="text-xs text-muted-foreground font-sans">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="p-1.5 rounded-lg border border-[#D0EDE8] hover:border-[#00A99D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-[#4A7A6D]" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                className="p-1.5 rounded-lg border border-[#D0EDE8] hover:border-[#00A99D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-[#4A7A6D]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
