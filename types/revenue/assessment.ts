// =====================================================
// ASSESSMENT TYPES
// =====================================================
//
// IMPORTANT:
//
// Assessment is a DATA CAPTURE + WORKFLOW domain.
//
// The frontend:
// - captures raw data
// - validates completeness
// - uploads evidence
// - submits assessments
// - displays workflow state
//
// The frontend NEVER calculates:
// - tariff
// - price
// - amount
// - total
//
// Tariff resolution and calculation belong to the
// backend Decision Provider.
// =====================================================

import { AuthUser } from "../user";


// =====================================================
// FIELD TYPES
// =====================================================

export type FieldType =
  | "TEXT"
  | "NUMBER"
  | "DECIMAL"
  | "SELECT"
  | "RADIO"
  | "CHECKBOX"
  | "DATE"
  | "TEXTAREA"
  | "FILE"
  | "MULTI_FILE";


// =====================================================
// DATA TYPES
// =====================================================

export type FieldDataType =
  | "NUMBER"
  | "DECIMAL"
  | "TEXT"
  | "BOOLEAN"
  | "DATE";


// =====================================================
// FIELD OPTION
// =====================================================

export type FieldOption = {
  label: string;
  value: string;
};


// =====================================================
// REVENUE FIELD
// =====================================================

export type RevenueField = {
  id: string;

  key: string;

  label: string;

  type: FieldType;

  required?: boolean;

  placeholder?: string;

  description?: string;

  unit?: string;

  min?: number;

  max?: number;

  step?: number;

  options?: FieldOption[];

  accept?: string;

  multiple?: boolean;
};


// =====================================================
// REVENUE SERVICE
// =====================================================

export type RevenueService = {
  id: string;

  name: string;

  code: string | null;

  category: string;

  collectionMode: string;

  description: string | null;

  fields: RevenueField[];
};


// =====================================================
// ASSESSMENT STATUS
// =====================================================
//
// MUST MATCH the Laravel database enum.
//
// Current database:
//
// DRAFT
// PENDING_APPROVAL
// APPROVED
// REJECTED
// CANCELLED
//
// Do NOT keep RETURNED here unless you add RETURNED
// to the backend enum and workflow.
// =====================================================

export type AssessmentStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "RETURNED"
  | "CANCELLED";


// =====================================================
// ASSESSMENT SERVICE STATUS
// =====================================================
//
// This is different from AssessmentStatus.
//
// It represents processing state of an individual
// revenue service.
// =====================================================

export type AssessmentServiceStatus =
  | "CAPTURED"
  | "PROCESSING"
  | "COMPLETED"
  | "ERROR"
  | "CANCELLED";


// =====================================================
// ASSESSMENT DECISION
// =====================================================

export type AssessmentDecision =
  | "APPROVED"
  | "RETURNED";


// =====================================================
// RAW FORM VALUE
// =====================================================
//
// Values captured by the browser.
// =====================================================

export type AssessmentServiceFieldValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | string[]
  | File
  | File[];


// =====================================================
// FILE FORM REFERENCE
// =====================================================

export type AssessmentFileFormReference =
  | {
      __file: string;
    }
  | {
      __files: string[];
    };


// =====================================================
// FORM FIELD VALUE
// =====================================================

export type AssessmentFormFieldValue =
  | AssessmentServiceFieldValue
  | AssessmentFileFormReference;


// =====================================================
// API FIELD VALUE
// =====================================================
//
// API values can be normal scalar values OR structured
// file references.
// =====================================================

export type AssessmentApiFileValue = {
  __file: string;
};

export type AssessmentApiFieldValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | AssessmentApiFileValue;


// =====================================================
// ASSESSMENT FILE REFERENCE
// =====================================================

export type AssessmentFileReference = {
  id: string;

  name: string | null;

  mimeType: string | null;

  size: number | null;

  status:
    | "PENDING"
    | "READY"
    | "FAILED"
    | string;
};


// =====================================================
// ASSESSMENT SERVICE VALUE
// =====================================================
//
// Matches:
//
// assessment_service_values
// =====================================================

export type AssessmentServiceValue = {
  id: string;

  revenueServiceFieldId: string;

  fieldCode: string;

  fieldLabel: string | null;

  dataType: FieldDataType;

  inputType: FieldType;

  value: AssessmentApiFieldValue;

  displayValue: string | null;

  measurementUnitId: string | null;

  sortOrder: number;

  files: AssessmentFileReference[];

  createdAt: string;

  updatedAt: string;
};


// =====================================================
// ASSESSMENT SERVICE DEFINITION
// =====================================================
//
// The actual revenue service returned inside
// assessment.services[].service
// =====================================================

export type AssessmentServiceDefinition = {
  id: string;

  name: string;

  code: string | null;

  description: string | null;
};


// =====================================================
// ASSESSMENT SERVICE
// =====================================================
//
// Matches:
//
// assessment_services
// =====================================================

