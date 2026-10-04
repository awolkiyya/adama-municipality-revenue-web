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
import { cn, formatEthiopianDate } from "@/lib/utils"
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
    text: "text-amber-700",
  },

  PARTIALLY_PAID: {
    label: "Partially paid",
    dot: "bg-blue-500",
    text: "text-blue-700",
  },

  COLLECTED: {
    label: "Collected",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
  },

  CANCELLED: {
    label: "Cancelled",
    dot: "bg-red-500",
    text: "text-red-700",
  },
}

const API_STATUS: Record<string, string> = {
  PENDING: "ISSUED",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  COLLECTED: "PAID",
  CANCELLED: "CANCELLED",
}

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

  // Defensive fallback: PAID invoice without paid_amount
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
        ? Math.min(
            reportedBalance,
            calculatedBalance,
          )
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
      collection.taxpayer?.name ??
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
        errors?: Record<
          string,
          string[]
        >
      }
    }
  }

  const data =
    responseError?.response?.data

  if (data?.message) {
    return data.message
  }

  if (data?.errors) {
    const first =
      Object.values(data.errors)[0]?.[0]

    if (first) {
      return first
    }
  }

  return "Unable to load collections."
}

// =========================================================
// SMALL UI PIECES
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
        "inline-flex items-center gap-1.5 text-sm font-medium",
        style.text,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
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
    <div className="flex-1 px-5 py-4">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p
        className={cn(
          "mt-1 font-semibold tracking-tight",
          emphasis
            ? "text-2xl"
            : "text-xl",
        )}
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
      ? Math.min(
          (paid / total) * 100,
          100,
        )
      : 0

  return (
    <div className="mt-1.5 h-1 w-28 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-emerald-500 transition-all"
        style={{
          width: `${percent}%`,
        }}
      />
    </div>
  )
}

// =========================================================
// PAGE
// =========================================================

