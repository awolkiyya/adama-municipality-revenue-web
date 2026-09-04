"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileText,
  Info,
  Landmark,
  Loader2,
  Receipt,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
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

import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import { EthiopianDatePicker } from "@/components/input/EthiopianDatePicker";

import {
  useRevenueSettings,
  useUpdateRevenueSettings,
} from "@/hooks/revenue/revenueSetting.hook";

import type {
  PaymentMethod,
  RevenueSettingResource,
  UpdateRevenueSettingPayload,
} from "@/types/revenue/revenueSetting";


/*
|--------------------------------------------------------------------------
| Settings Section
|--------------------------------------------------------------------------
*/

type SettingsSection =
  | "overview"
  | "payment-period"
  | "assessment"
  | "invoice"
  | "payment"
  | "receipt";


/*
|--------------------------------------------------------------------------
| Ethiopian Months
|--------------------------------------------------------------------------
|
| API stores months as integers:
|
| 1  = Fulbaana
| 2  = Onkololeessa
| ...
| 13 = Pagume
|
| These names are presentation-only.
|
*/

const ETHIOPIAN_MONTHS = [
  { value: 1, label: "Fulbaana" },
  { value: 2, label: "Onkololeessa" },
  { value: 3, label: "Sadaasa" },
  { value: 4, label: "Muddee" },
  { value: 5, label: "Amajjii" },
  { value: 6, label: "Guraandhala" },
  { value: 7, label: "Bitootessa" },
  { value: 8, label: "Elba" },
  { value: 9, label: "Caamsaa" },
  { value: 10, label: "Waxabajjii" },
  { value: 11, label: "Adooleessa" },
  { value: 12, label: "Hagayya" },
  { value: 13, label: "Pagume" },
] as const;


/*
|--------------------------------------------------------------------------
| Payment Method Metadata
|--------------------------------------------------------------------------
*/

const PAYMENT_METHOD_OPTIONS: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: "CASH",
    label: "Cash",
    description:
      "Payment at authorized collection offices.",
    icon: Banknote,
  },
  {
    id: "BANK",
    label: "Bank",
    description:
      "Payment through supported banks.",
    icon: Landmark,
  },
  {
    id: "MOBILE_MONEY",
    label: "Mobile Money",
    description:
      "Payment through supported mobile channels.",
    icon: WalletCards,
  },
  {
    id: "CARD",
    label: "Card",
    description:
      "Payment through supported card channels.",
    icon: WalletCards,
  },
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
| Helpers
|--------------------------------------------------------------------------
*/

function monthName(
  month: number | null | undefined,
): string {
  if (!month) {
    return "Not configured";
  }

  return (
    ETHIOPIAN_MONTHS.find(
      (item) => item.value === month,
    )?.label ?? `Month ${month}`
  );
}


