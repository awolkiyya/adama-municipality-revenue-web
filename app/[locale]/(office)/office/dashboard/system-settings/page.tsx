"use client";

import { useMemo, useState } from "react";

import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Info,
  Landmark,
  Receipt,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type PaymentMethod =
  | "CASH"
  | "BANK"
  | "MOBILE_MONEY"
  | "CARD";

type SettingsSection =
  | "overview"
  | "payment-period"
  | "calculation"
  | "assessment"
  | "invoice"
  | "payment"
  | "receipt";


type RevenueSettings = {
  payment_start_month: string;
  payment_start_day: number;

  payment_end_month: string;
  payment_end_day: number;

  calendar_type: "ETHIOPIAN" | "GREGORIAN";

  penalty_enabled: boolean;
  interest_enabled: boolean;

  assessment_auto_calculation: boolean;
  assessment_manual_adjustment: boolean;
  assessment_requires_approval: boolean;
  assessment_reassessment_allowed: boolean;

  invoice_auto_numbering: boolean;
  invoice_prefix: string;
  invoice_allow_partial_payment: boolean;
  invoice_allow_overpayment: boolean;
  invoice_allow_overdue_payment: boolean;

  payment_confirmation_required: boolean;
  payment_auto_receipt: boolean;
  payment_allow_partial: boolean;
  payment_methods: PaymentMethod[];

  receipt_auto_numbering: boolean;
  receipt_prefix: string;
  receipt_allow_reprint: boolean;

  currency: string;
  decimal_places: number;
  percentage_precision: number;

  rounding_mode:
    | "HALF_UP"
    | "HALF_DOWN"
    | "HALF_EVEN"
    | "UP"
    | "DOWN";

  calculation_order:
    | "PENALTY_THEN_INTEREST"
    | "INTEREST_THEN_PENALTY";
};


/*
|--------------------------------------------------------------------------
| Default Settings
|--------------------------------------------------------------------------
*/

const DEFAULT_SETTINGS: RevenueSettings = {
  payment_start_month: "Adooleessa",
  payment_start_day: 1,

  payment_end_month: "Guraandhala",
  payment_end_day: 30,

  calendar_type: "ETHIOPIAN",

  penalty_enabled: true,
  interest_enabled: true,

  assessment_auto_calculation: true,
  assessment_manual_adjustment: false,
  assessment_requires_approval: false,
  assessment_reassessment_allowed: true,

  invoice_auto_numbering: true,
  invoice_prefix: "INV",

  invoice_allow_partial_payment: true,
  invoice_allow_overpayment: false,
  invoice_allow_overdue_payment: true,

  payment_confirmation_required: true,
  payment_auto_receipt: true,
  payment_allow_partial: true,

  payment_methods: [
    "CASH",
    "BANK",
    "MOBILE_MONEY",
  ],

  receipt_auto_numbering: true,
  receipt_prefix: "REC",
  receipt_allow_reprint: true,

  currency: "ETB",
  decimal_places: 2,
  percentage_precision: 4,

  rounding_mode: "HALF_UP",

  calculation_order: "PENALTY_THEN_INTEREST",
};


/*
|--------------------------------------------------------------------------
| Ethiopian Months
|--------------------------------------------------------------------------
*/

const ETHIOPIAN_MONTHS = [
  "Meskerem",
  "Tikimt",
  "Hidar",
  "Tahsas",
  "Tir",
  "Yekatit",
  "Megabit",
  "Miazia",
  "Ginbot",
  "Sene",
  "Hamle",
  "Nehase",
  "Pagume",
];


/*
|--------------------------------------------------------------------------
| Navigation
|--------------------------------------------------------------------------
*/

const NAVIGATION: {
  id: SettingsSection;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Configuration summary",
    icon: Settings2,
  },
  {
    id: "payment-period",
    label: "Payment Period",
    description: "Revenue collection period",
    icon: CalendarDays,
  },
  {
    id: "calculation",
    label: "Calculation",
    description: "Currency & calculation rules",
    icon: CircleDollarSign,
  },
  {
    id: "assessment",
    label: "Assessment",
    description: "Assessment behavior",
    icon: FileCheck2,
  },
  {
    id: "invoice",
    label: "Invoice",
    description: "Invoice behavior",
    icon: FileText,
  },
  {
    id: "payment",
    label: "Payment",
    description: "Payment processing",
    icon: WalletCards,
  },
  {
    id: "receipt",
    label: "Receipt",
    description: "Receipt configuration",
    icon: Receipt,
  },
];


