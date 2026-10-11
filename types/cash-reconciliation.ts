
export type CashReconciliationStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "RECONCILED"
  | "DISCREPANCY"
  | "RETURNED"
  | "CANCELLED";

export type CashReconciliationReviewAction =
  | "RECONCILE"
  | "FLAG_DISCREPANCY"
  | "RETURN";

export interface CashReconciliationUser {
  id: string;
  name: string;
  email?: string | null;
}

export interface CashReconciliation {
  id: number;
  collector_id: string;
  collector?: CashReconciliationUser | null;

  period_start: string;
  period_end: string;

  expected_amount: string | number;
  actual_amount: string | number | null;
  difference_amount: string | number | null;

  collector_notes: string | null;
  submitted_at: string | null;

  reviewed_by: string | null;
  reviewer?: CashReconciliationUser | null;
  reviewed_at: string | null;
  review_notes: string | null;

  status: CashReconciliationStatus;

  created_at: string;
  updated_at: string;
}

export interface CashReconciliationFilters {
  search?: string;
  status?: CashReconciliationStatus | "";
  collector_id?: string;
  period_start?: string;
  period_end?: string;
  page?: number;
  per_page?: number;
}

export interface CreateCashReconciliationPayload {
  period_start: string;
  period_end: string;
  collector_notes?: string | null;
}

export interface UpdateCashReconciliationPayload {
  period_start?: string;
  period_end?: string;
  collector_notes?: string | null;
}

export interface SubmitCashReconciliationPayload {
  actual_amount: number;
  collector_notes?: string | null;
}

export interface ReviewCashReconciliationPayload {
  action: CashReconciliationReviewAction;
  review_notes?: string | null;
}

export interface CashReconciliationListResponse {
  data: CashReconciliation[];
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
  meta?: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
    path?: string;
  };
}

export interface CashReconciliationSingleResponse {
  data: CashReconciliation;
  message?: string;
}