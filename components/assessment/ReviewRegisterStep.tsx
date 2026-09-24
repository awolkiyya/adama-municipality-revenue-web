"use client"

import {
  CheckCircle2,
  CircleDollarSign,
  FileText,
  User,
  Wallet,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"

import type {
  ExistingAgreementForm,
  ExistingFinancialPosition,
} from "@/types/existing-agreement"

import type {
  Citizen,
} from "@/types/citizen"

import type {
  RevenueService,
} from "@/types/revenue/assessment"

/* =========================================================
   PROPS
========================================================= */

interface ReviewRegisterStepProps {
  agreement: ExistingAgreementForm
  financial: ExistingFinancialPosition

  selectedTaxpayer: Citizen | null
  selectedRevenueService: RevenueService | null

  revenueCode: string
  outstandingBalance: number

  serviceFieldValues: Record<
    string,
    Record<string, unknown>
  >

  onEditStep: (step: 1 | 2) => void

  errors?: string[]
}

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    Number.isFinite(value)
      ? value
      : 0,
  )
}

/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDate(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—"
  }

  const stringValue =
    String(value)

  /*
   * Handle ISO datetime values as well
   * as plain YYYY-MM-DD values.
   */
  const date = new Date(
    stringValue.length === 10
      ? `${stringValue}T00:00:00`
      : stringValue,
  )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return stringValue
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date)
}

/* =========================================================
   PRIMITIVE FORMATTER
========================================================= */

function formatPrimitiveValue(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return ""
  }

  if (
    typeof value === "boolean"
  ) {
    return value
      ? "Yes"
      : "No"
  }

  if (
    typeof value === "object"
  ) {
    return JSON.stringify(
      value,
    )
  }

  return String(value)
}

/* =========================================================
   SERVICE FIELD FORMATTER
========================================================= */

function formatServiceFieldValue(
  field: RevenueService["fields"][number],
  value: unknown,
): React.ReactNode {
  /*
   * Empty value
   */
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—"
  }

  /*
   * Multiple values
   */
  if (
    Array.isArray(value)
  ) {
    if (
      value.length === 0
    ) {
      return "—"
    }

    const formattedValues =
      value
        .map(
          (item) =>
            formatPrimitiveValue(
              item,
            ),
        )
        .filter(Boolean)

    return formattedValues.length > 0
      ? formattedValues.join(", ")
      : "—"
  }

  /*
   * Boolean
   *
   * IMPORTANT:
   * false is a valid value.
   */
  if (
    typeof value ===
    "boolean"
  ) {
    return value
      ? "Yes"
      : "No"
  }

  /*
   * Date / datetime
   */
  const fieldType =
    String(
      field.type ?? "",
    ).toUpperCase()

  if (
    fieldType === "DATE" ||
    fieldType === "DATETIME"
  ) {
    return formatDate(
      value,
    )
  }

  /*
   * Object
   */
  if (
    typeof value ===
    "object"
  ) {
    return JSON.stringify(
      value,
    )
  }

  /*
   * Number / text / select
   */
  return String(value)
}

/* =========================================================
   FIELD VALUE LOOKUP
========================================================= */

/**
 * Returns the value stored for a service field.
 *
 * IMPORTANT:
 *
 * The form stores dynamic service values using the
 * field UUID when available.
 *
 * Example:
 *
 * serviceFieldValues = {
 *   "service-uuid": {
 *     "field-uuid-1": 500,
 *     "field-uuid-2": "A",
 *     "field-uuid-3": "2026-09-23"
 *   }
 * }
 *
 * But the field configuration can also have:
 *
 * key = "LAND_AREA"
 *
 * Therefore we must prefer field.id and only fall
 * back to field.key/name.
 */
function getServiceFieldValue(
  field: RevenueService["fields"][number],
  values: Record<string, unknown>,
): unknown {
  const fieldId =
    typeof field.id === "string"
      ? field.id
      : undefined

  const fieldKey =
    typeof field.key === "string"
      ? field.key
      : undefined

  const fieldName =
    typeof field.label === "string"
      ? field.label
      : undefined

  /*
   * 1. UUID
   */
  if (
    fieldId &&
    Object.prototype.hasOwnProperty.call(
      values,
      fieldId,
    )
  ) {
    return values[fieldId]
  }

  /*
   * 2. Field key
   */
  if (
    fieldKey &&
    Object.prototype.hasOwnProperty.call(
      values,
      fieldKey,
    )
  ) {
    return values[fieldKey]
  }

  /*
   * 3. Field name
   */
  if (
    fieldName &&
    Object.prototype.hasOwnProperty.call(
      values,
      fieldName,
    )
  ) {
    return values[fieldName]
  }

  return undefined
}

