"use client";

// src/modules/audit/pages/audits-page.tsx
//
// Same UI as your draft, but the mock buildLogs()/ALL_LOGS data + client-side
// filter/sort/paginate logic has been replaced with the real useSystemLogs
// query hook. Filtering, sorting, and pagination now happen server-side via
// SystemLogQuery; this component just reflects whatever page it's on.
//
// Adjust the import paths below ("@/modules/audit/hooks/use-system-logs",
// "@/types/auditLog", "./toolbar") to match your project's actual aliases.

import  { Fragment, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Info,
  Loader2,
} from "lucide-react";

import type {
  AuditAction,
  AuditSortDirection,
  AuditSortField,
  SystemLog,
  SystemLogQuery,
} from "@/types/auditLog";


// ---------------------------------------------------------------------------
// UI-only constants (badge styling, static filter options). If your modules
// or actions ever need to come from the backend, swap these for a lookup
// query and keep everything else the same.
// ---------------------------------------------------------------------------

const ACTIONS: Record<AuditAction, { style: string }> = {
  CREATE: { style: "text-[#0F6E56] bg-[#E1F5EE] border-[#9FE1CB]" },
  UPDATE: { style: "text-[#185FA5] bg-[#E6F1FB] border-[#85B7EB]" },
  DELETE: { style: "text-[#A32D2D] bg-[#FCEBEB] border-[#F09595]" },
  LOGIN: { style: "text-[#534AB7] bg-[#EEEDFE] border-[#AFA9EC]" },
  LOGIN_FAILED: { style: "text-[#993C1D] bg-[#FAECE7] border-[#F0997B]" },
  EXPORT: { style: "text-[#5F5E5A] bg-[#F1EFE8] border-[#B4B2A9]" },
};

const DEFAULT_ACTION_STYLE = "text-stone-600 bg-stone-100 border-stone-200";

const MODULES: string[] = ["billing", "auth", "inventory", "orders", "users", "settings"];

const FILTER_CONFIG: ToolbarFilterConfig[] = [
  {
    key: "action",
    label: "Action",
    type: "select",
    placeholder: "All actions",
    options: (Object.keys(ACTIONS) as AuditAction[]).map((a) => ({
      label: a.replace("_", " "),
      value: a,
    })),
  },
  {
    key: "module",
    label: "Module",
    type: "select",
    placeholder: "All modules",
    options: MODULES.map((m) => ({ label: m, value: m })),
  },
  { key: "from", label: "From", type: "date" },
  { key: "to", label: "To", type: "date" },
];

const PER_PAGE_OPTIONS: number[] = [10, 20, 50, 100];

