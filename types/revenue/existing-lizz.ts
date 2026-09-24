/*
|--------------------------------------------------------------------------
| Existing LIZZ Types
|--------------------------------------------------------------------------
|
| Existing LIZZ uses the normal Assessment entity internally, but has
| additional historical financial information:
|
| computedAmount
| paidAmount
| remainingAmount
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

export type ExistingLizzStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "RETURNED"
  | "REJECTED";


/*
|--------------------------------------------------------------------------
| Source Type
|--------------------------------------------------------------------------
*/

export type AssessmentSourceType =
  | "NEW"
  | "EXISTING_LIZZ";


/*
|--------------------------------------------------------------------------
| Taxpayer
|--------------------------------------------------------------------------
*/

export interface ExistingLizzCitizen {
  id: string;
  name: string | null;
  tin: string | null;
}


/*
|--------------------------------------------------------------------------
| Administrative Unit
|--------------------------------------------------------------------------
*/

export interface ExistingLizzAdministrativeUnit {
  id: string;
  name: string | null;
}


/*
|--------------------------------------------------------------------------
| Dynamic Service Fields
|--------------------------------------------------------------------------
|
| Existing LIZZ service fields are dynamic because different revenue
| services may have different field definitions.
|
*/

export type ExistingLizzServiceFields = Record<
  string,
  string | number | boolean | null
>;


/*
|--------------------------------------------------------------------------
| Assessment Service
|--------------------------------------------------------------------------
*/

export interface ExistingLizzService {
  id: string;
  assessmentId: string;
  serviceId: string;
  serviceCode: string | null;

  computedAmount: number;
  paidAmount: number;
  remainingAmount: number;

  fields: ExistingLizzServiceFields;

  service?: {
    id: string;
    name: string | null;
    code: string | null;
  };

  paymentSchedules?: PaymentSchedule[];
}


/*
|--------------------------------------------------------------------------
| Payment Schedule
|--------------------------------------------------------------------------
*/

export type PaymentScheduleStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";


export interface PaymentSchedule {
  id: string;

  assessmentServiceId: string;

  installmentNumber: number;

  dueDate: string;

  amount: number;

  paidAmount: number;

  remainingAmount: number;

  status: PaymentScheduleStatus;

  notes?: string | null;

  createdAt?: string;
  updatedAt?: string;
}


/*
|--------------------------------------------------------------------------
| Existing LIZZ Assessment
|--------------------------------------------------------------------------
*/

export interface ExistingLizz {
  id: string;

  assessmentNumber: string;

  sourceType: "EXISTING_LIZZ";

  taxpayerId: string;

  assessmentDate: string | null;

  status: ExistingLizzStatus;

  notes: string | null;

  /*
  |--------------------------------------------------------------------------
  | Historical Financial Summary
  |--------------------------------------------------------------------------
  */

  computedAmount: number;

  paidAmount: number;

  remainingAmount: number;

  /*
  |--------------------------------------------------------------------------
  | Relationships
  |--------------------------------------------------------------------------
  */

  citizen?: ExistingLizzCitizen;

  administrativeUnit?: ExistingLizzAdministrativeUnit;

  services: ExistingLizzService[];

  /*
  |--------------------------------------------------------------------------
  | Audit
  |--------------------------------------------------------------------------
  */

  createdAt: string | null;

  updatedAt: string | null;
}


/*
|--------------------------------------------------------------------------
| Create Existing LIZZ Request
|--------------------------------------------------------------------------
|
| IMPORTANT:
| computedAmount and paidAmount are TOP-LEVEL fields.
|
| remainingAmount is NOT sent by the frontend.
| The backend calculates:
|
| computedAmount - paidAmount
|
|--------------------------------------------------------------------------
*/

export interface CreateExistingLizzPayload {
  taxpayerId: string;

  computedAmount: number;

  paidAmount: number;

  notes?: string | null;

  status?: "DRAFT" | "PENDING_APPROVAL";

  services: ExistingLizzServiceInput[];
}


/*
|--------------------------------------------------------------------------
| Existing LIZZ Service Input
|--------------------------------------------------------------------------
*/

export interface ExistingLizzServiceInput {
  serviceId: string;

  serviceCode: string;

  fields: ExistingLizzServiceFields;
}


/*
|--------------------------------------------------------------------------
| Update Existing LIZZ Request
|--------------------------------------------------------------------------
*/

export interface UpdateExistingLizzPayload {
  taxpayerId?: string;

  computedAmount?: number;

  paidAmount?: number;

  notes?: string | null;

  status?: "DRAFT" | "PENDING_APPROVAL";

  services?: ExistingLizzServiceInput[];
}


/*
|--------------------------------------------------------------------------
| Payment Schedule Input
|--------------------------------------------------------------------------
*/

export interface CreatePaymentSchedulePayload {
  installmentNumber: number;

  dueDate: string;

  amount: number;

  notes?: string | null;
}


/*
|--------------------------------------------------------------------------
| Update Payment Schedule Input
|--------------------------------------------------------------------------
*/

export interface UpdatePaymentSchedulePayload {
  dueDate?: string;

  amount?: number;

  status?: PaymentScheduleStatus;

  notes?: string | null;
}


/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

export interface ExistingLizzPagination {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}


/*
|--------------------------------------------------------------------------
| Existing LIZZ List Response
|--------------------------------------------------------------------------
*/

export interface ExistingLizzListResponse {
  data: ExistingLizz[];

  meta?: ExistingLizzPagination;
}


/*
|--------------------------------------------------------------------------
| Single Existing LIZZ Response
|--------------------------------------------------------------------------
*/

export interface ExistingLizzResponse {
  data: ExistingLizz;
}

