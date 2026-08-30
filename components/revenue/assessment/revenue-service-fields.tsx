"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { AlertCircle, ChevronDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { RevenueField, RevenueService } from "@/types/revenue/assessment";

import { RevenueDynamicField } from "@/components/revenue/fields/RevenueDynamicField";

// Reuse the single source of truth for collection-mode
// labels instead of maintaining a second, conflicting
// dictionary here. Collection mode is NOT pricing — it
// only describes how the service is collected. Actual
// tariff selection and amount calculation are handled
// by the backend Decision Provider.
import { formatCollectionMode } from "@/components/revenue/assessment/revenue-service-selector";

// =====================================================
// TYPES
// =====================================================

type RevenueServiceFieldsProps = {
  /**
   * Revenue service being captured.
   */
  service: RevenueService;

  /**
   * Fixed position of this service in the assessment.
   */
  index: number;

  /**
   * Raw field values belonging ONLY to this service.
   */
  values: Record<string, unknown>;

  /**
   * Validation errors belonging ONLY to this service.
   */
  errors?: Record<string, string>;

  /**
   * Update a normal field value.
   */
  onChange: (serviceId: string, key: string, value: unknown) => void;

  /**
   * Handle FILE / MULTI_FILE selection.
   */
  onFileChange: (
    event: ChangeEvent<HTMLInputElement>,
    serviceId: string,
    field: RevenueField,
  ) => void;

  /**
   * Remove a selected file.
   */
  onRemoveFile: (serviceId: string, field: RevenueField) => void;

  /**
   * Remove this entire revenue service.
   */
  onRemove: (serviceId: string) => void;

  /**
   * Disable the entire service form.
   */
  disabled?: boolean;
};

// =====================================================
// COMPONENT
// =====================================================

