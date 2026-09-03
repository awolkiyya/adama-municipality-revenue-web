"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CalendarDays,
  CheckCircle2,
  Edit3,
  Eye,
  FileText,
  Landmark,
  MoreHorizontal,
  Percent,
  Plus,
  Power,
  ShieldCheck,
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

import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { Toolbar } from "@/components/commen/Toolbar";
import { SearchInput } from "@/components/input/SearchInput";

/* ============================================================================
   Types
============================================================================ */

type RatePeriod = "YEAR" | "MONTH" | "DAY";

type CalculationMethod = "SIMPLE" | "COMPOUND";

type CalculationBasis = "PRINCIPAL" | "OUTSTANDING";

type InterestRule = {
  id: string;

  rate: number;

  rate_period: RatePeriod;

  calculation_method: CalculationMethod;

  calculation_basis: CalculationBasis;

  effective_from: string;

  effective_to: string | null;

  is_active: boolean;

  legal_reference: string | null;

  description: string | null;

  created_at: string;

  updated_at: string;
};

/* ============================================================================
   Labels
============================================================================ */

const RATE_PERIOD_LABELS: Record<RatePeriod, string> = {
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

/* ============================================================================
   Mock Data
============================================================================ */

const MOCK_INTEREST_RULES: InterestRule[] = [
  {
    id: "ir-001",
    rate: 24.725,
    rate_period: "YEAR",
    calculation_method: "SIMPLE",
    calculation_basis: "PRINCIPAL",
    effective_from: "2025-07-08",
    effective_to: "2026-07-07",
    is_active: false,
    legal_reference:
      "Revenue Regulation 2025, Article 17",
    description:
      "Previous legally applicable annual interest rate for overdue revenue obligations.",
    created_at: "2025-07-08",
    updated_at: "2026-07-07",
  },

  {
    id: "ir-002",
    rate: 24.725,
    rate_period: "YEAR",
    calculation_method: "SIMPLE",
    calculation_basis: "PRINCIPAL",
    effective_from: "2026-07-08",
    effective_to: "2027-07-07",
    is_active: true,
    legal_reference:
      "Revenue Regulation 2026, Article 18",
    description:
      "Legally applicable annual interest rate for overdue revenue obligations during the 2026 effective period.",
    created_at: "2026-07-08",
    updated_at: "2026-07-08",
  },

  {
    id: "ir-003",
    rate: 26,
    rate_period: "YEAR",
    calculation_method: "SIMPLE",
    calculation_basis: "OUTSTANDING",
    effective_from: "2027-07-08",
    effective_to: null,
    is_active: true,
    legal_reference:
      "Municipal Revenue Regulation 2027, Article 21",
    description:
      "Future interest policy applicable to outstanding overdue revenue obligations.",
    created_at: "2027-07-08",
    updated_at: "2027-07-08",
  },
];

/* ============================================================================
   Formatting
============================================================================ */

function formatPercentage(rate: number) {
  return `${rate
    .toFixed(4)
    .replace(/0+$/, "")
    .replace(/\.$/, "")}%`;
}

function formatDate(date: string | null) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

/* ============================================================================
   Status
============================================================================ */

function getRuleStatus(rule: InterestRule) {
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
   Component
============================================================================ */

function InterestRules() {
  const router = useRouter();

  const [rules, setRules] = useState<InterestRule[]>(
    MOCK_INTEREST_RULES,
  );

  const [search, setSearch] = useState("");

  const [status, setStatus] =
    useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [ratePeriod, setRatePeriod] =
    useState<"ALL" | RatePeriod>("ALL");

  const [calculationBasis, setCalculationBasis] =
    useState<"ALL" | CalculationBasis>("ALL");

  const [calculationMethod, setCalculationMethod] =
    useState<"ALL" | CalculationMethod>("ALL");

  /* ==========================================================================
     Navigation
  ========================================================================== */

  const openCreate = () => {
    router.push(
      "/office/dashboard/revenue-managements/interest-rules/create",
    );
  };

  const openView = (rule: InterestRule) => {
    router.push(
      `/office/dashboard/revenue-managements/interest-rules/${rule.id}`,
    );
  };

  const openEdit = (rule: InterestRule) => {
    router.push(
      `/office/dashboard/revenue-managements/interest-rules/${rule.id}/edit`,
    );
  };

  /* ==========================================================================
     Statistics
  ========================================================================== */

  const statistics = useMemo(() => {
    return {
      total: rules.length,

      active: rules.filter(
        (rule) => rule.is_active,
      ).length,

      inactive: rules.filter(
        (rule) => !rule.is_active,
      ).length,

      annual: rules.filter(
        (rule) => rule.rate_period === "YEAR",
      ).length,
    };
  }, [rules]);

  /* ==========================================================================
     Active Policy
  ========================================================================== */

  const activeRules = useMemo(() => {
    return rules.filter(
      (rule) => rule.is_active,
    );
  }, [rules]);

  /* ==========================================================================
     Filtering
  ========================================================================== */

  const filteredRules = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return rules.filter((rule) => {
      const matchesSearch =
        !query ||
        String(rule.rate)
          .toLowerCase()
          .includes(query) ||
        rule.legal_reference
          ?.toLowerCase()
          .includes(query) ||
        rule.description
          ?.toLowerCase()
          .includes(query) ||
        rule.effective_from
          .toLowerCase()
          .includes(query) ||
        rule.effective_to
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        status === "ALL" ||
        (status === "ACTIVE" &&
          rule.is_active) ||
        (status === "INACTIVE" &&
          !rule.is_active);

      const matchesPeriod =
        ratePeriod === "ALL" ||
        rule.rate_period === ratePeriod;

      const matchesBasis =
        calculationBasis === "ALL" ||
        rule.calculation_basis ===
          calculationBasis;

      const matchesMethod =
        calculationMethod === "ALL" ||
        rule.calculation_method ===
          calculationMethod;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPeriod &&
        matchesBasis &&
        matchesMethod
      );
    });
  }, [
    rules,
    search,
    status,
    ratePeriod,
    calculationBasis,
    calculationMethod,
  ]);

  /* ==========================================================================
     Activate / Deactivate
  ========================================================================== */

  const toggleStatus = (ruleId: string) => {
    setRules((current) =>
      current.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,

              is_active:
                !rule.is_active,

              updated_at:
                new Date()
                  .toISOString()
                  .slice(0, 10),
            }
          : rule,
      ),
    );
  };

  /* ==========================================================================
     Render
  ========================================================================== */

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* ================================================================
          HEADER
      ================================================================ */}

      <Banner
        description="Manage legally applicable interest policies used by the revenue calculation engine for overdue obligations."
        badge={
          <IconBadge
            className="gap-2 rounded-full bg-black/20 p-3 text-xs text-white"
            icon={
              <Landmark className="h-4 w-4" />
            }
          >
            Interest Rates
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
            onClick={openCreate}
            className="p-4"
          >
            <Plus className="mr-2 h-4 w-4" />

            Add Interest Rate
          </Button>
        }
      />

      {/* ================================================================
          SUMMARY
      ================================================================ */}

      <div className="grid gap-4 md:grid-cols-4">

        {/* Total */}

        <div className="rounded-xl border bg-card p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-muted-foreground">
                Total Rules
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {statistics.total}
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">

              <ShieldCheck className="h-5 w-5" />

            </div>

          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Historical and current policies
          </p>

        </div>

        {/* Active */}

        <div className="rounded-xl border bg-card p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-muted-foreground">
                Active
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {statistics.active}
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">

              <CheckCircle2 className="h-5 w-5" />

            </div>

          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Enabled financial policies
          </p>

        </div>

        {/* Inactive */}

        <div className="rounded-xl border bg-card p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-muted-foreground">
                Inactive
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight">
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

        {/* Annual */}

        <div className="rounded-xl border bg-card p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-muted-foreground">
                Annual Rules
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {statistics.annual}
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">

              <Percent className="h-5 w-5" />

            </div>

          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Policies using annual interest rates
          </p>

        </div>

      </div>

      {/* ================================================================
          ACTIVE POLICY NOTICE
      ================================================================ */}

      {activeRules.length > 0 && (

        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20">

          <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

          <div className="text-sm">

            <p className="font-medium">
              Interest policy configuration
            </p>

            <p className="mt-1 text-muted-foreground">
              Interest is a general financial policy.
              The calculation engine determines the
              applicable rule using the assessment or
              obligation date and the rule's effective
              period.
            </p>

          </div>

        </div>

      )}

      {/* ================================================================
          TOOLBAR
      ================================================================ */}

      <Toolbar
        search={
          <SearchInput
            placeholder="Search interest rates, legal references..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        }
        // filters={
        //   <div className="flex flex-wrap items-center gap-2">

        //     {/* Status */}

        //     <Select
        //       value={status}
        //       onValueChange={(value) =>
        //         setStatus(
        //           value as
        //             | "ALL"
        //             | "ACTIVE"
        //             | "INACTIVE",
        //         )
        //       }
        //     >
        //       <SelectTrigger className="w-[150px]">
        //         <SelectValue placeholder="Status" />
        //       </SelectTrigger>

        //       <SelectContent>
        //         <SelectItem value="ALL">
        //           All statuses
        //         </SelectItem>

        //         <SelectItem value="ACTIVE">
        //           Active
        //         </SelectItem>

        //         <SelectItem value="INACTIVE">
        //           Inactive
        //         </SelectItem>
        //       </SelectContent>
        //     </Select>

        //     {/* Rate Period */}

        //     <Select
        //       value={ratePeriod}
        //       onValueChange={(value) =>
        //         setRatePeriod(
        //           value as
        //             | "ALL"
        //             | RatePeriod,
        //         )
        //       }
        //     >
        //       <SelectTrigger className="w-[150px]">
        //         <SelectValue placeholder="Rate period" />
        //       </SelectTrigger>

        //       <SelectContent>
        //         <SelectItem value="ALL">
        //           All periods
        //         </SelectItem>

        //         <SelectItem value="YEAR">
        //           Annual
        //         </SelectItem>

        //         <SelectItem value="MONTH">
        //           Monthly
        //         </SelectItem>

        //         <SelectItem value="DAY">
        //           Daily
        //         </SelectItem>
        //       </SelectContent>
        //     </Select>

        //     {/* Calculation Method */}

        //     <Select
        //       value={calculationMethod}
        //       onValueChange={(value) =>
        //         setCalculationMethod(
        //           value as
        //             | "ALL"
        //             | CalculationMethod,
        //         )
        //       }
        //     >
        //       <SelectTrigger className="w-[180px]">
        //         <SelectValue placeholder="Method" />
        //       </SelectTrigger>

        //       <SelectContent>
        //         <SelectItem value="ALL">
        //           All methods
        //         </SelectItem>

        //         <SelectItem value="SIMPLE">
        //           Simple Interest
        //         </SelectItem>

        //         <SelectItem value="COMPOUND">
        //           Compound Interest
        //         </SelectItem>
        //       </SelectContent>
        //     </Select>

        //     {/* Calculation Basis */}

        //     <Select
        //       value={calculationBasis}
        //       onValueChange={(value) =>
        //         setCalculationBasis(
        //           value as
        //             | "ALL"
        //             | CalculationBasis,
        //         )
        //       }
        //     >
        //       <SelectTrigger className="w-[190px]">
        //         <SelectValue placeholder="Calculation basis" />
        //       </SelectTrigger>

        //       <SelectContent>
        //         <SelectItem value="ALL">
        //           All bases
        //         </SelectItem>

        //         <SelectItem value="PRINCIPAL">
        //           Principal
        //         </SelectItem>

        //         <SelectItem value="OUTSTANDING">
        //           Outstanding Amount
        //         </SelectItem>
        //       </SelectContent>
        //     </Select>

        //   </div>
        // }
      />



      {/* ================================================================
          TABLE
      ================================================================ */}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

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

              {filteredRules.length === 0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center"
                  >

                    <div className="flex flex-col items-center">

                      <Percent className="h-8 w-8 text-muted-foreground/50" />

                      <p className="mt-3 font-medium">
                        No interest rules found
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Try changing your filters or search term.
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                filteredRules.map((rule) => {

                  const statusInfo =
                    getRuleStatus(rule);

                  const StatusIcon =
                    statusInfo.icon;

                  return (

                    <tr
                      key={rule.id}
                      className="transition-colors hover:bg-muted/30"
                    >

                      {/* Interest Rate */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2">

                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">

                            <Percent className="h-4 w-4" />

                          </div>

                          <div>

                            <p className="font-semibold tabular-nums">
                              {formatPercentage(
                                rule.rate,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {
                                RATE_PERIOD_LABELS[
                                  rule.rate_period
                                ]
                              }
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* Calculation Method */}

                      <td className="px-5 py-4">

                        <Badge variant="outline">

                          {
                            CALCULATION_METHOD_LABELS[
                              rule.calculation_method
                            ]
                          }

                        </Badge>

                      </td>

                      {/* Basis */}

                      <td className="px-5 py-4">

                        <Badge variant="outline">

                          {
                            CALCULATION_BASIS_LABELS[
                              rule.calculation_basis
                            ]
                          }

                        </Badge>

                      </td>

                      {/* Effective Period */}

                      <td className="px-5 py-4">

                        <div className="flex items-start gap-2">

                          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                          <div>

                            <p className="font-medium">
                              {formatDate(
                                rule.effective_from,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              to{" "}
                              {formatDate(
                                rule.effective_to,
                              )}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* Legal Reference */}

                      <td className="max-w-[260px] px-5 py-4">

                        <div className="flex items-start gap-2">

                          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                          <span className="line-clamp-2 text-xs text-muted-foreground">
                            {rule.legal_reference ??
                              "No legal reference specified"}
                          </span>

                        </div>

                      </td>

                      {/* Status */}

                      <td className="px-5 py-4">

                        <Badge
                          variant="outline"
                          className={
                            statusInfo.className
                          }
                        >

                          <StatusIcon className="mr-1 h-3.5 w-3.5" />

                          {statusInfo.label}

                        </Badge>

                      </td>

                      {/* Actions */}

                      <td className="px-5 py-4 text-right">

                        <DropdownMenu>

                          <DropdownMenuTrigger
                            asChild
                          >

                            <Button
                              variant="ghost"
                              size="icon"
                            >

                              <MoreHorizontal className="h-4 w-4" />

                            </Button>

                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">

                            {/* View */}

                            <DropdownMenuItem
                              onClick={() =>
                                openView(rule)
                              }
                            >

                              <Eye className="mr-2 h-4 w-4" />

                              View details

                            </DropdownMenuItem>

                            {/* Edit */}

                            <DropdownMenuItem
                              onClick={() =>
                                openEdit(rule)
                              }
                            >

                              <Edit3 className="mr-2 h-4 w-4" />

                              Edit

                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Activate / Deactivate */}

                            <DropdownMenuItem
                              onClick={() =>
                                toggleStatus(
                                  rule.id,
                                )
                              }
                            >

                              <Power className="mr-2 h-4 w-4" />

                              {rule.is_active
                                ? "Deactivate"
                                : "Activate"}

                            </DropdownMenuItem>

                          </DropdownMenuContent>

                        </DropdownMenu>

                      </td>

                    </tr>

                  );
                })

              )}

            </tbody>

          </table>

        </div>

        {/* ==============================================================
            FOOTER
        ============================================================== */}

        <div className="flex flex-col gap-2 border-t px-5 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">

          <span>
            Showing {filteredRules.length} of{" "}
            {rules.length} rules
          </span>

          <span>
            Historical interest policies are retained for
            financial auditability.
          </span>

        </div>

      </div>

    </div>
  );
}

export default InterestRules;