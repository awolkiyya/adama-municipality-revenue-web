"use client"

import type {
  ChangeEvent,
  ReactNode,
} from "react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  AlertCircle,
  ChevronDown,
  X,
} from "lucide-react"

import {
  Badge,
} from "@/components/ui/badge"

import {
  Button,
} from "@/components/ui/button"

import type {
  RevenueField,
  RevenueService,
} from "@/types/revenue/assessment"

import {
  RevenueDynamicField,
} from "@/components/revenue/fields/RevenueDynamicField"

import {
  formatCollectionMode,
} from "@/components/revenue/assessment/revenue-service-selector"

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| The field ID is the canonical key used by the parent form.
|
| field.id:
|   - identifies the configured RevenueServiceField
|   - is used as the values key
|   - is used as the errors key
|   - is sent to the backend
|
| field.key:
|   - is only a business/display key
|
|--------------------------------------------------------------------------
*/

type RevenueServiceFieldsProps = {
  service: RevenueService

  index: number

  values: Record<
    string,
    unknown
  >

  errors?: Record<
    string,
    string
  >

  onChange: (
    fieldId: string,
    value: unknown,
  ) => void

  onFileChange: (
    event: ChangeEvent<HTMLInputElement>,
    field: RevenueField,
  ) => void

  onRemoveFile: (
    field: RevenueField,
  ) => void

  onRemove: (
    serviceId: string,
  ) => void

  disabled?: boolean
}

/*
|--------------------------------------------------------------------------
| Fields that should occupy the complete row.
|--------------------------------------------------------------------------
*/

const FULL_WIDTH_TYPES = new Set([
  "TEXTAREA",
  "FILE",
  "MULTI_FILE",
])