export function RevenueServiceFields({
  service,
  index,
  values,
  errors = {},
  onChange,
  onFileChange,
  onRemoveFile,
  onRemove,
  disabled = false,
}: RevenueServiceFieldsProps) {
  // ===================================================
  // EXPANSION STATE
  // ===================================================

  const [expanded, setExpanded] = useState(true);

  // ===================================================
  // REQUIRED FIELD PROGRESS
  // ===================================================

  const requiredFields = useMemo(
    () => service.fields.filter((field) => field.required),
    [service.fields],
  );

  const requiredCount = requiredFields.length;

  const completedCount = useMemo(
    () =>
      requiredFields.filter((field) => isFieldComplete(values[field.key], field))
        .length,
    [requiredFields, values],
  );

  const completionPercentage =
    requiredCount === 0
      ? 100
      : Math.round((completedCount / requiredCount) * 100);

  // ===================================================
  // VALIDATION STATE
  // ===================================================

  const hasErrors = Object.keys(errors).length > 0;

  // ===================================================
  // AUTO-EXPAND ON VALIDATION ERROR
  // ===================================================

  useEffect(() => {
    if (hasErrors) {
      setExpanded(true);
    }
  }, [hasErrors]);

  // ===================================================
  // COLLECTION MODE
  // ===================================================

  const collectionModeLabel = service.collectionMode
    ? formatCollectionMode(service.collectionMode)
    : null;

  // ===================================================
  // TOGGLE
  // ===================================================

  const toggleExpanded = () => {
    if (disabled) return;
    setExpanded((current) => !current);
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* SERVICE HEADER */}
      <div className={`p-4 sm:p-5 ${expanded ? "border-b" : ""}`}>
        <div className="flex min-w-0 items-start gap-3">
          {/* SERVICE ORDER */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
            {index + 1}
          </div>

          {/* SERVICE CONTENT */}
          <button
            type="button"
            onClick={toggleExpanded}
            disabled={disabled}
            aria-expanded={expanded}
            aria-controls={`service-fields-${service.id}`}
            className="min-w-0 flex-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {/* SERVICE NAME + BADGES */}
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="min-w-0 break-words text-sm font-semibold sm:text-base">
                {service.name}
              </h2>

              {/* SERVICE CODE */}
              <Badge variant="outline" className="shrink-0">
                {service.code}
              </Badge>

              {/* CATEGORY */}
              {service.category && (
                <Badge variant="outline" className="shrink-0 text-muted-foreground">
                  {service.category}
                </Badge>
              )}

              {/* COLLECTION MODE */}
              {collectionModeLabel && (
                <Badge variant="secondary" className="shrink-0">
                  {collectionModeLabel}
                </Badge>
              )}

              {/* VALIDATION ERROR */}
              {hasErrors && (
                <Badge variant="destructive" className="shrink-0 gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Error
                </Badge>
              )}
            </div>

            {/* DESCRIPTION */}
            {service.description && (
              <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground sm:text-sm">
                {service.description}
              </p>
            )}

            {/* DATA CAPTURE NOTICE */}
            <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
              Enter the information required for this service. Tariff selection
              and assessment calculation are handled by the decision provider.
            </p>
          </button>

          {/* HEADER ACTIONS */}
          <div className="flex shrink-0 items-center gap-1">
            {/* REMOVE SERVICE */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              aria-label={`Remove ${service.name}`}
              onClick={() => onRemove(service.id)}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* EXPAND / COLLAPSE */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              aria-label={expanded ? `Collapse ${service.name}` : `Expand ${service.name}`}
              aria-expanded={expanded}
              onClick={toggleExpanded}
            >
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-200 ${
                  expanded ? "rotate-180" : "rotate-0"
                }`}
              />
            </Button>
          </div>
        </div>

        {/* REQUIRED FIELD PROGRESS */}
        {requiredCount > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Required information
                </span>

                {completionPercentage === 100 && (
                  <span className="text-xs font-medium text-primary">
                    Complete
                  </span>
                )}
              </div>

              <span className="shrink-0 text-xs font-medium">
                {completedCount}/{requiredCount}
              </span>
            </div>

            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={requiredCount}
              aria-valuenow={completedCount}
              aria-label={`${service.name} required information completion`}
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* =================================================
       * COLLAPSIBLE SERVICE DATA
       *
       * DATA CAPTURE ONLY.
       *
       * This component NEVER:
       * - calculates tariffs
       * - calculates amounts
       * - calculates totals
       * - generates invoices
       * - processes payments
       * - resolves pricing rules
       * ================================================= */}
      <div id={`service-fields-${service.id}`} hidden={!expanded}>
        <div className="grid gap-x-6 gap-y-6 p-4 sm:grid-cols-2 sm:p-6">
          {service.fields.map((field) => (
            <RevenueDynamicField
              key={field.id ?? field.key}
              service={service}
              field={field}
              value={values[field.key]}
              error={errors[field.key]}
              disabled={disabled}
              onChange={(value) => onChange(service.id, field.key, value)}
              onFileChange={(event) => onFileChange(event, service.id, field)}
              onRemoveFile={() => onRemoveFile(service.id, field)}
            />
          ))}
        </div>

        {/* VALIDATION MESSAGE */}
        {hasErrors && (
          <div className="border-t p-4 sm:p-6">
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />

              <div className="min-w-0">
                <p className="text-xs font-medium leading-5 text-amber-700 dark:text-amber-400">
                  Complete the required information for this service.
                </p>

                {Object.values(errors)
                  .slice(0, 3)
                  .map((error, errorIndex) => (
                    <p
                      key={`${service.id}-error-${errorIndex}`}
                      className="mt-1 text-xs leading-5 text-muted-foreground"
                    >
                      • {error}
                    </p>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// FIELD COMPLETION
// =====================================================

function isFieldComplete(value: unknown, field: RevenueField): boolean {
  if (field.type === "FILE") {
    return value instanceof File;
  }

  if (field.type === "MULTI_FILE") {
    return Array.isArray(value) && value.length > 0;
  }

  if (field.type === "CHECKBOX") {
    return value === true;
  }

  return value !== undefined && value !== null && String(value).trim() !== "";
}