/* =========================================================
   REVIEW ROW
========================================================= */

interface ReviewRowProps {
  label: string
  value?: React.ReactNode
  muted?: boolean
}

function ReviewRow({
  label,
  value,
  muted = false,
}: ReviewRowProps) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <span className="text-xs text-muted-foreground">
        {label}
      </span>

      <span
        className={
          muted
            ? "max-w-[65%] break-words text-right text-xs text-muted-foreground"
            : "max-w-[65%] break-words text-right text-sm font-medium"
        }
      >
        {value || "—"}
      </span>
    </div>
  )
}

/* =========================================================
   REVIEW SECTION
========================================================= */

interface ReviewSectionProps {
  icon: React.ReactNode
  title: string
  description?: string
  onEdit?: () => void
  children: React.ReactNode
}

function ReviewSection({
  icon,
  title,
  description,
  onEdit,
  children,
}: ReviewSectionProps) {
  return (
    <section className="overflow-hidden rounded-xl border">
      <div className="flex items-start justify-between gap-4 border-b bg-muted/20 px-4 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
            {icon}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold">
              {title}
            </h3>

            {description && (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 text-xs font-medium text-primary hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      <div className="divide-y px-4">
        {children}
      </div>
    </section>
  )
}

/* =========================================================
   COMPONENT
========================================================= */

export function ReviewRegisterStep({
  agreement,
  financial,

  selectedTaxpayer,
  selectedRevenueService,

  revenueCode,
  outstandingBalance,

  serviceFieldValues,

  onEditStep,

  errors = [],
}: ReviewRegisterStepProps) {
  const hasValidationErrors =
    errors.length > 0

  /*
   * Values entered for the selected
   * revenue service.
   */
  const serviceValues =
    selectedRevenueService
      ? serviceFieldValues[
          selectedRevenueService.id
        ] ?? {}
      : {}

  /*
   * Dynamic fields configured for
   * the selected revenue service.
   */
  const serviceFields =
    selectedRevenueService?.fields ??
    []

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section>
        <div className="flex items-start gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>

          <div>
            <h2 className="text-sm font-semibold">
              Review & Register
            </h2>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Review the taxpayer, revenue service,
              service details, notes, and historical
              financial position before registering the record.
            </p>
          </div>

        </div>
      </section>

      {/* =====================================================
          VALIDATION ERRORS
      ====================================================== */}

      {hasValidationErrors && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">

          <p className="text-sm font-medium text-destructive">
            Please review the following items
          </p>

          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-destructive">
            {errors.map(
              (
                error,
                index,
              ) => (
                <li
                  key={`${error}-${index}`}
                >
                  {error}
                </li>
              ),
            )}
          </ul>

        </div>
      )}

      {/* =====================================================
          AGREEMENT
      ====================================================== */}

      <ReviewSection
        icon={
          <FileText className="h-4 w-4 text-muted-foreground" />
        }
        title="Agreement"
        description="Core agreement registration and revenue classification."
        onEdit={() =>
          onEditStep(1)
        }
      >

        <ReviewRow
          label="Revenue Service"
          value={
            selectedRevenueService ? (
              <span className="inline-flex flex-wrap items-center justify-end gap-2">

                <span>
                  {
                    selectedRevenueService.name
                  }
                </span>

                {revenueCode && (
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px]"
                  >
                    {revenueCode}
                  </Badge>
                )}

              </span>
            ) : (
              "—"
            )
          }
        />

        <ReviewRow
          label="Record Source"
          value={
            agreement.source
          }
        />

      </ReviewSection>

      {/* =====================================================
          TAXPAYER
      ====================================================== */}

      <ReviewSection
        icon={
          <User className="h-4 w-4 text-muted-foreground" />
        }
        title="Taxpayer"
        description="Linked to the municipal taxpayer master record."
        onEdit={() =>
          onEditStep(1)
        }
      >

        <ReviewRow
          label="Name"
          value={
            selectedTaxpayer?.full_name
          }
        />

        <ReviewRow
          label="Administrative Unit"
          value={
            selectedTaxpayer
              ?.administrative_unit
              ?.name
          }
        />

        <ReviewRow
          label="Taxpayer ID"
          value={
            selectedTaxpayer?.citizen_uid
          }
          muted
        />

      </ReviewSection>

      {/* =====================================================
          SERVICE DETAILS
      ====================================================== */}

      <ReviewSection
        icon={
          <FileText className="h-4 w-4 text-muted-foreground" />
        }
        title="Service Details"
        description={
          selectedRevenueService
            ? `Information captured according to ${selectedRevenueService.name}.`
            : "Information captured according to the selected revenue service."
        }
        onEdit={() =>
          onEditStep(1)
        }
      >

        {!selectedRevenueService ? (
          <div className="py-5">
            <p className="text-xs text-muted-foreground">
              No revenue service selected.
            </p>
          </div>
        ) : serviceFields.length === 0 ? (
          <div className="py-5">
            <p className="text-xs text-muted-foreground">
              This revenue service has no
              additional service-specific fields.
            </p>
          </div>
        ) : (
          serviceFields.map(
            (field) => {

              /*
               * IMPORTANT:
               *
               * Do NOT use:
               *
               * serviceValues[field.key]
               *
               * because the actual stored value may
               * be indexed by field.id (UUID).
               */
              const value =
                getServiceFieldValue(
                  field,
                  serviceValues,
                )

              const label =
                field.label ??
                field.description ??
                field.key ??
                "Field"

              const fieldId =
                typeof field.id === "string"
                  ? field.id
                  : undefined

              const fieldKey =
                typeof field.key === "string"
                  ? field.key
                  : undefined

              return (
                <ReviewRow
                  key={
                    fieldId ??
                    fieldKey ??
                    label
                  }
                  label={label}
                  value={formatServiceFieldValue(
                    field,
                    value,
                  )}
                />
              )
            },
          )
        )}

      </ReviewSection>

      {/* =====================================================
          FINANCIAL POSITION
      ====================================================== */}

      <ReviewSection
        icon={
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        }
        title="Financial Position"
        description="Historical financial values being carried into the municipal revenue system."
        onEdit={() =>
          onEditStep(2)
        }
      >

        <ReviewRow
          label="Original Obligation"
          value={
            financial.originalObligation
              ? `ETB ${formatCurrency(
                  Number(
                    financial.originalObligation,
                  ) || 0,
                )}`
              : "—"
          }
        />

        <ReviewRow
          label="Amount Already Paid"
          value={
            financial.amountAlreadyPaid
              ? `ETB ${formatCurrency(
                  Number(
                    financial.amountAlreadyPaid,
                  ) || 0,
                )}`
              : "—"
          }
        />

        <ReviewRow
          label="Outstanding Balance"
          value={
            <span className="inline-flex items-center gap-2">

              <Wallet className="h-3.5 w-3.5 text-muted-foreground" />

              <span>
                ETB{" "}
                {formatCurrency(
                  outstandingBalance,
                )}
              </span>

            </span>
          }
        />

      </ReviewSection>

      {/* =====================================================
          NOTES
      ====================================================== */}

      {agreement.notes && (
        <ReviewSection
          icon={
            <FileText className="h-4 w-4 text-muted-foreground" />
          }
          title="Notes"
          description="Additional information that does not belong to a specific service field or financial value."
          onEdit={() =>
            onEditStep(1)
          }
        >

          <div className="py-4">
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
              {
                agreement.notes
              }
            </p>
          </div>

        </ReviewSection>
      )}

      {/* =====================================================
          REGISTRATION CONFIRMATION
      ====================================================== */}

      <div className="rounded-xl border bg-muted/20 p-4">

        <div className="flex items-start gap-3">

          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

          <div>

            <p className="text-sm font-medium">
              Ready for registration
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Registering this record will preserve the
              verified historical agreement information,
              service-specific data, notes, and financial
              position in the municipal revenue system.
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}
