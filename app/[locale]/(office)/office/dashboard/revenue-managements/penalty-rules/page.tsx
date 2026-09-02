"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Edit3,
  Filter,
  Loader2,
  Plus,
  Power,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type CalculationType =
  | "FIXED"
  | "PERCENTAGE"
  | "PROGRESSIVE";

type StartType =
  | "DUE_DATE"
  | "AGREEMENT_START"
  | "AFTER_GRACE_PERIOD"
  | "FISCAL_YEAR_START";

type PeriodUnit =
  | "DAY"
  | "MONTH"
  | "YEAR";

type CalculationBasis =
  | "PRINCIPAL"
  | "OUTSTANDING";

type RevenueService = {
  id: string;
  name: string;
};

type PenaltyRule = {
  id: string;

  /**
   * NULL = default policy
   * UUID = service-specific override
   */
  revenue_service_id: string | null;

  name: string;

  calculation_type: CalculationType;

  initial_rate: number | null;
  increment_rate: number | null;
  maximum_rate: number | null;

  start_type: StartType;

  grace_period_value: number;
  grace_period_unit: PeriodUnit;

  increment_period: PeriodUnit;

  calculation_basis: CalculationBasis;

  effective_from: string;
  effective_to: string | null;

  is_active: boolean;

  description: string | null;
  legal_reference: string | null;

  created_at?: string;
  updated_at?: string;

  revenue_service?: RevenueService | null;
};

/*
|--------------------------------------------------------------------------
| Form
|--------------------------------------------------------------------------
*/

type PenaltyForm = {
  revenue_service_id: string;

  name: string;

  calculation_type: CalculationType;

  initial_rate: string;
  increment_rate: string;
  maximum_rate: string;

  start_type: StartType;

  grace_period_value: string;
  grace_period_unit: PeriodUnit;

  increment_period: PeriodUnit;

  calculation_basis: CalculationBasis;

  effective_from: string;
  effective_to: string;

  is_active: boolean;

  legal_reference: string;
  description: string;
};

const EMPTY_FORM: PenaltyForm = {
  revenue_service_id: "DEFAULT",

  name: "",

  calculation_type: "PROGRESSIVE",

  initial_rate: "5",
  increment_rate: "2",
  maximum_rate: "25",

  start_type: "AFTER_GRACE_PERIOD",

  grace_period_value: "7",
  grace_period_unit: "MONTH",

  increment_period: "MONTH",

  calculation_basis: "PRINCIPAL",

  effective_from: new Date().toISOString().slice(0, 10),
  effective_to: "",

  is_active: true,

  legal_reference: "",
  description: "",
};

/*
|--------------------------------------------------------------------------
| Mock Services
|--------------------------------------------------------------------------
|
| Replace with your API query hook.
|
*/

const MOCK_SERVICES: RevenueService[] = [
  {
    id: "service-lizz",
    name: "Lizz",
  },
  {
    id: "service-business",
    name: "Business License",
  },
  {
    id: "service-market",
    name: "Market Service",
  },
  {
    id: "service-advertisement",
    name: "Advertisement",
  },
];

/*
|--------------------------------------------------------------------------
| Mock Rules
|--------------------------------------------------------------------------
*/

