"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  History,
  MoreHorizontal,
  Search,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* =========================================================
 * TYPES
 * ======================================================= */

type PenaltyDiscountStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "DECIDED"
  | "APPLIED"
  | "CANCELLED";

type PenaltyDiscountDecision =
  | "APPROVED"
  | "REJECTED"
  | null;

type InvoiceStatus =
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE";

type PenaltyDiscountRequest = {
  id: string;
  request_number: string;

  invoice: {
    id: string;
    invoice_number: string;
    status: InvoiceStatus;

    subtotal: number;

    penalty_amount: number;
    penalty_discount_amount: number;

    interest_amount: number;

    total_amount: number;
    paid_amount: number;
    balance_due: number;

    due_date: string;
  };

  citizen: {
    id: string;
    name: string;
    phone: string;
  };

  requested_amount: number;

  reason: string;

  status: PenaltyDiscountStatus;

  submitted_at: string | null;

  decision: PenaltyDiscountDecision;

  approved_amount: number | null;

  decision_reason: string | null;

  decided_at: string | null;

  applied_to_invoice: boolean;

  applied_at: string | null;

  applied_by: {
    id: string;
    name: string;
  } | null;

  created_by: {
    id: string;
    name: string;
  };

  decided_by: {
    id: string;
    name: string;
  } | null;

  created_at: string;
  updated_at: string;
};

/* =========================================================
 * MOCK DATA
 * ======================================================= */

