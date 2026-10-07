"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileText,
  History,
  LandPlot,
  Loader2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

/* ============================================================================
 * Configuration
 * ========================================================================== */

const USE_MOCK_DATA = true;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const API_ENDPOINT = `${API_BASE_URL}/api/v1/lease-amendments`;

const PAGE_SIZE = 10;

/* ============================================================================
 * Types
 * ========================================================================== */

type AmendmentType =
  | "NAME_TRANSFER"
  | "LAND_AREA_CHANGE"
  | "PARTIAL_TRANSFER"
  | "MERGE";

type AmendmentStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "APPLIED"
  | "CANCELLED";

type FinancialImpact = {
  affectsFutureAssessment: boolean;
  affectsPaymentSchedule: boolean;
  message: string;
};

type AmendmentChange = {
  id: string;
  fieldName: string;
  valueType: string;
  oldValue?: unknown;
  newValue?: unknown;
  measurementUnit?: string | null;
  reason?: string | null;
  changeOrder: number;
};

type AmendmentDocument = {
  id: string;
  name: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
};

type AmendmentTimeline = {
  createdAt: string;
  createdBy: string;

  submittedAt?: string | null;

  decidedAt?: string | null;
  decidedBy?: string | null;

  appliedAt?: string | null;
  appliedBy?: string | null;

  rejectedAt?: string | null;
  rejectedBy?: string | null;

  rejectionReason?: string | null;
};

type Amendment = {
  id: string;

  amendmentNumber: string;

  /*
   * The amendment is based on an existing assessment.
   *
   * There is intentionally NO leaseAgreementNumber.
   */
  assessmentNumber: string;

  /*
   * Populated only when an independent replacement assessment
   * has actually been created.
   */
  newAssessmentNumber?: string | null;

  taxpayer: string;

  type: AmendmentType;
  status: AmendmentStatus;

  reason: string;

  previousCitizen?: string | null;
  newCitizen?: string | null;

  previousLandArea?: number | null;
  newLandArea?: number | null;

  transferredArea?: number | null;
  remainingArea?: number | null;

  /*
   * MERGE:
   *
   * Current Land + Other Land = Combined Land
   *
   * Other Land is entered manually by the officer.
   */
  otherLandArea?: number | null;
  resultingArea?: number | null;

  measurementUnit?: string | null;

  financialImpact: FinancialImpact;

  documents: AmendmentDocument[];

  changes: AmendmentChange[];

  timeline: AmendmentTimeline;

  createdAt: string;
  updatedAt?: string;
};

type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
};

type PaginatedResponse = {
  data: Amendment[];
  meta: PaginationMeta;
};

type FilterValue = "ALL" | AmendmentType | AmendmentStatus;

type AmendmentAction =
  | "submit"
  | "approve"
  | "reject"
  | "apply"
  | "cancel";

/* ============================================================================
 * Mock Data
 * ========================================================================== */

