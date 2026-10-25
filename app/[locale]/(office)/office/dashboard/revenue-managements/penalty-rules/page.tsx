"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Edit3,
  Loader2,
  Plus,
  Power,
  ShieldCheck,
  XCircle,
  MoreHorizontal,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";

import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { IconBadge } from "@/components/commen/icon-badge";

import {
  usePenaltyRules,
  useActivatePenaltyRule,
  useDeactivatePenaltyRule,
} from "@/hooks/revenue/penaltyRule.hook";

import {
  PenaltyRule,
  PenaltyRuleFilters,
} from "@/types/revenue/penality.";
import AppFilterBar from "@/components/app-filter-bar";

// =====================================================
// TYPES
// =====================================================

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

type ServiceFilter = "ALL" | "DEFAULT" | "LIZZ";

interface PenaltyRuleFilterState {
  status: StatusFilter;
  service: ServiceFilter;
}

const DEFAULT_FILTERS: PenaltyRuleFilterState = {
  status: "ALL",
  service: "ALL",
};

// =====================================================
// CONSTANTS
// =====================================================

const PAGE_SIZE = 10;

const CREATE_PATH =
  "/office/dashboard/revenue-managements/penalty-rules/create";

// =====================================================
// HELPERS
// =====================================================

function formatRate(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return `${value}%`;
}

function getStartLabel(
  startType: PenaltyRule["start_type"],
): string {
  switch (startType) {
    case "AGREEMENT_DATE":
      return "From Agreement Signing Date";

    case "FIXED_PAYMENT_DATE":
      return "From Fiscal Month Set by Penalty Rule";

    default:
      return startType;
  }
}

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return "No end date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

// =====================================================
// COMPONENT
// =====================================================

