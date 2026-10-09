// types/lease-amendment.ts

export type LeaseAmendmentType =
  | "NAME_TRANSFER"
  | "LAND_AREA_CHANGE"
  | "LAND_PARTIAL_TRANSFER"
  | "LAND_MERGE"
  | "OTHER";

export type LeaseAmendmentStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "APPLIED";

export type AmendmentValueType =
  | "STRING"
  | "INTEGER"
  | "DECIMAL"
  | "DATE"
  | "DATETIME"
  | "BOOLEAN"
  | "UUID"
  | "JSON";

export interface LeaseAmendmentChange {
  id: string;
  lease_amendment_id: string;
  field_name: string;
  value_type: AmendmentValueType;
  old_value: unknown;
  new_value: unknown;
  measurement_unit_id: string | null;
  reason: string | null;
  change_order: number;
  created_at: string;
  updated_at: string;
}

export interface LeaseAmendment {
  id: string;
  amendment_number: string;

  // The amendment must reference the original lease.
  lease_agreement_id: string;

  amendment_type: LeaseAmendmentType;
  effective_date: string;
  status: LeaseAmendmentStatus;

  previous_citizen_id: string | null;
  new_citizen_id: string | null;

  previous_land_area: string | number | null;
  new_land_area: string | number | null;
  measurement_unit_id: string | null;

  reason: string | null;
  document_path: string | null;
  document_number: string | null;

  submitted_at: string | null;

  decided_by: string | null;
  decision_notes: string | null;
  decided_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;

  applied_by: string | null;
  applied_at: string | null;

  previous_assessment_id: string | null;
  new_assessment_id: string | null;

  metadata: Record<string, unknown> | null;

  created_by: string | null;
  updated_by: string | null;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  changes?: LeaseAmendmentChange[];
}

export interface CreateLeaseAmendmentChangePayload {
  field_name: string;
  value_type: AmendmentValueType;
  old_value?: unknown;
  new_value?: unknown;
  measurement_unit_id?: string | null;
  reason?: string | null;
  change_order?: number;
}

export interface CreateLeaseAmendmentPayload {
  lease_agreement_id: string;
  amendment_type: LeaseAmendmentType;
  effective_date: string;

  previous_citizen_id?: string | null;
  new_citizen_id?: string | null;

  previous_land_area?: number | null;
  new_land_area?: number | null;
  measurement_unit_id?: string | null;

  reason?: string | null;
  document_number?: string | null;
  metadata?: Record<string, unknown> | null;

  changes?: CreateLeaseAmendmentChangePayload[];
}

export type UpdateLeaseAmendmentPayload =
  Partial<CreateLeaseAmendmentPayload>;

export interface LeaseAmendmentDecisionPayload {
  decision_notes?: string;
}

export interface RejectLeaseAmendmentPayload {
  decision_notes: string;
}

export interface ApplyLeaseAmendmentPayload {
  // Include only if your backend accepts an application-specific input.
  application_notes?: string;
}

export interface LeaseAmendmentFilters {
  page?: number;
  per_page?: number;
  search?: string;
  status?: LeaseAmendmentStatus | "";
  amendment_type?: LeaseAmendmentType | "";
  lease_agreement_id?: string;
  effective_date_from?: string;
  effective_date_to?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiMessageResponse {
  message: string;
  data?: LeaseAmendment;
}

export type LeaseAmendmentSummary = {
  total_amendments: number;
  pending_approval: number;
  approved: number;
  applied: number;
  rejected: number;
};
