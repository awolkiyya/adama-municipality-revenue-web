"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  History,
  Landmark,
  MapPin,
  Search,
  ShieldCheck,
  User,
  Wallet,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type Step = 1 | 2 | 3;

const steps = [
  {
    id: 1,
    title: "Agreement",
    description: "Existing agreement details",
    icon: FileText,
  },
  {
    id: 2,
    title: "Financial Position",
    description: "Historical starting balance",
    icon: CircleDollarSign,
  },
  {
    id: 3,
    title: "Review & Register",
    description: "Verify and activate",
    icon: ClipboardCheck,
  },
];

/**
 * ===============================================================
 * REVENUE SERVICES
 * ===============================================================
 *
 * Temporary frontend mock.
 *
 * In production:
 * - Load these from the Laravel API.
 * - User selects Revenue Service.
 * - Revenue Code is resolved by the backend/service configuration.
 * - Do NOT allow the user to manually edit Revenue Code.
 */
const revenueServices = [
  {
    id: "lizz-land-lease",
    name: "Land Lease (LIZZ)",
    code: "1731",
    description: "Land lease revenue under LIZZ agreements",
  },
  {
    id: "other-land-lease",
    name: "Other Land Lease",
    code: "1732",
    description: "Other land lease related revenue",
  },
];

/**
 * ===============================================================
 * TAXPAYERS
 * ===============================================================
 *
 * Temporary frontend mock representing the EXISTING taxpayer master
 * data in the system.
 *
 * IMPORTANT:
 * The agreement does NOT store taxpayerName or taxpayerTin.
 * It stores taxpayerId only.
 *
 * In production replace this with:
 *
 * useQuery({
 *   queryKey: ["taxpayers", search],
 *   queryFn: () => taxpayerApi.search(search),
 * })
 *
 * The taxpayer master record remains the source of truth.
 */
const taxpayers = [
  {
    id: "taxpayer-001",
    name: "Abebe Construction PLC",
    tin: "0012345678",
    type: "Organization",
  },
  {
    id: "taxpayer-002",
    name: "Oromia Development Enterprise",
    tin: "0023456789",
    type: "Organization",
  },
  {
    id: "taxpayer-003",
    name: "Mohammed Ali",
    tin: "0034567890",
    type: "Individual",
  },
  {
    id: "taxpayer-004",
    name: "Adama Agricultural Investment",
    tin: "0045678901",
    type: "Organization",
  },
];

/* ===============================================================
   HELPERS
================================================================ */

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/* ===============================================================
   PAGE
================================================================ */

function ExistingPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [registered, setRegistered] = useState(false);

  /**
   * =============================================================
   * AGREEMENT
   * =============================================================
   *
   * Notice:
   *
   * taxpayerId
   *     ↓
   * existing taxpayer master record
   *     ↓
   * name / TIN / type
   *
   * We do NOT duplicate taxpayerName or taxpayerTin here.
   */
  const [agreement, setAgreement] = useState({
    agreementNumber: "LIZZ-2020-00125",
    agreementDate: "2020-06-01",

    taxpayerId: "taxpayer-001",

    landHoldingNumber: "AD-LZ-004821",
    landArea: "500",

    /**
     * Legal lease duration.
     *
     * Example:
     * Lease Period = 40 years
     */
    leasePeriod: "40",

    /**
     * Historical payment completion period.
     *
     * Example:
     * Lease Period = 40 years
     * Payment Completion Period = 10 years
     */
    paymentCompletionPeriod: "10",

    /**
     * Historical payment completion date.
     */
    paymentCompletionDate: "2030-06-01",

    location: "Bole Arabsa, Adama",

    /**
     * Select SERVICE, not revenue code.
     */
    revenueServiceId: "lizz-land-lease",

    source: "Municipal Record",

    notes:
      "Existing LIZZ agreement registered from municipal records that existed before this system.",
  });

  /**
   * =============================================================
   * FINANCIAL POSITION
   * =============================================================
   */
  const [financial, setFinancial] = useState({
    originalObligation: "329670",
    amountAlreadyPaid: "130000",
    balanceAsOfDate: "2026-09-19",
  });

  /**
   * =============================================================
   * TAXPAYER SEARCH
   * =============================================================
   *
   * This is only UI state.
   *
   * It is NOT stored as part of the agreement.
   */
  const [taxpayerSearch, setTaxpayerSearch] = useState("");

  const [showTaxpayerResults, setShowTaxpayerResults] =
    useState(false);

  /**
   * =============================================================
   * SELECTED TAXPAYER
   * =============================================================
   *
   * Resolve taxpayer information from taxpayerId.
   */
  const selectedTaxpayer = useMemo(() => {
    return taxpayers.find(
      (taxpayer) => taxpayer.id === agreement.taxpayerId
    );
  }, [agreement.taxpayerId]);

  /**
   * =============================================================
   * FILTERED TAXPAYERS
   * =============================================================
   *
   * Temporary local filtering.
   *
   * Production:
   * Search against taxpayer API instead of loading all taxpayers.
   */
  const filteredTaxpayers = useMemo(() => {
    const query = taxpayerSearch.trim().toLowerCase();

    if (!query) {
      return taxpayers;
    }

    return taxpayers.filter((taxpayer) => {
      return (
        taxpayer.name.toLowerCase().includes(query) ||
        taxpayer.tin.toLowerCase().includes(query)
      );
    });
  }, [taxpayerSearch]);

  /**
   * =============================================================
   * REVENUE SERVICE
   * =============================================================
   */
  const selectedRevenueService = useMemo(() => {
    return revenueServices.find(
      (service) => service.id === agreement.revenueServiceId
    );
  }, [agreement.revenueServiceId]);

  /**
   * Revenue code is derived from Revenue Service.
   *
   * User cannot edit it.
   */
  const revenueCode = selectedRevenueService?.code ?? "—";

  /* =============================================================
     UPDATE AGREEMENT
  ============================================================= */

  const updateAgreement = (
    field: keyof typeof agreement,
    value: string
  ) => {
    setAgreement((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* =============================================================
     UPDATE FINANCIAL
  ============================================================= */

  const updateFinancial = (
    field: keyof typeof financial,
    value: string
  ) => {
    setFinancial((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* =============================================================
     SELECT TAXPAYER
  ============================================================= */

  const selectTaxpayer = (taxpayerId: string) => {
    updateAgreement("taxpayerId", taxpayerId);

    setTaxpayerSearch("");
    setShowTaxpayerResults(false);
  };

  /* =============================================================
     CLEAR TAXPAYER
  ============================================================= */

  const clearTaxpayer = () => {
    updateAgreement("taxpayerId", "");
    setTaxpayerSearch("");
    setShowTaxpayerResults(false);
  };

  /* =============================================================
     OUTSTANDING BALANCE
  ============================================================= */

  const outstandingBalance = useMemo(() => {
    const obligation =
      Number(financial.originalObligation) || 0;

    const paid =
      Number(financial.amountAlreadyPaid) || 0;

    return Math.max(0, obligation - paid);
  }, [
    financial.originalObligation,
    financial.amountAlreadyPaid,
  ]);

  /* =============================================================
     NAVIGATION
  ============================================================= */

  const nextStep = () => {
    setCurrentStep((step) =>
      step < 3 ? ((step + 1) as Step) : step
    );
  };

  const previousStep = () => {
    setCurrentStep((step) =>
      step > 1 ? ((step - 1) as Step) : step
    );
  };

  const goToStep = (step: Step) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  /* =============================================================
     REGISTER
  ============================================================= */

  const handleRegister = () => {
    /**
     * Laravel API payload should use taxpayer_id.
     *
     * Example:
     *
     * {
     *   agreement_number: agreement.agreementNumber,
     *   agreement_date: agreement.agreementDate,
     *   taxpayer_id: agreement.taxpayerId,
     *
     *   revenue_service_id: agreement.revenueServiceId,
     *
     *   land_holding_number: agreement.landHoldingNumber,
     *   land_area: Number(agreement.landArea),
     *   lease_period: Number(agreement.leasePeriod),
     *
     *   payment_completion_period:
     *     Number(agreement.paymentCompletionPeriod),
     *
     *   payment_completion_date:
     *     agreement.paymentCompletionDate,
     *
     *   location: agreement.location,
     *
     *   historical_obligation:
     *     Number(financial.originalObligation),
     *
     *   historical_paid:
     *     Number(financial.amountAlreadyPaid),
     *
     *   starting_balance:
     *     outstandingBalance,
     *
     *   balance_as_of_date:
     *     financial.balanceAsOfDate,
     *
     *   source: agreement.source,
     *   notes: agreement.notes
     * }
     *
     * IMPORTANT:
     *
     * Do NOT send:
     *
     * taxpayer_name
     * taxpayer_tin
     *
     * because those belong to the taxpayer master record.
     *
     * The backend should resolve:
     *
     * taxpayer_id → taxpayer → name/TIN/type
     *
     * Also:
     *
     * revenue_service_id → revenue service → revenue code
     *
     * The historical payment completion period/date must remain
     * historical values and must not automatically be overwritten
     * by today's payment configuration.
     */

    setRegistered(true);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* =========================================================
          HEADER
      ========================================================= */}
      <div className="border-b bg-background">
        <div className="mx-auto max-w-[1400px] px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="mt-0.5"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Register Existing LIZZ Agreement
                  </h1>

                  <Badge variant="secondary">
                    Existing Agreement
                  </Badge>
                </div>

                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Register an LIZZ agreement that was created before this
                  revenue system was introduced.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1.5 px-3 py-1.5"
              >
                <History className="h-4 w-4" />
                Pre-System Record
              </Badge>

              <Button variant="outline">
                Save Draft
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] px-6 py-6">
        {/* =========================================================
            INFORMATION NOTICE
        ========================================================= */}
        <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardContent className="flex gap-3 p-4">
            <div className="mt-0.5 rounded-full bg-blue-100 p-2 dark:bg-blue-900">
              <History className="h-4 w-4 text-blue-700 dark:text-blue-300" />
            </div>

            <div>
              <p className="font-medium">
                This is an existing agreement import
              </p>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Enter the original agreement information, including the
                historical payment completion period, and its current
                financial position. The original agreement date and
                historical terms remain unchanged. Historical payment
                transactions do not need to be recreated individually.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* =========================================================
            STEPPER
        ========================================================= */}
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              {steps.map((step, index) => {
                const Icon = step.icon;

                const active = currentStep === step.id;
                const completed = currentStep > step.id;

                return (
                  <React.Fragment key={step.id}>
                    <button
                      type="button"
                      onClick={() =>
                        goToStep(step.id as Step)
                      }
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div
                        className={[
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors",
                          completed
                            ? "border-primary bg-primary text-primary-foreground"
                            : active
                              ? "border-primary bg-primary/10 text-primary"
                              : "bg-background text-muted-foreground",
                        ].join(" ")}
                      >
                        {completed ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p
                          className={[
                            "text-sm font-medium",
                            active || completed
                              ? "text-foreground"
                              : "text-muted-foreground",
                          ].join(" ")}
                        >
                          {step.title}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </button>

                    {index < steps.length - 1 && (
                      <div className="hidden h-px flex-1 bg-border md:block" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* =========================================================
            MAIN CONTENT
        ========================================================= */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            {/* =====================================================
                STEP 1
            ===================================================== */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Existing Agreement Information
                      </CardTitle>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Enter the agreement exactly as it appears in the
                        existing municipal record.
                      </p>
                    </div>

                    <Badge variant="outline">
                      Step 1 of 3
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* =================================================
                      AGREEMENT DETAILS
                  ================================================= */}
                  <div>
                    <h3 className="mb-4 text-sm font-semibold">
                      Agreement Details
                    </h3>

                    <div className="grid gap-5 md:grid-cols-2">
                      {/* Agreement Number */}
                      <div className="space-y-2">
                        <Label htmlFor="agreementNumber">
                          Agreement Number
                        </Label>

                        <Input
                          id="agreementNumber"
                          value={agreement.agreementNumber}
                          onChange={(e) =>
                            updateAgreement(
                              "agreementNumber",
                              e.target.value
                            )
                          }
                          placeholder="e.g. LIZZ-2020-00125"
                        />
                      </div>

                      {/* Agreement Date */}
                      <div className="space-y-2">
                        <Label htmlFor="agreementDate">
                          Original Agreement Date
                        </Label>

                        <div className="relative">
                          <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

                          <Input
                            id="agreementDate"
                            type="date"
                            className="pl-9"
                            value={agreement.agreementDate}
                            onChange={(e) =>
                              updateAgreement(
                                "agreementDate",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Use the date from the original agreement.
                        </p>
                      </div>

                      {/* Revenue Service */}
                      <div className="space-y-2">
                        <Label>
                          Revenue Service
                        </Label>

                        <Select
                          value={agreement.revenueServiceId}
                          onValueChange={(value) =>
                            updateAgreement(
                              "revenueServiceId",
                              value
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select revenue service" />
                          </SelectTrigger>

                          <SelectContent>
                            {revenueServices.map(
                              (service) => (
                                <SelectItem
                                  key={service.id}
                                  value={service.id}
                                >
                                  {service.name}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>

                        <p className="text-xs text-muted-foreground">
                          Select the existing revenue service. The revenue
                          code is resolved automatically.
                        </p>
                      </div>

                      {/* Revenue Code */}
                      <div className="space-y-2">
                        <Label htmlFor="revenueCode">
                          Revenue Code
                        </Label>

                        <div className="relative">
                          <Landmark className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

                          <Input
                            id="revenueCode"
                            value={revenueCode}
                            readOnly
                            className="bg-muted pl-9 font-medium"
                          />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Automatically resolved from the selected revenue
                          service.
                        </p>
                      </div>

                      {/* Source */}
                      <div className="space-y-2">
                        <Label>
                          Record Source
                        </Label>

                        <Select
                          value={agreement.source}
                          onValueChange={(value) =>
                            updateAgreement(
                              "source",
                              value
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="Municipal Record">
                              Municipal Record
                            </SelectItem>

                            <SelectItem value="Physical Agreement">
                              Physical Agreement
                            </SelectItem>

                            <SelectItem value="Previous Record">
                              Previous Record
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* =================================================
                      TAXPAYER
                  ================================================= */}
                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold">
                        Taxpayer
                      </h3>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Select the taxpayer from the existing taxpayer
                        master record. Taxpayer name and TIN are not entered
                        manually here.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Search */}
                      {!selectedTaxpayer && (
                        <div className="space-y-2">
                          <Label htmlFor="taxpayerSearch">
                            Search Taxpayer
                          </Label>

                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

                            <Input
                              id="taxpayerSearch"
                              value={taxpayerSearch}
                              onChange={(e) => {
                                setTaxpayerSearch(e.target.value);
                                setShowTaxpayerResults(true);
                              }}
                              onFocus={() =>
                                setShowTaxpayerResults(true)
                              }
                              placeholder="Search by taxpayer name or TIN..."
                              className="pl-9"
                            />
                          </div>

                          {showTaxpayerResults && (
                            <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
                              {filteredTaxpayers.length > 0 ? (
                                <div className="max-h-64 overflow-y-auto p-1">
                                  {filteredTaxpayers.map(
                                    (taxpayer) => (
                                      <button
                                        key={taxpayer.id}
                                        type="button"
                                        onClick={() =>
                                          selectTaxpayer(
                                            taxpayer.id
                                          )
                                        }
                                        className="flex w-full items-start gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-muted"
                                      >
                                        <div className="mt-0.5 rounded-full border bg-muted p-2">
                                          <User className="h-4 w-4 text-muted-foreground" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-medium">
                                            {taxpayer.name}
                                          </p>

                                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            <span>
                                              TIN:{" "}
                                              {taxpayer.tin}
                                            </span>

                                            <span>
                                              {taxpayer.type}
                                            </span>
                                          </div>
                                        </div>
                                      </button>
                                    )
                                  )}
                                </div>
                              ) : (
                                <div className="p-5 text-center">
                                  <User className="mx-auto h-8 w-8 text-muted-foreground/50" />

                                  <p className="mt-2 text-sm font-medium">
                                    No taxpayer found
                                  </p>

                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Search using the taxpayer name or TIN.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground">
                            Taxpayer information comes from the existing
                            taxpayer master data.
                          </p>
                        </div>
                      )}

                      {/* Selected taxpayer */}
                      {selectedTaxpayer && (
                        <div className="rounded-lg border bg-muted/20">
                          <div className="flex items-start justify-between gap-4 p-4">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="rounded-full border bg-background p-2.5">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold">
                                    {selectedTaxpayer.name}
                                  </p>

                                  <Badge
                                    variant="secondary"
                                    className="text-[11px]"
                                  >
                                    {selectedTaxpayer.type}
                                  </Badge>
                                </div>

                                <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                                  <span>
                                    TIN:{" "}
                                    <span className="font-medium text-foreground">
                                      {selectedTaxpayer.tin}
                                    </span>
                                  </span>

                                  <span>
                                    Taxpayer ID:{" "}
                                    <span className="font-medium text-foreground">
                                      {selectedTaxpayer.id}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={clearTaxpayer}
                              aria-label="Change taxpayer"
                              title="Change taxpayer"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <Separator />

                          <div className="flex items-center justify-between gap-4 px-4 py-3">
                            <div>
                              <p className="text-xs font-medium">
                                Existing taxpayer record selected
                              </p>

                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Name and TIN are read-only master data.
                              </p>
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={clearTaxpayer}
                            >
                              Change
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* =================================================
                      LAND / LEASE
                  ================================================= */}
                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold">
                        Land / Lease Information
                      </h3>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Keep the legal lease duration separate from the
                        historical payment completion period.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      {/* Land Holding */}
                      <div className="space-y-2">
                        <Label htmlFor="landHoldingNumber">
                          Land Holding Number
                        </Label>

                        <Input
                          id="landHoldingNumber"
                          value={agreement.landHoldingNumber}
                          onChange={(e) =>
                            updateAgreement(
                              "landHoldingNumber",
                              e.target.value
                            )
                          }
                          placeholder="Land holding number"
                        />
                      </div>

                      {/* Location */}
                      <div className="space-y-2">
                        <Label htmlFor="location">
                          Location
                        </Label>

                        <div className="relative">
                          <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

                          <Input
                            id="location"
                            className="pl-9"
                            value={agreement.location}
                            onChange={(e) =>
                              updateAgreement(
                                "location",
                                e.target.value
                              )
                            }
                            placeholder="Property location"
                          />
                        </div>
                      </div>

                      {/* Land Area */}
                      <div className="space-y-2">
                        <Label htmlFor="landArea">
                          Land Area (m²)
                        </Label>

                        <Input
                          id="landArea"
                          type="number"
                          min="0"
                          value={agreement.landArea}
                          onChange={(e) =>
                            updateAgreement(
                              "landArea",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      {/* Lease Period */}
                      <div className="space-y-2">
                        <Label htmlFor="leasePeriod">
                          Lease Period (Years)
                        </Label>

                        <Input
                          id="leasePeriod"
                          type="number"
                          min="1"
                          value={agreement.leasePeriod}
                          onChange={(e) =>
                            updateAgreement(
                              "leasePeriod",
                              e.target.value
                            )
                          }
                        />

                        <p className="text-xs text-muted-foreground">
                          Legal duration of the land lease.
                        </p>
                      </div>

                      {/* Payment Completion Period */}
                      <div className="space-y-2">
                        <Label htmlFor="paymentCompletionPeriod">
                          Payment Completion Period (Years)
                        </Label>

                        <Input
                          id="paymentCompletionPeriod"
                          type="number"
                          min="1"
                          value={
                            agreement.paymentCompletionPeriod
                          }
                          onChange={(e) =>
                            updateAgreement(
                              "paymentCompletionPeriod",
                              e.target.value
                            )
                          }
                          placeholder="e.g. 10"
                        />

                        <p className="text-xs text-muted-foreground">
                          Historical period within which the LIZZ payment
                          obligation was scheduled to be completed.
                        </p>
                      </div>

                      {/* Payment Completion Date */}
                      <div className="space-y-2">
                        <Label htmlFor="paymentCompletionDate">
                          Payment Completion Date
                        </Label>

                        <div className="relative">
                          <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

                          <Input
                            id="paymentCompletionDate"
                            type="date"
                            className="pl-9"
                            value={
                              agreement.paymentCompletionDate
                            }
                            onChange={(e) =>
                              updateAgreement(
                                "paymentCompletionDate",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Actual historical completion date from the
                          existing agreement or authoritative record.
                        </p>
                      </div>
                    </div>

                    {/* Payment completion explanation */}
                    <div className="mt-5 rounded-lg border bg-muted/30 p-4">
                      <div className="flex gap-3">
                        <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

                        <div>
                          <p className="text-sm font-medium">
                            Lease period vs. payment completion period
                          </p>

                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            The lease period describes how long the land
                            lease legally continues. The payment completion
                            period describes how long the financial
                            obligation was scheduled to be completed.
                            These values should not automatically be treated
                            as the same.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* =================================================
                      NOTES
                  ================================================= */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">
                      Notes
                    </Label>

                    <Textarea
                      id="notes"
                      rows={3}
                      value={agreement.notes}
                      onChange={(e) =>
                        updateAgreement(
                          "notes",
                          e.target.value
                        )
                      }
                      placeholder="Optional notes about the existing agreement..."
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={nextStep}
                      disabled={!agreement.taxpayerId}
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* =====================================================
                STEP 2 — FINANCIAL POSITION
            ===================================================== */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CircleDollarSign className="h-5 w-5" />
                        Existing Financial Position
                      </CardTitle>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Record the financial position that exists before
                        this system takes over.
                      </p>
                    </div>

                    <Badge variant="outline">
                      Step 2 of 3
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Agreement reference */}
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Agreement
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {agreement.agreementNumber}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Taxpayer
                        </p>

                        <p className="mt-1 truncate text-sm font-medium">
                          {selectedTaxpayer?.name || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Revenue Service
                        </p>

                        <p className="mt-1 truncate text-sm font-medium">
                          {selectedRevenueService?.name || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Revenue Code
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {revenueCode}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Historical position */}
                  <div>
                    <h3 className="mb-1 text-sm font-semibold">
                      Starting Financial Position
                    </h3>

                    <p className="mb-4 text-sm text-muted-foreground">
                      Only the historical totals are required. Individual
                      old payment receipts do not need to be entered.
                    </p>

                    <div className="grid gap-5 md:grid-cols-2">
                      {/* Historical obligation */}
                      <div className="space-y-2">
                        <Label htmlFor="originalObligation">
                          Historical Obligation
                        </Label>

                        <Input
                          id="originalObligation"
                          type="number"
                          min="0"
                          value={
                            financial.originalObligation
                          }
                          onChange={(e) =>
                            updateFinancial(
                              "originalObligation",
                              e.target.value
                            )
                          }
                        />

                        <p className="text-xs text-muted-foreground">
                          Total obligation recorded in the existing
                          municipal record.
                        </p>
                      </div>

                      {/* Already paid */}
                      <div className="space-y-2">
                        <Label htmlFor="amountAlreadyPaid">
                          Amount Already Paid
                        </Label>

                        <Input
                          id="amountAlreadyPaid"
                          type="number"
                          min="0"
                          value={
                            financial.amountAlreadyPaid
                          }
                          onChange={(e) =>
                            updateFinancial(
                              "amountAlreadyPaid",
                              e.target.value
                            )
                          }
                        />

                        <p className="text-xs text-muted-foreground">
                          Total amount collected before this system.
                        </p>
                      </div>

                      {/* Outstanding */}
                      <div className="space-y-2">
                        <Label>
                          Starting Outstanding Balance
                        </Label>

                        <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-semibold">
                          ETB{" "}
                          {formatCurrency(
                            outstandingBalance
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Automatically calculated.
                        </p>
                      </div>

                      {/* Balance date */}
                      <div className="space-y-2">
                        <Label htmlFor="balanceAsOfDate">
                          Balance As Of
                        </Label>

                        <div className="relative">
                          <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

                          <Input
                            id="balanceAsOfDate"
                            type="date"
                            className="pl-9"
                            value={
                              financial.balanceAsOfDate
                            }
                            onChange={(e) =>
                              updateFinancial(
                                "balanceAsOfDate",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Date on which the historical balance was verified.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financial summary */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <FinancialSummary
                      label="Historical Obligation"
                      value={`ETB ${formatCurrency(
                        Number(
                          financial.originalObligation
                        ) || 0
                      )}`}
                    />

                    <FinancialSummary
                      label="Already Paid"
                      value={`ETB ${formatCurrency(
                        Number(
                          financial.amountAlreadyPaid
                        ) || 0
                      )}`}
                    />

                    <FinancialSummary
                      label="Starting Balance"
                      value={`ETB ${formatCurrency(
                        outstandingBalance
                      )}`}
                      highlighted
                    />
                  </div>

                  {/* Important note */}
                  <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                        <div>
                          <p className="font-medium">
                            Verify the starting balance
                          </p>

                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            This balance represents the financial position
                            carried from the old municipal record. After
                            registration, future assessments and payments
                            will be managed by the new system.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Footer */}
                  <div className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      onClick={previousStep}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>

                    <Button onClick={nextStep}>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* =====================================================
                STEP 3 — REVIEW
            ===================================================== */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5" />
                        Review & Register
                      </CardTitle>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Verify the historical agreement before registering
                        it in the new system.
                      </p>
                    </div>

                    <Badge variant="outline">
                      Step 3 of 3
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Agreement review */}
                  <ReviewSection
                    title="Agreement Information"
                    icon={
                      <FileText className="h-4 w-4" />
                    }
                    items={[
                      [
                        "Agreement Number",
                        agreement.agreementNumber,
                      ],
                      [
                        "Original Agreement Date",
                        agreement.agreementDate,
                      ],
                      [
                        "Taxpayer",
                        selectedTaxpayer?.name || "—",
                      ],
                      [
                        "TIN",
                        selectedTaxpayer?.tin || "—",
                      ],
                      [
                        "Taxpayer Type",
                        selectedTaxpayer?.type || "—",
                      ],
                      [
                        "Revenue Service",
                        selectedRevenueService?.name || "—",
                      ],
                      [
                        "Revenue Code",
                        revenueCode,
                      ],
                      [
                        "Land Holding",
                        agreement.landHoldingNumber,
                      ],
                      [
                        "Land Area",
                        `${agreement.landArea} m²`,
                      ],
                      [
                        "Lease Period",
                        agreement.leasePeriod
                          ? `${agreement.leasePeriod} years`
                          : "—",
                      ],
                      [
                        "Payment Completion Period",
                        agreement.paymentCompletionPeriod
                          ? `${agreement.paymentCompletionPeriod} years`
                          : "—",
                      ],
                      [
                        "Payment Completion Date",
                        agreement.paymentCompletionDate,
                      ],
                      [
                        "Location",
                        agreement.location,
                      ],
                      [
                        "Record Source",
                        agreement.source,
                      ],
                    ]}
                  />

                  {/* Financial review */}
                  <ReviewSection
                    title="Historical Financial Position"
                    icon={
                      <CircleDollarSign className="h-4 w-4" />
                    }
                    items={[
                      [
                        "Historical Obligation",
                        `ETB ${formatCurrency(
                          Number(
                            financial.originalObligation
                          ) || 0
                        )}`,
                      ],
                      [
                        "Amount Already Paid",
                        `ETB ${formatCurrency(
                          Number(
                            financial.amountAlreadyPaid
                          ) || 0
                        )}`,
                      ],
                      [
                        "Starting Outstanding Balance",
                        `ETB ${formatCurrency(
                          outstandingBalance
                        )}`,
                      ],
                      [
                        "Balance As Of",
                        financial.balanceAsOfDate,
                      ],
                    ]}
                  />

                  {/* Ready */}
                  <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
                    <CardContent className="p-5">
                      <div className="flex gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

                        <div>
                          <p className="font-medium">
                            Ready to register
                          </p>

                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            This will be registered as an existing LIZZ
                            agreement, not as a newly created agreement.
                            The original agreement date, lease period,
                            payment completion period, payment completion
                            date, taxpayer reference, and historical
                            financial position will be preserved.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* After registration */}
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm font-semibold">
                      After registration
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <AfterRegisterItem
                        icon={
                          <FileText className="h-4 w-4" />
                        }
                        title="Agreement"
                        description="Existing agreement becomes active in the new system."
                      />

                      <AfterRegisterItem
                        icon={
                          <CircleDollarSign className="h-4 w-4" />
                        }
                        title="Starting Balance"
                        description="Historical outstanding balance is carried forward."
                      />

                      <AfterRegisterItem
                        icon={
                          <Wallet className="h-4 w-4" />
                        }
                        title="Future Payments"
                        description="New payments are recorded normally in the system."
                      />
                    </div>
                  </div>

                  {/* Success state */}
                  {registered && (
                    <Card className="border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                      <CardContent className="flex gap-3 p-5">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />

                        <div>
                          <p className="font-medium">
                            Agreement registered successfully
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {agreement.agreementNumber} is now available as
                            an active existing agreement.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Footer */}
                  <div className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      onClick={previousStep}
                      disabled={registered}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>

                    <Button
                      onClick={handleRegister}
                      disabled={
                        registered || !agreement.taxpayerId
                      }
                    >
                      {registered ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Registered
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Register Agreement
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* =======================================================
              RIGHT SUMMARY
          ======================================================= */}
          <aside className="space-y-6">
            {/* Agreement summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Agreement Summary
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <SummaryRow
                  icon={
                    <FileText className="h-4 w-4" />
                  }
                  label="Agreement"
                  value={agreement.agreementNumber}
                />

                <SummaryRow
                  icon={
                    <User className="h-4 w-4" />
                  }
                  label="Taxpayer"
                  value={
                    selectedTaxpayer?.name || "Not selected"
                  }
                />

                <SummaryRow
                  icon={
                    <User className="h-4 w-4" />
                  }
                  label="TIN"
                  value={selectedTaxpayer?.tin || "—"}
                />

                <SummaryRow
                  icon={
                    <CalendarDays className="h-4 w-4" />
                  }
                  label="Agreement Date"
                  value={agreement.agreementDate}
                />

                <SummaryRow
                  icon={
                    <Landmark className="h-4 w-4" />
                  }
                  label="Revenue Service"
                  value={
                    selectedRevenueService?.name || "—"
                  }
                />

                <SummaryRow
                  icon={
                    <Landmark className="h-4 w-4" />
                  }
                  label="Revenue Code"
                  value={revenueCode}
                />

                <SummaryRow
                  icon={
                    <CalendarDays className="h-4 w-4" />
                  }
                  label="Lease Period"
                  value={
                    agreement.leasePeriod
                      ? `${agreement.leasePeriod} years`
                      : "—"
                  }
                />

                <SummaryRow
                  icon={
                    <CalendarDays className="h-4 w-4" />
                  }
                  label="Payment Completion"
                  value={
                    agreement.paymentCompletionDate
                      ? agreement.paymentCompletionDate
                      : agreement.paymentCompletionPeriod
                        ? `${agreement.paymentCompletionPeriod} years`
                        : "—"
                  }
                />

                <SummaryRow
                  icon={
                    <MapPin className="h-4 w-4" />
                  }
                  label="Location"
                  value={agreement.location}
                />

                <Separator />

                <SummaryRow
                  icon={
                    <CircleDollarSign className="h-4 w-4" />
                  }
                  label="Starting Balance"
                  value={`ETB ${formatCurrency(
                    outstandingBalance
                  )}`}
                />
              </CardContent>
            </Card>

            {/* Registration status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Registration Status
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="rounded-full border bg-background p-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      {registered
                        ? "Registered"
                        : "Existing Agreement"}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {registered
                        ? "This existing agreement has been registered and is ready for normal revenue operations."
                        : "This record existed before the revenue system and will be registered without changing its original agreement terms."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What happens next */}
            <Card className="bg-muted/40">
              <CardHeader>
                <CardTitle className="text-base">
                  What Happens Next?
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <TimelineItem
                  icon={
                    <CheckCircle2 className="h-4 w-4" />
                  }
                  title="Agreement becomes active"
                  description="The existing agreement becomes available in the new system."
                />

                <TimelineItem
                  icon={
                    <CalendarDays className="h-4 w-4" />
                  }
                  title="Historical payment terms are preserved"
                  description="The recorded payment completion period and date remain part of the existing agreement history."
                />

                <TimelineItem
                  icon={
                    <CircleDollarSign className="h-4 w-4" />
                  }
                  title="Balance is carried forward"
                  description="The historical outstanding amount becomes the starting balance."
                />

                <TimelineItem
                  icon={
                    <Wallet className="h-4 w-4" />
                  }
                  title="Normal collection continues"
                  description="Future assessments and payments follow the normal revenue workflow."
                />
              </CardContent>
            </Card>

            {/* Municipal record */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

                  <div>
                    <p className="text-sm font-medium">
                      Municipal Record
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      The original agreement information, including its
                      payment completion terms, should remain consistent
                      with the authoritative municipal record.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

/* ===============================================================
   FINANCIAL SUMMARY
================================================================ */

function FinancialSummary({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-lg border p-4",
        highlighted
          ? "bg-muted/50"
          : "bg-background",
      ].join(" ")}
    >
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold">
        {value}
      </p>
    </div>
  );
}

/* ===============================================================
   SUMMARY ROW
================================================================ */

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-muted-foreground">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <p className="mt-0.5 truncate text-sm font-medium">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

/* ===============================================================
   REVIEW SECTION
================================================================ */

function ReviewSection({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: [string, string][];
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
        {icon}

        <h3 className="text-sm font-semibold">
          {title}
        </h3>
      </div>

      <div className="grid gap-x-8 gap-y-5 p-4 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">
              {label}
            </p>

            <p className="mt-1 text-sm font-medium">
              {value || "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===============================================================
   AFTER REGISTER ITEM
================================================================ */

function AfterRegisterItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 rounded-full border bg-background p-2">
        {icon}
      </div>

      <div>
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ===============================================================
   TIMELINE ITEM
================================================================ */

function TimelineItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 rounded-full border bg-background p-1.5">
        {icon}
      </div>

      <div>
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

export default ExistingPage;