function RevenuePenalties() {
  const router = useRouter();

  // ===================================================
  // APPLIED FILTER STATE
  // ===================================================

  const [search, setSearch] = useState("");

  const [appliedFilters, setAppliedFilters] =
    useState<PenaltyRuleFilterState>(DEFAULT_FILTERS);

  // ===================================================
  // DRAFT FILTER STATE
  // ===================================================

  const [draftFilters, setDraftFilters] =
    useState<PenaltyRuleFilterState>(DEFAULT_FILTERS);

  // ===================================================
  // PAGINATION
  // ===================================================

  const [page, setPage] = useState(1);

  // ===================================================
  // FILTER CHANGE DETECTION
  // ===================================================

  const hasPendingChanges =
    draftFilters.status !== appliedFilters.status ||
    draftFilters.service !== appliedFilters.service;

  const hasAppliedFilters =
    search.trim() !== "" ||
    appliedFilters.status !== "ALL" ||
    appliedFilters.service !== "ALL";

  const activeFilterCount =
    (search.trim() !== "" ? 1 : 0) +
    (appliedFilters.status !== "ALL" ? 1 : 0) +
    (appliedFilters.service !== "ALL" ? 1 : 0);

  // ===================================================
  // APPLY FILTERS
  // ===================================================

  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setPage(1);
  };

  // ===================================================
  // CLEAR FILTERS
  // ===================================================

  const clearFilters = () => {
    setSearch("");
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  // ===================================================
  // RESET PAGE WHEN SEARCH CHANGES
  // ===================================================

  useEffect(() => {
    setPage(1);
  }, [search]);

  // ===================================================
  // API FILTERS
  // ===================================================

  const queryParams: PenaltyRuleFilters = {
    page,
    per_page: PAGE_SIZE,

    search: search.trim() || undefined,

    is_active:
      appliedFilters.status === "ACTIVE"
        ? true
        : appliedFilters.status === "INACTIVE"
          ? false
          : undefined,

    start_type:
      appliedFilters.service === "DEFAULT"
        ? "FIXED_PAYMENT_DATE"
        : appliedFilters.service === "LIZZ"
          ? "AGREEMENT_DATE"
          : undefined,

    sort_by: "name",
    sort_direction: "asc",
  };

  // ===================================================
  // FETCH PENALTY RULES
  // ===================================================

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = usePenaltyRules(queryParams);

  // ===================================================
  // STATUS MUTATIONS
  // ===================================================

  const activateMutation = useActivatePenaltyRule();
  const deactivateMutation = useDeactivatePenaltyRule();

  // ===================================================
  // API DATA
  // ===================================================

  const rules = data?.data ?? [];

  // ===================================================
  // PAGINATION META
  // ===================================================

  const meta = data?.meta;

  const currentPage = meta?.current_page ?? page;
  const totalPages = Math.max(meta?.last_page ?? 1, 1);
  const total = meta?.total ?? rules.length;

  const from =
    meta?.from ??
    (rules.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0);

  const to =
    meta?.to ??
    Math.min(currentPage * PAGE_SIZE, total);

  // ===================================================
  // PAGE STATISTICS
  // ===================================================
  // These counts represent the currently loaded page.
  // The total count comes from the API pagination metadata.
  // Use a backend summary endpoint for global statistics.
  // ===================================================

  const activeCount = rules.filter((rule) => rule.is_active).length;

  const defaultCount = rules.filter(
    (rule) => rule.start_type === "FIXED_PAYMENT_DATE",
  ).length;

  const overrideCount = rules.filter(
    (rule) => rule.start_type === "AGREEMENT_DATE",
  ).length;

  // ===================================================
  // NAVIGATION
  // ===================================================

  const handleCreate = () => {
    router.push(CREATE_PATH);
  };

  const handleEdit = (rule: PenaltyRule) => {
    router.push(
      `/office/dashboard/revenue-managements/penalty-rules/${rule.id}/edit`,
    );
  };

  // ===================================================
  // TOGGLE STATUS
  // ===================================================

  const toggleStatus = async (rule: PenaltyRule) => {
    if (rule.is_active) {
      await deactivateMutation.mutateAsync(rule.id);
    } else {
      await activateMutation.mutateAsync(rule.id);
    }
  };

  // ===================================================
  // ACTION LOADING
  // ===================================================

  const isActionLoading = (id: string): boolean => {
    return (
      (activateMutation.isPending &&
        activateMutation.variables === id) ||
      (deactivateMutation.isPending &&
        deactivateMutation.variables === id)
    );
  };

  // ===================================================
  // ERROR STATE
  // ===================================================

  if (isError) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />

            <div className="flex-1">
              <h2 className="font-semibold">
                Failed to load penalty rules
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "An unexpected error occurred while loading penalty rules."}
              </p>

              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => refetch()}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* HEADER */}

      <Banner
        description="Manage default penalty policies and service-specific overrides used by the revenue calculation engine."
        badge={
          <IconBadge
            className="gap-2 rounded-full p-3 text-x"
            icon={<ShieldCheck className="h-4 w-4" />}
          >
            Revenue Penalties
          </IconBadge>
        }
        overlayClassName="bg-transparent"
        background={
          <FloatingParticles
            color="#040404"
            count={35}
            speed={0.2}
            connectDistance={100}
            position="bottom-right"
          />
        }
        actions={
          <Button onClick={handleCreate} className="p-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Penalty Rule
          </Button>
        }
      />

      {/* FILTERS */}

      <AppFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search penalty rules..."
        searchLabel="Search penalty rules"
        title="Search and filter"
        description="Narrow penalty rules by policy and activation status."
        activeFilterCount={activeFilterCount}
        hasFilters={hasAppliedFilters || hasPendingChanges}
        onApply={applyFilters}
        onClear={clearFilters}
      >
        {/* POLICY FILTER */}

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Policy
          </label>

          <Select
            value={draftFilters.service}
            onValueChange={(value) => {
              setDraftFilters((current) => ({
                ...current,
                service: value as ServiceFilter,
              }));
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All policies" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">All policies</SelectItem>
              <SelectItem value="DEFAULT">
                Default policy
              </SelectItem>
              <SelectItem value="LIZZ">
                Lizz override
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* STATUS FILTER */}

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Status
          </label>

          <Select
            value={draftFilters.status}
            onValueChange={(value) => {
              setDraftFilters((current) => ({
                ...current,
                status: value as StatusFilter,
              }));
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AppFilterBar>

      {/* STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total */}

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Rules
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {isLoading ? "—" : total}
              </p>
            </div>

            <CircleDot className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Active */}

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Active
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {isLoading ? "—" : activeCount}
              </p>
            </div>

            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
        </div>

        {/* Default */}

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Default Policies
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {isLoading ? "—" : defaultCount}
              </p>
            </div>

            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
        </div>

        {/* Overrides */}

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Service Overrides
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {isLoading ? "—" : overrideCount}
              </p>
            </div>

            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
        </div>
      </div>

      
{/* TABLE */}

<div className="overflow-hidden rounded-xl border bg-card">
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="border-b bg-muted/40">
        <tr>
          <th className="w-16 px-4 py-3 text-center font-medium">
            No.
          </th>

          <th className="px-4 py-3 text-left font-medium">
            Rule
          </th>

          <th className="px-4 py-3 text-left font-medium">
            Policy
          </th>

          <th className="px-4 py-3 text-left font-medium">
            Calculation
          </th>

          <th className="px-4 py-3 text-left font-medium">
            Rates
          </th>

          <th className="px-4 py-3 text-left font-medium">
            Effective Period
          </th>

          <th className="px-4 py-3 text-left font-medium">
            Status
          </th>

          <th className="px-4 py-3 text-right font-medium">
            Actions
          </th>
        </tr>
      </thead>

      <tbody className="divide-y">
        {/* LOADING */}

        {isLoading ? (
          <tr>
            <td colSpan={8} className="px-4 py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />

                <p className="text-sm text-muted-foreground">
                  Loading penalty rules...
                </p>
              </div>
            </td>
          </tr>
        ) : rules.length === 0 ? (
          /* EMPTY */

          <tr>
            <td colSpan={8} className="px-4 py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <XCircle className="h-8 w-8 text-muted-foreground" />

                <div>
                  <p className="font-medium">
                    No penalty rules found
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Try changing your filters or create a new penalty rule.
                  </p>
                </div>
              </div>
            </td>
          </tr>
        ) : (
          /* ROWS */

          rules.map((rule: PenaltyRule, index: number) => {
            const actionLoading = isActionLoading(rule.id);

            /*
             * This classification assumes the backend's
             * start_type is the intended policy discriminator.
             * If policy scope is separate, use that field instead.
             */
            const isLizzOverride =
              rule.start_type === "AGREEMENT_DATE";

            return (
              <tr
                key={rule.id}
                className="transition-colors hover:bg-muted/30"
              >
                {/* NUMBER */}

                <td className="px-4 py-4 text-center text-muted-foreground tabular-nums">
                  {from + index}
                </td>

                {/* RULE */}

                <td className="px-4 py-4">
                  <div>
                    <p className="font-medium">
                      {rule.name}
                    </p>

                    {rule.legal_reference && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {rule.legal_reference}
                      </p>
                    )}
                  </div>
                </td>

                {/* POLICY */}

                <td className="px-4 py-4">
                  {isLizzOverride ? (
                    <div className="space-y-1">
                      <Badge variant="secondary">
                        Lizz Service Override
                      </Badge>

                      <p className="text-xs text-muted-foreground">
                        Applies to Lizz service
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Badge>Default Policy</Badge>

                      <p className="text-xs text-muted-foreground">
                        All Services
                      </p>
                    </div>
                  )}
                </td>

                {/* CALCULATION */}

                <td className="px-4 py-4">
                  <div>
                    <p className="font-medium">
                      {rule.start_type}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Basis: {rule.calculation_basis}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Start: {getStartLabel(rule.start_type)}
                    </p>
                  </div>
                </td>

                {/* RATES */}

                <td className="px-4 py-4">
                  <div className="min-w-[160px]">
                    <p className="font-medium">
                      {formatRate(rule.initial_rate)}

                      {rule.increment_rate !== null &&
                        rule.increment_rate !== undefined && (
                          <span className="text-muted-foreground">
                            {" + "}
                            {formatRate(rule.increment_rate)}

                            {rule.increment_period
                              ? ` / ${rule.increment_period.toLowerCase()}`
                              : ""}
                          </span>
                        )}
                    </p>

                    {rule.maximum_rate !== null &&
                      rule.maximum_rate !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Maximum: {formatRate(rule.maximum_rate)}
                        </p>
                      )}
                  </div>
                </td>

                {/* EFFECTIVE PERIOD */}

                <td className="px-4 py-4">
                  <div className="min-w-[170px]">
                    <p className="font-medium">
                      {formatDate(rule.effective_from)}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      to {formatDate(rule.effective_to)}
                    </p>
                  </div>
                </td>

                {/* STATUS */}

                <td className="px-4 py-4">
                  {rule.is_active ? (
                    <Badge className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="gap-1"
                    >
                      <XCircle className="h-3 w-3" />
                      Inactive
                    </Badge>
                  )}
                </td>

                {/* ACTIONS */}

                <td className="px-4 py-4">
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading}
                          className="gap-2"
                        >
                          {actionLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}

                          Actions
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="end"
                        className="w-44"
                      >
                        <DropdownMenuItem
                          onClick={() => handleEdit(rule)}
                          disabled={actionLoading}
                          className="gap-2"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => toggleStatus(rule)}
                          disabled={actionLoading}
                          className="gap-2"
                        >
                          <Power className="h-4 w-4" />
                          {rule.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>

  {/* PAGINATION */}

  {total > 0 && (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || isFetching}
          onClick={() =>
            setPage((value) => Math.max(1, value - 1))
          }
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="min-w-[70px] text-center text-sm">
          {currentPage} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages || isFetching}
          onClick={() =>
            setPage((value) =>
              Math.min(totalPages, value + 1),
            )
          }
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )}
</div>

    </div>
  );
}

export default RevenuePenalties;
