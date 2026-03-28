"use client";

import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { HealthBadge } from "@/components/admin/HealthBadge";
import { useAdminMerchants } from "@/hooks/useAdminMerchants";

const PLAN_OPTIONS = [
  { value: "all", label: "All Plans" },
  { value: "free_trial", label: "Free Trial" },
  { value: "starter", label: "Starter" },
  { value: "growth", label: "Growth" },
  { value: "scale", label: "Scale" },
];

const HEALTH_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "healthy", label: "Healthy" },
  { value: "at-risk", label: "At Risk" },
  { value: "churned", label: "Churned" },
];

const COUNTRY_OPTIONS = [
  { value: "all", label: "All Countries" },
  { value: "US", label: "US" },
  { value: "NG", label: "Nigeria" },
  { value: "GB", label: "UK" },
  { value: "CA", label: "Canada" },
  { value: "GH", label: "Ghana" },
  { value: "KE", label: "Kenya" },
];

export function MerchantList() {
  const router = useRouter();
  const {
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
  } = useAdminMerchants();

  const toggleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("desc");
    }
  };

  const SortHeader = ({
    column,
    children,
  }: {
    column: string;
    children: React.ReactNode;
  }) => (
    <TableHead>
      <button
        className="flex items-center gap-1 text-xs font-medium text-[#8AADA6] uppercase tracking-wider hover:text-[#1B2A4A] transition-colors"
        onClick={() => toggleSort(column)}
      >
        {children}
        <ArrowUpDown
          className={`w-3 h-3 ${sortColumn === column ? "text-[#00A99D]" : "text-[#8AADA6]/40"}`}
        />
      </button>
    </TableHead>
  );

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-[#E74C3C]/20 p-8 text-center">
        <p className="text-[#1B2A4A] font-medium">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
    >
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8AADA6]" />
          <input
            type="text"
            placeholder="Search by business name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#D0EDE8] rounded-lg bg-white text-[#1B2A4A] placeholder:text-[#8AADA6] focus:outline-none focus:ring-2 focus:ring-[#00A99D]/20 focus:border-[#00A99D]"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-[#D0EDE8] rounded-lg bg-white text-[#1B2A4A] focus:outline-none focus:ring-2 focus:ring-[#00A99D]/20"
        >
          {PLAN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={healthFilter}
          onChange={(e) => setHealthFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-[#D0EDE8] rounded-lg bg-white text-[#1B2A4A] focus:outline-none focus:ring-2 focus:ring-[#00A99D]/20"
        >
          {HEALTH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-[#D0EDE8] rounded-lg bg-white text-[#1B2A4A] focus:outline-none focus:ring-2 focus:ring-[#00A99D]/20"
        >
          {COUNTRY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#D0EDE8] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F0F9F8]">
              <SortHeader column="business_name">Business</SortHeader>
              <TableHead className="text-xs font-medium text-[#8AADA6] uppercase tracking-wider">
                Email
              </TableHead>
              <TableHead className="text-xs font-medium text-[#8AADA6] uppercase tracking-wider">
                Plan
              </TableHead>
              <SortHeader column="credit_balance">Credits</SortHeader>
              <TableHead className="text-xs font-medium text-[#8AADA6] uppercase tracking-wider">
                Calls
              </TableHead>
              <TableHead className="text-xs font-medium text-[#8AADA6] uppercase tracking-wider">
                Last Active
              </TableHead>
              <TableHead className="text-xs font-medium text-[#8AADA6] uppercase tracking-wider">
                Health
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-[#F0F9F8] rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : merchants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <p className="text-[#8AADA6] text-sm">No merchants found.</p>
                </TableCell>
              </TableRow>
            ) : (
              merchants.map((m) => (
                <TableRow
                  key={m.id}
                  className="cursor-pointer hover:bg-[#F0F9F8] transition-colors"
                  onClick={() => router.push(`/dashboard/admin/merchants/${m.id}`)}
                >
                  <TableCell className="font-medium text-[#1B2A4A]">
                    {m.businessName || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-[#8AADA6]">
                    {m.email || "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                      style={{
                        backgroundColor: "#00A99D15",
                        border: "1px solid #00A99D30",
                        color: "#00A99D",
                      }}
                    >
                      {m.plan?.replace("_", " ") ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-[#1B2A4A] tabular-nums">
                    {m.creditMinutes} min
                  </TableCell>
                  <TableCell className="text-sm text-[#1B2A4A] tabular-nums">
                    {m.totalCalls}
                  </TableCell>
                  <TableCell className="text-sm text-[#8AADA6]">
                    {m.lastCallAt
                      ? formatDistanceToNow(new Date(m.lastCallAt), {
                          addSuffix: true,
                        })
                      : m.lastSignInAt
                        ? formatDistanceToNow(new Date(m.lastSignInAt), {
                            addSuffix: true,
                          })
                        : "Never"}
                  </TableCell>
                  <TableCell>
                    <HealthBadge status={m.health} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#D0EDE8]">
            <p className="text-xs text-[#8AADA6]">
              {total} merchant{total !== 1 ? "s" : ""} total
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-1 rounded text-[#8AADA6] hover:text-[#1B2A4A] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-[#8AADA6]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded text-[#8AADA6] hover:text-[#1B2A4A] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
