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
// CASH RECONCILIATION RESOURCE
// ============================================================

export interface CashReconciliation {
  id: number;

  collector_id: string;
  collector?: CashReconciliationUser | null;

  period_start: string;
  period_end: string;

  /**
   * Monetary values are serialized by the Laravel resource
   * as decimal strings with two decimal places.
   *
   * Example: "12500.00"
   */
  expected_amount: string;
  actual_amount: string | null;
  difference_amount: string | null;

  difference_type: CashReconciliationDifferenceType;

  has_actual_amount: boolean;
  has_discrepancy: boolean;
  is_balanced: boolean;
  has_shortage: boolean;
  has_overage: boolean;

  collector_notes: string | null;

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
