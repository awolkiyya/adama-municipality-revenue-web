export type PenaltyDiscountRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "APPLIED"
  | "CANCELLED";

export type PenaltyDiscountDecision = "APPROVED" | "REJECTED";

/**
 * Invoice associated with a penalty discount request.
 */
export interface PenaltyDiscountRequestInvoice {
  id: string;
  invoice_number?: string | null;
  status?: string | null;
  subtotal?: number | string | null;
  penalty_amount?: number | string | null;
  penalty_discount_amount?: number | string | null;
  interest_amount?: number | string | null;
  total_amount?: number | string | null;
  paid_amount?: number | string | null;
  balance_due?: number | string | null;
  due_date?: string | null;
}

/**
 * User who created or decided a request.
 */
export interface PenaltyDiscountRequestUser {
  id: string;
  name: string;
}

/**
 * Penalty discount request returned by the API.
 */
export interface PenaltyDiscountRequest {
  id: string;
  invoice_id: string;
  invoice?: PenaltyDiscountRequestInvoice | null;

  citizen_id?: string | null;
  citizen?: {
    id: string;
    name: string;
  } | null;

  requested_amount: number | string;
  reason: string;
  status: PenaltyDiscountRequestStatus;

  supporting_file_name?: string | null;

  submitted_at?: string | null;
  decision?: PenaltyDiscountDecision | null;
  approved_amount?: number | string | null;
  decision_reason?: string | null;
  decided_at?: string | null;

  applied_to_invoice: boolean;
  applied_at?: string | null;

  created_by?: string | null;
  creator?: PenaltyDiscountRequestUser | null;

  decided_by?: string | null;
  decider?: PenaltyDiscountRequestUser | null;

  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Dashboard summary.
 */
export interface PenaltyDiscountRequestSummary {
  total_requests: number;
  pending_decision: number;
  approved_requests: number;
  applied_requests: number;
  approved_amount: number;
}

/**
 * List filters.
 */
export interface PenaltyDiscountRequestFilters {
  page?: number;
  per_page?: number;
  status?: PenaltyDiscountRequestStatus | "";
  decision?: PenaltyDiscountDecision | "";
  invoice_id?: string;
  citizen_id?: string;
  search?: string;
}

/**
 * Create a penalty discount request.
 *
 * supporting_file is optional. The service must serialize the payload
 * as FormData when sending a file to Laravel.
 */
export interface CreatePenaltyDiscountRequestPayload {
  invoice_id: string;
  requested_amount: number;
  reason: string;
  supporting_file?: File | null;
}

/**
 * Update an existing draft request.
 */
export interface UpdatePenaltyDiscountRequestPayload {
  invoice_id: string;
  requested_amount: number;
  reason: string;
  supporting_file?: File | null;
}

/**
 * Approve or reject a request.
 */
export interface DecidePenaltyDiscountRequestPayload {
  decision: PenaltyDiscountDecision;
  approved_amount?: number | null;
  decision_reason?: string | null;
}
