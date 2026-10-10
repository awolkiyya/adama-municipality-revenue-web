// types/lease-amendment.ts

import type { Assessment } from "../revenue/assessment";

/* -------------------------------------------------------------------------- */
/* Amendment types and statuses                                                */
/* -------------------------------------------------------------------------- */

export type AmendmentType =
  | "OWNERSHIP_TRANSFER"
  | "LAND_AREA_CHANGE"
  | "PARTIAL_TRANSFER"
  | "LAND_MERGE"
  | "OTHER"
  ;

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

/* -------------------------------------------------------------------------- */
/* Amendment change                                                            */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Supporting files                                                            */
/* -------------------------------------------------------------------------- */

export interface LeaseAmendmentFile {
  id: string;
  original_name?: string;
  filename?: string;
  mime_type?: string;
  size?: number;
  created_at?: string;
}

/* -------------------------------------------------------------------------- */
/* Lease amendment response                                                    */
/* -------------------------------------------------------------------------- */

export interface LeaseAmendment {
  id: string;
  amendment_number: string;

  previous_assessment_id: string;
  new_assessment_id: string | null;

  amendment_type: AmendmentType;
  status: LeaseAmendmentStatus;

  reason: string | null;
  other_amendment_description: string | null;

  submitted_at: string | null;

  decided_by: string | null;
  decision_notes: string | null;
  decided_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;

  applied_by: string | null;
  applied_at: string | null;

  metadata: Record<string, unknown> | null;

  created_by: string | null;
  updated_by: string | null;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  previous_assessment?: Assessment | null;
  new_assessment?: Assessment | null;

  changes?: LeaseAmendmentChange[];
  files?: LeaseAmendmentFile[];
}

/* -------------------------------------------------------------------------- */
/* Create and update payloads                                                  */
/* -------------------------------------------------------------------------- */

/**
 * This is the normalized API payload.
 *
 * Supporting documents should be sent as multipart/form-data when files
 * are included. The backend request/controller must validate those files.
 */
export interface CreateLeaseAmendmentPayload {
  previous_assessment_id: string;
  amendment_type: AmendmentType;

  new_taxpayer_id?: string | null;

  new_land_area?: number | null;
  transfer_area?: number | null;
  other_land_area?: number | null;

  other_amendment_description?: string | null;
  reason: string;

  supporting_documents?: File[];
}

export type UpdateLeaseAmendmentPayload =
  Partial<Omit<CreateLeaseAmendmentPayload, "previous_assessment_id">>;

export interface LeaseAmendmentDecisionPayload {
  decision_notes?: string;
}

export interface RejectLeaseAmendmentPayload {
  decision_notes: string;
}

export interface ApplyLeaseAmendmentPayload {
  // Only include if the backend explicitly accepts application notes.
  application_notes?: string;
}

/* -------------------------------------------------------------------------- */
/* Filters and API responses                                                   */
/* -------------------------------------------------------------------------- */

export interface LeaseAmendmentFilters {
  page?: number;
  per_page?: number;
  search?: string;
  status?: LeaseAmendmentStatus | "";
  amendment_type?: AmendmentType | "";
  previous_assessment_id?: string;
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

export interface LeaseAmendmentSummary {
  total_amendments: number;
  pending_approval: number;
  approved: number;
  applied: number;
  rejected: number;
}

/* -------------------------------------------------------------------------- */
/* Form types                                                                  */
/* -------------------------------------------------------------------------- */

export type LeaseAmendmentMode = "create" | "edit";

export type LeaseAmendmentFormValues = {
  amendmentType: AmendmentType | null;
  newTaxpayerId: string | null;
  newLandArea: string;
  transferArea: string;
  mergedLandArea: string;
  reason: string;
  otherAmendmentDescription: string;
  supportingDocuments: File[];
};

export type LeaseAmendmentFormProps = {
  mode: LeaseAmendmentMode;
  assessment: Assessment;
  initialValues?: Partial<LeaseAmendmentFormValues>;
  amendmentId?: string;
  onSubmit?: (
    values: LeaseAmendmentFormValues,
  ) => Promise<void> | void;
  onCancel?: () => void;
};

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Confirm these values against the actual field_code column in
 * assessment_service_values.
 */
export const LAND_AREA_FIELD_CODES = [
  "LAND_AREA",
  "land_area",
  "LAND_AREA_M2",
  "LAND_AREA_SQM",
] as const;

export const LAND_AREA_UNIT = "m²";
export const MIN_REASON_LENGTH = 5;

export const AMENDMENT_TYPE_LABELS: Record<AmendmentType, string> = {
  LAND_AREA_CHANGE: "Land Area Change",
  OWNERSHIP_TRANSFER: "Ownership Transfer",
  PARTIAL_TRANSFER: "Partial Land Transfer",
  LAND_MERGE: "Land Merge",
  OTHER:"Other"
};

export const AMENDMENT_TYPE_DESCRIPTIONS: Record<AmendmentType, string> = {
  LAND_AREA_CHANGE: "Correct or update the registered land area.",
  OWNERSHIP_TRANSFER: "Transfer ownership to another registered taxpayer.",
  PARTIAL_TRANSFER: "Transfer part of the land to another taxpayer.",
  LAND_MERGE: "Combine this land with another verified land parcel.",
  OTHER:""
};
