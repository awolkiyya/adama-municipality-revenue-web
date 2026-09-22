"use client"

import {
  ArrowLeft,
  Building2,
  Download,
  FileText,
  Printer,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

// =========================================================
// TYPES
// =========================================================

type InvoiceStatus =
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED"

type InvoiceItem = {
  id: string
  lineNumber: number
  serviceCode: string
  serviceName: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  amount: number
}

type MockInvoice = {
  id: string
  invoiceNumber: string
  status: InvoiceStatus
  currency: string
  issuedAt: string
  dueDate: string | null
  createdAt: string

  taxpayer: {
    id: string
    name: string
    phone: string
    email: string
    address: string
  }

  administrativeUnit: {
    id: string
    name: string
    office: string
    address: string
    phone: string
    email: string
  }

  source: {
    type: string
    name: string
  }

  items: InvoiceItem[]

  subtotal: number
  discountAmount: number
  penaltyAmount: number
  interestAmount: number
  totalAmount: number
  paidAmount: number
  balanceDue: number

  notes: string | null

  issuedBy: {
    name: string
    role: string
  }
}

// =========================================================
// MOCK INVOICE
// =========================================================

const MOCK_INVOICE: MockInvoice = {
  id: "01a0c9cf-81ee-7356-9115-322f5efe026d",

  invoiceNumber: "INV-2026-000184",

  status: "ISSUED",

  currency: "ETB",

  issuedAt: "2026-09-22T09:30:00",

  dueDate: "2026-09-22",

  createdAt: "2026-09-22T09:25:00",

  taxpayer: {
    id: "citizen-000184",
    name: "Abebe Kebede",
    phone: "+251 911 234 567",
    email: "abebe@example.com",
    address: "Adama, Oromia, Ethiopia",
  },

  administrativeUnit: {
    id: "unit-adama-city",
    name: "Adama City Administration",
    office: "Revenue Office",
    address: "Adama, Oromia, Ethiopia",
    phone: "+251 22 111 2233",
    email: "revenue@adama.gov.et",
  },

  source: {
    type: "DIRECT_COLLECTION",
    name: "Field Collection",
  },

  items: [
    {
      id: "item-000184",
      lineNumber: 1,
      serviceCode: "TRN-001",
      serviceName: "Transport Service",
      description: "Municipal transport service fee",
      quantity: 2,
      unit: "Trip",
      unitPrice: 20,
      amount: 40,
    },
    {
      id: "item-000185",
      lineNumber: 2,
      serviceCode: "LIC-002",
      serviceName: "Business License Service",
      description: "Municipal business license service",
      quantity: 20,
      unit: "Unit",
      unitPrice: 200,
      amount: 4000,
    },
  ],

  subtotal: 4040,
  discountAmount: 0,
  penaltyAmount: 0,
  interestAmount: 0,
  totalAmount: 4040,
  paidAmount: 0,
  balanceDue: 4040,

  notes:
    "Payment should be made through the municipal revenue office.",

  issuedBy: {
    name: "Revenue Officer",
    role: "Revenue Collection Officer",
  },
}

// =========================================================
// HELPERS
// =========================================================

function formatCurrency(
  amount: number,
  currency = "ETB",
): string {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-ET", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date)
}

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-ET", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function getStatusLabel(
  status: InvoiceStatus,
): string {
  switch (status) {
    case "ISSUED":
      return "ISSUED"

    case "PARTIALLY_PAID":
      return "PARTIALLY PAID"

    case "PAID":
      return "PAID"

    case "CANCELLED":
      return "CANCELLED"

    default:
      return status
  }
}

// =========================================================
// PAGE
// =========================================================

