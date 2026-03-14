"use client";

import { useState, useEffect, useMemo } from "react";
import type { CallLog } from "@/lib/mockApi";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
const PAGE_SIZE = 25;

export function useCallLogs() {
  const [allCalls, setAllCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterSentiment, setFilterSentiment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search by 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    async function fetchCalls() {
      try {
        if (useMock) {
          // Dynamic import so mockApi is never imported at module level in production
          const { mockCalls } = await import("@/lib/mockApi");
          setAllCalls(mockCalls);
          setLoading(false);
          return;
        }

        const res = await fetch("/api/calls/list");
        if (res.ok) {
          const data = await res.json();
          setAllCalls(data.calls ?? []);
        }
      } catch {
        // keep empty state on error
      } finally {
        setLoading(false);
      }
    }

    fetchCalls();
  }, []);

  const filteredCalls = useMemo(() => {
    return allCalls.filter((call) => {
      if (filterType !== "all" && call.call_type !== filterType) return false;
      if (filterSentiment !== "all" && call.sentiment !== filterSentiment) return false;
      if (
        debouncedSearch &&
        !call.caller_number.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
        !call.ai_summary?.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
        return false;
      return true;
    });
  }, [allCalls, filterType, filterSentiment, debouncedSearch]);

  const paginatedCalls = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCalls.slice(start, start + PAGE_SIZE);
  }, [filteredCalls, page]);

  const totalPages = Math.max(1, Math.ceil(filteredCalls.length / PAGE_SIZE));

  const stats = useMemo(() => {
    return {
      total: filteredCalls.length,
      negative: filteredCalls.filter((c) => c.sentiment === "negative").length,
      avgDuration:
        filteredCalls.length > 0
          ? Math.round(filteredCalls.reduce((s, c) => s + c.duration_seconds, 0) / filteredCalls.length)
          : 0,
      totalCredits: filteredCalls.reduce((s, c) => s + c.credits_charged, 0),
    };
  }, [filteredCalls]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterType, filterSentiment, searchQuery]);

  const hasFilters = filterType !== "all" || filterSentiment !== "all" || searchQuery !== "";

  return {
    calls: paginatedCalls,
    allCalls,
    filteredCalls,
    loading,
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
    hasFilters,
  };
}
