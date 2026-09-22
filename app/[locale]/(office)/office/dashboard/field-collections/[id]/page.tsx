"use client"

import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Printer,
  User,
  Wallet,
  XCircle,
} from "lucide-react"

import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import {
  useDirectCollection,
} from "@/hooks/revenue/use-direct-collection"

import type {
  DirectCollectionInputSnapshot,
  DirectCollectionInvoice,
} from "@/types/revenue/direct-collection"

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatMoney(
  value: string | number | null | undefined,
  currency = "ETB",
): string {
  const amount = Number(value ?? 0)

  if (!Number.isFinite(amount)) {
    return `0.00 ${currency}`
  }

  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`
}

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDateTime(
  value: string | null | undefined,
): string {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function normalizeStatus(
  status: string | null | undefined,
): string {
  return String(status ?? "")
    .trim()
    .toUpperCase()
}

const STATUS_STYLES: Record<string, string> = {
  ISSUED:
    "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",

  PARTIALLY_PAID:
    "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",

  PAID:
    "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",

  CANCELLED:
    "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",

  DRAFT:
    "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200",
}

function getStatusClass(
  status: string | null | undefined,
): string {
  return (
    STATUS_STYLES[
      normalizeStatus(status)
    ] ?? STATUS_STYLES.DRAFT
  )
}

function getStatusLabel(
  status: string | null | undefined,
): string {
  switch (normalizeStatus(status)) {
    case "ISSUED":
      return "Payment Pending"

    case "PARTIALLY_PAID":
      return "Partially Paid"

    case "PAID":
      return "Paid"

    case "CANCELLED":
      return "Cancelled"

    case "DRAFT":
      return "Draft"

    default:
      return (
        normalizeStatus(status) ||
        "Unknown"
      )
  }
}

function getInputSnapshot(
  collection: DirectCollectionInvoice,
): Record<
  string,
  DirectCollectionInputSnapshot
> {
  return (
    collection.items?.[0]
      ?.input_snapshot ?? {}
  )
}

/*
|--------------------------------------------------------------------------
| Small Building Blocks
|--------------------------------------------------------------------------
*/

function Field({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p
        className={`mt-1.5 font-medium ${
          mono
            ? "break-all font-mono text-xs"
            : "text-sm"
        }`}
      >
        {value ?? "—"}
      </p>
    </div>
  )
}

function LedgerRow({
  label,
  value,
  emphasis,
  muted,
}: {
  label: string
  value: string
  emphasis?: boolean
  muted?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        emphasis
          ? "text-base font-semibold"
          : "text-sm"
      }`}
    >
      <span
        className={
          muted
            ? "text-muted-foreground"
            : ""
        }
      >
        {label}
      </span>

      <span
        className={`text-right ${
          muted
            ? "text-muted-foreground"
            : ""
        }`}
      >
        {value}
      </span>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function DirectCollectionDetailPage() {
  const router = useRouter()
  const params = useParams()

  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : undefined

  const {
    data: collection,
    isLoading,
    isError,
    error,
  } = useDirectCollection(id)

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const goBack = () => {
    router.push(
      "/office/dashboard/field-collections",
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />

          <span className="text-sm">
            Loading direct collection…
          </span>
        </div>
      </div>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (isError || !collection) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Button
          variant="ghost"
          onClick={goBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Direct Collections
        </Button>

        <Card>
          <CardContent className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 rounded-full bg-red-50 p-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>

            <h2 className="text-lg font-semibold">
              Direct collection not found
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "The requested direct collection could not be loaded."}
            </p>

            <Button
              variant="outline"
              className="mt-5"
              onClick={goBack}
            >
              Back to Direct Collections
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Invoice
  |--------------------------------------------------------------------------
  */

  const invoice = collection.invoice

  const firstItem =
    collection.items?.[0]

  const status =
    normalizeStatus(invoice.status)

  /*
   * The collection ID and invoice ID are normally
   * the same in the current architecture.
   *
   * Prefer the actual invoice ID whenever available.
   */
  const invoiceId =
    invoice.id || collection.id

  /*
  |--------------------------------------------------------------------------
  | Financial Values
  |--------------------------------------------------------------------------
  */

  const rawTotal =
    Number(invoice.total_amount ?? 0)

  const rawPaid =
    Number(invoice.paid_amount ?? 0)

  const rawReportedBalance =
    Number(invoice.balance_due ?? 0)

  const total =
    Number.isFinite(rawTotal)
      ? Math.max(0, rawTotal)
      : 0

  const paid =
    Number.isFinite(rawPaid)
      ? Math.max(0, rawPaid)
      : 0

  /*
   * Financial truth:
   *
   * outstanding balance =
   * total amount - paid amount
   */
  const calculatedBalance =
    Math.max(0, total - paid)

  /*
   * Prefer the backend balance when it is
   * consistent with the invoice totals.
   *
   * If the API currently returns 0 while
   * money is still outstanding, derive it
   * from total - paid.
   */
  const reportedBalance =
    Number.isFinite(rawReportedBalance)
      ? Math.max(0, rawReportedBalance)
      : 0

  const balanceDue =
    calculatedBalance === 0
      ? 0
      : reportedBalance > 0
        ? Math.min(
            reportedBalance,
            calculatedBalance,
          )
        : calculatedBalance

  const paidPct =
    total > 0
      ? Math.min(
          100,
          Math.round(
            (paid / total) * 100,
          ),
        )
      : 0

  /*
  |--------------------------------------------------------------------------
  | Business Rules
  |--------------------------------------------------------------------------
  */

  /**
   * Direct Collection can only be edited when:
   *
   * ISSUED
   * AND
   * no payment has been recorded.
   */
  const canEdit =
    status === "ISSUED" &&
    paid <= 0

  /**
   * Payment is available when:
   *
   * - outstanding balance exists
   * - invoice is not cancelled
   * - invoice is not draft
   */
  const canCollectPayment =
    balanceDue > 0 &&
    status !== "CANCELLED" &&
    status !== "DRAFT"

  /**
   * Invoice can be printed for all meaningful
   * invoice states.
   *
   * DRAFT invoices are excluded because they
   * are not yet official issued documents.
   */
  const canPrintInvoice =
    status !== "DRAFT"

  /*
  |--------------------------------------------------------------------------
  | Snapshot
  |--------------------------------------------------------------------------
  */

  const inputSnapshot =
    getInputSnapshot(collection)

  const snapshotEntries =
    Object.entries(inputSnapshot)

  /*
  |--------------------------------------------------------------------------
  | Service
  |--------------------------------------------------------------------------
  */

  const serviceName =
    firstItem?.service_name ??
    firstItem?.description ??
    "Revenue Service"

  /*
  |--------------------------------------------------------------------------
  | Actions
  |--------------------------------------------------------------------------
  */

  function handleEdit() {
    router.push(
      `/office/dashboard/field-collections/${collection!.id}/edit`,
    )
  }

  function handleCollectPayment() {
    if (!canCollectPayment) {
      return
    }

    router.push(
      `/office/dashboard/payments/create?invoice_id=${encodeURIComponent(
        invoiceId,
      )}`,
    )
  }

  function handlePrintInvoice() {
    if (!canPrintInvoice) {
      return
    }

    /*
     * For now, print the current invoice detail
     * page. This uses the browser's print dialog.
     *
     * Later this can be replaced with:
     *
     * /office/dashboard/invoices/{invoiceId}/print
     *
     * if you introduce a dedicated printable
     * municipal invoice template.
     */
    window.print()
  }

  /*
  |--------------------------------------------------------------------------
  | Status Icon
  |--------------------------------------------------------------------------
  */

  const statusIcon =
    status === "PAID" ? (
      <CheckCircle2 className="h-4 w-4" />
    ) : status === "CANCELLED" ? (
      <XCircle className="h-4 w-4" />
    ) : (
      <Clock className="h-4 w-4" />
    )

  /*
  |--------------------------------------------------------------------------
  | Page
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12 print:max-w-none print:space-y-4 print:pb-0">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0"
            onClick={goBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight">
                Invoice #
                {invoice.invoice_number}
              </h1>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                  invoice.status,
                )}`}
              >
                {statusIcon}

                {getStatusLabel(
                  invoice.status,
                )}
              </span>
            </div>

            <p className="mt-1.5 text-sm text-muted-foreground">
              Direct collection ·{" "}
              {serviceName}
            </p>

            <p className="mt-0.5 text-sm text-muted-foreground">
              {collection.taxpayer?.name ??
                "Unknown taxpayer"}
            </p>
          </div>
        </div>

        {/* ==================================================
            HEADER ACTIONS
        ================================================== */}

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-1">
          {canPrintInvoice && (
            <Button
              variant="outline"
              onClick={handlePrintInvoice}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Invoice
            </Button>
          )}

          {canCollectPayment && (
            <Button
              onClick={
                handleCollectPayment
              }
            >
              <Wallet className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}

          {canEdit && (
            <Button
              variant="outline"
              onClick={handleEdit}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Collection
            </Button>
          )}
        </div>
      </div>

      {/* ==================================================
          PRINT HEADER
      ================================================== */}

      <div className="hidden print:block">
        <div className="border-b pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                MUNICIPAL REVENUE INVOICE
              </h1>

              <p className="mt-1 text-sm">
                Direct Collection
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-semibold">
                #{invoice.invoice_number}
              </p>

              <p className="text-sm">
                {getStatusLabel(
                  invoice.status,
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          STATUS BANNER
      ================================================== */}

      {status === "ISSUED" &&
        balanceDue > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 print:hidden">
            <div className="mt-0.5 rounded-full bg-blue-100 p-1.5">
              <Wallet className="h-4 w-4 text-blue-700" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-blue-900">
                Payment is pending
              </p>

              <p className="mt-1 text-sm leading-5 text-blue-800">
                This invoice has not been paid yet.
                The outstanding amount is{" "}
                <span className="font-semibold">
                  {formatMoney(
                    balanceDue,
                    invoice.currency,
                  )}
                </span>
                .
              </p>
            </div>
          </div>
        )}

      {status === "PARTIALLY_PAID" &&
        balanceDue > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 print:hidden">
            <div className="mt-0.5 rounded-full bg-amber-100 p-1.5">
              <Clock className="h-4 w-4 text-amber-700" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900">
                Partial payment recorded
              </p>

              <p className="mt-1 text-sm leading-5 text-amber-800">
                A payment has already been recorded.
                The remaining balance is{" "}
                <span className="font-semibold">
                  {formatMoney(
                    balanceDue,
                    invoice.currency,
                  )}
                </span>
                .
              </p>
            </div>
          </div>
        )}

      {status === "PAID" && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 print:hidden">
          <div className="mt-0.5 rounded-full bg-green-100 p-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-700" />
          </div>

          <div>
            <p className="text-sm font-semibold text-green-900">
              Payment completed
            </p>

            <p className="mt-1 text-sm text-green-800">
              This invoice has been fully paid.
            </p>
          </div>
        </div>
      )}

      {status === "CANCELLED" && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 print:hidden">
          <div className="mt-0.5 rounded-full bg-red-100 p-1.5">
            <XCircle className="h-4 w-4 text-red-700" />
          </div>

          <div>
            <p className="text-sm font-semibold text-red-900">
              Invoice cancelled
            </p>

            <p className="mt-1 text-sm text-red-800">
              This invoice is no longer available
              for payment or editing.
            </p>
          </div>
        </div>
      )}

      {/* ==================================================
          MAIN LAYOUT
      ================================================== */}

      <div className="grid gap-6 lg:grid-cols-3 print:block">
        {/* =================================================
            LEFT CONTENT
        ================================================= */}

        <div className="space-y-6 lg:col-span-2">
          {/* =================================================
              TAXPAYER
          ================================================= */}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-muted-foreground print:hidden" />
                Taxpayer Information
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-5 sm:grid-cols-3">
                <Field
                  label="Name"
                  value={
                    collection.taxpayer
                      ?.name
                  }
                />

                <Field
                  label="Phone"
                  value={
                    collection.taxpayer
                      ?.phone ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground print:hidden" />

                        {
                          collection
                            .taxpayer
                            .phone
                        }
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />

                <Field
                  label="Email"
                  value={
                    collection.taxpayer
                      ?.email ? (
                      <span className="inline-flex items-center gap-1.5 break-all">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground print:hidden" />

                        {
                          collection
                            .taxpayer
                            .email
                        }
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* =================================================
              REVENUE SERVICE
          ================================================= */}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-muted-foreground print:hidden" />
                Revenue Service
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <Field
                  label="Service"
                  value={
                    firstItem?.service_name ??
                    serviceName
                  }
                />

                <Field
                  label="Quantity"
                  value={
                    firstItem?.quantity ??
                    "—"
                  }
                />

                <Field
                  label="Unit"
                  value={
                    firstItem?.unit ??
                    "—"
                  }
                />

                <Field
                  label="Unit Price"
                  value={
                    firstItem?.unit_price
                      ? formatMoney(
                          firstItem.unit_price,
                          invoice.currency,
                        )
                      : "—"
                  }
                />
              </div>

              <Separator />

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Description"
                  value={
                    firstItem?.description
                  }
                />

                <Field
                  label="Calculation Type"
                  value={
                    firstItem
                      ?.calculation_snapshot
                      ?.calculation_type ??
                    "—"
                  }
                />
              </div>

              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    Item Amount
                  </span>

                  <span className="text-base font-semibold">
                    {formatMoney(
                      firstItem?.amount,
                      invoice.currency,
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* =================================================
              COLLECTION DETAILS
          ================================================= */}

          {snapshotEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="h-4 w-4 text-muted-foreground print:hidden" />
                  Collection Details
                </CardTitle>
              </CardHeader>

              <CardContent>
                <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  {snapshotEntries.map(
                    ([fieldId, field]) => {
                      const display =
                        typeof field.value ===
                        "boolean"
                          ? field.value
                            ? "Yes"
                            : "No"
                          : field.value ===
                                null ||
                              field.value ===
                                ""
                            ? "—"
                            : String(
                                field.value,
                              )

                      return (
                        <div
                          key={fieldId}
                          className="min-w-0 border-b border-dashed pb-3"
                        >
                          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {field.field_label ??
                              field.field_code ??
                              fieldId}
                          </dt>

                          <dd className="mt-1.5 break-words text-sm font-medium">
                            {display}
                          </dd>
                        </div>
                      )
                    },
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* =================================================
              INVOICE INFORMATION
          ================================================= */}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-muted-foreground print:hidden" />
                Invoice Information
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Invoice Number"
                  value={
                    invoice.invoice_number
                  }
                />

                <Field
                  label="Currency"
                  value={
                    invoice.currency
                  }
                />

                <Field
                  label="Revenue Service ID"
                  value={
                    collection.revenue_service_id
                  }
                  mono
                />

                <Field
                  label="Invoice ID"
                  value={invoice.id}
                  mono
                />
              </div>

              <Separator />

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Due Date"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground print:hidden" />

                      {formatDate(
                        invoice.due_date,
                      )}
                    </span>
                  }
                />

                <Field
                  label="Created"
                  value={formatDateTime(
                    invoice.created_at,
                  )}
                />

                <Field
                  label="Issued"
                  value={formatDateTime(
                    invoice.issued_at,
                  )}
                />

                <Field
                  label="Last Updated"
                  value={formatDateTime(
                    invoice.updated_at,
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* =================================================
              EDIT INFORMATION
          ================================================= */}

          {canEdit && (
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 print:hidden">
              <div className="mt-0.5 rounded-full bg-blue-100 p-1.5">
                <Pencil className="h-3.5 w-3.5 text-blue-700" />
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Collection can still be edited
                </p>

                <p className="mt-1 text-sm leading-5 text-blue-800">
                  This invoice is issued and no payment
                  has been recorded. You can update the
                  collection information before payment.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* =================================================
            RIGHT FINANCIAL PANEL
        ================================================= */}

        <div className="lg:col-span-1 print:mt-6">
          <div className="space-y-4 lg:sticky lg:top-6 print:static">
            {/* =================================================
                PAYMENT SUMMARY
            ================================================= */}

            <Card className="overflow-hidden">
              <CardHeader className="border-b">
                <CardTitle className="text-base">
                  Payment Summary
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5 p-5">
                {/* BALANCE HERO */}

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Balance Due
                  </p>

                  <p
                    className={`mt-1 text-3xl font-bold tracking-tight ${
                      balanceDue > 0
                        ? "text-primary"
                        : "text-green-600"
                    }`}
                  >
                    {formatMoney(
                      balanceDue,
                      invoice.currency,
                    )}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    of{" "}
                    {formatMoney(
                      total,
                      invoice.currency,
                    )}{" "}
                    total
                  </p>
                </div>

                {/* PROGRESS */}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Payment progress
                    </span>

                    <span className="font-medium">
                      {paidPct}%
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all duration-500"
                      style={{
                        width: `${paidPct}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Paid
                    </span>

                    <span className="font-medium">
                      {formatMoney(
                        paid,
                        invoice.currency,
                      )}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* LEDGER */}

                <div className="space-y-3">
                  <LedgerRow
                    label="Subtotal"
                    value={formatMoney(
                      invoice.subtotal,
                      invoice.currency,
                    )}
                    muted
                  />

                  <LedgerRow
                    label="Discount"
                    value={`− ${formatMoney(
                      invoice.discount_amount,
                      invoice.currency,
                    )}`}
                    muted
                  />

                  <LedgerRow
                    label="Penalty"
                    value={`+ ${formatMoney(
                      invoice.penalty_amount,
                      invoice.currency,
                    )}`}
                    muted
                  />

                  <LedgerRow
                    label="Interest"
                    value={`+ ${formatMoney(
                      invoice.interest_amount,
                      invoice.currency,
                    )}`}
                    muted
                  />
                </div>

                <Separator />

                <LedgerRow
                  label="Total"
                  value={formatMoney(
                    total,
                    invoice.currency,
                  )}
                  emphasis
                />

                <LedgerRow
                  label="Paid"
                  value={formatMoney(
                    paid,
                    invoice.currency,
                  )}
                  muted
                />

                <div className="rounded-lg bg-muted/60 px-3.5 py-3">
                  <LedgerRow
                    label="Balance Due"
                    value={formatMoney(
                      balanceDue,
                      invoice.currency,
                    )}
                    emphasis
                  />
                </div>
              </CardContent>
            </Card>

            {/* =================================================
                PAYMENT ACTION
            ================================================= */}

            {canCollectPayment && (
              <Card className="border-primary/20 print:hidden">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Wallet className="size-5 text-primary" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold">
                        Payment Outstanding
                      </p>

                      <p className="mt-1 text-sm leading-5 text-muted-foreground">
                        Record a payment against this
                        invoice for the remaining balance.
                      </p>

                      <p className="mt-2 text-base font-semibold text-primary">
                        {formatMoney(
                          balanceDue,
                          invoice.currency,
                        )}
                      </p>
                    </div>
                  </div>

                  <Button
                    className="mt-4 w-full"
                    onClick={
                      handleCollectPayment
                    }
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Record Payment
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* =================================================
                PRINT INVOICE
            ================================================= */}

            {canPrintInvoice && (
              <Card className="print:hidden">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Printer className="size-5 text-muted-foreground" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold">
                        Invoice Document
                      </p>

                      <p className="mt-1 text-sm leading-5 text-muted-foreground">
                        Print the official invoice
                        document for the taxpayer.
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={
                      handlePrintInvoice
                    }
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Invoice
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* =================================================
                PAID STATE
            ================================================= */}

            {status === "PAID" && (
              <Card className="border-green-200 bg-green-50/50 print:hidden">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
                      <CheckCircle2 className="size-5 text-green-700" />
                    </div>

                    <div>
                      <p className="font-semibold text-green-900">
                        Fully Paid
                      </p>

                      <p className="mt-1 text-sm leading-5 text-green-800">
                        The full invoice amount has been
                        received.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* =================================================
                EDIT STATE
            ================================================= */}

            {canEdit && (
              <Card className="border-blue-200 bg-blue-50/50 print:hidden">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                      <Pencil className="size-4 text-blue-700" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-blue-900">
                        Editable
                      </p>

                      <p className="mt-1 text-sm leading-5 text-blue-800">
                        No payment has been recorded yet.
                        Collection details can still be
                        updated.
                      </p>

                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 border-blue-300 bg-background"
                        onClick={handleEdit}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit Collection
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}