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
   * The existing agreement hook stores values using field.key.
   *
   * Example:
   *
   * {
   *   "service-uuid": {
   *     LAND_AREA: 200,
   *     SADARKA_LAFAA: "1FFAA",
   *     AGREEMENT_DATE: "2009-09-11",
   *     FIRST_INSTALLMENT_REQUIRED: true
   *   }
   * }
   *
   * IMPORTANT:
   *
   * RevenueServiceFields is a shared component and expects
   * values indexed by field.id.
   *
   * Therefore this component adapts the values before passing
   * them to RevenueServiceFields.
   */

  serviceFieldValues: Record<
    string,
    Record<string, ServiceFieldValue>
  >


  /*
   * ----------------------------------------------------------
   * VALIDATION ERRORS
   * ----------------------------------------------------------
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
   * ==========================================================
   * ADAPT SERVICE VALUES
   * ==========================================================
   *
   * IMPORTANT:
   *
   * DO NOT change RevenueServiceFields.
   *
   * RevenueServiceFields is shared by multiple modules and
   * currently expects:
   *
   *   values[field.id]
   *
   * However, ExistingLizz hydration uses:
   *
   *   serviceFieldValues[field.key]
   *
   * Example:
   *
   *   serviceFieldValues[service.id].LAND_AREA = 200
   *
   * becomes:
   *
   *   values["01a0a71b-d3e1-7012-818e-df7a5d1e10df"] = 200
   *
   * This adapter exists only at this boundary.
   */

  const selectedServiceFieldValues =
    useMemo(() => {

      const result: Record<
        string,
        Record<string, ServiceFieldValue>
      > = {}

      for (
        const service
        of selectedServices
      ) {

        const sourceValues =
          serviceFieldValues[
            service.id
          ] ?? {}

        const adaptedValues: Record<
          string,
          ServiceFieldValue
        > = {}

        /*
         * Map:
         *
         * field.key -> field.id
         *
         * while preserving the actual value type.
         */

        for (
          const field
          of service.fields
        ) {

          if (!field.id) {
            continue
          }

          const fieldKey =
            field.key

          if (!fieldKey) {
            continue
          }

          /*
           * Only copy values that actually exist.
           *
           * This is important because false and 0 are valid
           * values and must NOT be treated as missing.
           */

          if (
            Object.prototype.hasOwnProperty.call(
              sourceValues,
              fieldKey,
            )
          ) {

            adaptedValues[
              field.id
            ] =
              sourceValues[
                fieldKey
              ]
          }

        }

        result[
          service.id
        ] =
          adaptedValues

      }

      return result

    }, [
      selectedServices,
      serviceFieldValues,
    ])


  /*
   * ==========================================================
   * RENDER
   * ==========================================================
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
                   * ------------------------------------------------
                   * IMPORTANT:
                   *
                   * Use the ADAPTED values here.
                   *
                   * RevenueServiceFields expects:
                   *
                   *   values[field.id]
                   *
                   * The adapter above converts:
                   *
                   *   LAND_AREA -> field.id
                   *   AGREEMENT_DATE -> field.id
                   *   etc.
                   * ------------------------------------------------
                   */

                  values={
                    selectedServiceFieldValues[
                      service.id
                    ] ?? {}
                  }

                  /*
                   * ------------------------------------------------
                   * VALIDATION ERRORS
                   * ------------------------------------------------
                   */

                  errors={
                    serviceErrors
                  }

                  /*
                   * ------------------------------------------------
                   * FIELD CHANGE
                   * ------------------------------------------------
                   *
                   * RevenueServiceFields returns field.id.
                   *
                   * But ExistingAgreement hook stores values using
                   * field.key.
                   *
                   * Therefore convert:
                   *
                   *   field.id -> field.key
                   *
                   * before updating the hook.
                   */

                  onChange={(
                    fieldId,
                    value,
                  ) => {

                    const field =
                      service.fields.find(
                        (
                          item,
                        ) =>
                          item.id ===
                          fieldId,
                      )

                    if (!field?.key) {
                      return
                    }

                    setServiceFieldValue(
                      service.id,
                      field.key,
                      value as ServiceFieldValue,
                    )
                  }}


                  /*
                   * ------------------------------------------------
                   * FILE CHANGE
                   * ------------------------------------------------
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
                   * ------------------------------------------------
                   * REMOVE FILE
                   * ------------------------------------------------
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
                   * ------------------------------------------------
                   * REMOVE SERVICE
                   * ------------------------------------------------
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