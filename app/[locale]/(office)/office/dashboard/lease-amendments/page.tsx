"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
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
  MoreHorizontal,
  Pencil,
  Search,
  ShieldCheck,
  User,
  UserRound,
  X,
  XCircle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Badge } from "@/components/ui/badge";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Separator } from "@/components/ui/separator";

type AmendmentType =
  | "NAME_TRANSFER"
  | "LAND_AREA_CHANGE"
  | "LAND_PARTIAL_TRANSFER"
  | "LAND_MERGE";

type AmendmentStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "APPLIED"
  | "CANCELLED";

type Amendment = {
  id: string;
  amendmentNumber: string;
  leaseAgreementNumber: string;
  taxpayer: string;

  type: AmendmentType;
  status: AmendmentStatus;

  effectiveDate: string;
  createdAt: string;
  submittedAt?: string;
  decidedAt?: string;
  appliedAt?: string;

  createdBy: string;
  decidedBy?: string;

  reason: string;

  previousCitizen?: string;
  newCitizen?: string;

  previousLandArea?: number;
  newLandArea?: number;

  transferredArea?: number;
  remainingArea?: number;

  sourceAreas?: number[];
  resultingArea?: number;

  measurementUnit?: string;

  documentNumber?: string;
  documentName?: string;

  previousAssessmentNumber?: string;
  newAssessmentNumber?: string;

  financialImpact: {
    affectsFutureAssessment: boolean;
    affectsPaymentSchedule: boolean;
    message: string;
  };
};

