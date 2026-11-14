
"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  Download,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  Search,
  Wallet,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

import type { DirectCollectionInvoice } from "@/types/revenue/direct-collection"

import type {
  CollectionRecord,
  CollectionStatus,
  OptionalInvoiceFields,
  OptionalItemFields,
} from "@/types/field-collection"

import { DataTablePagination } from "@/components/table/data-pagination"
import { formatCurrency, toNumber } from "@/utils/helpers"
import { cn, formatEthiopianDate, formatEthiopianDateWithTime } from "@/lib/utils"
import { usePaymentOptions } from "@/hooks/revenue/payment-option.hook"

// =========================================================
// CONFIG
// =========================================================

const STATUS_TABS = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PARTIALLY_PAID", label: "Partially paid" },
  { value: "COLLECTED", label: "Collected" },
  { value: "CANCELLED", label: "Cancelled" },
] as const

const STATUS_STYLE: Record<
  CollectionStatus,
  { label: string; dot: string; text: string }
> = {
  PENDING: {
    label: "Pending",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },

  PARTIALLY_PAID: {
    label: "Partially paid",
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-400",
  },

  COLLECTED: {
    label: "Collected",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  },

  CANCELLED: {
    label: "Cancelled",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
  },
}

const API_STATUS: Record<string, string> = {
  PENDING: "ISSUED",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  COLLECTED: "PAID",
  CANCELLED: "CANCELLED",
}

const COLLECTION_BASE_PATH =
  "/office/dashboard/field-collections"

const INVOICE_BASE_PATH =
  "/office/dashboard/invoices"

// =========================================================
// MAPPING
// =========================================================

function resolveCollectionStatus(
  collection: DirectCollectionInvoice,
): CollectionStatus {
  const status = String(
    collection.invoice?.status ?? "",
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

    default:
      return "PENDING"
  }
}

type ItemWithExtras = OptionalItemFields & {
  id?: string
  service_id?: string | null
}

function mapDirectCollection(
  collection: DirectCollectionInvoice,
): CollectionRecord {
  const invoice =
    (collection.invoice as OptionalInvoiceFields | null | undefined) ?? {}

  const item = (collection.items?.[0] ?? {}) as ItemWithExtras

  const service = item.service ?? null

  const amount = toNumber(
    invoice.total_amount ??
      invoice.amount ??
      item.amount ??
      0,
  )

  let paidAmount = toNumber(
    invoice.paid_amount ??
      invoice.amount_paid ??
      0,
  )

  if (
    (invoice.status ?? "").toUpperCase() === "PAID" &&
    paidAmount === 0
  ) {
    paidAmount = amount
  }

  const explicitBalance =
    invoice.balance_due ??
    invoice.balance ??
    null

  const calculatedBalance = Math.max(
    amount - paidAmount,
    0,
  )

  const reportedBalance =
    explicitBalance !== null &&
    explicitBalance !== undefined
      ? Math.max(toNumber(explicitBalance), 0)
      : 0

  const balance =
    calculatedBalance === 0
      ? 0
      : reportedBalance > 0
        ? Math.min(reportedBalance, calculatedBalance)
        : calculatedBalance

  return {
    id: collection.id,

    invoiceId:
      invoice.id ??
      collection.id,

    invoiceNumber:
      invoice.invoice_number ??
      "—",

    taxpayerId:
      collection.taxpayer_id ??
      collection.taxpayer?.id ??
      "",

    taxpayerName:
      collection.taxpayer.full_name ??
      "Unknown taxpayer",

    taxpayerPhone:
      collection.taxpayer?.phone ??
      "—",

    serviceId:
      item.service_id ??
      collection.revenue_service_id ??
      "",

    serviceName:
      item.service_name ??
      service?.name ??
      "—",

    revenueDomain:
      service?.revenue_domain ??
      service?.domain ??
      "—",

    tariffCode:
      item.tariff_code ??
      item.tariff_rule_id ??
      "—",

    tariffName:
      item.tariff_name ??
      "—",

    tariffUnit:
      item.unit ??
      service?.unit ??
      "—",

    tariffRate:
      toNumber(item.unit_price),

    quantity:
      toNumber(item.quantity ?? 1),

    amount,
    paidAmount,
    balance,

    dueDate:
      invoice.due_date ??
      null,

    status:
      resolveCollectionStatus(collection),

    createdAt:
      invoice.created_at ??
      null,
  }
}

// =========================================================
// ERROR HANDLING
// =========================================================

