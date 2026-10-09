
"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
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

import { FileUpload } from "@/components/file-upload";
import { TaxpayerSelector } from "../revenue/assessment/taxpayer-selector";
import type { Assessment } from "@/types/revenue/assessment";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type AmendmentType =
  | "LAND_AREA_CHANGE"
  | "NAME_TRANSFER"
  | "PARTIAL_TRANSFER"
  | "MERGE";

export type LeaseAmendmentMode = "create" | "edit";

export type LeaseAmendmentFormValues = {
  amendmentType: AmendmentType | null;
  newTaxpayerId: string | null;
  newLandArea: string;
  transferArea: string;
  mergedLandArea: string;
  reason: string;
  supportingDocuments: File[];
};

export type LeaseAmendmentFormProps = {
  mode: LeaseAmendmentMode;
  assessment: Assessment;
  initialValues?: Partial<LeaseAmendmentFormValues>;
  amendmentId?: string;
  onSubmit?: (
    values: LeaseAmendmentFormValues,
  ) => Promise<void> | void;
  onCancel?: () => void;
};

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Replace these with the actual land-area fieldCode values returned
 * by your Laravel assessment API.
 */
const LAND_AREA_FIELD_CODES = [
  "LAND_AREA",
  "land_area",
  "LAND_AREA_M2",
  "LAND_AREA_SQM",
];

const LAND_AREA_UNIT = "m²";
const MIN_REASON_LENGTH = 5;

const AMENDMENT_TYPE_LABELS: Record<AmendmentType, string> = {
  LAND_AREA_CHANGE: "Land Area Change",
  NAME_TRANSFER: "Ownership Transfer",
  PARTIAL_TRANSFER: "Partial Land Transfer",
  MERGE: "Land Merge",
};