const mockAmendments: Amendment[] = [
  {
    id: "1",
    amendmentNumber: "AMND-2026-000018",
    leaseAgreementNumber: "LSE-2019-00452",
    taxpayer: "Abebe Kebede",
    type: "LAND_AREA_CHANGE",
    status: "PENDING_APPROVAL",
    effectiveDate: "2027-01-01",
    createdAt: "2026-09-28 09:20",
    submittedAt: "2026-09-29 14:15",
    createdBy: "Registration Officer",
    reason:
      "Land measurement was updated following an official cadastral survey.",
    previousLandArea: 200,
    newLandArea: 500,
    measurementUnit: "m²",
    documentNumber: "CAD-2026-00981",
    documentName: "Updated Cadastral Survey.pdf",
    previousAssessmentNumber: "ASM-2026-00321",
    financialImpact: {
      affectsFutureAssessment: true,
      affectsPaymentSchedule: true,
      message:
        "Future obligations will be recalculated from the effective date. Historical paid installments remain unchanged.",
    },
  },

  {
    id: "2",
    amendmentNumber: "AMND-2026-000017",
    leaseAgreementNumber: "LSE-2018-00127",
    taxpayer: "Kebede Tesfaye",
    type: "NAME_TRANSFER",
    status: "APPROVED",
    effectiveDate: "2026-12-15",
    createdAt: "2026-09-25 11:10",
    submittedAt: "2026-09-26 10:30",
    decidedAt: "2026-09-28 15:40",
    createdBy: "Registration Officer",
    decidedBy: "Revenue Decision Officer",
    reason: "Legal ownership transfer based on the submitted transfer document.",
    previousCitizen: "Kebede Tesfaye",
    newCitizen: "Hanna Bekele",
    documentNumber: "TRF-2026-00217",
    documentName: "Ownership Transfer.pdf",
    previousAssessmentNumber: "ASM-2026-00287",
    newAssessmentNumber: "ASM-2026-00402",
    financialImpact: {
      affectsFutureAssessment: false,
      affectsPaymentSchedule: false,
      message:
        "Taxpayer ownership information changes. Existing financial obligations remain attached to the lease history.",
    },
  },

  {
    id: "3",
    amendmentNumber: "AMND-2026-000016",
    leaseAgreementNumber: "LSE-2020-00871",
    taxpayer: "Mohammed Ahmed",
    type: "LAND_PARTIAL_TRANSFER",
    status: "APPLIED",
    effectiveDate: "2027-01-01",
    createdAt: "2026-09-18 08:40",
    submittedAt: "2026-09-19 09:10",
    decidedAt: "2026-09-21 13:00",
    appliedAt: "2026-09-22 10:15",
    createdBy: "Registration Officer",
    decidedBy: "Revenue Decision Officer",
    reason: "Partial transfer of the leased land to another party.",
    previousLandArea: 800,
    transferredArea: 200,
    remainingArea: 600,
    newLandArea: 600,
    measurementUnit: "m²",
    documentNumber: "TRF-2026-00188",
    documentName: "Partial Land Transfer.pdf",
    previousAssessmentNumber: "ASM-2026-00176",
    newAssessmentNumber: "ASM-2026-00389",
    financialImpact: {
      affectsFutureAssessment: true,
      affectsPaymentSchedule: true,
      message:
        "Future obligations were recalculated using the remaining 600 m² from the effective date.",
    },
  },

  {
    id: "4",
    amendmentNumber: "AMND-2026-000015",
    leaseAgreementNumber: "LSE-2021-00291",
    taxpayer: "Sara Worku",
    type: "LAND_MERGE",
    status: "APPROVED",
    effectiveDate: "2026-11-01",
    createdAt: "2026-09-15 10:30",
    submittedAt: "2026-09-16 11:00",
    decidedAt: "2026-09-18 14:20",
    createdBy: "Registration Officer",
    decidedBy: "Revenue Decision Officer",
    reason: "Two adjacent land parcels were legally consolidated.",
    previousLandArea: 300,
    sourceAreas: [300, 200],
    resultingArea: 500,
    newLandArea: 500,
    measurementUnit: "m²",
    documentNumber: "MERGE-2026-00112",
    documentName: "Land Consolidation Certificate.pdf",
    previousAssessmentNumber: "ASM-2026-00152",
    financialImpact: {
      affectsFutureAssessment: true,
      affectsPaymentSchedule: true,
      message:
        "The resulting 500 m² parcel will be used for future assessment calculations.",
    },
  },

  {
    id: "5",
    amendmentNumber: "AMND-2026-000014",
    leaseAgreementNumber: "LSE-2017-00089",
    taxpayer: "Tadesse Bekele",
    type: "LAND_AREA_CHANGE",
    status: "REJECTED",
    effectiveDate: "2026-10-15",
    createdAt: "2026-09-10 08:15",
    submittedAt: "2026-09-11 09:20",
    decidedAt: "2026-09-13 16:10",
    createdBy: "Registration Officer",
    decidedBy: "Revenue Decision Officer",
    reason: "Requested area does not match the submitted cadastral document.",
    previousLandArea: 1000,
    newLandArea: 700,
    measurementUnit: "m²",
    documentNumber: "CAD-2026-00711",
    documentName: "Cadastral Document.pdf",
    financialImpact: {
      affectsFutureAssessment: false,
      affectsPaymentSchedule: false,
      message: "No financial changes were applied because the amendment was rejected.",
    },
  },

  {
    id: "6",
    amendmentNumber: "AMND-2026-000013",
    leaseAgreementNumber: "LSE-2022-00562",
    taxpayer: "Aster Haile",
    type: "NAME_TRANSFER",
    status: "DRAFT",
    effectiveDate: "2026-10-01",
    createdAt: "2026-09-30 10:05",
    createdBy: "Registration Officer",
    reason: "Transfer of lease ownership.",
    previousCitizen: "Aster Haile",
    newCitizen: "Samuel Haile",
    documentNumber: "TRF-2026-00321",
    documentName: "Transfer Agreement.pdf",
    financialImpact: {
      affectsFutureAssessment: false,
      affectsPaymentSchedule: false,
      message:
        "The amendment has not been submitted or applied yet. No financial records have been changed.",
    },
  },

  {
    id: "7",
    amendmentNumber: "AMND-2026-000012",
    leaseAgreementNumber: "LSE-2016-00341",
    taxpayer: "Bekele Girma",
    type: "LAND_PARTIAL_TRANSFER",
    status: "APPLIED",
    effectiveDate: "2026-09-01",
    createdAt: "2026-08-20 09:30",
    submittedAt: "2026-08-21 10:00",
    decidedAt: "2026-08-24 14:30",
    appliedAt: "2026-08-25 09:15",
    createdBy: "Registration Officer",
    decidedBy: "Revenue Decision Officer",
    reason: "Partial land transfer.",
    previousLandArea: 600,
    transferredArea: 250,
    remainingArea: 350,
    newLandArea: 350,
    measurementUnit: "m²",
    previousAssessmentNumber: "ASM-2026-00091",
    newAssessmentNumber: "ASM-2026-00218",
    financialImpact: {
      affectsFutureAssessment: true,
      affectsPaymentSchedule: true,
      message:
        "Future obligations were recalculated based on the remaining 350 m².",
    },
  },
];

