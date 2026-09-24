"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import type {
  ExistingAgreementForm,
  ExistingFinancialPosition,
  Step,
} from "@/types/existing-agreement"

import type {
  Citizen,
} from "@/types/citizen"

import type {
  RevenueService,
} from "@/types/revenue/assessment"

/*
 * ============================================================
 * INITIAL AGREEMENT
 * ============================================================
 */

const initialAgreement: ExistingAgreementForm = {
  taxpayerId: "",
  revenueServiceId: "",
  source: "",
  notes: "",
}

/*
 * ============================================================
 * INITIAL FINANCIAL POSITION
 * ============================================================
 *
 * Historical financial position contains:
 *
 * - Original Obligation
 * - Amount Already Paid
 *
 * Outstanding balance is calculated dynamically.
 *
 * There is intentionally NO balanceAsOfDate.
 *
 * The assessment record already has normal system timestamps
 * such as created_at / updated_at.
 */

const initialFinancial: ExistingFinancialPosition = {
  originalObligation: "",
  amountAlreadyPaid: "",
}

/*
 * ============================================================
 * DYNAMIC SERVICE FIELD TYPES
 * ============================================================
 *
 * Service fields can contain:
 *
 * - string
 * - number
 * - boolean
 *
 * IMPORTANT:
 *
 * Do not convert boolean false into an empty value.
 */

export type ServiceFieldValue =
  | string
  | number
  | boolean

type ServiceFieldValues = Record<
  string,
  Record<string, ServiceFieldValue>
>

/*
 * ============================================================
 * VALIDATION ERROR TYPES
 * ============================================================
 */

export type ValidationErrors = {
  agreement?: Record<string, string>

  financial?: Record<string, string>

  service?: Record<
    string,
    Record<string, string>
  >
}

/*
 * ============================================================
 * HOOK OPTIONS
 * ============================================================
 */

interface UseExistingAgreementOptions {
  taxpayers: Citizen[]

  revenueServices: RevenueService[]

  /**
   * Existing assessment ID.
   *
   * Undefined = CREATE
   * Defined   = EDIT
   */
  assessmentId?: string

  /**
   * Existing assessment data.
   *
   * Primarily used by EDIT mode.
   */
  initialData?: unknown
}

/*
 * ============================================================
 * EMPTY VALUE CHECK
 * ============================================================
 *
 * IMPORTANT:
 *
 * Do NOT use:
 *
 *     if (!value)
 *
 * because:
 *
 *     !false === true
 *     !0 === true
 *
 * Both false and 0 can be valid values.
 *
 * A value is empty only when:
 *
 * - undefined
 * - null
 * - empty string
 * - whitespace-only string
 */

function isEmptyServiceValue(
  value: unknown,
): boolean {
  return (
    value === undefined ||
    value === null ||
    (
      typeof value === "string" &&
      value.trim() === ""
    )
  )
}

/*
 * ============================================================
 * NORMALIZE SERVICE FIELD VALUES
 * ============================================================
 *
 * Keeps:
 *
 * string  -> string
 * number  -> number
 * boolean -> boolean
 *
 * This is important for checkbox fields.
 */

function normalizeServiceFieldValues(
  values: Record<string, unknown>,
): Record<string, ServiceFieldValue> {
  return Object.fromEntries(
    Object.entries(values).map(
      ([key, value]) => {

        if (
          typeof value === "boolean"
        ) {
          return [
            key,
            value,
          ]
        }

        if (
          typeof value === "number"
        ) {
          return [
            key,
            value,
          ]
        }

        if (
          typeof value === "string"
        ) {
          return [
            key,
            value,
          ]
        }

        return [
          key,
          String(value ?? ""),
        ]
      },
    ),
  )
}

/*
 * ============================================================
 * HOOK
 * ============================================================
 */