const MOCK_REQUESTS: PenaltyDiscountRequest[] = [
  {
    id: "pdr-001",
    request_number: "PDR-2026-000001",

    invoice: {
      id: "inv-001",
      invoice_number: "INV-2018-000124",
      status: "OVERDUE",

      subtotal: 10000,

      penalty_amount: 2000,
      penalty_discount_amount: 800,

      interest_amount: 200,

      total_amount: 11400,
      paid_amount: 4000,
      balance_due: 7400,

      due_date: "2026-08-30",
    },

    citizen: {
      id: "cit-001",
      name: "Abdisa Gemechu",
      phone: "+251911234567",
    },

    requested_amount: 1000,

    reason:
      "The taxpayer requested a reduction of the accumulated penalty due to financial hardship and delayed business activity.",

    status: "APPLIED",

    submitted_at: "2026-09-02T09:15:00",

    decision: "APPROVED",

    approved_amount: 800,

    decision_reason:
      "The request was reviewed and an 800 ETB penalty reduction was approved based on the submitted justification.",

    decided_at: "2026-09-03T14:20:00",

    applied_to_invoice: true,

    applied_at: "2026-09-03T15:00:00",

    applied_by: {
      id: "usr-020",
      name: "Finance Officer",
    },

    created_by: {
      id: "usr-001",
      name: "Kebede Tadesse",
    },

    decided_by: {
      id: "usr-011",
      name: "Meron Bekele",
    },

    created_at: "2026-09-02T09:10:00",
    updated_at: "2026-09-03T15:00:00",
  },

  {
    id: "pdr-002",
    request_number: "PDR-2026-000002",

    invoice: {
      id: "inv-002",
      invoice_number: "INV-2018-000125",
      status: "PARTIALLY_PAID",

      subtotal: 7500,

      penalty_amount: 1200,
      penalty_discount_amount: 0,

      interest_amount: 150,

      total_amount: 8850,
      paid_amount: 3000,
      balance_due: 5850,

      due_date: "2026-08-25",
    },

    citizen: {
      id: "cit-002",
      name: "Fatuma Ali",
      phone: "+251922345678",
    },

    requested_amount: 600,

    reason:
      "The taxpayer submitted a request for penalty reduction because the payment delay was caused by temporary business closure.",

    status: "SUBMITTED",

    submitted_at: "2026-09-05T11:30:00",

    decision: null,

    approved_amount: null,

    decision_reason: null,

    decided_at: null,

    applied_to_invoice: false,

    applied_at: null,

    applied_by: null,

    created_by: {
      id: "usr-002",
      name: "Hassan Mohammed",
    },

    decided_by: null,

    created_at: "2026-09-05T10:45:00",
    updated_at: "2026-09-05T11:30:00",
  },

  {
    id: "pdr-003",
    request_number: "PDR-2026-000003",

    invoice: {
      id: "inv-003",
      invoice_number: "INV-2018-000126",
      status: "OVERDUE",

      subtotal: 15000,

      penalty_amount: 3500,
      penalty_discount_amount: 0,

      interest_amount: 350,

      total_amount: 18850,
      paid_amount: 0,
      balance_due: 18850,

      due_date: "2026-08-15",
    },

    citizen: {
      id: "cit-003",
      name: "Desta Girma",
      phone: "+251933456789",
    },

    requested_amount: 1500,

    reason:
      "The taxpayer requested penalty relief following a prolonged interruption of business operations.",

    status: "DECIDED",

    submitted_at: "2026-08-28T08:45:00",

    decision: "REJECTED",

    approved_amount: null,

    decision_reason:
      "The submitted justification did not satisfy the applicable penalty relief requirements.",

    decided_at: "2026-08-30T15:10:00",

    applied_to_invoice: false,

    applied_at: null,

    applied_by: null,

    created_by: {
      id: "usr-003",
      name: "Sara Worku",
    },

    decided_by: {
      id: "usr-012",
      name: "Daniel Kebede",
    },

    created_at: "2026-08-28T08:40:00",
    updated_at: "2026-08-30T15:10:00",
  },

  {
    id: "pdr-004",
    request_number: "PDR-2026-000004",

    invoice: {
      id: "inv-004",
      invoice_number: "INV-2018-000127",
      status: "OVERDUE",

      subtotal: 22000,

      penalty_amount: 4200,
      penalty_discount_amount: 0,

      interest_amount: 420,

      total_amount: 26620,
      paid_amount: 5000,
      balance_due: 21620,

      due_date: "2026-08-10",
    },

    citizen: {
      id: "cit-004",
      name: "Mohammed Ibrahim",
      phone: "+251944567890",
    },

    requested_amount: 2000,

    reason:
      "The taxpayer requested a penalty reduction and provided supporting documentation for review.",

    status: "DRAFT",

    submitted_at: null,

    decision: null,

    approved_amount: null,

    decision_reason: null,

    decided_at: null,

    applied_to_invoice: false,

    applied_at: null,

    applied_by: null,

    created_by: {
      id: "usr-004",
      name: "Aster Gemechu",
    },

    decided_by: null,

    created_at: "2026-09-10T13:25:00",
    updated_at: "2026-09-10T13:25:00",
  },

  {
    id: "pdr-005",
    request_number: "PDR-2026-000005",

    invoice: {
      id: "inv-005",
      invoice_number: "INV-2018-000128",
      status: "OVERDUE",

      subtotal: 12500,

      penalty_amount: 1800,
      penalty_discount_amount: 0,

      interest_amount: 180,

      total_amount: 14480,
      paid_amount: 2000,
      balance_due: 12480,

      due_date: "2026-08-20",
    },

    citizen: {
      id: "cit-005",
      name: "Hana Tesfaye",
      phone: "+251955678901",
    },

    requested_amount: 500,

    reason:
      "The taxpayer requested a partial reduction of the penalty due to delayed payment caused by temporary financial difficulties.",

    status: "CANCELLED",

    submitted_at: "2026-09-01T09:20:00",

    decision: null,

    approved_amount: null,

    decision_reason: null,

    decided_at: null,

    applied_to_invoice: false,

    applied_at: null,

    applied_by: null,

    created_by: {
      id: "usr-005",
      name: "Yonas Alemu",
    },

    decided_by: null,

    created_at: "2026-09-01T09:00:00",
    updated_at: "2026-09-04T16:30:00",
  },
];