function getTypeLabel(type: AmendmentType) {
  switch (type) {
    case "NAME_TRANSFER":
      return "Name Transfer";
    case "LAND_AREA_CHANGE":
      return "Land Area Change";
    case "LAND_PARTIAL_TRANSFER":
      return "Partial Transfer";
    case "LAND_MERGE":
      return "Land Merge";
  }
}

function getStatusLabel(status: AmendmentStatus) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "Pending Approval";
    default:
      return status.replaceAll("_", " ");
  }
}

function StatusBadge({ status }: { status: AmendmentStatus }) {
  const styles: Record<AmendmentStatus, string> = {
    DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
    PENDING_APPROVAL:
      "bg-amber-50 text-amber-700 border-amber-200",
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

function formatDate(value?: string) {
  if (!value) return "—";

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

function getChangeSummary(amendment: Amendment) {
  switch (amendment.type) {
    case "NAME_TRANSFER":
      return (
        <div className="flex items-center gap-2">
          <span>{amendment.previousCitizen}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{amendment.newCitizen}</span>
        </div>
      );

    case "LAND_AREA_CHANGE":
      return (
        <div className="flex items-center gap-2">
          <span>
            {amendment.previousLandArea?.toLocaleString()}{" "}
            {amendment.measurementUnit}
          </span>

          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />

          <span className="font-medium">
            {amendment.newLandArea?.toLocaleString()}{" "}
            {amendment.measurementUnit}
          </span>
        </div>
      );

    case "LAND_PARTIAL_TRANSFER":
      return (
        <div className="flex items-center gap-2">
          <span>
            {amendment.previousLandArea?.toLocaleString()}{" "}
            {amendment.measurementUnit}
          </span>

          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />

          <span className="font-medium">
            {amendment.remainingArea?.toLocaleString()}{" "}
            {amendment.measurementUnit}
          </span>
        </div>
      );

    case "LAND_MERGE":
      return (
        <div className="flex items-center gap-2">
          <span>
            {amendment.sourceAreas?.join(" + ")}{" "}
            {amendment.measurementUnit}
          </span>

          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />

          <span className="font-medium">
            {amendment.resultingArea} {amendment.measurementUnit}
          </span>
        </div>
      );
  }
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-4 py-2.5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value || "—"}</div>
    </div>
  );
}

function TimelineItem({
  title,
  date,
  description,
  active = true,
  icon,
}: {
  title: string;
  date?: string;
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
            <span className="text-xs text-muted-foreground">
              {date}
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

function LeaseAmendmentDetails({
  amendment,
  onClose,
}: {
  amendment: Amendment;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b px-6 py-5 text-left">
        <div className="flex items-start justify-between gap-4">
          <div>
            <SheetTitle className="text-lg">
              {amendment.amendmentNumber}
            </SheetTitle>

            <SheetDescription className="mt-1">
              {getTypeLabel(amendment.type)} for{" "}
              {amendment.leaseAgreementNumber}
            </SheetDescription>
          </div>

          <StatusBadge status={amendment.status} />
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">
          {/* Quick summary */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs">Lease Agreement</span>
                </div>

                <p className="mt-2 text-sm font-semibold">
                  {amendment.leaseAgreementNumber}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-xs">Effective Date</span>
                </div>

                <p className="mt-2 text-sm font-semibold">
                  {formatDate(amendment.effectiveDate)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Change summary */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <LandPlot className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">
                Amendment Change
              </h3>
            </div>

            <Card className="shadow-none">
              <CardContent className="p-4">
                <div className="rounded-lg bg-muted/40 p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {getTypeLabel(amendment.type)}
                  </p>

                  <div className="text-sm">
                    {getChangeSummary(amendment)}
                  </div>
                </div>

                {amendment.type === "LAND_PARTIAL_TRANSFER" && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Original Area
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {amendment.previousLandArea?.toLocaleString()}{" "}
                        {amendment.measurementUnit}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Transferred
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {amendment.transferredArea?.toLocaleString()}{" "}
                        {amendment.measurementUnit}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Remaining
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {amendment.remainingArea?.toLocaleString()}{" "}
                        {amendment.measurementUnit}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Lease / taxpayer */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <UserRound className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">
                Lease Information
              </h3>
            </div>

            <Card className="shadow-none">
              <CardContent className="p-4">
                <DetailRow
                  label="Lease Agreement"
                  value={amendment.leaseAgreementNumber}
                />

                <Separator />

                <DetailRow
                  label="Current Taxpayer"
                  value={amendment.taxpayer}
                />

                {amendment.type === "NAME_TRANSFER" && (
                  <>
                    <Separator />

                    <DetailRow
                      label="Previous Citizen"
                      value={amendment.previousCitizen}
                    />

                    <Separator />

                    <DetailRow
                      label="New Citizen"
                      value={amendment.newCitizen}
                    />
                  </>
                )}

                {amendment.previousLandArea !== undefined && (
                  <>
                    <Separator />

                    <DetailRow
                      label="Previous Land Area"
                      value={`${amendment.previousLandArea.toLocaleString()} ${
                        amendment.measurementUnit || ""
                      }`}
                    />
                  </>
                )}

                {amendment.newLandArea !== undefined && (
                  <>
                    <Separator />

                    <DetailRow
                      label="New Land Area"
                      value={`${amendment.newLandArea.toLocaleString()} ${
                        amendment.measurementUnit || ""
                      }`}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Reason */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Reason</h3>
            </div>

            <Card className="shadow-none">
              <CardContent className="p-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  {amendment.reason}
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Financial impact */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              {amendment.financialImpact.affectsFutureAssessment ||
              amendment.financialImpact.affectsPaymentSchedule ? (
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
                      amendment.financialImpact.affectsFutureAssessment ||
                      amendment.financialImpact.affectsPaymentSchedule
                        ? "bg-amber-50 text-amber-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {amendment.financialImpact.affectsFutureAssessment ||
                    amendment.financialImpact.affectsPaymentSchedule ? (
                      <CircleAlert className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      {amendment.financialImpact
                        .affectsFutureAssessment ||
                      amendment.financialImpact.affectsPaymentSchedule
                        ? "Future financial records may change"
                        : "No financial recalculation required"}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {amendment.financialImpact.message}
                    </p>
                  </div>
                </div>

                {(amendment.previousAssessmentNumber ||
                  amendment.newAssessmentNumber) && (
                  <div className="mt-4 rounded-lg border bg-muted/20 p-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Previous Assessment
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {amendment.previousAssessmentNumber || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          New Assessment
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {amendment.newAssessmentNumber || "Not created"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Documents */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">
                Supporting Document
              </h3>
            </div>

            <Card className="shadow-none">
              <CardContent className="p-4">
                <DetailRow
                  label="Document Number"
                  value={amendment.documentNumber}
                />

                <Separator />

                <DetailRow
                  label="File"
                  value={
                    amendment.documentName ? (
                      <button className="inline-flex items-center gap-1.5 text-primary hover:underline">
                        <Download className="h-3.5 w-3.5" />
                        {amendment.documentName}
                      </button>
                    ) : (
                      "—"
                    )
                  }
                />
              </CardContent>
            </Card>
          </section>

          {/* Timeline */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">
                Amendment Timeline
              </h3>
            </div>

            <Card className="shadow-none">
              <CardContent className="relative p-4">
                <TimelineItem
                  title="Created"
                  date={formatDate(amendment.createdAt)}
                  description={`Created by ${amendment.createdBy}.`}
                  icon={<Pencil className="h-3.5 w-3.5" />}
                />

                <TimelineItem
                  title="Submitted for Approval"
                  date={formatDate(amendment.submittedAt)}
                  description={
                    amendment.submittedAt
                      ? "The amendment entered the approval workflow."
                      : "Not submitted yet."
                  }
                  active={Boolean(amendment.submittedAt)}
                  icon={<Clock3 className="h-3.5 w-3.5" />}
                />

                <TimelineItem
                  title={
                    amendment.status === "REJECTED"
                      ? "Rejected"
                      : "Approved"
                  }
                  date={formatDate(amendment.decidedAt)}
                  description={
                    amendment.decidedAt
                      ? `Decision by ${
                          amendment.decidedBy || "Revenue Decision Officer"
                        }.`
                      : "Decision has not been made."
                  }
                  active={Boolean(amendment.decidedAt)}
                  icon={
                    amendment.status === "REJECTED" ? (
                      <XCircle className="h-3.5 w-3.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )
                  }
                />

                <TimelineItem
                  title="Applied"
                  date={formatDate(amendment.appliedAt)}
                  description={
                    amendment.appliedAt
                      ? "New lease/assessment financial state was applied."
                      : "Application has not been completed."
                  }
                  active={Boolean(amendment.appliedAt)}
                  icon={<ShieldCheck className="h-3.5 w-3.5" />}
                />
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t bg-background p-4">
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          <div className="flex gap-2">
            {amendment.status === "DRAFT" && (
              <Button>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Amendment
              </Button>
            )}

            {amendment.status === "PENDING_APPROVAL" && (
              <>
                <Button variant="outline">
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>

                <Button>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}

            {amendment.status === "APPROVED" && (
              <Button>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Apply Amendment
              </Button>
            )}

            {amendment.status === "APPLIED" &&
              amendment.newAssessmentNumber && (
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  View New Assessment
                </Button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeaseAmendmentsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedAmendment, setSelectedAmendment] =
    useState<Amendment | null>(null);

  const filteredAmendments = useMemo(() => {
    return mockAmendments.filter((item) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        item.amendmentNumber.toLowerCase().includes(searchText) ||
        item.leaseAgreementNumber.toLowerCase().includes(searchText) ||
        item.taxpayer.toLowerCase().includes(searchText);

      const matchesType =
        typeFilter === "ALL" || item.type === typeFilter;

      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [search, typeFilter, statusFilter]);

  const total = mockAmendments.length;

  const pending = mockAmendments.filter(
    (item) => item.status === "PENDING_APPROVAL"
  ).length;

  const approved = mockAmendments.filter(
    (item) => item.status === "APPROVED"
  ).length;

  const applied = mockAmendments.filter(
    (item) => item.status === "APPLIED"
  ).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Lease Amendments
            </h1>

            <Badge variant="secondary">
              {total}
            </Badge>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage legal changes to existing lease agreements without
            altering historical financial records.
          </p>
        </div>

        <Button>
          <FileText className="mr-2 h-4 w-4" />
          New Amendment
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Amendments
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {total}
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
                  {pending}
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
                  {approved}
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
                  {applied}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search amendment, lease agreement, or taxpayer..."
                className="pl-9"
              />
            </div>

            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger className="w-full lg:w-[210px]">
                <SelectValue placeholder="Amendment type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="NAME_TRANSFER">
                  Name Transfer
                </SelectItem>
                <SelectItem value="LAND_AREA_CHANGE">
                  Land Area Change
                </SelectItem>
                <SelectItem value="LAND_PARTIAL_TRANSFER">
                  Partial Transfer
                </SelectItem>
                <SelectItem value="LAND_MERGE">
                  Land Merge
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full lg:w-[190px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING_APPROVAL">
                  Pending Approval
                </SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="APPLIED">Applied</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Amendment Records
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Review and manage lease amendment requests.
              </p>
            </div>

            <span className="text-sm text-muted-foreground">
              {filteredAmendments.length} records
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y bg-muted/30 text-left">
                  <th className="px-5 py-3 font-medium">
                    Amendment
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Lease Agreement
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
                    Effective
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Status
                  </th>

                  <th className="w-[60px] px-3 py-3" />
                </tr>
              </thead>

              <tbody>
                {filteredAmendments.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-4">
                      <button
                        onClick={() =>
                          setSelectedAmendment(item)
                        }
                        className="font-medium text-primary hover:underline"
                      >
                        {item.amendmentNumber}
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-medium">
                        {item.leaseAgreementNumber}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {item.taxpayer}
                    </td>

                    <td className="px-5 py-4">
                      <Badge variant="outline">
                        {getTypeLabel(item.type)}
                      </Badge>
                    </td>

                    <td className="px-5 py-4">
                      {getChangeSummary(item)}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {formatDate(item.effectiveDate)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-3 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
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
                              setSelectedAmendment(item)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>

                          {item.status === "DRAFT" && (
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Amendment
                            </DropdownMenuItem>
                          )}

                          {item.status === "PENDING_APPROVAL" && (
                            <>
                              <DropdownMenuSeparator />

                              <DropdownMenuItem>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Review & Approve
                              </DropdownMenuItem>
                            </>
                          )}

                          {item.status === "APPROVED" && (
                            <>
                              <DropdownMenuSeparator />

                              <DropdownMenuItem>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Apply Amendment
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}

                {filteredAmendments.length === 0 && (
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
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-5 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {filteredAmendments.length} of {total}
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
              >
                1
              </Button>

              <Button
                variant="outline"
                size="icon"
                disabled
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Drawer */}
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
          className="w-full p-0 sm:max-w-[620px]"
        >
          {selectedAmendment && (
            <LeaseAmendmentDetails
              amendment={selectedAmendment}
              onClose={() => setSelectedAmendment(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}