const AMENDMENT_TYPE_DESCRIPTIONS: Record<AmendmentType, string> = {
  LAND_AREA_CHANGE: "Correct or update the registered land area.",
  NAME_TRANSFER: "Transfer ownership to another registered taxpayer.",
  PARTIAL_TRANSFER: "Transfer part of the land to another taxpayer.",
  MERGE: "Combine this land with another verified land parcel.",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function parseNumericValue(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = Number(value.trim().replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : null;
}

function getAssessmentLandArea(
  assessment: Assessment,
): number | null {
  for (const fieldCode of LAND_AREA_FIELD_CODES) {
    for (const service of assessment.services ?? []) {
      const field = service.values?.find(
        (item) => item.fieldCode === fieldCode,
      );

      if (!field) {
        continue;
      }

      const value = parseNumericValue(field.value);

      if (value !== null && value > 0) {
        return value;
      }

      const displayValue = parseNumericValue(field.displayValue);

      if (displayValue !== null && displayValue > 0) {
        return displayValue;
      }
    }
  }

  return null;
}

function getCurrentTaxpayerName(
  assessment: Assessment,
): string {
  return assessment.taxpayer?.fullName?.trim() || "Not available";
}

function getStatusLabel(status: string): string {
  return status
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/* -------------------------------------------------------------------------- */
/* Shared field components                                                    */
/* -------------------------------------------------------------------------- */

function LandAreaInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="flex gap-2">
        <Input
          id={id}
          type="number"
          min="0"
          step="0.01"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={!onChange}
          onChange={(event) => onChange?.(event.target.value)}
          className="py-5"
        />

        <div className="flex h-10 shrink-0 items-center rounded-md border px-3 text-sm text-muted-foreground">
          {LAND_AREA_UNIT}
        </div>
      </div>
    </div>
  );
}

function LandAreaNotice() {
  return (
    <p className="text-sm text-destructive">
      The registered land area is unavailable. Verify the land-area field
      configuration before continuing.
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Source assessment                                                          */
/* -------------------------------------------------------------------------- */

function SourceAssessmentSection({
  assessment,
  currentLandArea,
}: {
  assessment: Assessment;
  currentLandArea: number | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Source Assessment</CardTitle>
        <CardDescription>Existing land record</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="text-muted-foreground">Assessment Number</p>
          <p className="mt-1 break-words font-medium">
            {assessment.assessmentNumber || "Not available"}
          </p>
        </div>

        <div>
          <p className="text-muted-foreground">Current Taxpayer</p>
          <p className="mt-1 font-medium">
            {getCurrentTaxpayerName(assessment)}
          </p>
        </div>

        <div>
          <p className="text-muted-foreground">Assessment Status</p>
          <p className="mt-1 font-medium">
            {getStatusLabel(assessment.status || "Unknown")}
          </p>
        </div>

        <Separator />

        <div>
          <p className="text-muted-foreground">Registered Land Area</p>
          <p className="mt-1 text-xl font-semibold">
            {currentLandArea === null
              ? "Unavailable"
              : `${formatNumber(currentLandArea)} ${LAND_AREA_UNIT}`}
          </p>
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          The source assessment is read-only. Changes must be processed through
          the authorized amendment workflow.
        </p>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Land area change                                                           */
/* -------------------------------------------------------------------------- */

function LandAreaChangeFields({
  currentLandArea,
  newLandArea,
  onChange,
}: {
  currentLandArea: number | null;
  newLandArea: string;
  onChange: (value: string) => void;
}) {
  const parsedValue = parseNumericValue(newLandArea);

  const isValid =
    currentLandArea !== null &&
    parsedValue !== null &&
    newLandArea.trim() !== "" &&
    parsedValue > 0 &&
    parsedValue !== currentLandArea;

  if (currentLandArea === null) {
    return <LandAreaNotice />;
  }

  const difference =
    parsedValue !== null ? parsedValue - currentLandArea : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <LandAreaInput
          id="currentLandArea"
          label="Current Land Area"
          value={formatNumber(currentLandArea)}
          disabled
        />

        <LandAreaInput
          id="newLandArea"
          label="New Land Area *"
          value={newLandArea}
          onChange={onChange}
          placeholder="Enter new area"
        />
      </div>

      {newLandArea.trim() !== "" && parsedValue !== null && (
        <p
          className={`text-sm ${
            isValid ? "text-muted-foreground" : "text-destructive"
          }`}
        >
          {isValid && difference !== null
            ? `Change: ${difference > 0 ? "+" : ""}${formatNumber(difference)} ${LAND_AREA_UNIT}`
            : "Enter a positive land area different from the current area."}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Ownership transfer                                                         */
/* -------------------------------------------------------------------------- */

function NameTransferFields({
  assessment,
  newTaxpayerId,
  onChange,
}: {
  assessment: Assessment;
  newTaxpayerId: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-2">
        <Label>Current Taxpayer</Label>
        <Input
          value={getCurrentTaxpayerName(assessment)}
          readOnly
          disabled
          className="py-5"
        />
      </div>

      <div className="space-y-2">
        <Label>
          New Taxpayer <span className="text-destructive">*</span>
        </Label>

        <TaxpayerSelector
          value={newTaxpayerId ?? ""}
          onChange={(taxpayerId) => onChange(taxpayerId || null)}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Partial transfer                                                           */
/* -------------------------------------------------------------------------- */

function PartialTransferFields({
  currentLandArea,
  transferArea,
  newTaxpayerId,
  onTransferAreaChange,
  onTaxpayerChange,
}: {
  currentLandArea: number | null;
  transferArea: string;
  newTaxpayerId: string | null;
  onTransferAreaChange: (value: string) => void;
  onTaxpayerChange: (value: string | null) => void;
}) {
  const parsedTransferArea = parseNumericValue(transferArea);

  if (currentLandArea === null) {
    return <LandAreaNotice />;
  }

  const validTransferArea =
    parsedTransferArea !== null &&
    transferArea.trim() !== "" &&
    parsedTransferArea > 0 &&
    parsedTransferArea < currentLandArea;

  const remainingArea =
    parsedTransferArea !== null && validTransferArea
      ? currentLandArea - parsedTransferArea
      : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <LandAreaInput
          id="partialCurrentArea"
          label="Current Land Area"
          value={formatNumber(currentLandArea)}
          disabled
        />

        <LandAreaInput
          id="transferArea"
          label="Transfer Area *"
          value={transferArea}
          onChange={onTransferAreaChange}
          placeholder="Enter transfer area"
        />
      </div>

      <div className="space-y-2">
        <Label>
          Receiving Taxpayer <span className="text-destructive">*</span>
        </Label>

        <TaxpayerSelector
          value={newTaxpayerId ?? ""}
          onChange={(taxpayerId) =>
            onTaxpayerChange(taxpayerId || null)
          }
        />
      </div>

      <div className="rounded-md bg-muted/40 p-3 text-sm">
        <div className="flex flex-wrap justify-between gap-2">
          <span className="text-muted-foreground">Remaining Land Area</span>
          <span className="font-medium">
            {remainingArea !== null
              ? `${formatNumber(remainingArea)} ${LAND_AREA_UNIT}`
              : "—"}
          </span>
        </div>

        {transferArea.trim() !== "" && !validTransferArea && (
          <p className="mt-2 text-destructive">
            The transfer area must be greater than zero and less than the
            current land area.
          </p>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Land merge                                                                 */
/* -------------------------------------------------------------------------- */

function LandMergeFields({
  currentLandArea,
  mergedLandArea,
  onChange,
}: {
  currentLandArea: number | null;
  mergedLandArea: string;
  onChange: (value: string) => void;
}) {
  const parsedOtherLand = parseNumericValue(mergedLandArea);

  if (currentLandArea === null) {
    return <LandAreaNotice />;
  }

  const isValid =
    parsedOtherLand !== null &&
    mergedLandArea.trim() !== "" &&
    parsedOtherLand > 0;

  const combinedArea =
    isValid && parsedOtherLand !== null
      ? currentLandArea + parsedOtherLand
      : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <LandAreaInput
          id="mergeCurrentArea"
          label="Current Land Area"
          value={formatNumber(currentLandArea)}
          disabled
        />

        <LandAreaInput
          id="mergedLandArea"
          label="Other Land Area *"
          value={mergedLandArea}
          onChange={onChange}
          placeholder="Enter other land area"
        />
      </div>

      <div className="rounded-md bg-muted/40 p-3 text-sm">
        <div className="flex flex-wrap justify-between gap-2">
          <span className="text-muted-foreground">Combined Land Area</span>
          <span className="font-semibold">
            {combinedArea !== null
              ? `${formatNumber(combinedArea)} ${LAND_AREA_UNIT}`
              : "—"}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        The other land parcel must be identified and verified before the merge
        is approved. This form records the additional area only.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reason and supporting documents                                            */
/* -------------------------------------------------------------------------- */

function ReasonAndDocumentsSection({
  reason,
  documents,
  onReasonChange,
  onDocumentsChange,
  disabled,
}: {
  reason: string;
  documents: File[];
  onReasonChange: (value: string) => void;
  onDocumentsChange: (files: File[]) => void;
  disabled: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reason & Supporting Documents</CardTitle>
        <CardDescription>
          Explain the amendment and attach the relevant supporting evidence.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="reason">
            Reason <span className="text-destructive">*</span>
          </Label>

          <Textarea
            id="reason"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Explain why this amendment is required..."
            rows={4}
            disabled={disabled}
            aria-invalid={
              reason.trim().length > 0 &&
              reason.trim().length < MIN_REASON_LENGTH
            }
          />

          <p className="text-xs text-muted-foreground">
            Minimum {MIN_REASON_LENGTH} characters. {reason.length} entered.
          </p>
        </div>

        <Separator />

        <FileUpload
          id="lease-supporting-documents"
          label="Supporting Documents"
          description="Upload evidence supporting this lease amendment. PDF, JPG, or PNG; maximum 10 MB per file."
          placeholder="Choose supporting documents"
          value={documents}
          onChange={onDocumentsChange}
          multiple
          maxFiles={5}
          maxSizeMB={10}
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Main form                                                                  */
/* -------------------------------------------------------------------------- */

export function LeaseAmendmentForm({
  mode,
  assessment,
  initialValues,
  amendmentId,
  onSubmit,
  onCancel,
}: LeaseAmendmentFormProps) {
  const currentLandArea = useMemo(
    () => getAssessmentLandArea(assessment),
    [assessment],
  );

  const [values, setValues] = useState<LeaseAmendmentFormValues>({
    amendmentType: initialValues?.amendmentType ?? null,
    newTaxpayerId: initialValues?.newTaxpayerId ?? null,
    newLandArea: initialValues?.newLandArea ?? "",
    transferArea: initialValues?.transferArea ?? "",
    mergedLandArea: initialValues?.mergedLandArea ?? "",
    reason: initialValues?.reason ?? "",
    supportingDocuments: initialValues?.supportingDocuments ?? [],
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!initialValues) {
      return;
    }

    setValues((current) => ({
      ...current,
      ...initialValues,
      supportingDocuments:
        initialValues.supportingDocuments ??
        current.supportingDocuments,
    }));
  }, [initialValues]);

  /* ---------------------------------------------------------------------- */
  /* Validation                                                             */
  /* ---------------------------------------------------------------------- */

  const parsedNewLandArea = parseNumericValue(values.newLandArea);

  const newLandAreaIsValid =
    currentLandArea !== null &&
    parsedNewLandArea !== null &&
    values.newLandArea.trim() !== "" &&
    parsedNewLandArea > 0 &&
    parsedNewLandArea !== currentLandArea;

  const parsedTransferArea = parseNumericValue(values.transferArea);

  const transferAreaIsValid =
    currentLandArea !== null &&
    parsedTransferArea !== null &&
    values.transferArea.trim() !== "" &&
    parsedTransferArea > 0 &&
    parsedTransferArea < currentLandArea;

  const newTaxpayerIsValid =
    Boolean(values.newTaxpayerId) &&
    String(values.newTaxpayerId) !==
      String(assessment.citizenId ?? "");

  const partialTransferIsValid =
    transferAreaIsValid && newTaxpayerIsValid;

  const parsedMergedLandArea = parseNumericValue(values.mergedLandArea);

  const mergeIsValid =
    currentLandArea !== null &&
    parsedMergedLandArea !== null &&
    values.mergedLandArea.trim() !== "" &&
    parsedMergedLandArea > 0;

  const reasonIsValid =
    values.reason.trim().length >= MIN_REASON_LENGTH;

  const typeSpecificValid =
    values.amendmentType === "LAND_AREA_CHANGE"
      ? newLandAreaIsValid
      : values.amendmentType === "NAME_TRANSFER"
        ? newTaxpayerIsValid
        : values.amendmentType === "PARTIAL_TRANSFER"
          ? partialTransferIsValid
          : values.amendmentType === "MERGE"
            ? mergeIsValid
            : false;

  const canSubmit =
    currentLandArea !== null &&
    Boolean(values.amendmentType) &&
    typeSpecificValid &&
    reasonIsValid;

  /* ---------------------------------------------------------------------- */
  /* Update values                                                          */
  /* ---------------------------------------------------------------------- */

  const updateValue = <K extends keyof LeaseAmendmentFormValues>(
    key: K,
    value: LeaseAmendmentFormValues[K],
  ) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  /* ---------------------------------------------------------------------- */
  /* Amendment type                                                         */
  /* ---------------------------------------------------------------------- */

  const handleTypeChange = (type: AmendmentType) => {
    setValues((current) => ({
      ...current,
      amendmentType: type,
      newTaxpayerId:
        type === "NAME_TRANSFER" || type === "PARTIAL_TRANSFER"
          ? current.newTaxpayerId
          : null,
      newLandArea:
        type === "LAND_AREA_CHANGE" ? current.newLandArea : "",
      transferArea:
        type === "PARTIAL_TRANSFER" ? current.transferArea : "",
      mergedLandArea: type === "MERGE" ? current.mergedLandArea : "",
    }));
  };

  /* ---------------------------------------------------------------------- */
  /* Submit                                                                 */
  /* ---------------------------------------------------------------------- */

  const handleSubmit = async () => {
    if (currentLandArea === null) {
      toast.error(
        "The source assessment's land area is unavailable. Verify the land-area field configuration.",
      );
      return;
    }

    if (!canSubmit) {
      toast.error("Complete the required amendment fields before saving.");
      return;
    }

    if (!onSubmit) {
      toast.error(
        "The save handler is not configured. Connect the form to the lease amendment API.",
      );
      return;
    }

    try {
      setIsSaving(true);
      await onSubmit(values);
    } catch (error) {
      console.error("Lease amendment submission failed:", error);
      toast.error("Unable to save the amendment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "create" ? "Create Amendment" : "Edit Amendment"}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Update the details of an existing land lease.
          {mode === "edit" && amendmentId
            ? ` Amendment reference: ${amendmentId}`
            : ""}
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Amendment Details</CardTitle>
              <CardDescription>
                Select the amendment type and enter the required information.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amendmentType">
                  Amendment Type{" "}
                  <span className="text-destructive">*</span>
                </Label>

                <Select
                  value={values.amendmentType ?? undefined}
                  onValueChange={(value) =>
                    handleTypeChange(value as AmendmentType)
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger
                    id="amendmentType"
                    className="w-full py-5"
                  >
                    <SelectValue placeholder="Select amendment type" />
                  </SelectTrigger>

                  <SelectContent>
                    {(
                      Object.keys(
                        AMENDMENT_TYPE_LABELS,
                      ) as AmendmentType[]
                    ).map((type) => (
                      <SelectItem key={type} value={type}>
                        {AMENDMENT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {values.amendmentType && (
                  <p className="text-sm text-muted-foreground">
                    {AMENDMENT_TYPE_DESCRIPTIONS[values.amendmentType]}
                  </p>
                )}
              </div>

              {values.amendmentType && (
                <>
                  <Separator />

                  {values.amendmentType === "LAND_AREA_CHANGE" && (
                    <LandAreaChangeFields
                      currentLandArea={currentLandArea}
                      newLandArea={values.newLandArea}
                      onChange={(value) =>
                        updateValue("newLandArea", value)
                      }
                    />
                  )}

                  {values.amendmentType === "NAME_TRANSFER" && (
                    <NameTransferFields
                      assessment={assessment}
                      newTaxpayerId={values.newTaxpayerId}
                      onChange={(value) =>
                        updateValue("newTaxpayerId", value)
                      }
                    />
                  )}

                  {values.amendmentType === "PARTIAL_TRANSFER" && (
                    <PartialTransferFields
                      currentLandArea={currentLandArea}
                      transferArea={values.transferArea}
                      newTaxpayerId={values.newTaxpayerId}
                      onTransferAreaChange={(value) =>
                        updateValue("transferArea", value)
                      }
                      onTaxpayerChange={(value) =>
                        updateValue("newTaxpayerId", value)
                      }
                    />
                  )}

                  {values.amendmentType === "MERGE" && (
                    <LandMergeFields
                      currentLandArea={currentLandArea}
                      mergedLandArea={values.mergedLandArea}
                      onChange={(value) =>
                        updateValue("mergedLandArea", value)
                      }
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <ReasonAndDocumentsSection
            reason={values.reason}
            documents={values.supportingDocuments}
            onReasonChange={(value) => updateValue("reason", value)}
            onDocumentsChange={(files) =>
              updateValue("supportingDocuments", files)
            }
            disabled={isSaving}
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
              disabled={!canSubmit || isSaving}
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

          {!canSubmit && values.amendmentType && (
            <p className="text-right text-xs text-muted-foreground">
              Complete the required fields before saving.
            </p>
          )}
        </div>

        <aside className="min-w-0">
          <SourceAssessmentSection
            assessment={assessment}
            currentLandArea={currentLandArea}
          />
        </aside>
      </div>
    </div>
  );
}

export default LeaseAmendmentForm;