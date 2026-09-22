"use client"

import React, {
  useMemo,
  useState,
} from "react"

import { useRouter } from "next/navigation"

import { useQueryClient } from "@tanstack/react-query"

import {
  Download,
  FileText,
  MoreHorizontal,
  Pencil,
  Printer,
  Search,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Input } from "@/components/ui/input"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Badge } from "@/components/ui/badge"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  directCollectionKeys,
  useDirectCollections,
} from "@/hooks/revenue/use-direct-collection"

import type {
  DirectCollectionInvoice,
} from "@/types/revenue/direct-collection"

// =========================================================
// TYPES
// =========================================================

type CollectionStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "COLLECTED"
  | "CANCELLED"

type CollectionRecord = {
  id: string

  invoiceId: string
  invoiceNumber: string

  taxpayerId: string
  taxpayerName: string
  taxpayerPhone: string

  serviceId: string
  serviceName: string
  revenueDomain: string

  tariffCode: string
  tariffName: string
  tariffUnit: string
  tariffRate: number
  quantity: number

  amount: number
  paidAmount: number
  balance: number

  dueDate: string | null

  status: CollectionStatus

  createdAt: string | null
}

// =========================================================
// SAFE API EXTENSIONS
// =========================================================

type OptionalInvoiceFields = {
  id?: string | null

  invoice_number?: string | null
  status?: string | null

  total_amount?: string | number | null
  amount?: string | number | null

  paid_amount?: string | number | null
  amount_paid?: string | number | null

  balance_due?: string | number | null
  balance?: string | number | null

  due_date?: string | null
  created_at?: string | null
}

type OptionalItemFields = {
  service?: {
    id?: string | null
    name?: string | null
    revenue_domain?: string | null
    domain?: string | null
    unit?: string | null
  } | null

  service_name?: string | null

  tariff_code?: string | null
  tariff_name?: string | null

  tariff_rule_id?: string | null

  unit?: string | null

  unit_price?: string | number | null

  quantity?: string | number | null

  amount?: string | number | null
}

// =========================================================
// HELPERS
// =========================================================

function toNumber(
  value: unknown,
): number {
  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : 0
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const parsed =
      Number(value)

    return Number.isFinite(parsed)
      ? parsed
      : 0
  }

  return 0
}