const MOCK_RULES: PenaltyRule[] = [
  {
    id: "penalty-default-2026",

    revenue_service_id: null,

    name: "Default Progressive Penalty",

    calculation_type: "PROGRESSIVE",

    initial_rate: 5,
    increment_rate: 2,
    maximum_rate: 25,

    start_type: "AFTER_GRACE_PERIOD",

    grace_period_value: 7,
    grace_period_unit: "MONTH",

    increment_period: "MONTH",

    calculation_basis: "PRINCIPAL",

    effective_from: "2026-07-08",
    effective_to: null,

    is_active: true,

    legal_reference: "Revenue Regulation 2026",

    description:
      "Default progressive penalty applied to revenue services after the applicable grace period.",
  },

  {
    id: "penalty-lizz-2026",

    revenue_service_id: "service-lizz",

    name: "Lizz Progressive Penalty",

    calculation_type: "PROGRESSIVE",

    initial_rate: 5,
    increment_rate: 2,
    maximum_rate: 25,

    start_type: "AGREEMENT_START",

    grace_period_value: 0,
    grace_period_unit: "MONTH",

    increment_period: "MONTH",

    calculation_basis: "PRINCIPAL",

    effective_from: "2026-07-08",
    effective_to: null,

    is_active: true,

    legal_reference: "Lizz Revenue Directive",

    description:
      "Special penalty policy for Lizz based on the agreement start date.",

    revenue_service: MOCK_SERVICES[0],
  },
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatRate(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value}%`;
}

function getServiceName(
  rule: PenaltyRule,
  services: RevenueService[]
) {
  if (!rule.revenue_service_id) {
    return "Default";
  }

  return (
    rule.revenue_service?.name ??
    services.find(
      (service) => service.id === rule.revenue_service_id
    )?.name ??
    "Unknown Service"
  );
}

function getStartLabel(startType: StartType) {
  switch (startType) {
    case "DUE_DATE":
      return "Due Date";

    case "AGREEMENT_START":
      return "Agreement Start";

    case "AFTER_GRACE_PERIOD":
      return "After Grace Period";

    case "FISCAL_YEAR_START":
      return "Fiscal Year Start";

    default:
      return startType;
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return "No end date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

function RevenuePenalties() {
  const [rules, setRules] =
    useState<PenaltyRule[]>(MOCK_RULES);

  const [services] =
    useState<RevenueService[]>(MOCK_SERVICES);

  /*
  |--------------------------------------------------------------------------
  | UI State
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [serviceFilter, setServiceFilter] =
    useState("ALL");

  const [page, setPage] = useState(1);

  const pageSize = 10;

  /*
  |--------------------------------------------------------------------------
  | Dialog
  |--------------------------------------------------------------------------
  */

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [editingRule, setEditingRule] =
    useState<PenaltyRule | null>(null);

  const [form, setForm] =
    useState<PenaltyForm>(EMPTY_FORM);

  const [saving, setSaving] =
    useState(false);

  const [actionId, setActionId] =
    useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Filter
  |--------------------------------------------------------------------------
  */

  const filteredRules = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return rules.filter((rule) => {
      const serviceName = getServiceName(
        rule,
        services
      );

      const matchesSearch =
        !normalizedSearch ||
        rule.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        serviceName
          .toLowerCase()
          .includes(normalizedSearch) ||
        rule.legal_reference
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          rule.is_active) ||
        (statusFilter === "INACTIVE" &&
          !rule.is_active);

      const matchesService =
        serviceFilter === "ALL" ||
        (serviceFilter === "DEFAULT" &&
          rule.revenue_service_id === null) ||
        rule.revenue_service_id === serviceFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesService
      );
    });
  }, [
    rules,
    search,
    statusFilter,
    serviceFilter,
    services,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRules.length / pageSize)
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const paginatedRules =
    filteredRules.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );

  /*
  |--------------------------------------------------------------------------
  | Stats
  |--------------------------------------------------------------------------
  */

  const activeCount = rules.filter(
    (rule) => rule.is_active
  ).length;

  const inactiveCount = rules.filter(
    (rule) => !rule.is_active
  ).length;

  const defaultCount = rules.filter(
    (rule) => rule.revenue_service_id === null
  ).length;

  const overrideCount = rules.filter(
    (rule) => rule.revenue_service_id !== null
  ).length;

  /*
  |--------------------------------------------------------------------------
  | Open Create
  |--------------------------------------------------------------------------
  */

  const openCreate = () => {
    setEditingRule(null);

    setForm({
      ...EMPTY_FORM,
      effective_from: new Date()
        .toISOString()
        .slice(0, 10),
    });

    setDialogOpen(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Open Edit
  |--------------------------------------------------------------------------
  */

  const openEdit = (
    rule: PenaltyRule
  ) => {
    setEditingRule(rule);

    setForm({
      revenue_service_id:
        rule.revenue_service_id ??
        "DEFAULT",

      name: rule.name,

      calculation_type:
        rule.calculation_type,

      initial_rate:
        rule.initial_rate?.toString() ??
        "",

      increment_rate:
        rule.increment_rate?.toString() ??
        "",

      maximum_rate:
        rule.maximum_rate?.toString() ??
        "",

      start_type:
        rule.start_type,

      grace_period_value:
        rule.grace_period_value.toString(),

      grace_period_unit:
        rule.grace_period_unit,

      increment_period:
        rule.increment_period,

      calculation_basis:
        rule.calculation_basis,

      effective_from:
        rule.effective_from,

      effective_to:
        rule.effective_to ?? "",

      is_active:
        rule.is_active,

      legal_reference:
        rule.legal_reference ?? "",

      description:
        rule.description ?? "",
    });

    setDialogOpen(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Save
  |--------------------------------------------------------------------------
  */

  const handleSave = async () => {
    if (!form.name.trim()) {
      return;
    }

    if (!form.effective_from) {
      return;
    }

    if (
      form.effective_to &&
      form.effective_to <
        form.effective_from
    ) {
      return;
    }

    setSaving(true);

    try {
      /*
       * Replace this section with your mutation hook.
       *
       * Example:
       *
       * await createPenaltyRule({
       *   revenue_service_id:
       *     form.revenue_service_id === "DEFAULT"
       *       ? null
       *       : form.revenue_service_id,
       *
       *   name: form.name.trim(),
       *
       *   calculation_type:
       *     form.calculation_type,
       *
       *   initial_rate:
       *     form.initial_rate
       *       ? Number(form.initial_rate)
       *       : null,
       *
       *   increment_rate:
       *     form.increment_rate
       *       ? Number(form.increment_rate)
       *       : null,
       *
       *   maximum_rate:
       *     form.maximum_rate
       *       ? Number(form.maximum_rate)
       *       : null,
       *
       *   start_type:
       *     form.start_type,
       *
       *   grace_period_value:
       *     Number(
       *       form.grace_period_value || 0
       *     ),
       *
       *   grace_period_unit:
       *     form.grace_period_unit,
       *
       *   increment_period:
       *     form.increment_period,
       *
       *   calculation_basis:
       *     form.calculation_basis,
       *
       *   effective_from:
       *     form.effective_from,
       *
       *   effective_to:
       *     form.effective_to || null,
       *
       *   is_active:
       *     form.is_active,
       *
       *   legal_reference:
       *     form.legal_reference.trim() || null,
       *
       *   description:
       *     form.description.trim() || null,
       * });
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 700)
      );

      const selectedService =
        form.revenue_service_id ===
        "DEFAULT"
          ? null
          : services.find(
              (service) =>
                service.id ===
                form.revenue_service_id
            ) ?? null;

      const payload: PenaltyRule = {
        id:
          editingRule?.id ??
          `penalty-${Date.now()}`,

        revenue_service_id:
          form.revenue_service_id ===
          "DEFAULT"
            ? null
            : form.revenue_service_id,

        name:
          form.name.trim(),

        calculation_type:
          form.calculation_type,

        initial_rate:
          form.initial_rate
            ? Number(
                form.initial_rate
              )
            : null,

        increment_rate:
          form.increment_rate
            ? Number(
                form.increment_rate
              )
            : null,

        maximum_rate:
          form.maximum_rate
            ? Number(
                form.maximum_rate
              )
            : null,

        start_type:
          form.start_type,

        grace_period_value:
          Number(
            form.grace_period_value || 0
          ),

        grace_period_unit:
          form.grace_period_unit,

        increment_period:
          form.increment_period,

        calculation_basis:
          form.calculation_basis,

        effective_from:
          form.effective_from,

        effective_to:
          form.effective_to ||
          null,

        is_active:
          form.is_active,

        legal_reference:
          form.legal_reference.trim() ||
          null,

        description:
          form.description.trim() ||
          null,

        revenue_service:
          selectedService,
      };

      setRules((previous) => {
        if (editingRule) {
          return previous.map(
            (item) =>
              item.id ===
              editingRule.id
                ? payload
                : item
          );
        }

        return [
          payload,
          ...previous,
        ];
      });

      setDialogOpen(false);
      setEditingRule(null);
      setForm(EMPTY_FORM);
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Toggle Status
  |--------------------------------------------------------------------------
  */

  const toggleStatus = async (
    rule: PenaltyRule
  ) => {
    setActionId(rule.id);

    try {
      /*
       * Replace with your API mutation:
       *
       * await changePenaltyRuleStatus({
       *   id: rule.id,
       *   is_active: !rule.is_active,
       * });
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      setRules((previous) =>
        previous.map(
          (item) =>
            item.id === rule.id
              ? {
                  ...item,
                  is_active:
                    !item.is_active,
                }
              : item
        )
      );
    } finally {
      setActionId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6 p-6">

      {/* ================================================================
          HEADER
      ================================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Revenue Penalties
              </h1>

              <p className="text-sm text-muted-foreground">
                Manage the default penalty policy
                and service-specific overrides.
              </p>
            </div>

          </div>
        </div>

        <Button
          onClick={openCreate}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Penalty Rule
        </Button>

      </div>

      {/* ================================================================
          POLICY EXPLANATION
      ================================================================= */}

      <div className="rounded-xl border bg-muted/20 p-4">

        <div className="flex gap-3">

          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

          <div>

            <p className="font-medium">
              Penalty Policy Resolution
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              The calculation engine first looks for an
              active service-specific override. If none
              exists, the default policy is applied.
            </p>

          </div>

        </div>

      </div>

      {/* ================================================================
          STATS
      ================================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl border bg-card p-4">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-muted-foreground">
                Total Rules
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {rules.length}
              </p>
            </div>

            <CircleDot className="h-5 w-5 text-muted-foreground" />

          </div>

        </div>

        <div className="rounded-xl border bg-card p-4">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-muted-foreground">
                Active
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {activeCount}
              </p>
            </div>

            <CheckCircle2 className="h-5 w-5 text-emerald-600" />

          </div>

        </div>

        <div className="rounded-xl border bg-card p-4">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-muted-foreground">
                Default Policies
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {defaultCount}
              </p>
            </div>

            <ShieldCheck className="h-5 w-5 text-primary" />

          </div>

        </div>

        <div className="rounded-xl border bg-card p-4">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-muted-foreground">
                Service Overrides
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {overrideCount}
              </p>
            </div>

            <AlertCircle className="h-5 w-5 text-amber-600" />

          </div>

        </div>

      </div>

      {/* ================================================================
          FILTERS
      ================================================================= */}

      <div className="rounded-xl border bg-card p-4">

        <div className="mb-4 flex items-center gap-2">

          <Filter className="h-4 w-4" />

          <h2 className="font-medium">
            Filters
          </h2>

        </div>

        <div className="grid gap-3 lg:grid-cols-3">

          {/* Search */}

          <div className="relative">

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );
                setPage(1);
              }}
              placeholder="Search penalty rules..."
              className="pl-9"
            />

          </div>

          {/* Service */}

          <Select
            value={serviceFilter}
            onValueChange={(value) => {
              setServiceFilter(value);
              setPage(1);
            }}
          >

            <SelectTrigger>
              <SelectValue placeholder="Service" />
            </SelectTrigger>

            <SelectContent>

              <SelectItem value="ALL">
                All Policies
              </SelectItem>

              <SelectItem value="DEFAULT">
                Default Policy
              </SelectItem>

              {services.map(
                (service) => (
                  <SelectItem
                    key={service.id}
                    value={service.id}
                  >
                    {service.name} Override
                  </SelectItem>
                )
              )}

            </SelectContent>

          </Select>

          {/* Status */}

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(
                value as
                  | "ALL"
                  | "ACTIVE"
                  | "INACTIVE"
              );

              setPage(1);
            }}
          >

            <SelectTrigger>
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

        </div>

      </div>

      {/* ================================================================
          TABLE
      ================================================================= */}

      <div className="overflow-hidden rounded-xl border bg-card">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="border-b bg-muted/40">

              <tr>

                <th className="px-4 py-3 text-left font-medium">
                  Rule
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Scope
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Calculation
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Rates
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Start
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

              {paginatedRules.length === 0 ? (

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
                          or create a new penalty
                          rule.
                        </p>

                      </div>

                    </div>

                  </td>

                </tr>

              ) : (

                paginatedRules.map(
                  (rule) => {

                    const serviceName =
                      getServiceName(
                        rule,
                        services
                      );

                    return (

                      <tr
                        key={rule.id}
                        className="transition-colors hover:bg-muted/30"
                      >

                        {/* Rule */}

                        <td className="px-4 py-4">

                          <div className="min-w-[220px]">

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

                        {/* Scope */}

                        <td className="px-4 py-4">

                          {rule.revenue_service_id ? (

                            <div className="space-y-1">

                              <Badge variant="secondary">
                                Service Override
                              </Badge>

                              <p className="text-xs text-muted-foreground">
                                {serviceName}
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

                        {/* Calculation */}

                        <td className="px-4 py-4">

                          <div>

                            <p className="font-medium">
                              {rule.calculation_type}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              Basis:{" "}
                              {rule.calculation_basis}
                            </p>

                          </div>

                        </td>

                        {/* Rates */}

                        <td className="px-4 py-4">

                          <div className="min-w-[160px]">

                            <p className="font-medium">

                              {formatRate(
                                rule.initial_rate
                              )}

                              {rule.increment_rate !==
                                null && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  +{" "}
                                  {formatRate(
                                    rule.increment_rate
                                  )}
                                  /
                                  {rule.increment_period.toLowerCase()}
                                </span>
                              )}

                            </p>

                            {rule.maximum_rate !==
                              null && (
                              <p className="text-xs text-muted-foreground">
                                Maximum:{" "}
                                {formatRate(
                                  rule.maximum_rate
                                )}
                              </p>
                            )}

                          </div>

                        </td>

                        {/* Start */}

                        <td className="px-4 py-4">

                          <div className="min-w-[160px]">

                            <p className="font-medium">
                              {getStartLabel(
                                rule.start_type
                              )}
                            </p>

                            {rule.start_type ===
                              "AFTER_GRACE_PERIOD" && (
                              <p className="text-xs text-muted-foreground">
                                After{" "}
                                {
                                  rule.grace_period_value
                                }{" "}
                                {
                                  rule.grace_period_unit.toLowerCase()
                                }
                                {rule.grace_period_value !==
                                1
                                  ? "s"
                                  : ""}
                              </p>
                            )}

                          </div>

                        </td>

                        {/* Effective Period */}

                        <td className="px-4 py-4">

                          <div className="min-w-[170px]">

                            <p className="font-medium">
                              {formatDate(
                                rule.effective_from
                              )}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              to{" "}
                              {formatDate(
                                rule.effective_to
                              )}
                            </p>

                          </div>

                        </td>

                        {/* Status */}

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

                        {/* Actions */}

                        <td className="px-4 py-4">

                          <div className="flex justify-end gap-2">

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openEdit(
                                  rule
                                )
                              }
                              className="gap-1"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Edit
                            </Button>

                            <Button
                              variant={
                                rule.is_active
                                  ? "outline"
                                  : "default"
                              }
                              size="sm"
                              disabled={
                                actionId ===
                                rule.id
                              }
                              onClick={() =>
                                toggleStatus(
                                  rule
                                )
                              }
                              className="gap-1"
                            >

                              {actionId ===
                              rule.id ? (

                                <Loader2 className="h-3.5 w-3.5 animate-spin" />

                              ) : (

                                <Power className="h-3.5 w-3.5" />

                              )}

                              {rule.is_active
                                ? "Deactivate"
                                : "Activate"}

                            </Button>

                          </div>

                        </td>

                      </tr>

                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

        {/* ================================================================
            PAGINATION
        ================================================================= */}

        {filteredRules.length > 0 && (

          <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm text-muted-foreground">

              Showing{" "}
              {(currentPage - 1) *
                pageSize +
                1}
              {"–"}
              {Math.min(
                currentPage *
                  pageSize,
                filteredRules.length
              )}{" "}
              of{" "}
              {filteredRules.length}

            </p>

            <div className="flex items-center gap-2">

              <Button
                variant="outline"
                size="sm"
                disabled={
                  currentPage <= 1
                }
                onClick={() =>
                  setPage(
                    (value) =>
                      Math.max(
                        1,
                        value - 1
                      )
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="min-w-[70px] text-center text-sm">
                {currentPage} /{" "}
                {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={
                  currentPage >=
                  totalPages
                }
                onClick={() =>
                  setPage(
                    (value) =>
                      Math.min(
                        totalPages,
                        value + 1
                      )
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

            </div>

          </div>

        )}

      </div>

      {/* ================================================================
          CREATE / EDIT DIALOG
      ================================================================= */}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">

          <DialogHeader>

            <DialogTitle>
              {editingRule
                ? "Edit Penalty Rule"
                : "Create Penalty Rule"}
            </DialogTitle>

            <DialogDescription>
              Configure the penalty policy,
              applicability period, and calculation
              behavior.
            </DialogDescription>

          </DialogHeader>

          <div className="space-y-6 py-4">

            {/* ============================================================
                BASIC INFORMATION
            ============================================================= */}

            <div className="space-y-4">

              <div className="flex items-center gap-2">

                <div className="h-6 w-1 rounded-full bg-primary" />

                <h3 className="font-medium">
                  Basic Information
                </h3>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                {/* Name */}

                <div className="space-y-2 sm:col-span-2">

                  <Label>
                    Rule Name
                  </Label>

                  <Input
                    value={
                      form.name
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          name: event
                            .target
                            .value,
                        })
                      )
                    }
                    placeholder="e.g. Default Progressive Penalty"
                  />

                </div>

                {/* Policy Scope */}

                <div className="space-y-2 sm:col-span-2">

                  <Label>
                    Policy Scope
                  </Label>

                  <Select
                    value={
                      form.revenue_service_id
                    }
                    onValueChange={(
                      value
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          revenue_service_id:
                            value,
                        })
                      )
                    }
                  >

                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>

                      <SelectItem value="DEFAULT">
                        Default — All Revenue Services
                      </SelectItem>

                      {services.map(
                        (
                          service
                        ) => (
                          <SelectItem
                            key={
                              service.id
                            }
                            value={
                              service.id
                            }
                          >
                            Override —{" "}
                            {
                              service.name
                            }
                          </SelectItem>
                        )
                      )}

                    </SelectContent>

                  </Select>

                  <p className="text-xs text-muted-foreground">

                    Use Default for the common
                    policy. Select a service only
                    when that service requires a
                    different penalty policy.

                  </p>

                </div>

              </div>

            </div>

            {/* ============================================================
                CALCULATION
            ============================================================= */}

            <div className="space-y-4">

              <div className="flex items-center gap-2">

                <div className="h-6 w-1 rounded-full bg-primary" />

                <h3 className="font-medium">
                  Calculation Configuration
                </h3>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                {/* Calculation Type */}

                <div className="space-y-2">

                  <Label>
                    Calculation Type
                  </Label>

                  <Select
                    value={
                      form.calculation_type
                    }
                    onValueChange={(
                      value
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          calculation_type:
                            value as CalculationType,
                        })
                      )
                    }
                  >

                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>

                      <SelectItem value="PROGRESSIVE">
                        Progressive
                      </SelectItem>

                      <SelectItem value="PERCENTAGE">
                        Percentage
                      </SelectItem>

                      <SelectItem value="FIXED">
                        Fixed
                      </SelectItem>

                    </SelectContent>

                  </Select>

                </div>

                {/* Basis */}

                <div className="space-y-2">

                  <Label>
                    Calculation Basis
                  </Label>

                  <Select
                    value={
                      form.calculation_basis
                    }
                    onValueChange={(
                      value
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          calculation_basis:
                            value as CalculationBasis,
                        })
                      )
                    }
                  >

                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>

                      <SelectItem value="PRINCIPAL">
                        Principal
                      </SelectItem>

                      <SelectItem value="OUTSTANDING">
                        Outstanding
                      </SelectItem>

                    </SelectContent>

                  </Select>

                </div>

                {/* Initial */}

                <div className="space-y-2">

                  <Label>
                    Initial Rate (%)
                  </Label>

                  <Input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={
                      form.initial_rate
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          initial_rate:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="5"
                  />

                </div>

                {/* Increment */}

                <div className="space-y-2">

                  <Label>
                    Increment Rate (%)
                  </Label>

                  <Input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={
                      form.increment_rate
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          increment_rate:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="2"
                  />

                </div>

                {/* Maximum */}

                <div className="space-y-2">

                  <Label>
                    Maximum Rate (%)
                  </Label>

                  <Input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={
                      form.maximum_rate
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          maximum_rate:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="25"
                  />

                </div>

                {/* Increment Period */}

                <div className="space-y-2">

                  <Label>
                    Increment Period
                  </Label>

                  <Select
                    value={
                      form.increment_period
                    }
                    onValueChange={(
                      value
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          increment_period:
                            value as PeriodUnit,
                        })
                      )
                    }
                  >

                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>

                      <SelectItem value="DAY">
                        Day
                      </SelectItem>

                      <SelectItem value="MONTH">
                        Month
                      </SelectItem>

                      <SelectItem value="YEAR">
                        Year
                      </SelectItem>

                    </SelectContent>

                  </Select>

                </div>

              </div>

            </div>

            {/* ============================================================
                START RULE
            ============================================================= */}

            <div className="space-y-4">

              <div className="flex items-center gap-2">

                <div className="h-6 w-1 rounded-full bg-primary" />

                <h3 className="font-medium">
                  Penalty Start Rule
                </h3>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                {/* Start Type */}

                <div className="space-y-2">

                  <Label>
                    Start Type
                  </Label>

                  <Select
                    value={
                      form.start_type
                    }
                    onValueChange={(
                      value
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          start_type:
                            value as StartType,
                        })
                      )
                    }
                  >

                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>

                      <SelectItem value="DUE_DATE">
                        Due Date
                      </SelectItem>

                      <SelectItem value="AGREEMENT_START">
                        Agreement Start
                      </SelectItem>

                      <SelectItem value="AFTER_GRACE_PERIOD">
                        After Grace Period
                      </SelectItem>

                      <SelectItem value="FISCAL_YEAR_START">
                        Fiscal Year Start
                      </SelectItem>

                    </SelectContent>

                  </Select>

                </div>

                {/* Grace Period */}

                <div className="grid grid-cols-2 gap-2">

                  <div className="space-y-2">

                    <Label>
                      Offset
                    </Label>

                    <Input
                      type="number"
                      min="0"
                      value={
                        form.grace_period_value
                      }
                      disabled={
                        form.start_type !==
                        "AFTER_GRACE_PERIOD"
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            grace_period_value:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                    />

                  </div>

                  <div className="space-y-2">

                    <Label>
                      Unit
                    </Label>

                    <Select
                      value={
                        form.grace_period_unit
                      }
                      disabled={
                        form.start_type !==
                        "AFTER_GRACE_PERIOD"
                      }
                      onValueChange={(
                        value
                      ) =>
                        setForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            grace_period_unit:
                              value as PeriodUnit,
                          })
                        )
                      }
                    >

                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>

                        <SelectItem value="DAY">
                          Day
                        </SelectItem>

                        <SelectItem value="MONTH">
                          Month
                        </SelectItem>

                        <SelectItem value="YEAR">
                          Year
                        </SelectItem>

                      </SelectContent>

                    </Select>

                  </div>

                </div>

              </div>

            </div>

            {/* ============================================================
                EFFECTIVE PERIOD
            ============================================================= */}

            <div className="space-y-4">

              <div className="flex items-center gap-2">

                <div className="h-6 w-1 rounded-full bg-primary" />

                <h3 className="font-medium">
                  Effective Period
                </h3>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <div className="space-y-2">

                  <Label>
                    Effective From
                  </Label>

                  <Input
                    type="date"
                    value={
                      form.effective_from
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          effective_from:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />

                </div>

                <div className="space-y-2">

                  <Label>
                    Effective To
                  </Label>

                  <Input
                    type="date"
                    value={
                      form.effective_to
                    }
                    min={
                      form.effective_from
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          effective_to:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />

                  <p className="text-xs text-muted-foreground">
                    Leave empty if the policy
                    has no planned end date.
                  </p>

                </div>

              </div>

            </div>

            {/* ============================================================
                LEGAL INFORMATION
            ============================================================= */}

            <div className="space-y-4">

              <div className="flex items-center gap-2">

                <div className="h-6 w-1 rounded-full bg-primary" />

                <h3 className="font-medium">
                  Legal & Description
                </h3>

              </div>

              <div className="space-y-4">

                <div className="space-y-2">

                  <Label>
                    Legal Reference
                  </Label>

                  <Input
                    value={
                      form.legal_reference
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          legal_reference:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="e.g. Revenue Regulation No. ..."
                  />

                </div>

                <div className="space-y-2">

                  <Label>
                    Description
                  </Label>

                  <Textarea
                    value={
                      form.description
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          description:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Describe the legal and business application of this penalty policy..."
                    rows={4}
                  />

                </div>

              </div>

            </div>

            {/* ============================================================
                STATUS
            ============================================================= */}

            <div className="flex items-center justify-between rounded-lg border p-4">

              <div>

                <p className="font-medium">
                  Active Rule
                </p>

                <p className="text-sm text-muted-foreground">
                  Active rules can be selected
                  by the revenue calculation
                  engine.
                </p>

              </div>

              <Switch
                checked={
                  form.is_active
                }
                onCheckedChange={(
                  checked
                ) =>
                  setForm(
                    (
                      previous
                    ) => ({
                      ...previous,
                      is_active:
                        checked,
                    })
                  )
                }
              />

            </div>

            {/* ============================================================
                WARNING
            ============================================================= */}

            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">

              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <div>

                <p className="font-medium">
                  Financial configuration
                </p>

                <p className="mt-1">
                  Penalty policies affect financial
                  assessments. Historical policies
                  should normally be deactivated
                  rather than deleted.
                </p>

              </div>

            </div>

          </div>

          <DialogFooter>

            <Button
              variant="outline"
              disabled={saving}
              onClick={() =>
                setDialogOpen(false)
              }
            >
              Cancel
            </Button>

            <Button
              disabled={
                saving ||
                !form.name.trim() ||
                !form.effective_from ||
                (!!form.effective_to &&
                  form.effective_to <
                    form.effective_from)
              }
              onClick={
                handleSave
              }
              className="gap-2"
            >

              {saving && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {editingRule
                ? "Save Changes"
                : "Create Rule"}

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>
  );
}

export default RevenuePenalties;