export default function FieldCollectionPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // ---------------- filters ----------------

  const [searchInput, setSearchInput] =
    useState("")

  const [search, setSearch] =
    useState("")

  const [statusFilter, setStatusFilter] =
    useState<string>("ALL")

  const [page, setPage] =
    useState(1)

  const [perPage, setPerPage] =
    useState(10)

  // ---------------- search debounce ----------------

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(
        searchInput.trim(),
      )

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

      ...(API_STATUS[
        statusFilter
      ]
        ? {
            status:
              API_STATUS[
                statusFilter
              ],
          }
        : {}),
    }),
    [
      page,
      perPage,
      search,
      statusFilter,
    ],
  )

  // ---------------- collections ----------------

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
  } = useDirectCollections(
    listParams,
  )

  // ---------------- payment options ----------------

  const {
    data: paymentOptionsResponse,
    isLoading:
      isPaymentOptionsLoading,
    isError:
      isPaymentOptionsError,
  } = usePaymentOptions()

  const paymentOptions =
    paymentOptionsResponse?.data

  const hasPaymentMethod =
    (
      paymentOptions
        ?.payment_methods
        ?.length ?? 0
    ) > 0

  /*
   * The Collect action is available only after
   * payment options have loaded and at least one
   * payment method is currently enabled.
   */
  const paymentCollectionAvailable =
    !isPaymentOptionsLoading &&
    !isPaymentOptionsError &&
    hasPaymentMethod

  // ---------------- map collections ----------------

  const collections = useMemo(
    () =>
      (response?.data ?? []).map(
        mapDirectCollection,
      ),
    [response],
  )

  const pagination =
    response?.meta

  // ---------------- summary ----------------

  const summary = useMemo(
    () => ({
      pending:
        collections.filter(
          (c) =>
            c.status === "PENDING",
        ).length,

      partial:
        collections.filter(
          (c) =>
            c.status ===
            "PARTIALLY_PAID",
        ).length,

      collected:
        collections.filter(
          (c) =>
            c.status ===
            "COLLECTED",
        ).length,

      outstanding:
        collections.reduce(
          (sum, c) =>
            sum + c.balance,
          0,
        ),
    }),
    [collections],
  )

  // ---------------- actions ----------------

  const go = (path: string) =>
    router.push(path)

  const enc = encodeURIComponent

  const canPay = (
    c: CollectionRecord,
  ) =>
    paymentCollectionAvailable &&
    c.balance > 0 &&
    c.status !== "CANCELLED" &&
    !!c.invoiceId

  const canEdit = (
    c: CollectionRecord,
  ) =>
    c.status === "PENDING" &&
    c.paidAmount <= 0 &&
    c.balance > 0

  const canPrint = (
    c: CollectionRecord,
  ) =>
    !!c.invoiceId &&
    (
      c.status !== "PENDING" ||
      c.balance > 0
    )

  const startCollection = () =>
    go(
      "/office/dashboard/field-collections/create",
    )

  const viewDetails = (
    c: CollectionRecord,
  ) =>
    go(
      `/office/dashboard/field-collections/${enc(
        c.id,
      )}`,
    )

  const edit = (
    c: CollectionRecord,
  ) => {
    if (canEdit(c)) {
      go(
        `/office/dashboard/field-collections/${enc(
          c.id,
        )}/edit`,
      )
    }
  }

  const collectPayment = (
    c: CollectionRecord,
  ) => {
    if (canPay(c)) {
      go(
        `/office/dashboard/payments/create?invoice_id=${enc(
          c.invoiceId,
        )}`,
      )
    }
  }

  const printInvoice = (
    c: CollectionRecord,
  ) => {
    if (canPrint(c)) {
      go(
        `/office/dashboard/invoices/${enc(
          c.invoiceId,
        )}/print`,
      )
    }
  }

  const downloadInvoice = (
    c: CollectionRecord,
  ) => {
    if (canPrint(c)) {
      window.open(
        `/office/dashboard/invoices/${enc(
          c.invoiceId,
        )}/print?download=1`,
        "_blank",
        "noopener,noreferrer",
      )
    }
  }

  const changeStatus = (
    value: string,
  ) => {
    setStatusFilter(value)
    setPage(1)
  }

  const hasFilters =
    statusFilter !== "ALL" ||
    searchInput !== ""

  const clearFilters = () => {
    setSearchInput("")
    setSearch("")
    setStatusFilter("ALL")
    setPage(1)
  }

  // ---------------- header ----------------

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Direct collection
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Collect payments and manage invoices in the field.
        </p>
      </div>

      <Button
        onClick={startCollection}
        className="gap-2"
      >
        <Plus className="size-4" />
        Start collection
      </Button>
    </div>
  )

  // ---------------- error ----------------

  if (isError) {
    return (
      <div className="space-y-6 p-6">
        {header}

        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3">
            <FileText className="size-8 text-muted-foreground" />

            <p className="font-medium">
              Couldn&apos;t load collections
            </p>

            <p className="max-w-md text-center text-sm text-muted-foreground">
              {getErrorMessage(error)}
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
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---------------- UI ----------------

  return (
    <div className="space-y-6 p-6">
      {header}

      {/* SUMMARY */}

      <Card className="overflow-hidden">
        <div className="flex flex-col divide-y sm:flex-row sm:divide-x sm:divide-y-0">
          <Stat
            label="Outstanding (this page)"
            value={formatCurrency(
              summary.outstanding,
            )}
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

      {/* LIST */}

      <Card className="overflow-hidden">
        {/* toolbar */}

        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
            {STATUS_TABS.map(
              (tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() =>
                    changeStatus(
                      tab.value,
                    )
                  }
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",

                    statusFilter ===
                      tab.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              ),
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={searchInput}
                onChange={(e) =>
                  setSearchInput(
                    e.target.value,
                  )
                }
                placeholder="Search taxpayer, invoice or service"
                className="pl-9"
              />
            </div>

            {hasFilters && (
              <Button
                variant="ghost"
                size="icon"
                onClick={
                  clearFilters
                }
                aria-label="Clear filters"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* table */}

        <div
          className={cn(
            "overflow-x-auto transition-opacity",
            isFetching &&
              !isLoading &&
              "opacity-60",
          )}
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">
                  No.
                </TableHead>

                <TableHead>
                  Invoice
                </TableHead>

                <TableHead>
                  Taxpayer
                </TableHead>

                <TableHead>
                  Service
                </TableHead>

                <TableHead className="text-right">
                  Amount
                </TableHead>

                <TableHead>
                  Status
                </TableHead>

                <TableHead className="w-[170px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({
                  length: 6,
                }).map(
                  (_, i) => (
                    <TableRow
                      key={i}
                    >
                      <TableCell colSpan={7}>
                        <div className="h-10 animate-pulse rounded-md bg-muted" />
                      </TableCell>
                    </TableRow>
                  ),
                )
              ) : collections.length ===
                0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={7}
                    className="h-56 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                        <Search className="size-5 text-muted-foreground" />
                      </div>

                      <p className="text-sm font-medium">
                        {hasFilters
                          ? "No collections match your filters"
                          : "No collections yet"}
                      </p>

                      {hasFilters ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={
                            clearFilters
                          }
                        >
                          Clear filters
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={
                            startCollection
                          }
                        >
                          Start your first collection
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                collections.map(
                  (
                    c,
                    index,
                  ) => (
                    <TableRow
                      key={c.id}
                      onClick={() =>
                        viewDetails(
                          c,
                        )
                      }
                      className="cursor-pointer"
                    >
                      {/* no. */}

                      <TableCell className="text-muted-foreground">
                        {(page - 1) *
                          perPage +
                          index +
                          1}
                      </TableCell>

                      {/* invoice */}

                      <TableCell>
                        <p className="font-medium">
                          {
                            c.invoiceNumber
                          }
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {c.createdAt
                            ? formatEthiopianDate(
                                c.createdAt,
                              )
                            : "—"}
                        </p>
                      </TableCell>

                      {/* taxpayer */}

                      <TableCell>
                        <p className="font-medium">
                          {
                            c.taxpayerName
                          }
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {
                            c.taxpayerPhone
                          }
                        </p>
                      </TableCell>

                      {/* service */}

                      <TableCell>
                        <p className="font-medium">
                          {
                            c.serviceName
                          }
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {c.tariffName !==
                          "—"
                            ? c.tariffName
                            : c.tariffCode}
                        </p>
                      </TableCell>

                      {/* amount */}

                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium">
                            {formatCurrency(
                              c.amount,
                            )}
                          </span>

                          {c.balance >
                          0 ? (
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(
                                c.balance,
                              )}{" "}
                              due
                            </span>
                          ) : null}

                          {c.status ===
                            "PARTIALLY_PAID" && (
                            <PaidProgress
                              paid={
                                c.paidAmount
                              }
                              total={
                                c.amount
                              }
                            />
                          )}
                        </div>
                      </TableCell>

                      {/* status */}

                      <TableCell>
                        <StatusBadge
                          status={
                            c.status
                          }
                        />
                      </TableCell>

                      {/* actions */}

                      <TableCell
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                      >
                        <div className="flex items-center justify-end gap-1">
                          {canPay(
                            c,
                          ) && (
                            <Button
                              size="sm"
                              className="gap-1.5"
                              onClick={() =>
                                collectPayment(
                                  c,
                                )
                              }
                            >
                              <Wallet className="size-3.5" />
                              Collect
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label="More actions"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="w-48"
                            >
                              <DropdownMenuItem
                                onClick={() =>
                                  viewDetails(
                                    c,
                                  )
                                }
                              >
                                <FileText className="mr-2 size-4" />
                                View details
                              </DropdownMenuItem>

                              {canEdit(
                                c,
                              ) && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    edit(
                                      c,
                                    )
                                  }
                                >
                                  <Pencil className="mr-2 size-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}

                              {canPrint(
                                c,
                              ) && (
                                <>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() =>
                                      printInvoice(
                                        c,
                                      )
                                    }
                                  >
                                    <Printer className="mr-2 size-4" />
                                    Print invoice
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() =>
                                      downloadInvoice(
                                        c,
                                      )
                                    }
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
                  ),
                )
              )}
            </TableBody>
          </Table>
        </div>

        {/* pagination */}

        {(pagination?.total ??
          0) > 0 && (
          <div className="border-t p-4">
            <DataTablePagination
              page={page}
              pageSize={perPage}
              total={
                pagination?.total ??
                0
              }
              onPageChange={
                setPage
              }
              onPageSizeChange={(
                size: number,
              ) => {
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