const SORT_FIELDS: AuditSortField[] = ["created_at", "action", "module", "user_id", "resource_type"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function initials(name: string | undefined | null): string {
  if (!name) return "--";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Sort header
// ---------------------------------------------------------------------------

interface SortHeaderProps {
  field: AuditSortField;
  activeField: AuditSortField;
  direction: AuditSortDirection;
  onSort: (field: AuditSortField) => void;
  children: React.ReactNode;
}

function SortHeader({ field, activeField, direction, onSort, children }: SortHeaderProps): React.ReactElement {
  const active = activeField === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-stone-500 hover:text-stone-800 transition-colors"
    >
      {children}
      <ChevronDown
        size={12}
        className={`transition-transform ${active ? "text-stone-800" : "text-stone-300"} ${
          active && direction === "asc" ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AuditsPage(): React.ReactElement {
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [filterValues, setFilterValues] = useState<ToolbarFilterValues>({
    action: "",
    module: "",
    from: "",
    to: "",
  });
  const [sortBy, setSortBy] = useState<AuditSortField>("created_at");
  const [sortDirection, setSortDirection] = useState<AuditSortDirection>("desc");
  const [perPage, setPerPage] = useState<number>(20);
  const [page, setPage] = useState<number>(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Debounce free-text search so we don't fire a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const action = (filterValues.action as AuditAction | "") || "";
  const moduleFilter = filterValues.module ?? "";
  const from = filterValues.from ?? "";
  const to = filterValues.to ?? "";

  function handleFilterChange(key: string, value: string): void {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function handleClearFilters(): void {
    setFilterValues({ action: "", module: "", from: "", to: "" });
    setPage(1);
  }

  // The query sent to GET /audit-logs, typed against SystemLogQuery so the
  // compiler catches drift between this page and SystemLogIndexRequest::rules().
  const query: SystemLogQuery = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      action: action || undefined,
      module: moduleFilter || undefined,
      from: from || undefined,
      to: to || undefined,
      per_page: perPage,
      page,
      sort_by: sortBy,
      sort_direction: sortDirection,
    }),
    [debouncedSearch, action, moduleFilter, from, to, perPage, page, sortBy, sortDirection]
  );

  const { data, isLoading, isFetching, isError, error } = useSystemLogs(query);

  // Assumes systemLogService.index() resolves to
  // ApiResponse<PaginatedData<SystemLog>>. Adjust these two accessors if
  // your service unwraps the response envelope differently.
  const rows: SystemLog[] = data?.data ?? [];
  const meta = data?.meta;

  const total = meta?.total ?? 0;
  const lastPage = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;
  const rangeFrom = meta?.from ?? 0;
  const rangeTo = meta?.to ?? 0;

  function toggleSort(field: AuditSortField): void {
    if (sortBy === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-stone-900">Audit logs</h1>
            <p className="text-sm text-stone-500 mt-1">
              Every action taken across the system, who did it, and what changed.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-400 uppercase tracking-wide flex items-center justify-end gap-1.5">
              Total events
              {isFetching && !isLoading && <Loader2 size={11} className="animate-spin text-stone-400" />}
            </div>
            <div className="text-lg font-mono font-medium text-stone-800">{total.toLocaleString()}</div>
          </div>
        </div>

        {/* Reusable toolbar — same component works on any list page */}
        <Toolbar
          className="mb-4"
          searchValue={search}
          onSearchChange={(v) => setSearch(v)}
          searchPlaceholder="Search by description, resource, user, or IP"
          filters={FILTER_CONFIG}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        {/* Table */}
        <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/60">
                  <th className="w-8 px-3 py-2.5" />
                  {SORT_FIELDS.map((field) => (
                    <th key={field} className="text-left px-3 py-2.5">
                      <SortHeader field={field} activeField={sortBy} direction={sortDirection} onSort={toggleSort}>
                        {field === "created_at" && "Time"}
                        {field === "action" && "Action"}
                        {field === "module" && "Module"}
                        {field === "user_id" && "User"}
                        {field === "resource_type" && "Resource"}
                      </SortHeader>
                    </th>
                  ))}
                  <th className="text-left px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-stone-500">
                    Description
                  </th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-stone-500">
                    IP address
                  </th>
                </tr>
              </thead>
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-sm text-[#A32D2D]">
                      <div className="flex items-center justify-center gap-2">
                        <AlertTriangle size={14} />
                        {error instanceof Error ? error.message : "Failed to load audit logs."}
                      </div>
                    </td>
                  </tr>
                )}

                {!isError && isLoading && (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-sm text-stone-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> Loading audit logs…
                      </div>
                    </td>
                  </tr>
                )}

                {!isError && !isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-sm text-stone-400">
                      No events match these filters.
                    </td>
                  </tr>
                )}

                {!isError &&
                  !isLoading &&
                  rows.map((log) => {
                    const isOpen = expandedId === log.id;
                    const actionStyle =
                      ACTIONS[log.action as AuditAction]?.style ?? DEFAULT_ACTION_STYLE;
                    const latency = log.metadata?.latency_ms;

                    return (
                      <Fragment key={log.id}>
                        <tr
                          onClick={() => setExpandedId(isOpen ? null : log.id)}
                          className="border-b border-stone-100 last:border-0 hover:bg-stone-50/80 cursor-pointer transition-colors"
                        >
                          <td className="px-3 py-2.5 text-stone-400">
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-xs text-stone-600 whitespace-nowrap">
                            {formatTimestamp(log.created_at)}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] font-medium text-stone-500 shrink-0">
                                {initials(log.user?.name)}
                              </div>
                              <span className="text-stone-700 whitespace-nowrap">
                                {log.user?.name ?? "System"}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded border text-[11px] font-medium whitespace-nowrap ${actionStyle}`}
                            >
                              {String(log.action).replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-stone-500 whitespace-nowrap">{log.module}</td>
                          <td className="px-3 py-2.5 font-mono text-xs text-stone-600 whitespace-nowrap">
                            {log.resource.type}
                            <span className="text-stone-400"> / {log.resource.id}</span>
                          </td>
                          <td className="px-3 py-2.5 text-stone-700 max-w-[280px] truncate">
                            {log.description ?? "—"}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-xs text-stone-500 whitespace-nowrap">
                            {log.ip_address ?? "—"}
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="border-b border-stone-100 bg-stone-50/50">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                  <div className="text-xs font-medium uppercase tracking-wide text-stone-400 flex items-center gap-1.5">
                                    <Info size={12} /> Details
                                  </div>
                                  <dl className="text-xs space-y-1.5">
                                    <div className="flex justify-between gap-4">
                                      <dt className="text-stone-400">Event ID</dt>
                                      <dd className="font-mono text-stone-600">{log.id}</dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <dt className="text-stone-400">Request ID</dt>
                                      <dd className="font-mono text-stone-600">{log.request_id ?? "—"}</dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <dt className="text-stone-400">User email</dt>
                                      <dd className="text-stone-600">{log.user?.email ?? "—"}</dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <dt className="text-stone-400">Source</dt>
                                      <dd className="text-stone-600">{log.metadata?.source ?? "—"}</dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <dt className="text-stone-400">Latency</dt>
                                      <dd className="text-stone-600">
                                        {latency != null ? `${latency} ms` : "—"}
                                      </dd>
                                    </div>
                                  </dl>
                                  <div
                                    className="text-[11px] text-stone-400 pt-1 border-t border-stone-200 mt-2 truncate"
                                    title={log.user_agent ?? undefined}
                                  >
                                    {log.user_agent ?? "—"}
                                  </div>
                                </div>

                                <div className="lg:col-span-2">
                                  <div className="text-xs font-medium uppercase tracking-wide text-stone-400 mb-2">
                                    Changes
                                  </div>
                                  {log.old_values && log.new_values ? (
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="bg-[#FCEBEB] border border-[#F09595]/60 rounded-md p-2.5">
                                        <div className="text-[10px] font-medium text-[#A32D2D] mb-1.5 uppercase tracking-wide">
                                          Before
                                        </div>
                                        <pre className="text-xs font-mono text-[#791F1F] whitespace-pre-wrap break-words">
                                          {JSON.stringify(log.old_values, null, 2)}
                                        </pre>
                                      </div>
                                      <div className="bg-[#E1F5EE] border border-[#9FE1CB]/60 rounded-md p-2.5">
                                        <div className="text-[10px] font-medium text-[#0F6E56] mb-1.5 uppercase tracking-wide">
                                          After
                                        </div>
                                        <pre className="text-xs font-mono text-[#085041] whitespace-pre-wrap break-words">
                                          {JSON.stringify(log.new_values, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-stone-400 italic">
                                      No field-level changes recorded for this event.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-stone-200 bg-stone-50/60">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span>Rows per page</span>
              <select
                value={perPage}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="px-1.5 py-1 border border-stone-200 rounded-md bg-white text-xs focus:outline-none focus:ring-2 focus:ring-stone-800/10"
              >
                {PER_PAGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-stone-500">
              {total === 0 ? (
                "0 results"
              ) : (
                <>
                  {rangeFrom}–{rangeTo} of {total}
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={currentPage === 1 || isLoading}
                className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
                className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 text-xs font-mono text-stone-600">
                {currentPage} / {lastPage}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={currentPage === lastPage || isLoading}
                className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPage(lastPage)}
                disabled={currentPage === lastPage || isLoading}
                className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// src/components/toolbar.tsx
//
// Generic search + filter bar used by any list/table page in the system.
// Nothing here changed functionally from your draft — just added the
// missing React import and fixed a stray double space in the export.

import React, { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSystemLogs } from "@/hooks/useAuditLogs";

// ---------------------------------------------------------------------------
// Types — define once, reuse on any list/table page in the system
// ---------------------------------------------------------------------------

export interface ToolbarSelectOption {
  label: string;
  value: string;
}

/** A single filter field. `type` decides which control renders. */
export type ToolbarFilterConfig =
  | {
      key: string;
      label: string;
      type: "select";
      options: ToolbarSelectOption[];
      placeholder?: string; // shown as the "All ..." option
    }
  | {
      key: string;
      label: string;
      type: "date";
    }
  | {
      key: string;
      label: string;
      type: "text";
      placeholder?: string;
    };

/** Flat map of filter key -> current value. Empty string = unset. */
export type ToolbarFilterValues = Record<string, string>;

export interface ToolbarProps {
  /** Free-text search value, lifted to the parent. */
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  /** Filter field definitions — this is what changes between pages. */
  filters: ToolbarFilterConfig[];
  filterValues: ToolbarFilterValues;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;

  /** Hide the search input entirely for filter-only toolbars. */
  hideSearch?: boolean;

  /** Extra content rendered at the right of the search row (e.g. an export button). */
  actions?: React.ReactNode;

  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Toolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
  filters,
  filterValues,
  onFilterChange,
  onClearFilters,
  hideSearch = false,
  actions,
  className = "",
}: ToolbarProps): React.ReactElement {
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

  const activeFilterCount = filters.filter((f) => Boolean(filterValues[f.key])).length;

  return (
    <div className={`bg-white border border-stone-200 rounded-lg ${className}`}>
      <div className="flex items-center gap-3 p-3">
        {!hideSearch && (
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={searchValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-md bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-800/10 focus:border-stone-300 placeholder:text-stone-400"
            />
          </div>
        )}

        {filters.length > 0 && (
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-md transition-colors shrink-0 ${
              activeFilterCount > 0
                ? "border-stone-800 bg-stone-800 text-white"
                : "border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] rounded-full bg-white text-stone-800">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}

        {actions}
      </div>

      {filtersOpen && filters.length > 0 && (
        <div className="border-t border-stone-100 p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          {filters.map((field) => (
            <div key={field.key}>
              <label className="block text-xs text-stone-500 mb-1">{field.label}</label>
              {field.type === "select" && (
                <select
                  value={filterValues[field.key] ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onFilterChange(field.key, e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-stone-800/10"
                >
                  <option value="">{field.placeholder ?? `All ${field.label.toLowerCase()}`}</option>
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              {field.type === "date" && (
                <input
                  type="date"
                  value={filterValues[field.key] ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFilterChange(field.key, e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-stone-800/10"
                />
              )}
              {field.type === "text" && (
                <input
                  type="text"
                  value={filterValues[field.key] ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFilterChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-stone-800/10"
                />
              )}
            </div>
          ))}

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="col-span-2 md:col-span-4 flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 justify-self-start"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}