function formatCurrency(
  amount: number,
): string {
  return new Intl.NumberFormat(
    "en-ET",
    {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(amount)
}

function formatDate(
  value:
    | string
    | null
    | undefined,
): string {
  if (!value) {
    return "—"
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    "en-ET",
    {
      year: "numeric",
      month: "short",
      day: "2-digit",
    },
  ).format(date)
}

// =========================================================
// STATUS
// =========================================================

function resolveCollectionStatus(
  collection: DirectCollectionInvoice,
): CollectionStatus {
  const invoice =
    collection.invoice

  const status =
    String(
      invoice?.status ?? "",
    ).toUpperCase()

  switch (status) {
    case "PAID":
    case "COLLECTED":
      return "COLLECTED"

    case "PARTIALLY_PAID":
      return "PARTIALLY_PAID"

    case "CANCELLED":
    case "CANCELED":
      return "CANCELLED"

    case "ISSUED":
    case "PENDING":
    case "DRAFT":
    default:
      return "PENDING"
  }
}

// =========================================================
// API STATUS FILTER
// =========================================================

function resolveApiStatus(
  status: string,
): string | undefined {
  switch (status) {
    case "PENDING":
      return "ISSUED"

    case "PARTIALLY_PAID":
      return "PARTIALLY_PAID"

    case "COLLECTED":
      return "PAID"

    case "CANCELLED":
      return "CANCELLED"

    default:
      return undefined
  }
}

// =========================================================
// RECORD HELPERS
// =========================================================

function getInvoiceFields(
  collection: DirectCollectionInvoice,
): OptionalInvoiceFields {
  return (
    collection.invoice as
      | OptionalInvoiceFields
      | null
      | undefined
  ) ?? {}
}

function getFirstItem(
  collection: DirectCollectionInvoice,
): OptionalItemFields & {
  id?: string
  service_id?: string | null
  tariff_version_id?: string | null
  penalty_rule_id?: string | null
  interest_rule_id?: string | null
} {
  const item =
    collection.items?.[0]

  if (!item) {
    return {}
  }

  return item as typeof item &
    OptionalItemFields & {
      id?: string
      service_id?: string | null
      tariff_version_id?: string | null
      penalty_rule_id?: string | null
      interest_rule_id?: string | null
    }
}

// =========================================================
// API → UI MAPPER
// =========================================================

function mapDirectCollection(
  collection: DirectCollectionInvoice,
): CollectionRecord {
  const invoice =
    getInvoiceFields(
      collection,
    )

  const item =
    getFirstItem(
      collection,
    )

  const service =
    item.service ?? null

  // -------------------------------------------------------
  // INVOICE ID
  // -------------------------------------------------------

  const invoiceId =
    invoice.id ??
    collection.id

  // -------------------------------------------------------
  // TOTAL AMOUNT
  // -------------------------------------------------------

  const amount =
    toNumber(
      invoice.total_amount ??
        invoice.amount ??
        item.amount ??
        0,
    )

  // -------------------------------------------------------
  // STATUS
  // -------------------------------------------------------

  const status =
    resolveCollectionStatus(
      collection,
    )

  // -------------------------------------------------------
  // PAID AMOUNT
  // -------------------------------------------------------

  let paidAmount =
    toNumber(
      invoice.paid_amount ??
        invoice.amount_paid ??
        0,
    )

  /*
   * Defensive fallback:
   *
   * If the invoice status is PAID but the API does not
   * expose paid_amount, consider the full invoice amount paid.
   */
  if (
    (
      invoice.status ??
      ""
    ).toUpperCase() ===
      "PAID" &&
    paidAmount === 0
  ) {
    paidAmount =
      amount
  }

  // -------------------------------------------------------
  // BALANCE
  // -------------------------------------------------------

  const explicitBalance =
    invoice.balance_due ??
    invoice.balance ??
    null

  /*
   * Always calculate the balance from:
   *
   * total amount - paid amount
   *
   * when the API reports zero/missing balance incorrectly.
   */
  const calculatedBalance =
    Math.max(
      amount -
        paidAmount,
      0,
    )

  const reportedBalance =
    explicitBalance !==
      null &&
    explicitBalance !==
      undefined
      ? Math.max(
          toNumber(
            explicitBalance,
          ),
          0,
        )
      : 0

  const balance =
    calculatedBalance === 0
      ? 0
      : reportedBalance > 0
        ? Math.min(
            reportedBalance,
            calculatedBalance,
          )
        : calculatedBalance

  // -------------------------------------------------------
  // SERVICE
  // -------------------------------------------------------

  const serviceId =
    item.service_id ??
    collection.revenue_service_id ??
    ""

  const serviceName =
    item.service_name ??
    service?.name ??
    "—"

  // -------------------------------------------------------
  // TARIFF
  // -------------------------------------------------------

  const tariffCode =
    item.tariff_code ??
    item.tariff_rule_id ??
    "—"

  const tariffName =
    item.tariff_name ??
    "—"

  // -------------------------------------------------------
  // TAXPAYER
  // -------------------------------------------------------

  const taxpayerId =
    collection.taxpayer_id ??
    collection.taxpayer?.id ??
    ""

  const taxpayerName =
    collection.taxpayer?.name ??
    "Unknown taxpayer"

  const taxpayerPhone =
    collection.taxpayer?.phone ??
    "—"

  // -------------------------------------------------------
  // RETURN
  // -------------------------------------------------------

  return {
    id:
      collection.id,

    invoiceId,

    invoiceNumber:
      invoice.invoice_number ??
      "—",

    taxpayerId,

    taxpayerName,

    taxpayerPhone,

    serviceId,

    serviceName,

    revenueDomain:
      service?.revenue_domain ??
      service?.domain ??
      "—",

    tariffCode,

    tariffName,

    tariffUnit:
      item.unit ??
      service?.unit ??
      "—",

    tariffRate:
      toNumber(
        item.unit_price,
      ),

    quantity:
      toNumber(
        item.quantity ??
          1,
      ),

    amount,

    paidAmount,

    balance,

    dueDate:
      invoice.due_date ??
      null,

    status,

    createdAt:
      invoice.created_at ??
      null,
  }
}

// =========================================================
// STATUS LABEL
// =========================================================

function getStatusLabel(
  status: CollectionStatus,
): string {
  switch (status) {
    case "PENDING":
      return "Pending"

    case "PARTIALLY_PAID":
      return "Partially Paid"

    case "COLLECTED":
      return "Collected"

    case "CANCELLED":
      return "Cancelled"

    default:
      return status
  }
}

// =========================================================
// STATUS CLASS
// =========================================================

function getStatusClassName(
  status: CollectionStatus,
): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-500/10 text-amber-700 border-amber-500/20"

    case "PARTIALLY_PAID":
      return "bg-blue-500/10 text-blue-700 border-blue-500/20"

    case "COLLECTED":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"

    case "CANCELLED":
      return "bg-red-500/10 text-red-700 border-red-500/20"

    default:
      return ""
  }
}