export type AssessmentService = {
  id: string;

  serviceId: string;

  serviceCode: string | null;

  serviceOrder: number;

  status: AssessmentServiceStatus;

  computedAmount: number | string | null;

  currencyCode: string | null;

  calculationMetadata: Record<
    string,
    unknown
  > | null;

  calculationError: string | null;

  calculatedAt: string | null;

  service: AssessmentServiceDefinition | null;

  values: AssessmentServiceValue[];
};


// =====================================================
// ASSESSMENT TAXPAYER / CITIZEN
// =====================================================
//
// API currently calls this "taxpayer", but the actual
// database entity is citizens.
// =====================================================

export type AssessmentTaxpayer = {
  id: string;

  citizenUid: string;

  fullName: string;

  nationalId: string;

  phone: string;

  email: string | null;

  gender:
    | "MALE"
    | "FEMALE"
    | "OTHER";

  dateOfBirth: string | null;

  address: string | null;

  isActive: boolean;
};


// =====================================================
// ASSESSMENT
// =====================================================
//
// This matches the actual API response.
// =====================================================

export type Assessment = {
  id: string;

  /**
   * Example:
   * ASM-2026-000004
   */
  assessmentNumber: string;

  /**
   * Citizen / taxpayer UUID.
   */
  citizenId: string;

  /**
   * Business assessment date.
   */
  assessmentDate: string | null;

  status: AssessmentStatus;

  notes: string | null;

  submittedAt: string | null;

  decision: AssessmentDecision | null;

  decisionNotes: string | null;

  decidedBy: string | null;

  decidedAt: string | null;

  approvedAt: string | null;

  rejectedAt: string | null;

  decisionMetadata: Record<
    string,
    unknown
  > | null;

  administrativeUnitId: string | null;

  taxpayer: AssessmentTaxpayer | null;

  services: AssessmentService[];

  createdBy: AuthUser | null;

  updatedBy: AuthUser | null;

  createdAt: string;

  updatedAt: string;
};


// =====================================================
// INITIAL ASSESSMENT
// =====================================================
//
// Used by edit/update forms.
// =====================================================

export type InitialAssessment = {
  id: string;

  citizenId: string;

  notes: string | null;

  status: AssessmentStatus;

  services: AssessmentService[];
};


// =====================================================
// CREATE ASSESSMENT SERVICE PAYLOAD
// =====================================================

export type AssessmentServicePayload = {
  serviceId: string;

  serviceCode?: string | null;

  fields: Record<
    string,
    AssessmentServiceFieldValue
  >;
};


// =====================================================
// CREATE FORM SERVICE PAYLOAD
// =====================================================

export type AssessmentFormServicePayload = {
  serviceId: string;

  serviceCode?: string | null;

  fields: Record<
    string,
    AssessmentFormFieldValue
  >;
};


// =====================================================
// CREATE ASSESSMENT PAYLOAD
// =====================================================

export type CreateAssessmentPayload = {
  citizenId: string;

  notes?: string | null;

  status:
    | "DRAFT"
    | "PENDING_APPROVAL";

  services: AssessmentServicePayload[];
};


// =====================================================
// UPDATE ASSESSMENT PAYLOAD
// =====================================================

export type UpdateAssessmentPayload = {
  citizenId?: string;

  notes?: string | null;

  status?: AssessmentStatus;

  services?: AssessmentServicePayload[];
};


// =====================================================
// ASSESSMENT FORM DATA
// =====================================================

export type AssessmentFormData = FormData;


// =====================================================
// ASSESSMENT FILTERS
// =====================================================

export type AssessmentFilters = {
  search?: string;

  citizenId?: string;

  status?: AssessmentStatus | "ALL";

  serviceId?: string;

  serviceCode?: string;

  page?: number;

  per_page?: number;

  date_from?: string;

  date_to?: string;

  sort_by?:
    | "created_at"
    | "assessment_date"
    | "assessment_number"
    | "status";

  sort_direction?:
    | "asc"
    | "desc";
};


// =====================================================
// ASSESSMENT SUMMARY
// =====================================================
//
// Matches:
//
// meta.summary
// =====================================================

export type AssessmentSummary = {
  total: number;

  draft: number;

  pending_approval: number;

  approved: number;

  returned: number;

  cancelled: number;
};


// =====================================================
// SUBMISSION RESULT
// =====================================================

export type SubmissionResult = {
  status:
    | "DRAFT_SAVED"
    | "SUBMITTED"
    | "UPDATED";

  assessmentNumber?: string;

  message: string;
};


// =====================================================
// WORKFLOW RESULT
// =====================================================

export type AssessmentWorkflowResult = {
  status: AssessmentStatus;

  assessmentNumber?: string | null;

  message: string;
};


// =====================================================
// APPROVE
// =====================================================

export type ApproveAssessmentPayload = {
  id: string;
};


// =====================================================
// REJECT
// =====================================================

export type RejectAssessmentPayload = {
  id: string;

  reason: string;
};


// =====================================================
// CANCEL
// =====================================================

export type CancelAssessmentPayload = {
  id: string;

  reason?: string;
};