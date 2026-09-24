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

  notes: "Payment should be made through the municipal revenue office.",

  issuedBy: {
    name: "Revenue Officer",
    role: "Revenue Collection Officer",
  },
}

// =========================================================
// HELPERS
// =========================================================

function formatCurrency(amount: number, currency = "ETB"): string {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-ET", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date)
}

function formatDateTime(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-ET", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function getStatusLabel(status: InvoiceStatus): string {
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

  const invoice = MOCK_INVOICE

  function handlePrint() {
    window.print()
  }

  function handleBack() {
    router.back()
  }

  const calculatedSubtotal = invoice.items.reduce(
    (total, item) => total + item.amount,
    0,
  )

  const total = invoice.totalAmount
  const paid = invoice.paidAmount
  const balance = Math.max(total - paid, 0)

  return (
    <div className="invoice-print-root">
      {/* ===================================================
          PRINT ISOLATION + A4 PAGE RULES
          This is the part that makes printing behave like a
          real document instead of "screenshot the webpage":
          - @page fixes the physical paper size/margins
          - the print media query hides every pixel of the
            app chrome and reveals ONLY .invoice-paper
      =================================================== */}
      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            height: auto !important;
          }

          /* Hide literally everything by default... */
          body * {
            visibility: hidden;
          }

          /* ...then reveal only the invoice sheet and its children */
          .invoice-paper,
          .invoice-paper * {
            visibility: visible;
          }

          .print-hidden {
            display: none !important;
          }

          .invoice-wrapper {
            all: unset;
          }

          .invoice-paper {
            position: absolute;
            top: 0;
            left: 0;
            margin: 0 !important;
            width: 210mm;
            min-height: 297mm;
            max-width: none;
            padding: 14mm 16mm !important;
            box-shadow: none !important;
            border: none !important;
          }

          .avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          table {
            break-inside: auto;
          }

          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* ===================================================
          SCREEN TOOLBAR — never printed
      =================================================== */}

      <div className="print-hidden sticky top-0 z-50 border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
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
              <h1 className="text-lg font-semibold">Invoice Preview</h1>
              <p className="text-sm text-muted-foreground">
                {invoice.invoiceNumber}
              </p>
            </div>
          </div>

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

            <Button type="button" className="gap-2" onClick={handlePrint}>
              <Download className="size-4" />
              Save as PDF
            </Button>
          </div>
        </div>
      </div>

      {/* ===================================================
          SCREEN CANVAS — gray backdrop, never printed itself
      =================================================== */}

      <main className="invoice-wrapper min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-10 print:min-h-0 print:bg-transparent print:p-0">
        {/* One A4 sheet on larger screens; on phones it's a normal
            scrolling card that grows with content instead of forcing
            297mm of height into a narrow viewport. Print rules above
            override all of this back to exact A4. */}
        <article className="invoice-paper mx-auto flex w-full max-w-[210mm] min-h-0 flex-col bg-white px-4 py-6 text-[12px] shadow-xl ring-1 ring-slate-200 sm:min-h-[297mm] sm:px-10 sm:py-9 sm:text-[13px]">
          {/* ===============================================
              HEADER
          =============================================== */}

          <header className="avoid-break">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="flex items-start gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center border-2 border-slate-800">
                  <Building2 className="size-6 text-slate-800" />
                </div>

                <div>
                  <h1 className="text-base font-bold leading-tight tracking-tight text-slate-900 sm:text-lg">
                    {invoice.administrativeUnit.name}
                  </h1>
                  <p className="text-xs font-semibold text-slate-700">
                    {invoice.administrativeUnit.office}
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    {invoice.administrativeUnit.address} &middot; Tel:{" "}
                    {invoice.administrativeUnit.phone}
                  </p>
                </div>
              </div>

              <div className="min-w-[170px] text-left sm:text-right">
                <div className="flex items-center gap-2 sm:justify-end">
                  <FileText className="size-4 text-slate-700" />
                  <h2 className="text-xl font-bold tracking-[0.14em] text-slate-900 sm:text-2xl">
                    INVOICE
                  </h2>
                </div>
                <p className="mt-1 font-mono text-xs font-bold text-slate-900">
                  {invoice.invoiceNumber}
                </p>
                <div className="mt-2 inline-flex border border-slate-400 px-2 py-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider">
                    {getStatusLabel(invoice.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-y-2 border-slate-900 py-1.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                Municipal Revenue Invoice
              </p>
              <p className="text-[9px] font-medium uppercase tracking-wider text-slate-600">
                {invoice.source.name}
              </p>
            </div>
          </header>

          {/* ===============================================
              INVOICE INFO + BILL TO — merged into one compact
              three-column strip instead of two stacked sections
          =============================================== */}

          <section className="avoid-break mt-4 grid grid-cols-1 gap-4 border-b border-slate-200 pb-4 sm:grid-cols-3 sm:gap-6">
            <div>
              <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Bill To
              </h3>
              <p className="mt-1.5 text-sm font-bold text-slate-900">
                {invoice.taxpayer.name}
              </p>
              <p className="text-[10px] text-slate-500">
                ID: <span className="font-mono">{invoice.taxpayer.id}</span>
              </p>
              <p className="mt-1 text-[10px] leading-4 text-slate-600">
                {invoice.taxpayer.phone}
                <br />
                {invoice.taxpayer.email}
                <br />
                {invoice.taxpayer.address}
              </p>
            </div>

            <div>
              <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Invoice Details
              </h3>
              <dl className="mt-1.5 space-y-1">
                <div className="flex justify-between gap-3">
                  <dt className="text-[10px] text-slate-500">Date</dt>
                  <dd className="text-[10px] font-medium text-slate-900">
                    {formatDate(invoice.issuedAt)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[10px] text-slate-500">Due</dt>
                  <dd className="text-[10px] font-medium text-slate-900">
                    {formatDate(invoice.dueDate)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[10px] text-slate-500">Source</dt>
                  <dd className="text-[10px] font-medium text-slate-900">
                    {invoice.source.type}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Issued By
              </h3>
              <dl className="mt-1.5 space-y-1">
                <div className="flex justify-between gap-3">
                  <dt className="text-[10px] text-slate-500">Officer</dt>
                  <dd className="text-[10px] font-medium text-slate-900">
                    {invoice.issuedBy.name}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[10px] text-slate-500">Role</dt>
                  <dd className="text-right text-[10px] font-medium text-slate-900">
                    {invoice.issuedBy.role}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[10px] text-slate-500">Time</dt>
                  <dd className="text-[10px] font-medium text-slate-900">
                    {formatDateTime(invoice.issuedAt)}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* ===============================================
              SERVICES TABLE
          =============================================== */}

          <section className="mt-5">
            <h3 className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
              Revenue Services
            </h3>

            <div className="overflow-x-auto border border-slate-800 print:overflow-visible">
              <table className="w-full min-w-[560px] border-collapse text-[11px] print:min-w-0">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-100">
                    <th className="w-7 border-r border-slate-300 px-2 py-1.5 text-center font-bold">
                      #
                    </th>
                    <th className="border-r border-slate-300 px-3 py-1.5 text-left font-bold">
                      Service
                    </th>
                    <th className="border-r border-slate-300 px-3 py-1.5 text-left font-bold">
                      Description
                    </th>
                    <th className="w-12 border-r border-slate-300 px-2 py-1.5 text-right font-bold">
                      Qty
                    </th>
                    <th className="w-14 border-r border-slate-300 px-2 py-1.5 text-left font-bold">
                      Unit
                    </th>
                    <th className="w-20 border-r border-slate-300 px-2 py-1.5 text-right font-bold">
                      Unit Price
                    </th>
                    <th className="w-24 px-2 py-1.5 text-right font-bold">
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
                      <td className="border-r border-slate-200 px-2 py-2 text-center text-slate-500">
                        {item.lineNumber}
                      </td>
                      <td className="border-r border-slate-200 px-3 py-2 align-top">
                        <p className="font-semibold text-slate-900">
                          {item.serviceName}
                        </p>
                        <p className="font-mono text-[9px] text-slate-500">
                          {item.serviceCode}
                        </p>
                      </td>
                      <td className="border-r border-slate-200 px-3 py-2 align-top text-slate-600">
                        {item.description}
                      </td>
                      <td className="border-r border-slate-200 px-2 py-2 text-right align-top text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="border-r border-slate-200 px-2 py-2 align-top text-slate-600">
                        {item.unit}
                      </td>
                      <td className="border-r border-slate-200 px-2 py-2 text-right align-top text-slate-900">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="px-2 py-2 text-right align-top font-semibold text-slate-900">
                        {formatCurrency(item.amount, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ===============================================
              FINANCIAL SUMMARY
          =============================================== */}

          <section className="avoid-break mt-5 flex justify-center sm:justify-end">
            <div className="w-full max-w-[260px]">
              <div className="space-y-1.5">
                <div className="flex justify-between gap-6">
                  <span className="text-[10px] text-slate-500">Subtotal</span>
                  <span className="text-[10px] font-medium text-slate-900">
                    {formatCurrency(calculatedSubtotal, invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-[10px] text-slate-500">Discount</span>
                  <span className="text-[10px] font-medium text-slate-900">
                    {formatCurrency(invoice.discountAmount, invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-[10px] text-slate-500">Penalty</span>
                  <span className="text-[10px] font-medium text-slate-900">
                    {formatCurrency(invoice.penaltyAmount, invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-[10px] text-slate-500">Interest</span>
                  <span className="text-[10px] font-medium text-slate-900">
                    {formatCurrency(invoice.interestAmount, invoice.currency)}
                  </span>
                </div>
              </div>

              <div className="my-2.5 border-t border-slate-800" />

              <div className="flex justify-between gap-6">
                <span className="text-sm font-bold text-slate-900">
                  Total Amount
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(total, invoice.currency)}
                </span>
              </div>

              <div className="mt-1.5 flex justify-between gap-6">
                <span className="text-[10px] text-slate-500">Amount Paid</span>
                <span className="text-[10px] font-medium text-slate-900">
                  {formatCurrency(paid, invoice.currency)}
                </span>
              </div>

              <div className="mt-2.5 border-2 border-slate-800 p-2.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-800">
                    Balance Due
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(balance, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ===============================================
              NOTES
          =============================================== */}

          {invoice.notes && (
            <section className="avoid-break mt-4">
              <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
                Notes
              </h3>
              <p className="mt-1 border-l-2 border-slate-400 pl-2.5 text-[10px] leading-4 text-slate-600">
                {invoice.notes}
              </p>
            </section>
          )}

          {/* Spacer pushes signatures + footer to the bottom of the
              sheet so short invoices still fill the A4 page cleanly */}
          <div className="flex-1" />

          {/* ===============================================
              SIGNATURES
          =============================================== */}

          <section className="avoid-break mt-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-14">
              <div>
                <div className="h-10 border-b border-slate-500" />
                <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600">
                  Authorized Revenue Officer
                </p>
                <p className="text-[9px] text-slate-500">
                  {invoice.issuedBy.name}
                </p>
              </div>

              <div>
                <div className="h-10 border-b border-slate-500" />
                <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600">
                  Taxpayer / Authorized Representative
                </p>
              </div>
            </div>
          </section>

          {/* ===============================================
              FOOTER
          =============================================== */}

          <footer className="avoid-break mt-5 border-t-2 border-slate-800 pt-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-800">
              {invoice.administrativeUnit.name}
            </p>
            <p className="mt-0.5 text-[8px] text-slate-500">
              {invoice.administrativeUnit.office} &middot;{" "}
              {invoice.administrativeUnit.address}
            </p>
            <p className="mt-1.5 text-[8px] text-slate-500">
              This is a computer-generated invoice. No signature is required
              unless otherwise specified by the authority.
            </p>
            <p className="mt-0.5 text-[7px] text-slate-400">
              Invoice ID:{" "}
              <span className="font-mono">{invoiceId || invoice.id}</span>
              {" • "}Generated: {formatDateTime(invoice.createdAt)}
            </p>
          </footer>
        </article>
      </main>
    </div>
  )
}