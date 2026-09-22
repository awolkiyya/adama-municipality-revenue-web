/*
|--------------------------------------------------------------------------
| Direct Collection Types
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Dynamic Field Value
|--------------------------------------------------------------------------
*/

export type DirectCollectionFieldValue =
  | string
  | number
  | boolean
  | null

/*
|--------------------------------------------------------------------------
| Dynamic Service Fields
|--------------------------------------------------------------------------
*/

export type DirectCollectionFields = Record<
  string,
  DirectCollectionFieldValue
>

/*
|--------------------------------------------------------------------------
| Calculate Request
|--------------------------------------------------------------------------
*/

export interface CalculateDirectCollectionPayload {
  taxpayer_id: string

  revenue_service_id: string

  /**
   * Keys must always be RevenueServiceField UUIDs.
   */
  fields?: DirectCollectionFields

  administrative_unit_id?: string | null
}

/*
|--------------------------------------------------------------------------
| Create Request
|--------------------------------------------------------------------------
*/

export interface StoreDirectCollectionPayload
  extends CalculateDirectCollectionPayload {
  /**
   * Client-side hint only.
   *
   * The backend recalculates and determines
   * the authoritative due date.
   */
  due_date?: string | null

  notes?: string | null

  metadata?: Record<string, unknown> | null
}

/*
|--------------------------------------------------------------------------
| Update Request
|--------------------------------------------------------------------------
|
| Only an unpaid ISSUED direct collection can be edited.
|
| The backend:
| - verifies invoice status
| - recalculates the amount
| - updates the existing invoice
| - updates the existing invoice item
| - preserves invoice number
|
|--------------------------------------------------------------------------
*/

export interface UpdateDirectCollectionPayload {
  taxpayer_id: string

  revenue_service_id: string

  /**
   * Keys must always be RevenueServiceField UUIDs.
   */
  fields?: DirectCollectionFields

  administrative_unit_id?: string | null

  notes?: string | null

  /**
   * Reason for changing the collection.
   */
  reason?: string | null
}

/*
|--------------------------------------------------------------------------
| Service
|--------------------------------------------------------------------------
*/

export interface DirectCollectionServiceSummary {
  id: string

  code: string | null

  name: string | null
}

/*
|--------------------------------------------------------------------------
| Taxpayer
|--------------------------------------------------------------------------
*/

export interface DirectCollectionTaxpayer {
  id: string

  name: string | null

  phone: string | null

  email: string | null
}

/*
|--------------------------------------------------------------------------
| Input Snapshot
|--------------------------------------------------------------------------
*/

export interface DirectCollectionInputSnapshot {
  field_id: string

  field_code: string | null

  field_label: string | null

  data_type: string | null

  input_type: string | null

  value: DirectCollectionFieldValue
}

/*
|--------------------------------------------------------------------------
| Calculation Snapshot
|--------------------------------------------------------------------------
*/

export interface DirectCollectionCalculationSnapshot {
  calculation_type: string | null

  amount: string

  currency: string

  tariff_version_id: string

  tariff_rule_id: string

  penalty_rule_id: string | null

  interest_rule_id: string | null

  due_date: string | null

  quantity: string | null

  unit: string | null

  unit_price: string | null

  minimum_amount: string | null

  maximum_amount: string | null

  rounding_rule: string | null

  formula: string | null

  inputs: DirectCollectionFields

  provider_metadata: Record<string, unknown> | null

  calculated_at: string
}

/*
|--------------------------------------------------------------------------
| Calculation Response
|--------------------------------------------------------------------------
*/

export interface DirectCollectionCalculation {
  taxpayer_id: string

  revenue_service_id: string

  service: DirectCollectionServiceSummary

  amount: string

  currency: string

  quantity: string | null

  unit: string | null

  unit_price: string | null

  tariff_version_id: string

  tariff_rule_id: string

  penalty_rule_id: string | null

  interest_rule_id: string | null

  due_date: string | null

  calculation_type: string | null

  input_snapshot: Record<
    string,
    DirectCollectionInputSnapshot
  >

  calculation_snapshot: DirectCollectionCalculationSnapshot
}

/*
|--------------------------------------------------------------------------
| Invoice Item
|--------------------------------------------------------------------------
*/

export interface DirectCollectionInvoiceItem {
  id: string

  line_number: number

  service_id: string | null

  service_name?: string | null

  description: string

  quantity: string | null

  unit: string | null

  unit_price: string | null

  amount: string

  tariff_version_id: string | null

  tariff_rule_id: string | null

  penalty_rule_id: string | null

  interest_rule_id: string | null

  input_snapshot:
    | Record<
        string,
        DirectCollectionInputSnapshot
      >
    | null

  calculation_snapshot:
    | DirectCollectionCalculationSnapshot
    | null

  created_at?: string | null

  updated_at?: string | null
}

/*
|--------------------------------------------------------------------------
| Invoice Summary
|--------------------------------------------------------------------------
*/

export interface DirectCollectionInvoiceSummary {
  subtotal: string

  discount_amount: string

  penalty_amount: string

  interest_amount: string

  total_amount: string

  paid_amount?: string

  balance_due?: string
}

/*
|--------------------------------------------------------------------------
| Invoice Data
|--------------------------------------------------------------------------
*/

export interface DirectCollectionInvoiceData {
  id: string

  invoice_number: string

  status: string

  currency: string

  subtotal: string

  discount_amount: string

  penalty_amount: string

  interest_amount: string

  total_amount: string

  amount: string

  paid_amount: string

  balance_due: string

  due_date: string | null

  issued_at: string | null

  created_at: string | null

  updated_at: string | null
}

/*
|--------------------------------------------------------------------------
| Direct Collection Resource
|--------------------------------------------------------------------------
*/

export interface DirectCollectionInvoice {
  id: string

  source_type: "DIRECT_COLLECTION"

  invoice: DirectCollectionInvoiceData

  taxpayer: DirectCollectionTaxpayer

  taxpayer_id: string

  revenue_service_id: string | null

  items: DirectCollectionInvoiceItem[]

  summary: DirectCollectionInvoiceSummary

  metadata: Record<string, unknown> | null
}

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

export interface DirectCollectionListParams {
  page?: number

  per_page?: number

  search?: string

  status?: string

  taxpayer_id?: string

  revenue_service_id?: string

  from_date?: string

  to_date?: string
}

export interface DirectCollectionPaginationMeta {
  current_page: number

  per_page: number

  last_page: number

  total: number

  from: number | null

  to: number | null
}

export interface DirectCollectionListResponse {
  data: DirectCollectionInvoice[]

  meta: DirectCollectionPaginationMeta
}

/*
|--------------------------------------------------------------------------
| API Response
|--------------------------------------------------------------------------
*/

export interface DirectCollectionApiResponse<T> {
  success: boolean

  message: string

  data: T
}

/*
|--------------------------------------------------------------------------
| API Error
|--------------------------------------------------------------------------
*/

export interface DirectCollectionApiError {
  message: string

  errors?: Record<
    string,
    string[]
  >
}
