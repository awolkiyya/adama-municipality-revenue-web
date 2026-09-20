"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  FileText,
  MoreHorizontal,
  Pencil,
  Search,
  Tag,
  User,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// =========================================================
// TYPES
// =========================================================

type CollectionStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "COLLECTED"
  | "CANCELLED";

type CollectionRecord = {
  id: string;
  invoiceNumber: string;

  taxpayerId: string;
  taxpayerName: string;
  taxpayerPhone: string;

  serviceId: string;
  serviceName: string;
  revenueDomain: string;

  tariffCode: string;
  tariffName: string;
  tariffUnit: string;
  tariffRate: number;
  quantity: number;

  amount: number;
  paidAmount: number;
  balance: number;

  dueDate: string;
  status: CollectionStatus;
  createdAt: string;
};

// =========================================================
// MOCK COLLECTION QUEUE
// =========================================================

const MOCK_COLLECTIONS: CollectionRecord[] = [
  {
    id: "fc-001",
    invoiceNumber: "INV-2026-000124",

    taxpayerId: "taxpayer-001",
    taxpayerName: "Abebe Kebede",
    taxpayerPhone: "09********",

    serviceId: "service-cleanliness",
    serviceName: "Cleanliness Service Fee",
    revenueDomain: "SERVICE",

    tariffCode: "19.2",
    tariffName: "Commercial Houses",
    tariffUnit: "Unit",
    tariffRate: 60,
    quantity: 5,

    amount: 300,
    paidAmount: 0,
    balance: 300,

    dueDate: "2026-09-12",
    status: "PENDING",
    createdAt: "2026-09-11",
  },

  {
    id: "fc-002",
    invoiceNumber: "INV-2026-000125",

    taxpayerId: "taxpayer-002",
    taxpayerName: "Hawa Mohammed",
    taxpayerPhone: "09********",

    serviceId: "service-cleanliness",
    serviceName: "Cleanliness Service Fee",
    revenueDomain: "SERVICE",

    tariffCode: "19.1",
    tariffName: "Residential House",
    tariffUnit: "Unit",
    tariffRate: 50,
    quantity: 10,

    amount: 500,
    paidAmount: 200,
    balance: 300,

    dueDate: "2026-09-12",
    status: "PARTIALLY_PAID",
    createdAt: "2026-09-10",
  },

  {
    id: "fc-003",
    invoiceNumber: "INV-2026-000126",

    taxpayerId: "taxpayer-003",
    taxpayerName: "Tadesse Trading",
    taxpayerPhone: "09********",

    serviceId: "service-cleanliness",
    serviceName: "Cleanliness Service Fee",
    revenueDomain: "SERVICE",

    tariffCode: "19.2",
    tariffName: "Commercial Houses",
    tariffUnit: "Unit",
    tariffRate: 60,
    quantity: 15,

    amount: 900,
    paidAmount: 900,
    balance: 0,

    dueDate: "2026-09-11",
    status: "COLLECTED",
    createdAt: "2026-09-09",
  },

  {
    id: "fc-004",
    invoiceNumber: "INV-2026-000127",

    taxpayerId: "taxpayer-004",
    taxpayerName: "Fatuma Ali",
    taxpayerPhone: "09********",

    serviceId: "service-cleanliness",
    serviceName: "Cleanliness Service Fee",
    revenueDomain: "SERVICE",

    tariffCode: "19.1",
    tariffName: "Residential House",
    tariffUnit: "Unit",
    tariffRate: 50,
    quantity: 13,

    amount: 650,
    paidAmount: 0,
    balance: 650,

    dueDate: "2026-09-10",
    status: "PENDING",
    createdAt: "2026-09-09",
  },

  {
    id: "fc-005",
    invoiceNumber: "INV-2026-000128",

    taxpayerId: "taxpayer-005",
    taxpayerName: "Biftu Hotel",
    taxpayerPhone: "09********",

    serviceId: "service-hospitality",
    serviceName: "Hospitality Service Fee",
    revenueDomain: "SERVICE",

    tariffCode: "22.4",
    tariffName: "Hotel",
    tariffUnit: "Room",
    tariffRate: 60,
    quantity: 20,

    amount: 1200,
    paidAmount: 500,
    balance: 700,

    dueDate: "2026-09-08",
    status: "PARTIALLY_PAID",
    createdAt: "2026-09-07",
  },
];

// =========================================================
// HELPERS
// =========================================================

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getStatusLabel(status: CollectionStatus) {
  switch (status) {
    case "PENDING":
      return "Pending";

    case "PARTIALLY_PAID":
      return "Partially Paid";

    case "COLLECTED":
      return "Collected";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status;
  }
}