/*
|--------------------------------------------------------------------------
| Setting Row
|--------------------------------------------------------------------------
*/

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-8 py-5">
      <div className="min-w-0">
        <div className="text-sm font-medium">
          {title}
        </div>

        <div className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
          {description}
        </div>
      </div>

      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
}


/*
|--------------------------------------------------------------------------
| Section Header
|--------------------------------------------------------------------------
*/

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-muted/50">
        <Icon className="h-4.5 w-4.5 text-muted-foreground" />
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </div>

        <h2 className="mt-1 text-base font-semibold tracking-tight">
          {title}
        </h2>

        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      </div>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| Main Page
|--------------------------------------------------------------------------
*/

export default function RevenueGeneralSettingsPage() {
  const [settings, setSettings] =
    useState<RevenueSettings>(DEFAULT_SETTINGS);

  const [activeSection, setActiveSection] =
    useState<SettingsSection>("overview");

  const [saved, setSaved] =
    useState(false);


  /*
  |--------------------------------------------------------------------------
  | Dirty State
  |--------------------------------------------------------------------------
  */

  const isDirty = useMemo(() => {
    return (
      JSON.stringify(settings) !==
      JSON.stringify(DEFAULT_SETTINGS)
    );
  }, [settings]);


  /*
  |--------------------------------------------------------------------------
  | Update
  |--------------------------------------------------------------------------
  */

  function update<K extends keyof RevenueSettings>(
    key: K,
    value: RevenueSettings[K],
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  }


  /*
  |--------------------------------------------------------------------------
  | Reset
  |--------------------------------------------------------------------------
  */

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS);
    setSaved(false);
  }


  /*
  |--------------------------------------------------------------------------
  | Save
  |--------------------------------------------------------------------------
  */

  function saveSettings() {
    /*
     * Replace with:
     *
     * PUT /api/revenue/settings
     */

    console.log(settings);

    setSaved(true);
  }


  /*
  |--------------------------------------------------------------------------
  | Payment Method
  |--------------------------------------------------------------------------
  */

  function togglePaymentMethod(
    method: PaymentMethod,
  ) {
    const exists =
      settings.payment_methods.includes(method);

    const next = exists
      ? settings.payment_methods.filter(
          (item) => item !== method,
        )
      : [
          ...settings.payment_methods,
          method,
        ];

    update(
      "payment_methods",
      next,
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Navigate
  |--------------------------------------------------------------------------
  */

  function navigate(
    section: SettingsSection,
  ) {
    setActiveSection(section);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-muted/20">

      {/* ==========================================================
          HEADER
      =========================================================== */}

      <header className="border-b bg-background">

        <div className="mx-auto max-w-[1500px] px-6 py-5">

          {/* Breadcrumb */}

          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">

            <span>
              Revenue Management
            </span>

            <ChevronRight className="h-3.5 w-3.5" />

            <span className="font-medium text-foreground">
              General Settings
            </span>

          </div>


          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-muted/40">

                <Settings2 className="h-5 w-5" />

              </div>

              <div>

                <div className="flex items-center gap-2">

                  <h1 className="text-xl font-semibold tracking-tight">
                    Revenue General Settings
                  </h1>

                  <Badge
                    variant="outline"
                    className="gap-1.5 font-normal"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </Badge>

                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Manage the global configuration and operational
                  behavior of the revenue management system.
                </p>

              </div>

            </div>


            {/* Header Actions */}

            <div className="flex items-center gap-2">

              {isDirty && (
                <Badge
                  variant="secondary"
                  className="hidden gap-1.5 sm:flex"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Unsaved changes
                </Badge>
              )}

              <Button
                variant="outline"
                size="sm"
                disabled={!isDirty}
                onClick={resetSettings}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>

              <Button
                size="sm"
                disabled={!isDirty}
                onClick={saveSettings}
              >
                {saved ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>

            </div>

          </div>

        </div>

      </header>


      {/* ==========================================================
          MAIN
      =========================================================== */}

      <main className="mx-auto max-w-[1500px] px-6 py-6">

        {/* ========================================================
            SUMMARY
        ========================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Payment Period */}

          <button
            type="button"
            onClick={() => navigate("payment-period")}
            className="text-left"
          >

            <Card className="transition-shadow hover:shadow-sm">

              <CardContent className="p-5">

                <div className="flex items-start justify-between">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground" />

                </div>

                <div className="mt-4">

                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Payment Period
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {settings.payment_start_month}{" "}
                    {settings.payment_start_day}
                    {" → "}
                    {settings.payment_end_month}{" "}
                    {settings.payment_end_day}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Ethiopian Calendar
                  </p>

                </div>

              </CardContent>

            </Card>

          </button>


          {/* Currency */}

          <button
            type="button"
            onClick={() => navigate("calculation")}
            className="text-left"
          >

            <Card className="transition-shadow hover:shadow-sm">

              <CardContent className="p-5">

                <div className="flex items-start justify-between">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40">
                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground" />

                </div>

                <div className="mt-4">

                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Currency
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {settings.currency}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {settings.decimal_places} decimal places
                  </p>

                </div>

              </CardContent>

            </Card>

          </button>


          {/* Penalty */}

          <Card>

            <CardContent className="p-5">

              <div className="flex items-start justify-between">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </div>

                <Badge
                  variant={
                    settings.penalty_enabled
                      ? "default"
                      : "secondary"
                  }
                  className="font-normal"
                >
                  {settings.penalty_enabled
                    ? "Enabled"
                    : "Disabled"}
                </Badge>

              </div>

              <div className="mt-4">

                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Penalty Engine
                </p>

                <p className="mt-1 text-sm font-semibold">
                  Penalty Rules
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Managed separately
                </p>

              </div>

            </CardContent>

          </Card>


          {/* Interest */}

          <Card>

            <CardContent className="p-5">

              <div className="flex items-start justify-between">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40">
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                </div>

                <Badge
                  variant={
                    settings.interest_enabled
                      ? "default"
                      : "secondary"
                  }
                  className="font-normal"
                >
                  {settings.interest_enabled
                    ? "Enabled"
                    : "Disabled"}
                </Badge>

              </div>

              <div className="mt-4">

                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Interest Engine
                </p>

                <p className="mt-1 text-sm font-semibold">
                  Interest Rules
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Managed separately
                </p>

              </div>

            </CardContent>

          </Card>

        </div>


        {/* ========================================================
            WORKSPACE
        ========================================================= */}

        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">


          {/* ======================================================
              SIDEBAR
          ======================================================= */}

          <aside className="h-fit lg:sticky lg:top-6">

            <Card>

              <CardContent className="p-2">

                <div className="px-3 pb-3 pt-2">

                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Configuration
                  </p>

                </div>


                <nav className="space-y-0.5">

                  {NAVIGATION.map((item) => {

                    const Icon = item.icon;

                    const active =
                      activeSection === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          navigate(item.id)
                        }
                        className={[
                          "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                          active
                            ? "bg-muted"
                            : "hover:bg-muted/60",
                        ].join(" ")}
                      >

                        <div
                          className={[
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
                            active
                              ? "bg-background"
                              : "bg-transparent",
                          ].join(" ")}
                        >

                          <Icon
                            className={[
                              "h-4 w-4",
                              active
                                ? "text-foreground"
                                : "text-muted-foreground",
                            ].join(" ")}
                          />

                        </div>

                        <div className="min-w-0 flex-1">

                          <p
                            className={[
                              "truncate text-sm",
                              active
                                ? "font-medium"
                                : "font-normal",
                            ].join(" ")}
                          >
                            {item.label}
                          </p>

                          <p className="truncate text-[11px] text-muted-foreground">
                            {item.description}
                          </p>

                        </div>

                        {active && (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}

                      </button>
                    );
                  })}

                </nav>


                <Separator className="my-3" />


                {/* Policy Links */}

                <div className="px-3 pb-2 pt-1">

                  <p className="text-[11px] leading-4 text-muted-foreground">
                    Penalty and interest policies are managed
                    independently to preserve legal rule separation.
                  </p>

                </div>

              </CardContent>

            </Card>

          </aside>


          {/* ======================================================
              CONTENT
          ======================================================= */}

          <section className="min-w-0">


            {/* ====================================================
                OVERVIEW
            ===================================================== */}

            {activeSection === "overview" && (

              <div className="space-y-6">

                <Card>

                  <CardHeader>

                    <SectionHeader
                      icon={Settings2}
                      eyebrow="System Configuration"
                      title="Revenue Configuration Overview"
                      description="Review the global configuration currently applied across the Revenue Management module."
                    />

                  </CardHeader>


                  <CardContent>

                    <div className="grid gap-4 md:grid-cols-2">

                      <div className="rounded-xl border bg-muted/20 p-5">

                        <div className="flex items-center gap-3">

                          <CalendarDays className="h-4 w-4 text-muted-foreground" />

                          <div>

                            <p className="text-xs text-muted-foreground">
                              Payment Period
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              {settings.payment_start_month}{" "}
                              {settings.payment_start_day}
                              {" → "}
                              {settings.payment_end_month}{" "}
                              {settings.payment_end_day}
                            </p>

                          </div>

                        </div>

                      </div>


                      <div className="rounded-xl border bg-muted/20 p-5">

                        <div className="flex items-center gap-3">

                          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />

                          <div>

                            <p className="text-xs text-muted-foreground">
                              Currency
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              {settings.currency}
                            </p>

                          </div>

                        </div>

                      </div>


                      <div className="rounded-xl border bg-muted/20 p-5">

                        <div className="flex items-center gap-3">

                          <ShieldCheck className="h-4 w-4 text-muted-foreground" />

                          <div>

                            <p className="text-xs text-muted-foreground">
                              Penalty Engine
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              {settings.penalty_enabled
                                ? "Enabled"
                                : "Disabled"}
                            </p>

                          </div>

                        </div>

                      </div>


                      <div className="rounded-xl border bg-muted/20 p-5">

                        <div className="flex items-center gap-3">

                          <Landmark className="h-4 w-4 text-muted-foreground" />

                          <div>

                            <p className="text-xs text-muted-foreground">
                              Interest Engine
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              {settings.interest_enabled
                                ? "Enabled"
                                : "Disabled"}
                            </p>

                          </div>

                        </div>

                      </div>

                    </div>

                  </CardContent>

                </Card>


                {/* Configuration Status */}

                <Card>

                  <CardHeader>

                    <CardTitle className="text-sm">
                      Configuration Status
                    </CardTitle>

                    <CardDescription>
                      Operational status of major revenue components.
                    </CardDescription>

                  </CardHeader>

                  <CardContent className="space-y-1">

                    {[
                      {
                        label: "Payment period",
                        status: true,
                      },
                      {
                        label: "Assessment configuration",
                        status: settings.assessment_auto_calculation,
                      },
                      {
                        label: "Invoice configuration",
                        status: settings.invoice_auto_numbering,
                      },
                      {
                        label: "Payment configuration",
                        status:
                          settings.payment_methods.length > 0,
                      },
                      {
                        label: "Receipt configuration",
                        status: settings.receipt_auto_numbering,
                      },
                    ].map((item) => (

                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-muted/40"
                      >

                        <span className="text-sm">
                          {item.label}
                        </span>

                        {item.status ? (
                          <Badge
                            variant="outline"
                            className="gap-1.5 font-normal"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Configured
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="font-normal"
                          >
                            Review
                          </Badge>
                        )}

                      </div>

                    ))}

                  </CardContent>

                </Card>


                {/* Information */}

                <div className="rounded-xl border bg-background p-4">

                  <div className="flex gap-3">

                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                    <div>

                      <p className="text-sm font-medium">
                        Configuration responsibility
                      </p>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        General Settings controls global system
                        behavior. Penalty rates and interest rates
                        remain in their dedicated policy modules.
                        Invoice due dates are resolved when invoices
                        are created and should be stored on the invoice.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            )}


            {/* ====================================================
                PAYMENT PERIOD
            ===================================================== */}

            {activeSection === "payment-period" && (

              <div className="space-y-6">

                <Card>

                  <CardHeader>

                    <SectionHeader
                      icon={CalendarDays}
                      eyebrow="Revenue Calendar"
                      title="Payment Period"
                      description="Define the global period during which revenue obligations can be paid."
                    />

                  </CardHeader>


                  <CardContent>

                    <div className="grid gap-5 md:grid-cols-2">

                      <div className="space-y-2">

                        <Label>
                          Payment Start
                        </Label>

                        <div className="grid grid-cols-[1fr_100px] gap-2">

                          <Select
                            value={
                              settings.payment_start_month
                            }
                            onValueChange={(value) =>
                              update(
                                "payment_start_month",
                                value,
                              )
                            }
                          >

                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>

                            <SelectContent>

                              {ETHIOPIAN_MONTHS.map(
                                (month) => (
                                  <SelectItem
                                    key={month}
                                    value={month}
                                  >
                                    {month}
                                  </SelectItem>
                                ),
                              )}

                            </SelectContent>

                          </Select>

                          <Input
                            type="number"
                            min={1}
                            max={31}
                            value={
                              settings.payment_start_day
                            }
                            onChange={(event) =>
                              update(
                                "payment_start_day",
                                Number(
                                  event.target.value,
                                ),
                              )
                            }
                          />

                        </div>

                      </div>


                      <div className="space-y-2">

                        <Label>
                          Payment End / Due Date
                        </Label>

                        <div className="grid grid-cols-[1fr_100px] gap-2">

                          <Select
                            value={
                              settings.payment_end_month
                            }
                            onValueChange={(value) =>
                              update(
                                "payment_end_month",
                                value,
                              )
                            }
                          >

                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>

                            <SelectContent>

                              {ETHIOPIAN_MONTHS.map(
                                (month) => (
                                  <SelectItem
                                    key={month}
                                    value={month}
                                  >
                                    {month}
                                  </SelectItem>
                                ),
                              )}

                            </SelectContent>

                          </Select>

                          <Input
                            type="number"
                            min={1}
                            max={31}
                            value={
                              settings.payment_end_day
                            }
                            onChange={(event) =>
                              update(
                                "payment_end_day",
                                Number(
                                  event.target.value,
                                ),
                              )
                            }
                          />

                        </div>

                      </div>

                    </div>


                    <Separator className="my-6" />


                    <SettingRow
                      title="Calendar system"
                      description="Calendar used to interpret the configured revenue payment period."
                    >

                      <Select
                        value={
                          settings.calendar_type
                        }
                        onValueChange={(value) =>
                          update(
                            "calendar_type",
                            value as RevenueSettings["calendar_type"],
                          )
                        }
                      >

                        <SelectTrigger className="w-[210px]">
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>

                          <SelectItem value="ETHIOPIAN">
                            Ethiopian Calendar
                          </SelectItem>

                          <SelectItem value="GREGORIAN">
                            Gregorian Calendar
                          </SelectItem>

                        </SelectContent>

                      </Select>

                    </SettingRow>

                  </CardContent>

                </Card>


                {/* Timeline */}

                <Card>

                  <CardHeader>

                    <CardTitle className="text-sm">
                      Payment Timeline
                    </CardTitle>

                    <CardDescription>
                      Current global revenue collection window.
                    </CardDescription>

                  </CardHeader>

                  <CardContent>

                    <div className="rounded-xl border p-5">

                      <div className="flex items-center gap-3">

                        <div className="rounded-lg border p-2">
                          <CalendarDays className="h-4 w-4" />
                        </div>

                        <div>

                          <p className="text-xs text-muted-foreground">
                            Collection opens
                          </p>

                          <p className="text-sm font-semibold">
                            {settings.payment_start_month}{" "}
                            {settings.payment_start_day}
                          </p>

                        </div>

                        <div className="mx-2 h-px flex-1 bg-border" />

                        <div className="text-right">

                          <p className="text-xs text-muted-foreground">
                            Final due date
                          </p>

                          <p className="text-sm font-semibold">
                            {settings.payment_end_month}{" "}
                            {settings.payment_end_day}
                          </p>

                        </div>

                        <div className="rounded-lg border p-2">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>

                      </div>

                    </div>

                    <div className="mt-4 flex gap-3 rounded-lg border bg-muted/30 p-4">

                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                      <p className="text-sm leading-5 text-muted-foreground">
                        The configured period is used when generating
                        revenue obligations. The resolved actual
                        <strong className="font-medium text-foreground">
                          {" "}due date
                        </strong>
                        {" "}must be persisted on each invoice so
                        historical invoices remain unchanged if this
                        configuration is later modified.
                      </p>

                    </div>

                  </CardContent>

                </Card>


                {/* Penalty / Interest */}

                <Card>

                  <CardHeader>

                    <SectionHeader
                      icon={ShieldCheck}
                      eyebrow="Charge Engines"
                      title="Penalty & Interest"
                      description="Control whether configured penalty and bank-interest policies are active globally."
                    />

                  </CardHeader>

                  <CardContent>

                    <SettingRow
                      title="Penalty calculation"
                      description="Allow active penalty policies to be applied to overdue revenue."
                    >

                      <Switch
                        checked={
                          settings.penalty_enabled
                        }
                        onCheckedChange={(value) =>
                          update(
                            "penalty_enabled",
                            value,
                          )
                        }
                      />

                    </SettingRow>

                    <Separator />

                    <SettingRow
                      title="Interest calculation"
                      description="Allow active bank-interest policies to be applied according to their configured basis."
                    >

                      <Switch
                        checked={
                          settings.interest_enabled
                        }
                        onCheckedChange={(value) =>
                          update(
                            "interest_enabled",
                            value,
                          )
                        }
                      />

                    </SettingRow>

                  </CardContent>

                </Card>

              </div>

            )}


            {/* ====================================================
                CALCULATION
            ===================================================== */}

            {activeSection === "calculation" && (

              <Card>

                <CardHeader>

                  <SectionHeader
                    icon={CircleDollarSign}
                    eyebrow="Financial Engine"
                    title="Calculation Settings"
                    description="Define the financial conventions used consistently throughout Revenue Management."
                  />

                </CardHeader>

                <CardContent>

                  <div className="grid gap-5 md:grid-cols-2">

                    <div className="space-y-2">

                      <Label>
                        Currency
                      </Label>

                      <Select
                        value={settings.currency}
                        onValueChange={(value) =>
                          update(
                            "currency",
                            value,
                          )
                        }
                      >

                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>

                          <SelectItem value="ETB">
                            Ethiopian Birr (ETB)
                          </SelectItem>

                          <SelectItem value="USD">
                            US Dollar (USD)
                          </SelectItem>

                        </SelectContent>

                      </Select>

                    </div>


                    <div className="space-y-2">

                      <Label>
                        Decimal Places
                      </Label>

                      <Input
                        type="number"
                        min={0}
                        max={6}
                        value={settings.decimal_places}
                        onChange={(event) =>
                          update(
                            "decimal_places",
                            Number(
                              event.target.value,
                            ),
                          )
                        }
                      />

                    </div>


                    <div className="space-y-2">

                      <Label>
                        Percentage Precision
                      </Label>

                      <Input
                        type="number"
                        min={0}
                        max={8}
                        value={
                          settings.percentage_precision
                        }
                        onChange={(event) =>
                          update(
                            "percentage_precision",
                            Number(
                              event.target.value,
                            ),
                          )
                        }
                      />

                    </div>


                    <div className="space-y-2">

                      <Label>
                        Rounding Mode
                      </Label>

                      <Select
                        value={settings.rounding_mode}
                        onValueChange={(value) =>
                          update(
                            "rounding_mode",
                            value as RevenueSettings["rounding_mode"],
                          )
                        }
                      >

                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>

                          <SelectItem value="HALF_UP">
                            Half Up
                          </SelectItem>

                          <SelectItem value="HALF_DOWN">
                            Half Down
                          </SelectItem>

                          <SelectItem value="HALF_EVEN">
                            Half Even
                          </SelectItem>

                          <SelectItem value="UP">
                            Up
                          </SelectItem>

                          <SelectItem value="DOWN">
                            Down
                          </SelectItem>

                        </SelectContent>

                      </Select>

                    </div>

                  </div>


                  <Separator className="my-6" />


                  <SettingRow
                    title="Calculation order"
                    description="Defines how the revenue engine applies configured penalty and interest calculations."
                  >

                    <Select
                      value={
                        settings.calculation_order
                      }
                      onValueChange={(value) =>
                        update(
                          "calculation_order",
                          value as RevenueSettings["calculation_order"],
                        )
                      }
                    >

                      <SelectTrigger className="w-[250px]">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>

                        <SelectItem value="PENALTY_THEN_INTEREST">
                          Penalty → Interest
                        </SelectItem>

                        <SelectItem value="INTEREST_THEN_PENALTY">
                          Interest → Penalty
                        </SelectItem>

                      </SelectContent>

                    </Select>

                  </SettingRow>

                </CardContent>

              </Card>

            )}


            {/* ====================================================
                ASSESSMENT
            ===================================================== */}

            {activeSection === "assessment" && (

              <Card>

                <CardHeader>

                  <SectionHeader
                    icon={FileCheck2}
                    eyebrow="Assessment Engine"
                    title="Assessment Settings"
                    description="Control how revenue assessments are calculated, adjusted and approved."
                  />

                </CardHeader>

                <CardContent>

                  <SettingRow
                    title="Automatic calculation"
                    description="Use the backend Decision Provider to calculate assessment amounts."
                  >

                    <Switch
                      checked={
                        settings.assessment_auto_calculation
                      }
                      onCheckedChange={(value) =>
                        update(
                          "assessment_auto_calculation",
                          value,
                        )
                      }
                    />

                  </SettingRow>

                  <Separator />

                  <SettingRow
                    title="Manual adjustment"
                    description="Allow authorized users to adjust calculated assessment values."
                  >

                    <Switch
                      checked={
                        settings.assessment_manual_adjustment
                      }
                      onCheckedChange={(value) =>
                        update(
                          "assessment_manual_adjustment",
                          value,
                        )
                      }
                    />

                  </SettingRow>

                  <Separator />

                  <SettingRow
                    title="Approval required"
                    description="Require an assessment to be approved before it becomes finalized."
                  >

                    <Switch
                      checked={
                        settings.assessment_requires_approval
                      }
                      onCheckedChange={(value) =>
                        update(
                          "assessment_requires_approval",
                          value,
                        )
                      }
                    />

                  </SettingRow>

                  <Separator />

                  <SettingRow
                    title="Reassessment allowed"
                    description="Allow authorized users to create a reassessment when permitted."
                  >

                    <Switch
                      checked={
                        settings.assessment_reassessment_allowed
                      }
                      onCheckedChange={(value) =>
                        update(
                          "assessment_reassessment_allowed",
                          value,
                        )
                      }
                    />

                  </SettingRow>

                </CardContent>

              </Card>

            )}


            {/* ====================================================
                INVOICE
            ===================================================== */}

            {activeSection === "invoice" && (

              <Card>

                <CardHeader>

                  <SectionHeader
                    icon={FileText}
                    eyebrow="Invoice Management"
                    title="Invoice Settings"
                    description="Configure invoice numbering and payment behavior."
                  />

                </CardHeader>

                <CardContent>

                  <SettingRow
                    title="Automatic numbering"
                    description="Generate invoice numbers automatically."
                  >

                    <Switch
                      checked={
                        settings.invoice_auto_numbering
                      }
                      onCheckedChange={(value) =>
                        update(
                          "invoice_auto_numbering",
                          value,
                        )
                      }
                    />

                  </SettingRow>


                  <Separator />


                  <div className="py-5">

                    <Label>
                      Invoice prefix
                    </Label>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Prefix used for generated invoice numbers.
                    </p>

                    <Input
                      className="mt-3 max-w-xs"
                      value={
                        settings.invoice_prefix
                      }
                      onChange={(event) =>
                        update(
                          "invoice_prefix",
                          event.target.value
                            .toUpperCase(),
                        )
                      }
                    />

                  </div>


                  <Separator />


                  <SettingRow
                    title="Allow partial payment"
                    description="Allow taxpayers to settle an invoice through multiple payments."
                  >

                    <Switch
                      checked={
                        settings.invoice_allow_partial_payment
                      }
                      onCheckedChange={(value) =>
                        update(
                          "invoice_allow_partial_payment",
                          value,
                        )
                      }
                    />

                  </SettingRow>


                  <Separator />


                  <SettingRow
                    title="Allow overpayment"
                    description="Allow a payment amount greater than the outstanding invoice balance."
                  >

                    <Switch
                      checked={
                        settings.invoice_allow_overpayment
                      }
                      onCheckedChange={(value) =>
                        update(
                          "invoice_allow_overpayment",
                          value,
                        )
                      }
                    />

                  </SettingRow>


                  <Separator />


                  <SettingRow
                    title="Allow overdue payment"
                    description="Allow payment against an invoice after its configured due date."
                  >

                    <Switch
                      checked={
                        settings.invoice_allow_overdue_payment
                      }
                      onCheckedChange={(value) =>
                        update(
                          "invoice_allow_overdue_payment",
                          value,
                        )
                      }
                    />

                  </SettingRow>

                </CardContent>

              </Card>

            )}


            {/* ====================================================
                PAYMENT
            ===================================================== */}

            {activeSection === "payment" && (

              <div className="space-y-6">

                <Card>

                  <CardHeader>

                    <SectionHeader
                      icon={WalletCards}
                      eyebrow="Payment Processing"
                      title="Payment Settings"
                      description="Configure how revenue payments are accepted and finalized."
                    />

                  </CardHeader>

                  <CardContent>

                    <SettingRow
                      title="Payment confirmation required"
                      description="Require confirmation before a payment transaction is finalized."
                    >

                      <Switch
                        checked={
                          settings.payment_confirmation_required
                        }
                        onCheckedChange={(value) =>
                          update(
                            "payment_confirmation_required",
                            value,
                          )
                        }
                      />

                    </SettingRow>

                    <Separator />

                    <SettingRow
                      title="Automatic receipt"
                      description="Generate a receipt automatically after successful payment."
                    >

                      <Switch
                        checked={
                          settings.payment_auto_receipt
                        }
                        onCheckedChange={(value) =>
                          update(
                            "payment_auto_receipt",
                            value,
                          )
                        }
                      />

                    </SettingRow>

                    <Separator />

                    <SettingRow
                      title="Allow partial payment"
                      description="Allow taxpayers to pay less than the total outstanding balance."
                    >

                      <Switch
                        checked={
                          settings.payment_allow_partial
                        }
                        onCheckedChange={(value) =>
                          update(
                            "payment_allow_partial",
                            value,
                          )
                        }
                      />

                    </SettingRow>

                  </CardContent>

                </Card>


                <Card>

                  <CardHeader>

                    <CardTitle className="text-sm">
                      Payment Methods
                    </CardTitle>

                    <CardDescription>
                      Select the payment channels available
                      across Revenue Management.
                    </CardDescription>

                  </CardHeader>


                  <CardContent>

                    <div className="grid gap-3 md:grid-cols-2">

                      {[
                        {
                          id: "CASH" as PaymentMethod,
                          label: "Cash",
                          description:
                            "Payment at authorized collection offices.",
                          icon: Banknote,
                        },

                        {
                          id: "BANK" as PaymentMethod,
                          label: "Bank",
                          description:
                            "Payment through supported banks.",
                          icon: Landmark,
                        },

                        {
                          id: "MOBILE_MONEY" as PaymentMethod,
                          label: "Mobile Money",
                          description:
                            "Payment through supported mobile channels.",
                          icon: WalletCards,
                        },

                        {
                          id: "CARD" as PaymentMethod,
                          label: "Card",
                          description:
                            "Debit or credit card payment.",
                          icon: WalletCards,
                        },

                      ].map((method) => {

                        const Icon = method.icon;

                        const checked =
                          settings.payment_methods.includes(
                            method.id,
                          );

                        return (
                          <label
                            key={method.id}
                            className={[
                              "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                              checked
                                ? "bg-muted/40"
                                : "hover:bg-muted/30",
                            ].join(" ")}
                          >

                            <Checkbox
                              checked={checked}
                              onCheckedChange={() =>
                                togglePaymentMethod(
                                  method.id,
                                )
                              }
                            />

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-background">

                              <Icon className="h-4 w-4 text-muted-foreground" />

                            </div>

                            <div className="min-w-0">

                              <p className="text-sm font-medium">
                                {method.label}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                {method.description}
                              </p>

                            </div>

                          </label>
                        );
                      })}

                    </div>

                  </CardContent>

                </Card>

              </div>

            )}


            {/* ====================================================
                RECEIPT
            ===================================================== */}

            {activeSection === "receipt" && (

              <Card>

                <CardHeader>

                  <SectionHeader
                    icon={Receipt}
                    eyebrow="Receipt Management"
                    title="Receipt Settings"
                    description="Configure receipt numbering and post-payment receipt behavior."
                  />

                </CardHeader>

                <CardContent>

                  <SettingRow
                    title="Automatic numbering"
                    description="Generate receipt numbers automatically after successful payment."
                  >

                    <Switch
                      checked={
                        settings.receipt_auto_numbering
                      }
                      onCheckedChange={(value) =>
                        update(
                          "receipt_auto_numbering",
                          value,
                        )
                      }
                    />

                  </SettingRow>


                  <Separator />


                  <div className="py-5">

                    <Label>
                      Receipt prefix
                    </Label>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Prefix used when generating receipt numbers.
                    </p>

                    <Input
                      className="mt-3 max-w-xs"
                      value={
                        settings.receipt_prefix
                      }
                      onChange={(event) =>
                        update(
                          "receipt_prefix",
                          event.target.value
                            .toUpperCase(),
                        )
                      }
                    />

                  </div>


                  <Separator />


                  <SettingRow
                    title="Allow receipt reprint"
                    description="Allow authorized users to reprint previously issued receipts."
                  >

                    <Switch
                      checked={
                        settings.receipt_allow_reprint
                      }
                      onCheckedChange={(value) =>
                        update(
                          "receipt_allow_reprint",
                          value,
                        )
                      }
                    />

                  </SettingRow>

                </CardContent>

              </Card>

            )}

          </section>

        </div>

      </main>


      {/* ==========================================================
          STICKY SAVE BAR
      =========================================================== */}

      {isDirty && (

        <div className="sticky bottom-0 z-30 border-t bg-background/95 backdrop-blur">

          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-6 py-3">

            <div className="flex items-center gap-3">

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">

                <AlertCircle className="h-4 w-4 text-amber-600" />

              </div>

              <div className="hidden sm:block">

                <p className="text-sm font-medium">
                  Unsaved configuration changes
                </p>

                <p className="text-xs text-muted-foreground">
                  Save your changes before leaving this page.
                </p>

              </div>

            </div>


            <div className="flex items-center gap-2">

              <Button
                variant="ghost"
                size="sm"
                onClick={resetSettings}
              >
                Discard
              </Button>

              <Button
                size="sm"
                onClick={saveSettings}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}