function getErrorMessage(error: unknown): string {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message
  }

  const responseError = error as {
    response?: {
      data?: {
        message?: string
        errors?: Record<string, string[]>
      }
    }
  }

  const data = responseError?.response?.data

  if (data?.message) {
    return data.message
  }

  if (data?.errors) {
    const first = Object.values(data.errors)[0]?.[0]

    if (first) {
      return first
    }
  }

  return "Unable to load collections."
}

// =========================================================
// SMALL UI COMPONENTS
// =========================================================

function StatusBadge({
  status,
}: {
  status: CollectionStatus
}) {
  const style = STATUS_STYLE[status]

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 whitespace-nowrap",
        "rounded-full px-2.5 py-1 text-xs font-medium",
        "bg-muted/70",
        style.text,
      )}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          style.dot,
        )}
      />

      {style.label}
    </span>
  )
}

function Stat({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: React.ReactNode
  emphasis?: boolean
}) {
  return (
    <div className="min-w-0 flex-1 px-4 py-4 sm:px-5">
      <p className="truncate text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <p
        className={cn(
          "mt-1 truncate font-semibold tracking-tight tabular-nums",
          emphasis
            ? "text-xl sm:text-2xl"
            : "text-lg sm:text-xl",
        )}
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </p>
    </div>
  )
}

