export type CollectionStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "COLLECTED"
  | "CANCELLED"

export type CollectionRecord = {
  id: string

  invoiceId: string
  invoiceNumber: string

  taxpayerId: string
  taxpayerName: string
  taxpayerPhone: string

  serviceId: string
  serviceName: string
  revenueDomain: string

  tariffCode: string
  tariffName: string
  tariffUnit: string
  tariffRate: number
  quantity: number

  amount: number
  paidAmount: number
  balance: number

  dueDate: string | null

  status: CollectionStatus

  createdAt: string | null
}

export type OptionalInvoiceFields = {
  id?: string | null
  invoice_number?: string | null
  status?: string | null

  total_amount?: string | number | null
  amount?: string | number | null

  paid_amount?: string | number | null
  amount_paid?: string | number | null

  balance_due?: string | number | null
  balance?: string | number | null

  due_date?: string | null
  created_at?: string | null
}

export type OptionalItemFields = {
  id?: string
  service_id?: string | null
  tariff_version_id?: string | null
  penalty_rule_id?: string | null
  interest_rule_id?: string | null

  service?: {
    id?: string | null
    name?: string | null
    revenue_domain?: string | null
    domain?: string | null
    unit?: string | null
  } | null

  service_name?: string | null

  tariff_code?: string | null
  tariff_name?: string | null
  tariff_rule_id?: string | null

  unit?: string | null
  unit_price?: string | number | null
  quantity?: string | number | null
  amount?: string | number | null
}

export type CollectionSummary = {
  pending: number
  partial: number
  collected: number
  outstanding: number
}

export type FieldCollectionFilters = {
  search: string
  status: string
  page: number
  perPage: number
}

export type FieldCollectionPagination = {
  current_page: number
  last_page: number
  total: number
  from: number | null
  to: number | null
}