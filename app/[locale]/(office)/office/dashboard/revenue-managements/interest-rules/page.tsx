"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FileText,
  Filter,
  Landmark,
  Loader2,
  MoreHorizontal,
  Percent,
  Plus,
  Power,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { Toolbar } from "@/components/commen/Toolbar";
import { SearchInput } from "@/components/input/SearchInput";

import {
  useActivateInterestRule,
  useDeactivateInterestRule,
  useInterestRules,
} from "@/hooks/revenue/interestRule.hook";

import {
  CalculationBasis,
  CalculationMethod,
  InterestRule,
  RatePeriod,
} from "@/types/revenue/interestRule";

/* ============================================================================
   Types
============================================================================ */

type StatusFilter =
  | "ALL"
  | "ACTIVE"
  | "INACTIVE";

type EffectivePhase =
  | "current"
  | "upcoming"
  | "expired";

type EffectivePhaseFilter =
  | "ALL"
  | EffectivePhase;

type Filters = {
  search: string;
  status: StatusFilter;
  ratePeriod: "ALL" | RatePeriod;
  calculationBasis:
    | "ALL"
    | CalculationBasis;
  calculationMethod:
    | "ALL"
    | CalculationMethod;
  effectivePhase: EffectivePhaseFilter;
  onlyMismatches: boolean;
};

/* ============================================================================
   Labels
============================================================================ */

const RATE_PERIOD_LABELS: Record<
  RatePeriod,
  string
> = {
  YEAR: "Annual",
  MONTH: "Monthly",
  DAY: "Daily",
};

const CALCULATION_METHOD_LABELS: Record<
  CalculationMethod,
  string
> = {
  SIMPLE: "Simple Interest",
  COMPOUND: "Compound Interest",
};

const CALCULATION_BASIS_LABELS: Record<
  CalculationBasis,
  string
> = {
  PRINCIPAL: "Principal",
  OUTSTANDING: "Outstanding Amount",
};

const EFFECTIVE_PHASE_LABELS: Record<
  EffectivePhase,
  string
> = {
  current: "Currently Effective",
  upcoming: "Upcoming",
  expired: "Expired",
};

/* ============================================================================
   Formatting
============================================================================ */

function formatPercentage(
  rate: number,
): string {
  return `${rate
    .toFixed(4)
    .replace(/0+$/, "")
    .replace(/\.$/, "")}%`;
}

function formatDate(
  date: string | null,
): string {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(
    new Date(`${date}T00:00:00`),
  );
}

/* ============================================================================
   Status
============================================================================ */

function getRuleStatus(
  rule: InterestRule,
) {
  if (!rule.is_active) {
    return {
      label: "Inactive",
      className:
        "border-muted bg-muted/40 text-muted-foreground",
      icon: XCircle,
    };
  }

  return {
    label: "Active",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400",
    icon: CheckCircle2,
  };
}

/* ============================================================================
   Effective Phase
============================================================================ */

function getEffectivePhase(
  rule: InterestRule,
  todayStr: string,
): EffectivePhase {
  if (
    rule.effective_from >
    todayStr
  ) {
    return "upcoming";
  }

  if (
    rule.effective_to &&
    rule.effective_to <
      todayStr
  ) {
    return "expired";
  }

  return "current";
}

function getEffectivePhaseMeta(
  phase: EffectivePhase,
) {
  switch (phase) {
    case "current":
      return {
        label: "Currently Effective",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400",
        icon: CheckCircle2,
      };

    case "upcoming":
      return {
        label: "Upcoming",
        className:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400",
        icon: Clock,
      };

    case "expired":
    default:
      return {
        label: "Expired",
        className:
          "border-muted bg-muted/40 text-muted-foreground",
        icon: XCircle,
      };
  }
}

/* ============================================================================
   Mismatch Detection
============================================================================ */

function isMismatch(
  rule: InterestRule,
  phase: EffectivePhase,
): boolean {
  return (
    (rule.is_active &&
      phase === "expired") ||
    (!rule.is_active &&
      phase === "current")
  );
}

/* ============================================================================
   Smart Rate Search
============================================================================ */

function matchesRateQuery(
  rate: number,
  query: string,
): boolean {
  if (!query) {
    return false;
  }

  const range = query.match(
    /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/,
  );

  if (range) {
    const min = parseFloat(
      range[1],
    );

    const max = parseFloat(
      range[2],
    );

    return (
      rate >= Math.min(
        min,
        max,
      ) &&
      rate <= Math.max(
        min,
        max,
      )
    );
  }

  const comparison =
    query.match(
      /^(<=|>=|<|>)\s*(\d+(?:\.\d+)?)$/,
    );

  if (comparison) {
    const operator =
      comparison[1];

    const value = parseFloat(
      comparison[2],
    );

    switch (operator) {
      case ">":
        return rate > value;

      case ">=":
        return rate >= value;

      case "<":
        return rate < value;

      case "<=":
        return rate <= value;

      default:
        return false;
    }
  }

  return false;
}