/* =========================================================
 * HELPERS
 * ======================================================= */

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value: string | null) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
};

const formatDateTime = (value: string | null) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

/* =========================================================
 * BADGES
 * ======================================================= */

function StatusBadge({
  status,
}: {
  status: PenaltyDiscountStatus;
}) {
  const config: Record<
    PenaltyDiscountStatus,
    {
      label: string;
      icon: React.ElementType;
    }
  > = {
    DRAFT: {
      label: "Draft",
      icon: FileText,
    },

    SUBMITTED: {
      label: "Pending Decision",
      icon: Clock3,
    },

    DECIDED: {
      label: "Decided",
      icon: CheckCircle2,
    },

    APPLIED: {
      label: "Applied",
      icon: CheckCircle2,
    },

    CANCELLED: {
      label: "Cancelled",
      icon: XCircle,
    },
  };

  const current = config[status];
  const Icon = current.icon;

  return (
    <Badge variant="outline" className="gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      {current.label}
    </Badge>
  );
}

function DecisionBadge({
  decision,
}: {
  decision: PenaltyDiscountDecision;
}) {
  if (!decision) {
    return (
      <span className="text-sm text-muted-foreground">
        Pending
      </span>
    );
  }

  if (decision === "APPROVED") {
    return (
      <Badge variant="outline" className="gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Approved
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1.5">
      <XCircle className="h-3.5 w-3.5" />
      Rejected
    </Badge>
  );
}

function InvoiceStatusBadge({
  status,
}: {
  status: InvoiceStatus;
}) {
  const labels: Record<InvoiceStatus, string> = {
    ISSUED: "Issued",
    PARTIALLY_PAID: "Partially Paid",
    PAID: "Paid",
    OVERDUE: "Overdue",
  };

  return (
    <Badge variant="outline">
      {labels[status]}
    </Badge>
  );
}

/* =========================================================
 * PAGE
 * ======================================================= */

function Page() {
  const [requests, setRequests] =
    useState<PenaltyDiscountRequest[]>(MOCK_REQUESTS);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | PenaltyDiscountStatus
  >("ALL");

  const [selectedRequest, setSelectedRequest] =
    useState<PenaltyDiscountRequest | null>(null);

  const [detailsDialogOpen, setDetailsDialogOpen] =
    useState(false);

  const [decisionDialogOpen, setDecisionDialogOpen] =
    useState(false);

  const [historyDialogOpen, setHistoryDialogOpen] =
    useState(false);

  const [decision, setDecision] = useState<
    "APPROVED" | "REJECTED" | ""
  >("");

  const [approvedAmount, setApprovedAmount] =
    useState("");

  const [decisionReason, setDecisionReason] =
    useState("");

  /* =======================================================
   * FILTER
   * ===================================================== */

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search
      .toLowerCase()
      .trim();

    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        request.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        request.request_number
          .toLowerCase()
          .includes(normalizedSearch) ||
        request.invoice.invoice_number
          .toLowerCase()
          .includes(normalizedSearch) ||
        request.citizen.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        request.citizen.phone
          .toLowerCase()
          .includes(normalizedSearch) ||
        request.created_by.name
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter]);

  /* =======================================================
   * STATISTICS
   * ===================================================== */

  const statistics = useMemo(() => {
    const total = requests.length;

    const pending = requests.filter(
      (request) => request.status === "SUBMITTED",
    ).length;

    const approved = requests.filter(
      (request) =>
        request.decision === "APPROVED",
    ).length;

    const rejected = requests.filter(
      (request) =>
        request.decision === "REJECTED",
    ).length;

    const applied = requests.filter(
      (request) => request.status === "APPLIED",
    ).length;

    const approvedAmount = requests.reduce(
      (sum, request) =>
        sum + (request.approved_amount ?? 0),
      0,
    );

    return {
      total,
      pending,
      approved,
      rejected,
      applied,
      approvedAmount,
    };
  }, [requests]);

  /* =======================================================
   * ACTIONS
   * ===================================================== */

  const openDetails = (
    request: PenaltyDiscountRequest,
  ) => {
    setSelectedRequest(request);
    setDetailsDialogOpen(true);
  };

  const openDecision = (
    request: PenaltyDiscountRequest,
  ) => {
    setSelectedRequest(request);
    setDecision("");
    setApprovedAmount("");
    setDecisionReason("");
    setDecisionDialogOpen(true);
  };

  const openHistory = (
    request: PenaltyDiscountRequest,
  ) => {
    setSelectedRequest(request);
    setHistoryDialogOpen(true);
  };

  const handleDecision = () => {
    if (!selectedRequest || !decision) return;

    if (!decisionReason.trim()) return;

    const now = new Date().toISOString();

    if (decision === "APPROVED") {
      const amount = Number(approvedAmount);

      if (
        !amount ||
        amount <= 0 ||
        amount > selectedRequest.requested_amount ||
        amount >
          selectedRequest.invoice.penalty_amount -
            selectedRequest.invoice
              .penalty_discount_amount
      ) {
        return;
      }

      setRequests((current) =>
        current.map((item) =>
          item.id === selectedRequest.id
            ? {
                ...item,

                /*
                 * Important:
                 * Decision and financial application
                 * are separate events.
                 */
                status: "DECIDED",

                decision: "APPROVED",

                approved_amount: amount,

                decision_reason:
                  decisionReason.trim(),

                decided_at: now,

                applied_to_invoice: false,

                applied_at: null,

                applied_by: null,

                updated_at: now,

                decided_by: {
                  id: "current-admin",
                  name: "Current Administrator",
                },
              }
            : item,
        ),
      );
    } else {
      setRequests((current) =>
        current.map((item) =>
          item.id === selectedRequest.id
            ? {
                ...item,

                status: "DECIDED",

                decision: "REJECTED",

                approved_amount: null,

                decision_reason:
                  decisionReason.trim(),

                decided_at: now,

                applied_to_invoice: false,

                applied_at: null,

                applied_by: null,

                updated_at: now,

                decided_by: {
                  id: "current-admin",
                  name: "Current Administrator",
                },
              }
            : item,
        ),
      );
    }

    setDecisionDialogOpen(false);
    setSelectedRequest(null);
  };

  const handleApplyDiscount = (
    request: PenaltyDiscountRequest,
  ) => {
    if (
      request.status !== "DECIDED" ||
      request.decision !== "APPROVED" ||
      !request.approved_amount
    ) {
      return;
    }

    const now = new Date().toISOString();

    setRequests((current) =>
      current.map((item) => {
        if (item.id !== request.id) {
          return item;
        }

        const newPenaltyDiscount =
          item.invoice.penalty_discount_amount +
          (item.approved_amount ?? 0);

        const newTotal =
          item.invoice.subtotal +
          item.invoice.penalty_amount +
          item.invoice.interest_amount -
          newPenaltyDiscount;

        const newBalance =
          newTotal - item.invoice.paid_amount;

        return {
          ...item,

          status: "APPLIED",

          applied_to_invoice: true,

          applied_at: now,

          applied_by: {
            id: "current-finance",
            name: "Current Finance Officer",
          },

          invoice: {
            ...item.invoice,

            penalty_discount_amount:
              newPenaltyDiscount,

            total_amount: newTotal,

            balance_due: newBalance,
          },

          updated_at: now,
        };
      }),
    );
  };

  const handleSubmitDraft = (
    request: PenaltyDiscountRequest,
  ) => {
    const now = new Date().toISOString();

    setRequests((current) =>
      current.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: "SUBMITTED",
              submitted_at: now,
              updated_at: now,
            }
          : item,
      ),
    );
  };

  const handleCancelRequest = (
    request: PenaltyDiscountRequest,
  ) => {
    if (
      request.status !== "DRAFT" &&
      request.status !== "SUBMITTED"
    ) {
      return;
    }

    const now = new Date().toISOString();

    setRequests((current) =>
      current.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: "CANCELLED",
              updated_at: now,
            }
          : item,
      ),
    );
  };

  /* =======================================================
   * UI
   * ===================================================== */

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ===================================================
       * HEADER
       * ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Penalty Discount Requests
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Review, decide, and apply taxpayer penalty
            discount requests.
          </p>
        </div>

        <Button asChild>
          <Link href="./penalty-discount-requests/create">
            <FileText className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      {/* ===================================================
       * SUMMARY CARDS
       * ================================================= */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {statistics.total}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              All requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Decision
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {statistics.pending}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Approved
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {statistics.approved}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Approved requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Applied
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {statistics.applied}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Posted to invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Amount
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-xl font-semibold">
              {formatCurrency(
                statistics.approvedAmount,
              )}{" "}
              ETB
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Total approved discounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ===================================================
       * MAIN TABLE
       * ================================================= */}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>
                Request Register
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Search and manage penalty discount
                requests.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}

          <div className="mb-6 flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search request, invoice, citizen, phone, or creator..."
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(
                  value as
                    | "ALL"
                    | PenaltyDiscountStatus,
                )
              }
            >
              <SelectTrigger className="w-full lg:w-[190px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">
                  All Statuses
                </SelectItem>

                <SelectItem value="DRAFT">
                  Draft
                </SelectItem>

                <SelectItem value="SUBMITTED">
                  Pending Decision
                </SelectItem>

                <SelectItem value="DECIDED">
                  Decided
                </SelectItem>

                <SelectItem value="APPLIED">
                  Applied
                </SelectItem>

                <SelectItem value="CANCELLED">
                  Cancelled
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    Request
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    Invoice
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    Citizen
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                    Penalty
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                    Requested
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                    Approved
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    Status
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    Created
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b last:border-0 hover:bg-muted/20"
                  >
                    {/* Request */}

                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {request.request_number}
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDate(
                          request.created_at,
                        )}
                      </div>
                    </td>

                    {/* Invoice */}

                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {
                          request.invoice
                            .invoice_number
                        }
                      </div>

                      <div className="mt-1">
                        <InvoiceStatusBadge
                          status={
                            request.invoice
                              .status
                          }
                        />
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        Due{" "}
                        {formatDate(
                          request.invoice
                            .due_date,
                        )}
                      </div>
                    </td>

                    {/* Citizen */}

                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {request.citizen.name}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {request.citizen.phone}
                      </div>
                    </td>

                    {/* Penalty */}

                    <td className="px-4 py-4 text-right">
                      <div className="font-medium">
                        {formatCurrency(
                          request.invoice
                            .penalty_amount,
                        )}{" "}
                        ETB
                      </div>

                      {request.invoice
                        .penalty_discount_amount >
                        0 && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Discounted{" "}
                          {formatCurrency(
                            request.invoice
                              .penalty_discount_amount,
                          )}{" "}
                          ETB
                        </div>
                      )}
                    </td>

                    {/* Requested */}

                    <td className="px-4 py-4 text-right font-medium">
                      {formatCurrency(
                        request.requested_amount,
                      )}{" "}
                      ETB
                    </td>

                    {/* Approved */}

                    <td className="px-4 py-4 text-right">
                      {request.approved_amount !==
                      null ? (
                        <div className="font-medium">
                          {formatCurrency(
                            request.approved_amount,
                          )}{" "}
                          ETB
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          —
                        </span>
                      )}

                      {request.decision && (
                        <div className="mt-1">
                          <DecisionBadge
                            decision={
                              request.decision
                            }
                          />
                        </div>
                      )}
                    </td>

                    {/* Status */}

                    <td className="px-4 py-4">
                      <StatusBadge
                        status={request.status}
                      />

                      {request.status ===
                        "APPLIED" && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Applied{" "}
                          {formatDate(
                            request.applied_at,
                          )}
                        </div>
                      )}
                    </td>

                    {/* Created */}

                    <td className="px-4 py-4">
                      <div>
                        {formatDate(
                          request.created_at,
                        )}
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        {request.created_by.name}
                      </div>
                    </td>

                    {/* Actions */}

                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Actions for ${request.request_number}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              openDetails(request)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>

                          {request.status ===
                            "DRAFT" && (
                            <>
                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                asChild
                              >
                                <Link
                                  href={`./penalty-discount-requests/${request.id}/edit`}
                                >
                                  Edit Request
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  handleSubmitDraft(
                                    request,
                                  )
                                }
                              >
                                Submit Request
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  handleCancelRequest(
                                    request,
                                  )
                                }
                              >
                                Cancel Request
                              </DropdownMenuItem>
                            </>
                          )}

                          {request.status ===
                            "SUBMITTED" && (
                            <>
                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() =>
                                  openDecision(
                                    request,
                                  )
                                }
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Make Decision
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  handleCancelRequest(
                                    request,
                                  )
                                }
                              >
                                Cancel Request
                              </DropdownMenuItem>
                            </>
                          )}

                          {request.status ===
                            "DECIDED" &&
                            request.decision ===
                              "APPROVED" && (
                              <>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() =>
                                    handleApplyDiscount(
                                      request,
                                    )
                                  }
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Apply Discount
                                </DropdownMenuItem>
                              </>
                            )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() =>
                              openHistory(request)
                            }
                          >
                            <History className="mr-2 h-4 w-4" />
                            View History
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}

                {filteredRequests.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-16 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Search className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <div className="font-medium">
                          No requests found
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Try changing your search or
                          status filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredRequests.length} of{" "}
            {requests.length} requests
          </div>
        </CardContent>
      </Card>

      {/* ===================================================
       * DETAILS DIALOG
       * ================================================= */}

      <Dialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Penalty Discount Request
            </DialogTitle>

            <DialogDescription>
              Complete information about this penalty
              discount request.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Header */}

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  status={selectedRequest.status}
                />

                <DecisionBadge
                  decision={
                    selectedRequest.decision
                  }
                />

                {selectedRequest.applied_to_invoice && (
                  <Badge variant="outline">
                    Applied to Invoice
                  </Badge>
                )}
              </div>

              {/* Request / invoice */}

              <div className="rounded-lg border">
                <div className="border-b px-4 py-3">
                  <h3 className="font-medium">
                    Request Information
                  </h3>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Request Number
                    </div>

                    <div className="mt-1 font-medium">
                      {
                        selectedRequest.request_number
                      }
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      Invoice
                    </div>

                    <div className="mt-1 font-medium">
                      {
                        selectedRequest.invoice
                          .invoice_number
                      }
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      Citizen
                    </div>

                    <div className="mt-1 font-medium">
                      {
                        selectedRequest.citizen
                          .name
                      }
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {
                        selectedRequest.citizen
                          .phone
                      }
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      Invoice Status
                    </div>

                    <div className="mt-1">
                      <InvoiceStatusBadge
                        status={
                          selectedRequest
                            .invoice.status
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial information */}

              <div className="rounded-lg border">
                <div className="border-b px-4 py-3">
                  <h3 className="font-medium">
                    Financial Information
                  </h3>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Principal
                    </div>

                    <div className="mt-1 font-medium">
                      {formatCurrency(
                        selectedRequest.invoice
                          .subtotal,
                      )}{" "}
                      ETB
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      Penalty
                    </div>

                    <div className="mt-1 font-medium">
                      {formatCurrency(
                        selectedRequest.invoice
                          .penalty_amount,
                      )}{" "}
                      ETB
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      Existing Discount
                    </div>

                    <div className="mt-1 font-medium">
                      {formatCurrency(
                        selectedRequest.invoice
                          .penalty_discount_amount,
                      )}{" "}
                      ETB
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      Interest
                    </div>

                    <div className="mt-1 font-medium">
                      {formatCurrency(
                        selectedRequest.invoice
                          .interest_amount,
                      )}{" "}
                      ETB
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      Invoice Total
                    </div>

                    <div className="mt-1 font-medium">
                      {formatCurrency(
                        selectedRequest.invoice
                          .total_amount,
                      )}{" "}
                      ETB
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      Balance Due
                    </div>

                    <div className="mt-1 font-semibold">
                      {formatCurrency(
                        selectedRequest.invoice
                          .balance_due,
                      )}{" "}
                      ETB
                    </div>
                  </div>
                </div>
              </div>

              {/* Discount information */}

              <div className="rounded-lg border">
                <div className="border-b px-4 py-3">
                  <h3 className="font-medium">
                    Discount Request
                  </h3>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Requested Amount
                    </div>

                    <div className="mt-1 text-lg font-semibold">
                      {formatCurrency(
                        selectedRequest.requested_amount,
                      )}{" "}
                      ETB
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      Approved Amount
                    </div>

                    <div className="mt-1 text-lg font-semibold">
                      {selectedRequest.approved_amount !==
                      null
                        ? `${formatCurrency(
                            selectedRequest.approved_amount,
                          )} ETB`
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason */}

              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Request Reason
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6">
                  {selectedRequest.reason}
                </div>
              </div>

              {/* Decision */}

              {selectedRequest.decision_reason && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Decision Reason
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6">
                    {
                      selectedRequest.decision_reason
                    }
                  </div>
                </div>
              )}

              {/* Audit */}

              <div className="rounded-lg border">
                <div className="border-b px-4 py-3">
                  <h3 className="font-medium">
                    Processing Information
                  </h3>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Created By
                    </div>

                    <div className="mt-1 font-medium">
                      {
                        selectedRequest.created_by
                          .name
                      }
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(
                        selectedRequest.created_at,
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      Submitted
                    </div>

                    <div className="mt-1 font-medium">
                      {formatDateTime(
                        selectedRequest.submitted_at,
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      Decided By
                    </div>

                    <div className="mt-1 font-medium">
                      {
                        selectedRequest
                          .decided_by?.name
                      }
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(
                        selectedRequest.decided_at,
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      Applied By
                    </div>

                    <div className="mt-1 font-medium">
                      {
                        selectedRequest
                          .applied_by?.name ?? "—"
                      }
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(
                        selectedRequest.applied_at,
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDetailsDialogOpen(false)
              }
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================================================
       * DECISION DIALOG
       * ================================================= */}

      <Dialog
        open={decisionDialogOpen}
        onOpenChange={setDecisionDialogOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Make Decision
            </DialogTitle>

            <DialogDescription>
              Review the request and record the
              administrative decision.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-5">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="font-medium">
                  {
                    selectedRequest.request_number
                  }
                </div>

                <div className="mt-1 text-sm text-muted-foreground">
                  {
                    selectedRequest.invoice
                      .invoice_number
                  }{" "}
                  · {selectedRequest.citizen.name}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Current Penalty
                    </div>

                    <div className="mt-1 font-medium">
                      {formatCurrency(
                        selectedRequest.invoice
                          .penalty_amount,
                      )}{" "}
                      ETB
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      Requested
                    </div>

                    <div className="mt-1 font-medium">
                      {formatCurrency(
                        selectedRequest.requested_amount,
                      )}{" "}
                      ETB
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Decision
                </label>

                <Select
                  value={decision}
                  onValueChange={(value) =>
                    setDecision(
                      value as
                        | "APPROVED"
                        | "REJECTED",
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select decision" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="APPROVED">
                      Approve
                    </SelectItem>

                    <SelectItem value="REJECTED">
                      Reject
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {decision === "APPROVED" && (
                <div className="space-y-2">
                  <label
                    htmlFor="approved-amount"
                    className="text-sm font-medium"
                  >
                    Approved Amount
                  </label>

                  <div className="relative">
                    <Input
                      id="approved-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={approvedAmount}
                      onChange={(event) =>
                        setApprovedAmount(
                          event.target.value,
                        )
                      }
                      placeholder="0.00"
                      className="pr-14"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ETB
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Maximum requested amount:{" "}
                    {formatCurrency(
                      selectedRequest.requested_amount,
                    )}{" "}
                    ETB
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="decision-reason"
                  className="text-sm font-medium"
                >
                  Decision Reason
                </label>

                <textarea
                  id="decision-reason"
                  value={decisionReason}
                  onChange={(event) =>
                    setDecisionReason(
                      event.target.value,
                    )
                  }
                  placeholder={
                    decision === "APPROVED"
                      ? "Explain the approval decision..."
                      : "Explain the rejection decision..."
                  }
                  className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDecisionDialogOpen(false)
              }
            >
              Cancel
            </Button>

            <Button
              disabled={
                !decision ||
                !decisionReason.trim() ||
                (decision === "APPROVED" &&
                  (!Number(approvedAmount) ||
                    Number(approvedAmount) <= 0 ||
                    Number(approvedAmount) >
                      (selectedRequest?.requested_amount ??
                        0)))
              }
              onClick={handleDecision}
            >
              Save Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================================================
       * HISTORY DIALOG
       * ================================================= */}

      <Dialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Request History
            </DialogTitle>

            <DialogDescription>
              Timeline of actions performed on this
              request.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              <div>
                <div className="font-medium">
                  {
                    selectedRequest.request_number
                  }
                </div>

                <div className="text-sm text-muted-foreground">
                  {
                    selectedRequest.invoice
                      .invoice_number
                  }{" "}
                  · {selectedRequest.citizen.name}
                </div>
              </div>

              <div className="relative space-y-7 pl-7">
                <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />

                {/* Created */}

                <div className="relative">
                  <div className="absolute -left-7 top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-foreground" />

                  <div className="text-sm font-medium">
                    Request Created
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(
                      selectedRequest.created_at,
                    )}{" "}
                    ·{" "}
                    {
                      selectedRequest.created_by
                        .name
                    }
                  </div>
                </div>

                {/* Submitted */}

                {selectedRequest.submitted_at && (
                  <div className="relative">
                    <div className="absolute -left-7 top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-foreground" />

                    <div className="text-sm font-medium">
                      Request Submitted
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(
                        selectedRequest.submitted_at,
                      )}
                    </div>
                  </div>
                )}

                {/* Decision */}

                {selectedRequest.decided_at && (
                  <div className="relative">
                    <div className="absolute -left-7 top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-foreground" />

                    <div className="text-sm font-medium">
                      Decision Recorded
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {
                        selectedRequest
                          .decision
                      }{" "}
                      ·{" "}
                      {formatDateTime(
                        selectedRequest.decided_at,
                      )}
                    </div>

                    {selectedRequest
                      .approved_amount !==
                      null && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Approved amount:{" "}
                        {formatCurrency(
                          selectedRequest.approved_amount,
                        )}{" "}
                        ETB
                      </div>
                    )}
                  </div>
                )}

                {/* Applied */}

                {selectedRequest.applied_at && (
                  <div className="relative">
                    <div className="absolute -left-7 top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-foreground" />

                    <div className="text-sm font-medium">
                      Discount Applied
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(
                        selectedRequest.applied_at,
                      )}
                    </div>

                    {selectedRequest
                      .applied_by && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        By{" "}
                        {
                          selectedRequest
                            .applied_by.name
                        }
                      </div>
                    )}
                  </div>
                )}

                {/* Cancelled */}

                {selectedRequest.status ===
                  "CANCELLED" && (
                  <div className="relative">
                    <div className="absolute -left-7 top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-foreground" />

                    <div className="text-sm font-medium">
                      Request Cancelled
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(
                        selectedRequest.updated_at,
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setHistoryDialogOpen(false)
              }
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Page;