export function RevenueServiceFields({
  service,
  index,
  values,
  errors = {},
  onChange,
  onFileChange,
  onRemoveFile,
  onRemove,
  disabled = false,
}: RevenueServiceFieldsProps) {
  const [
    expanded,
    setExpanded,
  ] = useState(true)

  /*
  |--------------------------------------------------------------------------
  | REQUIRED FIELDS
  |--------------------------------------------------------------------------
  |
  | CHECKBOX fields are intentionally excluded from required completion
  | because checkbox handling may have different semantics.
  |
  |--------------------------------------------------------------------------
  */

  const requiredFields =
    useMemo(
      () =>
        service.fields.filter(
          (field) =>
            Boolean(field.id) &&
            field.required &&
            field.type !== "CHECKBOX",
        ),
      [
        service.fields,
      ],
    )

  /*
  |--------------------------------------------------------------------------
  | COMPLETION
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | Always read values using field.id.
  |
  | Do NOT use:
  |
  | values[field.key]
  |
  | because the parent form stores values using the RevenueField.id.
  |
  |--------------------------------------------------------------------------
  */

  const completedCount =
    useMemo(
      () =>
        requiredFields.filter(
          (field) =>
            isFieldComplete(
              values[field.id],
              field,
            ),
        ).length,
      [
        requiredFields,
        values,
      ],
    )

  const requiredCount =
    requiredFields.length

  const isComplete =
    requiredCount === 0 ||
    completedCount ===
      requiredCount

  const completionPercentage =
    requiredCount === 0
      ? 100
      : Math.round(
          (completedCount /
            requiredCount) *
            100,
        )

  /*
  |--------------------------------------------------------------------------
  | ERROR STATE
  |--------------------------------------------------------------------------
  */

  const hasErrors =
    Object.keys(errors).length >
    0

  /*
  |--------------------------------------------------------------------------
  | AUTOMATICALLY EXPAND ON ERROR
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (hasErrors) {
      setExpanded(true)
    }
  }, [hasErrors])

  /*
  |--------------------------------------------------------------------------
  | TOGGLE
  |--------------------------------------------------------------------------
  */

  function toggleExpanded() {
    if (!disabled) {
      setExpanded(
        (current) => !current,
      )
    }
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className={`overflow-hidden rounded-xl border shadow-none transition-colors ${
        hasErrors
          ? "border-destructive/40"
          : ""
      }`}
    >
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div
        className={`p-4 sm:p-5 ${
          expanded
            ? "border-b"
            : ""
        }`}
      >
        <div className="flex items-start gap-3">

          {/* ====================================================
              PROGRESS
          ==================================================== */}

          <CircularProgress
            value={
              completionPercentage
            }
            isComplete={
              isComplete
            }
            size={36}
            label={`${service.name} required information completion`}
            valueNow={
              completedCount
            }
            valueMax={
              requiredCount
            }
          >
            <span
              className={
                isComplete
                  ? "text-primary"
                  : "text-muted-foreground"
              }
            >
              {index + 1}
            </span>
          </CircularProgress>

          {/* ====================================================
              SERVICE INFORMATION
          ==================================================== */}

          <button
            type="button"
            onClick={
              toggleExpanded
            }
            disabled={
              disabled
            }
            aria-expanded={
              expanded
            }
            aria-controls={`service-fields-${service.id}`}
            className="min-w-0 flex-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex flex-wrap items-center gap-2">

              <h2 className="min-w-0 break-words text-sm font-semibold sm:text-base">
                {
                  service.name
                }
              </h2>

              {service.code && (
                <Badge
                  variant="outline"
                  className="shrink-0"
                >
                  {
                    service.code
                  }
                </Badge>
              )}

              {service.category && (
                <Badge
                  variant="outline"
                  className="shrink-0 text-muted-foreground"
                >
                  {
                    service.category
                  }
                </Badge>
              )}

              {service.collectionMode && (
                <Badge
                  variant="secondary"
                  className="shrink-0"
                >
                  {formatCollectionMode(
                    service.collectionMode,
                  )}
                </Badge>
              )}

              {hasErrors && (
                <Badge
                  variant="destructive"
                  className="shrink-0 gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  Error
                </Badge>
              )}

            </div>

            {service.description && (
              <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground sm:text-sm">
                {
                  service.description
                }
              </p>
            )}

            {requiredCount >
              0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {isComplete
                  ? "Required information complete"
                  : `${completedCount}/${requiredCount} required fields completed`}
              </p>
            )}
          </button>

          {/* ====================================================
              ACTIONS
          ==================================================== */}

          <div className="flex shrink-0 items-center gap-1">

            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={
                disabled
              }
              aria-label={`Remove ${service.name}`}
              onClick={() =>
                onRemove(
                  service.id,
                )
              }
            >
              <X className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={
                disabled
              }
              aria-label={
                expanded
                  ? `Collapse ${service.name}`
                  : `Expand ${service.name}`
              }
              aria-expanded={
                expanded
              }
              onClick={
                toggleExpanded
              }
            >
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-200 ${
                  expanded
                    ? "rotate-180"
                    : ""
                }`}
              />
            </Button>

          </div>
        </div>
      </div>

      {/* ========================================================
          SERVICE FIELDS
      ======================================================== */}

      <div
        id={`service-fields-${service.id}`}
        hidden={!expanded}
      >
        <div className="grid gap-x-6 gap-y-6 p-4 sm:grid-cols-2 sm:p-6">

          {service.fields.map(
            (field) => {
              /*
               * RevenueField.id is the canonical identifier.
               *
               * We cannot safely use field.key here because the
               * backend validates fields using RevenueServiceField.id.
               */
              const fieldId =
                field.id

              /*
               * A configured revenue field should always have an ID.
               * If it doesn't, don't render a broken controlled field.
               */
              if (!fieldId) {
                return null
              }

              return (
                <div
                  key={fieldId}
                  className={
                    FULL_WIDTH_TYPES.has(
                      field.type,
                    )
                      ? "sm:col-span-2"
                      : ""
                  }
                >
                  <RevenueDynamicField
                    service={
                      service
                    }

                    field={
                      field
                    }

                    /*
                     * IMPORTANT:
                     *
                     * Values are stored using the field UUID.
                     */
                    value={
                      values[
                        fieldId
                      ]
                    }

                    /*
                     * IMPORTANT:
                     *
                     * Validation errors are also keyed by UUID.
                     */
                    error={
                      errors[
                        fieldId
                      ]
                    }

                    disabled={
                      disabled
                    }

                    /*
                     * IMPORTANT:
                     *
                     * Pass field.id to the parent.
                     *
                     * Do NOT pass field.key.
                     *
                     * Do NOT pass field.code.
                     */
                    onChange={(
                      value,
                    ) =>
                      onChange(
                        fieldId,
                        value,
                      )
                    }

                    onFileChange={(
                      event,
                    ) =>
                      onFileChange(
                        event,
                        field,
                      )
                    }

                    onRemoveFile={() =>
                      onRemoveFile(
                        field,
                      )
                    }
                  />
                </div>
              )
            },
          )}

        </div>

        {/* ======================================================
            VALIDATION ERROR SUMMARY
        ====================================================== */}

        {hasErrors && (
          <div className="border-t p-4 sm:p-6">

            <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">

              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />

              <div className="min-w-0">

                <p className="text-xs font-medium leading-5 text-amber-700 dark:text-amber-400">
                  Complete the required information for this service.
                </p>

                {Object.values(
                  errors,
                )
                  .filter(
                    Boolean,
                  )
                  .slice(0, 3)
                  .map(
                    (
                      error,
                      i,
                    ) => (
                      <p
                        key={i}
                        className="mt-1 text-xs leading-5 text-muted-foreground"
                      >
                        • {error}
                      </p>
                    ),
                  )}

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================
// CIRCULAR PROGRESS
// =============================================================

type CircularProgressProps = {
  value: number

  isComplete: boolean

  size?: number

  strokeWidth?: number

  label: string

  valueNow?: number

  valueMax?: number

  children?: ReactNode
}

function CircularProgress({
  value,
  isComplete,
  size = 36,
  strokeWidth = 3,
  label,
  valueNow,
  valueMax,
  children,
}: CircularProgressProps) {
  const radius =
    (size -
      strokeWidth) /
    2

  const circumference =
    2 *
    Math.PI *
    radius

  const clampedValue =
    Math.min(
      100,
      Math.max(
        0,
        value,
      ),
    )

  const offset =
    circumference -
    (clampedValue /
      100) *
      circumference

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={
        valueMax ?? 100
      }
      aria-valuenow={
        valueNow ??
        clampedValue
      }
      aria-label={
        label
      }
      className="relative shrink-0"
      style={{
        width: size,
        height: size,
      }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
      >
        <circle
          cx={
            size / 2
          }
          cy={
            size / 2
          }
          r={radius}
          fill="none"
          strokeWidth={
            strokeWidth
          }
          className="stroke-muted"
        />

        <circle
          cx={
            size / 2
          }
          cy={
            size / 2
          }
          r={radius}
          fill="none"
          strokeWidth={
            strokeWidth
          }
          strokeLinecap="round"
          strokeDasharray={
            circumference
          }
          strokeDashoffset={
            offset
          }
          className={`transition-all duration-300 ${
            isComplete
              ? "stroke-primary"
              : "stroke-primary/60"
          }`}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
        {
          children
        }
      </div>
    </div>
  )
}

// =============================================================
// FIELD COMPLETION
// =============================================================

function isFieldComplete(
  value: unknown,
  field: RevenueField,
): boolean {
  /*
   * FILE
   */
  if (
    field.type ===
    "FILE"
  ) {
    return (
      value instanceof File
    )
  }

  /*
   * MULTI FILE
   */
  if (
    field.type ===
    "MULTI_FILE"
  ) {
    return (
      Array.isArray(
        value,
      ) &&
      value.length > 0
    )
  }

  /*
   * CHECKBOX
   *
   * CHECKBOX fields are currently excluded from requiredFields,
   * but this makes the helper safe if called independently.
   */
  if (
    field.type ===
    "CHECKBOX"
  ) {
    return (
      value === true
    )
  }

  /*
   * Standard scalar fields.
   */
  return (
    value !==
      undefined &&
    value !== null &&
    String(value).trim() !==
      ""
  )
}