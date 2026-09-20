"use client"

import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Save,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import { TaxpayerSelector } from "@/components/revenue/assessment/taxpayer-selector"
import { RevenueServiceSelector } from "@/components/revenue/assessment/revenue-service-selector"
import { RevenueServiceFields } from "@/components/revenue/assessment/revenue-service-fields"

import { Citizen } from "@/types/citizen"
import { RevenueService } from "@/types/revenue/assessment"

type CollectionFormMode = "create" | "edit"

type Step = 1 | 2 | 3

export interface CollectionFormData {
  id?: string
  taxpayerId: string
  revenueServiceId: string
  serviceFieldValues: Record<string, string>
  collectionDate?: string
  notes?: string
}

export interface CollectionResult {
  id: string
  invoiceId?: string
  status?: string
}

interface Taxpayer {
  id: string
  name: string
  tin: string
  type: string
}

interface AssessmentPreview {
  subtotal: number
  penalty: number
  discount: number
  total: number
  currency: string
}

interface CollectionFormProps {
  mode: CollectionFormMode

  initialData?: CollectionFormData | null

  taxpayers: Citizen[]

  revenueServices: RevenueService[]

  onSuccess: (
    collection: CollectionResult
  ) => void

  onCancel?: () => void

  /*
   * Optional endpoint overrides.
   *
   * Defaults:
   *   POST /api/v1/field-collections/resolve
   *   POST /api/v1/field-collections
   *   PUT  /api/v1/field-collections/{id}
   */
  resolveEndpoint?: string

  createEndpoint?: string

  updateEndpoint?: string
}

const STEPS = [
  {
    number: 1 as Step,
    title: "Collection Information",
    description: "Taxpayer and revenue service",
  },
  {
    number: 2 as Step,
    title: "Service Details",
    description: "Required collection information",
  },
  {
    number: 3 as Step,
    title: "Review & Confirm",
    description: "Verify and save",
  },
]