// =========================================================
// ERROR MESSAGE
// =========================================================

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message
  }

  const responseError =
    error as {
      response?: {
        data?: {
          message?: string
          errors?: Record<
            string,
            string[]
          >
        }
      }
    }

  const message =
    responseError
      ?.response
      ?.data
      ?.message

  if (message) {
    return message
  }

  const errors =
    responseError
      ?.response
      ?.data
      ?.errors

  if (errors) {
    const firstError =
      Object.values(
        errors,
      )[0]?.[0]

    if (firstError) {
      return firstError
    }
  }

  return "Unable to load field collections."
}

// =========================================================
// PAGE
// =========================================================

export default function FieldCollectionPage() {
  const router =
    useRouter()

  const queryClient =
    useQueryClient()

  // =======================================================
  // FILTERS
  // =======================================================

  const [
    search,
    setSearch,
  ] = useState("")

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL")

  const [
    page,
    setPage,
  ] = useState(1)

  const perPage = 20

  // =======================================================
  // API FILTERS
  // =======================================================

  const listParams =
    useMemo(
      () => {
        const apiStatus =
          resolveApiStatus(
            statusFilter,
          )

        return {
          page,

          per_page:
            perPage,

          ...(search.trim()
            ? {
                search:
                  search.trim(),
              }
            : {}),

          ...(apiStatus
            ? {
                status:
                  apiStatus,
              }
            : {}),
        }
      },
      [
        page,
        perPage,
        search,
        statusFilter,
      ],
    )

  // =======================================================
  // COLLECTION LIST
  // =======================================================

  const {
    data:
      collectionResponse,
    isLoading,
    isFetching,
    isError,
    error,
  } =
    useDirectCollections(
      listParams,
    )

  // =======================================================
  // MAP LIST
  // =======================================================

  const collections =
    useMemo(() => {
      return (
        collectionResponse?.data ??
        []
      ).map(
        mapDirectCollection,
      )
    }, [
      collectionResponse,
    ])

  // =======================================================
  // PAGINATION
  // =======================================================

  const pagination =
    collectionResponse?.meta

  // =======================================================
  // SUMMARY
  // =======================================================

  const summary =
    useMemo(() => {
      const pending =
        collections.filter(
          (item) =>
            item.status ===
            "PENDING",
        ).length

      const partial =
        collections.filter(
          (item) =>
            item.status ===
            "PARTIALLY_PAID",
        ).length

      const collected =
        collections.filter(
          (item) =>
            item.status ===
            "COLLECTED",
        ).length

      const outstanding =
        collections.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.balance,
          0,
        )

      return {
        pending,
        partial,
        collected,
        outstanding,
      }
    }, [
      collections,
    ])

  // =======================================================
  // START COLLECTION
  // =======================================================

  function handleStartCollection() {
    router.push(
      "/office/dashboard/field-collections/create",
    )
  }

  // =======================================================
  // UPDATE
  // =======================================================

  function handleUpdate(
    collection: CollectionRecord,
  ) {
    /*
     * Update is only available for pending/unpaid
     * direct collections.
     *
     * Backend also enforces this rule.
     */
    if (
      collection.status !==
        "PENDING" ||
      collection.paidAmount >
        0 ||
      collection.balance <=
        0
    ) {
      return
    }

    router.push(
      `/office/dashboard/field-collections/${encodeURIComponent(
        collection.id,
      )}/edit`,
    )
  }

  // =======================================================
  // VIEW DETAILS
  // =======================================================

  function handleViewDetails(
    collection: CollectionRecord,
  ) {
    router.push(
      `/office/dashboard/field-collections/${encodeURIComponent(
        collection.id,
      )}`,
    )
  }

  // =======================================================
  // PRINT INVOICE
  // =======================================================

  function handlePrintInvoice(
    collection: CollectionRecord,
  ) {
    if (
      !collection.invoiceId
    ) {
      return
    }

    /*
     * Draft invoices are not official invoices.
     * Field Collection records mapped as PENDING normally
     * represent ISSUED invoices in the backend.
     */
    if (
      collection.status ===
      "PENDING" &&
      collection.balance <=
        0
    ) {
      return
    }

    router.push(
      `/office/dashboard/invoices/${encodeURIComponent(
        collection.invoiceId,
      )}/print`,
    )
  }

  // =======================================================
  // DOWNLOAD INVOICE
  // =======================================================

  function handleDownloadInvoice(
    collection: CollectionRecord,
  ) {
    if (
      !collection.invoiceId
    ) {
      return
    }

    /*
     * This opens the printable invoice route with the
     * download flag.
     *
     * The print page should handle ?download=1.
     */
    window.open(
      `/office/dashboard/invoices/${encodeURIComponent(
        collection.invoiceId,
      )}/print?download=1`,
      "_blank",
      "noopener,noreferrer",
    )
  }

  // =======================================================
  // COLLECT PAYMENT
  // =======================================================

  function handleCollectPayment(
    collection: CollectionRecord,
  ) {
    if (
      collection.balance <=
      0
    ) {
      return
    }

    if (
      collection.status ===
      "CANCELLED"
    ) {
      return
    }

    if (
      !collection.invoiceId
    ) {
      return
    }

    /*
     * All invoice types use the same payment page.
     *
     * The payment method (cash, bank transfer,
     * mobile banking, etc.) is selected inside PaymentForm.
     */
    router.push(
      `/office/dashboard/payments/create?invoice_id=${encodeURIComponent(
        collection.invoiceId,
      )}`,
    )
  }

  // =======================================================
  // FILTER HANDLERS
  // =======================================================

  function handleSearchChange(
    value: string,
  ) {
    setSearch(value)
    setPage(1)
  }

  function handleStatusChange(
    value: string,
  ) {
    setStatusFilter(value)
    setPage(1)
  }

  // =======================================================
  // ERROR
  // =======================================================

  if (isError) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <Wallet className="size-5 text-primary" />
              </div>

              <h1 className="text-2xl font-semibold tracking-tight">
                Field Collection
              </h1>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage direct collections
              and their invoices.
            </p>
          </div>

          <Button
            className="gap-2"
            onClick={
              handleStartCollection
            }
          >
            <Wallet className="size-4" />
            Start Collection
          </Button>
        </div>

        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3">
            <FileText className="size-8 text-muted-foreground" />

            <p className="font-medium">
              Unable to load collections
            </p>

            <p className="max-w-md text-center text-sm text-muted-foreground">
              {getErrorMessage(
                error,
              )}
            </p>

            <Button
              variant="outline"
              onClick={() =>
                queryClient.invalidateQueries(
                  {
                    queryKey:
                      directCollectionKeys.all,
                  },
                )
              }
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // =======================================================
  // UI
  // =======================================================

  return (
    <div className="space-y-6 p-6">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="size-5 text-primary" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Field Collection
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage direct collections
            and their invoices.
          </p>
        </div>

        <Button
          className="gap-2"
          onClick={
            handleStartCollection
          }
        >
          <Wallet className="size-4" />
          Start Collection
        </Button>
      </div>

      {/* ===================================================
          SUMMARY
      =================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* PENDING */}

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Pending Collection
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {summary.pending}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  On this page
                </p>
              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Wallet className="size-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PARTIALLY PAID */}

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Partially Paid
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {summary.partial}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  On this page
                </p>
              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
                <FileText className="size-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* COLLECTED */}

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Collected
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {summary.collected}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  On this page
                </p>
              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <FileText className="size-4 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OUTSTANDING */}

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Outstanding
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {formatCurrency(
                    summary.outstanding,
                  )}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Current page
                </p>
              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="size-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===================================================
          COLLECTION QUEUE
      =================================================== */}

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base">
                Collection Queue
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Direct collection invoices
                available for payment.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isFetching &&
                !isLoading && (
                  <span className="text-xs text-muted-foreground">
                    Updating...
                  </span>
                )}

              <span className="text-sm text-muted-foreground">
                {pagination?.total ??
                  0}{" "}
                records
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* =================================================
              FILTERS
          ================================================= */}

          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={
                  search
                }
                onChange={(
                  event,
                ) =>
                  handleSearchChange(
                    event.target
                      .value,
                  )
                }
                placeholder="Search taxpayer, invoice or service..."
                className="pl-9"
              />
            </div>

            <Select
              value={
                statusFilter
              }
              onValueChange={
                handleStatusChange
              }
            >
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">
                  All statuses
                </SelectItem>

                <SelectItem value="PENDING">
                  Pending
                </SelectItem>

                <SelectItem value="PARTIALLY_PAID">
                  Partially paid
                </SelectItem>

                <SelectItem value="COLLECTED">
                  Collected
                </SelectItem>

                <SelectItem value="CANCELLED">
                  Cancelled
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Invoice
                  </TableHead>

                  <TableHead>
                    Taxpayer
                  </TableHead>

                  <TableHead>
                    Service / Tariff
                  </TableHead>

                  <TableHead className="text-right">
                    Amount
                  </TableHead>

                  <TableHead className="text-right">
                    Balance
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({
                    length: 5,
                  }).map(
                    (
                      _,
                      index,
                    ) => (
                      <TableRow
                        key={
                          index
                        }
                      >
                        <TableCell colSpan={7}>
                          <div className="h-12 animate-pulse rounded-md bg-muted" />
                        </TableCell>
                      </TableRow>
                    ),
                  )
                ) : collections.length ===
                  0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Search className="size-5 text-muted-foreground" />

                        <p className="text-sm font-medium">
                          No collections
                          found
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Try changing
                          your filters.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  collections.map(
                    (
                      collection,
                    ) => (
                      <TableRow
                        key={
                          collection.id
                        }
                      >
                        {/* INVOICE */}

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                              <FileText className="size-4 text-muted-foreground" />
                            </div>

                            <div>
                              <p className="font-medium">
                                {
                                  collection.invoiceNumber
                                }
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {formatDate(
                                  collection.createdAt,
                                )}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* TAXPAYER */}

                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {
                                collection.taxpayerName
                              }
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {
                                collection.taxpayerPhone
                              }
                            </p>
                          </div>
                        </TableCell>

                        {/* SERVICE / TARIFF */}

                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {
                                collection.serviceName
                              }
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="font-mono text-[10px]"
                              >
                                {
                                  collection.tariffCode
                                }
                              </Badge>

                              <span className="text-xs text-muted-foreground">
                                {
                                  collection.tariffName
                                }
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* AMOUNT */}

                        <TableCell className="text-right">
                          <span className="font-medium">
                            {formatCurrency(
                              collection.amount,
                            )}
                          </span>
                        </TableCell>

                        {/* BALANCE */}

                        <TableCell className="text-right">
                          <span
                            className={
                              collection.balance >
                              0
                                ? "font-semibold"
                                : "text-muted-foreground"
                            }
                          >
                            {formatCurrency(
                              collection.balance,
                            )}
                          </span>
                        </TableCell>

                        {/* STATUS */}

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusClassName(
                              collection.status,
                            )}
                          >
                            {getStatusLabel(
                              collection.status,
                            )}
                          </Badge>
                        </TableCell>

                        {/* ACTIONS */}

                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label="Collection actions"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="w-52"
                            >
                              {/* VIEW DETAILS */}

                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewDetails(
                                    collection,
                                  )
                                }
                              >
                                <FileText className="mr-2 size-4" />
                                View Details
                              </DropdownMenuItem>

                              {/* PRINT INVOICE */}

                              {(collection.status !==
                                "PENDING" ||
                                collection.balance >
                                  0) && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handlePrintInvoice(
                                      collection,
                                    )
                                  }
                                >
                                  <Printer className="mr-2 size-4" />
                                  Print Invoice
                                </DropdownMenuItem>
                              )}

                              {/* DOWNLOAD INVOICE */}

                              {(collection.status !==
                                "PENDING" ||
                                collection.balance >
                                  0) && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDownloadInvoice(
                                      collection,
                                    )
                                  }
                                >
                                  <Download className="mr-2 size-4" />
                                  Download Invoice
                                </DropdownMenuItem>
                              )}

                              {/* UPDATE */}

                              {collection.status ===
                                "PENDING" &&
                                collection.paidAmount <=
                                  0 &&
                                collection.balance >
                                  0 && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdate(
                                        collection,
                                      )
                                    }
                                  >
                                    <Pencil className="mr-2 size-4" />
                                    Update
                                  </DropdownMenuItem>
                                )}

                              {/* COLLECT PAYMENT */}

                              {collection.balance >
                                0 &&
                                collection.status !==
                                  "CANCELLED" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleCollectPayment(
                                        collection,
                                      )
                                    }
                                  >
                                    <Wallet className="mr-2 size-4" />
                                    Collect Payment
                                  </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ),
                  )
                )}
              </TableBody>
            </Table>
          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          {pagination &&
            pagination.last_page >
              1 && (
              <div className="flex items-center justify-between border-t p-4">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium">
                    {pagination.from ??
                      0}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {pagination.to ??
                      0}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">
                    {
                      pagination.total
                    }
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      page <= 1 ||
                      isFetching
                    }
                    onClick={() =>
                      setPage(
                        (
                          current,
                        ) =>
                          Math.max(
                            1,
                            current -
                              1,
                          ),
                      )
                    }
                  >
                    Previous
                  </Button>

                  <span className="px-2 text-sm">
                    Page{" "}
                    <span className="font-medium">
                      {
                        pagination.current_page
                      }
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {
                        pagination.last_page
                      }
                    </span>
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      page >=
                        pagination.last_page ||
                      isFetching
                    }
                    onClick={() =>
                      setPage(
                        (
                          current,
                        ) =>
                          Math.min(
                            pagination.last_page,
                            current +
                              1,
                          ),
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  )
}