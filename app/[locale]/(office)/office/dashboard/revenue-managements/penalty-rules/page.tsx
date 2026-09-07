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
import { Toolbar } from "@/components/commen/Toolbar";
import { SearchInput } from "@/components/input/SearchInput";

import {
  usePenaltyRules,
  useActivatePenaltyRule,
  useDeactivatePenaltyRule,
} from "@/hooks/revenue/penaltyRule.hook";

import {
  PenaltyRule,
  PenaltyRuleFilters,
} from "@/types/revenue/penality.";


// =====================================================
// TYPES
// =====================================================

type StatusFilter =
  | "ALL"
  | "ACTIVE"
  | "INACTIVE";

type ServiceFilter =
  | "ALL"
  | "DEFAULT"
  | "LIZZ";


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
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return `${value}%`;
}


// =====================================================
// START LABEL
// =====================================================

function getStartLabel(
  startType: PenaltyRule["start_type"],
): string {
  switch (startType) {
    /**
     * Penalty starts from the date the agreement
     * was signed.
     */
    case "AGREEMENT_DATE":
      return "From Agreement Signing Date";

    /**
     * Penalty starts from the fiscal month
     * configured in the penalty rule.
     */
    case "FIXED_FISCAL_MONTH":
      return "From Fiscal Month Set by Penalty Rule";

    default:
      return startType;
  }
}


// =====================================================
// DATE FORMATTER
// =====================================================

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

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}


// =====================================================
// COMPONENT
// =====================================================

