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
   GENERIC HELPERS
========================================================= */

function hasOwn(
  object: Record<string, unknown>,
  key: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(
    object,
    key,
  )
}

function normalizeIdentifier(
  value: unknown,
): string | undefined {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return undefined
  }

  const normalized =
    String(value).trim()

  return normalized
    ? normalized
    : undefined
}

/* =========================================================
   FIELD IDENTIFIERS
========================================================= */

/**
 * Returns all possible identifiers for a service field.
 *
 * The API persists values using fieldCode:
 *
 *   LAND_AREA
 *   AGREEMENT_DATE
 *   ZOONII
 *
 * The frontend configuration can represent the same
 * field using key, code, id, fieldId, etc.
 */
function getFieldIdentifiers(
  field: RevenueService["fields"][number],
): string[] {
  const candidateValues = [
    field.key,

    /*
     * Some RevenueService types expose code directly.
     * Access through a narrow runtime cast so this remains
     * safe even if the current TypeScript type does not.
     */
    (field as unknown as {
      code?: unknown
    }).code,

    (field as unknown as {
      fieldCode?: unknown
    }).fieldCode,

    (field as unknown as {
      field_code?: unknown
    }).field_code,

    field.id,

    (field as unknown as {
      field_id?: unknown
    }).field_id,

    (field as unknown as {
      fieldId?: unknown
    }).fieldId,

    field.label,
  ]

  const identifiers: string[] = []

  for (
    const candidate of candidateValues
  ) {
    const identifier =
      normalizeIdentifier(candidate)

    if (
      identifier &&
      !identifiers.includes(
        identifier,
      )
    ) {
      identifiers.push(
        identifier,
      )
    }
  }

  return identifiers
}

/* =========================================================
   FORM FIELD KEY
========================================================= */

/**
 * Determines the canonical key that should be used
 * when looking up a dynamic service value.
 *
 * IMPORTANT:
 *
 * Prefer business field identifiers over UUIDs.
 *
 * This means:
 *
 *   field.key       -> LAND_AREA
 *   field.code      -> LAND_AREA
 *   field.fieldCode -> LAND_AREA
 *
 * before falling back to:
 *
 *   field.id        -> UUID
 */
function getFieldFormKey(
  field: RevenueService["fields"][number],
): string | undefined {
  const candidates = [
    field.key,

    (field as unknown as {
      code?: unknown
    }).code,

    (field as unknown as {
      fieldCode?: unknown
    }).fieldCode,

    (field as unknown as {
      field_code?: unknown
    }).field_code,

    (field as unknown as {
      name?: unknown
    }).name,

    field.id,

    (field as unknown as {
      field_id?: unknown
    }).field_id,

    (field as unknown as {
      fieldId?: unknown
    }).fieldId,
  ]

  for (
    const candidate of candidates
  ) {
    const value =
      normalizeIdentifier(candidate)

    if (value) {
      return value
    }
  }

  return undefined
}

/* =========================================================
   CURRENCY FORMATTER
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
   * Handle plain YYYY-MM-DD values
   * without allowing browser timezone
   * conversion to shift the displayed day.
   */
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      stringValue,
    )
  ) {
    const [
      year,
      month,
      day,
    ] = stringValue
      .split("-")
      .map(Number)

    const date = new Date(
      year,
      month - 1,
      day,
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

  /*
   * Handle ISO datetime values.
   */
  const date = new Date(
    stringValue,
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
    try {
      return JSON.stringify(
        value,
      )
    } catch {
      return String(value)
    }
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
      (
        field as unknown as {
          type?: unknown
        }
      ).type ?? "",
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
    try {
      return JSON.stringify(
        value,
      )
    } catch {
      return String(value)
    }
  }

  /*
   * Number / text / select
   */
  return String(value)
}

/* =========================================================
   SERVICE FIELD VALUE LOOKUP
========================================================= */

/**
 * Finds a value regardless of whether the form currently
 * stores it by:
 *
 *   - field key
 *   - field code
 *   - fieldCode
 *   - field UUID
 *
 * This makes ReviewRegisterStep compatible with both:
 *
 * 1. Newly entered frontend values
 * 2. Existing assessment values hydrated from the API
 *
 * Example API:
 *
 * values: [
 *   {
 *     fieldCode: "LAND_AREA",
 *     value: 200
 *   }
 * ]
 *
 * Example frontend:
 *
 * {
 *   LAND_AREA: 200
 * }
 *
 * or:
 *
 * {
 *   "field-uuid": 200
 * }
 */
function getServiceFieldValue(
  field: RevenueService["fields"][number],
  values: Record<string, unknown>,
): unknown {
  const identifiers =
    getFieldIdentifiers(
      field,
    )

  /*
   * Exact lookup first.
   */
  for (
    const identifier of identifiers
  ) {
    if (
      hasOwn(
        values,
        identifier,
      )
    ) {
      return values[
        identifier
      ]
    }
  }

  /*
   * Case-insensitive fallback.
   *
   * This protects against differences such as:
   *
   * LAND_AREA
   * land_area
   */
  const normalizedEntries =
    Object.entries(
      values,
    )

  for (
    const identifier of identifiers
  ) {
    const normalizedIdentifier =
      identifier.toLowerCase()

    const matchingEntry =
      normalizedEntries.find(
        ([key]) =>
          key.toLowerCase() ===
          normalizedIdentifier,
      )

    if (
      matchingEntry
    ) {
      return matchingEntry[1]
    }
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
        {value ?? "—"}
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

              const value =
                getServiceFieldValue(
                  field,
                  serviceValues,
                )

              const label =
                field.label ??
                field.description ??
                getFieldFormKey(
                  field,
                ) ??
                "Field"

              const fieldId =
                normalizeIdentifier(
                  field.id,
                )

              const fieldKey =
                getFieldFormKey(
                  field,
                )

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
          label="Balance As Of Date"
          value={
            financial.balanceAsOfDate
              ? formatDate(
                  financial.balanceAsOfDate,
                )
              : "—"
          }
          muted
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