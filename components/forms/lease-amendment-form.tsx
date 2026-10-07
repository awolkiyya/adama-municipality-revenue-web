"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  FileText,
  Info,
  MapPin,
  Save,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TaxpayerSelector } from "../revenue/assessment/taxpayer-selector";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type AmendmentType =
  | "LAND_AREA_CHANGE"
  | "NAME_TRANSFER"
  | "PARTIAL_TRANSFER"
  | "MERGE";

export type LeaseAmendmentMode = "create" | "edit";

export type Taxpayer = {
  id: string;
  name: string;
  phone?: string | null;
};

export type Citizen = {
  id: string;
  name: string;
  phone: string;
};

export type AssessmentService = {
  id: string;
  name: string;
  amount: number;
};

export type Assessment = {
  id: string;
  assessmentNumber: string;
  assessmentDate: string;
  status: "APPROVED" | "DRAFT" | "ISSUED" | "SUPERSEDED";
  citizen: Citizen;
  landArea: number;
  landAreaUnit: string;
  location: string;
  services: AssessmentService[];
};

export type LeaseAmendmentFormValues = {
  amendmentType: AmendmentType | null;

  /**
   * Used by:
   * - NAME_TRANSFER
   * - PARTIAL_TRANSFER
   */
  newTaxpayerId: string | null;

  /**
   * Used by:
   * - LAND_AREA_CHANGE
   */
  newLandArea: string;

  /**
   * Used by:
   * - PARTIAL_TRANSFER
   */
  transferArea: string;

  /**
   * Used by:
   * - MERGE
   *
   * This is manually entered by the officer.
   * It is NOT another assessment and NOT another parcel selector.
   */
  mergedLandArea: string;

  reason: string;

  supportingDocuments: File[];
};

export type LeaseAmendmentFormProps = {
  mode: LeaseAmendmentMode;

  assessment?: Assessment;

  taxpayers?: Taxpayer[];

  initialValues?: Partial<LeaseAmendmentFormValues>;

  amendmentId?: string;

  onSubmit?: (
    values: LeaseAmendmentFormValues,
  ) => Promise<void> | void;

  onCancel?: () => void;
};

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const AMENDMENT_TYPE_LABELS: Record<AmendmentType, string> = {
  LAND_AREA_CHANGE: "Land Area Change",
  NAME_TRANSFER: "Name Transfer",
  PARTIAL_TRANSFER: "Partial Transfer",
  MERGE: "Land Merge",
};

const AMENDMENT_TYPE_DESCRIPTIONS: Record<AmendmentType, string> = {
  LAND_AREA_CHANGE: "Change the registered land area.",
  NAME_TRANSFER: "Transfer the land record to another taxpayer.",
  PARTIAL_TRANSFER: "Transfer part of the land to another taxpayer.",
  MERGE: "Combine this land with another land area.",
};

/* -------------------------------------------------------------------------- */
/* Mock data                                                                  */
/* -------------------------------------------------------------------------- */

const MOCK_TAXPAYERS: Taxpayer[] = [
  {
    id: "taxpayer-001",
    name: "Aster Haile",
    phone: "+251 91 234 5678",
  },
  {
    id: "taxpayer-002",
    name: "Samuel Haile",
    phone: "+251 91 345 6789",
  },
  {
    id: "taxpayer-003",
    name: "Abebe Kebede",
    phone: "+251 92 456 7890",
  },
  {
    id: "taxpayer-004",
    name: "Mulugeta Tesfaye",
    phone: "+251 93 567 8901",
  },
];

