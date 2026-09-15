"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FileText,
  History,
  MoreHorizontal,
  Search,
  Upload,
  X,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PenaltyDiscountStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "DECIDED"
  | "CANCELLED";

type PenaltyDiscountDecision = "APPROVED" | "REJECTED" | null;

type InvoiceStatus =
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE";

type PenaltyDiscountRequest = {
  id: string;

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

const AVAILABLE_INVOICES = [
  {
    id: "inv-new-001",
    invoice_number: "INV-2018-000129",
    status: "OVERDUE" as InvoiceStatus,
    citizen: {
      id: "cit-new-001",
      name: "Ahmed Hussein",
      phone: "+251911987654",
    },
    subtotal: 9000,
    penalty_amount: 1600,
    penalty_discount_amount: 0,
    interest_amount: 160,
    total_amount: 10760,
    paid_amount: 1500,
    balance_due: 9260,
    due_date: "2026-08-18",
  },
  {
    id: "inv-new-002",
    invoice_number: "INV-2018-000130",
    status: "OVERDUE" as InvoiceStatus,
    citizen: {
      id: "cit-new-002",
      name: "Amina Yusuf",
      phone: "+251922876543",
    },
    subtotal: 12000,
    penalty_amount: 2400,
    penalty_discount_amount: 0,
    interest_amount: 240,
    total_amount: 14640,
    paid_amount: 4000,
    balance_due: 10640,
    due_date: "2026-08-12",
  },
  {
    id: "inv-new-003",
    invoice_number: "INV-2018-000131",
    status: "PARTIALLY_PAID" as InvoiceStatus,
    citizen: {
      id: "cit-new-003",
      name: "Mulugeta Bekele",
      phone: "+251933765432",
    },
    subtotal: 18000,
    penalty_amount: 2800,
    penalty_discount_amount: 0,
    interest_amount: 280,
    total_amount: 21080,
    paid_amount: 5000,
    balance_due: 16080,
    due_date: "2026-08-22",
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

function InvoiceStatusBadge({
  status,
}: {
  status: InvoiceStatus;
}) {
  return (
    <Badge variant="outline">
      {status === "PARTIALLY_PAID"
        ? "Partially Paid"
        : status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

function Page() {
  const [requests, setRequests] =
    useState<PenaltyDiscountRequest[]>(MOCK_REQUESTS);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | PenaltyDiscountStatus
  >("ALL");

  const [invoiceSearch, setInvoiceSearch] = useState("");

  const [invoiceDialogOpen, setInvoiceDialogOpen] =
    useState(false);

  const [requestDialogOpen, setRequestDialogOpen] =
    useState(false);

  const [detailsDialogOpen, setDetailsDialogOpen] =
    useState(false);

  const [decisionDialogOpen, setDecisionDialogOpen] =
    useState(false);

  const [historyDialogOpen, setHistoryDialogOpen] =
    useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<
    (typeof AVAILABLE_INVOICES)[number] | null
  >(null);

  const [selectedRequest, setSelectedRequest] =
    useState<PenaltyDiscountRequest | null>(null);

  const [requestedAmount, setRequestedAmount] = useState("");

  const [reason, setReason] = useState("");

  const [decision, setDecision] = useState<
    "APPROVED" | "REJECTED" | ""
  >("");

  const [approvedAmount, setApprovedAmount] = useState("");

  const [decisionReason, setDecisionReason] =
    useState("");

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        request.status === statusFilter;

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
  }, [requests, search, statusFilter]);

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = invoiceSearch
      .toLowerCase()
      .trim();

    return AVAILABLE_INVOICES.filter((invoice) => {
      if (!normalizedSearch) return true;

      return (
        invoice.invoice_number
          .toLowerCase()
          .includes(normalizedSearch) ||
        invoice.citizen.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        invoice.citizen.phone
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [invoiceSearch]);

  const statistics = useMemo(() => {
    const total = requests.length;

    const submitted = requests.filter(
      (request) => request.status === "SUBMITTED",
    ).length;

    const approved = requests.filter(
      (request) => request.decision === "APPROVED",
    ).length;

    const rejected = requests.filter(
      (request) => request.decision === "REJECTED",
    ).length;

    const approvedAmount = requests.reduce(
      (sum, request) =>
        sum + (request.approved_amount ?? 0),
      0,
    );

    return {
      total,
      submitted,
      approved,
      rejected,
      approvedAmount,
    };
  }, [requests]);

  const resetRequestForm = () => {
    setSelectedInvoice(null);
    setRequestedAmount("");
    setReason("");
    setInvoiceSearch("");
  };

  const handleSelectInvoice = (
    invoice: (typeof AVAILABLE_INVOICES)[number],
  ) => {
    setSelectedInvoice(invoice);
    setInvoiceDialogOpen(false);
    setRequestedAmount("");
    setReason("");
    setRequestDialogOpen(true);
  };

  const handleSaveDraft = () => {
    if (!selectedInvoice) return;

    const amount = Number(requestedAmount);

    if (!amount || amount <= 0 || amount > selectedInvoice.penalty_amount) {
      return;
    }

    if (!reason.trim()) {
      return;
    }

    const now = new Date().toISOString();

    const newRequest: PenaltyDiscountRequest = {
      id: `pdr-${Date.now()}`,

      invoice: {
        id: selectedInvoice.id,
        invoice_number: selectedInvoice.invoice_number,
        status: selectedInvoice.status,
        subtotal: selectedInvoice.subtotal,
        penalty_amount: selectedInvoice.penalty_amount,
        penalty_discount_amount:
          selectedInvoice.penalty_discount_amount,
        interest_amount: selectedInvoice.interest_amount,
        total_amount: selectedInvoice.total_amount,
        paid_amount: selectedInvoice.paid_amount,
        balance_due: selectedInvoice.balance_due,
        due_date: selectedInvoice.due_date,
      },

      citizen: selectedInvoice.citizen,

      requested_amount: amount,
      reason: reason.trim(),

      status: "DRAFT",

      submitted_at: null,

      decision: null,
      approved_amount: null,
      decision_reason: null,

      decided_at: null,

      applied_to_invoice: false,
      applied_at: null,

      created_by: {
        id: "current-user",
        name: "Current Officer",
      },

      decided_by: null,

      created_at: now,
      updated_at: now,
    };

    setRequests((current) => [
      newRequest,
      ...current,
    ]);

    setRequestDialogOpen(false);
    resetRequestForm();
  };

  const handleSubmitRequest = () => {
    if (!selectedInvoice) return;

    const amount = Number(requestedAmount);

    if (!amount || amount <= 0 || amount > selectedInvoice.penalty_amount) {
      return;
    }

    if (!reason.trim()) {
      return;
    }

    const now = new Date().toISOString();

    const newRequest: PenaltyDiscountRequest = {
      id: `pdr-${Date.now()}`,

      invoice: {
        id: selectedInvoice.id,
        invoice_number: selectedInvoice.invoice_number,
        status: selectedInvoice.status,
        subtotal: selectedInvoice.subtotal,
        penalty_amount: selectedInvoice.penalty_amount,
        penalty_discount_amount:
          selectedInvoice.penalty_discount_amount,
        interest_amount: selectedInvoice.interest_amount,
        total_amount: selectedInvoice.total_amount,
        paid_amount: selectedInvoice.paid_amount,
        balance_due: selectedInvoice.balance_due,
        due_date: selectedInvoice.due_date,
      },

      citizen: selectedInvoice.citizen,

      requested_amount: amount,
      reason: reason.trim(),

      status: "SUBMITTED",

      submitted_at: now,

      decision: null,
      approved_amount: null,
      decision_reason: null,

      decided_at: null,

      applied_to_invoice: false,
      applied_at: null,

      created_by: {
        id: "current-user",
        name: "Current Officer",
      },

      decided_by: null,

      created_at: now,
      updated_at: now,
    };

    setRequests((current) => [
      newRequest,
      ...current,
    ]);

    setRequestDialogOpen(false);
    resetRequestForm();
  };

  const handleSubmitDraft = (
    request: PenaltyDiscountRequest,
  ) => {
    setRequests((current) =>
      current.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: "SUBMITTED",
              submitted_at:
                new Date().toISOString(),
              updated_at:
                new Date().toISOString(),
            }
          : item,
      ),
    );
  };

  const handleCancelRequest = (
    request: PenaltyDiscountRequest,
  ) => {
    setRequests((current) =>
      current.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: "CANCELLED",
              updated_at:
                new Date().toISOString(),
            }
          : item,
      ),
    );
  };

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
        amount > selectedRequest.invoice.penalty_amount
      ) {
        return;
      }

      setRequests((current) =>
        current.map((item) =>
          item.id === selectedRequest.id
            ? {
                ...item,
                status: "DECIDED",
                decision: "APPROVED",
                approved_amount: amount,
                decision_reason:
                  decisionReason.trim(),
                decided_at: now,
                applied_to_invoice: true,
                applied_at: now,
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

  const requestAmountNumber = Number(
    requestedAmount || 0,
  );

  const requestedAmountError =
    selectedInvoice &&
    requestAmountNumber > selectedInvoice.penalty_amount;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Penalty Discount Requests
        </h1>

        <p className="text-sm text-muted-foreground">
          Manage penalty discount requests, administrative
          decisions, and approved penalty reductions.
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
              {formatCurrency(
                statistics.approvedAmount,
              )}{" "}
              ETB
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>
                Penalty Discount Requests
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Review taxpayer requests and
                administrative decisions.
              </p>
            </div>

            <Button
              onClick={() => {
                setInvoiceSearch("");
                setInvoiceDialogOpen(true);
              }}
            >
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
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search invoice, citizen, phone, or creator..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
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
                    statusFilter === status
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setStatusFilter(status)
                  }
                >
                  {status === "ALL"
                    ? "All"
                    : status.charAt(0) +
                      status
                        .slice(1)
                        .toLowerCase()}
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
                          request.invoice
                            .penalty_amount,
                        )}{" "}
                        ETB
                      </div>

                      {request.invoice
                        .penalty_discount_amount >
                        0 && (
                        <div className="text-xs text-muted-foreground">
                          Applied{" "}
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
                      {request.approved_amount !==
                      null ? (
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
                      <StatusBadge
                        status={request.status}
                      />

                      {request.applied_to_invoice && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Applied to invoice
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <DecisionBadge
                        decision={request.decision}
                      />
                    </td>

                    <td className="px-4 py-4">
                      <div>
                        {formatDate(
                          request.created_at,
                        )}
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
                          <DropdownMenuItem
                            onClick={() =>
                              openDetails(request)
                            }
                          >
                            View Details
                          </DropdownMenuItem>

                          {request.status ===
                            "DRAFT" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleSubmitDraft(
                                  request,
                                )
                              }
                            >
                              Submit Request
                            </DropdownMenuItem>
                          )}

                          {request.status ===
                            "SUBMITTED" && (
                            <DropdownMenuItem
                              onClick={() =>
                                openDecision(
                                  request,
                                )
                              }
                            >
                              Make Decision
                            </DropdownMenuItem>
                          )}

                          {(request.status ===
                            "DRAFT" ||
                            request.status ===
                              "SUBMITTED") && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleCancelRequest(
                                  request,
                                )
                              }
                            >
                              Cancel Request
                            </DropdownMenuItem>
                          )}

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
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No penalty discount requests
                      found.
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

      {/* ========================================================= */}
      {/* SELECT INVOICE DIALOG                                    */}
      {/* ========================================================= */}

      <Dialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Select Invoice
            </DialogTitle>

            <DialogDescription>
              Select an existing invoice to create the
              penalty discount request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={invoiceSearch}
                onChange={(event) =>
                  setInvoiceSearch(event.target.value)
                }
                placeholder="Search invoice, citizen, or phone..."
                className="pl-9"
              />
            </div>

            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {filteredInvoices.map((invoice) => (
                <button
                  key={invoice.id}
                  type="button"
                  onClick={() =>
                    handleSelectInvoice(invoice)
                  }
                  className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium">
                        {invoice.invoice_number}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {invoice.citizen.name} ·{" "}
                        {invoice.citizen.phone}
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">
                        Due{" "}
                        {formatDate(
                          invoice.due_date,
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <InvoiceStatusBadge
                        status={invoice.status}
                      />

                      <div className="mt-2 font-medium">
                        {formatCurrency(
                          invoice.penalty_amount,
                        )}{" "}
                        ETB
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Available penalty
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {filteredInvoices.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No eligible invoices found.
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setInvoiceDialogOpen(false)
              }
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* REQUEST FORM DIALOG                                      */}
      {/* ========================================================= */}

      <Dialog
        open={requestDialogOpen}
        onOpenChange={(open) => {
          setRequestDialogOpen(open);

          if (!open) {
            resetRequestForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Request Penalty Discount
            </DialogTitle>

            <DialogDescription>
              Create a penalty discount request for the
              selected invoice.
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice summary */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Invoice
                    </div>

                    <div className="font-semibold">
                      {
                        selectedInvoice.invoice_number
                      }
                    </div>

                    <div className="mt-1 text-sm text-muted-foreground">
                      {selectedInvoice.citizen.name} ·{" "}
                      {selectedInvoice.citizen.phone}
                    </div>
                  </div>

                  <InvoiceStatusBadge
                    status={selectedInvoice.status}
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Principal
                    </div>

                    <div className="font-medium">
                      {formatCurrency(
                        selectedInvoice.subtotal,
                      )}{" "}
                      ETB
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      Current Penalty
                    </div>

                    <div className="font-medium">
                      {formatCurrency(
                        selectedInvoice.penalty_amount,
                      )}{" "}
                      ETB
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">
                      Balance Due
                    </div>

                    <div className="font-medium">
                      {formatCurrency(
                        selectedInvoice.balance_due,
                      )}{" "}
                      ETB
                    </div>
                  </div>
                </div>
              </div>

              {/* Requested amount */}
              <div className="space-y-2">
                <Label htmlFor="requested-amount">
                  Requested Discount Amount{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </Label>

                <div className="relative">
                  <Input
                    id="requested-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={requestedAmount}
                    onChange={(event) =>
                      setRequestedAmount(
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

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Maximum available penalty
                  </span>

                  <span>
                    {formatCurrency(
                      selectedInvoice.penalty_amount,
                    )}{" "}
                    ETB
                  </span>
                </div>

                {requestedAmountError && (
                  <p className="text-sm text-destructive">
                    Requested amount cannot exceed the
                    current penalty amount.
                  </p>
                )}
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Reason{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </Label>

                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(event) =>
                    setReason(event.target.value)
                  }
                  placeholder="Explain why the penalty discount is being requested..."
                  className="min-h-[120px]"
                />

                <p className="text-xs text-muted-foreground">
                  Provide a clear administrative
                  justification for the request.
                </p>
              </div>

              {/* Supporting document */}
              <div className="space-y-2">
                <Label>
                  Supporting Documents
                </Label>

                <div className="rounded-lg border border-dashed p-5">
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <Upload className="h-5 w-5 text-muted-foreground" />

                    <div className="text-sm font-medium">
                      Upload supporting document
                    </div>

                    <div className="text-xs text-muted-foreground">
                      PDF, JPG, or PNG
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                    >
                      Select File
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRequestDialogOpen(false)
              }
            >
              Cancel
            </Button>

            <Button
              variant="outline"
              disabled={
                !selectedInvoice ||
                !requestAmountNumber ||
                requestAmountNumber <= 0 ||
                !!requestedAmountError ||
                !reason.trim()
              }
              onClick={handleSaveDraft}
            >
              Save Draft
            </Button>

            <Button
              disabled={
                !selectedInvoice ||
                !requestAmountNumber ||
                requestAmountNumber <= 0 ||
                !!requestedAmountError ||
                !reason.trim()
              }
              onClick={handleSubmitRequest}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DETAILS DIALOG                                           */}
      {/* ========================================================= */}

      <Dialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Penalty Discount Request
            </DialogTitle>

            <DialogDescription>
              Review the complete request and its current
              decision state.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  status={selectedRequest.status}
                />

                <DecisionBadge
                  decision={selectedRequest.decision}
                />

                {selectedRequest.applied_to_invoice && (
                  <Badge variant="outline">
                    Applied to Invoice
                  </Badge>
                )}
              </div>

              <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Invoice
                  </div>

                  <div className="font-medium">
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

                  <div className="font-medium">
                    {selectedRequest.citizen.name}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {selectedRequest.citizen.phone}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">
                    Current Penalty
                  </div>

                  <div className="font-medium">
                    {formatCurrency(
                      selectedRequest.invoice
                        .penalty_amount,
                    )}{" "}
                    ETB
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">
                    Requested Amount
                  </div>

                  <div className="font-medium">
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

                  <div className="font-medium">
                    {selectedRequest.approved_amount !==
                    null
                      ? `${formatCurrency(
                          selectedRequest.approved_amount,
                        )} ETB`
                      : "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">
                    Created
                  </div>

                  <div className="font-medium">
                    {formatDate(
                      selectedRequest.created_at,
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Reason
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6">
                  {selectedRequest.reason}
                </div>
              </div>

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

              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Created By
                  </div>

                  <div className="font-medium">
                    {
                      selectedRequest.created_by
                        .name
                    }
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">
                    Decided By
                  </div>

                  <div className="font-medium">
                    {selectedRequest.decided_by
                      ?.name ?? "—"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">
                    Submitted
                  </div>

                  <div className="font-medium">
                    {formatDate(
                      selectedRequest.submitted_at,
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">
                    Decided
                  </div>

                  <div className="font-medium">
                    {formatDate(
                      selectedRequest.decided_at,
                    )}
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

      {/* ========================================================= */}
      {/* DECISION DIALOG                                          */}
      {/* ========================================================= */}

      <Dialog
        open={decisionDialogOpen}
        onOpenChange={setDecisionDialogOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Make Penalty Discount Decision
            </DialogTitle>

            <DialogDescription>
              Review the request and record the
              administrative decision.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-5">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-sm font-medium">
                  {
                    selectedRequest.invoice
                      .invoice_number
                  }
                </div>

                <div className="mt-1 text-sm text-muted-foreground">
                  {selectedRequest.citizen.name}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Penalty
                    </div>

                    <div className="font-medium">
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

                    <div className="font-medium">
                      {formatCurrency(
                        selectedRequest.requested_amount,
                      )}{" "}
                      ETB
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Decision</Label>

                <Select
                  value={decision}
                  onValueChange={(
                    value:
                      | "APPROVED"
                      | "REJECTED",
                  ) => setDecision(value)}
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
                  <Label htmlFor="approved-amount">
                    Approved Amount
                  </Label>

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
                    Maximum approved amount:{" "}
                    {formatCurrency(
                      selectedRequest.requested_amount,
                    )}{" "}
                    ETB
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="decision-reason">
                  Decision Reason
                </Label>

                <Textarea
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
                  className="min-h-[110px]"
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

      {/* ========================================================= */}
      {/* HISTORY DIALOG                                           */}
      {/* ========================================================= */}

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
            <div className="space-y-5">
              <div>
                <div className="font-medium">
                  {
                    selectedRequest.invoice
                      .invoice_number
                  }
                </div>

                <div className="text-sm text-muted-foreground">
                  {selectedRequest.citizen.name}
                </div>
              </div>

              <div className="relative space-y-6 pl-6">
                <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />

                <div className="relative">
                  <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-foreground" />

                  <div className="text-sm font-medium">
                    Request Created
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {formatDate(
                      selectedRequest.created_at,
                    )}{" "}
                    ·{" "}
                    {
                      selectedRequest.created_by
                        .name
                    }
                  </div>
                </div>

                {selectedRequest.submitted_at && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-foreground" />

                    <div className="text-sm font-medium">
                      Request Submitted
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {formatDate(
                        selectedRequest.submitted_at,
                      )}
                    </div>
                  </div>
                )}

                {selectedRequest.decided_at && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-foreground" />

                    <div className="text-sm font-medium">
                      Decision Recorded
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {
                        selectedRequest
                          .decision
                      }{" "}
                      ·{" "}
                      {formatDate(
                        selectedRequest.decided_at,
                      )}
                    </div>
                  </div>
                )}

                {selectedRequest.applied_to_invoice &&
                  selectedRequest.applied_at && (
                    <div className="relative">
                      <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-foreground" />

                      <div className="text-sm font-medium">
                        Discount Applied to
                        Invoice
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {formatDate(
                          selectedRequest.applied_at,
                        )}
                      </div>
                    </div>
                  )}

                {selectedRequest.status ===
                  "CANCELLED" && (
                  <div className="relative">
                    <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-foreground" />

                    <div className="text-sm font-medium">
                      Request Cancelled
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {formatDate(
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
