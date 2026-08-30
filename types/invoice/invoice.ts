/*
|--------------------------------------------------------------------------
| INVOICE STATUS
|--------------------------------------------------------------------------
*/

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED"
  | "VOID";


/*
|--------------------------------------------------------------------------
| INVOICE SOURCE TYPE
|--------------------------------------------------------------------------
*/

export type InvoiceSourceType =
  | "ASSESSMENT"
  | "DIRECT_COLLECTION";


/*
|--------------------------------------------------------------------------
| INVOICE CITIZEN
|--------------------------------------------------------------------------
*/

export interface InvoiceCitizen {
  id: string;

  citizen_number: string | null;

  name: string | null;

  phone: string | null;

  email: string | null;
}


/*
|--------------------------------------------------------------------------
| INVOICE ASSESSMENT
|--------------------------------------------------------------------------
*/

export interface InvoiceAssessment {
  id: string;

  assessment_number: string;

  status: string;

  created_at: string;
}


/*
|--------------------------------------------------------------------------
| INVOICE ADMINISTRATIVE UNIT
|--------------------------------------------------------------------------
|
| Currently the API can return null.
|
*/

export interface InvoiceAdministrativeUnit {
  id: string;

  name: string;

  code?: string | null;

  level?: string | null;
}


/*
|--------------------------------------------------------------------------
| INVOICE FINANCIAL
|--------------------------------------------------------------------------
|
| Laravel decimal values are returned as strings.
|
| Example:
|
| "3500.0000"
|
*/

export interface InvoiceFinancial {
  subtotal: string;

  discount_amount: string;

  penalty_amount: string;

  total_amount: string;

  paid_amount: string;

  balance_due: string;

  currency: string;
}


/*
|--------------------------------------------------------------------------
| INVOICE DATES
|--------------------------------------------------------------------------
*/

export interface InvoiceDates {
  issued_at: string | null;

  due_date: string | null;

  paid_at: string | null;

  cancelled_at: string | null;

  voided_at: string | null;

  created_at: string;

  updated_at: string;
}


/*
|--------------------------------------------------------------------------
| INVOICE TARIFF
|--------------------------------------------------------------------------
*/

export interface InvoiceItemTariff {
  version_id: string | null;

  rule_id: string | null;
}


/*
|--------------------------------------------------------------------------
| INVOICE CALCULATION SNAPSHOT
|--------------------------------------------------------------------------
|
| Immutable calculation information stored when
| the invoice was generated.
|
*/

export interface InvoiceCalculationSnapshot {
  tariff_version_id: string | null;

  tariff_rule_id: string | null;

  calculation_type: string | null;

  calculated_at: string | null;

  base_field_id: string | null;

  measurement_unit_id: string | null;

  configured_amount: string | null;

  percentage: string | null;

  minimum_amount: string | null;

  maximum_amount: string | null;

  rounding_rule: string | null;

  formula: string | null;

  inputs: Record<string, unknown>;
}


/*
|--------------------------------------------------------------------------
| INVOICE INPUT SNAPSHOT
|--------------------------------------------------------------------------
|
| Exact values used by the tariff calculation.
|
| Example:
|
| {
|   "LAND_AREA": "105",
|   "PROPERTY_TYPE": "RESIDENTIAL",
|   "PROPERTY_DOCUMENT": {
|     "__file": "..."
|   }
| }
|
*/

export interface InvoiceInputSnapshot {
  [key: string]: unknown;
}


/*
|--------------------------------------------------------------------------
| INVOICE ITEM FINANCIAL
|--------------------------------------------------------------------------
*/

export interface InvoiceItemFinancial {
  amount: string;

  discount_amount: string;

  penalty_amount: string;

  total_amount: string;

  currency: string;
}


/*
|--------------------------------------------------------------------------
| INVOICE REVENUE SERVICE
|--------------------------------------------------------------------------
*/

export interface InvoiceRevenueService {
  id: string;

  name: string;

  code: string | null;
}


/*
|--------------------------------------------------------------------------
| INVOICE ITEM
|--------------------------------------------------------------------------
*/

export interface InvoiceItem {
  id: string;

  line_number: number;

  service: InvoiceRevenueService | null;

