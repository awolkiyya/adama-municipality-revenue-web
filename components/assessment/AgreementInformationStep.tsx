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

import {
  Textarea,
} from "@/components/ui/textarea"

import type {
  ExistingAgreementForm,
} from "@/types/existing-agreement"

import type {
  RevenueService,
} from "@/types/revenue/assessment"

import type {
  Citizen,
} from "@/types/citizen"


/*
 * ============================================================
 * SERVICE FIELD VALUE
 * ============================================================
 *
 * Dynamic revenue-service fields can contain different
 * primitive values.
 *
 * Examples:
 *
 * Text:
 *   "AGR-001"
 *
 * Number:
 *   50000
 *
 * Checkbox:
 *   true
 *
 * Checkbox:
 *   false
 *
 * IMPORTANT:
 *
 * We intentionally do NOT convert these values to strings.
 *
 * In particular:
 *
 *   false !== ""
 *
 * A checkbox with "No" selected is a valid boolean value:
 *
 *   false
 *
 * The validation hook must therefore treat false as a
 * legitimate value.
 */

export type ServiceFieldValue =
  | string
  | number
  | boolean


/*
 * ============================================================
 * VALIDATION ERROR TYPES
 * ============================================================
 */

export type AgreementValidationErrors = Partial<
  Record<
    keyof ExistingAgreementForm,
    string
  >
>

export type ServiceValidationErrors = Record<
  string,
  Record<string, string>
>


/*
 * ============================================================
 * PROPS
 * ============================================================
 */

interface AgreementInformationStepProps {

  /*
   * ----------------------------------------------------------
   * AGREEMENT
   * ----------------------------------------------------------
   */

  agreement: ExistingAgreementForm

  updateAgreement: (
    field: keyof ExistingAgreementForm,
    value: string,
  ) => void


  /*
   * ----------------------------------------------------------
   * TAXPAYER
   * ----------------------------------------------------------
   */

  selectedTaxpayer: Citizen | null

  taxpayers: Citizen[]

  onSelectTaxpayer: (
    taxpayerId: string,
  ) => void


  /*
   * ----------------------------------------------------------
   * REVENUE SERVICE
   * ----------------------------------------------------------
   */

  revenueServices: RevenueService[]

  onRevenueServiceChange: (
    value: string,
  ) => void


  /*
   * ----------------------------------------------------------
   * SERVICE FIELD VALUES
   * ----------------------------------------------------------
   *
   * Example:
   *
   * {
   *   "service-uuid": {
   *     land_area: "500",
   *     sadarka_lafaa: "A",
   *     agreement_date: "2026-09-23",
   *     first_installment_required: false
   *   }
   * }
   *
   * Values retain their original primitive type.
   */

  serviceFieldValues: Record<
    string,
    Record<string, ServiceFieldValue>
  >


  /*
   * ----------------------------------------------------------
   * VALIDATION ERRORS
   * ----------------------------------------------------------
   *
   * Validation is handled by the parent hook.
   *
   * This component does NOT validate anything.
   *
   * It only displays errors supplied by the hook.
   */

  validationErrors: {
    agreement?: AgreementValidationErrors

    financial?: Record<
      string,
      string
    >

    service?: ServiceValidationErrors
  }


  /*
   * ----------------------------------------------------------
   * SERVICE FIELD UPDATE
   * ----------------------------------------------------------
   *
   * IMPORTANT:
   *
   * Do NOT use:
   *
   *   String(value)
   *
   * because:
   *
   *   true  -> "true"
   *   false -> "false"
   *
   * Instead preserve the original value.
   */

  setServiceFieldValue: (
    serviceId: string,
    field: string,
    value: ServiceFieldValue,
  ) => void


  /*
   * ----------------------------------------------------------
   * FILE
   * ----------------------------------------------------------
   */

  handleFileChange: (
    serviceId: string,
    field: string,
    file: File | null,
  ) => void

  removeFile: (
    serviceId: string,
    field: string,
  ) => void


  /*
   * ----------------------------------------------------------
   * REMOVE SERVICE
   * ----------------------------------------------------------
   */

  removeService: (
    serviceId: string,
  ) => void
}


