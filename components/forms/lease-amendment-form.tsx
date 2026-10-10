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

import {
  AMENDMENT_TYPE_DESCRIPTIONS,
  AMENDMENT_TYPE_LABELS,
  LAND_AREA_FIELD_CODES,
  LAND_AREA_UNIT,
  MIN_REASON_LENGTH,
} from "@/types/assessment/lease-amendment";

import type {
  AmendmentType,
  LeaseAmendmentFormProps,
  LeaseAmendmentFormValues,
} from "@/types/assessment/lease-amendment";

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

/**
 * Reads a land-area value from the assessment's service values.
 */
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

/**
 * Supports camelCase and snake_case API properties.
 */
function getCurrentTaxpayerId(
  assessment: Assessment,
): string | null {
  const record = assessment as unknown as Record<string, unknown>;

  const value =
    record.citizenId ??
    record.citizen_id ??
    record.taxpayerId ??
    record.taxpayer_id ??
    null;

  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function getStatusLabel(status: string): string {
  return status
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function isAmendmentType(value: string): value is AmendmentType {
  return Object.prototype.hasOwnProperty.call(
    AMENDMENT_TYPE_LABELS,
    value,
  );
}

/**
 * Land area is required only for amendment types that use it.
 * Generic amendments and ownership transfers do not inherently require it.
 */
function amendmentRequiresLandArea(
  type: AmendmentType | null,
): boolean {
  return (
    type === "LAND_AREA_CHANGE" ||
    type === "PARTIAL_TRANSFER" ||
    type === "LAND_MERGE"
  );
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
      configuration before continuing with this amendment.
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
  disabled,
}: {
  currentLandArea: number | null;
  newLandArea: string;
  onChange: (value: string) => void;
  disabled: boolean;
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
          disabled={disabled}
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

function OwnershipTransferFields({
  assessment,
  newTaxpayerId,
  onChange,
  disabled,
}: {
  assessment: Assessment;
  newTaxpayerId: string | null;
  onChange: (value: string | null) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-2">
        <Label htmlFor="currentTaxpayer">Current Taxpayer</Label>
        <Input
          id="currentTaxpayer"
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
          disabled={disabled}
        />

        <p className="text-xs text-muted-foreground">
          Select the registered taxpayer who will receive ownership.
        </p>
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
  disabled,
}: {
  currentLandArea: number | null;
  transferArea: string;
  newTaxpayerId: string | null;
  onTransferAreaChange: (value: string) => void;
  onTaxpayerChange: (value: string | null) => void;
  disabled: boolean;
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
          disabled={disabled}
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
          disabled={disabled}
        />
      </div>

      <div className="rounded-md bg-muted/40 p-3 text-sm">
        <div className="flex flex-wrap justify-between gap-2">
          <span className="text-muted-foreground">
            Remaining Land Area
          </span>

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
  disabled,
}: {
  currentLandArea: number | null;
  mergedLandArea: string;
  onChange: (value: string) => void;
  disabled: boolean;
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
          disabled={disabled}
        />
      </div>

      <div className="rounded-md bg-muted/40 p-3 text-sm">
        <div className="flex flex-wrap justify-between gap-2">
          <span className="text-muted-foreground">
            Combined Land Area
          </span>

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
/* Other amendment                                                            */
/* -------------------------------------------------------------------------- */

function OtherAmendmentFields({
  description,
  onChange,
  disabled,
}: {
  description: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="otherAmendmentDescription">
        Amendment Description <span className="text-destructive">*</span>
      </Label>

      <Textarea
        id="otherAmendmentDescription"
        value={description}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Describe the amendment and the specific record that needs to change..."
        rows={4}
        disabled={disabled}
        aria-invalid={
          description.trim().length > 0 &&
          description.trim().length < 5
        }
      />

      <p className="text-xs text-muted-foreground">
        Provide at least 5 characters describing the amendment.
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
          Explain why the amendment is required and attach supporting evidence.
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
            Minimum {MIN_REASON_LENGTH} characters.{" "}
            {reason.trim().length} entered.
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

  const currentTaxpayerId = useMemo(
    () => getCurrentTaxpayerId(assessment),
    [assessment],
  );

  const [values, setValues] = useState<LeaseAmendmentFormValues>({
    amendmentType: initialValues?.amendmentType ?? null,
    newTaxpayerId: initialValues?.newTaxpayerId ?? null,
    newLandArea: initialValues?.newLandArea ?? "",
    transferArea: initialValues?.transferArea ?? "",
    mergedLandArea: initialValues?.mergedLandArea ?? "",
    otherAmendmentDescription:
      initialValues?.otherAmendmentDescription ?? "",
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
  /* Validation                                                              */
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
    values.newTaxpayerId !== currentTaxpayerId;

  const partialTransferIsValid =
    transferAreaIsValid && newTaxpayerIsValid;

  const parsedMergedLandArea = parseNumericValue(values.mergedLandArea);

  const mergeIsValid =
    currentLandArea !== null &&
    parsedMergedLandArea !== null &&
    values.mergedLandArea.trim() !== "" &&
    parsedMergedLandArea > 0;

  const otherDescriptionIsValid =
    values.otherAmendmentDescription.trim().length >= 5;

  const reasonIsValid =
    values.reason.trim().length >= MIN_REASON_LENGTH;

  const typeSpecificValid: boolean =
    values.amendmentType === "LAND_AREA_CHANGE"
      ? newLandAreaIsValid
      : values.amendmentType === "OWNERSHIP_TRANSFER"
        ? newTaxpayerIsValid
        : values.amendmentType === "PARTIAL_TRANSFER"
          ? partialTransferIsValid
          : values.amendmentType === "LAND_MERGE"
            ? mergeIsValid
            : values.amendmentType === "OTHER"
              ? otherDescriptionIsValid
              : false;

  const landAreaIsAvailable =
    !amendmentRequiresLandArea(values.amendmentType) ||
    currentLandArea !== null;

  const canSubmit =
    values.amendmentType !== null &&
    landAreaIsAvailable &&
    typeSpecificValid &&
    reasonIsValid;

  /* ---------------------------------------------------------------------- */
  /* Update values                                                           */
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
  /* Amendment type                                                          */
  /* ---------------------------------------------------------------------- */

  const handleTypeChange = (value: string) => {
    if (!isAmendmentType(value)) {
      toast.error("The selected amendment type is not supported.");
      return;
    }

    const type = value;

    setValues((current) => ({
      ...current,
      amendmentType: type,

      newTaxpayerId:
        type === "OWNERSHIP_TRANSFER" ||
        type === "PARTIAL_TRANSFER"
          ? current.newTaxpayerId
          : null,

      newLandArea:
        type === "LAND_AREA_CHANGE"
          ? current.newLandArea
          : "",

      transferArea:
        type === "PARTIAL_TRANSFER"
          ? current.transferArea
          : "",

      mergedLandArea:
        type === "LAND_MERGE"
          ? current.mergedLandArea
          : "",

      otherAmendmentDescription:
        type === "OTHER"
          ? current.otherAmendmentDescription
          : "",
    }));
  };

  /* ---------------------------------------------------------------------- */
  /* Submit                                                                  */
  /* ---------------------------------------------------------------------- */

  const handleSubmit = async () => {
    if (!values.amendmentType) {
      toast.error("Please select an amendment type.");
      return;
    }

    if (
      amendmentRequiresLandArea(values.amendmentType) &&
      currentLandArea === null
    ) {
      toast.error(
        "The source assessment's land area is unavailable. Verify the land-area field configuration.",
      );
      return;
    }

    if (
      values.amendmentType === "OWNERSHIP_TRANSFER" &&
      !currentTaxpayerId
    ) {
      toast.error(
        "The current taxpayer ID could not be determined. Reload the assessment before continuing.",
      );
      return;
    }

    if (
      values.amendmentType === "OTHER" &&
      !otherDescriptionIsValid
    ) {
      toast.error(
        "Enter an amendment description of at least 5 characters.",
      );
      return;
    }

    if (!reasonIsValid) {
      toast.error(
        `The reason must contain at least ${MIN_REASON_LENGTH} characters.`,
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

    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      await onSubmit(values);
    } catch (error) {
      console.error("Lease amendment submission failed:", error);
      // The page-level handler is responsible for displaying the API error.
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Render                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
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
                  onValueChange={handleTypeChange}
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
                      disabled={isSaving}
                    />
                  )}

                  {values.amendmentType === "OWNERSHIP_TRANSFER" && (
                    <OwnershipTransferFields
                      assessment={assessment}
                      newTaxpayerId={values.newTaxpayerId}
                      onChange={(value) =>
                        updateValue("newTaxpayerId", value)
                      }
                      disabled={isSaving}
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
                      disabled={isSaving}
                    />
                  )}

                  {values.amendmentType === "LAND_MERGE" && (
                    <LandMergeFields
                      currentLandArea={currentLandArea}
                      mergedLandArea={values.mergedLandArea}
                      onChange={(value) =>
                        updateValue("mergedLandArea", value)
                      }
                      disabled={isSaving}
                    />
                  )}

                  {values.amendmentType === "OTHER" && (
                    <OtherAmendmentFields
                      description={values.otherAmendmentDescription}
                      onChange={(value) =>
                        updateValue("otherAmendmentDescription", value)
                      }
                      disabled={isSaving}
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