  description: string;

  quantity: number | null;

  unit: string | null;

  unit_price: string | null;

  financial: InvoiceItemFinancial;

  tariff: InvoiceItemTariff;

  calculation_snapshot:
    | InvoiceCalculationSnapshot
    | null;

  input_snapshot:
    | InvoiceInputSnapshot
    | null;
}


/*
|--------------------------------------------------------------------------
| INVOICE AUDIT USER
|--------------------------------------------------------------------------
*/

export interface InvoiceAuditUser {
  id: string;

  name: string;
}


/*
|--------------------------------------------------------------------------
| INVOICE AUDIT
|--------------------------------------------------------------------------
|
| Laravel resource returns:
|
| "audit": {
|   "created_by": {...},
|   "issued_by": {...}
| }
|
| If the relationships are not loaded, the values
| may effectively be empty/null depending on the
| resource serialization.
|
*/

export interface InvoiceAudit {
  created_by: InvoiceAuditUser | null;

  issued_by: InvoiceAuditUser | null;
}


/*
|--------------------------------------------------------------------------
| INVOICE
|--------------------------------------------------------------------------
*/

export interface Invoice {
  /*
  |--------------------------------------------------------------------------
  | IDENTIFICATION
  |--------------------------------------------------------------------------
  */

  id: string;

  invoice_number: string;

  source_type: InvoiceSourceType;

  status: InvoiceStatus;


  /*
  |--------------------------------------------------------------------------
  | BILLING
  |--------------------------------------------------------------------------
  */

  fiscal_year: number | null;

  currency: string;


  /*
  |--------------------------------------------------------------------------
  | RELATED DATA
  |--------------------------------------------------------------------------
  */

  citizen: InvoiceCitizen | null;

  assessment: InvoiceAssessment | null;

  administrative_unit:
    | InvoiceAdministrativeUnit
    | null;


  /*
  |--------------------------------------------------------------------------
  | FINANCIAL
  |--------------------------------------------------------------------------
  */

  financial: InvoiceFinancial;


  /*
  |--------------------------------------------------------------------------
  | DATES
  |--------------------------------------------------------------------------
  */

  dates: InvoiceDates;


  /*
  |--------------------------------------------------------------------------
  | AUDIT
  |--------------------------------------------------------------------------
  */

  audit: InvoiceAudit;


  /*
  |--------------------------------------------------------------------------
  | NOTES
  |--------------------------------------------------------------------------
  */

  notes: string | null;


  /*
  |--------------------------------------------------------------------------
  | SOURCE METADATA
  |--------------------------------------------------------------------------
  */

  source_metadata:
    | Record<string, unknown>
    | null;


  /*
  |--------------------------------------------------------------------------
  | INVOICE ITEMS
  |--------------------------------------------------------------------------
  */

  items: InvoiceItem[];
}


/*
|--------------------------------------------------------------------------
| INVOICE FILTERS
|--------------------------------------------------------------------------
*/

export interface InvoiceFilters {

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  |
  | Backend searches across:
  |
  | - invoice number
  | - citizen number
  | - citizen name
  | - assessment number
  |
  */

  search?: string;


  /*
  |--------------------------------------------------------------------------
  | ADMINISTRATIVE UNIT
  |--------------------------------------------------------------------------
  */

  administrative_unit_id?: string;


  /*
  |--------------------------------------------------------------------------
  | FISCAL YEAR
  |--------------------------------------------------------------------------
  */

  fiscal_year?: number | string;


  /*
  |--------------------------------------------------------------------------
  | SOURCE TYPE
  |--------------------------------------------------------------------------
  */

  source_type?:
    | InvoiceSourceType
    | "ALL";


  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  status?:
    | InvoiceStatus
    | InvoiceStatus[]
    | "ALL";


  /*
  |--------------------------------------------------------------------------
  | DUE DATE
  |--------------------------------------------------------------------------
  */

  due_date_from?: string;

  due_date_to?: string;


  /*
  |--------------------------------------------------------------------------
  | ISSUED DATE
  |--------------------------------------------------------------------------
  */

  issued_from?: string;

  issued_to?: string;


  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  page?: number;

  per_page?: number;
}