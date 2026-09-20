"use client"

import {
  useMemo,
} from "react"

import {
  FileText,
  User,
} from "lucide-react"

import {
  RevenueServiceFields,
} from "../revenue/assessment/revenue-service-fields"

import {
  RevenueServiceSelector,
} from "../revenue/assessment/revenue-service-selector"

import {
  TaxpayerSelector,
} from "../revenue/assessment/taxpayer-selector"

import { Textarea } from "@/components/ui/textarea"

import type {
  ExistingAgreementForm,
} from "@/types/existing-agreement"

import type {
  RevenueService,
} from "@/types/revenue/assessment"

import type {
  Citizen,
} from "@/types/citizen"

interface AgreementInformationStepProps {
  agreement: ExistingAgreementForm

  updateAgreement: (
    field: keyof ExistingAgreementForm,
    value: string,
  ) => void

  selectedTaxpayer: Citizen | null

  taxpayers: Citizen[]

  onSelectTaxpayer: (
    taxpayerId: string,
  ) => void

  revenueServices: RevenueService[]

  onRevenueServiceChange: (
    value: string,
  ) => void

  serviceFieldValues: Record<
    string,
    Record<string, unknown>
  >

  validationErrors: Record<
    string,
    Record<string, string>
  >

  setServiceFieldValue: (
    serviceId: string,
    field: string,
    value: unknown,
  ) => void

  handleFileChange: (
    serviceId: string,
    field: string,
    file: File | null,
  ) => void

  removeFile: (
    serviceId: string,
    field: string,
  ) => void

  removeService: (
    serviceId: string,
  ) => void

  errors?: Partial<
    Record<
      keyof ExistingAgreementForm,
      string
    >
  >
}

export function AgreementInformationStep({
  agreement,

  updateAgreement,

  selectedTaxpayer,

  taxpayers,
  onSelectTaxpayer,

  revenueServices,
  onRevenueServiceChange,

  serviceFieldValues,
  validationErrors,

  setServiceFieldValue,
  handleFileChange,
  removeFile,
  removeService,

  errors = {},
}: AgreementInformationStepProps) {
  // ============================================================
  // SELECTED SERVICE
  // ============================================================

  const selectedServiceIds = useMemo(
    () =>
      agreement.revenueServiceId
        ? [
            agreement.revenueServiceId,
          ]
        : [],
    [
      agreement.revenueServiceId,
    ],
  )

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

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-8">

      {/* ========================================================
          TAXPAYER
      ======================================================== */}

      <section className="space-y-5">

        <div className="flex items-start gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="min-w-0">

            <h2 className="text-sm font-semibold">
              Taxpayer
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
              Link this existing agreement to a
              taxpayer already registered in the
              municipal taxpayer registry.
            </p>

          </div>

        </div>

        <TaxpayerSelector
          value={
            selectedTaxpayer?.id ?? ""
          }
          onChange={
            onSelectTaxpayer
          }
          taxpayers={
            taxpayers
          }
        />

        {errors.taxpayerId && (
          <p className="text-xs text-destructive">
            {
              errors.taxpayerId
            }
          </p>
        )}

      </section>

      {/* ========================================================
          REVENUE SERVICE
      ======================================================== */}

      <section className="space-y-5">

        <div className="flex items-start gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="min-w-0">

            <h2 className="text-sm font-semibold">
              Revenue Service
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
              Select the municipal revenue service
              associated with this existing agreement.
            </p>

          </div>

        </div>

        <div className="space-y-4">

          <RevenueServiceSelector
            mode="single"
            services={
              revenueServices
            }
            selectedServiceIds={
              selectedServiceIds
            }
            onChange={(ids) =>
              onRevenueServiceChange(
                ids[0] ?? "",
              )
            }
          />

          {errors.revenueServiceId && (
            <p className="text-xs text-destructive">
              {
                errors.revenueServiceId
              }
            </p>
          )}

        </div>

      </section>

      {/* ========================================================
          SERVICE DETAILS
      ======================================================== */}

      <section className="space-y-5">

        <div className="flex items-start gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="min-w-0">

            <h2 className="text-sm font-semibold">
              Service Details
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
              Enter the information required for the
              selected revenue service.
            </p>

          </div>

        </div>

        {selectedServices.length === 0 ? (

          <div className="rounded-lg border border-dashed p-6 text-center">

            <p className="text-sm text-muted-foreground">
              No revenue service selected yet.
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Select a revenue service above to enter
              its required details.
            </p>

          </div>

        ) : (

          <div className="space-y-6">

            {selectedServices.map(
              (
                service,
                index,
              ) => (

                <RevenueServiceFields
                  key={
                    service.id
                  }

                  service={
                    service
                  }

                  index={
                    index
                  }

                  values={
                    serviceFieldValues[
                      service.id
                    ] ?? {}
                  }

                  errors={
                    validationErrors[
                      service.id
                    ] ?? {}
                  }

                  onChange={(
                    field,
                    value,
                  ) =>
                    setServiceFieldValue(
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
                      service.id,
                      field.key,
                      event.target.files?.[0] ??
                        null,
                    )
                  }

                  onRemoveFile={(
                    field,
                  ) =>
                    removeFile(
                      service.id,
                      field.key,
                    )
                  }

                  onRemove={
                    removeService
                  }
                />

              ),
            )}

          </div>

        )}

      </section>

      {/* ========================================================
          AGREEMENT NOTES
      ======================================================== */}

      <section className="space-y-5">

        <div className="flex items-start gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="min-w-0">

            <h2 className="text-sm font-semibold">
              Notes
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
              Add any relevant remarks about the existing
              agreement, historical records, or registration.
            </p>

          </div>

        </div>

        <div className="space-y-2">

          <Textarea
            id="agreement-notes"
            name="notes"
            value={
              agreement.notes
            }
            onChange={(event) =>
              updateAgreement(
                "notes",
                event.target.value,
              )
            }
            placeholder="Add any relevant remarks or historical information..."
            rows={5}
            aria-invalid={
              Boolean(
                errors.notes,
              )
            }
          />

          {errors.notes && (
            <p className="text-xs text-destructive">
              {
                errors.notes
              }
            </p>
          )}

          <p className="text-xs leading-5 text-muted-foreground">
            Optional. Use this field for information that does
            not belong to a specific service field or financial
            value.
          </p>

        </div>

      </section>

    </div>
  )
}
