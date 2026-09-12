"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FileText,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type PenaltyDiscountStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "DECIDED"
  | "CANCELLED";

type PenaltyDiscountDecision = "APPROVED" | "REJECTED" | null;

type PenaltyDiscountRequest = {
  id: string;

  invoice: {
    id: string;
    invoice_number: string;
    status:
      | "ISSUED"
      | "PARTIALLY_PAID"
      | "PAID"
      | "OVERDUE";
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

const MOCK_REQUESTS: PenaltyDiscountRequest[] = [
  {
    id: "pdr-001",

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

    status: "DECIDED",

    submitted_at: "2026-09-02T09:15:00",

    decision: "APPROVED",
    approved_amount: 800,
    decision_reason:
      "The request was reviewed and an 800 ETB penalty reduction was approved based on the submitted justification.",

    decided_at: "2026-09-03T14:20:00",

    applied_to_invoice: true,
    applied_at: "2026-09-03T14:20:00",

    created_by: {
      id: "usr-001",
      name: "Kebede Tadesse",
    },

    decided_by: {
      id: "usr-011",
      name: "Meron Bekele",
    },

    created_at: "2026-09-02T09:10:00",
    updated_at: "2026-09-03T14:20:00",
  },

  {
    id: "pdr-002",

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

    created_by: {
      id: "usr-005",
      name: "Yonas Alemu",
    },

    decided_by: null,

    created_at: "2026-09-01T09:00:00",
    updated_at: "2026-09-04T16:30:00",
  },
];

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

function StatusBadge({
  status,
}: {
  status: PenaltyDiscountStatus;
}) {
  const config = {
    DRAFT: {
      label: "Draft",
      icon: FileText,
    },
    SUBMITTED: {
      label: "Submitted",
      icon: Clock3,
    },
    DECIDED: {
      label: "Decided",
      icon: CheckCircle2,
    },
    CANCELLED: {
      label: "Cancelled",
      icon: XCircle,
    },
  }[status];

  const Icon = config.icon;

  return (
    <Badge variant="outline" className="gap-1">
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

function DecisionBadge({
  decision,
}: {
  decision: PenaltyDiscountDecision;
}) {
  if (!decision) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (decision === "APPROVED") {
    return (
      <Badge variant="outline" className="gap-1">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Approved
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1">
      <XCircle className="h-3.5 w-3.5" />
      Rejected
    </Badge>
  );
}

function Page() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | PenaltyDiscountStatus
  >("ALL");

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return MOCK_REQUESTS.filter((request) => {
      const matchesStatus =
        statusFilter === "ALL" || request.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
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
  }, [search, statusFilter]);

  const statistics = useMemo(() => {
    const total = MOCK_REQUESTS.length;

    const submitted = MOCK_REQUESTS.filter(
      (request) => request.status === "SUBMITTED",
    ).length;

    const approved = MOCK_REQUESTS.filter(
      (request) => request.decision === "APPROVED",
    ).length;

    const rejected = MOCK_REQUESTS.filter(
      (request) => request.decision === "REJECTED",
    ).length;

    const approvedAmount = MOCK_REQUESTS.reduce(
      (sum, request) => sum + (request.approved_amount ?? 0),
      0,
    );

    return {
      total,
      submitted,
      approved,
      rejected,
      approvedAmount,
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Penalty Discount Requests
        </h1>

        <p className="text-sm text-muted-foreground">
          Manage penalty discount requests, administrative decisions, and
          approved penalty reductions.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
              {statistics.submitted}
            </div>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Rejected
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {statistics.rejected}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Amount
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {formatCurrency(statistics.approvedAmount)} ETB
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Penalty Discount Requests</CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Review taxpayer requests and administrative decisions.
              </p>
            </div>

            <Button>
              <FileText className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search invoice, citizen, phone, or creator..."
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              {(
                [
                  "ALL",
                  "DRAFT",
                  "SUBMITTED",
                  "DECIDED",
                  "CANCELLED",
                ] as const
              ).map((status) => (
                <Button
                  key={status}
                  variant={
                    statusFilter === status ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "ALL"
                    ? "All"
                    : status.charAt(0) +
                      status.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">
                    Invoice
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Citizen
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    Penalty
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    Requested
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    Approved
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
                    Decision
                  </th>

                  <th className="px-4 py-3 text-left font-medium">
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
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {request.invoice.invoice_number}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Due {formatDate(request.invoice.due_date)}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {request.citizen.name}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {request.citizen.phone}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="font-medium">
                        {formatCurrency(
                          request.invoice.penalty_amount,
                        )}{" "}
                        ETB
                      </div>

                      {request.invoice.penalty_discount_amount >
                        0 && (
                        <div className="text-xs text-muted-foreground">
                          Discounted{" "}
                          {formatCurrency(
                            request.invoice
                              .penalty_discount_amount,
                          )}{" "}
                          ETB
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right font-medium">
                      {formatCurrency(
                        request.requested_amount,
                      )}{" "}
                      ETB
                    </td>

                    <td className="px-4 py-4 text-right">
                      {request.approved_amount !== null ? (
                        <span className="font-medium">
                          {formatCurrency(
                            request.approved_amount,
                          )}{" "}
                          ETB
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={request.status} />
                    </td>

                    <td className="px-4 py-4">
                      <DecisionBadge
                        decision={request.decision}
                      />
                    </td>

                    <td className="px-4 py-4">
                      <div>
                        {formatDate(request.created_at)}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {request.created_by.name}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            View Details
                          </DropdownMenuItem>

                          {request.status === "DRAFT" && (
                            <DropdownMenuItem>
                              Submit Request
                            </DropdownMenuItem>
                          )}

                          {request.status === "SUBMITTED" && (
                            <DropdownMenuItem>
                              Make Decision
                            </DropdownMenuItem>
                          )}

                          {(request.status === "DRAFT" ||
                            request.status === "SUBMITTED") && (
                            <DropdownMenuItem>
                              Cancel Request
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem>
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
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No penalty discount requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Result count */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredRequests.length} of{" "}
            {MOCK_REQUESTS.length} requests
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Page;