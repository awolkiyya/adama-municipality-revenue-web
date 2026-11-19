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
 * Cash reconciliation statuses.
 *
 * Keep these values synchronized with the Laravel backend enum.
 */
export type CashReconciliationStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "RECONCILED"
  | "DISCREPANCY"
  | "RETURNED"
  | "CANCELLED";

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
 *
 * total_collected represents officially recognized collections:
 * - Completed non-cash payments.
 * - Completed cash payments belonging to reconciled collections.
 *
 * Cash with outstanding reconciliation or discrepancies is reported
 * separately and is not included in total_collected.
 */
export interface RevenueCollectionSummary {
  /**
   * Officially recognized collection amount.
   */
  total_collected: ReportNumericValue;

  /**
   * Number of officially recognized transactions.
   */
  collected_count: number;

  /**
   * Number of all payment transactions in the report.
   */
  total_transactions: number;

  /**
   * Completed payment count.
   */
  completed_count: number;

  /**
   * Completed non-cash payment amount.
   */
  non_cash_collected: ReportNumericValue;

  /**
   * Completed non-cash payment count.
   */
  non_cash_collected_count: number;

  /**
   * Completed cash payments belonging to reconciled collections.
   */
  reconciled_cash: ReportNumericValue;
  reconciled_cash_count: number;

  /**
   * Completed cash payments not yet reconciled.
   */
  unreconciled_cash: ReportNumericValue;
  unreconciled_cash_count: number;

  /**
   * Completed cash payments belonging to collections
   * with reconciliation discrepancies.
   */
  discrepancy_cash: ReportNumericValue;
  discrepancy_cash_count: number;

  /**
   * Pending payments.
   */
  pending_amount: ReportNumericValue;
  pending_count: number;

  /**
   * Processing payments.
   */
  processing_amount: ReportNumericValue;
  processing_count: number;

  /**
   * Failed payments.
   */
  failed_amount: ReportNumericValue;
  failed_count: number;

  /**
   * Reversed payments.
   */
  reversed_amount: ReportNumericValue;
  reversed_count: number;

  /**
   * Cancelled payments.
   */
  cancelled_count: number;

  /**
   * Expired payments.
   */
  expired_count: number;

  /**
   * Average officially recognized payment.
   */
  average_payment: ReportNumericValue;
}

/**
 * Collection trend grouped by day or month.
 *
 * Amounts and counts should follow the backend's official
 * collection eligibility rules.
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
 */
export interface RevenueCategoryOption {
  id: string;
  name: string;
}

/**
 * Service option for report filter dropdowns.
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
 */
export interface RevenueCollectionReportApiResponse {
  message?: string;
  data: RevenueCollectionReport;
}