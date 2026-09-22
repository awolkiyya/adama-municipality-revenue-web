"use client"

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Save,
} from "lucide-react"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import type { ChangeEvent } from "react"

import { Button } from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Label } from "@/components/ui/label"

import { Separator } from "@/components/ui/separator"

import { RevenueServiceFields } from "@/components/revenue/assessment/revenue-service-fields"

import { RevenueServiceSelector } from "@/components/revenue/assessment/revenue-service-selector"

import { TaxpayerSelector } from "@/components/revenue/assessment/taxpayer-selector"

import type { Citizen } from "@/types/citizen"

import type {
  RevenueField,
  RevenueService,
} from "@/types/revenue/assessment"

import {
  useCalculateDirectCollection,
  useCreateDirectCollection,
  useUpdateDirectCollection,
} from "@/hooks/revenue/use-direct-collection"

import type {
  DirectCollectionCalculation,
  DirectCollectionFieldValue,
  DirectCollectionFields,
  DirectCollectionInvoice,
} from "@/types/revenue/direct-collection"

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type Step = 1 | 2 | 3

export type DirectCollectionFormMode =
  | "create"
  | "edit"

/*
|--------------------------------------------------------------------------
| Form Data
|--------------------------------------------------------------------------
*/

export interface DirectCollectionFormData {
  /**
   * Existing invoice/direct-collection ID.
   *
   * Required for edit mode.
   */
  id?: string | null

  taxpayerId: string

  revenueServiceId: string

  /**
   * Dynamic service field values.
   *
   * Keys MUST be RevenueServiceField UUIDs.
   */
  fields: DirectCollectionFields

  notes?: string

  /**
   * Optional reason for editing.
   */
  reason?: string
}

/*
|--------------------------------------------------------------------------
| Backward-compatible aliases
|--------------------------------------------------------------------------
|
| Your edit page currently imports:
|
|   CollectionFormData
|   CollectionResult
|
| Keep these exports so existing imports do not break.
|--------------------------------------------------------------------------
*/

export type CollectionFormData =
  DirectCollectionFormData

export interface DirectCollectionResult {
  invoiceId?: string
  invoiceNumber?: string
  status?: string
  amount?: string | number
  currency?: string
  taxpayerId?: string
  revenueServiceId?: string
}

export type CollectionResult =
  DirectCollectionResult

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/

interface DirectCollectionFormProps {
  initialData?: DirectCollectionFormData | null

  taxpayers: Citizen[]

  revenueServices: RevenueService[]

  onSuccess: (
    result: DirectCollectionResult,
  ) => void

  onCancel?: () => void

  /**
   * create:
   *   Create and issue a new invoice.
   *
   * edit:
   *   Update an existing direct collection
   *   while its invoice is still ISSUED/unpaid.
   */
  mode?: DirectCollectionFormMode
}

/*
|--------------------------------------------------------------------------
| Steps
|--------------------------------------------------------------------------
*/

const STEPS = [
  {
    number: 1 as Step,
    title: "Collection Info",
  },
  {
    number: 2 as Step,
    title: "Service Details",
  },
  {
    number: 3 as Step,
    title: "Review & Confirm",
  },
]

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get the backend RevenueServiceField ID.
 *
 * IMPORTANT:
 *
 * field.id  = database UUID
 * field.key = business/display key
 *
 * The API expects field.id.
 */
function getServiceFieldId(
  field: RevenueField,
): string {
  return String(field.id)
}

/**
 * Normalize field values so the API receives ONLY
 * RevenueServiceField.id keys.
 *
 * This also protects against stale state created before
 * the application was changed from field.key to field.id.
 */
function normalizeDirectCollectionFields(
  values: DirectCollectionFields,
  service: RevenueService | null,
): DirectCollectionFields {
  if (!service) {
    return {}
  }

  const normalized: DirectCollectionFields =
    {}

  for (const field of service.fields ?? []) {
    const fieldId =
      getServiceFieldId(field)

    if (!fieldId) {
      continue
    }

    /*
     * Preferred source:
     *
     * field.id
     */
    if (
      Object.prototype.hasOwnProperty.call(
        values,
        fieldId,
      )
    ) {
      normalized[fieldId] =
        values[fieldId]

      continue
    }

    /*
     * Backward compatibility:
     *
     * If an old field.key exists in state,
     * move its value to field.id.
     */
    if (
      field.key &&
      Object.prototype.hasOwnProperty.call(
        values,
        field.key,
      )
    ) {
      normalized[fieldId] =
        values[field.key]
    }
  }

  return normalized
}

/**
 * Convert an unknown dynamic field value into
 * a value accepted by DirectCollectionFields.
 */
function toDirectCollectionFieldValue(
  value: unknown,
): DirectCollectionFieldValue {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (
          item === null ||
          item === undefined
        ) {
          return ""
        }

        if (
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean"
        ) {
          return item
        }

        try {
          return JSON.stringify(item)
        } catch {
          return String(item)
        }
      })
      .join(", ")
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }

  return String(value)
}

/**
 * Safely extract an API/server error message.
 */