/* ============================================================================
   Rule Matching
============================================================================ */

function ruleMatches(
  rule: InterestRule,
  filters: Filters,
  todayStr: string,
): boolean {
  const query =
    filters.search
      .trim()
      .toLowerCase();

  const phase =
    getEffectivePhase(
      rule,
      todayStr,
    );

  const textFields = [
    String(rule.rate),
    formatPercentage(
      rule.rate,
    ),
    RATE_PERIOD_LABELS[
      rule.rate_period
    ],
    CALCULATION_METHOD_LABELS[
      rule.calculation_method
    ],
    CALCULATION_BASIS_LABELS[
      rule.calculation_basis
    ],
    rule.legal_reference ??
      "",
    rule.description ??
      "",
    rule.effective_from,
    rule.effective_to ??
      "",
  ];

  const matchesSearch =
    !query ||
    textFields.some(
      (field) =>
        field
          .toLowerCase()
          .includes(query),
    ) ||
    matchesRateQuery(
      rule.rate,
      query,
    );

  const matchesStatus =
    filters.status === "ALL" ||
    (filters.status ===
      "ACTIVE" &&
      rule.is_active) ||
    (filters.status ===
      "INACTIVE" &&
      !rule.is_active);

  const matchesPeriod =
    filters.ratePeriod ===
      "ALL" ||
    rule.rate_period ===
      filters.ratePeriod;

  const matchesBasis =
    filters.calculationBasis ===
      "ALL" ||
    rule.calculation_basis ===
      filters.calculationBasis;

  const matchesMethod =
    filters.calculationMethod ===
      "ALL" ||
    rule.calculation_method ===
      filters.calculationMethod;

  const matchesPhase =
    filters.effectivePhase ===
      "ALL" ||
    phase ===
      filters.effectivePhase;

  const matchesMismatch =
    !filters.onlyMismatches ||
    isMismatch(
      rule,
      phase,
    );

  return (
    matchesSearch &&
    matchesStatus &&
    matchesPeriod &&
    matchesBasis &&
    matchesMethod &&
    matchesPhase &&
    matchesMismatch
  );
}

/* ============================================================================
   Component
============================================================================ */

