"use client";

import { useState, useEffect } from "react";
import type { HealthStatus } from "@/lib/admin-health-score";

const PAGE_SIZE = 25;

export interface AdminMerchant {
  id: string;
  businessName: string;
  email: string;
  country: string;
  plan: string;
  planStatus: string;
  creditBalance: number;
  creditMinutes: number;
  totalCalls: number;
  lastCallAt: string | null;
  lastSignInAt: string | null;
  createdAt: string;
  health: HealthStatus;
}

export function useAdminMerchants() {
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Debounce search by 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, planFilter, healthFilter, countryFilter]);

  // Fetch merchants
  useEffect(() => {
    let cancelled = false;

    async function fetchMerchants() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          sort: sortColumn,
          order: sortOrder,
        });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (planFilter !== "all") params.set("plan", planFilter);
        if (healthFilter !== "all") params.set("health", healthFilter);
        if (countryFilter !== "all") params.set("country", countryFilter);

        const res = await fetch(`/api/admin/crm/merchants?${params}`);
        if (cancelled) return;

        if (!res.ok) {
          setError(
            res.status === 403
              ? "Unauthorized — your email is not in the admin list."
              : "Failed to load merchants."
          );
          return;
        }

        const data = await res.json();
        setMerchants(data.merchants);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch {
        if (!cancelled) setError("Failed to load merchants.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMerchants();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, planFilter, healthFilter, countryFilter, sortColumn, sortOrder]);

  return {
    merchants,
    loading,
    error,
    page,
    setPage,
    total,
    totalPages,
    search,
    setSearch,
    planFilter,
    setPlanFilter,
    healthFilter,
    setHealthFilter,
    countryFilter,
    setCountryFilter,
    sortColumn,
    setSortColumn,
    sortOrder,
    setSortOrder,
  };
}
