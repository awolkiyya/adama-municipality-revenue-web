export type Step = 1 | 2 | 3

/**
 * Common fields that belong to every existing agreement,
 * regardless of the selected revenue service.
 */
export interface ExistingAgreementForm {
  taxpayerId: string
  revenueServiceId: string
  source: string
  notes: string
}

/**
 * Financial information is common to the
 * existing-agreement workflow.
 */
export interface ExistingFinancialPosition {
  originalObligation: string
  amountAlreadyPaid: string
  balanceAsOfDate: string
}


/**
 * Complete state for the existing-agreement workflow.
 */
export interface ExistingAgreementState {
  agreement: ExistingAgreementForm
  financial: ExistingFinancialPosition

  /**
   * Dynamic fields belonging to the selected
   * revenue service.
   *
   * Example:
   *
   * {
   *   "service-uuid": {
   *     "agreement_number": "AGR-001",
   *     "agreement_date": "2026-09-20",
   *     "land_holding_number": "LH-1001",
   *     "land_area": "500",
   *     "lease_period": "20",
   *     "location": "Adama"
   *   }
   * }
   */
  serviceFieldValues: Record<
    string,
    Record<string, string>
  >
}

/**
 * Selected taxpayer information.
 */
export interface SelectedTaxpayer {
  id: string
  name: string
  tin: string
  type: string
}

/**
 * Selected revenue service information.
 */
export interface SelectedRevenueService {
  id: string
  name: string
  code: string
}
