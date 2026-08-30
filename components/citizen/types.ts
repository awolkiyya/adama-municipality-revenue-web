import type { LucideIcon } from "lucide-react";

export type TabKey = "home" | "invoices" | "payments" | "notifications" | "profile";

/*
|--------------------------------------------------------------------------
| Invoice lifecycle — mirrors `invoices.status`
|--------------------------------------------------------------------------
|
| DRAFT → ISSUED → PARTIALLY_PAID → PAID
| ISSUED → OVERDUE
| DRAFT → CANCELLED
| ISSUED / OVERDUE → VOID
|
| DRAFT and CANCELLED are internal-only — a citizen never sees an invoice
| before it's issued, so they're excluded from this citizen-facing type.
|
*/
export type InvoiceStatus =
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "VOID";

export type PaymentStatus = "SUCCESS" | "FAILED" | "PENDING";
export type NotificationKind = "INFO" | "SUCCESS" | "WARNING";

export type Tone = "primary" | "success" | "danger" | "gold" | "muted";

export interface AdministrativeUnit {
  id: string;
  name: string;
  type: string;
}

export interface RegisteredSector {
  id: string;
  name: string;
}

export interface Citizen {
  id: string;
  citizen_uid: string;
  full_name: string;
  phone: string;
  national_id: string;
  address: string;
  gender: string;
  date_of_birth: string;
  administrative_unit: AdministrativeUnit;
  registered_sector: RegisteredSector;
  registered_at: string;
  source: string;
  external_id: string | null;
  is_active: boolean;
}

/*
|--------------------------------------------------------------------------
| Assessment summary — denormalized view of `assessments`, joined onto
| an invoice via `invoices.assessment_id`.
|--------------------------------------------------------------------------
|
| The full `assessments` table has a much larger lifecycle (DRAFT →
| PENDING_APPROVAL → APPROVED/REJECTED → CANCELLED), but a citizen-facing
| invoice only ever references an assessment that has already reached
| APPROVED — earlier states never produce an invoice, so they never
| reach this dashboard. This type intentionally carries only the fields
| a citizen needs to identify which assessment an invoice belongs to.
|
*/
export interface AssessmentSummary {
  id: string;
  assessment_number: string; // e.g. "ASM-2026-000041"
  assessment_date: string; // business date the assessment was created
}

/*
|--------------------------------------------------------------------------
| Invoice item — one row in `invoice_items`
|--------------------------------------------------------------------------
|
| Each item is one revenue service billed as part of the parent invoice's
| assessment (e.g. Land Tax + Waste Fee + Permit Fee, all under one
| assessment, all on one invoice).
|
*/
export interface InvoiceItem {
  id: string;
  invoice_id: string;
  line_number: number;
  description: string; // snapshot, e.g. "Land Tax 2026"
  quantity: number | null;
  unit: string | null; // e.g. "M2", "VEHICLE"
  unit_price: number | null;
  amount: number;
  discount_amount: number;
  penalty_amount: number;
  total_amount: number;
  currency: string;
}

/*
|--------------------------------------------------------------------------
| Invoice — one row in `invoices`, always for one assessment (or one
| direct collection), containing 1..n invoice_items.
|--------------------------------------------------------------------------
|
| Invoice-level amounts (subtotal, total_amount, etc.) are the sum of
| its items — they are backend-authoritative, never recalculated
| client-side.
|
| subtotal
| - discount_amount
| + penalty_amount
| -----------------
| total_amount
| - paid_amount
| -----------------
| balance_due
|
| There is no `title` field on the real `invoices` table — an invoice
| bundles multiple unrelated services, so it has no single name. Any
| display heading is derived from `items` at render time instead
| (see getInvoiceDisplayTitle in utils.ts).
|
*/
export interface Invoice {
  id: string;
  invoice_number: string;

  /*
  | Present when this invoice's source_type is ASSESSMENT.
  | Null when source_type is DIRECT_COLLECTION — the invoices table
  | allows assessment_id to be nullable for exactly this case.
  */
  assessment: AssessmentSummary | null;

  status: InvoiceStatus;
  currency: string; // ISO 4217, e.g. "ETB"

  subtotal: number;
  discount_amount: number;
  penalty_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;

  issued_at: string;
  due_date: string | null;
  paid_at: string | null;

  items: InvoiceItem[];
}

export interface Payment {
  id: string;
  transaction_number: string;
  title: string;
  method: string;
  amount: number;
  status: PaymentStatus;
  paid_at: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  kind: NotificationKind;
  unread: boolean;
}

export interface NavItem {
  key: TabKey;
  label: string;
  short: string;
  icon: LucideIcon;
}

export interface PageMeta {
  title: string;
  sub: string;
}