const MOCK_ASSESSMENT: Assessment = {
  id: "01a0e395-3ed1-70b4-af48-2051e67b0389",
  assessmentNumber: "ASM-2026-000184",
  assessmentDate: "2026-09-28",
  status: "APPROVED",
  citizen: {
    id: "citizen-001",
    name: "Aster Haile",
    phone: "+251 91 234 5678",
  },
  landArea: 1000,
  landAreaUnit: "m²",
  location: "Adama City, Bole Sub-City",
  services: [
    {
      id: "service-001",
      name: "Land Lease Service",
      amount: 73260,
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function getFileExtension(file: File): string {
  const parts = file.name.split(".");

  return parts.length > 1
    ? parts[parts.length - 1].toUpperCase()
    : "";
}

/* -------------------------------------------------------------------------- */
/* Small UI components                                                        */
/* -------------------------------------------------------------------------- */

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>

      <div className="text-sm font-medium text-foreground">
        {value}
      </div>
    </div>
  );
}

function UnitSuffix({ unit }: { unit: string }) {
  return (
    <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
      {unit}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Source land                                                               */
/* -------------------------------------------------------------------------- */

function SourceAssessmentSection({
  assessment,
}: {
  assessment: Assessment;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Source Land</CardTitle>

        <CardDescription>
          This is the existing land record being amended.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              label="Assessment"
              value={assessment.assessmentNumber}
            />

            <InfoItem
              label="Current Taxpayer"
              value={assessment.citizen.name}
              icon={
                <UserRound className="h-3.5 w-3.5" />
              }
            />

            <InfoItem
              label="Current Land Area"
              value={`${formatNumber(
                assessment.landArea,
              )} ${assessment.landAreaUnit}`}
            />

            <InfoItem
              label="Status"
              value={assessment.status}
            />
          </div>

          <Separator className="my-4" />

          <InfoItem
            label="Location"
            value={assessment.location}
            icon={
              <MapPin className="h-3.5 w-3.5" />
            }
          />
        </div>

        <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />

          <div>
            <p className="font-medium">
              Existing record is read-only
            </p>

            <p className="mt-1 text-blue-800/80 dark:text-blue-200/80">
              The amendment records what changed. The existing
              assessment, services, invoices, and payment
              schedules are not modified by this form.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Land area change                                                          */
/* -------------------------------------------------------------------------- */

function LandAreaChangeFields({
  assessment,
  newLandArea,
  onChange,
}: {
  assessment: Assessment;
  newLandArea: string;
  onChange: (value: string) => void;
}) {
  const parsedValue = Number(newLandArea);

  const hasNumber =
    newLandArea.trim() !== "" &&
    Number.isFinite(parsedValue);

  const difference = hasNumber
    ? parsedValue - assessment.landArea
    : 0;

  const isValid =
    hasNumber &&
    parsedValue > 0 &&
    parsedValue !== assessment.landArea;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Current Land Area</Label>

          <div className="flex gap-2">
            <Input
              value={formatNumber(
                assessment.landArea,
              )}
              disabled
              readOnly
            />

            <UnitSuffix
              unit={assessment.landAreaUnit}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newLandArea">
            New Land Area{" "}
            <span className="text-destructive">
              *
            </span>
          </Label>

          <div className="flex gap-2">
            <Input
              id="newLandArea"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter new area"
              value={newLandArea}
              onChange={(event) =>
                onChange(event.target.value)
              }
            />

            <UnitSuffix
              unit={assessment.landAreaUnit}
            />
          </div>
        </div>
      </div>

      {hasNumber && (
        <div
          className={`flex items-center gap-3 rounded-lg border p-4 ${
            isValid
              ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
              : "border-destructive/30 bg-destructive/5"
          }`}
        >
          {isValid ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-destructive" />
          )}

          <div>
            <p className="text-sm font-medium">
              {isValid
                ? `Land area will change from ${formatNumber(
                    assessment.landArea,
                  )} to ${formatNumber(
                    parsedValue,
                  )} ${assessment.landAreaUnit}`
                : "Enter a different land area greater than zero."}
            </p>

            {isValid && (
              <p className="mt-1 text-sm text-muted-foreground">
                Change:{" "}
                <span className="font-medium">
                  {difference > 0 ? "+" : ""}
                  {formatNumber(difference)}{" "}
                  {assessment.landAreaUnit}
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Name transfer                                                             */
/* -------------------------------------------------------------------------- */

function NameTransferFields({
  assessment,
  taxpayers,
  newTaxpayerId,
  onChange,
}: {
  assessment: Assessment;
  taxpayers: Taxpayer[];
  newTaxpayerId: string | null;
  onChange: (value: string | null) => void;
}) {
  const selectedTaxpayer = taxpayers.find(
    (taxpayer) =>
      taxpayer.id === newTaxpayerId,
  );

  const samePerson =
    selectedTaxpayer &&
    selectedTaxpayer.name.trim().toLowerCase() ===
      assessment.citizen.name.trim().toLowerCase();

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Current Taxpayer</Label>

          <div className="flex min-h-10 items-center rounded-md border bg-muted/50 px-3 text-sm">
            <UserRound className="mr-2 h-4 w-4 text-muted-foreground" />

            {assessment.citizen.name}
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            New Taxpayer{" "}
            <span className="text-destructive">
              *
            </span>
          </Label>

          <TaxpayerSelector
            taxpayers={taxpayers}
            value={newTaxpayerId ?? undefined}
            onValueChange={(value: string) =>
              onChange(value || null)
            }
            placeholder="Select new taxpayer"
          />
        </div>
      </div>

      {selectedTaxpayer && (
        <div
          className={`flex items-center gap-3 rounded-lg border p-4 ${
            samePerson
              ? "border-destructive/30 bg-destructive/5"
              : "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
          }`}
        >
          {samePerson ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          )}

          <div className="text-sm">
            {samePerson ? (
              <p className="font-medium">
                The new taxpayer must be different from
                the current taxpayer.
              </p>
            ) : (
              <p className="font-medium">
                {assessment.citizen.name} →{" "}
                {selectedTaxpayer.name}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Partial transfer                                                          */
/* -------------------------------------------------------------------------- */

function PartialTransferFields({
  assessment,
  taxpayers,
  transferArea,
  newTaxpayerId,
  onTransferAreaChange,
  onTaxpayerChange,
}: {
  assessment: Assessment;
  taxpayers: Taxpayer[];
  transferArea: string;
  newTaxpayerId: string | null;
  onTransferAreaChange: (value: string) => void;
  onTaxpayerChange: (value: string | null) => void;
}) {
  const parsedTransferArea = Number(
    transferArea,
  );

  const hasNumber =
    transferArea.trim() !== "" &&
    Number.isFinite(parsedTransferArea);

  const remainingArea = hasNumber
    ? assessment.landArea - parsedTransferArea
    : assessment.landArea;

  const validTransferArea =
    hasNumber &&
    parsedTransferArea > 0 &&
    parsedTransferArea < assessment.landArea;

  const selectedTaxpayer = taxpayers.find(
    (taxpayer) =>
      taxpayer.id === newTaxpayerId,
  );

  const samePerson =
    selectedTaxpayer &&
    selectedTaxpayer.name.trim().toLowerCase() ===
      assessment.citizen.name.trim().toLowerCase();

  const isValid =
    validTransferArea &&
    !!selectedTaxpayer &&
    !samePerson;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Current Land Area</Label>

          <div className="flex gap-2">
            <Input
              value={formatNumber(
                assessment.landArea,
              )}
              disabled
              readOnly
            />

            <UnitSuffix
              unit={assessment.landAreaUnit}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transferArea">
            Transfer Area{" "}
            <span className="text-destructive">
              *
            </span>
          </Label>

          <div className="flex gap-2">
            <Input
              id="transferArea"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter area to transfer"
              value={transferArea}
              onChange={(event) =>
                onTransferAreaChange(
                  event.target.value,
                )
              }
            />

            <UnitSuffix
              unit={assessment.landAreaUnit}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          New Taxpayer{" "}
          <span className="text-destructive">
            *
          </span>
        </Label>

        <TaxpayerSelector
          taxpayers={taxpayers}
          value={newTaxpayerId ?? undefined}
          onValueChange={(value: string) =>
            onTaxpayerChange(value || null)
          }
          placeholder="Select taxpayer receiving the transferred land"
        />
      </div>

      <div
        className={`rounded-lg border p-4 ${
          isValid
            ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
            : "bg-muted/30"
        }`}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Current Area
            </p>

            <p className="mt-1 text-lg font-semibold">
              {formatNumber(
                assessment.landArea,
              )}{" "}
              {assessment.landAreaUnit}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Transfer Area
            </p>

            <p className="mt-1 text-lg font-semibold">
              {hasNumber &&
              parsedTransferArea > 0
                ? formatNumber(
                    parsedTransferArea,
                  )
                : "—"}{" "}
              {assessment.landAreaUnit}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Remaining Area
            </p>

            <p className="mt-1 text-lg font-semibold">
              {hasNumber &&
              remainingArea >= 0
                ? formatNumber(
                    remainingArea,
                  )
                : "—"}{" "}
              {assessment.landAreaUnit}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        {!hasNumber ? (
          <p className="text-sm text-muted-foreground">
            Enter the area to transfer.
          </p>
        ) : !validTransferArea ? (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              Transfer area must be greater than 0 and
              less than the current land area.
            </span>
          </div>
        ) : !selectedTaxpayer ? (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              Select the taxpayer who will receive the
              transferred portion.
            </span>
          </div>
        ) : samePerson ? (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              The receiving taxpayer must be different
              from the current taxpayer.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              {formatNumber(
                parsedTransferArea,
              )}{" "}
              {assessment.landAreaUnit} will be transferred
              to <strong>{selectedTaxpayer.name}</strong>,
              leaving{" "}
              <strong>
                {formatNumber(remainingArea)}{" "}
                {assessment.landAreaUnit}
              </strong>
              .
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Land merge                                                                */
/* -------------------------------------------------------------------------- */

function LandMergeFields({
  assessment,
  mergedLandArea,
  onChange,
}: {
  assessment: Assessment;
  mergedLandArea: string;
  onChange: (value: string) => void;
}) {
  const parsedOtherLand = Number(
    mergedLandArea,
  );

  const hasNumber =
    mergedLandArea.trim() !== "" &&
    Number.isFinite(parsedOtherLand);

  const isValid =
    hasNumber && parsedOtherLand > 0;

  const combinedArea = isValid
    ? assessment.landArea + parsedOtherLand
    : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Current Land */}
        <div className="space-y-2">
          <Label>Current Land</Label>

          <div className="flex gap-2">
            <Input
              value={formatNumber(
                assessment.landArea,
              )}
              disabled
              readOnly
            />

            <UnitSuffix
              unit={assessment.landAreaUnit}
            />
          </div>
        </div>

        {/* Other Land - MANUAL INPUT */}
        <div className="space-y-2">
          <Label htmlFor="mergedLandArea">
            Other Land{" "}
            <span className="text-destructive">
              *
            </span>
          </Label>

          <div className="flex gap-2">
            <Input
              id="mergedLandArea"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter other land area"
              value={mergedLandArea}
              onChange={(event) =>
                onChange(event.target.value)
              }
            />

            <UnitSuffix
              unit={assessment.landAreaUnit}
            />
          </div>
        </div>
      </div>

      {/* Calculation */}
      <div
        className={`rounded-lg border p-5 ${
          isValid
            ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
            : "bg-muted/30"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Combined Land Area
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xl font-semibold">
            <span>
              {formatNumber(
                assessment.landArea,
              )}{" "}
              {assessment.landAreaUnit}
            </span>

            <span className="text-muted-foreground">
              +
            </span>

            <span>
              {isValid
                ? formatNumber(
                    parsedOtherLand,
                  )
                : "—"}{" "}
              {assessment.landAreaUnit}
            </span>

            <span className="text-muted-foreground">
              =
            </span>

            <span className="text-green-700 dark:text-green-400">
              {isValid
                ? formatNumber(
                    combinedArea,
                  )
                : "—"}{" "}
              {assessment.landAreaUnit}
            </span>
          </div>
        </div>

        <Separator className="my-4" />

        {!isValid ? (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              Enter the area of the other land to calculate
              the combined land area.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              Land merge result:{" "}
              <strong>
                {formatNumber(
                  assessment.landArea,
                )}{" "}
                {assessment.landAreaUnit} +{" "}
                {formatNumber(
                  parsedOtherLand,
                )}{" "}
                {assessment.landAreaUnit} ={" "}
                {formatNumber(
                  combinedArea,
                )}{" "}
                {assessment.landAreaUnit}
              </strong>
              .
            </span>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />

        <p>
          Enter the area of the other land manually. This
          amendment does not require selecting another
          assessment or parcel.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* File row                                                                  */
/* -------------------------------------------------------------------------- */

function DocumentFileRow({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
          {isImageFile(file) ? (
            <FileImage className="h-5 w-5 text-muted-foreground" />
          ) : (
            <FileText className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {file.name}
          </p>

          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {getFileExtension(file)}
            </span>

            <span>•</span>

            <span>
              {formatFileSize(file.size)}
            </span>
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reason and documents                                                       */
/* -------------------------------------------------------------------------- */

function ReasonAndDocumentsSection({
  reason,
  documents,
  onReasonChange,
  onFilesChange,
  onRemoveFile,
}: {
  reason: string;
  documents: File[];
  onReasonChange: (value: string) => void;
  onFilesChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onRemoveFile: (index: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Reason & Supporting Documents
        </CardTitle>

        <CardDescription>
          Explain why the land record is being amended and
          attach supporting documentation when available.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
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
              onReasonChange(event.target.value)
            }
            placeholder="Explain the reason for this amendment..."
            rows={5}
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Minimum 5 characters</span>

            <span>
              {reason.length} characters
            </span>
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-3">
          <div>
            <Label>
              Supporting Documents
            </Label>

            <p className="mt-1 text-xs text-muted-foreground">
              PDF, JPG, or PNG. Maximum 10 MB per file.
            </p>
          </div>

          <label
            htmlFor="supportingDocuments"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center transition hover:bg-muted/30"
          >
            <Upload className="mb-3 h-8 w-8 text-muted-foreground" />

            <p className="text-sm font-medium">
              Upload supporting document
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Click to browse files
            </p>

            <input
              id="supportingDocuments"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={onFilesChange}
            />
          </label>

          {documents.length > 0 && (
            <div className="space-y-2">
              {documents.map(
                (file, index) => (
                  <DocumentFileRow
                    key={`${file.name}-${file.size}-${index}`}
                    file={file}
                    onRemove={() =>
                      onRemoveFile(index)
                    }
                  />
                ),
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Main form                                                                  */
/* -------------------------------------------------------------------------- */

export function LeaseAmendmentForm({
  mode,
  assessment = MOCK_ASSESSMENT,
  taxpayers = MOCK_TAXPAYERS,
  initialValues,
  amendmentId: _amendmentId,
  onSubmit,
  onCancel,
}: LeaseAmendmentFormProps) {
  const [values, setValues] =
    useState<LeaseAmendmentFormValues>({
      amendmentType:
        initialValues?.amendmentType ?? null,

      newTaxpayerId:
        initialValues?.newTaxpayerId ?? null,

      newLandArea:
        initialValues?.newLandArea ?? "",

      transferArea:
        initialValues?.transferArea ?? "",

      mergedLandArea:
        initialValues?.mergedLandArea ?? "",

      reason:
        initialValues?.reason ?? "",

      supportingDocuments:
        initialValues?.supportingDocuments ?? [],
    });

  const [isSaving, setIsSaving] =
    useState(false);

  /* ---------------------------------------------------------------------- */
  /* Sync edit values                                                       */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!initialValues) {
      return;
    }

    setValues((current) => ({
      ...current,

      amendmentType:
        initialValues.amendmentType ??
        current.amendmentType,

      newTaxpayerId:
        initialValues.newTaxpayerId ??
        current.newTaxpayerId,

      newLandArea:
        initialValues.newLandArea ??
        current.newLandArea,

      transferArea:
        initialValues.transferArea ??
        current.transferArea,

      mergedLandArea:
        initialValues.mergedLandArea ??
        current.mergedLandArea,

      reason:
        initialValues.reason ??
        current.reason,

      supportingDocuments:
        initialValues.supportingDocuments ??
        current.supportingDocuments,
    }));
  }, [initialValues]);

  /* ---------------------------------------------------------------------- */
  /* Selected taxpayer                                                      */
  /* ---------------------------------------------------------------------- */

  const selectedNewTaxpayer =
    taxpayers.find(
      (taxpayer) =>
        taxpayer.id ===
        values.newTaxpayerId,
    );

  /* ---------------------------------------------------------------------- */
  /* Land Area Change validation                                             */
  /* ---------------------------------------------------------------------- */

  const parsedNewLandArea = Number(
    values.newLandArea,
  );

  const newLandAreaIsValid =
    values.newLandArea.trim() !== "" &&
    Number.isFinite(parsedNewLandArea) &&
    parsedNewLandArea > 0 &&
    parsedNewLandArea !==
      assessment.landArea;

  /* ---------------------------------------------------------------------- */
  /* Name Transfer validation                                               */
  /* ---------------------------------------------------------------------- */

  const newTaxpayerIsValid =
    !!selectedNewTaxpayer &&
    selectedNewTaxpayer.name
      .trim()
      .toLowerCase() !==
      assessment.citizen.name
        .trim()
        .toLowerCase();

  /* ---------------------------------------------------------------------- */
  /* Partial Transfer validation                                            */
  /* ---------------------------------------------------------------------- */

  const parsedTransferArea = Number(
    values.transferArea,
  );

  const transferAreaIsValid =
    values.transferArea.trim() !== "" &&
    Number.isFinite(parsedTransferArea) &&
    parsedTransferArea > 0 &&
    parsedTransferArea <
      assessment.landArea;

  const partialTransferIsValid =
    transferAreaIsValid &&
    newTaxpayerIsValid;

  /* ---------------------------------------------------------------------- */
  /* Land Merge validation                                                  */
  /* ---------------------------------------------------------------------- */

  const parsedMergedLandArea = Number(
    values.mergedLandArea,
  );

  const mergeIsValid =
    values.mergedLandArea.trim() !== "" &&
    Number.isFinite(parsedMergedLandArea) &&
    parsedMergedLandArea > 0;

  /* ---------------------------------------------------------------------- */
  /* General validation                                                     */
  /* ---------------------------------------------------------------------- */

  const reasonIsValid =
    values.reason.trim().length >= 5;

  const typeSpecificValid =
    values.amendmentType ===
    "LAND_AREA_CHANGE"
      ? newLandAreaIsValid
      : values.amendmentType ===
          "NAME_TRANSFER"
        ? newTaxpayerIsValid
        : values.amendmentType ===
            "PARTIAL_TRANSFER"
          ? partialTransferIsValid
          : values.amendmentType ===
              "MERGE"
            ? mergeIsValid
            : false;

  const canSubmit =
    !!values.amendmentType &&
    typeSpecificValid &&
    reasonIsValid;

  /* ---------------------------------------------------------------------- */
  /* Generic value updater                                                  */
  /* ---------------------------------------------------------------------- */

  const updateValue = <
    K extends keyof LeaseAmendmentFormValues,
  >(
    key: K,
    value: LeaseAmendmentFormValues[K],
  ) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  /* ---------------------------------------------------------------------- */
  /* Amendment type change                                                   */
  /* ---------------------------------------------------------------------- */

  const handleTypeChange = (
    type: AmendmentType,
  ) => {
    setValues((current) => ({
      ...current,

      amendmentType: type,

      /*
       * Only keep taxpayer when the selected amendment
       * actually needs a new taxpayer.
       */
      newTaxpayerId:
        type === "NAME_TRANSFER" ||
        type === "PARTIAL_TRANSFER"
          ? current.newTaxpayerId
          : null,

      /*
       * Only keep new land area for
       * LAND_AREA_CHANGE.
       */
      newLandArea:
        type === "LAND_AREA_CHANGE"
          ? current.newLandArea
          : "",

      /*
       * Only keep transfer area for
       * PARTIAL_TRANSFER.
       */
      transferArea:
        type === "PARTIAL_TRANSFER"
          ? current.transferArea
          : "",

      /*
       * Only keep other land area for
       * MERGE.
       */
      mergedLandArea:
        type === "MERGE"
          ? current.mergedLandArea
          : "",
    }));
  };

  /* ---------------------------------------------------------------------- */
  /* File handling                                                           */
  /* ---------------------------------------------------------------------- */

  const handleFilesChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(
      event.target.files ?? [],
    );

    if (files.length === 0) {
      return;
    }

    const validFiles: File[] = [];

    for (const file of files) {
      if (
        !ALLOWED_FILE_TYPES.includes(
          file.type,
        )
      ) {
        toast.error(
          `${file.name}: Only PDF, JPG, and PNG files are allowed.`,
        );

        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `${file.name}: File size must not exceed 10 MB.`,
        );

        continue;
      }

      const duplicate =
        values.supportingDocuments.some(
          (existingFile) =>
            existingFile.name ===
              file.name &&
            existingFile.size ===
              file.size &&
            existingFile.lastModified ===
              file.lastModified,
        );

      if (duplicate) {
        toast.error(
          `${file.name}: This file has already been added.`,
        );

        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setValues((current) => ({
        ...current,

        supportingDocuments: [
          ...current.supportingDocuments,
          ...validFiles,
        ],
      }));
    }

    event.target.value = "";
  };

  /* ---------------------------------------------------------------------- */
  /* Remove file                                                             */
  /* ---------------------------------------------------------------------- */

  const handleRemoveFile = (
    index: number,
  ) => {
    setValues((current) => ({
      ...current,

      supportingDocuments:
        current.supportingDocuments.filter(
          (_, fileIndex) =>
            fileIndex !== index,
        ),
    }));
  };

  /* ---------------------------------------------------------------------- */
  /* Submit                                                                  */
  /* ---------------------------------------------------------------------- */

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error(
        "Please complete all required amendment information.",
      );

      return;
    }

    try {
      setIsSaving(true);

      if (onSubmit) {
        await onSubmit(values);
      } else {
        toast.success(
          mode === "create"
            ? "Lease amendment saved successfully."
            : "Lease amendment updated successfully.",
        );
      }
    } catch (error) {
      console.error(
        "Lease amendment submission failed:",
        error,
      );

      toast.error(
        "Unable to save the lease amendment. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Render                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "create"
            ? "Create Lease Amendment"
            : "Edit Lease Amendment"}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Record a change to an existing land record.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Source land                                                        */}
      {/* ------------------------------------------------------------------ */}

      <SourceAssessmentSection
        assessment={assessment}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Amendment details                                                  */}
      {/* ------------------------------------------------------------------ */}

      <Card>
        <CardHeader>
          <CardTitle>
            Amendment Details
          </CardTitle>

          <CardDescription>
            Select the land operation that needs to be
            recorded.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Amendment type */}
          <div className="space-y-2">
            <Label>
              Amendment Type{" "}
              <span className="text-destructive">
                *
              </span>
            </Label>

            <Select
              value={
                values.amendmentType ??
                undefined
              }
              onValueChange={(value) =>
                handleTypeChange(
                  value as AmendmentType,
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select amendment type" />
              </SelectTrigger>

              <SelectContent>
                {(
                  Object.keys(
                    AMENDMENT_TYPE_LABELS,
                  ) as AmendmentType[]
                ).map((type) => (
                  <SelectItem
                    key={type}
                    value={type}
                  >
                    {AMENDMENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {values.amendmentType && (
              <p className="text-xs text-muted-foreground">
                {
                  AMENDMENT_TYPE_DESCRIPTIONS[
                    values.amendmentType
                  ]
                }
              </p>
            )}
          </div>

          {values.amendmentType && (
            <>
              <Separator />

              {/* -------------------------------------------------------- */}
              {/* Land Area Change                                         */}
              {/* -------------------------------------------------------- */}

              {values.amendmentType ===
                "LAND_AREA_CHANGE" && (
                <LandAreaChangeFields
                  assessment={assessment}
                  newLandArea={
                    values.newLandArea
                  }
                  onChange={(value) =>
                    updateValue(
                      "newLandArea",
                      value,
                    )
                  }
                />
              )}

              {/* -------------------------------------------------------- */}
              {/* Name Transfer                                             */}
              {/* -------------------------------------------------------- */}

              {values.amendmentType ===
                "NAME_TRANSFER" && (
                <NameTransferFields
                  assessment={assessment}
                  taxpayers={taxpayers}
                  newTaxpayerId={
                    values.newTaxpayerId
                  }
                  onChange={(value) =>
                    updateValue(
                      "newTaxpayerId",
                      value,
                    )
                  }
                />
              )}

              {/* -------------------------------------------------------- */}
              {/* Partial Transfer                                          */}
              {/* -------------------------------------------------------- */}

              {values.amendmentType ===
                "PARTIAL_TRANSFER" && (
                <PartialTransferFields
                  assessment={assessment}
                  taxpayers={taxpayers}
                  transferArea={
                    values.transferArea
                  }
                  newTaxpayerId={
                    values.newTaxpayerId
                  }
                  onTransferAreaChange={(
                    value,
                  ) =>
                    updateValue(
                      "transferArea",
                      value,
                    )
                  }
                  onTaxpayerChange={(value) =>
                    updateValue(
                      "newTaxpayerId",
                      value,
                    )
                  }
                />
              )}

              {/* -------------------------------------------------------- */}
              {/* Land Merge                                                */}
              {/* -------------------------------------------------------- */}

              {values.amendmentType ===
                "MERGE" && (
                <LandMergeFields
                  assessment={assessment}
                  mergedLandArea={
                    values.mergedLandArea
                  }
                  onChange={(value) =>
                    updateValue(
                      "mergedLandArea",
                      value,
                    )
                  }
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Reason and documents                                              */}
      {/* ------------------------------------------------------------------ */}

      <ReasonAndDocumentsSection
        reason={values.reason}
        documents={
          values.supportingDocuments
        }
        onReasonChange={(value) =>
          updateValue(
            "reason",
            value,
          )
        }
        onFilesChange={handleFilesChange}
        onRemoveFile={handleRemoveFile}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Business rule                                                      */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex gap-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />

        <div>
          <p className="font-medium text-foreground">
            Amendment processing rule
          </p>

          <p className="mt-1">
            This amendment records the land change only.
            It does not modify the existing assessment
            services, invoices, or payment schedules.
            After approval, the old assessment can be
            superseded and a separate replacement
            assessment can be created.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Actions                                                            */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex items-center justify-end gap-3 border-t pt-5">
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          type="button"
          disabled={
            !canSubmit || isSaving
          }
          onClick={handleSubmit}
        >
          <Save className="mr-2 h-4 w-4" />

          {isSaving
            ? "Saving..."
            : mode === "create"
              ? "Save Amendment"
              : "Update Amendment"}
        </Button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Validation hint                                                    */}
      {/* ------------------------------------------------------------------ */}

      {!canSubmit &&
        values.amendmentType &&
        values.reason.length > 0 && (
          <p className="text-right text-xs text-muted-foreground">
            Complete the required amendment fields
            before saving.
          </p>
        )}
    </div>
  );
}

export default LeaseAmendmentForm;