const INITIAL_MOCK_AMENDMENTS: Amendment[] = [
  {
    id: "01-amendment",
    amendmentNumber: "AMND-2026-000018",
    assessmentNumber: "ASM-2026-00321",

    taxpayer: "Abebe Kebede",

    type: "LAND_AREA_CHANGE",
    status: "PENDING_APPROVAL",

    createdAt: "2026-09-28T09:20:00",
    updatedAt: "2026-09-29T14:15:00",

    reason:
      "Land measurement was updated following an official cadastral survey.",

    previousLandArea: 200,
    newLandArea: 500,
    measurementUnit: "m²",

    documents: [
      {
        id: "doc-001",
        name: "updated-cadastral-survey.pdf",
        originalName: "Updated Cadastral Survey.pdf",
        mimeType: "application/pdf",
        size: 2457600,
        uploadedAt: "2026-09-28T09:15:00",
      },
    ],

    changes: [
      {
        id: "change-001",
        fieldName: "LAND_AREA",
        valueType: "DECIMAL",
        oldValue: 200,
        newValue: 500,
        measurementUnit: "m²",
        reason: "Updated according to the official cadastral survey.",
        changeOrder: 1,
      },
    ],

    timeline: {
      createdAt: "2026-09-28T09:20:00",
      createdBy: "Registration Officer",
      submittedAt: "2026-09-29T14:15:00",
    },

    financialImpact: {
      affectsFutureAssessment: true,
      affectsPaymentSchedule: true,
      message:
        "The changed land area will be considered when a new independent assessment is created. The historical assessment and its financial records remain unchanged.",
    },
  },

  {
    id: "02-amendment",
    amendmentNumber: "AMND-2026-000017",
    assessmentNumber: "ASM-2026-00287",

    taxpayer: "Kebede Tesfaye",

    type: "NAME_TRANSFER",
    status: "APPROVED",

    createdAt: "2026-09-25T11:10:00",
    updatedAt: "2026-09-28T15:40:00",

    reason:
      "Legal ownership transfer based on the submitted transfer document.",

    previousCitizen: "Kebede Tesfaye",
    newCitizen: "Hanna Bekele",

    documents: [
      {
        id: "doc-002",
        name: "ownership-transfer.pdf",
        originalName: "Ownership Transfer.pdf",
        mimeType: "application/pdf",
        size: 1850000,
        uploadedAt: "2026-09-25T11:00:00",
      },
    ],

    changes: [
      {
        id: "change-002",
        fieldName: "CITIZEN",
        valueType: "UUID",
        oldValue: "Kebede Tesfaye",
        newValue: "Hanna Bekele",
        reason: "Legal transfer of ownership.",
        changeOrder: 1,
      },
    ],

    timeline: {
      createdAt: "2026-09-25T11:10:00",
      createdBy: "Registration Officer",
      submittedAt: "2026-09-26T10:30:00",
      decidedAt: "2026-09-28T15:40:00",
      decidedBy: "Revenue Decision Officer",
    },

    financialImpact: {
      affectsFutureAssessment: false,
      affectsPaymentSchedule: false,
      message:
        "The taxpayer changes, but historical assessment and payment records remain unchanged.",
    },
  },

  {
    id: "03-amendment",
    amendmentNumber: "AMND-2026-000016",
    assessmentNumber: "ASM-2026-00176",

    taxpayer: "Mohammed Ahmed",

    type: "PARTIAL_TRANSFER",
    status: "APPLIED",

    createdAt: "2026-09-18T08:40:00",
    updatedAt: "2026-09-22T10:15:00",

    reason:
      "Partial transfer of a portion of the land to another taxpayer.",

    previousCitizen: "Mohammed Ahmed",
    newCitizen: "Yasin Ali",

    previousLandArea: 800,
    transferredArea: 200,
    remainingArea: 600,

    measurementUnit: "m²",

    newAssessmentNumber: null,

    documents: [
      {
        id: "doc-003",
        name: "partial-land-transfer.pdf",
        originalName: "Partial Land Transfer.pdf",
        mimeType: "application/pdf",
        size: 3200000,
        uploadedAt: "2026-09-18T08:30:00",
      },
    ],

    changes: [
      {
        id: "change-003",
        fieldName: "LAND_AREA",
        valueType: "DECIMAL",
        oldValue: 800,
        newValue: 600,
        measurementUnit: "m²",
        reason: "Remaining area after transferring 200 m².",
        changeOrder: 1,
      },
      {
        id: "change-004",
        fieldName: "CITIZEN",
        valueType: "UUID",
        oldValue: "Mohammed Ahmed",
        newValue: "Yasin Ali",
        reason: "Transferred portion assigned to the new taxpayer.",
        changeOrder: 2,
      },
    ],

    timeline: {
      createdAt: "2026-09-18T08:40:00",
      createdBy: "Registration Officer",
      submittedAt: "2026-09-19T09:10:00",
      decidedAt: "2026-09-21T13:00:00",
      decidedBy: "Revenue Decision Officer",
      appliedAt: "2026-09-22T10:15:00",
      appliedBy: "Revenue Officer",
    },

    financialImpact: {
      affectsFutureAssessment: true,
      affectsPaymentSchedule: true,
      message:
        "The remaining 600 m² will be considered when the responsible revenue officer creates an independent replacement assessment. Historical financial records remain unchanged.",
    },
  },

  {
    id: "04-amendment",
    amendmentNumber: "AMND-2026-000015",
    assessmentNumber: "ASM-2026-00152",

    taxpayer: "Sara Worku",

    type: "MERGE",
    status: "APPROVED",

    createdAt: "2026-09-15T10:30:00",
    updatedAt: "2026-09-18T14:20:00",

    reason:
      "Additional land area was legally consolidated with the existing land record.",

    previousLandArea: 300,

    /*
     * Manually entered by the officer.
     */
    otherLandArea: 200,

    resultingArea: 500,

    measurementUnit: "m²",

    documents: [
      {
        id: "doc-004",
        name: "land-consolidation-certificate.pdf",
        originalName: "Land Consolidation Certificate.pdf",
        mimeType: "application/pdf",
        size: 2800000,
        uploadedAt: "2026-09-15T10:20:00",
      },
    ],

    changes: [
      {
        id: "change-005",
        fieldName: "LAND_AREA",
        valueType: "DECIMAL",
        oldValue: 300,
        newValue: 500,
        measurementUnit: "m²",
        reason: "300 m² current land plus 200 m² other land.",
        changeOrder: 1,
      },
    ],

    timeline: {
      createdAt: "2026-09-15T10:30:00",
      createdBy: "Registration Officer",
      submittedAt: "2026-09-16T11:00:00",
      decidedAt: "2026-09-18T14:20:00",
      decidedBy: "Revenue Decision Officer",
    },

    financialImpact: {
      affectsFutureAssessment: true,
      affectsPaymentSchedule: true,
      message:
        "The combined land area will be used when an independent replacement assessment is created. The previous assessment remains historical and is not recalculated.",
    },
  },

  {
    id: "05-amendment",
    amendmentNumber: "AMND-2026-000014",
    assessmentNumber: "ASM-2026-00074",

    taxpayer: "Tadesse Bekele",

    type: "LAND_AREA_CHANGE",
    status: "REJECTED",

    createdAt: "2026-09-10T08:15:00",
    updatedAt: "2026-09-13T16:10:00",

    reason:
      "Requested area does not match the submitted cadastral document.",

    previousLandArea: 1000,
    newLandArea: 700,

    measurementUnit: "m²",

    documents: [
      {
        id: "doc-005",
        name: "cadastral-document.pdf",
        originalName: "Cadastral Document.pdf",
        mimeType: "application/pdf",
        size: 1900000,
        uploadedAt: "2026-09-10T08:10:00",
      },
    ],

    changes: [
      {
        id: "change-006",
        fieldName: "LAND_AREA",
        valueType: "DECIMAL",
        oldValue: 1000,
        newValue: 700,
        measurementUnit: "m²",
        reason: "Requested land area change.",
        changeOrder: 1,
      },
    ],

    timeline: {
      createdAt: "2026-09-10T08:15:00",
      createdBy: "Registration Officer",
      submittedAt: "2026-09-11T09:20:00",
      decidedAt: "2026-09-13T16:10:00",
      decidedBy: "Revenue Decision Officer",
      rejectedAt: "2026-09-13T16:10:00",
      rejectedBy: "Revenue Decision Officer",
      rejectionReason:
        "Requested area does not match the submitted cadastral document.",
    },

    financialImpact: {
      affectsFutureAssessment: false,
      affectsPaymentSchedule: false,
      message:
        "No financial change was applied because the amendment was rejected.",
    },
  },

  {
    id: "06-amendment",
    amendmentNumber: "AMND-2026-000013",
    assessmentNumber: "ASM-2026-00501",

    taxpayer: "Aster Haile",

    type: "NAME_TRANSFER",
    status: "DRAFT",

    createdAt: "2026-09-30T10:05:00",

    reason: "Transfer of ownership.",

    previousCitizen: "Aster Haile",
    newCitizen: "Samuel Haile",

    documents: [
      {
        id: "doc-006",
        name: "transfer-agreement.pdf",
        originalName: "Transfer Agreement.pdf",
        mimeType: "application/pdf",
        size: 1600000,
        uploadedAt: "2026-09-30T10:00:00",
      },
    ],

    changes: [
      {
        id: "change-007",
        fieldName: "CITIZEN",
        valueType: "UUID",
        oldValue: "Aster Haile",
        newValue: "Samuel Haile",
        reason: "Transfer of ownership.",
        changeOrder: 1,
      },
    ],

    timeline: {
      createdAt: "2026-09-30T10:05:00",
      createdBy: "Registration Officer",
    },

    financialImpact: {
      affectsFutureAssessment: false,
      affectsPaymentSchedule: false,
      message:
        "The amendment is still a draft. No historical financial record has been changed.",
    },
  },

  {
    id: "07-amendment",
    amendmentNumber: "AMND-2026-000012",
    assessmentNumber: "ASM-2026-00091",

    taxpayer: "Bekele Girma",

    type: "PARTIAL_TRANSFER",
    status: "APPLIED",

    createdAt: "2026-08-20T09:30:00",
    updatedAt: "2026-08-25T09:15:00",

    reason: "Partial land transfer.",

    previousCitizen: "Bekele Girma",
    newCitizen: "Mekdes Alemu",

    previousLandArea: 600,
    transferredArea: 250,
    remainingArea: 350,

    measurementUnit: "m²",

    newAssessmentNumber: null,

    documents: [],

    changes: [
      {
        id: "change-008",
        fieldName: "LAND_AREA",
        valueType: "DECIMAL",
        oldValue: 600,
        newValue: 350,
        measurementUnit: "m²",
        reason: "Remaining area after partial transfer.",
        changeOrder: 1,
      },
    ],

    timeline: {
      createdAt: "2026-08-20T09:30:00",
      createdBy: "Registration Officer",
      submittedAt: "2026-08-21T10:00:00",
      decidedAt: "2026-08-24T14:30:00",
      decidedBy: "Revenue Decision Officer",
      appliedAt: "2026-08-25T09:15:00",
      appliedBy: "Revenue Officer",
    },

    financialImpact: {
      affectsFutureAssessment: true,
      affectsPaymentSchedule: true,
      message:
        "The remaining 350 m² will be used when an independent replacement assessment is created. Historical financial records are preserved.",
    },
  },
];