export function useExistingAgreement({
  taxpayers,
  revenueServices,
  assessmentId,
  initialData,
}: UseExistingAgreementOptions) {

  /*
   * ==========================================================
   * MODE
   * ==========================================================
   */

  const isEditMode =
    Boolean(assessmentId)

  /*
   * ==========================================================
   * WORKFLOW STATE
   * ==========================================================
   */

  const [currentStep, setCurrentStep] =
    useState<Step>(1)

  /*
   * ==========================================================
   * AGREEMENT STATE
   * ==========================================================
   */

  const [agreement, setAgreement] =
    useState<ExistingAgreementForm>(
      initialAgreement,
    )

  /*
   * ==========================================================
   * FINANCIAL STATE
   * ==========================================================
   */

  const [financial, setFinancial] =
    useState<ExistingFinancialPosition>(
      initialFinancial,
    )

  /*
   * ==========================================================
   * DYNAMIC SERVICE FIELD VALUES
   * ==========================================================
   *
   * Internal structure:
   *
   * {
   *   [serviceId]: {
   *     [fieldId]: value
   *   }
   * }
   *
   * Example:
   *
   * {
   *   "service-uuid": {
   *     "field-uuid": "100",
   *     "another-field-uuid": false
   *   }
   * }
   *
   * IMPORTANT:
   *
   * The final API payload flattens this to:
   *
   * {
   *   "field-uuid": "100",
   *   "another-field-uuid": false
   * }
   */

  const [
    serviceFieldValues,
    setServiceFieldValues,
  ] = useState<ServiceFieldValues>({})

  /*
   * ==========================================================
   * VALIDATION ERRORS
   * ==========================================================
   */

  const [
    validationErrors,
    setValidationErrors,
  ] = useState<ValidationErrors>({})

  /*
   * ==========================================================
   * EDIT MODE INITIALIZATION
   * ==========================================================
   */

  useEffect(() => {

    /*
     * --------------------------------------------------------
     * CREATE MODE
     * --------------------------------------------------------
     */

    if (!isEditMode) {
      return
    }

    /*
     * --------------------------------------------------------
     * NO INITIAL DATA
     * --------------------------------------------------------
     */

    if (!initialData) {
      return
    }

    const data =
      initialData as Record<
        string,
        unknown
      >

    /*
     * --------------------------------------------------------
     * AGREEMENT
     * --------------------------------------------------------
     */

    const taxpayerId =
      String(
        data.taxpayer_id ??
        data.taxpayerId ??
        "",
      )

    const revenueServiceId =
      String(
        data.revenue_service_id ??
        data.revenueServiceId ??
        "",
      )

    const source =
      String(
        data.source ?? "",
      )

    const notes =
      String(
        data.notes ?? "",
      )

    setAgreement({
      taxpayerId,
      revenueServiceId,
      source,
      notes,
    })

    /*
     * --------------------------------------------------------
     * FINANCIAL
     * --------------------------------------------------------
     *
     * Only the two historical totals are loaded.
     *
     * balanceAsOfDate has intentionally been removed.
     */

    setFinancial({
      originalObligation:
        String(
          data.original_obligation ??
          data.originalObligation ??
          "",
        ),

      amountAlreadyPaid:
        String(
          data.amount_already_paid ??
          data.amountAlreadyPaid ??
          "",
        ),
    })

    /*
     * --------------------------------------------------------
     * SERVICE FIELDS
     * --------------------------------------------------------
     *
     * Supports both:
     *
     * 1. Flat:
     *
     * {
     *   "field-uuid": "100"
     * }
     *
     * 2. Nested:
     *
     * {
     *   "service-uuid": {
     *     "field-uuid": "100"
     *   }
     * }
     *
     * The final API payload is flat.
     */

    const incomingServiceFields =
      data.service_fields ??
      data.serviceFieldValues

    if (
      !incomingServiceFields ||
      typeof incomingServiceFields !== "object" ||
      Array.isArray(incomingServiceFields)
    ) {
      return
    }

    const objectValue =
      incomingServiceFields as Record<
        string,
        unknown
      >

    /*
     * --------------------------------------------------------
     * DETECT NESTED STRUCTURE
     * --------------------------------------------------------
     */

    const isNestedServiceStructure =
      Object.values(
        objectValue,
      ).some(
        (value) =>
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value),
      )

    /*
     * --------------------------------------------------------
     * NESTED SERVICE STRUCTURE
     * --------------------------------------------------------
     */

    if (
      isNestedServiceStructure
    ) {

      const normalized:
        ServiceFieldValues = {}

      for (
        const [
          serviceId,
          rawFields,
        ] of Object.entries(
          objectValue,
        )
      ) {

        if (
          !rawFields ||
          typeof rawFields !== "object" ||
          Array.isArray(rawFields)
        ) {
          continue
        }

        normalized[serviceId] =
          normalizeServiceFieldValues(
            rawFields as Record<
              string,
              unknown
            >,
          )
      }

      setServiceFieldValues(
        normalized,
      )

    /*
     * --------------------------------------------------------
     * FLAT SERVICE STRUCTURE
     * --------------------------------------------------------
     */

    } else if (
      revenueServiceId
    ) {

      setServiceFieldValues({
        [revenueServiceId]:
          normalizeServiceFieldValues(
            objectValue,
          ),
      })
    }

  }, [
    isEditMode,
    initialData,
  ])

  /*
   * ==========================================================
   * SELECTED TAXPAYER
   * ==========================================================
   */

  const selectedTaxpayer = useMemo(() => {

    if (!agreement.taxpayerId) {
      return null
    }

    return (
      taxpayers.find(
        (taxpayer) =>
          taxpayer.id ===
          agreement.taxpayerId,
      ) ?? null
    )

  }, [
    taxpayers,
    agreement.taxpayerId,
  ])

  /*
   * ==========================================================
   * SELECTED REVENUE SERVICE
   * ==========================================================
   */

  const selectedRevenueService =
    useMemo<RevenueService | null>(() => {

      if (!agreement.revenueServiceId) {
        return null
      }

      return (
        revenueServices.find(
          (service) =>
            service.id ===
            agreement.revenueServiceId,
        ) ?? null
      )

    }, [
      revenueServices,
      agreement.revenueServiceId,
    ])

  /*
   * ==========================================================
   * REVENUE CODE
   * ==========================================================
   */

  const revenueCode =
    selectedRevenueService?.code ?? ""

  /*
   * ==========================================================
   * OUTSTANDING BALANCE
   * ==========================================================
   *
   * Formula:
   *
   * Original Obligation
   *        -
   * Amount Already Paid
   *        =
   * Outstanding Historical Balance
   *
   * Example:
   *
   * Original Obligation = 10,000
   * Amount Already Paid = 1,000
   * Outstanding Balance = 9,000
   */

  const outstandingBalance = useMemo(() => {

    const originalObligation =
      Number(
        financial.originalObligation,
      ) || 0

    const amountAlreadyPaid =
      Number(
        financial.amountAlreadyPaid,
      ) || 0

    return Math.max(
      0,
      originalObligation -
        amountAlreadyPaid,
    )

  }, [
    financial.originalObligation,
    financial.amountAlreadyPaid,
  ])

  /*
   * ==========================================================
   * CLEAR AGREEMENT ERROR
   * ==========================================================
   */

  function clearAgreementError(
    field: string,
  ) {

    setValidationErrors(
      (previous) => {

        const agreementErrors =
          previous.agreement

        if (
          !agreementErrors?.[field]
        ) {
          return previous
        }

        const updatedErrors = {
          ...agreementErrors,
        }

        delete updatedErrors[field]

        return {
          ...previous,
          agreement:
            updatedErrors,
        }
      },
    )
  }

  /*
   * ==========================================================
   * CLEAR FINANCIAL ERROR
   * ==========================================================
   */

  function clearFinancialError(
    field: string,
  ) {

    setValidationErrors(
      (previous) => {

        const financialErrors =
          previous.financial

        if (
          !financialErrors?.[field]
        ) {
          return previous
        }

        const updatedErrors = {
          ...financialErrors,
        }

        delete updatedErrors[field]

        return {
          ...previous,
          financial:
            updatedErrors,
        }
      },
    )
  }

  /*
   * ==========================================================
   * UPDATE AGREEMENT
   * ==========================================================
   */

  function updateAgreement(
    field: keyof ExistingAgreementForm,
    value: string,
  ) {

    setAgreement(
      (previous) => ({
        ...previous,
        [field]: value,
      }),
    )

    clearAgreementError(
      String(field),
    )
  }

  /*
   * ==========================================================
   * UPDATE FINANCIAL
   * ==========================================================
   */

  function updateFinancial(
    field: keyof ExistingFinancialPosition,
    value: string,
  ) {

    setFinancial(
      (previous) => ({
        ...previous,
        [field]: value,
      }),
    )

    clearFinancialError(
      String(field),
    )
  }

  /*
   * ==========================================================
   * SELECT TAXPAYER
   * ==========================================================
   */

  function selectTaxpayer(
    taxpayerId: string,
  ) {

    setAgreement(
      (previous) => ({
        ...previous,
        taxpayerId,
      }),
    )

    clearAgreementError(
      "taxpayerId",
    )
  }

  /*
   * ==========================================================
   * CLEAR TAXPAYER
   * ==========================================================
   */

  function clearTaxpayer() {

    setAgreement(
      (previous) => ({
        ...previous,
        taxpayerId: "",
      }),
    )

    clearAgreementError(
      "taxpayerId",
    )
  }

  /*
   * ==========================================================
   * SELECT REVENUE SERVICE
   * ==========================================================
   */

  function selectRevenueService(
    revenueServiceId: string,
  ) {

    setAgreement(
      (previous) => ({
        ...previous,
        revenueServiceId,
      }),
    )

    /*
     * --------------------------------------------------------
     * NO SERVICE
     * --------------------------------------------------------
     */

    if (!revenueServiceId) {

      setServiceFieldValues({})

      setValidationErrors(
        (previous) => ({
          ...previous,
          service: {},
        }),
      )

      clearAgreementError(
        "revenueServiceId",
      )

      return
    }

    /*
     * --------------------------------------------------------
     * INITIALIZE SERVICE VALUES
     * --------------------------------------------------------
     */

    setServiceFieldValues(
      (previous) => ({
        ...previous,

        [revenueServiceId]:
          previous[
            revenueServiceId
          ] ?? {},
      }),
    )

    /*
     * --------------------------------------------------------
     * CLEAR SERVICE ERROR
     * --------------------------------------------------------
     */

    setValidationErrors(
      (previous) => {

        if (
          !previous.service?.[
            revenueServiceId
          ]
        ) {
          return previous
        }

        const serviceErrors = {
          ...(previous.service ?? {}),
        }

        delete serviceErrors[
          revenueServiceId
        ]

        return {
          ...previous,
          service:
            serviceErrors,
        }
      },
    )

    clearAgreementError(
      "revenueServiceId",
    )
  }

  /*
   * ==========================================================
   * SET SERVICE FIELD VALUE
   * ==========================================================
   *
   * IMPORTANT:
   *
   * `field` must normally be the service-field UUID.
   *
   * Example:
   *
   * field =
   * "01a0a71b-d3e1-7012-818e-df7a5d1e10df"
   *
   * NOT:
   *
   * "LAND_AREA"
   */

  function setServiceFieldValue(
    serviceId: string,
    field: string,
    value: ServiceFieldValue,
  ) {

    setServiceFieldValues(
      (previous) => ({
        ...previous,

        [serviceId]: {
          ...(previous[
            serviceId
          ] ?? {}),

          [field]:
            value,
        },
      }),
    )

    /*
     * --------------------------------------------------------
     * CLEAR VALIDATION ERROR
     * --------------------------------------------------------
     */

    setValidationErrors(
      (previous) => {

        const serviceErrors =
          previous.service?.[
            serviceId
          ]

        if (
          !serviceErrors?.[field]
        ) {
          return previous
        }

        const updatedServiceErrors = {
          ...serviceErrors,
        }

        delete updatedServiceErrors[
          field
        ]

        return {
          ...previous,

          service: {
            ...(previous.service ?? {}),

            [serviceId]:
              updatedServiceErrors,
          },
        }
      },
    )
  }

  /*
   * ==========================================================
   * FILE FIELD
   * ==========================================================
   *
   * IMPORTANT:
   *
   * The current form state stores the selected file name.
   *
   * It does NOT store the actual File object.
   *
   * If the backend later requires real file uploads,
   * introduce separate File state and append the files
   * directly to FormData.
   */

  function handleFileChange(
    serviceId: string,
    field: string,
    file: File | null,
  ) {

    const value:
      ServiceFieldValue =
      file
        ? file.name
        : ""

    setServiceFieldValue(
      serviceId,
      field,
      value,
    )
  }

  /*
   * ==========================================================
   * REMOVE FILE
   * ==========================================================
   */

  function removeFile(
    serviceId: string,
    field: string,
  ) {

    setServiceFieldValue(
      serviceId,
      field,
      "",
    )
  }

  /*
   * ==========================================================
   * REMOVE SERVICE
   * ==========================================================
   */

  function removeService(
    serviceId: string,
  ) {

    /*
     * --------------------------------------------------------
     * CLEAR SELECTED SERVICE
     * --------------------------------------------------------
     */

    if (
      agreement.revenueServiceId ===
      serviceId
    ) {

      setAgreement(
        (previous) => ({
          ...previous,
          revenueServiceId: "",
        }),
      )

      clearAgreementError(
        "revenueServiceId",
      )
    }

    /*
     * --------------------------------------------------------
     * REMOVE SERVICE VALUES
     * --------------------------------------------------------
     */

    setServiceFieldValues(
      (previous) => {

        const next = {
          ...previous,
        }

        delete next[
          serviceId
        ]

        return next
      },
    )

    /*
     * --------------------------------------------------------
     * REMOVE SERVICE ERRORS
     * --------------------------------------------------------
     */

    setValidationErrors(
      (previous) => {

        const nextServiceErrors = {
          ...(previous.service ?? {}),
        }

        delete nextServiceErrors[
          serviceId
        ]

        return {
          ...previous,
          service:
            nextServiceErrors,
        }
      },
    )
  }

  /*
   * ==========================================================
   * STEP 1 VALIDATION
   * ==========================================================
   */

  function validateAgreementStep():
    ValidationErrors {

    const agreementErrors:
      Record<string, string> = {}

    const serviceErrors:
      Record<string, string> = {}

    /*
     * --------------------------------------------------------
     * TAXPAYER
     * --------------------------------------------------------
     */

    if (
      isEmptyServiceValue(
        agreement.taxpayerId,
      )
    ) {

      agreementErrors.taxpayerId =
        "Please select a taxpayer."
    }

    /*
     * --------------------------------------------------------
     * REVENUE SERVICE
     * --------------------------------------------------------
     */

    if (
      isEmptyServiceValue(
        agreement.revenueServiceId,
      )
    ) {

      agreementErrors.revenueServiceId =
        "Please select a revenue service."
    }

    /*
     * --------------------------------------------------------
     * DYNAMIC SERVICE FIELDS
     * --------------------------------------------------------
     */

    const service =
      selectedRevenueService

    const serviceId =
      agreement.revenueServiceId

    if (
      service &&
      serviceId
    ) {

      const values =
        serviceFieldValues[
          serviceId
        ] ?? {}

      /*
       * ------------------------------------------------------
       * READ SERVICE FIELD DEFINITIONS
       * ------------------------------------------------------
       */

      const fields =
        (
          service as RevenueService & {
            fields?: unknown
          }
        ).fields

      /*
       * ------------------------------------------------------
       * SAFETY CHECK
       * ------------------------------------------------------
       */

      if (
        Array.isArray(fields)
      ) {

        for (
          const rawField of fields
        ) {

          if (
            !rawField ||
            typeof rawField !== "object"
          ) {
            continue
          }

          const field =
            rawField as Record<
              string,
              unknown
            >

          /*
           * --------------------------------------------------
           * REQUIRED FLAG
           * --------------------------------------------------
           */

          const required =
            field.required === true ||
            field.is_required === true

          if (!required) {
            continue
          }

          /*
           * --------------------------------------------------
           * FIELD IDENTIFIER
           * --------------------------------------------------
           *
           * UUID first:
           *
           * id -> key -> name
           *
           * Actual submitted values use the UUID.
           */

          const fieldId =
            typeof field.id === "string"
              ? field.id
              : undefined

          const fieldKey =
            fieldId ??
            (
              typeof field.key === "string"
                ? field.key
                : undefined
            ) ??
            (
              typeof field.name === "string"
                ? field.name
                : undefined
            )

          if (!fieldKey) {
            continue
          }

          /*
           * --------------------------------------------------
           * FIELD VALUE
           * --------------------------------------------------
           */

          const value =
            values[fieldKey]

          /*
           * --------------------------------------------------
           * REQUIRED VALIDATION
           * --------------------------------------------------
           *
           * false is valid.
           *
           * 0 is valid.
           *
           * "0" is valid.
           */

          if (
            isEmptyServiceValue(
              value,
            )
          ) {

            const label =
              typeof field.label === "string" &&
              field.label.trim() !== ""
                ? field.label
                : fieldKey

            serviceErrors[fieldKey] =
              `${label} is required.`
          }
        }
      }
    }

    /*
     * --------------------------------------------------------
     * BUILD RESULT
     * --------------------------------------------------------
     */

    const result:
      ValidationErrors = {}

    if (
      Object.keys(
        agreementErrors,
      ).length > 0
    ) {

      result.agreement =
        agreementErrors
    }

    if (
      serviceId &&
      Object.keys(
        serviceErrors,
      ).length > 0
    ) {

      result.service = {
        [serviceId]:
          serviceErrors,
      }
    }

    return result
  }

  /*
   * ==========================================================
   * STEP 2 VALIDATION
   * ==========================================================
   *
   * Required:
   *
   * - Original Obligation
   * - Amount Already Paid
   *
   * Business rule:
   *
   * Amount Already Paid
   * cannot exceed
   * Original Obligation.
   *
   * There is intentionally NO balanceAsOfDate.
   */

  function validateFinancialStep():
    ValidationErrors {

    const errors:
      Record<string, string> = {}

    /*
     * --------------------------------------------------------
     * ORIGINAL OBLIGATION
     * --------------------------------------------------------
     */

    if (
      isEmptyServiceValue(
        financial.originalObligation,
      )
    ) {

      errors.originalObligation =
        "Original obligation is required."

    } else {

      const value =
        Number(
          financial.originalObligation,
        )

      if (
        !Number.isFinite(value) ||
        value < 0
      ) {

        errors.originalObligation =
          "Original obligation must be a valid non-negative amount."
      }
    }

    /*
     * --------------------------------------------------------
     * AMOUNT ALREADY PAID
     * --------------------------------------------------------
     */

    if (
      isEmptyServiceValue(
        financial.amountAlreadyPaid,
      )
    ) {

      errors.amountAlreadyPaid =
        "Amount already paid is required."

    } else {

      const value =
        Number(
          financial.amountAlreadyPaid,
        )

      if (
        !Number.isFinite(value) ||
        value < 0
      ) {

        errors.amountAlreadyPaid =
          "Amount already paid must be a valid non-negative amount."
      }
    }

    /*
     * --------------------------------------------------------
     * PAID CANNOT EXCEED ORIGINAL OBLIGATION
     * --------------------------------------------------------
     */

    const originalObligation =
      Number(
        financial.originalObligation,
      )

    const amountAlreadyPaid =
      Number(
        financial.amountAlreadyPaid,
      )

    if (
      Number.isFinite(
        originalObligation,
      ) &&
      Number.isFinite(
        amountAlreadyPaid,
      ) &&
      originalObligation >= 0 &&
      amountAlreadyPaid >= 0 &&
      amountAlreadyPaid >
        originalObligation
    ) {

      errors.amountAlreadyPaid =
        "Amount already paid cannot exceed the original obligation."
    }

    /*
     * --------------------------------------------------------
     * RESULT
     * --------------------------------------------------------
     */

    if (
      Object.keys(errors).length === 0
    ) {
      return {}
    }

    return {
      financial:
        errors,
    }
  }

  /*
   * ==========================================================
   * STEP 3 VALIDATION
   * ==========================================================
   *
   * Step 3 is the review page.
   *
   * Actual data has already been validated by Steps 1 and 2.
   */

  function validateReviewStep():
    ValidationErrors {

    return {}
  }

  /*
   * ==========================================================
   * GENERIC STEP VALIDATION
   * ==========================================================
   */

  function validateStep(
    step: Step,
  ): ValidationErrors {

    if (step === 1) {
      return validateAgreementStep()
    }

    if (step === 2) {
      return validateFinancialStep()
    }

    if (step === 3) {
      return validateReviewStep()
    }

    return {}
  }

  /*
   * ==========================================================
   * HAS VALIDATION ERRORS
   * ==========================================================
   */

  function hasValidationErrors(
    errors: ValidationErrors,
  ): boolean {

    /*
     * Agreement errors
     */

    if (
      errors.agreement &&
      Object.keys(
        errors.agreement,
      ).length > 0
    ) {
      return true
    }

    /*
     * Financial errors
     */

    if (
      errors.financial &&
      Object.keys(
        errors.financial,
      ).length > 0
    ) {
      return true
    }

    /*
     * Dynamic service-field errors
     */

    if (
      errors.service
    ) {

      for (
        const serviceErrors of Object.values(
          errors.service,
        )
      ) {

        if (
          Object.keys(
            serviceErrors,
          ).length > 0
        ) {
          return true
        }
      }
    }

    return false
  }

  /*
   * ==========================================================
   * VALIDATE ALL
   * ==========================================================
   *
   * This is the only validation function the final
   * registration action needs to call.
   *
   * IMPORTANT:
   *
   * This function does NOT call the API.
   *
   * It only:
   *
   * 1. validates Step 1
   * 2. validates Step 2
   * 3. stores validation errors
   * 4. moves to the first invalid step
   *
   * API mutations belong to:
   *
   * hooks/revenue/existing-lizz.hook.ts
   */

  function validateAll(): boolean {

    /*
     * --------------------------------------------------------
     * STEP 1
     * --------------------------------------------------------
     */

    const step1Errors =
      validateAgreementStep()

    if (
      hasValidationErrors(
        step1Errors,
      )
    ) {

      setValidationErrors(
        step1Errors,
      )

      setCurrentStep(1)

      return false
    }

    /*
     * --------------------------------------------------------
     * STEP 2
     * --------------------------------------------------------
     */

    const step2Errors =
      validateFinancialStep()

    if (
      hasValidationErrors(
        step2Errors,
      )
    ) {

      setValidationErrors(
        step2Errors,
      )

      setCurrentStep(2)

      return false
    }

    /*
     * --------------------------------------------------------
     * ALL VALID
     * --------------------------------------------------------
     */

    setValidationErrors({})

    return true
  }

  /*
   * ==========================================================
   * NEXT STEP
   * ==========================================================
   */

  function nextStep() {

    const errors =
      validateStep(
        currentStep,
      )

    if (
      hasValidationErrors(
        errors,
      )
    ) {

      setValidationErrors(
        errors,
      )

      return
    }

    setValidationErrors({})

    setCurrentStep(
      (previous) => {

        if (previous === 1) {
          return 2
        }

        if (previous === 2) {
          return 3
        }

        return previous
      },
    )
  }

  /*
   * ==========================================================
   * PREVIOUS STEP
   * ==========================================================
   */

  function previousStep() {

    setValidationErrors({})

    setCurrentStep(
      (previous) => {

        if (previous === 3) {
          return 2
        }

        if (previous === 2) {
          return 1
        }

        return previous
      },
    )
  }

  /*
   * ==========================================================
   * GO TO STEP
   * ==========================================================
   *
   * Backward navigation is always allowed.
   *
   * Forward navigation validates each intermediate step.
   */

  function goToStep(
    targetStep: Step,
  ) {

    /*
     * --------------------------------------------------------
     * SAME STEP
     * --------------------------------------------------------
     */

    if (
      targetStep === currentStep
    ) {
      return
    }

    /*
     * --------------------------------------------------------
     * BACKWARD
     * --------------------------------------------------------
     */

    if (
      targetStep < currentStep
    ) {

      setValidationErrors({})

      setCurrentStep(
        targetStep,
      )

      return
    }

    /*
     * --------------------------------------------------------
     * FORWARD
     * --------------------------------------------------------
     */

    for (
      let step =
        currentStep;
      step < targetStep;
      step++
    ) {

      const errors =
        validateStep(
          step as Step,
        )

      if (
        hasValidationErrors(
          errors,
        )
      ) {

        setValidationErrors(
          errors,
        )

        setCurrentStep(
          step as Step,
        )

        return
      }
    }

    /*
     * All intermediate steps are valid.
     */

    setValidationErrors({})

    setCurrentStep(
      targetStep,
    )
  }

  /*
   * ==========================================================
   * BUILD PAYLOAD
   * ==========================================================
   *
   * Creates the plain JavaScript representation.
   *
   * IMPORTANT:
   *
   * The internal serviceFieldValues structure is:
   *
   * {
   *   serviceId: {
   *     fieldId: value
   *   }
   * }
   *
   * The API payload is FLAT:
   *
   * {
   *   service_fields: {
   *     fieldId: value
   *   }
   * }
   *
   * This matches the confirmed Existing LIZZ payload.
   *
   * There is intentionally:
   *
   * - no balance_as_of_date
   * - no outstanding_balance
   */

  function buildPayload() {

    const serviceId =
      agreement.revenueServiceId

    return {
      taxpayer_id:
        agreement.taxpayerId,

      revenue_service_id:
        serviceId,

      service_fields:
        serviceId
          ? serviceFieldValues[
              serviceId
            ] ?? {}
          : {},

      source:
        agreement.source,

      notes:
        agreement.notes,

      original_obligation:
        financial.originalObligation,

      amount_already_paid:
        financial.amountAlreadyPaid,
    }
  }

  /*
   * ==========================================================
   * BUILD FORM DATA
   * ==========================================================
   *
   * Existing LIZZ uses FormData.
   *
   * Current service_fields are serialized as JSON inside
   * the multipart request:
   *
   * service_fields = JSON.stringify({...})
   *
   * The backend therefore needs to decode this field as JSON.
   *
   * Actual File objects are NOT uploaded here because the
   * current state stores only the selected filename.
   */

  function buildFormData(): FormData {

    const payload =
      buildPayload()

    const formData =
      new FormData()

    formData.append(
      "taxpayer_id",
      payload.taxpayer_id,
    )

    formData.append(
      "revenue_service_id",
      payload.revenue_service_id,
    )

    formData.append(
      "service_fields",
      JSON.stringify(
        payload.service_fields,
      ),
    )

    formData.append(
      "source",
      payload.source,
    )

    formData.append(
      "notes",
      payload.notes,
    )

    formData.append(
      "original_obligation",
      payload.original_obligation,
    )

    formData.append(
      "amount_already_paid",
      payload.amount_already_paid,
    )

    return formData
  }

  /*
   * ==========================================================
   * RESET FORM
   * ==========================================================
   */

  function resetForm() {

    setCurrentStep(1)

    setAgreement({
      ...initialAgreement,
    })

    setFinancial({
      ...initialFinancial,
    })

    setServiceFieldValues({})

    setValidationErrors({})
  }

  /*
   * ==========================================================
   * RETURN
   * ==========================================================
   *
   * IMPORTANT:
   *
   * There is intentionally NO:
   *
   * - registered
   * - handleRegister
   *
   * API mutations belong to:
   *
   * hooks/revenue/existing-lizz.hook.ts
   */

  return {

    /*
     * --------------------------------------------------------
     * MODE
     * --------------------------------------------------------
     */

    isEditMode,

    assessmentId,

    /*
     * --------------------------------------------------------
     * WORKFLOW
     * --------------------------------------------------------
     */

    currentStep,

    nextStep,

    previousStep,

    goToStep,

    /*
     * --------------------------------------------------------
     * VALIDATION
     * --------------------------------------------------------
     */

    validationErrors,

    validateStep,

    validateAll,

    /*
     * --------------------------------------------------------
     * PAYLOAD
     * --------------------------------------------------------
     */

    buildPayload,

    buildFormData,

    /*
     * --------------------------------------------------------
     * RESET
     * --------------------------------------------------------
     */

    resetForm,

    /*
     * --------------------------------------------------------
     * AGREEMENT
     * --------------------------------------------------------
     */

    agreement,

    updateAgreement,

    /*
     * --------------------------------------------------------
     * FINANCIAL
     * --------------------------------------------------------
     */

    financial,

    updateFinancial,

    /*
     * --------------------------------------------------------
     * TAXPAYER
     * --------------------------------------------------------
     */

    taxpayers,

    selectedTaxpayer,

    selectTaxpayer,

    clearTaxpayer,

    /*
     * --------------------------------------------------------
     * REVENUE SERVICE
     * --------------------------------------------------------
     */

    revenueServices,

    selectedRevenueService,

    revenueCode,

    selectRevenueService,

    /*
     * --------------------------------------------------------
     * DYNAMIC SERVICE FIELDS
     * --------------------------------------------------------
     */

    serviceFieldValues,

    setServiceFieldValue,

    handleFileChange,

    removeFile,

    removeService,

    /*
     * --------------------------------------------------------
     * FINANCIAL CALCULATION
     * --------------------------------------------------------
     */

    outstandingBalance,
  }
}