export default function InvoicePrintPage() {
  const router = useRouter()
  const params = useParams()

  const invoiceId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : ""

  // =======================================================
  // MOCK DATA
  // =======================================================

  const invoice = MOCK_INVOICE

  // =======================================================
  // PRINT / PDF
  // =======================================================

  function handlePrint() {
    window.print()
  }

  function handleSaveAsPdf() {
    /*
     * Browser print dialog provides:
     *
     * Destination:
     *   Save to PDF
     *
     * The @media print CSS ensures that only
     * .invoice-paper is included in the PDF.
     */
    window.print()
  }

  function handleBack() {
    router.back()
  }

  // =======================================================
  // DERIVED FINANCIAL VALUES
  // =======================================================

  const calculatedSubtotal =
    invoice.items.reduce(
      (total, item) => total + item.amount,
      0,
    )

  const total = invoice.totalAmount

  const paid = invoice.paidAmount

  const balance = Math.max(
    total - paid,
    0,
  )

  // =======================================================
  // UI
  // =======================================================

  return (
    <div className="invoice-print-root">
      {/* ===================================================
          SCREEN TOOLBAR
          Hidden automatically during printing/PDF.
      =================================================== */}

      <div className="print-hidden sticky top-0 z-50 border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          {/* -----------------------------------------------
              LEFT SIDE
          ------------------------------------------------ */}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleBack}
              aria-label="Back"
            >
              <ArrowLeft className="size-4" />
            </Button>

            <div>
              <h1 className="text-lg font-semibold">
                Invoice Preview
              </h1>

              <p className="text-sm text-muted-foreground">
                {invoice.invoiceNumber}
              </p>
            </div>
          </div>

          {/* -----------------------------------------------
              ACTIONS
          ------------------------------------------------ */}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={handlePrint}
            >
              <Printer className="size-4" />
              Print Invoice
            </Button>

            <Button
              type="button"
              className="gap-2"
              onClick={handleSaveAsPdf}
            >
              <Download className="size-4" />
              Save as PDF
            </Button>
          </div>
        </div>
      </div>

      {/* ===================================================
          SCREEN PAGE CONTAINER
          This gray background will NOT appear in print/PDF.
      =================================================== */}

      <main className="invoice-wrapper min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-10">
        {/* =================================================
            ACTUAL PRINTABLE INVOICE
        ================================================= */}

        <article className="invoice-paper mx-auto w-full max-w-[210mm] bg-white px-8 py-10 shadow-xl ring-1 ring-slate-200 sm:px-12">
          {/* =================================================
              OFFICIAL HEADER
          ================================================= */}

          <header className="avoid-break">
            <div className="flex items-start justify-between gap-8">
              {/* -------------------------------------------
                  ADMINISTRATION
              -------------------------------------------- */}

              <div className="flex items-start gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center border-2 border-slate-800">
                  <Building2 className="size-8 text-slate-800" />
                </div>

                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    {invoice.administrativeUnit.name}
                  </h1>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {invoice.administrativeUnit.office}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {invoice.administrativeUnit.address}
                    <br />
                    Tel: {invoice.administrativeUnit.phone}
                    <br />
                    Email: {invoice.administrativeUnit.email}
                  </p>
                </div>
              </div>

              {/* -------------------------------------------
                  INVOICE TITLE
              -------------------------------------------- */}

              <div className="min-w-[180px] text-right">
                <div className="flex items-center justify-end gap-2">
                  <FileText className="size-5 text-slate-700" />

                  <h2 className="text-3xl font-bold tracking-[0.15em] text-slate-900">
                    INVOICE
                  </h2>
                </div>

                <p className="mt-3 font-mono text-sm font-bold text-slate-900">
                  {invoice.invoiceNumber}
                </p>

                <div className="mt-3 inline-flex border border-slate-400 px-3 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {getStatusLabel(invoice.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* -------------------------------------------
                DOCUMENT IDENTIFIER
            -------------------------------------------- */}

            <div className="mt-7 border-y-2 border-slate-900 py-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Municipal Revenue Invoice
                </p>

                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                  {invoice.source.name}
                </p>
              </div>
            </div>
          </header>

          {/* =================================================
              INVOICE INFORMATION
          ================================================= */}

          <section className="mt-7 avoid-break">
            <div className="grid grid-cols-2 gap-8">
              {/* -------------------------------------------
                  INVOICE DETAILS
              -------------------------------------------- */}

              <div>
                <h3 className="border-b border-slate-300 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Invoice Information
                </h3>

                <dl className="mt-3 space-y-2">
                  <div className="flex justify-between gap-4">
                    <dt className="text-xs text-slate-500">
                      Invoice Number
                    </dt>

                    <dd className="font-mono text-xs font-semibold text-slate-900">
                      {invoice.invoiceNumber}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-xs text-slate-500">
                      Invoice Date
                    </dt>

                    <dd className="text-xs font-medium text-slate-900">
                      {formatDate(invoice.issuedAt)}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-xs text-slate-500">
                      Due Date
                    </dt>

                    <dd className="text-xs font-medium text-slate-900">
                      {formatDate(invoice.dueDate)}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-xs text-slate-500">
                      Source
                    </dt>

                    <dd className="text-xs font-medium text-slate-900">
                      {invoice.source.type}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* -------------------------------------------
                  ISSUED BY
              -------------------------------------------- */}

              <div>
                <h3 className="border-b border-slate-300 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Issued By
                </h3>

                <dl className="mt-3 space-y-2">
                  <div className="flex justify-between gap-4">
                    <dt className="text-xs text-slate-500">
                      Officer
                    </dt>

                    <dd className="text-xs font-medium text-slate-900">
                      {invoice.issuedBy.name}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-xs text-slate-500">
                      Role
                    </dt>

                    <dd className="text-right text-xs font-medium text-slate-900">
                      {invoice.issuedBy.role}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-xs text-slate-500">
                      Issued At
                    </dt>

                    <dd className="text-xs font-medium text-slate-900">
                      {formatDateTime(invoice.issuedAt)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          {/* =================================================
              BILL TO
          ================================================= */}

          <section className="mt-7 avoid-break">
            <h3 className="border-b-2 border-slate-800 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
              Bill To
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-8">
              {/* -------------------------------------------
                  TAXPAYER
              -------------------------------------------- */}

              <div>
                <p className="text-base font-bold text-slate-900">
                  {invoice.taxpayer.name}
                </p>

                <p className="mt-2 text-xs text-slate-600">
                  Taxpayer / Citizen ID
                </p>

                <p className="font-mono text-xs font-semibold text-slate-900">
                  {invoice.taxpayer.id}
                </p>
              </div>

              {/* -------------------------------------------
                  CONTACT
              -------------------------------------------- */}

              <div>
                <div className="grid grid-cols-[70px_1fr] gap-y-1">
                  <span className="text-xs text-slate-500">
                    Phone
                  </span>

                  <span className="text-xs font-medium text-slate-900">
                    {invoice.taxpayer.phone}
                  </span>

                  <span className="text-xs text-slate-500">
                    Email
                  </span>

                  <span className="text-xs font-medium text-slate-900">
                    {invoice.taxpayer.email}
                  </span>

                  <span className="text-xs text-slate-500">
                    Address
                  </span>

                  <span className="text-xs font-medium text-slate-900">
                    {invoice.taxpayer.address}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              REVENUE SERVICES
          ================================================= */}

          <section className="mt-8">
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
              Revenue Services
            </h3>

            <div className="overflow-hidden border border-slate-800">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-100">
                    <th className="w-8 border-r border-slate-300 px-2 py-2 text-center font-bold">
                      #
                    </th>

                    <th className="border-r border-slate-300 px-3 py-2 text-left font-bold">
                      Service
                    </th>

                    <th className="border-r border-slate-300 px-3 py-2 text-left font-bold">
                      Description
                    </th>

                    <th className="w-14 border-r border-slate-300 px-2 py-2 text-right font-bold">
                      Qty
                    </th>

                    <th className="w-16 border-r border-slate-300 px-2 py-2 text-left font-bold">
                      Unit
                    </th>

                    <th className="w-24 border-r border-slate-300 px-2 py-2 text-right font-bold">
                      Unit Price
                    </th>

                    <th className="w-28 px-2 py-2 text-right font-bold">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {invoice.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-200 last:border-b-0"
                    >
                      <td className="border-r border-slate-200 px-2 py-3 text-center text-slate-500">
                        {item.lineNumber}
                      </td>

                      <td className="border-r border-slate-200 px-3 py-3 align-top">
                        <p className="font-semibold text-slate-900">
                          {item.serviceName}
                        </p>

                        <p className="mt-0.5 font-mono text-[9px] text-slate-500">
                          {item.serviceCode}
                        </p>
                      </td>

                      <td className="border-r border-slate-200 px-3 py-3 align-top text-slate-600">
                        {item.description}
                      </td>

                      <td className="border-r border-slate-200 px-2 py-3 text-right align-top text-slate-900">
                        {item.quantity}
                      </td>

                      <td className="border-r border-slate-200 px-2 py-3 align-top text-slate-600">
                        {item.unit}
                      </td>

                      <td className="border-r border-slate-200 px-2 py-3 text-right align-top text-slate-900">
                        {formatCurrency(
                          item.unitPrice,
                          invoice.currency,
                        )}
                      </td>

                      <td className="px-2 py-3 text-right align-top font-semibold text-slate-900">
                        {formatCurrency(
                          item.amount,
                          invoice.currency,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* =================================================
              FINANCIAL SUMMARY
          ================================================= */}

          <section className="mt-7 flex justify-end avoid-break">
            <div className="w-[290px]">
              <div className="space-y-2">
                {/* SUBTOTAL */}

                <div className="flex justify-between gap-6">
                  <span className="text-xs text-slate-500">
                    Subtotal
                  </span>

                  <span className="text-xs font-medium text-slate-900">
                    {formatCurrency(
                      calculatedSubtotal,
                      invoice.currency,
                    )}
                  </span>
                </div>

                {/* DISCOUNT */}

                <div className="flex justify-between gap-6">
                  <span className="text-xs text-slate-500">
                    Discount
                  </span>

                  <span className="text-xs font-medium text-slate-900">
                    {formatCurrency(
                      invoice.discountAmount,
                      invoice.currency,
                    )}
                  </span>
                </div>

                {/* PENALTY */}

                <div className="flex justify-between gap-6">
                  <span className="text-xs text-slate-500">
                    Penalty
                  </span>

                  <span className="text-xs font-medium text-slate-900">
                    {formatCurrency(
                      invoice.penaltyAmount,
                      invoice.currency,
                    )}
                  </span>
                </div>

                {/* INTEREST */}

                <div className="flex justify-between gap-6">
                  <span className="text-xs text-slate-500">
                    Interest
                  </span>

                  <span className="text-xs font-medium text-slate-900">
                    {formatCurrency(
                      invoice.interestAmount,
                      invoice.currency,
                    )}
                  </span>
                </div>
              </div>

              <div className="my-3 border-t border-slate-800" />

              {/* TOTAL */}

              <div className="flex justify-between gap-6">
                <span className="text-sm font-bold text-slate-900">
                  Total Amount
                </span>

                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(
                    total,
                    invoice.currency,
                  )}
                </span>
              </div>

              {/* PAID */}

              <div className="mt-2 flex justify-between gap-6">
                <span className="text-xs text-slate-500">
                  Amount Paid
                </span>

                <span className="text-xs font-medium text-slate-900">
                  {formatCurrency(
                    paid,
                    invoice.currency,
                  )}
                </span>
              </div>

              {/* BALANCE */}

              <div className="mt-3 border-2 border-slate-800 p-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-800">
                    Balance Due
                  </span>

                  <span className="text-base font-bold text-slate-900">
                    {formatCurrency(
                      balance,
                      invoice.currency,
                    )}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              PAYMENT INFORMATION
          ================================================= */}

          <section className="mt-7 avoid-break">
            <div className="border border-slate-300">
              <div className="border-b border-slate-300 bg-slate-50 px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                  Payment Information
                </p>
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-300">
                {/* STATUS */}

                <div className="p-3">
                  <p className="text-[9px] uppercase tracking-wide text-slate-500">
                    Invoice Status
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-900">
                    {getStatusLabel(invoice.status)}
                  </p>
                </div>

                {/* CURRENCY */}

                <div className="p-3">
                  <p className="text-[9px] uppercase tracking-wide text-slate-500">
                    Currency
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-900">
                    {invoice.currency}
                  </p>
                </div>

                {/* AMOUNT DUE */}

                <div className="p-3">
                  <p className="text-[9px] uppercase tracking-wide text-slate-500">
                    Amount Due
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-900">
                    {formatCurrency(
                      balance,
                      invoice.currency,
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              NOTES
          ================================================= */}

          {invoice.notes && (
            <section className="mt-6 avoid-break">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                Notes
              </h3>

              <p className="mt-2 border-l-2 border-slate-400 pl-3 text-xs leading-5 text-slate-600">
                {invoice.notes}
              </p>
            </section>
          )}

          {/* =================================================
              SIGNATURES
          ================================================= */}

          <section className="mt-10 avoid-break">
            <div className="grid grid-cols-2 gap-16">
              {/* REVENUE OFFICER */}

              <div>
                <div className="h-12 border-b border-slate-500" />

                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  Authorized Revenue Officer
                </p>

                <p className="mt-1 text-[10px] text-slate-500">
                  {invoice.issuedBy.name}
                </p>
              </div>

              {/* TAXPAYER */}

              <div>
                <div className="h-12 border-b border-slate-500" />

                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  Taxpayer / Authorized Representative
                </p>
              </div>
            </div>
          </section>

          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="mt-10 border-t-2 border-slate-800 pt-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-800">
              {invoice.administrativeUnit.name}
            </p>

            <p className="mt-1 text-[9px] text-slate-500">
              {invoice.administrativeUnit.office}
              {" • "}
              {invoice.administrativeUnit.address}
            </p>

            <p className="mt-2 text-[9px] text-slate-500">
              This is a computer-generated invoice. No signature
              is required unless otherwise specified by the
              authority.
            </p>

            <p className="mt-1 text-[8px] text-slate-400">
              Invoice ID:{" "}
              <span className="font-mono">
                {invoiceId || invoice.id}
              </span>
              {" • "}
              Generated:{" "}
              {formatDateTime(invoice.createdAt)}
            </p>
          </footer>
        </article>
      </main>
    </div>
  )
}