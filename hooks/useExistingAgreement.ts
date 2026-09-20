"use client"

import { useMemo, useState } from "react"

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
 *
 * Only fields that are common to every existing agreement
 * belong here.
 *
 * Service-specific fields belong in serviceFieldValues.
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
 */

const initialFinancial: ExistingFinancialPosition = {
  originalObligation: "",
  amountAlreadyPaid: "",
  balanceAsOfDate: "",
}

/*
 * ============================================================
 * DYNAMIC SERVICE FIELD TYPES
 * ============================================================
 */

type ServiceFieldValues = Record<
  string,
  Record<string, string>
>

type ValidationErrors = Record<
  string,
  Record<string, string>
>

/*
 * ============================================================
 * HOOK OPTIONS
 * ============================================================
 */

interface UseExistingAgreementOptions {
  taxpayers: Citizen[]
  revenueServices: RevenueService[]
}

/*
 * ============================================================
 * HOOK
 * ============================================================
 */

export function useExistingAgreement({
  taxpayers,
  revenueServices,
}: UseExistingAgreementOptions) {
  /*
   * ==========================================================
   * WORKFLOW STATE
   * ==========================================================
   */

  const [currentStep, setCurrentStep] =
    useState<Step>(1)

  const [registered, setRegistered] =
    useState(false)

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
   * Structure:
   *
   * {
   *   "service-id": {
   *     "fieldKey": "fieldValue",
   *     "anotherField": "anotherValue"
   *   }
   * }
   *
   * Example:
   *
   * {
   *   "land-lease-service-id": {
   *     "agreementNumber": "AGR-001",
   *     "agreementDate": "2025-01-01",
   *     "landHoldingNumber": "LH-100",
   *     "landArea": "500",
   *     "location": "Adama"
   *   }
   * }
   */

  const [
    serviceFieldValues,
    setServiceFieldValues,
  ] = useState<ServiceFieldValues>({})

  /*
   * ==========================================================
   * DYNAMIC VALIDATION ERRORS
   * ==========================================================
   */

  const [
    validationErrors,
    setValidationErrors,
  ] = useState<ValidationErrors>({})

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
   *
   * Derived from the selected revenue service.
   *
   * The user does not manually enter this.
   */

  const revenueCode =
    selectedRevenueService?.code ?? ""

  /*
   * ==========================================================
   * OUTSTANDING BALANCE
   * ==========================================================
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
   * UPDATE AGREEMENT
   * ==========================================================
   */

  function updateAgreement(
    field: keyof ExistingAgreementForm,
    value: string,
  ) {
    setAgreement((previous) => ({
      ...previous,
      [field]: value,
    }))
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
    setFinancial((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  /*
   * ==========================================================
   * SELECT TAXPAYER
   * ==========================================================
   */

  function selectTaxpayer(
    taxpayerId: string,
  ) {
    setAgreement((previous) => ({
      ...previous,
      taxpayerId,
    }))
  }

  /*
   * ==========================================================
   * CLEAR TAXPAYER
   * ==========================================================
   */

  function clearTaxpayer() {
    setAgreement((previous) => ({
      ...previous,
      taxpayerId: "",
    }))
  }

  /*
   * ==========================================================
   * SELECT REVENUE SERVICE
   * ==========================================================
   *
   * Existing Agreement supports one revenue service.
   *
   * When a service is selected:
   *
   * 1. Set revenueServiceId.
   * 2. Create an empty field-value object for that service
   *    if one does not already exist.
   * 3. Create an empty validation-error object if needed.
   *
   * We do NOT hard-code any service fields here.
   */

  function selectRevenueService(
    revenueServiceId: string,
  ) {
    setAgreement((previous) => ({
      ...previous,
      revenueServiceId,
    }))

    /*
     * No service selected.
     */

    if (!revenueServiceId) {
      setServiceFieldValues({})
      setValidationErrors({})
      return
    }

    /*
     * Initialize the selected service only if it
     * does not already have values.
     */

    setServiceFieldValues((previous) => ({
      ...previous,

      [revenueServiceId]:
        previous[revenueServiceId] ?? {},
    }))

    /*
     * Initialize validation errors for the
     * selected service.
     */

    setValidationErrors((previous) => ({
      ...previous,

      [revenueServiceId]:
        previous[revenueServiceId] ?? {},
    }))
  }

  /*
   * ==========================================================
   * SET SERVICE FIELD VALUE
   * ==========================================================
   *
   * Called by RevenueServiceFields.
   *
   * Example:
   *
   * setServiceFieldValue(
   *   "service-id",
   *   "landArea",
   *   "500"
   * )
   *
   * Result:
   *
   * {
   *   "service-id": {
   *     "landArea": "500"
   *   }
   * }
   */

  function setServiceFieldValue(
    serviceId: string,
    field: string,
    value: string,
  ) {
    setServiceFieldValues((previous) => ({
      ...previous,

      [serviceId]: {
        ...(previous[serviceId] ?? {}),
        [field]: value,
      },
    }))

    /*
     * Clear the field validation error
     * once the user changes the value.
     */

    setValidationErrors((previous) => {
      const serviceErrors =
        previous[serviceId]

      if (!serviceErrors?.[field]) {
        return previous
      }

      const updatedServiceErrors = {
        ...serviceErrors,
      }

      delete updatedServiceErrors[field]

      return {
        ...previous,

        [serviceId]:
          updatedServiceErrors,
      }
    })
  }

  /*
   * ==========================================================
   * FILE FIELD
   * ==========================================================
   *
   * The current state stores the selected file name as a string.
   *
   * The actual File object should normally be managed separately
   * if the API requires multipart/form-data.
   */

  function handleFileChange(
    serviceId: string,
    field: string,
    file: File | null,
  ) {
    setServiceFieldValues((previous) => ({
      ...previous,

      [serviceId]: {
        ...(previous[serviceId] ?? {}),

        [field]: file
          ? file.name
          : "",
      },
    }))

    /*
     * Clear validation error.
     */

    setValidationErrors((previous) => {
      const serviceErrors =
        previous[serviceId]

      if (!serviceErrors?.[field]) {
        return previous
      }

      const updatedServiceErrors = {
        ...serviceErrors,
      }

      delete updatedServiceErrors[field]

      return {
        ...previous,

        [serviceId]:
          updatedServiceErrors,
      }
    })
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
    setServiceFieldValues((previous) => ({
      ...previous,

      [serviceId]: {
        ...(previous[serviceId] ?? {}),

        [field]: "",
      },
    }))
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
     * Clear the selected service if this is
     * the currently selected service.
     */

    if (
      agreement.revenueServiceId ===
      serviceId
    ) {
      setAgreement((previous) => ({
        ...previous,
        revenueServiceId: "",
      }))
    }

    /*
     * Remove its dynamic values.
     */

    setServiceFieldValues((previous) => {
      const next = {
        ...previous,
      }

      delete next[serviceId]

      return next
    })

    /*
     * Remove its validation errors.
     */

    setValidationErrors((previous) => {
      const next = {
        ...previous,
      }

      delete next[serviceId]

      return next
    })
  }

  /*
   * ==========================================================
   * STEP NAVIGATION
   * ==========================================================
   */

  function nextStep() {
    setCurrentStep((previous) => {
      if (previous === 1) {
        return 2
      }

      if (previous === 2) {
        return 3
      }

      return previous
    })
  }

  function previousStep() {
    setCurrentStep((previous) => {
      if (previous === 3) {
        return 2
      }

      if (previous === 2) {
        return 1
      }

      return previous
    })
  }

  function goToStep(step: Step) {
    setCurrentStep(step)
  }

  /*
   * ==========================================================
   * REGISTER
   * ==========================================================
   */

  async function handleRegister() {
    const serviceId =
      agreement.revenueServiceId

    const payload = {
      taxpayer_id:
        agreement.taxpayerId,

      revenue_service_id:
        serviceId,

      service_fields: serviceId
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

      balance_as_of_date:
        financial.balanceAsOfDate,
    }

    console.log(
      "Register existing agreement payload:",
      payload,
    )

    /*
     * TODO:
     *
     * Replace with the actual Laravel API call.
     *
     * Example:
     *
     * await api.post(
     *   "/api/v1/revenue/existing-agreements",
     *   payload,
     * )
     */

    setRegistered(true)
  }

  /*
   * ==========================================================
   * RESET FORM
   * ==========================================================
   */

  function resetForm() {
    setCurrentStep(1)
    setRegistered(false)

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
   */

  return {
    /*
     * Step
     */
    currentStep,
    nextStep,
    previousStep,
    goToStep,

    /*
     * Registration
     */
    registered,
    handleRegister,
    resetForm,

    /*
     * Agreement
     */
    agreement,
    updateAgreement,

    /*
     * Financial
     */
    financial,
    updateFinancial,

    /*
     * Taxpayer
     */
    taxpayers,
    selectedTaxpayer,
    selectTaxpayer,
    clearTaxpayer,

    /*
     * Revenue service
     */
    revenueServices,
    selectedRevenueService,
    revenueCode,
    selectRevenueService,

    /*
     * Dynamic service fields
     */
    serviceFieldValues,
    validationErrors,
    setServiceFieldValue,
    handleFileChange,
    removeFile,
    removeService,

    /*
     * Financial calculation
     */
    outstandingBalance,
  }
}