function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message
  }

  if (
    error &&
    typeof error === "object"
  ) {
    const record =
      error as Record<string, unknown>

    /*
     * Axios-style:
     *
     * error.response.data.message
     */
    const response =
      record.response

    if (
      response &&
      typeof response === "object"
    ) {
      const responseRecord =
        response as Record<
          string,
          unknown
        >

      const payload =
        responseRecord.data

      if (
        payload &&
        typeof payload === "object"
      ) {
        const payloadRecord =
          payload as Record<
            string,
            unknown
          >

        if (
          typeof payloadRecord.message ===
            "string" &&
          payloadRecord.message.trim()
        ) {
          return payloadRecord.message
        }

        /*
         * Laravel validation errors.
         */
        if (
          payloadRecord.errors &&
          typeof payloadRecord.errors ===
            "object"
        ) {
          const validationErrors =
            payloadRecord.errors as Record<
              string,
              unknown
            >

          const messages =
            Object.values(
              validationErrors,
            ).flatMap((value) =>
              Array.isArray(value)
                ? value
                : [value],
            )

          const textMessages =
            messages.filter(
              (
                value,
              ): value is string =>
                typeof value ===
                  "string" &&
                value.trim()
                  .length > 0,
            )

          if (
            textMessages.length > 0
          ) {
            return textMessages.join(
              " ",
            )
          }
        }
      }
    }

    /*
     * Generic:
     *
     * error.message
     */
    if (
      typeof record.message ===
        "string" &&
      record.message.trim()
    ) {
      return record.message
    }
  }

  return fallback
}

/**
 * Format dynamic field values for display.
 */
function formatFieldValue(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—"
  }

  if (
    typeof value === "boolean"
  ) {
    return value ? "Yes" : "No"
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? value.join(", ")
      : "—"
  }

  if (
    typeof value === "object"
  ) {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }

  return String(value)
}

/**
 * Format monetary values consistently.
 */
