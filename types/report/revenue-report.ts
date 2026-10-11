// types/report/revenue-report.ts

/**
 * Payment method values supported by the Revenue Collection Report API.
 */
export type RevenuePaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "ONLINE";

/**
 * Payment provider values supported by the API.
 */
export type RevenuePaymentProvider =
  | "CASH"
  | "BANK"
  | "CHAPA"
  | "TELEBIRR";

/**
 * Payment source values supported by the API.
 */
export type RevenuePaymentSource =
  | "ONLINE"
  | "AGENT_ASSISTED"
  | "OFFICE_RECORDED"
  | "FIELD_COLLECTION"
  | "SYSTEM";

/**
 * Payment statuses supported by the API.
 */
export type RevenuePaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "REVERSED";

/**
 * Revenue domains supported by the API.
 */
export type RevenueDomain =
  | "TAX"
  | "RENT"
  | "INVESTMENT"
  | "SERVICE"
  | "SALE"
  | "CAPITAL";

/**
 * Collection trend grouping.
 */
export type RevenueCollectionGroupBy = "day" | "month";

/**
 * Numeric values returned by the API.
 *
 * Laravel/database aggregate values may be serialized as strings,
 * for example: "317832.22".
 */
export type ReportNumericValue = number | string;

/**
 * Filters accepted by the Revenue Collection Report API.
 *
 * No pagination or sorting parameters are supported.
 */
export interface RevenueCollectionReportFilters {
  start_date?: string;
  end_date?: string;

  payment_method?: RevenuePaymentMethod;
  payment_provider?: RevenuePaymentProvider;
  payment_source?: RevenuePaymentSource;
  status?: RevenuePaymentStatus;

  revenue_domain?: RevenueDomain;
  revenue_category_id?: string;
  service_id?: string;

  administrative_unit_id?: string;
}

/**
 * Overall financial and transaction summary.
 */
export interface RevenueCollectionSummary {
  total_collected: ReportNumericValue;
  total_transactions: number;
  completed_count: number;

  pending_amount: ReportNumericValue;
  pending_count: number;

  processing_amount: ReportNumericValue;
  processing_count: number;

  failed_amount: ReportNumericValue;
  failed_count: number;

  reversed_amount: ReportNumericValue;
  reversed_count: number;

  cancelled_count: number;
  expired_count: number;

  average_payment: ReportNumericValue;
}

/**
 * Collection trend grouped by day or month.
 */
export interface DailyCollectionItem {
  period: string;
  completed_amount: ReportNumericValue;
  completed_count: number;
}

/**
 * Payment method or payment source aggregation.
 */
export interface RevenueCollectionGroupItem {
  label: string;
  completed_amount: ReportNumericValue;
  completed_count: number;
}

/**
 * Revenue grouped by revenue domain.
 */
export interface RevenueDomainCollectionItem {
  revenue_domain: RevenueDomain | string;
  completed_amount: ReportNumericValue;
  completed_count: number;
}

/**
 * Revenue grouped by administrative unit.
 *
 * A null ID represents an unassigned administrative unit.
 */
export interface AdministrativeUnitCollectionItem {
  administrative_unit_id: string | null;
  administrative_unit_name: string;
  completed_amount: ReportNumericValue;
  completed_count: number;
}

/**
 * Revenue category option for report filter dropdowns.
 *
 * Adjust optional fields to match your actual category API resource.
 */
export interface RevenueCategoryOption {
  id: string;
  name: string;
}

/**
 * Service option for report filter dropdowns.
 *
 * Adjust optional fields to match your actual service API resource.
 */
export interface RevenueServiceOption {
  id: string;
  name: string;
  revenue_category_id?: string | null;
}

/**
 * Complete aggregated report returned by the backend.
 */
export interface RevenueCollectionReport {
  summary: RevenueCollectionSummary;
  daily_collections: DailyCollectionItem[];
  payment_methods: RevenueCollectionGroupItem[];
  payment_sources: RevenueCollectionGroupItem[];
  revenue_domains: RevenueDomainCollectionItem[];
  administrative_units: AdministrativeUnitCollectionItem[];
}

/**
 * Standard Laravel API response envelope.
 *
 * Expected structure:
 * {
 *   message: "...",
 *   data: {
 *     summary: {...},
 *     daily_collections: [...],
 *     ...
 *   }
 * }
 */
export interface RevenueCollectionReportApiResponse {
  message?: string;
  data: RevenueCollectionReport;
}