/*
 * Mutable mock store.
 *
 * This allows mock actions such as Approve, Reject and Apply
 * to behave like the real application instead of only showing
 * a toast message.
 */
let mockAmendments = INITIAL_MOCK_AMENDMENTS;

/* ============================================================================
 * Labels
 * ========================================================================== */

const TYPE_LABELS: Record<AmendmentType, string> = {
  NAME_TRANSFER: "Name Transfer",
  LAND_AREA_CHANGE: "Land Area Change",
  PARTIAL_TRANSFER: "Partial Transfer",
  MERGE: "Land Merge",
};

const STATUS_LABELS: Record<AmendmentStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  APPLIED: "Applied",
  CANCELLED: "Cancelled",
};

/* ============================================================================
 * Helpers
 * ========================================================================== */

function getTypeLabel(type: AmendmentType) {
  return TYPE_LABELS[type];
}

function getStatusLabel(status: AmendmentStatus) {
  return STATUS_LABELS[status];
}

function formatNumber(value?: number | null) {
  if (value === undefined || value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatFileSize(bytes?: number) {
  if (!bytes) {
    return "—";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ============================================================================
 * Change Summary
 * ========================================================================== */

function getChangeSummary(amendment: Amendment) {
  const unit = amendment.measurementUnit || "m²";

  switch (amendment.type) {
    case "NAME_TRANSFER":
      return (
        <div className="flex min-w-[210px] items-center gap-2">
          <span className="truncate">
            {amendment.previousCitizen || "—"}
          </span>

          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

          <span className="truncate font-medium text-primary">
            {amendment.newCitizen || "—"}
          </span>
        </div>
      );

    case "LAND_AREA_CHANGE":
      return (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span>
            {formatNumber(amendment.previousLandArea)} {unit}
          </span>

          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

          <span className="font-medium">
            {formatNumber(amendment.newLandArea)} {unit}
          </span>
        </div>
      );

    case "PARTIAL_TRANSFER":
      return (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span>
            {formatNumber(amendment.transferredArea)} {unit}
          </span>

          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

          <span className="font-medium">
            {formatNumber(amendment.remainingArea)} {unit} remaining
          </span>
        </div>
      );

    case "MERGE":
      return (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span>
            {formatNumber(amendment.previousLandArea)} {unit}
          </span>

          <span className="text-muted-foreground">+</span>

          <span>
            {formatNumber(amendment.otherLandArea)} {unit}
          </span>

          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

          <span className="font-medium text-emerald-600">
            {formatNumber(amendment.resultingArea)} {unit}
          </span>
        </div>
      );
  }
}

/* ============================================================================
 * Status Badge
 * ========================================================================== */

function StatusBadge({
  status,
}: {
  status: AmendmentStatus;
}) {
  const styles: Record<AmendmentStatus, string> = {
    DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
    PENDING_APPROVAL: "bg-amber-50 text-amber-700 border-amber-200",
    APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    APPLIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <Badge
      variant="outline"
      className={`font-medium ${styles[status]}`}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}

/* ============================================================================
 * Detail Row
 * ========================================================================== */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[145px_1fr] gap-4 py-2.5">
      <div className="text-sm text-muted-foreground">{label}</div>

      <div className="min-w-0 text-sm font-medium">
        {value ?? "—"}
      </div>
    </div>
  );
}

/* ============================================================================
 * Timeline Item
 * ========================================================================== */

function TimelineItem({
  title,
  date,
  description,
  active = true,
  icon,
}: {
  title: string;
  date?: string | null;
  description?: string;
  active?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative flex gap-3">
      <div
        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
          active
            ? "border-primary/20 bg-primary/10 text-primary"
            : "border-muted bg-muted/40 text-muted-foreground"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1 pb-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{title}</p>

          {date && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDateTime(date)}
            </span>
          )}
        </div>

        {description && (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
 * Amendment Change Details
 * ========================================================================== */

function AmendmentChangeDetails({
  amendment,
}: {
  amendment: Amendment;
}) {
  const unit = amendment.measurementUnit || "m²";

  if (amendment.type === "NAME_TRANSFER") {
    return (
      <Card className="shadow-none">
        <CardContent className="p-4">
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div>
                <p className="text-xs text-muted-foreground">
                  Previous Taxpayer
                </p>

                <p className="mt-1 font-semibold">
                  {amendment.previousCitizen || "—"}
                </p>
              </div>

              <ArrowRight className="hidden h-5 w-5 text-muted-foreground sm:block" />

              <div>
                <p className="text-xs text-muted-foreground">
                  New Taxpayer
                </p>

                <p className="mt-1 font-semibold text-primary">
                  {amendment.newCitizen || "—"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (amendment.type === "LAND_AREA_CHANGE") {
    const difference =
      (amendment.newLandArea ?? 0) -
      (amendment.previousLandArea ?? 0);

    return (
      <Card className="shadow-none">
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">
                Previous Area
              </p>

              <p className="mt-1 text-xl font-semibold">
                {formatNumber(amendment.previousLandArea)} {unit}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                New Area
              </p>

              <p className="mt-1 text-xl font-semibold text-primary">
                {formatNumber(amendment.newLandArea)} {unit}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Difference
              </p>

              <p
                className={`mt-1 text-xl font-semibold ${
                  difference > 0
                    ? "text-amber-600"
                    : difference < 0
                      ? "text-blue-600"
                      : ""
                }`}
              >
                {difference > 0 ? "+" : ""}
                {formatNumber(difference)} {unit}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (amendment.type === "PARTIAL_TRANSFER") {
    return (
      <Card className="shadow-none">
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">
                Original Area
              </p>

              <p className="mt-1 text-xl font-semibold">
                {formatNumber(amendment.previousLandArea)} {unit}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Transferred
              </p>

              <p className="mt-1 text-xl font-semibold text-amber-600">
                {formatNumber(amendment.transferredArea)} {unit}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Remaining
              </p>

              <p className="mt-1 text-xl font-semibold text-primary">
                {formatNumber(amendment.remainingArea)} {unit}
              </p>
            </div>
          </div>

          <Separator className="my-5" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">
                Current Taxpayer
              </p>

              <p className="mt-1 text-sm font-semibold">
                {amendment.previousCitizen || amendment.taxpayer}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Receiving Taxpayer
              </p>

              <p className="mt-1 text-sm font-semibold text-primary">
                {amendment.newCitizen || "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  /*
   * MERGE
   *
   * Current Land + Other Land = Combined Land
   *
   * Other Land is manually entered by the officer.
   */
  return (
    <Card className="shadow-none">
      <CardContent className="p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">
              Current Land
            </p>

            <p className="mt-1 text-xl font-semibold">
              {formatNumber(amendment.previousLandArea)} {unit}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Other Land
            </p>

            <p className="mt-1 text-xl font-semibold">
              {formatNumber(amendment.otherLandArea)} {unit}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Entered manually
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Combined Land
            </p>

            <p className="mt-1 text-xl font-semibold text-emerald-600">
              {formatNumber(amendment.resultingArea)} {unit}
            </p>
          </div>
        </div>

        <Separator className="my-5" />

        <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg bg-muted/30 p-4 text-lg font-semibold">
          <span>
            {formatNumber(amendment.previousLandArea)} {unit}
          </span>

          <span className="text-muted-foreground">+</span>

          <span>
            {formatNumber(amendment.otherLandArea)} {unit}
          </span>

          <span className="text-muted-foreground">=</span>

          <span className="text-emerald-600">
            {formatNumber(amendment.resultingArea)} {unit}
          </span>
        </div>

        <div className="mt-4 rounded-md border bg-muted/20 p-3">
          <p className="text-xs leading-5 text-muted-foreground">
            <strong>Other Land</strong> is the additional land area
            entered manually by the responsible officer. This amendment
            does not select another assessment or land parcel.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================================
 * Financial Impact
 * ========================================================================== */

function FinancialImpactSection({
  amendment,
}: {
  amendment: Amendment;
}) {
  const impact = amendment.financialImpact;

  const hasFutureImpact =
    impact.affectsFutureAssessment ||
    impact.affectsPaymentSchedule;

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        {hasFutureImpact ? (
          <CircleAlert className="h-4 w-4 text-amber-600" />
        ) : (
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
        )}

        <h3 className="text-sm font-semibold">
          Financial Impact
        </h3>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                hasFutureImpact
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {hasFutureImpact ? (
                <CircleAlert className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium">
                {hasFutureImpact
                  ? "Future assessment may be affected"
                  : "Historical financial records remain unchanged"}
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {impact.message}
              </p>
            </div>
          </div>

          <Separator className="my-5" />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">
                Historical Assessment
              </p>

              <p className="mt-1 text-sm font-semibold">
                Unchanged
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">
                Replacement Assessment
              </p>

              <p className="mt-1 text-sm font-semibold">
                {amendment.newAssessmentNumber ||
                  "Created independently later"}
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Applying an amendment does not silently recalculate or
            rewrite the historical assessment, services, schedules, or
            payment records.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

/* ============================================================================
 * Documents
 * ========================================================================== */

function DocumentsSection({
  amendment,
}: {
  amendment: Amendment;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <FileCheck2 className="h-4 w-4 text-primary" />

        <h3 className="text-sm font-semibold">
          Supporting Documents
        </h3>

        <Badge variant="secondary">
          {amendment.documents.length}
        </Badge>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-4">
          {amendment.documents.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <FileText className="mx-auto h-7 w-7 text-muted-foreground/50" />

              <p className="mt-2 text-sm font-medium">
                No supporting documents
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                No document has been attached to this amendment.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {amendment.documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {document.originalName || document.name}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatFileSize(document.size)}
                        {document.uploadedAt
                          ? ` • ${formatDate(document.uploadedAt)}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    title="Open document"
                    onClick={() => {
                      toast.info(
                        "Connect this button to your private-file endpoint.",
                      );
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

/* ============================================================================
 * Timeline
 * ========================================================================== */

function TimelineSection({
  amendment,
}: {
  amendment: Amendment;
}) {
  const timeline = amendment.timeline;

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />

        <h3 className="text-sm font-semibold">
          Amendment Timeline
        </h3>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-4">
          <TimelineItem
            title="Created"
            date={timeline.createdAt}
            description={`Created by ${timeline.createdBy}.`}
            icon={<Pencil className="h-3.5 w-3.5" />}
          />

          <TimelineItem
            title="Submitted for Approval"
            date={timeline.submittedAt}
            description={
              timeline.submittedAt
                ? "The amendment entered the approval workflow."
                : "The amendment has not been submitted yet."
            }
            active={Boolean(timeline.submittedAt)}
            icon={<Clock3 className="h-3.5 w-3.5" />}
          />

          <TimelineItem
            title={
              amendment.status === "REJECTED"
                ? "Rejected"
                : "Decision"
            }
            date={timeline.decidedAt}
            description={
              timeline.decidedAt
                ? `Decision by ${
                    timeline.decidedBy ||
                    "Revenue Decision Officer"
                  }.`
                : "A decision has not been recorded."
            }
            active={Boolean(timeline.decidedAt)}
            icon={
              amendment.status === "REJECTED" ? (
                <XCircle className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )
            }
          />

          {amendment.status === "REJECTED" &&
            timeline.rejectionReason && (
              <div className="mb-5 ml-11 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-medium text-red-700">
                  Rejection Reason
                </p>

                <p className="mt-1 text-xs leading-5 text-red-700/80">
                  {timeline.rejectionReason}
                </p>
              </div>
            )}

          <TimelineItem
            title="Applied"
            date={timeline.appliedAt}
            description={
              timeline.appliedAt
                ? `Applied by ${
                    timeline.appliedBy || "Revenue Officer"
                  }.`
                : "The amendment has not been applied."
            }
            active={Boolean(timeline.appliedAt)}
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
          />
        </CardContent>
      </Card>
    </section>
  );
}

/* ============================================================================
 * Mock Action
 * ========================================================================== */

function applyMockAction(
  amendmentId: string,
  action: AmendmentAction,
  rejectionReason?: string,
) {
  const index = mockAmendments.findIndex(
    (item) => item.id === amendmentId,
  );

  if (index === -1) {
    throw new Error("Amendment not found.");
  }

  const current = mockAmendments[index];

  const now = new Date().toISOString();

  const updated: Amendment = {
    ...current,
    updatedAt: now,
    timeline: {
      ...current.timeline,
    },
  };

  switch (action) {
    case "submit":
      if (current.status !== "DRAFT") {
        throw new Error(
          "Only draft amendments can be submitted.",
        );
      }

      updated.status = "PENDING_APPROVAL";
      updated.timeline.submittedAt = now;
      break;

    case "approve":
      if (current.status !== "PENDING_APPROVAL") {
        throw new Error(
          "Only amendments pending approval can be approved.",
        );
      }

      updated.status = "APPROVED";
      updated.timeline.decidedAt = now;
      updated.timeline.decidedBy =
        "Revenue Decision Officer";
      break;

    case "reject":
      if (current.status !== "PENDING_APPROVAL") {
        throw new Error(
          "Only amendments pending approval can be rejected.",
        );
      }

      if (!rejectionReason?.trim()) {
        throw new Error(
          "A rejection reason is required.",
        );
      }

      updated.status = "REJECTED";
      updated.timeline.decidedAt = now;
      updated.timeline.decidedBy =
        "Revenue Decision Officer";
      updated.timeline.rejectedAt = now;
      updated.timeline.rejectedBy =
        "Revenue Decision Officer";
      updated.timeline.rejectionReason =
        rejectionReason.trim();
      break;

    case "apply":
      if (current.status !== "APPROVED") {
        throw new Error(
          "Only approved amendments can be applied.",
        );
      }

      updated.status = "APPLIED";
      updated.timeline.appliedAt = now;
      updated.timeline.appliedBy = "Revenue Officer";
      break;

    case "cancel":
      if (
        current.status !== "DRAFT" &&
        current.status !== "PENDING_APPROVAL"
      ) {
        throw new Error(
          "This amendment cannot be cancelled.",
        );
      }

      updated.status = "CANCELLED";
      break;
  }

  mockAmendments[index] = updated;

  return updated;
}

/* ============================================================================
 * API
 * ========================================================================== */

async function fetchAmendments(
  search: string,
  type: FilterValue,
  status: FilterValue,
  page: number,
): Promise<PaginatedResponse> {
  if (USE_MOCK_DATA) {
    const normalizedSearch =
      search.trim().toLowerCase();

    const filtered = mockAmendments.filter((item) => {
      const searchableValues = [
        item.amendmentNumber,
        item.assessmentNumber,
        item.newAssessmentNumber ?? "",
        item.taxpayer,
        item.previousCitizen ?? "",
        item.newCitizen ?? "",
      ];

      const matchesSearch =
        normalizedSearch === "" ||
        searchableValues.some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );

      const matchesType =
        type === "ALL" || item.type === type;

      const matchesStatus =
        status === "ALL" || item.status === status;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });

    const start =
      (page - 1) * PAGE_SIZE;

    const pageItems = filtered.slice(
      start,
      start + PAGE_SIZE,
    );

    const lastPage = Math.max(
      1,
      Math.ceil(
        filtered.length / PAGE_SIZE,
      ),
    );

    return {
      data: pageItems,

      meta: {
        current_page:
          page > lastPage ? lastPage : page,
        last_page: lastPage,
        per_page: PAGE_SIZE,
        total: filtered.length,
        from:
          pageItems.length > 0
            ? start + 1
            : null,
        to:
          pageItems.length > 0
            ? start + pageItems.length
            : null,
      },
    };
  }

  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("per_page", String(PAGE_SIZE));

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (type !== "ALL") {
    params.set("type", type);
  }

  if (status !== "ALL") {
    params.set("status", status);
  }

  const response = await fetch(
    `${API_ENDPOINT}?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const payload =
    await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        "Unable to load amendments.",
    );
  }

  return payload as PaginatedResponse;
}

/* ============================================================================
 * Execute Amendment Action
 * ========================================================================== */

async function executeAmendmentAction(
  amendmentId: string,
  action: AmendmentAction,
  rejectionReason?: string,
): Promise<Amendment> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) =>
      setTimeout(resolve, 500),
    );

    return applyMockAction(
      amendmentId,
      action,
      rejectionReason,
    );
  }

  const body =
    action === "reject"
      ? {
          reason: rejectionReason,
        }
      : undefined;

  const response = await fetch(
    `${API_ENDPOINT}/${amendmentId}/${action}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(body
          ? {
              "Content-Type": "application/json",
            }
          : {}),
      },
      ...(body
        ? {
            body: JSON.stringify(body),
          }
        : {}),
    },
  );

  const payload =
    await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        `Unable to ${action} amendment.`,
    );
  }

  return (payload?.data ||
    payload) as Amendment;
}

/* ============================================================================
 * Amendment Details Sheet
 * ========================================================================== */

function LeaseAmendmentDetails({
  amendment,
  onClose,
  onRefresh,
  onUpdated,
}: {
  amendment: Amendment;
  onClose: () => void;
  onRefresh: () => void;
  onUpdated: (amendment: Amendment) => void;
}) {
  const [actionLoading, setActionLoading] =
    useState<AmendmentAction | null>(null);

  const [rejecting, setRejecting] =
    useState(false);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const runAction = async (
    action: AmendmentAction,
  ) => {
    if (action === "reject") {
      setRejecting(true);
      return;
    }

    const messages: Record<
      Exclude<AmendmentAction, "reject">,
      string
    > = {
      submit:
        "Submit this amendment for approval?",
      approve:
        "Approve this amendment? The historical assessment will remain unchanged.",
      apply:
        "Apply this approved amendment? This will not automatically recalculate historical financial records.",
      cancel:
        "Cancel this amendment?",
    };

    if (!window.confirm(messages[action])) {
      return;
    }

    try {
      setActionLoading(action);

      const updated =
        await executeAmendmentAction(
          amendment.id,
          action,
        );

      toast.success(
        `Amendment ${
          action === "submit"
            ? "submitted"
            : action === "approve"
              ? "approved"
              : action === "apply"
                ? "applied"
                : "cancelled"
        } successfully.`,
      );

      onUpdated(updated);
      onRefresh();
    } catch (error) {
      console.error(
        `Amendment ${action} failed:`,
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : `Unable to ${action} amendment.`,
      );
    } finally {
      setActionLoading(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error(
        "Please provide a rejection reason.",
      );
      return;
    }

    try {
      setActionLoading("reject");

      const updated =
        await executeAmendmentAction(
          amendment.id,
          "reject",
          rejectionReason.trim(),
        );

      toast.success(
        "Amendment rejected successfully.",
      );

      setRejecting(false);
      setRejectionReason("");

      onUpdated(updated);
      onRefresh();
    } catch (error) {
      console.error(
        "Amendment rejection failed:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to reject amendment.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const isActionLoading =
    actionLoading !== null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <SheetHeader className="border-b px-6 py-5 text-left">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <SheetTitle className="text-lg">
              {amendment.amendmentNumber}
            </SheetTitle>

            <SheetDescription className="mt-1">
              {getTypeLabel(amendment.type)}
              {" • "}
              Assessment {amendment.assessmentNumber}
            </SheetDescription>
          </div>

          <StatusBadge status={amendment.status} />
        </div>
      </SheetHeader>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">
          {/* Assessment */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />

              <h3 className="text-sm font-semibold">
                Assessment
              </h3>
            </div>

            <Card className="shadow-none">
              <CardContent className="p-4">
                <DetailRow
                  label="Assessment Number"
                  value={amendment.assessmentNumber}
                />

                <Separator />

                <DetailRow
                  label="Current Taxpayer"
                  value={amendment.taxpayer}
                />

                {amendment.previousLandArea !==
                  undefined &&
                  amendment.previousLandArea !==
                    null && (
                    <>
                      <Separator />

                      <DetailRow
                        label="Current Land Area"
                        value={`${formatNumber(
                          amendment.previousLandArea,
                        )} ${
                          amendment.measurementUnit ||
                          "m²"
                        }`}
                      />
                    </>
                  )}

                <Separator />

                <DetailRow
                  label="Amendment Type"
                  value={
                    <Badge variant="outline">
                      {getTypeLabel(amendment.type)}
                    </Badge>
                  }
                />
              </CardContent>
            </Card>
          </section>

          {/* Amendment Change */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <LandPlot className="h-4 w-4 text-primary" />

              <h3 className="text-sm font-semibold">
                Amendment Change
              </h3>
            </div>

            <AmendmentChangeDetails
              amendment={amendment}
            />
          </section>

          {/* Taxpayer */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <UserRound className="h-4 w-4 text-primary" />

              <h3 className="text-sm font-semibold">
                Taxpayer Information
              </h3>
            </div>

            <Card className="shadow-none">
              <CardContent className="p-4">
                <DetailRow
                  label="Current Taxpayer"
                  value={amendment.taxpayer}
                />

                {amendment.type ===
                  "NAME_TRANSFER" && (
                  <>
                    <Separator />

                    <DetailRow
                      label="Previous Taxpayer"
                      value={
                        amendment.previousCitizen
                      }
                    />

                    <Separator />

                    <DetailRow
                      label="New Taxpayer"
                      value={
                        <span className="text-primary">
                          {amendment.newCitizen}
                        </span>
                      }
                    />
                  </>
                )}

                {amendment.type ===
                  "PARTIAL_TRANSFER" && (
                  <>
                    <Separator />

                    <DetailRow
                      label="Receiving Taxpayer"
                      value={
                        <span className="text-primary">
                          {amendment.newCitizen ||
                            "—"}
                        </span>
                      }
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Assessment Relationship */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-primary" />

              <h3 className="text-sm font-semibold">
                Assessment History
              </h3>
            </div>

            <Card className="shadow-none">
              <CardContent className="p-4">
                <DetailRow
                  label="Previous Assessment"
                  value={
                    amendment.assessmentNumber
                  }
                />

                <Separator />

                <DetailRow
                  label="Replacement Assessment"
                  value={
                    amendment.newAssessmentNumber ? (
                      <span className="text-primary">
                        {amendment.newAssessmentNumber}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Not created yet
                      </span>
                    )
                  }
                />

                <p className="mt-3 rounded-lg border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
                  The original assessment remains part of the
                  historical record. A replacement assessment is
                  created independently after the amendment process;
                  it is not automatically generated by this page.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Reason */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />

              <h3 className="text-sm font-semibold">
                Reason
              </h3>
            </div>

            <Card className="shadow-none">
              <CardContent className="p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {amendment.reason ||
                    "No reason provided."}
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Financial */}
          <FinancialImpactSection
            amendment={amendment}
          />

          {/* Documents */}
          <DocumentsSection
            amendment={amendment}
          />

          {/* Timeline */}
          <TimelineSection
            amendment={amendment}
          />
        </div>
      </div>

      {/* Reject Panel */}
      {rejecting && (
        <div className="border-t bg-muted/20 p-4">
          <div className="rounded-lg border bg-background p-4">
            <p className="text-sm font-semibold">
              Reject Amendment
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              A rejection reason is required for the audit trail.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(event) =>
                setRejectionReason(
                  event.target.value,
                )
              }
              placeholder="Enter the reason for rejection..."
              rows={4}
              disabled={actionLoading === "reject"}
              className="mt-3 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />

            <div className="mt-3 flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={
                  actionLoading === "reject"
                }
                onClick={() => {
                  setRejecting(false);
                  setRejectionReason("");
                }}
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                disabled={
                  actionLoading === "reject" ||
                  !rejectionReason.trim()
                }
                onClick={confirmReject}
              >
                {actionLoading === "reject" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {!rejecting && (
        <div className="border-t bg-background p-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isActionLoading}
            >
              Close
            </Button>

            <div className="flex flex-wrap justify-end gap-2">
              {amendment.status === "DRAFT" && (
                <>
                  <Button
                    variant="outline"
                    disabled={isActionLoading}
                    onClick={() => {
                      toast.info(
                        "Connect Edit to your amendment form route.",
                      );
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>

                  <Button
                    disabled={isActionLoading}
                    onClick={() =>
                      runAction("submit")
                    }
                  >
                    {actionLoading ===
                    "submit" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Clock3 className="mr-2 h-4 w-4" />
                    )}
                    Submit
                  </Button>
                </>
              )}

              {amendment.status ===
                "PENDING_APPROVAL" && (
                <>
                  <Button
                    variant="outline"
                    disabled={isActionLoading}
                    onClick={() =>
                      runAction("reject")
                    }
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>

                  <Button
                    disabled={isActionLoading}
                    onClick={() =>
                      runAction("approve")
                    }
                  >
                    {actionLoading ===
                    "approve" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                </>
              )}

              {amendment.status === "APPROVED" && (
                <Button
                  disabled={isActionLoading}
                  onClick={() =>
                    runAction("apply")
                  }
                >
                  {actionLoading === "apply" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Apply Amendment
                </Button>
              )}

              {amendment.status === "APPLIED" &&
                amendment.newAssessmentNumber && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast.info(
                        `Open assessment ${amendment.newAssessmentNumber}.`,
                      );
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Assessment
                  </Button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * Page
 * ========================================================================== */

export default function LeaseAmendmentsPage() {
  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] =
    useState<FilterValue>("ALL");

  const [statusFilter, setStatusFilter] =
    useState<FilterValue>("ALL");

  const [page, setPage] = useState(1);

  const [data, setData] =
    useState<PaginatedResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [selectedAmendment, setSelectedAmendment] =
    useState<Amendment | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetchAmendments(
        search,
        typeFilter,
        statusFilter,
        page,
      );

      setData(result);

      setSelectedAmendment((current) => {
        if (!current) {
          return null;
        }

        return (
          result.data.find(
            (item) => item.id === current.id,
          ) || current
        );
      });
    } catch (err) {
      console.error(
        "Failed to load amendments:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load amendments.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    search,
    typeFilter,
    statusFilter,
    page,
  ]);

  /*
   * Reset pagination whenever a filter changes.
   */
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter]);

  /*
   * Small debounce for search.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadData]);

  const amendments = data?.data ?? [];

  const total = data?.meta.total ?? 0;

  const currentPage =
    data?.meta.current_page ?? page;

  const lastPage =
    data?.meta.last_page ?? 1;

  const from = data?.meta.from ?? 0;

  const to = data?.meta.to ?? 0;

  /*
   * Summary is calculated from the entire mock store in mock mode.
   *
   * For production, the Laravel index endpoint should ideally return
   * summary values separately because the current page cannot represent
   * the entire dataset.
   */
  const summary = useMemo(() => {
    if (USE_MOCK_DATA) {
      return {
        total: mockAmendments.length,

        pending: mockAmendments.filter(
          (item) =>
            item.status === "PENDING_APPROVAL",
        ).length,

        approved: mockAmendments.filter(
          (item) =>
            item.status === "APPROVED",
        ).length,

        applied: mockAmendments.filter(
          (item) =>
            item.status === "APPLIED",
        ).length,
      };
    }

    return {
      total,

      /*
       * These are page-level fallbacks.
       *
       * Recommended production API:
       * return summary from Laravel.
       */
      pending: amendments.filter(
        (item) =>
          item.status === "PENDING_APPROVAL",
      ).length,

      approved: amendments.filter(
        (item) =>
          item.status === "APPROVED",
      ).length,

      applied: amendments.filter(
        (item) =>
          item.status === "APPLIED",
      ).length,
    };
  }, [amendments, total]);

  const handleRefresh = useCallback(() => {
    void loadData();
  }, [loadData]);

  const handleUpdatedAmendment = (
    updated: Amendment,
  ) => {
    setSelectedAmendment(updated);
  };

  const canGoPrevious =
    currentPage > 1;

  const canGoNext =
    currentPage < lastPage;

  return (
    <div className="space-y-6 p-6">
      {/* ====================================================================
       * Header
       * ================================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Lease Amendments
            </h1>

            <Badge variant="secondary">
              {summary.total}
            </Badge>
          </div>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Manage legal changes to existing assessments while
            preserving historical assessment, payment, service,
            and financial records.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* ====================================================================
       * Summary
       * ================================================================== */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Amendments
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {summary.total}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Pending Approval
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {summary.pending}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <Clock3 className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Approved
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {summary.approved}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Applied
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {summary.applied}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====================================================================
       * Filters
       * ================================================================== */}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search amendment, assessment, taxpayer..."
                className="pl-9"
              />
            </div>

            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(
                  value as FilterValue,
                )
              }
            >
              <SelectTrigger className="w-full lg:w-[220px]">
                <SelectValue placeholder="Amendment type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">
                  All Types
                </SelectItem>

                <SelectItem value="NAME_TRANSFER">
                  Name Transfer
                </SelectItem>

                <SelectItem value="LAND_AREA_CHANGE">
                  Land Area Change
                </SelectItem>

                <SelectItem value="PARTIAL_TRANSFER">
                  Partial Transfer
                </SelectItem>

                <SelectItem value="MERGE">
                  Land Merge
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(
                  value as FilterValue,
                )
              }
            >
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">
                  All Statuses
                </SelectItem>

                <SelectItem value="DRAFT">
                  Draft
                </SelectItem>

                <SelectItem value="PENDING_APPROVAL">
                  Pending Approval
                </SelectItem>

                <SelectItem value="APPROVED">
                  Approved
                </SelectItem>

                <SelectItem value="APPLIED">
                  Applied
                </SelectItem>

                <SelectItem value="REJECTED">
                  Rejected
                </SelectItem>

                <SelectItem value="CANCELLED">
                  Cancelled
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ====================================================================
       * Error
       * ================================================================== */}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 text-destructive" />

              <div>
                <p className="text-sm font-medium">
                  Unable to load amendments
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {error}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleRefresh}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ====================================================================
       * Table
       * ================================================================== */}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">
                Amendment Records
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Review amendment history and manage its approval
                lifecycle.
              </p>
            </div>

            <span className="whitespace-nowrap text-sm text-muted-foreground">
              {from > 0
                ? `${from}–${to} of ${total}`
                : `${total} records`}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y bg-muted/30 text-left">
                  <th className="w-[60px] px-5 py-3 font-medium">
                    No.
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Amendment
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Assessment
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Taxpayer
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Type
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Change
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Status
                  </th>

                  <th className="w-[60px] px-3 py-3" />
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />

                        <p className="mt-3 text-sm font-medium">
                          Loading amendments...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : amendments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <FileText className="h-8 w-8 text-muted-foreground/50" />

                        <p className="mt-3 font-medium">
                          No amendments found
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Try changing your search or filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  amendments.map((item, index) => {
                    const rowNumber =
                      from > 0
                        ? from + index
                        : index + 1;

                    return (
                      <tr
                        key={item.id}
                        className="border-b transition-colors hover:bg-muted/30"
                      >
                        {/* No. */}
                        <td className="px-5 py-4 text-muted-foreground">
                          {rowNumber}
                        </td>

                        {/* Amendment */}
                        <td className="px-5 py-4">
                          <button
                            onClick={() =>
                              setSelectedAmendment(
                                item,
                              )
                            }
                            className="font-medium text-primary hover:underline"
                          >
                            {item.amendmentNumber}
                          </button>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(
                              item.createdAt,
                            )}
                          </p>
                        </td>

                        {/* Assessment */}
                        <td className="px-5 py-4">
                          <span className="font-medium">
                            {item.assessmentNumber}
                          </span>

                          {item.newAssessmentNumber && (
                            <p className="mt-1 text-xs text-emerald-600">
                              New:{" "}
                              {item.newAssessmentNumber}
                            </p>
                          )}
                        </td>

                        {/* Taxpayer */}
                        <td className="px-5 py-4">
                          <div>
                            <span className="font-medium">
                              {item.taxpayer}
                            </span>

                            {item.newCitizen && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                → {item.newCitizen}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-5 py-4">
                          <Badge variant="outline">
                            {getTypeLabel(
                              item.type,
                            )}
                          </Badge>
                        </td>

                        {/* Change */}
                        <td className="min-w-[250px] px-5 py-4">
                          {getChangeSummary(item)}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusBadge
                            status={item.status}
                          />
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  setSelectedAmendment(
                                    item,
                                  )
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>

                              {item.status ===
                                "DRAFT" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    toast.info(
                                      "Connect Edit to your amendment form route.",
                                    )
                                  }
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Amendment
                                </DropdownMenuItem>
                              )}

                              {item.status ===
                                "PENDING_APPROVAL" && (
                                <>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() =>
                                      setSelectedAmendment(
                                        item,
                                      )
                                    }
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Review Amendment
                                  </DropdownMenuItem>
                                </>
                              )}

                              {item.status ===
                                "APPROVED" && (
                                <>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() =>
                                      setSelectedAmendment(
                                        item,
                                      )
                                    }
                                  >
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Apply Amendment
                                  </DropdownMenuItem>
                                </>
                              )}

                              {item.status === "APPLIED" &&
                                item.newAssessmentNumber && (
                                  <>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                      onClick={() =>
                                        toast.info(
                                          `Open assessment ${item.newAssessmentNumber}.`,
                                        )
                                      }
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Assessment
                                    </DropdownMenuItem>
                                  </>
                                )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {from > 0
                ? `Showing ${from}–${to} of ${total}`
                : `Showing 0 of ${total}`}
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={
                  !canGoPrevious ||
                  loading
                }
                onClick={() =>
                  setPage((current) =>
                    Math.max(
                      1,
                      current - 1,
                    ),
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-[90px] text-center text-sm">
                Page {currentPage} of {lastPage}
              </div>

              <Button
                variant="outline"
                size="icon"
                disabled={
                  !canGoNext ||
                  loading
                }
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      lastPage,
                      current + 1,
                    ),
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ====================================================================
       * Detail Sheet
       * ================================================================== */}

      <Sheet
        open={Boolean(selectedAmendment)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAmendment(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-full p-0 sm:max-w-[680px]"
        >
          {selectedAmendment && (
            <LeaseAmendmentDetails
              amendment={selectedAmendment}
              onClose={() =>
                setSelectedAmendment(null)
              }
              onRefresh={handleRefresh}
              onUpdated={
                handleUpdatedAmendment
              }
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}