/*
 * ============================================================
 * COMPONENT
 * ============================================================
 */

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

}: AgreementInformationStepProps) {


  /*
   * ==========================================================
   * AGREEMENT ERRORS
   * ==========================================================
   */

  const agreementErrors =
    validationErrors.agreement ?? {}


  /*
   * ==========================================================
   * SERVICE ERRORS
   * ==========================================================
   *
   * Only display validation errors belonging to the currently
   * selected revenue service.
   *
   * Example:
   *
   * validationErrors.service = {
   *
   *   "service-uuid": {
   *     land_area: "Land Area is required.",
   *     sadarka_lafaa: "Sadarka Lafaa is required."
   *   }
   *
   * }
   */

  const serviceErrors =
    agreement.revenueServiceId
      ? validationErrors.service?.[
          agreement.revenueServiceId
        ] ?? {}
      : {}


  /*
   * ==========================================================
   * SELECTED SERVICE IDS
   * ==========================================================
   *
   * Existing LIZZ supports exactly ONE revenue service.
   *
   * RevenueServiceSelector supports an array of IDs, so we
   * adapt our single-service value into that structure.
   */

  const selectedServiceIds =
    useMemo(
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


  /*
   * ==========================================================
   * SELECTED SERVICES
   * ==========================================================
   *
   * Resolve the selected service object from the available
   * revenue services.
   */

  const selectedServices =
    useMemo(
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


  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="space-y-8">


      {/* ======================================================
          TAXPAYER
      ====================================================== */}

      <section className="space-y-5">

        <div className="flex items-start gap-3">

          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              border
              bg-muted/40
            "
          >

            <User
              className="
                h-4
                w-4
                text-muted-foreground
              "
            />

          </div>


          <div className="min-w-0">

            <h2 className="text-sm font-semibold">
              Taxpayer
            </h2>

            <p
              className="
                mt-1
                max-w-2xl
                text-xs
                leading-5
                text-muted-foreground
              "
            >
              Link this existing agreement to a
              taxpayer already registered in the
              municipal taxpayer registry.
            </p>

          </div>

        </div>


        <div className="space-y-2">

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


          {agreementErrors.taxpayerId && (

            <p
              className="
                text-xs
                text-destructive
              "
            >
              {
                agreementErrors.taxpayerId
              }
            </p>

          )}

        </div>

      </section>


      {/* ======================================================
          REVENUE SERVICE
      ====================================================== */}

      <section className="space-y-5">

        <div className="flex items-start gap-3">

          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              border
              bg-muted/40
            "
          >

            <FileText
              className="
                h-4
                w-4
                text-muted-foreground
              "
            />

          </div>


          <div className="min-w-0">

            <h2 className="text-sm font-semibold">
              Revenue Service
            </h2>

            <p
              className="
                mt-1
                max-w-2xl
                text-xs
                leading-5
                text-muted-foreground
              "
            >
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


          {agreementErrors.revenueServiceId && (

            <p
              className="
                text-xs
                text-destructive
              "
            >
              {
                agreementErrors.revenueServiceId
              }
            </p>

          )}

        </div>

      </section>


      {/* ======================================================
          SERVICE DETAILS
      ====================================================== */}

      <section className="space-y-5">

        <div className="flex items-start gap-3">

          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              border
              bg-muted/40
            "
          >

            <FileText
              className="
                h-4
                w-4
                text-muted-foreground
              "
            />

          </div>


          <div className="min-w-0">

            <h2 className="text-sm font-semibold">
              Service Details
            </h2>

            <p
              className="
                mt-1
                max-w-2xl
                text-xs
                leading-5
                text-muted-foreground
              "
            >
              Enter the information required for the
              selected revenue service.
            </p>

          </div>

        </div>


        {/* ====================================================
            NO SERVICE SELECTED
        ==================================================== */}

        {selectedServices.length === 0 ? (

          <div
            className="
              rounded-lg
              border
              border-dashed
              p-6
              text-center
            "
          >

            <p
              className="
                text-sm
                text-muted-foreground
              "
            >
              No revenue service selected yet.
            </p>

            <p
              className="
                mt-1
                text-xs
                text-muted-foreground
              "
            >
              Select a revenue service above to enter
              its required details.
            </p>

          </div>

        ) : (

          /* ==================================================
             SELECTED SERVICE
          ================================================== */

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

                  /*
                   * --------------------------------------------
                   * FIELD VALUES
                   * --------------------------------------------
                   *
                   * Values are passed exactly as stored.
                   *
                   * For example:
                   *
                   * land_area: "500"
                   * sadarka_lafaa: "A"
                   * agreement_date: "2026-09-23"
                   * first_installment_required: false
                   */

                  values={
                    serviceFieldValues[
                      service.id
                    ] ?? {}
                  }


                  /*
                   * --------------------------------------------
                   * SERVICE VALIDATION ERRORS
                   * --------------------------------------------
                   *
                   * Errors are produced by useExistingAgreement.
                   *
                   * This component only displays them through
                   * RevenueServiceFields.
                   */

                  errors={
                    serviceErrors
                  }


                  /*
                   * --------------------------------------------
                   * FIELD CHANGE
                   * --------------------------------------------
                   *
                   * Preserve the actual primitive type.
                   *
                   * DO NOT:
                   *
                   *   String(value)
                   *
                   * because that would convert:
                   *
                   *   false -> "false"
                   *
                   * which breaks required checkbox validation.
                   */

                  onChange={(
                    field,
                    value,
                  ) =>
                    setServiceFieldValue(
                      service.id,
                      field,
                      value as ServiceFieldValue,
                    )
                  }


                  /*
                   * --------------------------------------------
                   * FILE CHANGE
                   * --------------------------------------------
                   */

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


                  /*
                   * --------------------------------------------
                   * REMOVE FILE
                   * --------------------------------------------
                   */

                  onRemoveFile={(
                    field,
                  ) =>
                    removeFile(
                      service.id,
                      field.key,
                    )
                  }


                  /*
                   * --------------------------------------------
                   * REMOVE SERVICE
                   * --------------------------------------------
                   */

                  onRemove={
                    removeService
                  }

                />

              ),
            )}

          </div>

        )}

      </section>


      {/* ======================================================
          AGREEMENT NOTES
      ====================================================== */}

      <section className="space-y-5">

        <div className="flex items-start gap-3">

          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              border
              bg-muted/40
            "
          >

            <FileText
              className="
                h-4
                w-4
                text-muted-foreground
              "
            />

          </div>


          <div className="min-w-0">

            <h2 className="text-sm font-semibold">
              Notes
            </h2>

            <p
              className="
                mt-1
                max-w-2xl
                text-xs
                leading-5
                text-muted-foreground
              "
            >
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
                agreementErrors.notes,
              )
            }

          />


          {agreementErrors.notes && (

            <p
              className="
                text-xs
                text-destructive
              "
            >
              {
                agreementErrors.notes
              }
            </p>

          )}


          <p
            className="
              text-xs
              leading-5
              text-muted-foreground
            "
          >
            Optional. Use this field for information that does
            not belong to a specific service field or financial
            value.
          </p>

        </div>

      </section>

    </div>
  )
}