function getStatusClassName(status: CollectionStatus) {
  switch (status) {
    case "PENDING":
      return "bg-amber-500/10 text-amber-700 border-amber-500/20";

    case "PARTIALLY_PAID":
      return "bg-blue-500/10 text-blue-700 border-blue-500/20";

    case "COLLECTED":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";

    case "CANCELLED":
      return "bg-red-500/10 text-red-700 border-red-500/20";

    default:
      return "";
  }
}

// =========================================================
// PAGE
// =========================================================

export default function FieldCollectionPage() {
  const router = useRouter();

  // =======================================================
  // QUEUE FILTERS
  // =======================================================

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  // =======================================================
  // VIEW DETAILS DIALOG
  // =======================================================

  const [detailsDialogOpen, setDetailsDialogOpen] =
    useState(false);

  const [
    selectedDetailsCollection,
    setSelectedDetailsCollection,
  ] = useState<CollectionRecord | null>(null);

  // =======================================================
  // CASH COLLECTION DIALOG
  // =======================================================

  const [cashDialogOpen, setCashDialogOpen] =
    useState(false);

  const [
    selectedCashCollection,
    setSelectedCashCollection,
  ] = useState<CollectionRecord | null>(null);

  const [cashAmount, setCashAmount] = useState("");

  const [cashSubmitting, setCashSubmitting] =
    useState(false);

  // =======================================================
  // QUEUE FILTERING
  // =======================================================

  const filteredCollections = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return MOCK_COLLECTIONS.filter((item) => {
      const matchesSearch =
        normalizedSearch === "" ||
        item.invoiceNumber
          .toLowerCase()
          .includes(normalizedSearch) ||
        item.taxpayerName
          .toLowerCase()
          .includes(normalizedSearch) ||
        item.serviceName
          .toLowerCase()
          .includes(normalizedSearch) ||
        item.tariffCode
          .toLowerCase()
          .includes(normalizedSearch) ||
        item.tariffName
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        item.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [search, statusFilter]);

  // =======================================================
  // SUMMARY
  // =======================================================

  const summary = useMemo(() => {
    const pending =
      MOCK_COLLECTIONS.filter(
        (item) =>
          item.status === "PENDING"
      ).length;

    const partial =
      MOCK_COLLECTIONS.filter(
        (item) =>
          item.status === "PARTIALLY_PAID"
      ).length;

    const collected =
      MOCK_COLLECTIONS.filter(
        (item) =>
          item.status === "COLLECTED"
      ).length;

    const outstanding =
      MOCK_COLLECTIONS.reduce(
        (total, item) =>
          total + item.balance,
        0
      );

    return {
      pending,
      partial,
      collected,
      outstanding,
    };
  }, []);

  // =======================================================
  // NAVIGATION
  // =======================================================

  function handleStartCollection() {
    router.push("/office/dashboard/field-collections/create");
  }

  function handleUpdate(
    collection: CollectionRecord
  ) {
    router.push(
      `/office/dashboard/field-collections/${collection.id}/edit`
    );
  }

  // =======================================================
  // OPEN VIEW DETAILS
  // =======================================================

  function openViewDetails(
    collection: CollectionRecord
  ) {
    setSelectedDetailsCollection(
      collection
    );

    setDetailsDialogOpen(true);
  }

  // =======================================================
  // OPEN COLLECT CASH
  // =======================================================

  function openCollectCash(
    collection: CollectionRecord
  ) {
    if (collection.balance <= 0) {
      return;
    }

    setSelectedCashCollection(
      collection
    );

    setCashAmount("");

    setCashDialogOpen(true);
  }

  // =======================================================
  // COLLECT CASH
  // =======================================================

  async function collectCash() {
    if (!selectedCashCollection) {
      return;
    }

    const amount = Number(cashAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return;
    }

    if (
      amount >
      selectedCashCollection.balance
    ) {
      return;
    }

    setCashSubmitting(true);

    try {
      /*
       * Production:
       *
       * POST
       * /api/v1/invoices/{invoice}/payments
       *
       * {
       *   amount,
       *   payment_method: "CASH"
       * }
       *
       * Backend responsibilities:
       *
       * 1. Authenticate collector.
       * 2. Authorize collection.
       * 3. Lock invoice.
       * 4. Re-read balance_due.
       * 5. Validate amount.
       * 6. Create payment.
       * 7. Update paid_amount.
       * 8. Update balance_due.
       * 9. Update invoice status.
       * 10. Generate receipt.
       * 11. Commit transaction.
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 600)
      );

      const remaining =
        selectedCashCollection.balance -
        amount;

      const updatedStatus: CollectionStatus =
        remaining <= 0
          ? "COLLECTED"
          : "PARTIALLY_PAID";

      setSelectedCashCollection({
        ...selectedCashCollection,
        paidAmount:
          selectedCashCollection.paidAmount +
          amount,
        balance: remaining,
        status: updatedStatus,
      });

      setCashDialogOpen(false);
      setCashAmount("");
    } finally {
      setCashSubmitting(false);
    }
  }

  // =======================================================
  // CLOSE DETAILS DIALOG
  // =======================================================

  function closeDetailsDialog() {
    setDetailsDialogOpen(false);
    setSelectedDetailsCollection(null);
  }

  // =======================================================
  // CLOSE CASH DIALOG
  // =======================================================

  function closeCashDialog() {
    if (cashSubmitting) {
      return;
    }

    setCashDialogOpen(false);
    setSelectedCashCollection(null);
    setCashAmount("");
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
            Manage field collections and collect
            outstanding invoice balances.
          </p>
        </div>

        {/* =================================================
            CREATE PAGE NAVIGATION
        ================================================= */}

        <Button
          className="gap-2"
          onClick={handleStartCollection}
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
                  Requires collection
                </p>
              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Wallet className="size-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PARTIAL */}

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
                  Remaining balances
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
                  Completed collections
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
                    summary.outstanding
                  )}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Remaining to collect
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
                Existing invoices with collection
                information.
              </p>
            </div>

            <span className="text-sm text-muted-foreground">
              {filteredCollections.length} records
            </span>
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
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search taxpayer, invoice or tariff..."
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={
                setStatusFilter
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
                {filteredCollections.length ===
                0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Search className="size-5 text-muted-foreground" />

                        <p className="text-sm font-medium">
                          No collections found
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Try changing your filters.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCollections.map(
                    (collection) => (
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
                                {
                                  collection.createdAt
                                }
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
                              collection.amount
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
                              collection.balance
                            )}
                          </span>
                        </TableCell>

                        {/* STATUS */}

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusClassName(
                              collection.status
                            )}
                          >
                            {getStatusLabel(
                              collection.status
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
                              className="w-44"
                            >
                              {/* =================================
                                  UPDATE PAGE
                              ================================= */}

                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdate(
                                    collection
                                  )
                                }
                              >
                                <Pencil className="mr-2 size-4" />

                                Update
                              </DropdownMenuItem>

                              {/* =================================
                                  DETAILS
                              ================================= */}

                              <DropdownMenuItem
                                onClick={() =>
                                  openViewDetails(
                                    collection
                                  )
                                }
                              >
                                <FileText className="mr-2 size-4" />

                                View Details
                              </DropdownMenuItem>

                              {/* =================================
                                  CASH COLLECTION
                              ================================= */}

                              {collection.balance >
                                0 && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    openCollectCash(
                                      collection
                                    )
                                  }
                                >
                                  <Wallet className="mr-2 size-4" />

                                  Collect Cash
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===================================================
          VIEW DETAILS DIALOG
      =================================================== */}

      <Dialog
        open={detailsDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDetailsDialog();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Collection Details
            </DialogTitle>

            <DialogDescription>
              Read-only information about the invoice,
              taxpayer, service and financial obligation.
            </DialogDescription>
          </DialogHeader>

          {selectedDetailsCollection && (
            <div className="space-y-5">
              {/* =================================================
                  INVOICE
              ================================================= */}

              <div className="rounded-lg border">
                <div className="border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-primary" />

                    <p className="text-sm font-semibold">
                      Invoice
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Invoice Number
                    </p>

                    <p className="mt-1 font-mono text-sm font-semibold">
                      {
                        selectedDetailsCollection.invoiceNumber
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Status
                    </p>

                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className={getStatusClassName(
                          selectedDetailsCollection.status
                        )}
                      >
                        {getStatusLabel(
                          selectedDetailsCollection.status
                        )}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Invoice Amount
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatCurrency(
                        selectedDetailsCollection.amount
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Paid Amount
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatCurrency(
                        selectedDetailsCollection.paidAmount
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Balance
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatCurrency(
                        selectedDetailsCollection.balance
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Due Date
                    </p>

                    <p className="mt-1 font-semibold">
                      {
                        selectedDetailsCollection.dueDate
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  TAXPAYER
              ================================================= */}

              <div className="rounded-lg border">
                <div className="border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-primary" />

                    <p className="text-sm font-semibold">
                      Taxpayer
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Name
                    </p>

                    <p className="mt-1 font-medium">
                      {
                        selectedDetailsCollection.taxpayerName
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Phone
                    </p>

                    <p className="mt-1 font-medium">
                      {
                        selectedDetailsCollection.taxpayerPhone
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  SERVICE
              ================================================= */}

              <div className="rounded-lg border">
                <div className="border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Tag className="size-4 text-primary" />

                    <p className="text-sm font-semibold">
                      Service
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Revenue Service
                    </p>

                    <p className="mt-1 font-medium">
                      {
                        selectedDetailsCollection.serviceName
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Revenue Domain
                    </p>

                    <p className="mt-1 font-medium">
                      {
                        selectedDetailsCollection.revenueDomain
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  TARIFF
              ================================================= */}

              <div className="rounded-lg border">
                <div className="border-b px-4 py-3">
                  <p className="text-sm font-semibold">
                    Tariff
                  </p>
                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Code
                    </p>

                    <p className="mt-1 font-mono text-sm font-semibold">
                      {
                        selectedDetailsCollection.tariffCode
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Name
                    </p>

                    <p className="mt-1 font-medium">
                      {
                        selectedDetailsCollection.tariffName
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Rate
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatCurrency(
                        selectedDetailsCollection.tariffRate
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Unit
                    </p>

                    <p className="mt-1 font-medium">
                      {
                        selectedDetailsCollection.tariffUnit
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Quantity
                    </p>

                    <p className="mt-1 font-semibold">
                      {
                        selectedDetailsCollection.quantity
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={
                closeDetailsDialog
              }
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================================================
          COLLECT CASH DIALOG
      =================================================== */}

      <Dialog
        open={cashDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeCashDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Collect Cash
            </DialogTitle>

            <DialogDescription>
              Record a cash payment against the existing
              invoice. The server will validate the current
              outstanding balance before recording payment.
            </DialogDescription>
          </DialogHeader>

          {selectedCashCollection && (
            <div className="space-y-5">
              {/* =================================================
                  INVOICE
              ================================================= */}

              <div className="rounded-lg border">
                <div className="border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-primary" />

                    <div>
                      <p className="text-sm font-semibold">
                        Invoice
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {
                          selectedCashCollection.invoiceNumber
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Invoice Amount
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatCurrency(
                        selectedCashCollection.amount
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Paid
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatCurrency(
                        selectedCashCollection.paidAmount
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Outstanding
                    </p>

                    <p className="mt-1 font-semibold text-primary">
                      {formatCurrency(
                        selectedCashCollection.balance
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  TAXPAYER
              ================================================= */}

              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <User className="size-4 text-primary" />
                  </div>

                  <div>
                    <p className="font-semibold">
                      {
                        selectedCashCollection.taxpayerName
                      }
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {
                        selectedCashCollection.taxpayerPhone
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
                  SERVICE
              ================================================= */}

              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Revenue Service
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {
                        selectedCashCollection.serviceName
                      }
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className="font-mono"
                  >
                    {
                      selectedCashCollection.tariffCode
                    }
                  </Badge>
                </div>
              </div>

              {/* =================================================
                  CASH AMOUNT
              ================================================= */}

              <div className="space-y-2">
                <label
                  htmlFor="cash-amount"
                  className="text-sm font-medium"
                >
                  Cash Amount
                </label>

                <div className="relative">
                  <Input
                    id="cash-amount"
                    type="number"
                    min="0.01"
                    max={
                      selectedCashCollection.balance
                    }
                    step="0.01"
                    value={cashAmount}
                    onChange={(event) =>
                      setCashAmount(
                        event.target.value
                      )
                    }
                    placeholder="Enter cash amount"
                    className="pr-16 text-lg"
                    disabled={
                      cashSubmitting
                    }
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    ETB
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Maximum collectible amount:{" "}
                  {formatCurrency(
                    selectedCashCollection.balance
                  )}
                </p>
              </div>

              {/* =================================================
                  SERVER VALIDATION NOTICE
              ================================================= */}

              <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Wallet className="size-4 text-primary" />
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      Server-controlled payment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      The displayed balance is
                      informational. The backend will
                      lock the invoice, re-check the
                      current balance, validate the cash
                      amount, record the payment and
                      update the invoice status.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={
                closeCashDialog
              }
              disabled={cashSubmitting}
            >
              Cancel
            </Button>

            <Button
              onClick={
                collectCash
              }
              disabled={
                cashSubmitting ||
                !selectedCashCollection ||
                !cashAmount ||
                Number(cashAmount) <= 0 ||
                Number(cashAmount) >
                  (selectedCashCollection?.balance ??
                    0)
              }
            >
              <Wallet className="mr-2 size-4" />

              {cashSubmitting
                ? "Collecting..."
                : "Collect Cash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}