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
import type { RevenueService } from "@/types/revenue/assessment"

type CollectionFormMode = "create" | "edit"

type Step = 1 | 2 | 3

/*
|--------------------------------------------------------------------------
| Form Types
|--------------------------------------------------------------------------
*/

export interface CollectionServiceData {
  revenueServiceId: string
  serviceFieldValues: Record<string, unknown>
}

export interface CollectionFormData {
  id?: string

  taxpayerId: string

  services: CollectionServiceData[]

  collectionDate?: string

  notes?: string
}

export interface CollectionResult {
  id: string

  invoiceId?: string

  status?: string
}

interface CollectionFormProps {
  mode: CollectionFormMode

  initialData?: CollectionFormData | null

  taxpayers: Citizen[]

  revenueServices: RevenueService[]

  onSuccess: (
    collection: CollectionResult,
  ) => void

  onCancel?: () => void

  createEndpoint?: string

  updateEndpoint?: string
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

function getToday(): string {
  const date = new Date()

  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0")

  const day = String(
    date.getDate(),
  ).padStart(2, "0")

  return `${year}-${month}-${day}`
}

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

  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? value.join(", ")
      : "—"
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

function getApiErrorMessage(
  payload: unknown,
  fallback: string,
): string {
  if (
    !payload ||
    typeof payload !== "object"
  ) {
    return fallback
  }

  const record =
    payload as Record<string, unknown>

  if (
    typeof record.message === "string" &&
    record.message.trim()
  ) {
    return record.message
  }

  if (
    record.errors &&
    typeof record.errors === "object"
  ) {
    const validationErrors =
      record.errors as Record<
        string,
        unknown
      >

    const messages = Object.values(
      validationErrors,
    ).flatMap((value) =>
      Array.isArray(value)
        ? value
        : [value],
    )

    const stringMessages =
      messages.filter(
        (message): message is string =>
          typeof message === "string" &&
          message.trim().length > 0,
      )

    if (stringMessages.length > 0) {
      return stringMessages.join(" ")
    }
  }

  return fallback
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export function CollectionForm({
  mode,
  initialData = null,
  taxpayers,
  revenueServices,
  onSuccess,
  onCancel,
  createEndpoint = "/api/v1/field-collections",
  updateEndpoint,
}: CollectionFormProps) {
  // =========================================================
  // FORM STATE
  // =========================================================

  const [step, setStep] =
    useState<Step>(1)

  const [
    furthestStep,
    setFurthestStep,
  ] = useState<Step>(1)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [taxpayerId, setTaxpayerId] =
    useState(
      initialData?.taxpayerId ?? "",
    )

  /*
   * Multiple revenue services can
   * belong to the same field
   * collection.
   */
  const [
    selectedServiceIds,
    setSelectedServiceIds,
  ] = useState<string[]>(
    initialData?.services?.map(
      (service) =>
        service.revenueServiceId,
    ) ?? [],
  )

  /*
   * Each service owns an independent
   * field-value object.
   *
   * {
   *   "service-1": { "quantity": 10, "location": "Adama" },
   *   "service-2": { "area": 500 }
   * }
   */
  const [
    serviceFieldValues,
    setServiceFieldValues,
  ] = useState<
    Record<
      string,
      Record<string, unknown>
    >
  >(() => {
    if (!initialData?.services) {
      return {}
    }

    return initialData.services.reduce(
      (accumulator, service) => {
        accumulator[
          service.revenueServiceId
        ] =
          service.serviceFieldValues ??
          {}

        return accumulator
      },
      {} as Record<
        string,
        Record<string, unknown>
      >,
    )
  })

  /*
   * Validation errors are also
   * stored per service.
   */
  const [
    validationErrors,
    setValidationErrors,
  ] = useState<
    Record<
      string,
      Record<string, string>
    >
  >({})

  /*
   * There is no separate "collection
   * date" input in the UI — collectors
   * always submit live, on-site, so
   * this is set automatically and sent
   * along with the request without
   * requiring the user to touch it.
   */
  const [
    collectionDate,
    setCollectionDate,
  ] = useState(
    initialData?.collectionDate ??
      getToday(),
  )

  const [notes, setNotes] =
    useState(
      initialData?.notes ?? "",
    )

  const [errors, setErrors] =
    useState<string[]>([])

  const [
    isConfirmed,
    setIsConfirmed,
  ] = useState(false)

  // =========================================================
  // DERIVED STATE
  // =========================================================

  const selectedServices = useMemo(
    () =>
      revenueServices.filter(
        (service) =>
          selectedServiceIds.includes(
            service.id,
          ),
      ),
    [
      revenueServices,
      selectedServiceIds,
    ],
  )

  const selectedTaxpayer = useMemo(
    () =>
      taxpayers.find(
        (taxpayer) =>
          taxpayer.id === taxpayerId,
      ) ?? null,
    [
      taxpayers,
      taxpayerId,
    ],
  )

  const progressPercent = useMemo(
    () =>
      ((step - 1) /
        (STEPS.length - 1)) *
      100,
    [step],
  )

  // =========================================================
  // SYNCHRONIZE INITIAL DATA
  // =========================================================

  useEffect(() => {
    setStep(1)

    setFurthestStep(1)

    setValidationErrors({})

    setErrors([])

    setIsConfirmed(false)

    if (!initialData) {
      setTaxpayerId("")

      setSelectedServiceIds([])

      setServiceFieldValues({})

      setCollectionDate(getToday())

      setNotes("")

      return
    }

    setTaxpayerId(
      initialData.taxpayerId ?? "",
    )

    const services =
      initialData.services ?? []

    setSelectedServiceIds(
      services.map(
        (service) =>
          service.revenueServiceId,
      ),
    )

    const fieldValues = services.reduce(
      (accumulator, service) => {
        accumulator[
          service.revenueServiceId
        ] =
          service.serviceFieldValues ??
          {}

        return accumulator
      },
      {} as Record<
        string,
        Record<string, unknown>
      >,
    )

    setServiceFieldValues(fieldValues)

    setCollectionDate(
      initialData.collectionDate ??
        getToday(),
    )

    setNotes(
      initialData.notes ?? "",
    )
  }, [initialData])

  // =========================================================
  // TAXPAYER
  // =========================================================

  const handleTaxpayerChange =
    useCallback((value: string) => {
      setTaxpayerId(value)

      setValidationErrors({})

      setIsConfirmed(false)

      setErrors([])
    }, [])

  // =========================================================
  // REVENUE SERVICES
  // =========================================================

  const handleServiceSelection =
    useCallback(
      (serviceIds: string[]) => {
        setSelectedServiceIds(
          serviceIds,
        )

        /*
         * Preserve existing field values
         * for services that remain
         * selected; new services get an
         * empty field-value object.
         */
        setServiceFieldValues(
          (current) => {
            const next: Record<
              string,
              Record<string, unknown>
            > = {}

            for (const serviceId of serviceIds) {
              next[serviceId] =
                current[serviceId] ?? {}
            }

            return next
          },
        )

        setValidationErrors(
          (current) => {
            const next: Record<
              string,
              Record<string, string>
            > = {}

            for (const serviceId of serviceIds) {
              if (current[serviceId]) {
                next[serviceId] =
                  current[serviceId]
              }
            }

            return next
          },
        )

        setIsConfirmed(false)

        setErrors([])
      },
      [],
    )

  const handleRemoveService =
    useCallback((serviceId: string) => {
      setSelectedServiceIds((current) =>
        current.filter(
          (id) => id !== serviceId,
        ),
      )

      setServiceFieldValues((current) => {
        const next = { ...current }

        delete next[serviceId]

        return next
      })

      setValidationErrors((current) => {
        const next = { ...current }

        delete next[serviceId]

        return next
      })

      setIsConfirmed(false)

      setErrors([])
    }, [])

  const handleClearServices =
    useCallback(() => {
      setSelectedServiceIds([])

      setServiceFieldValues({})

      setValidationErrors({})

      setIsConfirmed(false)

      setErrors([])
    }, [])

  // =========================================================
  // SERVICE FIELD CHANGE
  // =========================================================

  const handleServiceFieldChange =
    useCallback(
      (
        serviceId: string,
        field: string,
        value: unknown,
      ) => {
        setServiceFieldValues(
          (current) => ({
            ...current,

            [serviceId]: {
              ...(current[serviceId] ??
                {}),
              [field]: value,
            },
          }),
        )

        setValidationErrors(
          (current) => {
            const serviceErrors =
              current[serviceId]

            if (
              !serviceErrors?.[field]
            ) {
              return current
            }

            const nextServiceErrors = {
              ...serviceErrors,
            }

            delete nextServiceErrors[
              field
            ]

            return {
              ...current,

              [serviceId]:
                nextServiceErrors,
            }
          },
        )

        setIsConfirmed(false)

        setErrors([])
      },
      [],
    )

  // =========================================================
  // FILE HANDLING
  // =========================================================

  const handleFileChange =
    useCallback(
      (
        event: ChangeEvent<HTMLInputElement>,
        serviceId: string,
        field: RevenueService["fields"][number],
      ) => {
        const file =
          event.target.files?.[0] ??
          null

        const fieldKey =
          field.key ?? field.id

        setServiceFieldValues(
          (current) => ({
            ...current,

            [serviceId]: {
              ...(current[serviceId] ??
                {}),
              [fieldKey]:
                file?.name ?? "",
            },
          }),
        )

        setValidationErrors(
          (current) => {
            const serviceErrors =
              current[serviceId]

            if (
              !serviceErrors?.[
                fieldKey
              ]
            ) {
              return current
            }

            const nextServiceErrors = {
              ...serviceErrors,
            }

            delete nextServiceErrors[
              fieldKey
            ]

            return {
              ...current,

              [serviceId]:
                nextServiceErrors,
            }
          },
        )

        setIsConfirmed(false)

        setErrors([])
      },
      [],
    )

  const removeFile = useCallback(
    (
      serviceId: string,
      field: RevenueService["fields"][number],
    ) => {
      const fieldKey =
        field.key ?? field.id

      setServiceFieldValues(
        (current) => ({
          ...current,

          [serviceId]: {
            ...(current[serviceId] ??
              {}),
            [fieldKey]: "",
          },
        }),
      )

      setValidationErrors((current) => {
        const serviceErrors =
          current[serviceId]

        if (!serviceErrors?.[fieldKey]) {
          return current
        }

        const nextServiceErrors = {
          ...serviceErrors,
        }

        delete nextServiceErrors[
          fieldKey
        ]

        return {
          ...current,

          [serviceId]: nextServiceErrors,
        }
      })

      setIsConfirmed(false)

      setErrors([])
    },
    [],
  )

  // =========================================================
  // VALIDATION
  // =========================================================

  const validateStepOne = useCallback(
    () => {
      const nextErrors: string[] = []

      if (!taxpayerId) {
        nextErrors.push(
          "Select a taxpayer before continuing.",
        )
      }

      if (selectedServiceIds.length === 0) {
        nextErrors.push(
          "Select at least one revenue service before continuing.",
        )
      }

      setErrors(nextErrors)

      return nextErrors.length === 0
    },
    [taxpayerId, selectedServiceIds],
  )

  const validateStepTwo = useCallback(
    () => {
      if (selectedServiceIds.length === 0) {
        setErrors([
          "Select at least one revenue service before continuing.",
        ])

        return false
      }

      const nextValidationErrors: Record<
        string,
        Record<string, string>
      > = {}

      /*
       * Validate every selected
       * service.
       */
      for (const service of selectedServices) {
        const values =
          serviceFieldValues[
            service.id
          ] ?? {}

        const fieldErrors: Record<
          string,
          string
        > = {}

        const fields = service.fields ?? []

        for (const field of fields) {
          if (!field) {
            continue
          }

          const fieldKey =
            field.key ?? field.id

          const rawValue =
            values[fieldKey]

          const value =
            rawValue == null
              ? ""
              : String(rawValue).trim()

          if (!value) {
            fieldErrors[fieldKey] =
              `${
                field.label ??
                "This field"
              } is required.`
          }
        }

        if (
          Object.keys(fieldErrors)
            .length > 0
        ) {
          nextValidationErrors[
            service.id
          ] = fieldErrors
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
          "Complete all required fields for every selected revenue service before continuing.",
        ])

        return false
      }

      setValidationErrors({})

      setErrors([])

      return true
    },
    [
      selectedServiceIds,
      selectedServices,
      serviceFieldValues,
    ],
  )

  // =========================================================
  // STEP NAVIGATION
  // =========================================================

  const handleNext = () => {
    if (isSubmitting) {
      return
    }

    if (step === 1) {
      if (!validateStepOne()) {
        return
      }

      setStep(2)

      setFurthestStep((current) =>
        Math.max(current, 2) as Step,
      )

      return
    }

    if (step === 2) {
      if (!validateStepTwo()) {
        return
      }

      setStep(3)

      setFurthestStep((current) =>
        Math.max(current, 3) as Step,
      )
    }
  }

  const handleBack = () => {
    if (isSubmitting) {
      return
    }

    if (step === 1) {
      onCancel?.()

      return
    }

    setStep(
      (current) => (current - 1) as Step,
    )

    setIsConfirmed(false)

    setErrors([])
  }

  const canJumpToStep = useCallback(
    (target: Step) =>
      target <= furthestStep &&
      target !== step &&
      !isSubmitting,
    [furthestStep, step, isSubmitting],
  )

  const handleStepClick = useCallback(
    (target: Step) => {
      if (!canJumpToStep(target)) {
        return
      }

      setStep(target)

      if (target < furthestStep) {
        setIsConfirmed(false)
      }

      setErrors([])
    },
    [canJumpToStep, furthestStep],
  )

  // =========================================================
  // CONFIRMATION
  // =========================================================

  const handleConfirmationChange =
    useCallback((checked: boolean) => {
      setIsConfirmed(checked)

      if (checked) {
        setErrors([])
      }
    }, [])

  // =========================================================
  // CREATE / UPDATE
  // =========================================================

  const handleSubmit = async () => {
    if (isSubmitting) {
      return
    }

    if (
      !taxpayerId ||
      selectedServiceIds.length === 0
    ) {
      setErrors([
        "Taxpayer and at least one revenue service are required.",
      ])

      return
    }

    if (!validateStepTwo()) {
      setStep(2)

      return
    }

    if (!isConfirmed) {
      setErrors([
        "Confirm that the collection information is correct before saving.",
      ])

      return
    }

    setIsSubmitting(true)

    setErrors([])

    try {
      const endpoint =
        mode === "edit"
          ? updateEndpoint ??
            (initialData?.id
              ? `/api/v1/field-collections/${initialData.id}`
              : null)
          : createEndpoint

      if (!endpoint) {
        throw new Error(
          "An update endpoint or collection ID is required.",
        )
      }

      const method =
        mode === "edit" ? "PUT" : "POST"

      /*
       * One Field Collection
       *      ↓
       * Multiple Services
       *      ↓
       * One Invoice
       *      ↓
       * Multiple Invoice Items
       */
      const services =
        selectedServiceIds.map(
          (serviceId) => ({
            revenue_service_id:
              serviceId,

            service_fields:
              serviceFieldValues[
                serviceId
              ] ?? {},
          }),
        )

      const response = await fetch(
        endpoint,
        {
          method,

          headers: {
            "Content-Type":
              "application/json",

            Accept: "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            taxpayer_id: taxpayerId,

            services,

            collection_date:
              collectionDate,

            notes: notes.trim() || null,
          }),
        },
      )

      const payload = await response
        .json()
        .catch(() => null)

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            payload,
            `Unable to ${
              mode === "edit"
                ? "update"
                : "create"
            } the collection.`,
          ),
        )
      }

      const data = payload?.data ?? payload

      if (!data?.id) {
        throw new Error(
          "The server did not return a collection ID.",
        )
      }

      onSuccess({
        id: data.id,

        invoiceId:
          data.invoice_id ??
          data.invoiceId,

        status: data.status,
      })
    } catch (error) {
      setErrors([
        error instanceof Error
          ? error.message
          : `Unable to ${
              mode === "edit"
                ? "update"
                : "create"
            } the collection.`,
      ])
    } finally {
      setIsSubmitting(false)
    }
  }

  // =========================================================
  // RENDER
  // =========================================================

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
            disabled={isSubmitting}
            aria-label={
              step === 1 ? "Cancel" : "Go back"
            }
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {mode === "create"
                ? "Start Field Collection"
                : "Update Field Collection"}
            </h1>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            {STEPS.map((item) => {
              const active = step === item.number

              const completed =
                step > item.number

              const reachable =
                canJumpToStep(item.number)

              return (
                <button
                  key={item.number}
                  type="button"
                  onClick={() =>
                    handleStepClick(item.number)
                  }
                  disabled={!reachable}
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
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <div className="space-y-1">
            {errors.map((error, index) => (
              <p
                key={`${error}-${index}`}
                className="text-sm text-destructive"
              >
                {error}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================
          STEP 1 — COLLECTION INFO
          ===================================================== */}

      {step === 1 && (
        <Card className="shadow-none">
          <CardContent className="space-y-6 p-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Taxpayer
              </Label>

              <TaxpayerSelector
                value={taxpayerId}
                onChange={handleTaxpayerChange}
                taxpayers={taxpayers}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Revenue Services
              </Label>

              <RevenueServiceSelector
                mode="multi"
                services={revenueServices}
                selectedServiceIds={
                  selectedServiceIds
                }
                onChange={
                  handleServiceSelection
                }
                onRemoveService={
                  handleRemoveService
                }
                onClearServices={
                  handleClearServices
                }
              />


            </div>
          </CardContent>
        </Card>
      )}

      {/* =====================================================
          STEP 2 — SERVICE DETAILS
          ===================================================== */}

      {step === 2 && (
        <div className="space-y-5">
          {selectedServices.length === 0 ? (
            <Card className="shadow-none">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  No revenue services selected.
                </p>
              </CardContent>
            </Card>
          ) : (
            selectedServices.map(
              (service, serviceIndex) => {
                const values =
                  serviceFieldValues[
                    service.id
                  ] ?? {}

                const serviceErrors =
                  validationErrors[
                    service.id
                  ] ?? {}

                return (
                  <Card
                    key={service.id}
                    className="shadow-none"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        {service.name}
                      </CardTitle>

                      <CardDescription>
                        {service.code
                          ? `Revenue code: ${service.code}`
                          : "Complete the required fields for this revenue service."}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-5">
                      <RevenueServiceFields
                        key={`${service.id}-${serviceIndex}`}
                        service={service}
                        index={serviceIndex}
                        values={values}
                        errors={serviceErrors}
                        onChange={(
                          field,
                          value,
                        ) =>
                          handleServiceFieldChange(
                            service.id,
                            field,
                            value,
                          )
                        }
                        onFileChange={(
                          event,
                          field,
                        ) =>
                          handleFileChange(
                            event,
                            service.id,
                            field,
                          )
                        }
                        onRemoveFile={(
                          field,
                        ) =>
                          removeFile(
                            service.id,
                            field,
                          )
                        }
                        onRemove={
                          handleRemoveService
                        }
                      />
                    </CardContent>
                  </Card>
                )
              },
            )
          )}

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
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder="Add any relevant collection notes..."
                  rows={3}
                  disabled={isSubmitting}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* =====================================================
          STEP 3 — REVIEW & CONFIRM
          ===================================================== */}

      {step === 3 && (
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Review before you{" "}
              {mode === "create"
                ? "create this collection"
                : "save these changes"}
            </CardTitle>

            <CardDescription>
              {mode === "create"
                ? "One field collection can contain multiple revenue services. The server will generate one invoice with one invoice item for each selected service."
                : "Double-check the details below before saving."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 p-5 pt-0">
            {/* =================================================
                KEY FACTS
                ================================================= */}

            <dl className="grid grid-cols-3 gap-x-4 gap-y-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">
                  Taxpayer
                </dt>

                <dd className="mt-0.5 font-medium">
                  {selectedTaxpayer
                    ? selectedTaxpayer.full_name
                    : taxpayerId || "—"}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Services
                </dt>

                <dd className="mt-0.5 font-medium">
                  {selectedServices.length}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Operation
                </dt>

                <dd className="mt-0.5 font-medium">
                  {mode === "create"
                    ? "New Collection"
                    : "Update"}
                </dd>
              </div>
            </dl>

            {/* =================================================
                SERVICES
                ================================================= */}

            {selectedServices.length > 0 && (
              <>
                <Separator />

                <div className="space-y-5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Selected Revenue Services
                  </p>

                  {selectedServices.map(
                    (service, serviceIndex) => {
                      const values =
                        serviceFieldValues[
                          service.id
                        ] ?? {}

                      const fields =
                        service.fields ?? []

                      return (
                        <div
                          key={service.id}
                          className="rounded-lg border p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold">
                                {serviceIndex + 1}.{" "}
                                {service.name}
                              </p>

                              {service.code && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  Revenue code:{" "}
                                  <span className="font-mono">
                                    {service.code}
                                  </span>
                                </p>
                              )}
                            </div>

                            <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                              Service
                            </span>
                          </div>

                          {fields.length > 0 && (
                            <div className="mt-4 space-y-2 border-t pt-3 text-sm">
                              {fields.map(
                                (field) => {
                                  const fieldKey =
                                    field.key ??
                                    field.id

                                  return (
                                    <div
                                      key={fieldKey}
                                      className="flex items-start justify-between gap-4"
                                    >
                                      <span className="text-muted-foreground">
                                        {field.label ??
                                          fieldKey}
                                      </span>

                                      <span className="max-w-[60%] break-words text-right font-medium">
                                        {formatFieldValue(
                                          values[
                                            fieldKey
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
                      )
                    },
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

            <Separator />

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
                checked={isConfirmed}
                onChange={(event) =>
                  handleConfirmationChange(
                    event.target.checked,
                  )
                }
                disabled={isSubmitting}
                className="mt-0.5 size-4 shrink-0 rounded border-input accent-foreground"
              />

              <span className="text-sm">
                This information is correct — go
                ahead and{" "}
                {mode === "create"
                  ? "create the collection and generate its invoice"
                  : "save these changes"}
                .
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
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 size-4" />

          {step === 1 ? "Cancel" : "Back"}
        </Button>

        {step < 3 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {step === 1 ? "Continue" : "Review"}

            <ArrowRight className="ml-2 size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting || !isConfirmed
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />

                {mode === "edit"
                  ? "Saving..."
                  : "Creating..."}
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />

                {mode === "edit"
                  ? "Save Changes"
                  : "Create Collection"}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}