function formatMoney(
  amount: number,
  currency = "ETB"
) {
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`
}

export function CollectionForm({
  mode,
  initialData = null,
  taxpayers,
  revenueServices,
  onSuccess,
  onCancel,
  resolveEndpoint = "/api/v1/field-collections/resolve",
  createEndpoint = "/api/v1/field-collections",
  updateEndpoint,
}: CollectionFormProps) {
  const [step, setStep] = useState<Step>(1)

  const [isResolving, setIsResolving] =
    useState(false)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [taxpayerId, setTaxpayerId] =
    useState(
      initialData?.taxpayerId ?? ""
    )

  const [selectedServiceIds, setSelectedServiceIds] =
    useState<string[]>(
      initialData?.revenueServiceId
        ? [initialData.revenueServiceId]
        : []
    )

  const [serviceFieldValues, setServiceFieldValues] =
    useState<
      Record<
        string,
        Record<string, string>
      >
    >(
      initialData?.revenueServiceId
        ? {
            [initialData.revenueServiceId]:
              initialData.serviceFieldValues ??
              {},
          }
        : {}
    )

  const [validationErrors, setValidationErrors] =
    useState<
      Record<
        string,
        Record<string, string>
      >
    >({})

  const [collectionDate, setCollectionDate] =
    useState(
      initialData?.collectionDate ??
        new Date()
          .toISOString()
          .slice(0, 10)
    )

  const [notes, setNotes] =
    useState(
      initialData?.notes ?? ""
    )

  const [assessmentPreview, setAssessmentPreview] =
    useState<AssessmentPreview | null>(
      null
    )

  const [errors, setErrors] =
    useState<string[]>([])

  /*
   * ----------------------------------------------------
   * Derived state
   * ----------------------------------------------------
   */

  // const selectedTaxpayer = useMemo(
  //   () =>
  //     taxpayers.find(
  //       (taxpayer) =>
  //         taxpayer.id === taxpayerId
  //     ) ?? null,
  //   [taxpayerId, taxpayers]
  // )

  /*
   * Field collection is intentionally single-service.
   *
   * The shared RevenueServiceSelector supports multiple
   * services, but this workflow accepts only one service.
   */
  const selectedService = useMemo(
    () =>
      revenueServices.find(
        (service) =>
          service.id ===
          selectedServiceIds[0]
      ) ?? null,
    [
      revenueServices,
      selectedServiceIds,
    ]
  )

  const revenueCode =
    selectedService?.code ??
    ""

  const selectedServiceValues =
    selectedService
      ? serviceFieldValues[
          selectedService.id
        ] ?? {}
      : {}

  /*
   * ----------------------------------------------------
   * Synchronize initial data when edit data changes
   * ----------------------------------------------------
   */

  useEffect(() => {
    if (!initialData) {
      return
    }

    setTaxpayerId(
      initialData.taxpayerId ?? ""
    )

    setSelectedServiceIds(
      initialData.revenueServiceId
        ? [initialData.revenueServiceId]
        : []
    )

    if (initialData.revenueServiceId) {
      setServiceFieldValues({
        [initialData.revenueServiceId]:
          initialData.serviceFieldValues ??
          {},
      })
    } else {
      setServiceFieldValues({})
    }

    setCollectionDate(
      initialData.collectionDate ??
        new Date()
          .toISOString()
          .slice(0, 10)
    )

    setNotes(
      initialData.notes ?? ""
    )
  }, [initialData])

  /*
   * ----------------------------------------------------
   * Taxpayer
   * ----------------------------------------------------
   */

  const handleTaxpayerChange =
    useCallback(
      (value: string) => {
        setTaxpayerId(value)

        setErrors([])

        /*
         * Assessment depends on taxpayer.
         * Therefore an old preview is no longer valid.
         */
        setAssessmentPreview(null)
      },
      []
    )

  /*
   * ----------------------------------------------------
   * Revenue service
   * ----------------------------------------------------
   */

  const handleServiceSelection =
    useCallback(
      (serviceIds: string[]) => {
        const serviceId =
          serviceIds[0] ?? ""

        setSelectedServiceIds(
          serviceId
            ? [serviceId]
            : []
        )

        setValidationErrors({})

        setAssessmentPreview(null)

        setErrors([])

        /*
         * Preserve values for the selected service
         * but remove values belonging to unrelated
         * services.
         */
        setServiceFieldValues(
          (current) => {
            if (!serviceId) {
              return {}
            }

            return {
              [serviceId]:
                current[serviceId] ?? {},
            }
          }
        )
      },
      []
    )

  const handleRemoveService =
    useCallback(
      (serviceId: string) => {
        setSelectedServiceIds(
          (current) =>
            current.filter(
              (id) =>
                id !== serviceId
            )
        )

        setServiceFieldValues(
          (current) => {
            const next = {
              ...current,
            }

            delete next[serviceId]

            return next
          }
        )

        setValidationErrors(
          (current) => {
            const next = {
              ...current,
            }

            delete next[serviceId]

            return next
          }
        )

        setAssessmentPreview(null)
      },
      []
    )

  const handleClearServices =
    useCallback(() => {
      setSelectedServiceIds([])

      setServiceFieldValues({})

      setValidationErrors({})

      setAssessmentPreview(null)

      setErrors([])
    }, [])

  /*
   * ----------------------------------------------------
   * Dynamic service fields
   * ----------------------------------------------------
   */

  const setServiceFieldValue =
    useCallback(
      (
        serviceId: string,
        field: string,
        value: string
      ) => {
        setServiceFieldValues(
          (current) => ({
            ...current,

            [serviceId]: {
              ...(current[serviceId] ??
                {}),
              [field]: value,
            },
          })
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

            const nextServiceErrors =
              {
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
          }
        )

        /*
         * Any field modification invalidates
         * the previous server assessment.
         */
        setAssessmentPreview(null)

        setErrors([])
      },
      []
    )

  const handleFileChange =
    useCallback(
      (
        serviceId: string,
        field: string,
        file: File | null
      ) => {
        /*
         * Keep this callback compatible with
         * RevenueServiceFields.
         *
         * File upload handling should eventually
         * be connected to your document upload API.
         */
        console.debug(
          "Collection service file changed",
          {
            serviceId,
            field,
            file,
          }
        )
      },
      []
    )

  const removeFile =
    useCallback(
      (
        serviceId: string,
        field: string
      ) => {
        console.debug(
          "Collection service file removed",
          {
            serviceId,
            field,
          }
        )
      },
      []
    )

  /*
   * ----------------------------------------------------
   * Validation
   * ----------------------------------------------------
   */

  const validateStepOne =
    useCallback(() => {
      const nextErrors: string[] = []

      if (!taxpayerId) {
        nextErrors.push(
          "Select a taxpayer before continuing."
        )
      }

      if (!selectedService) {
        nextErrors.push(
          "Select a revenue service before continuing."
        )
      }

      if (!collectionDate) {
        nextErrors.push(
          "Select the collection date."
        )
      }

      setErrors(nextErrors)

      return (
        nextErrors.length === 0
      )
    }, [
      taxpayerId,
      selectedService,
      collectionDate,
    ])

  const validateStepTwo =
    useCallback(() => {
      if (!selectedService) {
        setErrors([
          "Select a revenue service before continuing.",
        ])

        return false
      }

      const values =
        serviceFieldValues[
          selectedService.id
        ] ?? {}

      const requiredFields =
        selectedService.fields.filter(
          (field) =>
            field
        )

      const fieldErrors: Record<
        string,
        string
      > = {}

      for (const field of requiredFields) {
        /*
         * Use the canonical base-field code when
         * available. Fall back to baseFieldId.
         *
         * This should match the key produced by
         * RevenueServiceFields.
         */
        const fieldKey =
          field.key ??
          field.id

        const value =
          values[fieldKey]

        if (
          !value ||
          !value.trim()
        ) {
          fieldErrors[fieldKey] =
            `${field.label ?? "This field"} is required.`
        }
      }

      if (
        Object.keys(fieldErrors)
          .length > 0
      ) {
        setValidationErrors({
          [selectedService.id]:
            fieldErrors,
        })

        setErrors([
          "Complete all required service fields before continuing.",
        ])

        return false
      }

      setValidationErrors({})

      setErrors([])

      return true
    }, [
      selectedService,
      serviceFieldValues,
    ])

  /*
   * ----------------------------------------------------
   * Resolve assessment
   * ----------------------------------------------------
   *
   * The backend is authoritative.
   *
   * The frontend sends:
   *   taxpayer
   *   service
   *   dynamic fields
   *
   * The backend returns:
   *   subtotal
   *   penalty
   *   discount
   *   total
   *
   * The frontend does NOT calculate these values.
   */

  const resolveAssessment =
    useCallback(async () => {
      if (
        !selectedService ||
        !taxpayerId
      ) {
        return false
      }

      setIsResolving(true)

      setErrors([])

      try {
        const response =
          await fetch(
            resolveEndpoint,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
              },

              credentials:
                "include",

              body: JSON.stringify({
                taxpayer_id:
                  taxpayerId,

                revenue_service_id:
                  selectedService.id,

                service_fields:
                  selectedServiceValues,

                collection_date:
                  collectionDate,
              }),
            }
          )

        const payload =
          await response
            .json()
            .catch(() => null)

        if (!response.ok) {
          throw new Error(
            payload?.message ??
              "Unable to resolve the assessment."
          )
        }

        const data =
          payload?.data ??
          payload

        setAssessmentPreview({
          subtotal:
            Number(
              data?.subtotal ?? 0
            ),

          penalty:
            Number(
              data?.penalty ?? 0
            ),

          discount:
            Number(
              data?.discount ?? 0
            ),

          total:
            Number(
              data?.total ?? 0
            ),

          currency:
            data?.currency ??
            "ETB",
        })

        return true
      } catch (error) {
        setAssessmentPreview(
          null
        )

        setErrors([
          error instanceof Error
            ? error.message
            : "Unable to resolve the assessment.",
        ])

        return false
      } finally {
        setIsResolving(false)
      }
    }, [
      selectedService,
      taxpayerId,
      selectedServiceValues,
      collectionDate,
      resolveEndpoint,
    ])

  /*
   * ----------------------------------------------------
   * Step navigation
   * ----------------------------------------------------
   */

  const handleNext =
    async () => {
      if (step === 1) {
        if (!validateStepOne()) {
          return
        }

        setStep(2)

        return
      }

      if (step === 2) {
        if (!validateStepTwo()) {
          return
        }

        const resolved =
          await resolveAssessment()

        if (!resolved) {
          return
        }

        setStep(3)

        return
      }
    }

  const handleBack =
    () => {
      if (step === 1) {
        onCancel?.()

        return
      }

      setStep(
        (current) =>
          (current - 1) as Step
      )

      setErrors([])
    }

  /*
   * ----------------------------------------------------
   * Create / Update
   * ----------------------------------------------------
   */

  const handleSubmit =
    async () => {
      if (
        !taxpayerId ||
        !selectedService
      ) {
        setErrors([
          "Taxpayer and revenue service are required.",
        ])

        return
      }

      /*
       * Always revalidate the final step.
       */
      if (!validateStepTwo()) {
        setStep(2)

        return
      }

      setIsSubmitting(true)

      setErrors([])

      try {
        const endpoint =
          mode === "edit"
            ? updateEndpoint ??
              `/api/v1/field-collections/${initialData?.id}`
            : createEndpoint

        const method =
          mode === "edit"
            ? "PUT"
            : "POST"

        const response =
          await fetch(
            endpoint,
            {
              method,

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",
              },

              credentials:
                "include",

              body: JSON.stringify({
                taxpayer_id:
                  taxpayerId,

                revenue_service_id:
                  selectedService.id,

                service_fields:
                  selectedServiceValues,

                collection_date:
                  collectionDate,

                notes:
                  notes.trim() ||
                  null,
              }),
            }
          )

        const payload =
          await response
            .json()
            .catch(() => null)

        if (!response.ok) {
          throw new Error(
            payload?.message ??
              `Unable to ${
                mode === "edit"
                  ? "update"
                  : "create"
              } the collection.`
          )
        }

        const data =
          payload?.data ??
          payload

        onSuccess({
          id: data.id,
          invoiceId:
            data.invoice_id ??
            data.invoiceId,
          status:
            data.status,
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

  /*
   * ----------------------------------------------------
   * Render
   * ----------------------------------------------------
   */

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <Wallet className="size-5 text-muted-foreground" />

              <h1 className="text-xl font-semibold tracking-tight">
                {mode === "create"
                  ? "Start Field Collection"
                  : "Update Field Collection"}
              </h1>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "create"
                ? "Create a new field collection and generate its invoice."
                : "Update the permitted information for this field collection."}
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 md:flex">
          <ShieldCheck className="size-4 text-muted-foreground" />

          <span className="text-xs text-muted-foreground">
            Server-controlled financials
          </span>
        </div>
      </div>

      {/* Stepper */}
      <Card className="shadow-none">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map(
              (item, index) => {
                const active =
                  step === item.number

                const completed =
                  step > item.number

                return (
                  <div
                    key={item.number}
                    className="relative"
                  >
                    {index <
                      STEPS.length - 1 && (
                      <div
                        className={[
                          "absolute left-8 right-[-1rem] top-4 hidden h-px md:block",
                          completed
                            ? "bg-foreground/30"
                            : "bg-border",
                        ].join(" ")}
                      />
                    )}

                    <div className="relative flex items-start gap-3">
                      <div
                        className={[
                          "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                          active
                            ? "border-foreground bg-foreground text-background"
                            : completed
                              ? "border-foreground/40 bg-muted"
                              : "bg-background text-muted-foreground",
                        ].join(" ")}
                      >
                        {completed ? (
                          <Check className="size-4" />
                        ) : (
                          item.number
                        )}
                      </div>

                      <div>
                        <p
                          className={[
                            "text-sm font-medium",
                            active
                              ? "text-foreground"
                              : "text-muted-foreground",
                          ].join(" ")}
                        >
                          {item.title}
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }
            )}
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="p-4">
            <div className="space-y-1">
              {errors.map(
                (error, index) => (
                  <p
                    key={`${error}-${index}`}
                    className="text-sm text-destructive"
                  >
                    {error}
                  </p>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* --------------------------------------------- */}
      {/* STEP 1                                      */}
      {/* --------------------------------------------- */}

      {step === 1 && (
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                <User className="size-4 text-muted-foreground" />
              </div>

              <div>
                <CardTitle className="text-base">
                  Collection Information
                </CardTitle>

                <CardDescription className="mt-1">
                  Select the taxpayer and
                  revenue service for this
                  collection.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Taxpayer */}
            <section className="space-y-3">
              <div>
                <Label className="text-sm font-medium">
                  Taxpayer
                </Label>

                <p className="mt-1 text-xs text-muted-foreground">
                  Select a taxpayer from the
                  municipal taxpayer registry.
                </p>
              </div>

              <TaxpayerSelector
                value={taxpayerId}
                onChange={
                  handleTaxpayerChange
                }
                taxpayers={taxpayers}
              />

              {false && (
                <></>
                // <div className="rounded-lg border bg-muted/20 p-4">
                //   <div className="grid gap-4 sm:grid-cols-3">
                //     <div>
                //       <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                //         Name
                //       </p>

                //       <p className="mt-1 text-sm font-medium">
                //         {/* {
                //           selectedTaxpayer.full_name
                //         } */}
                //       </p>
                //     </div>

                //     <div>
                //       <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                //         TIN
                //       </p>

                //       <p className="mt-1 font-mono text-sm">
                //         {/* {
                //           selectedTaxpayer.citizen_uid
                //         } */}
                //       </p>
                //     </div>

                //     <div>
                //       {/* <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                //         Type
                //       </p>

                //       <p className="mt-1 text-sm">
                //         {
                //           selectedTaxpayer.
                //         }
                //       </p> */}
                //     </div>
                //   </div>
                // </div>
              )}
            </section>

            <Separator />

            {/* Revenue service */}
            <section className="space-y-3">
              <div>
                <Label className="text-sm font-medium">
                  Revenue Service
                </Label>

                <p className="mt-1 text-xs text-muted-foreground">
                  Select the service that
                  determines the revenue code
                  and required collection fields.
                </p>
              </div>

              <RevenueServiceSelector
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

              {selectedService && (
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium">
                        Selected Service
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {
                          selectedService.name
                        }
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Revenue Code
                      </p>

                      <p className="mt-1 font-mono text-xs font-semibold">
                        {revenueCode ||
                          "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <Separator />
          </CardContent>
        </Card>
      )}

      {/* --------------------------------------------- */}
      {/* STEP 2                                      */}
      {/* --------------------------------------------- */}

      {step === 2 &&
        selectedService && (
          <Card className="shadow-none">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                  <FileText className="size-4 text-muted-foreground" />
                </div>

                <div>
                  <CardTitle className="text-base">
                    Service Details
                  </CardTitle>

                  <CardDescription className="mt-1">
                    Complete the fields required
                    for{" "}
                    <span className="font-medium text-foreground">
                      {
                        selectedService.name
                      }
                    </span>
                    .
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <RevenueServiceFields
                service={selectedService}
                index={0}
                values={
                  serviceFieldValues[
                    selectedService.id
                  ] ?? {}
                }
                errors={
                  validationErrors[
                    selectedService.id
                  ] ?? {}
                }
                onChange={
                  ()=>{}
                }
                onFileChange={
                  ()=>{}

                }
                onRemoveFile={
                  ()=>{}

                }
                onRemove={
                  handleRemoveService
                }
              />

              <Separator className="my-6" />

              <div className="space-y-3">
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
                  onChange={(event) => {
                    setNotes(
                      event.target.value
                    )
                  }}
                  placeholder="Add any relevant collection notes..."
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </CardContent>
          </Card>
        )}

      {/* --------------------------------------------- */}
      {/* STEP 3                                      */}
      {/* --------------------------------------------- */}

      {step === 3 && (
        <div className="space-y-6">
          {/* Review */}
          <Card className="shadow-none">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                  <CheckCircle2 className="size-4 text-muted-foreground" />
                </div>

                <div>
                  <CardTitle className="text-base">
                    Review Collection
                  </CardTitle>

                  <CardDescription className="mt-1">
                    Verify the collection information
                    before saving.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">
                    Taxpayer
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {selectedTaxpayer?.name ??
                      "—"}
                  </p>

                  {selectedTaxpayer?.tin && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {
                        selectedTaxpayer.tin
                      }
                    </p>
                  )}
                </div> */}

                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">
                    Revenue Service
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {selectedService?.name ??
                      "—"}
                  </p>

                  {revenueCode && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {revenueCode}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">
                    Collection Date
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {collectionDate ||
                      "—"}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">
                    Operation
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {mode === "create"
                      ? "New Collection"
                      : "Update Collection"}
                  </p>
                </div>
              </div>

              {notes && (
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">
                    Notes
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assessment */}
          <Card className="shadow-none">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                  <Calculator className="size-4 text-muted-foreground" />
                </div>

                <div>
                  <CardTitle className="text-base">
                    Assessment & Invoice
                  </CardTitle>

                  <CardDescription className="mt-1">
                    Financial values are resolved by
                    the backend.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {assessmentPreview ? (
                <div className="rounded-xl border">
                  <div className="space-y-4 p-5">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Subtotal
                      </span>

                      <span className="font-medium">
                        {formatMoney(
                          assessmentPreview.subtotal,
                          assessmentPreview.currency
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Penalty
                      </span>

                      <span className="font-medium">
                        {formatMoney(
                          assessmentPreview.penalty,
                          assessmentPreview.currency
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Discount
                      </span>

                      <span className="font-medium">
                        {formatMoney(
                          assessmentPreview.discount,
                          assessmentPreview.currency
                        )}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between gap-4 p-5">
                    <div>
                      <p className="text-sm font-semibold">
                        Invoice Total
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Authoritative amount returned
                        by the server
                      </p>
                    </div>

                    <p className="text-xl font-semibold tracking-tight">
                      {formatMoney(
                        assessmentPreview.total,
                        assessmentPreview.currency
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Calculator className="mx-auto size-5 text-muted-foreground" />

                  <p className="mt-3 text-sm font-medium">
                    Assessment has not been
                    resolved
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Go back and complete the service
                    details.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security note */}
          <Card className="border-dashed bg-muted/10 shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

              <div>
                <p className="text-sm font-medium">
                  Financial values are protected
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Tariff, assessment amount,
                  penalties, discounts, invoice balance,
                  and invoice status are calculated and
                  validated by the server. Values displayed
                  here are informational only.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --------------------------------------------- */}
      {/* ACTIONS                                      */}
      {/* --------------------------------------------- */}

      <Card className="shadow-none">
        <CardContent className="flex flex-col-reverse gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 size-4" />

            {step === 1
              ? "Cancel"
              : "Back"}
          </Button>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={
                  isResolving ||
                  isSubmitting
                }
              >
                {isResolving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    Continue
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
                  isResolving ||
                  !assessmentPreview
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />

                    {mode === "edit"
                      ? "Updating..."
                      : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />

                    {mode === "edit"
                      ? "Update Collection"
                      : "Create Collection"}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}