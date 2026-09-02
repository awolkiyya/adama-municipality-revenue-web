"use client";

import { useMemo, useState } from "react";

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

/*                                                                         |
| -------------------------------------------------------------------------- |
| Types                                                                      |
| -------------------------------------------------------------------------- |
|                                                                            |
| These types follow the standalone interest_rules database structure.       |
|                                                                            |
| Interest rules are NOT attached to:                                        |
|                                                                            |
| - tariff versions                                                          |
| - revenue services                                                         |
|                                                                            |
| They are general financial policies selected by their effective date.      |
|                                                                            |
| */                                                                         

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

 /*                                                                         |
| -------------------------------------------------------------------------- |
| Form                                                                       |
| -------------------------------------------------------------------------- |
| */                                                                         

type InterestRuleForm = {
rate: string;

rate_period: RatePeriod;

calculation_method: CalculationMethod;

calculation_basis: CalculationBasis;

effective_from: string;

effective_to: string;

legal_reference: string;

description: string;
};

/*                                                                         |
| -------------------------------------------------------------------------- |
| Labels                                                                     |
| -------------------------------------------------------------------------- |
| */                                                                         

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

/*                                                                         |
| -------------------------------------------------------------------------- |
| Mock Data                                                                  |
| -------------------------------------------------------------------------- |
|                                                                            |
| Temporary UI data.                                                         |
|                                                                            |
| In production replace this with:                                           |
|                                                                            |
| useInterestRules(...)                                                      |
|                                                                            |
| Notice that rules are general and therefore have no:                       |
|                                                                            |
| tariff_version_id                                                          |
| revenue_service_id                                                         |
|                                                                            |
| */                                                                         

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

 /*                                                                         |
| -------------------------------------------------------------------------- |
| Formatting                                                                 |
| -------------------------------------------------------------------------- |
| */                                                                         

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

 /*                                                                         |
| -------------------------------------------------------------------------- |
| Status                                                                     |
| -------------------------------------------------------------------------- |
| */                                                                         

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

 /*                                                                         |
| -------------------------------------------------------------------------- |
| Component                                                                  |
| -------------------------------------------------------------------------- |
| */                                                                         