function PaidProgress({
  paid,
  total,
}: {
  paid: number
  total: number
}) {
  const percent =
    total > 0
      ? Math.min((paid / total) * 100, 100)
      : 0

  return (
    <div className="mt-1.5 flex w-24 items-center gap-2">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>

      <span className="text-[10px] tabular-nums text-muted-foreground">
        {Math.round(percent)}%
      </span>
    </div>
  )
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <TableRow key={index}>
          {Array.from({ length: 7 }).map((__, cellIndex) => (
            <TableCell key={cellIndex}>
              <div
                className={cn(
                  "h-4 animate-pulse rounded bg-muted",
                  cellIndex === 6
                    ? "ml-auto w-20"
                    : cellIndex === 0
                      ? "w-6"
                      : "w-full max-w-32",
                )}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function EmptyState({
  hasFilters,
  onClear,
  onCreate,
}: {
  hasFilters: boolean
  onClear: () => void
  onCreate: () => void
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell
        colSpan={7}
        className="h-64 text-center"
      >
        <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Search className="size-5 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold">
              {hasFilters
                ? "No collections found"
                : "No collections yet"}
            </p>

            <p className="text-xs text-muted-foreground">
              {hasFilters
                ? "Try adjusting your search or filters."
                : "Start your first collection to see it here."}
            </p>
          </div>

          {hasFilters ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
            >
              Clear filters
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onCreate}
              className="gap-2"
            >
              <Plus className="size-4" />
              Start collection
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

// =========================================================
// PAGE
// =========================================================

export default function FieldCollectionPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // ---------------- filters ----------------

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  // ---------------- search debounce ----------------

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 400)

    return () => clearTimeout(timer)
  }, [searchInput])

  // ---------------- collection params ----------------

  const listParams = useMemo(
    () => ({
      page,
      per_page: perPage,

      ...(search
        ? { search }
        : {}),

      ...(API_STATUS[statusFilter]
        ? {
            status: API_STATUS[statusFilter],
          }
        : {}),
    }),
    [page, perPage, search, statusFilter],
  )

  // ---------------- collections ----------------

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
  } = useDirectCollections(listParams)

  // ---------------- payment options ----------------

  const {
    data: paymentOptionsResponse,
    isLoading: isPaymentOptionsLoading,
    isError: isPaymentOptionsError,
  } = usePaymentOptions()

  const paymentOptions = paymentOptionsResponse?.data

  const hasPaymentMethod =
    (paymentOptions?.payment_methods?.length ?? 0) > 0

  const paymentCollectionAvailable =
    !isPaymentOptionsLoading &&
    !isPaymentOptionsError &&
    hasPaymentMethod

  // ---------------- map collections ----------------

  const collections = useMemo(
    () =>
      (response?.data ?? []).map(mapDirectCollection),
    [response],
  )

  const pagination = response?.meta

  // ---------------- summary ----------------

  const summary = useMemo(
    () => ({
      pending: collections.filter(
        (c) => c.status === "PENDING",
      ).length,

      partial: collections.filter(
        (c) => c.status === "PARTIALLY_PAID",
      ).length,

      collected: collections.filter(
        (c) => c.status === "COLLECTED",
      ).length,

      outstanding: collections.reduce(
        (sum, c) => sum + c.balance,
        0,
      ),
    }),
    [collections],
  )

  // ---------------- actions ----------------

  const go = (path: string) => router.push(path)

  const enc = encodeURIComponent

  const canPay = (c: CollectionRecord) =>
    paymentCollectionAvailable &&
    c.balance > 0 &&
    c.status !== "CANCELLED" &&
    !!c.invoiceId

  const canEdit = (c: CollectionRecord) =>
    c.status === "PENDING" &&
    c.paidAmount <= 0 &&
    c.balance > 0

  const canPrint = (c: CollectionRecord) =>
    !!c.invoiceId &&
    (
      c.status !== "PENDING" ||
      c.balance > 0
    )

  const startCollection = () =>
    go(`${COLLECTION_BASE_PATH}/create`)

  const viewDetails = (c: CollectionRecord) =>
    go(`${COLLECTION_BASE_PATH}/${enc(c.id)}`)

  const edit = (c: CollectionRecord) => {
    if (canEdit(c)) {
      go(`${COLLECTION_BASE_PATH}/${enc(c.id)}/edit`)
    }
  }

  const collectPayment = (c: CollectionRecord) => {
    if (canPay(c)) {
      go(
        `/office/dashboard/payments/create?invoice_id=${enc(c.invoiceId)}`,
      )
    }
  }

  const printInvoice = (c: CollectionRecord) => {
    if (canPrint(c)) {
      go(`${INVOICE_BASE_PATH}/${enc(c.invoiceId)}/print`)
    }
  }

  const downloadInvoice = (c: CollectionRecord) => {
    if (canPrint(c)) {
      window.open(
        `${INVOICE_BASE_PATH}/${enc(c.invoiceId)}/print?download=1`,
        "_blank",
        "noopener,noreferrer",
      )
    }
  }

  // ---------------- filters ----------------

  const changeStatus = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const hasFilters =
    statusFilter !== "ALL" ||
    searchInput.trim() !== ""

  const clearFilters = () => {
    setSearchInput("")
    setSearch("")
    setStatusFilter("ALL")
    setPage(1)
  }

  const retryLoading = () => {
    queryClient.invalidateQueries({
      queryKey: directCollectionKeys.all,
    })
  }

  // ---------------- header ----------------

  const header = (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Direct collection
          </h1>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Collect payments and manage invoices in the field.
        </p>
      </div>

      <Button
        onClick={startCollection}
        className="w-full shrink-0 gap-2 sm:w-auto"
      >
        <Plus className="size-4" />
        Start collection
      </Button>
    </header>
  )

  // ---------------- error state ----------------

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {header}

        <Card>
          <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 p-6">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <FileText className="size-6 text-muted-foreground" />
            </div>

            <div className="space-y-1 text-center">
              <p className="font-semibold">
                Couldn&apos;t load collections
              </p>

              <p className="max-w-md text-sm text-muted-foreground">
                {getErrorMessage(error)}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={retryLoading}
              className="gap-2"
            >
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---------------- UI ----------------

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {header}

      {/* ===================================================== */}
      {/* SUMMARY */}
      {/* ===================================================== */}

      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          <Stat
            label="Outstanding (this page)"
            value={formatCurrency(summary.outstanding)}
            emphasis
          />

          <Stat
            label="Pending"
            value={summary.pending}
          />

          <Stat
            label="Partially paid"
            value={summary.partial}
          />

          <Stat
            label="Collected"
            value={summary.collected}
          />
        </div>
      </Card>

      {/* ===================================================== */}
      {/* COLLECTION TABLE */}
      {/* ===================================================== */}

      <Card className="gap-0 overflow-hidden py-0">
        {/* ---------------- toolbar ---------------- */}

        <div className="flex flex-col gap-3 border-b p-4">
          {/* status filters */}

          <div
            role="tablist"
            aria-label="Filter collections by status"
            className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1"
          >
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.value

              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => changeStatus(tab.value)}
                  className={cn(
                    "shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-muted text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* search */}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search taxpayer, invoice or service..."
                aria-label="Search collections"
                className="h-9 pl-9 pr-9"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                {isFetching && !isLoading ? (
                  <>
                    <Loader2 className="size-3.5 shrink-0 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span className="truncate">
                    {pagination?.total ?? collections.length} collections
                  </span>
                )}
              </div>

              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 shrink-0 gap-1.5 text-muted-foreground"
                >
                  <X className="size-3.5" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ---------------- table ---------------- */}

        <div
          className={cn(
            "relative w-full overflow-x-auto",
            "transition-opacity duration-200",
            isFetching && !isLoading && "opacity-60",
          )}
        >
          <Table className="min-w-[1070px] table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[55px] text-center">
                  No.
                </TableHead>

                <TableHead className="w-[155px]">
                  Invoice
                </TableHead>

                <TableHead className="w-[210px]">
                  Taxpayer
                </TableHead>

                <TableHead className="w-[190px]">
                  Service
                </TableHead>

                <TableHead className="w-[150px] text-right">
                  Amount
                </TableHead>

                <TableHead className="w-[140px]">
                  Status
                </TableHead>

                <TableHead className="w-[170px] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* Loading */}

              {isLoading ? (
                <TableSkeleton />
              ) : collections.length === 0 ? (
                /* Empty state */

                <EmptyState
                  hasFilters={hasFilters}
                  onClear={clearFilters}
                  onCreate={startCollection}
                />
              ) : (
                /* Collection records */

                collections.map((c, index) => {
                  const tariffLabel =
                    c.tariffName !== "—"
                      ? c.tariffName
                      : c.tariffCode

                  return (
                    <TableRow
                      key={c.id}
                      onClick={() => viewDetails(c)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        "hover:bg-muted/40",
                      )}
                    >
                      {/* Number */}

                      <TableCell className="text-center text-xs tabular-nums text-muted-foreground">
                        {(page - 1) * perPage + index + 1}
                      </TableCell>

                      {/* Invoice */}

                      <TableCell>
                        <div className="min-w-0 space-y-1">
                          <p
                            className="truncate text-sm font-medium"
                            title={c.invoiceNumber}
                          >
                            {c.invoiceNumber}
                          </p>

                          <p className="truncate text-xs text-muted-foreground">
                            {c.createdAt
                              ? formatEthiopianDateWithTime(c.createdAt)
                              : "—"}
                          </p>
                        </div>
                      </TableCell>

                      {/* Taxpayer */}

                      <TableCell>
                        <div className="min-w-0 space-y-1">
                          <p
                            className="truncate text-sm font-medium"
                            title={c.taxpayerName}
                          >
                            {c.taxpayerName}
                          </p>

                          <p
                            className="truncate text-xs text-muted-foreground"
                            title={c.taxpayerPhone}
                          >
                            {c.taxpayerPhone}
                          </p>
                        </div>
                      </TableCell>

                      {/* Service */}

                      <TableCell>
                        <div className="min-w-0 space-y-1">
                          <p
                            className="truncate text-sm font-medium"
                            title={c.serviceName}
                          >
                            {c.serviceName}
                          </p>

                          <p
                            className="truncate text-xs text-muted-foreground"
                            title={tariffLabel}
                          >
                            {tariffLabel}
                          </p>
                        </div>
                      </TableCell>

                      {/* Amount */}

                      <TableCell className="text-right">
                        <div className="flex min-w-0 flex-col items-end gap-0.5">
                          <span className="whitespace-nowrap text-sm font-semibold tabular-nums">
                            {formatCurrency(c.amount)}
                          </span>

                          {c.balance > 0 && (
                            <span
                              className="whitespace-nowrap text-xs text-muted-foreground tabular-nums"
                              title={`${formatCurrency(c.balance)} outstanding`}
                            >
                              {formatCurrency(c.balance)} due
                            </span>
                          )}

                          {c.status === "PARTIALLY_PAID" && (
                            <PaidProgress
                              paid={c.paidAmount}
                              total={c.amount}
                            />
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}

                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>

                      {/* Actions */}

                      <TableCell
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {canPay(c) && (
                            <Button
                              size="sm"
                              onClick={() => collectPayment(c)}
                              className="h-8 gap-1.5 px-2.5"
                            >
                              <Wallet className="size-3.5" />
                              Collect
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0"
                                aria-label={`More actions for invoice ${c.invoiceNumber}`}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="w-48"
                            >
                              <DropdownMenuItem
                                onClick={() => viewDetails(c)}
                              >
                                <FileText className="mr-2 size-4" />
                                View details
                              </DropdownMenuItem>

                              {canEdit(c) && (
                                <DropdownMenuItem
                                  onClick={() => edit(c)}
                                >
                                  <Pencil className="mr-2 size-4" />
                                  Edit collection
                                </DropdownMenuItem>
                              )}

                              {canPrint(c) && (
                                <>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() => printInvoice(c)}
                                  >
                                    <Printer className="mr-2 size-4" />
                                    Print invoice
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => downloadInvoice(c)}
                                  >
                                    <Download className="mr-2 size-4" />
                                    Download invoice
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ---------------- pagination ---------------- */}

        {(pagination?.total ?? 0) > 0 && (
          <div className="border-t p-3 sm:p-4">
            <DataTablePagination
              page={page}
              pageSize={perPage}
              total={pagination?.total ?? 0}
              onPageChange={setPage}
              onPageSizeChange={(size: number) => {
                setPerPage(size)
                setPage(1)
              }}
            />
          </div>
        )}
      </Card>
    </div>
  )
}