function formatAmount(
  amount:
    | string
    | number
    | null
    | undefined,
  currency = "ETB",
): string {
  if (
    amount === null ||
    amount === undefined ||
    amount === ""
  ) {
    return "—"
  }

  const numericAmount =
    Number(amount)

  if (
    !Number.isFinite(
      numericAmount,
    )
  ) {
    return `${String(amount)} ${currency}`
  }

  return `${numericAmount.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )} ${currency}`
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export function CollectionForm({
  initialData = null,
  taxpayers,
  revenueServices,
  onSuccess,
  onCancel,
  mode = "create",
}: DirectCollectionFormProps) {
  /*
  |--------------------------------------------------------------------------
  | Mutations
  |--------------------------------------------------------------------------
  */

  const {
    mutateAsync:
      calculateDirectCollection,
    isPending: isCalculating,
  } =
    useCalculateDirectCollection()

  const {
    mutateAsync:
      createDirectCollection,
    isPending: isCreating,
  } =
    useCreateDirectCollection()

  const {
    mutateAsync:
      updateDirectCollection,
    isPending: isUpdating,
  } =
    useUpdateDirectCollection()

  const isEditMode =
    mode === "edit"

  const isSubmitting =
    isCalculating ||
    isCreating ||
    isUpdating

  /*
  |--------------------------------------------------------------------------
  | FORM STATE
  |--------------------------------------------------------------------------
  */

  const [step, setStep] =
    useState<Step>(1)

  const [
    furthestStep,
    setFurthestStep,
  ] = useState<Step>(1)

  const [taxpayerId, setTaxpayerId] =
    useState(
      initialData?.taxpayerId ?? "",
    )

  /*
   * Direct Collection is SINGLE SERVICE based.
   */
  const [
    revenueServiceId,
    setRevenueServiceId,
  ] = useState(
    initialData?.revenueServiceId ??
      "",
  )

  /*
   * IMPORTANT:
   *
   * fieldValues should contain RevenueServiceField.id keys.
   */
  const [
    fieldValues,
    setFieldValues,
  ] =
    useState<DirectCollectionFields>(
      initialData?.fields ?? {},
    )

  const [notes, setNotes] =
    useState(
      initialData?.notes ?? "",
    )

  const [reason, setReason] =
    useState(
      initialData?.reason ?? "",
    )

  const [
    validationErrors,
    setValidationErrors,
  ] = useState<
    Record<string, string>
  >({})

  const [errors, setErrors] =
    useState<string[]>([])

  const [
    isConfirmed,
    setIsConfirmed,
  ] = useState(false)

  /*
  |--------------------------------------------------------------------------
  | SERVER CALCULATION
  |--------------------------------------------------------------------------
  */

  const [
    calculation,
    setCalculation,
  ] =
    useState<DirectCollectionCalculation | null>(
      null,
    )

  /*
  |--------------------------------------------------------------------------
  | DERIVED STATE
  |--------------------------------------------------------------------------
  */

  const selectedTaxpayer =
    useMemo(
      () =>
        taxpayers.find(
          (taxpayer) =>
            taxpayer.id ===
            taxpayerId,
        ) ?? null,
      [
        taxpayers,
        taxpayerId,
      ],
    )

  const selectedService =
    useMemo(
      () =>
        revenueServices.find(
          (service) =>
            service.id ===
            revenueServiceId,
        ) ?? null,
      [
        revenueServices,
        revenueServiceId,
      ],
    )

  /*
   * Always calculate the normalized version of the field state.
   *
   * This means even if stale field.key data exists in state,
   * API calls will never send it.
   */
  const normalizedFields =
    useMemo(
      () =>
        normalizeDirectCollectionFields(
          fieldValues,
          selectedService,
        ),
      [
        fieldValues,
        selectedService,
      ],
    )

  const progressPercent =
    useMemo(
      () =>
        ((step - 1) /
          (STEPS.length - 1)) *
        100,
      [step],
    )

  /*
  |--------------------------------------------------------------------------
  | INITIAL DATA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setStep(1)
    setFurthestStep(1)
    setValidationErrors({})
    setErrors([])
    setIsConfirmed(false)
    setCalculation(null)

    if (!initialData) {
      setTaxpayerId("")
      setRevenueServiceId("")
      setFieldValues({})
      setNotes("")
      setReason("")

      return
    }

    setTaxpayerId(
      initialData.taxpayerId ?? "",
    )

    setRevenueServiceId(
      initialData.revenueServiceId ??
        "",
    )

    setFieldValues(
      initialData.fields ?? {},
    )

    setNotes(
      initialData.notes ?? "",
    )

    setReason(
      initialData.reason ?? "",
    )
  }, [initialData])

  /*
  |--------------------------------------------------------------------------
  | TAXPAYER
  |--------------------------------------------------------------------------
  */

  const handleTaxpayerChange =
    useCallback(
      (value: string) => {
        setTaxpayerId(value)

        /*
         * Changing taxpayer invalidates
         * the previous server calculation.
         */
        setCalculation(null)
        setIsConfirmed(false)
        setValidationErrors({})
        setErrors([])
      },
      [],
    )

  /*
  |--------------------------------------------------------------------------
  | REVENUE SERVICE
  |--------------------------------------------------------------------------
  */

  const clearService =
    useCallback(() => {
      setRevenueServiceId("")
      setFieldValues({})
      setCalculation(null)
      setValidationErrors({})
      setIsConfirmed(false)
      setErrors([])
    }, [])

  const handleServiceSelection =
    useCallback(
      (serviceIds: string[]) => {
        /*
         * Direct Collection accepts
         * exactly ONE service.
         */
        const serviceId =
          serviceIds[0] ?? ""

        setRevenueServiceId(
          serviceId,
        )

        /*
         * Always clear previous service fields.
         *
         * This prevents old field.key or old service
         * UUID values from leaking into the new service.
         */
        setFieldValues({})

        setCalculation(null)
        setValidationErrors({})
        setIsConfirmed(false)
        setErrors([])
      },
      [],
    )

  /*
  |--------------------------------------------------------------------------
  | SERVICE FIELD CHANGE
  |--------------------------------------------------------------------------
  */

  const handleServiceFieldChange =
    useCallback(
      (
        fieldId: string,
        value: unknown,
      ) => {
        /*
         * fieldId MUST be RevenueServiceField.id.
         */
        const normalizedValue =
          toDirectCollectionFieldValue(
            value,
          )

        setFieldValues(
          (current) => ({
            ...current,

            /*
             * UUID is the API key.
             */
            [fieldId]:
              normalizedValue,
          }),
        )

        /*
         * Any field change invalidates
         * the previous calculation.
         */
        setCalculation(null)
        setIsConfirmed(false)
        setErrors([])

        setValidationErrors(
          (current) => {
            if (!current[fieldId]) {
              return current
            }

            const next = {
              ...current,
            }

            delete next[fieldId]

            return next
          },
        )
      },
      [],
    )

  /*
  |--------------------------------------------------------------------------
  | FILE CHANGE
  |--------------------------------------------------------------------------
  */

  const handleFileChange =
    useCallback(
      (
        event: ChangeEvent<HTMLInputElement>,
        field: RevenueField,
      ) => {
        const file =
          event.target.files?.[0] ??
          null

        /*
         * Store the value under field.id.
         */
        const fieldId =
          getServiceFieldId(field)

        setFieldValues(
          (current) => ({
            ...current,

            [fieldId]:
              file?.name ?? "",
          }),
        )

        setCalculation(null)
        setIsConfirmed(false)
        setErrors([])

        setValidationErrors(
          (current) => {
            if (!current[fieldId]) {
              return current
            }

            const next = {
              ...current,
            }

            delete next[fieldId]

            return next
          },
        )
      },
      [],
    )

  /*
  |--------------------------------------------------------------------------
  | REMOVE FILE
  |--------------------------------------------------------------------------
  */

  const removeFile =
    useCallback(
      (
        field: RevenueField,
      ) => {
        const fieldId =
          getServiceFieldId(field)

        setFieldValues(
          (current) => ({
            ...current,

            [fieldId]: "",
          }),
        )

        setCalculation(null)
        setIsConfirmed(false)
        setErrors([])

        setValidationErrors(
          (current) => {
            if (!current[fieldId]) {
              return current
            }

            const next = {
              ...current,
            }

            delete next[fieldId]

            return next
          },
        )
      },
      [],
    )

  /*
  |--------------------------------------------------------------------------
  | STEP 1 VALIDATION
  |--------------------------------------------------------------------------
  */

  const validateStepOne =
    useCallback(() => {
      const nextErrors: string[] = []

      if (!taxpayerId) {
        nextErrors.push(
          "Select a taxpayer before continuing.",
        )
      }

      if (!revenueServiceId) {
        nextErrors.push(
          "Select a revenue service before continuing.",
        )
      }

      setErrors(nextErrors)

      return (
        nextErrors.length === 0
      )
    }, [
      taxpayerId,
      revenueServiceId,
    ])

  /*
  |--------------------------------------------------------------------------
  | STEP 2 VALIDATION
  |--------------------------------------------------------------------------
  */

  const validateStepTwo =
    useCallback(() => {
      if (!selectedService) {
        setErrors([
          "Select a revenue service before continuing.",
        ])

        return false
      }

      const nextValidationErrors: Record<
        string,
        string
      > = {}

      const fields =
        selectedService.fields ?? []

      /*
       * Use normalized UUID-keyed values.
       */
      const values =
        normalizeDirectCollectionFields(
          fieldValues,
          selectedService,
        )

      /*
       * Backend remains authoritative.
       * This is only client-side basic validation.
       */
      for (const field of fields) {
        if (!field) {
          continue
        }

        const fieldId =
          getServiceFieldId(field)

        if (!fieldId) {
          continue
        }

        const rawValue =
          values[fieldId]

        /*
         * File values can be strings such as a filename.
         */
        const value =
          rawValue === null ||
          rawValue === undefined
            ? ""
            : String(
                rawValue,
              ).trim()

        /*
         * Support both possible property names.
         */
        const fieldRecord =
          field as RevenueField & {
            required?: boolean
            is_required?: boolean
          }

        const isRequired =
          fieldRecord.required ===
            true ||
          fieldRecord.is_required ===
            true

        /*
         * Checkbox false is a legitimate value.
         */
        if (
          isRequired &&
          field.type !==
            "CHECKBOX" &&
          !value
        ) {
          nextValidationErrors[
            fieldId
          ] =
            `${
              field.label ??
              "This field"
            } is required.`
        }
      }

      if (
        Object.keys(
          nextValidationErrors,
        ).length > 0
      ) {
        setValidationErrors(
          nextValidationErrors,
        )

        setErrors([
          "Complete all required fields before calculating the collection amount.",
        ])

        return false
      }

      setValidationErrors({})
      setErrors([])

      return true
    }, [
      selectedService,
      fieldValues,
    ])

  /*
  |--------------------------------------------------------------------------
  | CALCULATE
  |--------------------------------------------------------------------------
  */

  const handleCalculate =
    useCallback(async () => {
      if (isSubmitting) {
        return false
      }

      if (!taxpayerId) {
        setErrors([
          "Select a taxpayer before calculating.",
        ])

        setStep(1)

        return false
      }

      if (!revenueServiceId) {
        setErrors([
          "Select a revenue service before calculating.",
        ])

        setStep(1)

        return false
      }

      if (!validateStepTwo()) {
        return false
      }

      try {
        setErrors([])

        /*
         * Final API boundary normalization.
         */
        const fields =
          normalizeDirectCollectionFields(
            fieldValues,
            selectedService,
          )

        const result =
          await calculateDirectCollection(
            {
              taxpayer_id:
                taxpayerId,

              revenue_service_id:
                revenueServiceId,

              fields,
            },
          )

        setCalculation(result)

        setIsConfirmed(false)
        setErrors([])

        setStep(3)

        setFurthestStep(
          (current) =>
            Math.max(
              current,
              3,
            ) as Step,
        )

        return true
      } catch (error) {
        setCalculation(null)

        setErrors([
          getErrorMessage(
            error,
            "Unable to calculate the direct collection amount.",
          ),
        ])

        return false
      }
    }, [
      isSubmitting,
      taxpayerId,
      revenueServiceId,
      validateStepTwo,
      fieldValues,
      selectedService,
      calculateDirectCollection,
    ])

  /*
  |--------------------------------------------------------------------------
  | NEXT
  |--------------------------------------------------------------------------
  */

  const handleNext =
    useCallback(async () => {
      if (isSubmitting) {
        return
      }

      if (step === 1) {
        if (!validateStepOne()) {
          return
        }

        setStep(2)

        setFurthestStep(
          (current) =>
            Math.max(
              current,
              2,
            ) as Step,
        )

        return
      }

      if (step === 2) {
        await handleCalculate()
      }
    }, [
      isSubmitting,
      step,
      validateStepOne,
      handleCalculate,
    ])

  /*
  |--------------------------------------------------------------------------
  | BACK
  |--------------------------------------------------------------------------
  */

  const handleBack =
    useCallback(() => {
      if (isSubmitting) {
        return
      }

      if (step === 1) {
        onCancel?.()

        return
      }

      setStep(
        (current) =>
          (current - 1) as Step,
      )

      setIsConfirmed(false)
      setErrors([])
    }, [
      isSubmitting,
      step,
      onCancel,
    ])

  /*
  |--------------------------------------------------------------------------
  | STEP JUMP
  |--------------------------------------------------------------------------
  */

  const canJumpToStep =
    useCallback(
      (target: Step) =>
        target <= furthestStep &&
        target !== step &&
        !isSubmitting,
      [
        furthestStep,
        step,
        isSubmitting,
      ],
    )

  const handleStepClick =
    useCallback(
      (target: Step) => {
        if (
          !canJumpToStep(target)
        ) {
          return
        }

        if (target < step) {
          setIsConfirmed(false)
        }

        setStep(target)
        setErrors([])
      },
      [
        canJumpToStep,
        step,
      ],
    )

  /*
  |--------------------------------------------------------------------------
  | CONFIRMATION
  |--------------------------------------------------------------------------
  */

  const handleConfirmationChange =
    useCallback(
      (checked: boolean) => {
        setIsConfirmed(checked)

        if (checked) {
          setErrors([])
        }
      },
      [],
    )

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  |
  | CREATE:
  |   POST /direct-collections
  |
  | EDIT:
  |   PUT /direct-collections/{invoiceId}
  |
  | IMPORTANT:
  |
  | The frontend never sends the calculated amount as authoritative.
  | The backend recalculates it.
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    useCallback(async () => {
      if (isSubmitting) {
        return
      }

      if (!taxpayerId) {
        setErrors([
          "Taxpayer is required.",
        ])

        setStep(1)

        return
      }

      if (!revenueServiceId) {
        setErrors([
          "Revenue service is required.",
        ])

        setStep(1)

        return
      }

      if (!validateStepTwo()) {
        setStep(2)

        return
      }

      if (!calculation) {
        setErrors([
          "The collection amount must be calculated before submitting.",
        ])

        setStep(2)

        return
      }

      if (!isConfirmed) {
        setErrors([
          isEditMode
            ? "Confirm that the collection information is correct before updating the collection."
            : "Confirm that the collection information is correct before creating the invoice.",
        ])

        return
      }

      /*
       * The calculator currently requires a due date
       * before an invoice can be issued.
       */
      if (!calculation.due_date) {
        setErrors([
          "The server did not provide a due date for this direct collection.",
        ])

        return
      }

      /*
       * Edit mode requires the existing invoice ID.
       */
      if (isEditMode && !initialData?.id) {
        setErrors([
          "The direct collection invoice ID is missing. The collection cannot be updated.",
        ])

        return
      }

      try {
        setErrors([])

        /*
         * Always normalize again at the final API boundary.
         */
        const fields =
          normalizeDirectCollectionFields(
            fieldValues,
            selectedService,
          )

        /*
         * ==========================================================
         * EDIT
         * ==========================================================
         *
         * Backend will:
         *
         * 1. Lock the existing invoice.
         * 2. Verify status = ISSUED.
         * 3. Verify no payment has been made.
         * 4. Resolve taxpayer/service.
         * 5. Recalculate server-side.
         * 6. Preserve invoice number.
         * 7. Update existing invoice.
         * 8. Update existing invoice item.
         *
         * No new invoice is created.
         */
        if (isEditMode) {
          const invoice =
            await updateDirectCollection(
              {
                invoiceId:
                  initialData!.id!,

                payload: {
                  taxpayer_id:
                    taxpayerId,

                  revenue_service_id:
                    revenueServiceId,

                  fields,

                  notes:
                    notes.trim() ||
                    null,

                  reason:
                    reason.trim() ||
                    null,
                },
              },
            )

          const result =
            invoice as DirectCollectionInvoice

          /*
           * DirectCollectionResource returns:
           *
           * {
           *   id,
           *   invoice: {
           *     invoice_number,
           *     status,
           *     total_amount,
           *     currency,
           *     ...
           *   },
           *   taxpayer,
           *   taxpayer_id,
           *   revenue_service_id,
           *   ...
           * }
           */
          onSuccess({
            invoiceId:
              result.id,

            invoiceNumber:
              result.invoice
                ?.invoice_number,

            status:
              result.invoice?.status,

            amount:
              result.invoice
                ?.total_amount,

            currency:
              result.invoice?.currency,

            taxpayerId:
              result.taxpayer_id ??
              taxpayerId,

            revenueServiceId:
              result.revenue_service_id ??
              revenueServiceId,
          })

          return
        }

        /*
         * ==========================================================
         * CREATE
         * ==========================================================
         */

        const invoice =
          await createDirectCollection(
            {
              taxpayer_id:
                taxpayerId,

              revenue_service_id:
                revenueServiceId,

              fields,

              /*
               * Kept for compatibility with
               * StoreDirectCollectionPayload.
               *
               * Backend calculation remains authoritative.
               */
              due_date:
                calculation.due_date,

              notes:
                notes.trim() ||
                null,
            },
          )

        const result =
          invoice as DirectCollectionInvoice

        onSuccess({
          invoiceId:
            result.id,

          invoiceNumber:
            result.invoice
              ?.invoice_number,

          status:
            result.invoice?.status,

          amount:
            result.invoice
              ?.total_amount,

          currency:
            result.invoice?.currency,

          taxpayerId:
            result.taxpayer_id ??
            taxpayerId,

          revenueServiceId:
            result.revenue_service_id ??
            revenueServiceId,
        })
      } catch (error) {
        setErrors([
          getErrorMessage(
            error,
            isEditMode
              ? "Unable to update the direct collection."
              : "Unable to create the direct collection.",
          ),
        ])
      }
    }, [
      isSubmitting,
      taxpayerId,
      revenueServiceId,
      validateStepTwo,
      calculation,
      isConfirmed,
      isEditMode,
      initialData,
      fieldValues,
      selectedService,
      notes,
      reason,
      updateDirectCollection,
      createDirectCollection,
      onSuccess,
    ])

  /*
  |--------------------------------------------------------------------------
  | CALCULATION DISPLAY
  |--------------------------------------------------------------------------
  */

  const calculatedAmount =
    calculation?.amount

  const calculatedCurrency =
    calculation?.currency ??
    "ETB"

  const calculatedDueDate =
    calculation?.due_date ??
    null

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">

      {/* =====================================================
          HEADER + STEPPER
          ===================================================== */}

      <div className="space-y-4">

        <div className="flex items-center gap-3">

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={handleBack}
            disabled={
              isSubmitting
            }
            aria-label={
              step === 1
                ? "Cancel"
                : "Go back"
            }
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div className="min-w-0">

            <h1 className="truncate text-lg font-semibold tracking-tight">
              {isEditMode
                ? "Update Direct Collection"
                : "Start Direct Collection"}
            </h1>

            <p className="text-xs text-muted-foreground">
              {isEditMode
                ? "Update this collection before payment is recorded."
                : "Collect payment directly without an assessment."}
            </p>

          </div>

        </div>

        {/* ===================================================
            STEPPER
            =================================================== */}

        <div className="space-y-2">

          <div className="flex items-center justify-between text-xs">

            {STEPS.map((item) => {
              const active =
                step === item.number

              const completed =
                step > item.number

              const reachable =
                canJumpToStep(
                  item.number,
                )

              return (
                <button
                  key={item.number}
                  type="button"
                  onClick={() =>
                    handleStepClick(
                      item.number,
                    )
                  }
                  disabled={
                    !reachable
                  }
                  className={[
                    "flex items-center gap-1.5 rounded font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground",
                    reachable
                      ? "cursor-pointer hover:text-foreground"
                      : "cursor-default",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex size-5 items-center justify-center rounded-full border text-[10px] transition-colors",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : completed
                          ? "border-foreground/40 text-foreground"
                          : "border-border",
                    ].join(" ")}
                  >
                    {completed ? (
                      <Check className="size-3" />
                    ) : (
                      item.number
                    )}
                  </span>

                  <span className="hidden sm:inline">
                    {item.title}
                  </span>
                </button>
              )
            })}

          </div>

          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">

            <div
              className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-out"
              style={{
                width: `${progressPercent}%`,
              }}
            />

          </div>

        </div>

      </div>

      {/* =====================================================
          ERRORS
          ===================================================== */}

      {errors.length > 0 && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3"
        >

          <div className="space-y-1">

            {errors.map(
              (
                error,
                index,
              ) => (
                <p
                  key={`${error}-${index}`}
                  className="text-sm text-destructive"
                >
                  {error}
                </p>
              ),
            )}

          </div>

        </div>
      )}

      {/* =====================================================
          STEP 1 — COLLECTION INFO
          ===================================================== */}

      {step === 1 && (
        <Card className="shadow-none">

          <CardHeader className="pb-3">

            <CardTitle className="text-base">
              Collection Information
            </CardTitle>

            <CardDescription>
              Select the taxpayer and
              revenue service for this
              direct collection.
            </CardDescription>

          </CardHeader>

          <CardContent className="space-y-6 p-5 pt-0">

            <div className="space-y-2">

              <Label className="text-sm font-medium">
                Taxpayer
              </Label>

              <TaxpayerSelector
                value={
                  taxpayerId
                }
                onChange={
                  handleTaxpayerChange
                }
                taxpayers={
                  taxpayers
                }
              />

            </div>

            <div className="space-y-2">

              <Label className="text-sm font-medium">
                Revenue Service
              </Label>

              <RevenueServiceSelector
                mode="multi"
                services={
                  revenueServices
                }
                selectedServiceIds={
                  revenueServiceId
                    ? [
                        revenueServiceId,
                      ]
                    : []
                }
                onChange={
                  handleServiceSelection
                }
                onRemoveService={
                  clearService
                }
                onClearServices={
                  clearService
                }
              />

              <p className="text-xs text-muted-foreground">
                Direct Collection processes
                one revenue service at a
                time.
              </p>

            </div>

          </CardContent>

        </Card>
      )}

      {/* =====================================================
          STEP 2 — SERVICE DETAILS
          ===================================================== */}

      {step === 2 && (
        <div className="space-y-5">

          {!selectedService ? (
            <Card className="shadow-none">

              <CardContent className="p-5">

                <p className="text-sm text-muted-foreground">
                  Select a revenue service
                  first.
                </p>

              </CardContent>

            </Card>
          ) : (
            <Card className="shadow-none">

              <CardHeader className="pb-3">

                <CardTitle className="text-base">
                  {
                    selectedService.name
                  }
                </CardTitle>

                <CardDescription>
                  {selectedService.code
                    ? `Revenue code: ${selectedService.code}`
                    : "Complete the fields for this revenue service."}
                </CardDescription>

              </CardHeader>

              <CardContent className="space-y-5">

                <RevenueServiceFields
                  service={
                    selectedService
                  }
                  index={0}
                  values={
                    fieldValues
                  }
                  errors={
                    validationErrors
                  }
                  onChange={(
                    fieldId,
                    value,
                  ) =>
                    handleServiceFieldChange(
                      fieldId,
                      value,
                    )
                  }
                  onFileChange={(
                    event,
                    field,
                  ) =>
                    handleFileChange(
                      event,
                      field,
                    )
                  }
                  onRemoveFile={(
                    field,
                  ) =>
                    removeFile(field)
                  }
                  onRemove={() => {
                    clearService()
                    setStep(1)
                  }}
                />

              </CardContent>

            </Card>
          )}

          {/* =================================================
              NOTES
              ================================================= */}

          <Card className="shadow-none">

            <CardContent className="p-5">

              <div className="space-y-2">

                <Label
                  htmlFor="collection-notes"
                  className="text-sm font-medium"
                >
                  Notes

                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    Optional
                  </span>
                </Label>

                <textarea
                  id="collection-notes"
                  value={
                    notes
                  }
                  onChange={(event) => {
                    setNotes(
                      event.target.value,
                    )

                    setCalculation(
                      null,
                    )

                    setIsConfirmed(
                      false,
                    )
                  }}
                  placeholder="Add any relevant collection notes..."
                  rows={3}
                  disabled={
                    isSubmitting
                  }
                  maxLength={2000}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />

                <p className="text-right text-[11px] text-muted-foreground">
                  {notes.length}/2000
                </p>

              </div>

            </CardContent>

          </Card>

          {/* =================================================
              EDIT REASON
              ================================================= */}

          {isEditMode && (
            <Card className="shadow-none">

              <CardContent className="p-5">

                <div className="space-y-2">

                  <Label
                    htmlFor="collection-edit-reason"
                    className="text-sm font-medium"
                  >
                    Edit Reason

                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      Optional
                    </span>
                  </Label>

                  <textarea
                    id="collection-edit-reason"
                    value={
                      reason
                    }
                    onChange={(event) =>
                      setReason(
                        event.target.value,
                      )
                    }
                    placeholder="Explain why this collection is being updated..."
                    rows={3}
                    disabled={
                      isSubmitting
                    }
                    maxLength={1000}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <p className="text-right text-[11px] text-muted-foreground">
                    {reason.length}/1000
                  </p>

                </div>

              </CardContent>

            </Card>
          )}

        </div>
      )}

      {/* =====================================================
          STEP 3 — REVIEW & CONFIRM
          ===================================================== */}

      {step === 3 && (
        <Card className="shadow-none">

          <CardHeader className="pb-3">

            <CardTitle className="text-base">
              {isEditMode
                ? "Review Collection Update"
                : "Review Direct Collection"}
            </CardTitle>

            <CardDescription>
              {isEditMode
                ? "Review the changes and the server-calculated amount before updating the collection."
                : "Review the submitted information and the amount calculated by the server before issuing the invoice."}
            </CardDescription>

          </CardHeader>

          <CardContent className="space-y-5 p-5 pt-0">

            {/* =================================================
                SUMMARY
                ================================================= */}

            <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm sm:grid-cols-4">

              <div>

                <dt className="text-xs text-muted-foreground">
                  Taxpayer
                </dt>

                <dd className="mt-0.5 font-medium">
                  {selectedTaxpayer
                    ? selectedTaxpayer.full_name
                    : taxpayerId ||
                      "—"}
                </dd>

              </div>

              <div>

                <dt className="text-xs text-muted-foreground">
                  Revenue Service
                </dt>

                <dd className="mt-0.5 font-medium">
                  {selectedService?.name ??
                    "—"}
                </dd>

              </div>

              <div>

                <dt className="text-xs text-muted-foreground">
                  Calculation
                </dt>

                <dd className="mt-0.5 font-medium">
                  {calculation
                    ? "Calculated"
                    : "Not calculated"}
                </dd>

              </div>

              <div>

                <dt className="text-xs text-muted-foreground">
                  Due Date
                </dt>

                <dd className="mt-0.5 font-medium">
                  {calculatedDueDate ??
                    "—"}
                </dd>

              </div>

            </dl>

            {/* =================================================
                CALCULATED AMOUNT
                ================================================= */}

            <Separator />

            <div className="rounded-xl border bg-muted/20 p-5">

              <div className="space-y-2">

                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Calculated Amount
                </p>

                <p className="text-3xl font-semibold tracking-tight">
                  {formatAmount(
                    calculatedAmount,
                    calculatedCurrency,
                  )}
                </p>

                <p className="text-xs text-muted-foreground">
                  Calculated by the server
                  using the active tariff
                  configuration.
                </p>

              </div>

            </div>

            {/* =================================================
                SERVICE
                ================================================= */}

            {selectedService && (
              <>
                <Separator />

                <div className="rounded-lg border p-4">

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <p className="text-sm font-semibold">
                        {
                          selectedService.name
                        }
                      </p>

                      {selectedService.code && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Revenue code:{" "}
                          <span className="font-mono">
                            {
                              selectedService.code
                            }
                          </span>
                        </p>
                      )}

                    </div>

                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                      Direct Collection
                    </span>

                  </div>

                  {/* FIELDS */}

                  {(
                    selectedService.fields ??
                    []
                  ).length > 0 && (
                    <div className="mt-4 space-y-2 border-t pt-3 text-sm">

                      {(
                        selectedService.fields ??
                        []
                      ).map(
                        (field) => {
                          const fieldId =
                            getServiceFieldId(
                              field,
                            )

                          return (
                            <div
                              key={
                                fieldId
                              }
                              className="flex items-start justify-between gap-4"
                            >

                              <span className="text-muted-foreground">
                                {
                                  field.label ??
                                  fieldId
                                }
                              </span>

                              <span className="max-w-[60%] break-words text-right font-medium">
                                {formatFieldValue(
                                  normalizedFields[
                                    fieldId
                                  ],
                                )}
                              </span>

                            </div>
                          )
                        },
                      )}

                    </div>
                  )}

                </div>
              </>
            )}

            {/* =================================================
                NOTES
                ================================================= */}

            {notes.trim() && (
              <>
                <Separator />

                <div>

                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Notes
                  </p>

                  <p className="whitespace-pre-wrap text-sm">
                    {notes}
                  </p>

                </div>
              </>
            )}

            {/* =================================================
                EDIT REASON
                ================================================= */}

            {isEditMode &&
              reason.trim() && (
                <>
                  <Separator />

                  <div>

                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Edit Reason
                    </p>

                    <p className="whitespace-pre-wrap text-sm">
                      {reason}
                    </p>

                  </div>
                </>
              )}

            <Separator />

            {/* =================================================
                FINANCIAL FLOW
                ================================================= */}

            <div className="rounded-lg border border-dashed p-4">

              <p className="text-xs font-medium text-muted-foreground">
                Processing flow
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">

                <span className="rounded-md bg-muted px-2.5 py-1.5">
                  Direct Collection
                </span>

                <ArrowRight className="size-3.5 text-muted-foreground" />

                <span className="rounded-md bg-muted px-2.5 py-1.5">
                  Calculate
                </span>

                <ArrowRight className="size-3.5 text-muted-foreground" />

                {isEditMode ? (
                  <>
                    <span className="rounded-md bg-muted px-2.5 py-1.5">
                      Update Invoice
                    </span>

                    <ArrowRight className="size-3.5 text-muted-foreground" />

                    <span className="rounded-md bg-muted px-2.5 py-1.5">
                      Issued
                    </span>
                  </>
                ) : (
                  <>
                    <span className="rounded-md bg-muted px-2.5 py-1.5">
                      Invoice
                    </span>

                    <ArrowRight className="size-3.5 text-muted-foreground" />

                    <span className="rounded-md bg-muted px-2.5 py-1.5">
                      Issued
                    </span>
                  </>
                )}

              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Payment and receipt are recorded
                after the invoice is issued.
              </p>

            </div>

            {/* =================================================
                CONFIRMATION
                ================================================= */}

            <label
              htmlFor="collection-confirmation"
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-dashed p-3 has-[:checked]:border-foreground/30 has-[:checked]:bg-muted/20"
            >

              <input
                id="collection-confirmation"
                type="checkbox"
                checked={
                  isConfirmed
                }
                onChange={(event) =>
                  handleConfirmationChange(
                    event.target
                      .checked,
                  )
                }
                disabled={
                  isSubmitting
                }
                className="mt-0.5 size-4 shrink-0 rounded border-input accent-foreground"
              />

              <span className="text-sm">
                {isEditMode
                  ? "The information is correct. Proceed with updating this direct collection."
                  : "The information is correct. Proceed with the direct collection and issue its invoice."}
              </span>

            </label>

          </CardContent>

        </Card>
      )}

      {/* =====================================================
          ACTIONS
          ===================================================== */}

      <div className="flex items-center justify-between gap-3">

        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={
            isSubmitting
          }
        >
          <ArrowLeft className="mr-2 size-4" />

          {step === 1
            ? "Cancel"
            : "Back"}
        </Button>

        {step < 3 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={
              isSubmitting
            }
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />

                Calculating...
              </>
            ) : (
              <>
                {step === 1
                  ? "Continue"
                  : "Calculate & Review"}

                <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !isConfirmed ||
              !calculation ||
              !calculation.due_date
            }
          >
            {isCreating ||
            isUpdating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />

                {isEditMode
                  ? "Updating Collection..."
                  : "Creating Invoice..."}
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />

                {isEditMode
                  ? "Update Collection"
                  : "Create & Issue Invoice"}
              </>
            )}
          </Button>
        )}

      </div>

    </div>
  )
}