function InterestRules() {
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

const [selectedRule, setSelectedRule] =
useState<InterestRule | null>(null);

const [isFormOpen, setIsFormOpen] =
useState(false);

const [isViewOpen, setIsViewOpen] =
useState(false);

const [editingRule, setEditingRule] =
useState<InterestRule | null>(null);

 /*                                                                         |
| -------------------------------------------------------------------------- |
| Form                                                                       |
| -------------------------------------------------------------------------- |
| */                                                                         

const [form, setForm] =
useState<InterestRuleForm>({
rate: "",


  rate_period: "YEAR",

  calculation_method: "SIMPLE",

  calculation_basis: "PRINCIPAL",

  effective_from: "",

  effective_to: "",

  legal_reference: "",

  description: "",
});


 /*                                                                         |
| -------------------------------------------------------------------------- |
| Statistics                                                                 |
| -------------------------------------------------------------------------- |
| */                                                                         

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

/*                                                                         |
| -------------------------------------------------------------------------- |
| Active Policy                                                              |
| -------------------------------------------------------------------------- |
|                                                                            |
| There should normally be one active rule applicable to the                 |
| current date. Historical rules remain stored.                              |
|                                                                            |
| */                                                                         

const activeRules = useMemo(() => {
return rules.filter(
(rule) => rule.is_active,
);
}, [rules]);

 /*                                                                         |
| -------------------------------------------------------------------------- |
| Filtering                                                                  |
| -------------------------------------------------------------------------- |
| */                                                                         

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

/*                                                                         |
| -------------------------------------------------------------------------- |
| Open Create                                                                |
| -------------------------------------------------------------------------- |
| */                                                                         

const openCreate = () => {
setEditingRule(null);


setForm({
  rate: "",

  rate_period: "YEAR",

  calculation_method: "SIMPLE",

  calculation_basis: "PRINCIPAL",

  effective_from: "",

  effective_to: "",

  legal_reference: "",

  description: "",
});

setIsFormOpen(true);


};

 /*                                                                         |
| -------------------------------------------------------------------------- |
| Open Edit                                                                  |
| -------------------------------------------------------------------------- |
| */                                                                         

const openEdit = (rule: InterestRule) => {
setEditingRule(rule);


setForm({
  rate: String(rule.rate),

  rate_period:
    rule.rate_period,

  calculation_method:
    rule.calculation_method,

  calculation_basis:
    rule.calculation_basis,

  effective_from:
    rule.effective_from,

  effective_to:
    rule.effective_to ?? "",

  legal_reference:
    rule.legal_reference ?? "",

  description:
    rule.description ?? "",
});

setIsFormOpen(true);


};

 /*                                                                         |
| -------------------------------------------------------------------------- |
| Submit                                                                     |
| -------------------------------------------------------------------------- |
| */                                                                         

const handleSubmit = () => {
const rate = Number(form.rate);


/*
|--------------------------------------------------------------------------
| Basic validation
|--------------------------------------------------------------------------
*/

if (
  !form.rate ||
  Number.isNaN(rate) ||
  rate < 0 ||
  !form.effective_from
) {
  return;
}

/*
|--------------------------------------------------------------------------
| Effective Date Validation
|--------------------------------------------------------------------------
*/

if (
  form.effective_to &&
  form.effective_to < form.effective_from
) {
  return;
}

const today = new Date()
  .toISOString()
  .slice(0, 10);

/*
|--------------------------------------------------------------------------
| Update
|--------------------------------------------------------------------------
*/

if (editingRule) {
  setRules((current) =>
    current.map((rule) =>
      rule.id === editingRule.id
        ? {
            ...rule,

            rate,

            rate_period:
              form.rate_period,

            calculation_method:
              form.calculation_method,

            calculation_basis:
              form.calculation_basis,

            effective_from:
              form.effective_from,

            effective_to:
              form.effective_to ||
              null,

            legal_reference:
              form.legal_reference ||
              null,

            description:
              form.description ||
              null,

            updated_at: today,
          }
        : rule,
    ),
  );
}

/*
|--------------------------------------------------------------------------
| Create
|--------------------------------------------------------------------------
*/

else {
  const newRule: InterestRule = {
    id: `ir-${Date.now()}`,

    rate,

    rate_period:
      form.rate_period,

    calculation_method:
      form.calculation_method,

    calculation_basis:
      form.calculation_basis,

    effective_from:
      form.effective_from,

    effective_to:
      form.effective_to ||
      null,

    is_active: true,

    legal_reference:
      form.legal_reference ||
      null,

    description:
      form.description ||
      null,

    created_at: today,

    updated_at: today,
  };

  setRules((current) => [
    newRule,
    ...current,
  ]);
}

setIsFormOpen(false);


};

 /*                                                                         |
| -------------------------------------------------------------------------- |
| Activate / Deactivate                                                      |
| -------------------------------------------------------------------------- |
| */                                                                         

const toggleStatus = (
ruleId: string,
) => {
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

 /*                                                                         |
| -------------------------------------------------------------------------- |
| Render                                                                     |
| -------------------------------------------------------------------------- |
| */                                                                         

return ( <div className="flex flex-col gap-6 p-4 md:p-6">


  {/* ================================================================
      HEADER
  ================================================================ */}

  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

    <div className="flex items-start gap-3">

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-muted/40">
        <Landmark className="h-5 w-5" />
      </div>

      <div>

        <div className="flex items-center gap-2">

          <h1 className="text-xl font-semibold tracking-tight">
            Interest Rates
          </h1>

          <Badge
            variant="outline"
            className="hidden sm:inline-flex"
          >
            Financial Policy
          </Badge>

        </div>

        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Manage legally applicable interest policies used
          for overdue revenue calculations.
        </p>

      </div>

    </div>

    <Button onClick={openCreate}>

      <Plus className="mr-2 h-4 w-4" />

      Add Interest Rate

    </Button>

  </div>

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
          Interest is a general financial policy. The
          calculation engine determines the applicable rule
          using the assessment or obligation date and the
          rule's effective period.
        </p>

      </div>

    </div>

  )}

  {/* ================================================================
      FILTERS
  ================================================================ */}

  <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row md:flex-wrap">

    {/* Search */}

    <div className="relative min-w-[240px] flex-1">

      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      <Input
        value={search}
        onChange={(event) =>
          setSearch(
            event.target.value,
          )
        }
        placeholder="Search rates, legal references, or descriptions..."
        className="pl-9"
      />

    </div>

    {/* Status */}

    <Select
      value={status}
      onValueChange={(value) =>
        setStatus(
          value as
            | "ALL"
            | "ACTIVE"
            | "INACTIVE",
        )
      }
    >

      <SelectTrigger className="w-full md:w-[160px]">

        <SelectValue placeholder="Status" />

      </SelectTrigger>

      <SelectContent>

        <SelectItem value="ALL">
          All statuses
        </SelectItem>

        <SelectItem value="ACTIVE">
          Active
        </SelectItem>

        <SelectItem value="INACTIVE">
          Inactive
        </SelectItem>

      </SelectContent>

    </Select>

    {/* Rate Period */}

    <Select
      value={ratePeriod}
      onValueChange={(value) =>
        setRatePeriod(
          value as
            | "ALL"
            | RatePeriod,
        )
      }
    >

      <SelectTrigger className="w-full md:w-[160px]">

        <SelectValue placeholder="Rate period" />

      </SelectTrigger>

      <SelectContent>

        <SelectItem value="ALL">
          All periods
        </SelectItem>

        <SelectItem value="YEAR">
          Annual
        </SelectItem>

        <SelectItem value="MONTH">
          Monthly
        </SelectItem>

        <SelectItem value="DAY">
          Daily
        </SelectItem>

      </SelectContent>

    </Select>

    {/* Calculation Method */}

    <Select
      value={calculationMethod}
      onValueChange={(value) =>
        setCalculationMethod(
          value as
            | "ALL"
            | CalculationMethod,
        )
      }
    >

      <SelectTrigger className="w-full md:w-[190px]">

        <SelectValue placeholder="Method" />

      </SelectTrigger>

      <SelectContent>

        <SelectItem value="ALL">
          All methods
        </SelectItem>

        <SelectItem value="SIMPLE">
          Simple Interest
        </SelectItem>

        <SelectItem value="COMPOUND">
          Compound Interest
        </SelectItem>

      </SelectContent>

    </Select>

    {/* Basis */}

    <Select
      value={calculationBasis}
      onValueChange={(value) =>
        setCalculationBasis(
          value as
            | "ALL"
            | CalculationBasis,
        )
      }
    >

      <SelectTrigger className="w-full md:w-[190px]">

        <SelectValue placeholder="Calculation basis" />

      </SelectTrigger>

      <SelectContent>

        <SelectItem value="ALL">
          All bases
        </SelectItem>

        <SelectItem value="PRINCIPAL">
          Principal
        </SelectItem>

        <SelectItem value="OUTSTANDING">
          Outstanding Amount
        </SelectItem>

      </SelectContent>

    </Select>

  </div>

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

                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRule(
                              rule,
                            );

                            setIsViewOpen(
                              true,
                            );
                          }}
                        >

                          <Eye className="mr-2 h-4 w-4" />

                          View details

                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            openEdit(rule)
                          }
                        >

                          <Edit3 className="mr-2 h-4 w-4" />

                          Edit

                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

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

  {/* ================================================================
      CREATE / EDIT DIALOG
  ================================================================ */}

  <Dialog
    open={isFormOpen}
    onOpenChange={setIsFormOpen}
  >

    <DialogContent className="sm:max-w-[650px]">

      <DialogHeader>

        <DialogTitle>
          {editingRule
            ? "Edit Interest Rule"
            : "Add Interest Rule"}
        </DialogTitle>

        <DialogDescription>
          Configure the legally applicable interest policy.
          The backend calculation engine determines the
          applicable rule using the effective period.
        </DialogDescription>

      </DialogHeader>

      <div className="grid gap-5 py-4">

        {/* ==========================================================
            Rate
        ========================================================== */}

        <div className="grid gap-4 sm:grid-cols-2">

          <div className="grid gap-2">

            <label className="text-sm font-medium">
              Interest Rate (%)
            </label>

            <div className="relative">

              <Input
                type="number"
                step="0.0001"
                min="0"
                value={form.rate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,

                    rate:
                      event.target.value,
                  }))
                }
                placeholder="24.7250"
                className="pr-8"
              />

              <Percent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            </div>

            <p className="text-xs text-muted-foreground">
              Example: 24.7250 represents 24.725%.
            </p>

          </div>

          {/* Rate Period */}

          <div className="grid gap-2">

            <label className="text-sm font-medium">
              Rate Period
            </label>

            <Select
              value={
                form.rate_period
              }
              onValueChange={(
                value: RatePeriod,
              ) =>
                setForm((current) => ({
                  ...current,

                  rate_period:
                    value,
                }))
              }
            >

              <SelectTrigger>

                <SelectValue />

              </SelectTrigger>

              <SelectContent>

                <SelectItem value="YEAR">
                  Annual
                </SelectItem>

                <SelectItem value="MONTH">
                  Monthly
                </SelectItem>

                <SelectItem value="DAY">
                  Daily
                </SelectItem>

              </SelectContent>

            </Select>

          </div>

        </div>

        {/* ==========================================================
            Calculation Method
        ========================================================== */}

        <div className="grid gap-2">

          <label className="text-sm font-medium">
            Calculation Method
          </label>

          <Select
            value={
              form.calculation_method
            }
            onValueChange={(
              value: CalculationMethod,
            ) =>
              setForm((current) => ({
                ...current,

                calculation_method:
                  value,
              }))
            }
          >

            <SelectTrigger>

              <SelectValue />

            </SelectTrigger>

            <SelectContent>

              <SelectItem value="SIMPLE">
                Simple Interest
              </SelectItem>

              <SelectItem value="COMPOUND">
                Compound Interest
              </SelectItem>

            </SelectContent>

          </Select>

          <p className="text-xs text-muted-foreground">
            Select the legally authorized method used by
            the backend calculation engine.
          </p>

        </div>

        {/* ==========================================================
            Calculation Basis
        ========================================================== */}

        <div className="grid gap-2">

          <label className="text-sm font-medium">
            Calculation Basis
          </label>

          <Select
            value={
              form.calculation_basis
            }
            onValueChange={(
              value: CalculationBasis,
            ) =>
              setForm((current) => ({
                ...current,

                calculation_basis:
                  value,
              }))
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
                Outstanding Amount
              </SelectItem>

            </SelectContent>

          </Select>

          <p className="text-xs text-muted-foreground">
            Defines the monetary base used when calculating
            interest on overdue revenue.
          </p>

        </div>

        {/* ==========================================================
            Effective Dates
        ========================================================== */}

        <div className="grid gap-4 sm:grid-cols-2">

          {/* Effective From */}

          <div className="grid gap-2">

            <label className="text-sm font-medium">
              Effective From
            </label>

            <Input
              type="date"
              value={
                form.effective_from
              }
              onChange={(event) =>
                setForm((current) => ({
                  ...current,

                  effective_from:
                    event.target.value,
                }))
              }
            />

            <p className="text-xs text-muted-foreground">
              First date this interest policy applies.
            </p>

          </div>

          {/* Effective To */}

          <div className="grid gap-2">

            <label className="text-sm font-medium">
              Effective To
            </label>

            <Input
              type="date"
              value={
                form.effective_to
              }
              min={
                form.effective_from ||
                undefined
              }
              onChange={(event) =>
                setForm((current) => ({
                  ...current,

                  effective_to:
                    event.target.value,
                }))
              }
            />

            <p className="text-xs text-muted-foreground">
              Leave empty if the policy has no planned end date.
            </p>

          </div>

        </div>

        {/* ==========================================================
            Legal Reference
        ========================================================== */}

        <div className="grid gap-2">

          <label className="text-sm font-medium">
            Legal Reference
          </label>

          <Input
            value={
              form.legal_reference
            }
            onChange={(event) =>
              setForm((current) => ({
                ...current,

                legal_reference:
                  event.target.value,
              }))
            }
            placeholder="e.g. Revenue Regulation 2026, Article 18"
          />

          <p className="text-xs text-muted-foreground">
            Record the law, regulation, directive, or other
            legal authority establishing the rate.
          </p>

        </div>

        {/* ==========================================================
            Description
        ========================================================== */}

        <div className="grid gap-2">

          <label className="text-sm font-medium">
            Description
          </label>

          <textarea
            value={
              form.description
            }
            onChange={(event) =>
              setForm((current) => ({
                ...current,

                description:
                  event.target.value,
              }))
            }
            placeholder="Describe how this interest policy is intended to be applied..."
            className="min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />

        </div>

      </div>

      <DialogFooter>

        <Button
          variant="outline"
          onClick={() =>
            setIsFormOpen(false)
          }
        >
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
        >
          {editingRule
            ? "Save Changes"
            : "Create Interest Rule"}
        </Button>

      </DialogFooter>

    </DialogContent>

  </Dialog>

  {/* ================================================================
      VIEW DETAILS
  ================================================================ */}

  <Dialog
    open={isViewOpen}
    onOpenChange={setIsViewOpen}
  >

    <DialogContent className="sm:max-w-[600px]">

      <DialogHeader>

        <DialogTitle>
          Interest Rule Details
        </DialogTitle>

        <DialogDescription>
          Legal, effective-period, and calculation
          configuration for this interest policy.
        </DialogDescription>

      </DialogHeader>

      {selectedRule && (

        <div className="space-y-5">

          {/* ========================================================
              Header Card
          ======================================================== */}

          <div className="rounded-xl border bg-muted/30 p-4">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="font-semibold">
                  General Interest Policy
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Applicable according to the configured
                  effective period
                </p>

              </div>

              <Badge
                variant="outline"
                className={
                  getRuleStatus(
                    selectedRule,
                  ).className
                }
              >

                {(() => {
                  const Icon =
                    getRuleStatus(
                      selectedRule,
                    ).icon;

                  return (
                    <Icon className="mr-1 h-3.5 w-3.5" />
                  );
                })()}

                {
                  getRuleStatus(
                    selectedRule,
                  ).label
                }

              </Badge>

            </div>

            <div className="mt-5 flex items-baseline gap-2">

              <span className="text-3xl font-semibold tabular-nums">
                {formatPercentage(
                  selectedRule.rate,
                )}
              </span>

              <span className="text-sm text-muted-foreground">
                {
                  RATE_PERIOD_LABELS[
                    selectedRule
                      .rate_period
                  ]
                }
              </span>

            </div>

          </div>

          {/* ========================================================
              Effective Period
          ======================================================== */}

          <div className="rounded-lg border p-4">

            <div className="flex items-center gap-2">

              <CalendarDays className="h-4 w-4 text-muted-foreground" />

              <p className="text-sm font-medium">
                Effective Period
              </p>

            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">

              <div>

                <p className="text-xs text-muted-foreground">
                  Effective From
                </p>

                <p className="mt-1 font-medium">
                  {formatDate(
                    selectedRule.effective_from,
                  )}
                </p>

              </div>

              <div>

                <p className="text-xs text-muted-foreground">
                  Effective To
                </p>

                <p className="mt-1 font-medium">
                  {formatDate(
                    selectedRule.effective_to,
                  )}
                </p>

              </div>

            </div>

          </div>

          {/* ========================================================
              Rule Configuration
          ======================================================== */}

          <div className="grid gap-4 sm:grid-cols-3">

            <div className="rounded-lg border p-4">

              <p className="text-xs text-muted-foreground">
                Rate Period
              </p>

              <p className="mt-1 font-medium">
                {
                  RATE_PERIOD_LABELS[
                    selectedRule
                      .rate_period
                  ]
                }
              </p>

            </div>

            <div className="rounded-lg border p-4">

              <p className="text-xs text-muted-foreground">
                Calculation Method
              </p>

              <p className="mt-1 font-medium">
                {
                  CALCULATION_METHOD_LABELS[
                    selectedRule
                      .calculation_method
                  ]
                }
              </p>

            </div>

            <div className="rounded-lg border p-4">

              <p className="text-xs text-muted-foreground">
                Calculation Basis
              </p>

              <p className="mt-1 font-medium">
                {
                  CALCULATION_BASIS_LABELS[
                    selectedRule
                      .calculation_basis
                  ]
                }
              </p>

            </div>

          </div>

          {/* ========================================================
              Legal Reference
          ======================================================== */}

          <div className="rounded-lg border p-4">

            <div className="flex items-center gap-2">

              <FileText className="h-4 w-4 text-muted-foreground" />

              <p className="text-xs font-medium text-muted-foreground">
                Legal Reference
              </p>

            </div>

            <p className="mt-2 text-sm leading-6">

              {selectedRule
                .legal_reference ??
                "No legal reference specified."}

            </p>

          </div>

          {/* ========================================================
              Description
          ======================================================== */}

          {selectedRule.description && (

            <div className="rounded-lg border p-4">

              <p className="text-xs font-medium text-muted-foreground">
                Description
              </p>

              <p className="mt-2 text-sm leading-6">
                {
                  selectedRule.description
                }
              </p>

            </div>

          )}

          {/* ========================================================
              Audit Information
          ======================================================== */}

          <div className="rounded-lg border bg-muted/20 p-4">

            <div className="flex items-center gap-2">

              <CalendarDays className="h-4 w-4 text-muted-foreground" />

              <p className="text-sm font-medium">
                Configuration History
              </p>

            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">

              <div>

                <p className="text-xs text-muted-foreground">
                  Created
                </p>

                <p className="mt-1 text-sm font-medium">
                  {formatDate(
                    selectedRule.created_at,
                  )}
                </p>

              </div>

              <div>

                <p className="text-xs text-muted-foreground">
                  Last Updated
                </p>

                <p className="mt-1 text-sm font-medium">
                  {formatDate(
                    selectedRule.updated_at,
                  )}
                </p>

              </div>

            </div>

          </div>

        </div>

      )}

    </DialogContent>

  </Dialog>

</div>

);
}

export default InterestRules;