function InterestRules() {
  const router =
    useRouter();

  /* ==========================================================================
     Backend
  ========================================================================== */

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useInterestRules();

  const activateMutation =
    useActivateInterestRule();

  const deactivateMutation =
    useDeactivateInterestRule();

  const rules =
    data?.data ?? [];

  /* ==========================================================================
     Search
  ========================================================================== */

  const [search, setSearch] =
    useState("");

  /* ==========================================================================
     Filters
  ========================================================================== */

  const [status, setStatus] =
    useState<StatusFilter>(
      "ALL",
    );

  const [
    ratePeriod,
    setRatePeriod,
  ] = useState<
    "ALL" | RatePeriod
  >("ALL");

  const [
    calculationBasis,
    setCalculationBasis,
  ] = useState<
    "ALL" | CalculationBasis
  >("ALL");

  const [
    calculationMethod,
    setCalculationMethod,
  ] = useState<
    "ALL" | CalculationMethod
  >("ALL");

  const [
    effectivePhase,
    setEffectivePhase,
  ] = useState<
    EffectivePhaseFilter
  >("ALL");

  const [
    onlyMismatches,
    setOnlyMismatches,
  ] = useState(false);

  /* ==========================================================================
     Action State
  ========================================================================== */

  const [
    actionLoadingId,
    setActionLoadingId,
  ] = useState<string | null>(
    null,
  );

  /* ==========================================================================
     Today
  ========================================================================== */

  const todayStr =
    useMemo(
      () =>
        new Date()
          .toISOString()
          .slice(0, 10),
      [],
    );

  /* ==========================================================================
     Navigation
  ========================================================================== */

  const openCreate =
    () => {
      router.push(
        "/office/dashboard/revenue-managements/interest-rules/create",
      );
    };

  const openView = (
    rule: InterestRule,
  ) => {
    router.push(
      `/office/dashboard/revenue-managements/interest-rules/${rule.id}`,
    );
  };

  const openEdit = (
    rule: InterestRule,
  ) => {
    router.push(
      `/office/dashboard/revenue-managements/interest-rules/${rule.id}/edit`,
    );
  };

  /* ==========================================================================
     Filter Object
  ========================================================================== */

  const filters: Filters =
    useMemo(
      () => ({
        search,
        status,
        ratePeriod,
        calculationBasis,
        calculationMethod,
        effectivePhase,
        onlyMismatches,
      }),
      [
        search,
        status,
        ratePeriod,
        calculationBasis,
        calculationMethod,
        effectivePhase,
        onlyMismatches,
      ],
    );

  /* ==========================================================================
     Active Filters
  ========================================================================== */

  const hasActiveFilters =
    search.trim() !== "" ||
    status !== "ALL" ||
    ratePeriod !== "ALL" ||
    calculationBasis !==
      "ALL" ||
    calculationMethod !==
      "ALL" ||
    effectivePhase !==
      "ALL" ||
    onlyMismatches;

  const activeFilterCount =
    [
      search.trim() !== "",
      status !== "ALL",
      ratePeriod !== "ALL",
      calculationBasis !==
        "ALL",
      calculationMethod !==
        "ALL",
      effectivePhase !==
        "ALL",
      onlyMismatches,
    ].filter(Boolean)
      .length;

  const clearFilters =
    () => {
      setSearch("");
      setStatus("ALL");
      setRatePeriod("ALL");
      setCalculationBasis(
        "ALL",
      );
      setCalculationMethod(
        "ALL",
      );
      setEffectivePhase(
        "ALL",
      );
      setOnlyMismatches(false);
    };

  /* ==========================================================================
     Statistics
  ========================================================================== */

  const statistics =
    useMemo(() => {
      const active =
        rules.filter(
          (rule) =>
            rule.is_active,
        ).length;

      const inactive =
        rules.length -
        active;

      const annual =
        rules.filter(
          (rule) =>
            rule.rate_period ===
            "YEAR",
        ).length;

      const mismatches =
        rules.filter(
          (rule) =>
            isMismatch(
              rule,
              getEffectivePhase(
                rule,
                todayStr,
              ),
            ),
        ).length;

      return {
        total: rules.length,
        active,
        inactive,
        annual,
        mismatches,
      };
    }, [
      rules,
      todayStr,
    ]);

  /* ==========================================================================
     Filtering
  ========================================================================== */

  const filteredRules =
    useMemo(
      () =>
        rules.filter(
          (rule) =>
            ruleMatches(
              rule,
              filters,
              todayStr,
            ),
        ),
      [
        rules,
        filters,
        todayStr,
      ],
    );

  /* ==========================================================================
     Faceted Counts
  ========================================================================== */

  const statusCounts =
    useMemo(() => {
      const base =
        rules.filter(
          (rule) =>
            ruleMatches(
              rule,
              {
                ...filters,
                status: "ALL",
              },
              todayStr,
            ),
        );

      return {
        ALL: base.length,
        ACTIVE: base.filter(
          (rule) =>
            rule.is_active,
        ).length,
        INACTIVE:
          base.filter(
            (rule) =>
              !rule.is_active,
          ).length,
      };
    }, [
      rules,
      filters,
      todayStr,
    ]);

  const ratePeriodCounts =
    useMemo(() => {
      const base =
        rules.filter(
          (rule) =>
            ruleMatches(
              rule,
              {
                ...filters,
                ratePeriod: "ALL",
              },
              todayStr,
            ),
        );

      return {
        ALL: base.length,
        YEAR: base.filter(
          (rule) =>
            rule.rate_period ===
            "YEAR",
        ).length,
        MONTH: base.filter(
          (rule) =>
            rule.rate_period ===
            "MONTH",
        ).length,
        DAY: base.filter(
          (rule) =>
            rule.rate_period ===
            "DAY",
        ).length,
      };
    }, [
      rules,
      filters,
      todayStr,
    ]);

  const calculationMethodCounts =
    useMemo(() => {
      const base =
        rules.filter(
          (rule) =>
            ruleMatches(
              rule,
              {
                ...filters,
                calculationMethod:
                  "ALL",
              },
              todayStr,
            ),
        );

      return {
        ALL: base.length,
        SIMPLE:
          base.filter(
            (rule) =>
              rule.calculation_method ===
              "SIMPLE",
          ).length,
        COMPOUND:
          base.filter(
            (rule) =>
              rule.calculation_method ===
              "COMPOUND",
          ).length,
      };
    }, [
      rules,
      filters,
      todayStr,
    ]);

  const calculationBasisCounts =
    useMemo(() => {
      const base =
        rules.filter(
          (rule) =>
            ruleMatches(
              rule,
              {
                ...filters,
                calculationBasis:
                  "ALL",
              },
              todayStr,
            ),
        );

      return {
        ALL: base.length,
        PRINCIPAL:
          base.filter(
            (rule) =>
              rule.calculation_basis ===
              "PRINCIPAL",
          ).length,
        OUTSTANDING:
          base.filter(
            (rule) =>
              rule.calculation_basis ===
              "OUTSTANDING",
          ).length,
      };
    }, [
      rules,
      filters,
      todayStr,
    ]);

  const effectivePhaseCounts =
    useMemo(() => {
      const base =
        rules.filter(
          (rule) =>
            ruleMatches(
              rule,
              {
                ...filters,
                effectivePhase:
                  "ALL",
              },
              todayStr,
            ),
        );

      return {
        ALL: base.length,
        current:
          base.filter(
            (rule) =>
              getEffectivePhase(
                rule,
                todayStr,
              ) === "current",
          ).length,
        upcoming:
          base.filter(
            (rule) =>
              getEffectivePhase(
                rule,
                todayStr,
              ) === "upcoming",
          ).length,
        expired:
          base.filter(
            (rule) =>
              getEffectivePhase(
                rule,
                todayStr,
              ) === "expired",
          ).length,
      };
    }, [
      rules,
      filters,
      todayStr,
    ]);

  /* ==========================================================================
     Quick Presets
  ========================================================================== */

  const applyCurrent =
    () => {
      setEffectivePhase(
        "current",
      );
      setOnlyMismatches(
        false,
      );
    };

  const applyUpcoming =
    () => {
      setEffectivePhase(
        "upcoming",
      );
      setOnlyMismatches(
        false,
      );
    };

  const applyExpired =
    () => {
      setEffectivePhase(
        "expired",
      );
      setOnlyMismatches(
        false,
      );
    };

  const applyMismatch =
    () => {
      setEffectivePhase(
        "ALL",
      );
      setOnlyMismatches(
        true,
      );
    };

  /* ==========================================================================
     Activate / Deactivate
  ========================================================================== */

  const toggleStatus =
    async (
      rule: InterestRule,
    ) => {
      if (
        actionLoadingId
      ) {
        return;
      }

      try {
        setActionLoadingId(
          rule.id,
        );

        if (
          rule.is_active
        ) {
          await deactivateMutation.mutateAsync(
            rule.id,
          );
        } else {
          await activateMutation.mutateAsync(
            rule.id,
          );
        }
      } finally {
        setActionLoadingId(
          null,
        );
      }
    };

  const actionLoading =
    (
      id: string,
    ) =>
      actionLoadingId ===
      id;

  /* ==========================================================================
     Loading
  ========================================================================== */

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">

        <Banner
          description="Manage legally applicable interest policies used by the revenue calculation engine for overdue obligations."
          badge={
            <IconBadge
              className="gap-2 rounded-full bg-black/20 p-3 text-xs text-white"
              icon={
                <Landmark className="h-4 w-4" />
              }
            >
              Interest Rules
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
        />

        <div className="flex min-h-[320px] items-center justify-center rounded-xl border bg-card">

          <div className="flex flex-col items-center gap-3 text-center">

            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />

            <p className="font-medium">
              Loading interest rules...
            </p>

            <p className="text-sm text-muted-foreground">
              Retrieving legally configured interest policies.
            </p>

          </div>

        </div>

      </div>
    );
  }

  /* ==========================================================================
     Error
  ========================================================================== */

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">

        <Banner
          description="Manage legally applicable interest policies used by the revenue calculation engine for overdue obligations."
          badge={
            <IconBadge
              className="gap-2 rounded-full bg-black/20 p-3 text-xs text-white"
              icon={
                <Landmark className="h-4 w-4" />
              }
            >
              Interest Rules
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
              onClick={
                openCreate
              }
              className="h-10 px-4 shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Interest Rule
            </Button>
          }
        />

        <div className="flex min-h-[320px] items-center justify-center rounded-xl border bg-card">

          <div className="flex max-w-md flex-col items-center text-center">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">

              <AlertTriangle className="h-6 w-6 text-muted-foreground" />

            </div>

            <p className="mt-4 font-medium">
              Unable to load interest rules
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              The interest rule configuration could not be retrieved from the server.
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 gap-2"
              onClick={() =>
                refetch()
              }
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Try again
            </Button>

          </div>

        </div>

      </div>
    );
  }

  /* ==========================================================================
     Render
  ========================================================================== */

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* ======================================================================
          HEADER
      ====================================================================== */}

      <Banner
        description="Manage legally applicable interest policies used by the revenue calculation engine for overdue obligations."
        badge={
          <IconBadge
            className="gap-2 rounded-full bg-black/20 p-3 text-xs text-white"
            icon={
              <Landmark className="h-4 w-4" />
            }
          >
            Interest Rules
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
            onClick={
              openCreate
            }
            className="h-10 px-4 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Interest Rule
          </Button>
        }
      />

      {/* ======================================================================
          SUMMARY
      ====================================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl border bg-card p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Rules
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                {statistics.total}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <ShieldCheck className="h-5 w-5" />
            </div>

          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Historical and current configurations
          </p>

        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                {statistics.active}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <CheckCircle2 className="h-5 w-5" />
            </div>

          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Currently enabled configurations
          </p>

        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Inactive
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                {statistics.inactive}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <XCircle className="h-5 w-5" />
            </div>

          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Retained historical configurations
          </p>

        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Needs Attention
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                {statistics.mismatches}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <AlertTriangle className="h-5 w-5" />
            </div>

          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Active state conflicts with date
          </p>

        </div>

      </div>

      {/* ======================================================================
          TOOLBAR
      ====================================================================== */}

      <div className="rounded-xl border bg-card p-3 shadow-sm">

        <Toolbar
          search={
            <div className="relative w-full">

              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <SearchInput
                placeholder="Search rate, legal reference, method...  (e.g. >20 or 20-30)"
                value={
                  search
                }
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                className="pl-9"
              />

            </div>
          }
          right={
            <div className="flex w-full items-center justify-end gap-2">

              {/* ============================================================
                  FILTER SHEET
              ============================================================ */}

              <Sheet>

                <SheetTrigger
                  asChild
                >

                  <Button
                    type="button"
                    variant={
                      hasActiveFilters
                        ? "default"
                        : "outline"
                    }
                    className="h-9 gap-2"
                  >

                    <Filter className="h-4 w-4" />

                    Filters

                    {activeFilterCount >
                      0 && (
                      <Badge
                        variant={
                          hasActiveFilters
                            ? "secondary"
                            : "outline"
                        }
                        className="ml-0.5 h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]"
                      >
                        {
                          activeFilterCount
                        }
                      </Badge>
                    )}

                  </Button>

                </SheetTrigger>

                <SheetContent
                  side="right"
                  className="flex w-full flex-col sm:max-w-md px-4"
                >

                  <SheetHeader className="border-b pb-5">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-24 items-center justify-center rounded-lg bg-muted">

                        <Filter className="h-5 w-5" />

                      </div>

                      <div>

                        <SheetTitle>
                          Filter interest rules
                        </SheetTitle>

                        <SheetDescription>
                          Narrow the configuration list by status, effective period, rate structure, and calculation method.
                        </SheetDescription>

                      </div>

                    </div>

                  </SheetHeader>

                  <div className="flex-1 space-y-6 overflow-y-auto py-6">

                    {/* ======================================================
                        STATUS
                    ====================================================== */}

                    <div className="space-y-2">

                      <div>

                        <p className="text-sm font-medium">
                          Status
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Administrative activation state
                        </p>

                      </div>

                      <Select
                        value={
                          status
                        }
                        onValueChange={(
                          value,
                        ) =>
                          setStatus(
                            value as StatusFilter,
                          )
                        }
                      >

                        <SelectTrigger className="h-10 w-full py-5">

                          <SelectValue />

                        </SelectTrigger>

                        <SelectContent>

                          <SelectItem value="ALL">
                            All statuses (
                            {
                              statusCounts.ALL
                            }
                            )
                          </SelectItem>

                          <SelectItem value="ACTIVE">
                            Active (
                            {
                              statusCounts.ACTIVE
                            }
                            )
                          </SelectItem>

                          <SelectItem value="INACTIVE">
                            Inactive (
                            {
                              statusCounts.INACTIVE
                            }
                            )
                          </SelectItem>

                        </SelectContent>

                      </Select>

                    </div>

                    {/* ======================================================
                        EFFECTIVE PHASE
                    ====================================================== */}

                    <div className="space-y-2">

                      <div>

                        <p className="text-sm font-medium">
                          Effective phase
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Determine where the rule sits in its legal date window.
                        </p>

                      </div>

                      <Select
                        value={
                          effectivePhase
                        }
                        onValueChange={(
                          value,
                        ) =>
                          setEffectivePhase(
                            value as EffectivePhaseFilter,
                          )
                        }
                      >

                        <SelectTrigger className="h-10 w-full py-5">

                          <SelectValue />

                        </SelectTrigger>

                        <SelectContent>

                          <SelectItem value="ALL">
                            All phases (
                            {
                              effectivePhaseCounts.ALL
                            }
                            )
                          </SelectItem>

                          <SelectItem value="current">
                            Currently effective (
                            {
                              effectivePhaseCounts.current
                            }
                            )
                          </SelectItem>

                          <SelectItem value="upcoming">
                            Upcoming (
                            {
                              effectivePhaseCounts.upcoming
                            }
                            )
                          </SelectItem>

                          <SelectItem value="expired">
                            Expired (
                            {
                              effectivePhaseCounts.expired
                            }
                            )
                          </SelectItem>

                        </SelectContent>

                      </Select>

                    </div>

                    {/* ======================================================
                        RATE PERIOD
                    ====================================================== */}

                    <div className="space-y-2">

                      <div>

                        <p className="text-sm font-medium">
                          Rate period
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Frequency at which the configured percentage applies.
                        </p>

                      </div>

                      <Select
                        value={
                          ratePeriod
                        }
                        onValueChange={(
                          value,
                        ) =>
                          setRatePeriod(
                            value as
                              | "ALL"
                              | RatePeriod,
                          )
                        }
                      >

                        <SelectTrigger className="h-10 w-full py-5">

                          <SelectValue />

                        </SelectTrigger>

                        <SelectContent>

                          <SelectItem value="ALL">
                            All periods (
                            {
                              ratePeriodCounts.ALL
                            }
                            )
                          </SelectItem>

                          <SelectItem value="YEAR">
                            Annual (
                            {
                              ratePeriodCounts.YEAR
                            }
                            )
                          </SelectItem>

                          <SelectItem value="MONTH">
                            Monthly (
                            {
                              ratePeriodCounts.MONTH
                            }
                            )
                          </SelectItem>

                          <SelectItem value="DAY">
                            Daily (
                            {
                              ratePeriodCounts.DAY
                            }
                            )
                          </SelectItem>

                        </SelectContent>

                      </Select>

                    </div>

                    {/* ======================================================
                        CALCULATION METHOD
                    ====================================================== */}

                    <div className="space-y-2">

                      <div>

                        <p className="text-sm font-medium">
                          Calculation method
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Interest accumulation method configured for the rule.
                        </p>

                      </div>

                      <Select
                        value={
                          calculationMethod
                        }
                        onValueChange={(
                          value,
                        ) =>
                          setCalculationMethod(
                            value as
                              | "ALL"
                              | CalculationMethod,
                          )
                        }
                      >

                        <SelectTrigger className="h-10 w-full py-5">

                          <SelectValue />

                        </SelectTrigger>

                        <SelectContent>

                          <SelectItem value="ALL">
                            All methods (
                            {
                              calculationMethodCounts.ALL
                            }
                            )
                          </SelectItem>

                          <SelectItem value="SIMPLE">
                            Simple Interest (
                            {
                              calculationMethodCounts.SIMPLE
                            }
                            )
                          </SelectItem>

                          <SelectItem value="COMPOUND">
                            Compound Interest (
                            {
                              calculationMethodCounts.COMPOUND
                            }
                            )
                          </SelectItem>

                        </SelectContent>

                      </Select>

                    </div>

                    {/* ======================================================
                        CALCULATION BASIS
                    ====================================================== */}

                    <div className="space-y-2">

                      <div>

                        <p className="text-sm font-medium">
                          Calculation basis
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Amount against which the interest rule is applied.
                        </p>

                      </div>

                      <Select
                        value={
                          calculationBasis
                        }
                        onValueChange={(
                          value,
                        ) =>
                          setCalculationBasis(
                            value as
                              | "ALL"
                              | CalculationBasis,
                          )
                        }
                      >

                        <SelectTrigger className="h-10 w-full py-5">

                          <SelectValue />

                        </SelectTrigger>

                        <SelectContent>

                          <SelectItem value="ALL">
                            All bases (
                            {
                              calculationBasisCounts.ALL
                            }
                            )
                          </SelectItem>

                          <SelectItem value="PRINCIPAL">
                            Principal (
                            {
                              calculationBasisCounts.PRINCIPAL
                            }
                            )
                          </SelectItem>

                          <SelectItem value="OUTSTANDING">
                            Outstanding Amount (
                            {
                              calculationBasisCounts.OUTSTANDING
                            }
                            )
                          </SelectItem>

                        </SelectContent>

                      </Select>

                    </div>

                    {/* ======================================================
                        NEEDS ATTENTION
                    ====================================================== */}

                    <div className="rounded-xl border bg-muted/30 p-4">

                      <div className="flex items-start gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">

                          <AlertTriangle className="h-4 w-4" />

                        </div>

                        <div className="min-w-0 flex-1">

                          <p className="text-sm font-medium">
                            Configuration attention
                          </p>

                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            Show rules whose active flag conflicts with their effective date window.
                          </p>

                          <Button
                            type="button"
                            variant={
                              onlyMismatches
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            className="mt-3 h-8"
                            onClick={() =>
                              setOnlyMismatches(
                                !onlyMismatches,
                              )
                            }
                          >
                            {onlyMismatches
                              ? "Showing attention items"
                              : "Show attention items"}

                            {statistics.mismatches >
                              0 && (
                              <span className="ml-1.5 tabular-nums">
                                ({statistics.mismatches})
                              </span>
                            )}
                          </Button>

                        </div>

                      </div>

                    </div>

                    {/* ======================================================
                        ACTIVE FILTER SUMMARY
                    ====================================================== */}

                    {hasActiveFilters && (
                      <div className="space-y-3">

                        <div className="flex items-center justify-between">

                          <p className="text-sm font-medium">
                            Active filters
                          </p>

                          <span className="text-xs text-muted-foreground">
                            {
                              activeFilterCount
                            }{" "}
                            applied
                          </span>

                        </div>

                        <div className="flex flex-wrap gap-2">

                          {status !==
                            "ALL" && (
                            <Badge variant="secondary">
                              Status:{" "}
                              {status ===
                              "ACTIVE"
                                ? "Active"
                                : "Inactive"}
                            </Badge>
                          )}

                          {effectivePhase !==
                            "ALL" && (
                            <Badge variant="secondary">
                              Phase:{" "}
                              {
                                EFFECTIVE_PHASE_LABELS[
                                  effectivePhase
                                ]
                              }
                            </Badge>
                          )}

                          {ratePeriod !==
                            "ALL" && (
                            <Badge variant="secondary">
                              Period:{" "}
                              {
                                RATE_PERIOD_LABELS[
                                  ratePeriod
                                ]
                              }
                            </Badge>
                          )}

                          {calculationMethod !==
                            "ALL" && (
                            <Badge variant="secondary">
                              Method:{" "}
                              {
                                CALCULATION_METHOD_LABELS[
                                  calculationMethod
                                ]
                              }
                            </Badge>
                          )}

                          {calculationBasis !==
                            "ALL" && (
                            <Badge variant="secondary">
                              Basis:{" "}
                              {
                                CALCULATION_BASIS_LABELS[
                                  calculationBasis
                                ]
                              }
                            </Badge>
                          )}

                          {onlyMismatches && (
                            <Badge variant="secondary">
                              Needs attention
                            </Badge>
                          )}

                          {search.trim() !==
                            "" && (
                            <Badge
                              variant="secondary"
                              className="max-w-full"
                            >
                              Search:{" "}
                              <span className="max-w-[180px] truncate">
                                {
                                  search.trim()
                                }
                              </span>
                            </Badge>
                          )}

                        </div>

                      </div>
                    )}

                  </div>

                  <SheetFooter className="border-t pt-4">

                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={
                        clearFilters
                      }
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset filters
                    </Button>

                    <SheetClose asChild>

                      <Button
                        type="button"
                        className="gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Apply filters
                      </Button>

                    </SheetClose>

                  </SheetFooter>

                </SheetContent>

              </Sheet>

            </div>
          }
        />

        {/* ==================================================================
            ACTIVE FILTER STRIP
        ================================================================== */}

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">

            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">

              <Filter className="h-3.5 w-3.5" />

              <span>
                {activeFilterCount}{" "}
                {activeFilterCount ===
                1
                  ? "filter"
                  : "filters"}{" "}
                applied
              </span>

            </div>

            {status !==
              "ALL" && (
              <Badge variant="secondary">
                Status:{" "}
                {status ===
                "ACTIVE"
                  ? "Active"
                  : "Inactive"}
              </Badge>
            )}

            {effectivePhase !==
              "ALL" && (
              <Badge variant="secondary">
                Phase:{" "}
                {
                  EFFECTIVE_PHASE_LABELS[
                    effectivePhase
                  ]
                }
              </Badge>
            )}

            {ratePeriod !==
              "ALL" && (
              <Badge variant="secondary">
                Period:{" "}
                {
                  RATE_PERIOD_LABELS[
                    ratePeriod
                  ]
                }
              </Badge>
            )}

            {calculationMethod !==
              "ALL" && (
              <Badge variant="secondary">
                Method:{" "}
                {
                  CALCULATION_METHOD_LABELS[
                    calculationMethod
                  ]
                }
              </Badge>
            )}

            {calculationBasis !==
              "ALL" && (
              <Badge variant="secondary">
                Basis:{" "}
                {
                  CALCULATION_BASIS_LABELS[
                    calculationBasis
                  ]
}
                </Badge>
            )}

            {onlyMismatches && (
              <Badge
                variant="secondary"
                className="gap-1"
              >
                <AlertTriangle className="h-3 w-3" />
                Needs attention
              </Badge>
            )}

            {search.trim() !==
              "" && (
              <Badge
                variant="secondary"
                className="max-w-full"
              >
                Search:{" "}
                <span className="max-w-[180px] truncate">
                  {
                    search.trim()
                  }
                </span>
              </Badge>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={
                clearFilters
              }
            >
              <RotateCcw className="h-3 w-3" />
              Clear
            </Button>

          </div>
        )}

      </div>

      {/* ======================================================================
          TABLE
      ====================================================================== */}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">

        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <h2 className="font-semibold">
                Interest Rules
              </h2>

              <Badge
                variant="secondary"
                className="tabular-nums"
              >
                {
                  filteredRules.length
                }
              </Badge>

              {isFetching &&
                !isLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}

            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Legally configured interest policies and their effective periods.
            </p>

          </div>

          <div className="flex items-center gap-2">

            {hasActiveFilters && (
              <span className="text-xs text-muted-foreground">
                Filtered from{" "}
                {rules.length}
              </span>
            )}

          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1050px] text-sm">

            <thead className="border-b bg-muted/40">

              <tr className="text-left">

                <th className="px-5 py-3 font-medium">
                  Interest Rate
                </th>

                <th className="px-5 py-3 font-medium">
                  Method
                </th>

                <th className="px-5 py-3 font-medium">
                  Basis
                </th>

                <th className="px-5 py-3 font-medium">
                  Effective Period
                </th>

                <th className="px-5 py-3 font-medium">
                  Legal Reference
                </th>

                <th className="px-5 py-3 font-medium">
                  Status
                </th>

                <th className="px-5 py-3 text-right font-medium">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y">

              {filteredRules.length ===
              0 ? (
                <tr>

                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center"
                  >

                    <div className="mx-auto flex max-w-md flex-col items-center">

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">

                        <Percent className="h-6 w-6 text-muted-foreground" />

                      </div>

                      <p className="mt-4 font-medium">
                        No interest rules found
                      </p>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        No rules match the current search and filter criteria.
                      </p>

                      {hasActiveFilters && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-4 gap-2"
                          onClick={
                            clearFilters
                          }
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Clear filters
                        </Button>
                      )}

                    </div>

                  </td>

                </tr>
              ) : (
                filteredRules.map(
                  (rule) => {

                    const statusInfo =
                      getRuleStatus(
                        rule,
                      );

                    const StatusIcon =
                      statusInfo.icon;

                    const phase =
                      getEffectivePhase(
                        rule,
                        todayStr,
                      );

                    const phaseInfo =
                      getEffectivePhaseMeta(
                        phase,
                      );

                    const PhaseIcon =
                      phaseInfo.icon;

                    const mismatch =
                      isMismatch(
                        rule,
                        phase,
                      );

                    const rowLoading =
                      actionLoading(
                        rule.id,
                      );

                    return (
                      <tr
                        key={
                          rule.id
                        }
                        className="group transition-colors hover:bg-muted/30"
                      >

                        {/* ==================================================
                            RATE
                        ================================================== */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-background">

                              <Percent className="h-4 w-4" />

                            </div>

                            <div className="min-w-0">

                              <p className="font-semibold tabular-nums">
                                {
                                  formatPercentage(
                                    rule.rate,
                                  )
                                }
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {
                                  RATE_PERIOD_LABELS[
                                    rule.rate_period
                                  ]
                                }{" "}
                                rate
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* ==================================================
                            METHOD
                        ================================================== */}

                        <td className="px-5 py-4">

                          <Badge variant="outline">
                            {
                              CALCULATION_METHOD_LABELS[
                                rule.calculation_method
                              ]
                            }
                          </Badge>

                        </td>

                        {/* ==================================================
                            BASIS
                        ================================================== */}

                        <td className="px-5 py-4">

                          <Badge variant="outline">
                            {
                              CALCULATION_BASIS_LABELS[
                                rule.calculation_basis
                              ]
                            }
                          </Badge>

                        </td>

                        {/* ==================================================
                            EFFECTIVE PERIOD
                        ================================================== */}

                        <td className="px-5 py-4">

                          <div className="flex items-start gap-2">

                            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                            <div>

                              <p className="font-medium">
                                {
                                  formatDate(
                                    rule.effective_from,
                                  )
                                }
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {rule.effective_to
                                  ? `to ${formatDate(
                                      rule.effective_to,
                                    )}`
                                  : "No end date"}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* ==================================================
                            LEGAL REFERENCE
                        ================================================== */}

                        <td className="max-w-[280px] px-5 py-4">

                          <div className="flex items-start gap-2">

                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                            <span
                              title={
                                rule.legal_reference ??
                                undefined
                              }
                              className="line-clamp-2 text-xs leading-5 text-muted-foreground"
                            >
                              {
                                rule.legal_reference ??
                                "No legal reference specified"
                              }
                            </span>

                          </div>

                        </td>

                        {/* ==================================================
                            STATUS
                        ================================================== */}

                        <td className="px-5 py-4">

                          <div className="flex flex-col items-start gap-1.5">

                            <Badge
                              variant="outline"
                              className={
                                statusInfo.className
                              }
                            >

                              <StatusIcon className="mr-1 h-3.5 w-3.5" />

                              {
                                statusInfo.label
                              }

                            </Badge>

                            {mismatch && (
                              <Badge
                                variant="outline"
                                className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400"
                              >

                                <AlertTriangle className="mr-1 h-3 w-3" />

                                Needs attention

                              </Badge>
                            )}

                          </div>

                        </td>

                        {/* ==================================================
                            ACTIONS
                        ================================================== */}

                        <td className="px-5 py-4 text-right">

                          <DropdownMenu>

                            <DropdownMenuTrigger
                              asChild
                            >

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={
                                  rowLoading
                                }
                                title="Open actions"
                              >

                                {rowLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}

                                <span className="sr-only">
                                  Open actions
                                </span>

                              </Button>

                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="w-48"
                            >

                              <DropdownMenuItem
                                onClick={() =>
                                  openView(
                                    rule,
                                  )
                                }
                                disabled={
                                  rowLoading
                                }
                              >

                                <Eye className="mr-2 h-4 w-4" />

                                View details

                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  openEdit(
                                    rule,
                                  )
                                }
                                disabled={
                                  rowLoading
                                }
                              >

                                <Edit3 className="mr-2 h-4 w-4" />

                                Edit rule

                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() =>
                                  toggleStatus(
                                    rule,
                                  )
                                }
                                disabled={
                                  rowLoading
                                }
                              >

                                {rowLoading ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Power className="mr-2 h-4 w-4" />
                                )}

                                {rule.is_active
                                  ? "Deactivate"
                                  : "Activate"}

                              </DropdownMenuItem>

                            </DropdownMenuContent>

                          </DropdownMenu>

                        </td>

                      </tr>
                    );
                  },
                )
              )}

            </tbody>

          </table>

        </div>

        {/* ====================================================================
            FOOTER
        ==================================================================== */}

        <div className="flex flex-col gap-2 border-t px-5 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">

          <span>

            Showing{" "}

            <span className="font-medium text-foreground">
              {
                filteredRules.length
              }
            </span>{" "}

            of{" "}

            <span className="font-medium text-foreground">
              {
                rules.length
              }
            </span>{" "}

            rules

          </span>

          <span>
            Historical interest configurations are retained for financial auditability.
          </span>

        </div>

      </div>

    </div>
  );
}

export default InterestRules;