function formatEthiopianDate(
  month: number | null | undefined,
  day: number | null | undefined,
): string {
  if (!month || !day) {
    return "Not configured";
  }

  return `${monthName(month)} ${day}`;
}


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

  /*
  |--------------------------------------------------------------------------
  | API
  |--------------------------------------------------------------------------
  */

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useRevenueSettings();


  const updateRevenueSettings =
    useUpdateRevenueSettings();


  /*
  |--------------------------------------------------------------------------
  | Server Configuration
  |--------------------------------------------------------------------------
  */

  const serverSettings =
    data?.data ?? null;


  /*
  |--------------------------------------------------------------------------
  | Local Editable Settings
  |--------------------------------------------------------------------------
  */

  const [settings, setSettings] =
    useState<RevenueSettingResource | null>(
      null,
    );


  /*
  |--------------------------------------------------------------------------
  | Last Saved Snapshot
  |--------------------------------------------------------------------------
  */

  const [savedSettings, setSavedSettings] =
    useState<RevenueSettingResource | null>(
      null,
    );


  /*
  |--------------------------------------------------------------------------
  | Active Section
  |--------------------------------------------------------------------------
  */

  const [activeSection, setActiveSection] =
    useState<SettingsSection>("overview");


  /*
  |--------------------------------------------------------------------------
  | Sync API -> Local State
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (!serverSettings) {
      return;
    }

    const normalized: RevenueSettingResource = {
      ...serverSettings,

      enabled_payment_methods:
        Array.isArray(
          serverSettings.enabled_payment_methods,
        )
          ? serverSettings.enabled_payment_methods
          : [],
    };

    setSettings(normalized);
    setSavedSettings(normalized);

  }, [serverSettings]);


  /*
  |--------------------------------------------------------------------------
  | Dirty State
  |--------------------------------------------------------------------------
  */

  const isDirty = useMemo(() => {

    if (!settings || !savedSettings) {
      return false;
    }

    return (
      JSON.stringify(settings) !==
      JSON.stringify(savedSettings)
    );

  }, [
    settings,
    savedSettings,
  ]);


  /*
  |--------------------------------------------------------------------------
  | Generic Update
  |--------------------------------------------------------------------------
  */

  function update<K extends keyof RevenueSettingResource>(
    key: K,
    value: RevenueSettingResource[K],
  ) {

    setSettings((current) => {

      if (!current) {
        return current;
      }

      return {
        ...current,
        [key]: value,
      };

    });

  }


  /*
  |--------------------------------------------------------------------------
  | Reset
  |--------------------------------------------------------------------------
  */

  function resetSettings() {

    if (!savedSettings) {
      return;
    }

    setSettings({
      ...savedSettings,

      enabled_payment_methods: [
        ...savedSettings.enabled_payment_methods,
      ],
    });

  }


  /*
  |--------------------------------------------------------------------------
  | Build Update Payload
  |--------------------------------------------------------------------------
  */

  function buildUpdatePayload(
    current: RevenueSettingResource,
  ): UpdateRevenueSettingPayload {

    return {

      /*
      |--------------------------------------------------------------------------
      | Payment Period
      |--------------------------------------------------------------------------
      */

      payment_start_month:
        current.payment_start_month,

      payment_start_day:
        current.payment_start_day,

      payment_end_month:
        current.payment_end_month,

      payment_end_day:
        current.payment_end_day,


      /*
      |--------------------------------------------------------------------------
      | Penalty / Interest
      |--------------------------------------------------------------------------
      */

      penalty_enabled:
        current.penalty_enabled,

      interest_enabled:
        current.interest_enabled,


      /*
      |--------------------------------------------------------------------------
      | Assessment
      |--------------------------------------------------------------------------
      */

      assessment_auto_calculation:
        current.assessment_auto_calculation,

      assessment_allow_manual_adjustment:
        current.assessment_allow_manual_adjustment,

      assessment_requires_approval:
        current.assessment_requires_approval,

      assessment_reassessment_allowed:
        current.assessment_reassessment_allowed,


      /*
      |--------------------------------------------------------------------------
      | Invoice
      |--------------------------------------------------------------------------
      */

      invoice_auto_numbering:
        current.invoice_auto_numbering,

      invoice_prefix:
        current.invoice_prefix.trim(),

      invoice_allow_overpayment:
        current.invoice_allow_overpayment,

      invoice_allow_overdue_payment:
        current.invoice_allow_overdue_payment,


      /*
      |--------------------------------------------------------------------------
      | Payment
      |--------------------------------------------------------------------------
      */

      payment_confirmation_required:
        current.payment_confirmation_required,

      payment_auto_receipt:
        current.payment_auto_receipt,

      enabled_payment_methods:
        current.enabled_payment_methods,


      /*
      |--------------------------------------------------------------------------
      | Receipt
      |--------------------------------------------------------------------------
      */

      receipt_auto_numbering:
        current.receipt_auto_numbering,

      receipt_prefix:
        current.receipt_prefix.trim(),

      receipt_allow_reprint:
        current.receipt_allow_reprint,


      /*
      |--------------------------------------------------------------------------
      | Metadata
      |--------------------------------------------------------------------------
      */

      legal_reference:
        current.legal_reference,

      description:
        current.description,

    };

  }


  /*
  |--------------------------------------------------------------------------
  | Save
  |--------------------------------------------------------------------------
  */

  function saveSettings() {

    if (!settings) {
      return;
    }

    if (!settings.id) {
      return;
    }

    updateRevenueSettings.mutate({
      id: settings.id,

      data:
        buildUpdatePayload(settings),
    });

  }


  /*
  |--------------------------------------------------------------------------
  | Payment Method
  |--------------------------------------------------------------------------
  */

  function togglePaymentMethod(
    method: PaymentMethod,
  ) {

    if (!settings) {
      return;
    }

    const currentMethods =
      settings.enabled_payment_methods ?? [];


    const exists =
      currentMethods.includes(method);


    const next = exists
      ? currentMethods.filter(
          (item) => item !== method,
        )
      : [
          ...currentMethods,
          method,
        ];


    /*
    |--------------------------------------------------------------------------
    | Prevent Empty Payment Methods
    |--------------------------------------------------------------------------
    |
    | Backend requires at least one enabled method.
    |
    */

    if (
      exists &&
      currentMethods.length === 1
    ) {
      return;
    }


    update(
      "enabled_payment_methods",
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
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (isLoading) {

    return (
      <div className="flex min-h-[60vh] items-center justify-center">

        <div className="flex flex-col items-center gap-3 text-center">

          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />

          <div>

            <p className="text-sm font-medium">
              Loading revenue settings
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Retrieving the active Revenue Management configuration.
            </p>

          </div>

        </div>

      </div>
    );

  }


  /*
  |--------------------------------------------------------------------------
  | Error State
  |--------------------------------------------------------------------------
  */

  if (isError || !settings) {

    return (
      <div className="min-h-[60vh] bg-muted/20">

        <div className="mx-auto flex max-w-xl items-center justify-center px-6 py-20">

          <Card className="w-full">

            <CardHeader>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted/40">

                <AlertCircle className="h-5 w-5 text-muted-foreground" />

              </div>

              <CardTitle className="mt-4 text-base">
                Unable to load revenue settings
              </CardTitle>

              <CardDescription>
                The active Revenue Management configuration
                could not be retrieved.
              </CardDescription>

            </CardHeader>

            <CardContent>

              <Button
                variant="outline"
                onClick={() => refetch()}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>

              {error && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {error instanceof Error
                    ? error.message
                    : "An unexpected error occurred."}
                </p>
              )}

            </CardContent>

          </Card>

        </div>

      </div>
    );

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
                    {settings.is_active
                      ? "Active"
                      : "Inactive"}
                  </Badge>

                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Manage global configuration and operational
                  behavior for the Revenue Management system.
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
                disabled={
                  !isDirty ||
                  updateRevenueSettings.isPending
                }
                onClick={resetSettings}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>


              <Button
                size="sm"
                disabled={
                  !isDirty ||
                  updateRevenueSettings.isPending
                }
                onClick={saveSettings}
              >

                {updateRevenueSettings.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : updateRevenueSettings.isSuccess && !isDirty ? (
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
            onClick={() =>
              navigate("payment-period")
            }
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

                    {formatEthiopianDate(
                      settings.payment_start_month,
                      settings.payment_start_day,
                    )}

                    {" → "}

                    {formatEthiopianDate(
                      settings.payment_end_month,
                      settings.payment_end_day,
                    )}

                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Ethiopian Calendar
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


          {/* Payment Methods */}

          <button
            type="button"
            onClick={() =>
              navigate("payment")
            }
            className="text-left"
          >

            <Card className="transition-shadow hover:shadow-sm">

              <CardContent className="p-5">

                <div className="flex items-start justify-between">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/40">

                    <WalletCards className="h-4 w-4 text-muted-foreground" />

                  </div>

                  <ArrowRight className="h-4 w-4 text-muted-foreground" />

                </div>

                <div className="mt-4">

                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Payment Methods
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {settings.enabled_payment_methods.length}{" "}
                    enabled
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Available payment channels
                  </p>

                </div>

              </CardContent>

            </Card>

          </button>

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


                <div className="px-3 pb-2 pt-1">

                  <p className="text-[11px] leading-4 text-muted-foreground">
                    Tariff, penalty, and interest calculation rules
                    are managed independently from global settings.
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


                      {/* Payment Period */}

                      <div className="rounded-xl border bg-muted/20 p-5">

                        <div className="flex items-center gap-3">

                          <CalendarDays className="h-4 w-4 text-muted-foreground" />

                          <div>

                            <p className="text-xs text-muted-foreground">
                              Payment Period
                            </p>

                            <p className="mt-1 text-sm font-semibold">

                              {formatEthiopianDate(
                                settings.payment_start_month,
                                settings.payment_start_day,
                              )}

                              {" → "}

                              {formatEthiopianDate(
                                settings.payment_end_month,
                                settings.payment_end_day,
                              )}

                            </p>

                          </div>

                        </div>

                      </div>


                      {/* Penalty */}

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


                      {/* Interest */}

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


                      {/* Payment Methods */}

                      <div className="rounded-xl border bg-muted/20 p-5">

                        <div className="flex items-center gap-3">

                          <WalletCards className="h-4 w-4 text-muted-foreground" />

                          <div>

                            <p className="text-xs text-muted-foreground">
                              Payment Methods
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              {settings.enabled_payment_methods.length}{" "}
                              enabled
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
                        status:
                          settings.payment_start_month !== null &&
                          settings.payment_start_day !== null &&
                          settings.payment_end_month !== null &&
                          settings.payment_end_day !== null,
                      },
                      {
                        label: "Assessment configuration",
                        status:
                          settings.assessment_auto_calculation,
                      },
                      {
                        label: "Invoice configuration",
                        status:
                          settings.invoice_auto_numbering &&
                          settings.invoice_prefix.trim().length > 0,
                      },
                      {
                        label: "Payment configuration",
                        status:
                          settings.enabled_payment_methods.length > 0,
                      },
                      {
                        label: "Receipt configuration",
                        status:
                          settings.receipt_auto_numbering &&
                          settings.receipt_prefix.trim().length > 0,
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

                        General Settings controls global operational
                        behavior. Tariff calculation controls are
                        configured on individual tariff rules.
                        Penalty and interest rates are managed in
                        their dedicated policy modules. Invoice due
                        dates are resolved when invoices are created
                        and persisted on the invoice.

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


                      {/* Start */}

                      <div className="space-y-3">

                        <Label>
                          Payment Start
                        </Label>

                        <div className="rounded-xl border bg-muted/20 p-4">

                          <p className="text-sm font-medium">
                            {formatEthiopianDate(
                              settings.payment_start_month,
                              settings.payment_start_day,
                            )}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Ethiopian calendar date
                          </p>

                        </div>

                        <EthiopianDatePicker />

                        <div className="grid grid-cols-2 gap-3">

                          <div className="space-y-2">

                            <Label className="text-xs">
                              Month
                            </Label>

                            <select
                              value={
                                settings.payment_start_month ??
                                ""
                              }
                              onChange={(event) =>
                                update(
                                  "payment_start_month",
                                  event.target.value
                                    ? Number(event.target.value)
                                    : null,
                                )
                              }
                              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                            >

                              <option value="">
                                Select month
                              </option>

                              {ETHIOPIAN_MONTHS.map(
                                (month) => (
                                  <option
                                    key={month.value}
                                    value={month.value}
                                  >
                                    {month.label}
                                  </option>
                                ),
                              )}

                            </select>

                          </div>


                          <div className="space-y-2">

                            <Label className="text-xs">
                              Day
                            </Label>

                            <Input
                              type="number"
                              min={1}
                              max={
                                settings.payment_start_month ===
                                13
                                  ? 6
                                  : 30
                              }
                              value={
                                settings.payment_start_day ??
                                ""
                              }
                              onChange={(event) =>
                                update(
                                  "payment_start_day",
                                  event.target.value
                                    ? Number(event.target.value)
                                    : null,
                                )
                              }
                            />

                          </div>

                        </div>

                      </div>


                      {/* End */}

                      <div className="space-y-3">

                        <Label>
                          Payment End / Due Date
                        </Label>

                        <div className="rounded-xl border bg-muted/20 p-4">

                          <p className="text-sm font-medium">
                            {formatEthiopianDate(
                              settings.payment_end_month,
                              settings.payment_end_day,
                            )}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Ethiopian calendar date
                          </p>

                        </div>

                        <EthiopianDatePicker />

                        <div className="grid grid-cols-2 gap-3">

                          <div className="space-y-2">

                            <Label className="text-xs">
                              Month
                            </Label>

                            <select
                              value={
                                settings.payment_end_month ??
                                ""
                              }
                              onChange={(event) =>
                                update(
                                  "payment_end_month",
                                  event.target.value
                                    ? Number(event.target.value)
                                    : null,
                                )
                              }
                              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                            >

                              <option value="">
                                Select month
                              </option>

                              {ETHIOPIAN_MONTHS.map(
                                (month) => (
                                  <option
                                    key={month.value}
                                    value={month.value}
                                  >
                                    {month.label}
                                  </option>
                                ),
                              )}

                            </select>

                          </div>


                          <div className="space-y-2">

                            <Label className="text-xs">
                              Day
                            </Label>

                            <Input
                              type="number"
                              min={1}
                              max={
                                settings.payment_end_month ===
                                13
                                  ? 6
                                  : 30
                              }
                              value={
                                settings.payment_end_day ??
                                ""
                              }
                              onChange={(event) =>
                                update(
                                  "payment_end_day",
                                  event.target.value
                                    ? Number(event.target.value)
                                    : null,
                                )
                              }
                            />

                          </div>

                        </div>

                      </div>

                    </div>


                    <Separator className="my-6" />

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

                            {formatEthiopianDate(
                              settings.payment_start_month,
                              settings.payment_start_day,
                            )}

                          </p>

                        </div>

                        <div className="mx-2 h-px flex-1 bg-border" />

                        <div className="text-right">

                          <p className="text-xs text-muted-foreground">
                            Final due date
                          </p>

                          <p className="text-sm font-semibold">

                            {formatEthiopianDate(
                              settings.payment_end_month,
                              settings.payment_end_day,
                            )}

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
                      description="Control whether configured penalty and interest policies are active globally."
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
                      description="Allow active interest policies to be applied according to their configured basis."
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
                        settings.assessment_allow_manual_adjustment
                      }
                      onCheckedChange={(value) =>
                        update(
                          "assessment_allow_manual_adjustment",
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
                      Invoice Prefix
                    </Label>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Prefix used for generated invoice numbers.
                    </p>

                    <Input
                      className="mt-3 w-full py-5"
                      value={
                        settings.invoice_prefix
                      }
                      onChange={(event) =>
                        update(
                          "invoice_prefix",
                          event.target.value.toUpperCase(),
                        )
                      }
                    />

                  </div>


                  <Separator />


                  <SettingRow
                    title="Allow overpayment"
                    description="Allow a payment amount to exceed the invoice outstanding balance."
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

                  </CardContent>

                </Card>


                {/* Payment Methods */}

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

                    <div className="grid gap-3">

                      {PAYMENT_METHOD_OPTIONS.map(
                        (method) => {

                          const Icon =
                            method.icon;

                          const checked =
                            settings.enabled_payment_methods.includes(
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
                                disabled={
                                  checked &&
                                  settings.enabled_payment_methods.length ===
                                    1
                                }
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

                        },
                      )}

                    </div>

                    <div className="mt-4 flex gap-3 rounded-lg border bg-muted/30 p-4">

                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                      <p className="text-xs leading-5 text-muted-foreground">
                        At least one payment method must remain enabled.
                        Payment-method-specific configuration can be
                        managed independently when required.
                      </p>

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
                      Receipt Prefix
                    </Label>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Prefix used when generating receipt numbers.
                    </p>

                    <Input
                      className="mt-3 w-full py-5"
                      value={
                        settings.receipt_prefix
                      }
                      onChange={(event) =>
                        update(
                          "receipt_prefix",
                          event.target.value.toUpperCase(),
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
                disabled={
                  updateRevenueSettings.isPending
                }
                onClick={resetSettings}
              >
                Discard
              </Button>


              <Button
                size="sm"
                disabled={
                  updateRevenueSettings.isPending
                }
                onClick={saveSettings}
              >

                {updateRevenueSettings.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
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

      )}

    </div>
  );
}