function RevenuePenalties() {
  const router = useRouter();


  // ===================================================
  // FILTER STATE
  // ===================================================

  const [search, setSearch] =
    useState<string>("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [serviceFilter, setServiceFilter] =
    useState<ServiceFilter>("ALL");


  // ===================================================
  // PAGINATION
  // ===================================================

  const [page, setPage] =
    useState<number>(1);


  // ===================================================
  // RESET PAGE WHEN FILTERS CHANGE
  // ===================================================

  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
    serviceFilter,
  ]);


  // ===================================================
  // API FILTERS
  // ===================================================

  const queryParams: PenaltyRuleFilters = {
    page,
    per_page: PAGE_SIZE,
  
    search:
      search.trim() || undefined,
  
    is_active:
      statusFilter === "ACTIVE"
        ? true
        : statusFilter === "INACTIVE"
          ? false
          : undefined,
  
    start_type:
      serviceFilter === "DEFAULT"
        ? "FIXED_FISCAL_MONTH"
        : serviceFilter === "LIZZ"
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
  } = usePenaltyRules(
    queryParams,
  );


  // ===================================================
  // STATUS MUTATIONS
  // ===================================================

  const activateMutation =
    useActivatePenaltyRule();

  const deactivateMutation =
    useDeactivatePenaltyRule();


  // ===================================================
  // API DATA
  // ===================================================

  const rules =
    data?.data ?? [];


  // ===================================================
  // PAGINATION META
  // ===================================================

  const meta =
    data?.meta;

  const currentPage =
    meta?.current_page ?? page;

  const totalPages =
    Math.max(
      meta?.last_page ?? 1,
      1,
    );

  const total =
    meta?.total ?? rules.length;

  const from =
    meta?.from ??
    (
      rules.length > 0
        ? (currentPage - 1) *
            PAGE_SIZE +
          1
        : 0
    );

  const to =
    meta?.to ??
    Math.min(
      currentPage *
        PAGE_SIZE,
      total,
    );


  // ===================================================
  // PAGE STATISTICS
  // ===================================================
  //
  // IMPORTANT:
  // Because this endpoint is paginated, these counts
  // represent the currently loaded page only.
  //
  // `total` is the global API total.
  //
  // If global Active / Default / Override counts are
  // required, expose a backend summary endpoint.
  // ===================================================

  const activeCount =
    rules.filter(
      (rule) =>
        rule.is_active,
    ).length;

  const defaultCount =
    rules.filter(
      (rule) =>
        rule.start_type ===
        "FIXED_FISCAL_MONTH",
    ).length;

  const overrideCount =
    rules.filter(
      (rule) =>
        rule.start_type ===
        "AGREEMENT_DATE",
    ).length;


  // ===================================================
  // NAVIGATION
  // ===================================================

  const handleCreate =
    () => {
      router.push(
        CREATE_PATH,
      );
    };


  const handleEdit =
    (
      rule: PenaltyRule,
    ) => {
      router.push(
        `/office/dashboard/revenue-managements/penalty-rules/${rule.id}/edit`,
      );
    };


  // ===================================================
  // TOGGLE STATUS
  // ===================================================

  const toggleStatus =
    async (
      rule: PenaltyRule,
    ) => {
      if (rule.is_active) {
        await deactivateMutation.mutateAsync(
          rule.id,
        );
      } else {
        await activateMutation.mutateAsync(
          rule.id,
        );
      }
    };


  // ===================================================
  // ACTION LOADING
  // ===================================================

  const isActionLoading =
    (
      id: string,
    ): boolean => {
      return (
        (
          activateMutation.isPending &&
          activateMutation.variables === id
        ) ||
        (
          deactivateMutation.isPending &&
          deactivateMutation.variables === id
        )
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
                onClick={() =>
                  refetch()
                }
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


      {/* ==================================================
          HEADER
      ================================================== */}

      <Banner
        description="Manage default penalty policies and service-specific overrides used by the revenue calculation engine."
        badge={
          <IconBadge
            className="gap-2 rounded-full bg-black/20 p-3 text-xs text-white"
            icon={
              <ShieldCheck className="h-4 w-4" />
            }
          >
            Revenue Penalties
          </IconBadge>
        }
        background={
          <FloatingParticles
            color="#040404"
            count={35}
            speed={0.2}
            connectDistance={100}
            position="bottom-right"
          />
        }
        overlayClassName="bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50"
        className="text-white"
        actions={
          <Button
            onClick={handleCreate}
            className="p-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Penalty Rule
          </Button>
        }
      />


      {/* ==================================================
          TOOLBAR
      ================================================== */}

      <Toolbar
        search={
          <SearchInput
            placeholder="Search penalty rules..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            className="min-w-[280px]"
          />
        }

        right={
          <>
            {/* Policy Filter */}

            <Select
              value={serviceFilter}
              onValueChange={(
                value,
              ) =>
                setServiceFilter(
                  value as ServiceFilter,
                )
              }
            >
              <SelectTrigger className="w-[220px] py-5">
                <SelectValue placeholder="Policy" />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="ALL">
                  All Policies
                </SelectItem>

                <SelectItem value="DEFAULT">
                  Default Policy
                </SelectItem>

                <SelectItem value="LIZZ">
                  Lizz Override
                </SelectItem>

              </SelectContent>
            </Select>


            {/* Status Filter */}

            <Select
              value={statusFilter}
              onValueChange={(
                value,
              ) =>
                setStatusFilter(
                  value as StatusFilter,
                )
              }
            >
              <SelectTrigger className="w-[150px] py-5">
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="ALL">
                  All Status
                </SelectItem>

                <SelectItem value="ACTIVE">
                  Active
                </SelectItem>

                <SelectItem value="INACTIVE">
                  Inactive
                </SelectItem>

              </SelectContent>
            </Select>

          </>
        }
      />


      {/* ==================================================
          STATS
      ================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">


        {/* Total */}

        <div className="rounded-xl border bg-card p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-muted-foreground">
                Total Rules
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {isLoading
                  ? "—"
                  : total}
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
                {isLoading
                  ? "—"
                  : activeCount}
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
                {isLoading
                  ? "—"
                  : defaultCount}
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
                {isLoading
                  ? "—"
                  : overrideCount}
              </p>

            </div>

            <AlertCircle className="h-5 w-5 text-amber-600" />

          </div>

        </div>

      </div>


      {/* ==================================================
          TABLE
      ================================================== */}

      <div className="overflow-hidden rounded-xl border bg-card">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="border-b bg-muted/40">

              <tr>

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


              {/* ==================================================
                  LOADING
              ================================================== */}

              {isLoading ? (

                <tr>

                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center"
                  >

                    <div className="flex flex-col items-center gap-3">

                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />

                      <p className="text-sm text-muted-foreground">
                        Loading penalty rules...
                      </p>

                    </div>

                  </td>

                </tr>

              ) : rules.length === 0 ? (

                /* ==================================================
                   EMPTY
                ================================================== */

                <tr>

                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center"
                  >

                    <div className="flex flex-col items-center gap-3">

                      <XCircle className="h-8 w-8 text-muted-foreground" />

                      <div>

                        <p className="font-medium">
                          No penalty rules found
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Try changing your filters
                          or create a new penalty rule.
                        </p>

                      </div>

                    </div>

                  </td>

                </tr>

              ) : (

                /* ==================================================
                   ROWS
                ================================================== */

                rules.map(
                  (
                    rule: PenaltyRule,
                  ) => {

                    const actionLoading =
                      isActionLoading(
                        rule.id,
                      );

                    /**
                     * IMPORTANT:
                     *
                     * Do not infer service identity
                     * from start_type.
                     *
                     * The backend should provide the
                     * actual service/scope information.
                     *
                     * Until that relation is available,
                     * we use the current filter context.
                     */
                    const isLizzOverride =
                      serviceFilter ===
                      "LIZZ" ||
                      rule.start_type ===
                      "AGREEMENT_DATE";

                    return (

                      <tr
                        key={rule.id}
                        className="transition-colors hover:bg-muted/30"
                      >


                        {/* ======================================
                            RULE
                        ====================================== */}

                        <td className="px-4 py-4">

                          <div className="">

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


                        {/* ======================================
                            POLICY
                        ====================================== */}

                        <td className="px-4 py-4">

                          {isLizzOverride ? (

                            <div className="space-y-1">

                              <Badge variant="secondary">
                                Lizz Service Override
                              </Badge>

                              <p className="text-xs text-muted-foreground">
                                Applies to Lizz
                                service
                              </p>

                            </div>

                          ) : (

                            <div className="space-y-1">

                              <Badge>
                                Default Policy
                              </Badge>

                              <p className="text-xs text-muted-foreground">
                                All Services
                              </p>

                            </div>

                          )}

                        </td>


                        {/* ======================================
                            CALCULATION
                        ====================================== */}

                        <td className="px-4 py-4">

                          <div>

                            <p className="font-medium">
                              {rule.start_type}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              Basis:{" "}
                              {rule.calculation_basis}
                            </p>
                            <p className="font-medium">
                              Start :  {getStartLabel(
                                rule.start_type,
                              )}
                            </p>

                          </div>

                        </td>


                        {/* ======================================
                            RATES
                        ====================================== */}

                        <td className="px-4 py-4">

                          <div className="min-w-[160px]">

                            <p className="font-medium">

                              {formatRate(
                                rule.initial_rate,
                              )}

                              {rule.increment_rate !==
                                null &&
                                rule.increment_rate !==
                                  undefined && (

                                <span className="text-muted-foreground">

                                  {" + "}

                                  {formatRate(
                                    rule.increment_rate,
                                  )}

                                  {rule.increment_period
                                    ? ` / ${rule.increment_period.toLowerCase()}`
                                    : ""}

                                </span>

                              )}

                            </p>

                            {rule.maximum_rate !==
                              null &&
                              rule.maximum_rate !==
                                undefined && (

                              <p className="text-xs text-muted-foreground">
                                Maximum:{" "}
                                {formatRate(
                                  rule.maximum_rate,
                                )}
                              </p>

                            )}

                          </div>

                        </td>




                        {/* ======================================
                            EFFECTIVE PERIOD
                        ====================================== */}

                        <td className="px-4 py-4">

                          <div className="min-w-[170px]">

                            <p className="font-medium">
                              {formatDate(
                                rule.effective_from,
                              )}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              to{" "}
                              {formatDate(
                                rule.effective_to,
                              )}
                            </p>

                          </div>

                        </td>


                        {/* ======================================
                            STATUS
                        ====================================== */}

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


                      {/* ======================================
    ACTIONS
====================================== */}

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

      <DropdownMenuContent align="end" className="w-44">
        {/* Edit */}
        <DropdownMenuItem
          onClick={() => handleEdit(rule)}
          disabled={actionLoading}
          className="gap-2"
        >
          <Edit3 className="h-4 w-4" />
          Edit
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Activate / Deactivate */}
        <DropdownMenuItem
          onClick={() => toggleStatus(rule)}
          disabled={actionLoading}
          className="gap-2"
        >
          <Power className="h-4 w-4" />

          {rule.is_active ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</td>

                      </tr>

                    );
                  },
                )

              )}

            </tbody>

          </table>

        </div>


        {/* ==================================================
            PAGINATION
        ================================================== */}

        {total > 0 && (

          <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

            {/* Showing */}

            <p className="text-sm text-muted-foreground">

              Showing{" "}

              {from}

              {"–"}

              {to}

              {" of "}

              {total}

            </p>


            {/* Navigation */}

            <div className="flex items-center gap-2">

              <Button
                variant="outline"
                size="sm"
                disabled={
                  currentPage <= 1 ||
                  isFetching
                }
                onClick={() =>
                  setPage(
                    (value) =>
                      Math.max(
                        1,
                        value - 1,
                      ),
                  )
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
                disabled={
                  currentPage >=
                    totalPages ||
                  isFetching
                }
                onClick={() =>
                  setPage(
                    (value) =>
                      Math.min(
                        totalPages,
                        value + 1,
                      ),
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