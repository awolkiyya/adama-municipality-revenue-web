
// src/types/cash-reconciliation.types.ts

/**
 * Cash Reconciliation
 *
 * Shared frontend types for the cash reconciliation module.
 * These types mirror the Laravel API contract.
 */

// ============================================================
// ENUMS / UNION TYPES
// ============================================================

export type CashReconciliationStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "RECONCILED"
  | "DISCREPANCY"
  | "RETURNED"
  | "CANCELLED";

export type CashReconciliationDifferenceType =
  | "NOT_RECORDED"
  | "BALANCED"
  | "SHORTAGE"
  | "OVERAGE";

export type CashReconciliationReviewDecision =
  | "RECONCILED"
  | "DISCREPANCY"
  | "RETURNED";

export type SortDirection = "asc" | "desc";

export type CashReconciliationSortField =
  | "created_at"
  | "period_start"
  | "period_end"
  | "expected_amount"
  | "actual_amount"
  | "difference_amount"
  | "status"
  | "submitted_at"
  | "reviewed_at";

// ============================================================
// RELATED USER
// ============================================================

export interface CashReconciliationUser {
  id: string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
}

// ============================================================
// EVIDENCE FILE
// ============================================================

/**
 * Evidence file attached to a cash reconciliation.
 *
 * These fields match the Laravel CashReconciliationResource.
 */
export interface CashReconciliationEvidence {
  /**
   * File database ID (UUID).
   */
  id: string;

  /**
   * File UUID used by the shared file-management system.
   */
  uuid: string;

  original_name: string;
  mime_type: string;
  size: number | null;
  created_at: string | null;
}

// ============================================================
// CASH RECONCILIATION RESOURCE
// ============================================================

export interface CashReconciliation {
  id: string;

  collector_id: string;
  collector?: CashReconciliationUser | null;

  period_start: string;
  period_end: string;

  /**
   * Monetary values are serialized by Laravel
   * as decimal strings with two decimal places.
   *
   * Example: "12500.00"
   */
  expected_amount: string;
  actual_amount: string | null;
  difference_amount: string | null;

  difference_type: CashReconciliationDifferenceType;

  has_actual_amount?: boolean;
  has_discrepancy: boolean;
  is_balanced: boolean;
  has_shortage: boolean;
  has_overage: boolean;

  collector_notes: string | null;

  /**
   * Evidence files attached to this reconciliation.
   *
   * The API returns an empty array when no evidence exists.
   */
  evidence: CashReconciliationEvidence[];

  submitted_at: string | null;

  reviewed_by: string | null;
  reviewer?: CashReconciliationUser | null;
  reviewed_at: string | null;
  review_notes: string | null;

  status: CashReconciliationStatus;

  is_pending_review: boolean;
  is_reconciled: boolean;
  is_discrepancy: boolean;
  is_returned: boolean;
  is_editable: boolean;
  is_submitted: boolean;

  created_at: string;
  updated_at: string;
}

// ============================================================
// PAGINATION
// ============================================================

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginationMetaLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  links: PaginationMetaLink[];
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginatedCashReconciliations {
  data: CashReconciliation[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

// ============================================================
// API FILTERS
// ============================================================

export interface CashReconciliationFilters {
  status?: CashReconciliationStatus;
  collector_id?: string;

  period_start?: string;
  period_end?: string;

  from?: string;
  to?: string;

  page?: number;
  per_page?: number;

  sort_by?: CashReconciliationSortField;
  sort_direction?: SortDirection;
}

// ============================================================
// CREATE DRAFT
// ============================================================

export interface CreateCashReconciliationPayload {
  period_start: string;
  period_end: string;
  collector_notes?: string | null;
}

// ============================================================
// UPDATE DRAFT / RETURNED RECONCILIATION
// ============================================================

export interface UpdateCashReconciliationPayload {
  period_start?: string;
  period_end?: string;

  /**
   * Optional actual cash amount.
   * The backend remains authoritative for expected cash
   * and the calculated difference.
   */
  actual_amount?: string | number | null;

  collector_notes?: string | null;

  /**
   * New evidence files to upload.
   *
   * These are UploadedFile objects in the browser.
   * The API receives them as multipart/form-data.
   */
  evidence?: File[];

  /**
   * IDs of existing evidence files to detach.
   *
   * These are File database IDs, not the separate uuid field.
   */
  remove_evidence_ids?: string[];
}

// ============================================================
// SUBMIT FOR REVIEW
// ============================================================

export interface SubmitCashReconciliationPayload {
  actual_amount: string | number;
  collector_notes?: string | null;
}

// ============================================================
// REVIEW
// ============================================================

export interface ReviewCashReconciliationPayload {
  decision: CashReconciliationReviewDecision;
  review_notes?: string | null;
}

// ============================================================
// API ERROR
// ============================================================

export interface CashReconciliationApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// ============================================================
// GENERAL API RESPONSE
// ============================================================

export interface CashReconciliationResponse {
  data: CashReconciliation;
}

export interface CashReconciliationListResponse {
  data: CashReconciliation[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export type CashReconciliationSingleResponse = {
  data: CashReconciliation;
};



export type ExpectedCashSortBy =
  | "expected"
  | "reconciled"
  | "outstanding";

export type ExpectedCashSortDirection =
  | "asc"
  | "desc";

export interface ExpectedByCollectorFilters {
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: ExpectedCashSortBy;
  sort_dir?: ExpectedCashSortDirection;
  page?: number;
  per_page?: number;
}

export interface ExpectedCashCollector {
  collector_id: string;

  collector: {
    id: string;
    name: string;
    email: string | null;
  };

  payments_count: number;
  expected_total: string;

  reconciliations_count: number;
  reconciled_total: string;

  outstanding_total: string;
}

export interface ExpectedCashTotals {
  collectors: number;
  payments_count: number;
  expected_total: string;
  reconciliations_count: number;
  reconciled_total: string;
  outstanding_total: string;
}

export interface ExpectedCashPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// export interface ExpectedByCollectorResponse {
//   success: boolean;
//   message: string;
//   data: ExpectedCashCollector[];
//   errors: unknown | null;

//   meta: {
//     timestamp: string;
//     request_id: string;
//     version: string;

//     current_page: number;
//     last_page: number;
//     per_page: number;
//     total: number;

//     summary: ExpectedCashTotals;
//   };
// }


export interface NotifyCollectorPayload {
  collector_id: string;
  date_from?: string | null;
  date_to?: string | null;
}

export interface NotifyCollectorResponse {
  success: boolean;
  message: string;
  data: {
    collector_id: string;
    collector_name: string;
    date_from: string | null;
    date_to: string | null;
    payments_count: number;
    expected_total: string;
    reconciliations_count: number;
    reconciled_total: string;
    outstanding_total: string;
    notification_type: string;
  };
  errors: null;
}