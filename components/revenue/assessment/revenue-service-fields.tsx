"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { AlertCircle, ChevronDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { RevenueField, RevenueService } from "@/types/revenue/assessment";

import { RevenueDynamicField } from "@/components/revenue/fields/RevenueDynamicField";
import { formatCollectionMode } from "@/components/revenue/assessment/revenue-service-selector";

type RevenueServiceFieldsProps = {
  service: RevenueService;
  index: number;
  values: Record<string, unknown>;
  errors?: Record<string, string>;
  onChange: (fieldId: string, value: unknown) => void;
  onFileChange: (
    event: ChangeEvent<HTMLInputElement>,
    field: RevenueField,
  ) => void;
  onRemoveFile: (field: RevenueField) => void;
  onRemove: (serviceId: string) => void;
  disabled?: boolean;
};

const FULL_WIDTH_TYPES = new Set(["TEXTAREA", "FILE", "MULTI_FILE"]);

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
  const [expanded, setExpanded] = useState(true);

  /*
   * Required fields. CHECKBOX fields are excluded from completion because
   * their required semantics can differ.
   */
  const requiredFields = useMemo(
    () =>
      service.fields.filter(
        (field) =>
          Boolean(field.id) && field.required && field.type !== "CHECKBOX",
      ),
    [service.fields],
  );

  const completedCount = useMemo(
    () =>
      requiredFields.filter((field) =>
        isFieldComplete(values[field.id], field),
      ).length,
    [requiredFields, values],
  );

  const requiredCount = requiredFields.length;
  const isComplete = requiredCount === 0 || completedCount === requiredCount;
  const completionPercentage =
    requiredCount === 0
      ? 100
      : Math.round((completedCount / requiredCount) * 100);

  const errorMessages = Object.values(errors).filter(Boolean);
  const hasErrors = Object.keys(errors).length > 0;

  /* Errors force the section open; afterwards the user's preference returns. */
  const isExpanded = hasErrors || expanded;
  const panelId = `service-fields-${service.id}`;

  function toggleExpanded() {
    if (!disabled && !hasErrors) setExpanded((current) => !current);
  }

  return (
    /*
     * min-w-0 + max-w-full lets this card shrink inside any flex/grid parent.
     * Without it, a long child can force the whole card (and page) wider.
     */
    <div
      className={cn(
        "min-w-0 max-w-full overflow-hidden rounded-xl border transition-colors",
        hasErrors && "border-destructive/40",
      )}
    >
      {/* HEADER */}
      <div className={cn("p-4 sm:p-5", isExpanded && "border-b")}>
        <div className="flex items-start gap-3">
          <CircularProgress
            value={completionPercentage}
            isComplete={isComplete}
            size={36}
            label={`${service.name} required information completion`}
            valueNow={completedCount}
            valueMax={requiredCount}
          >
            <span
              className={isComplete ? "text-primary" : "text-muted-foreground"}
            >
              {index + 1}
            </span>
          </CircularProgress>

          {/* Service information: every line is constrained to this column */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <h2 className="min-w-0 text-sm font-semibold leading-snug sm:text-base">
              <button
                type="button"
                onClick={toggleExpanded}
                disabled={disabled || hasErrors}
                aria-expanded={isExpanded}
                aria-controls={panelId}
                title={service.name}
                className="block w-full min-w-0 truncate rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {service.name}
              </button>
            </h2>

            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {service.code && (
                <MetaBadge variant="outline" text={service.code} />
              )}
              {service.category && (
                <MetaBadge
                  variant="outline"
                  text={service.category}
                  className="text-muted-foreground"
                />
              )}
              {service.collectionMode && (
                <MetaBadge
                  variant="secondary"
                  text={formatCollectionMode(service.collectionMode)}
                />
              )}
              {hasErrors && (
                <Badge variant="destructive" className="shrink-0 gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Error
                </Badge>
              )}
            </div>

            {service.description && (
              <p
                title={service.description}
                className="line-clamp-2 max-w-3xl text-xs leading-5 text-muted-foreground sm:text-sm"
              >
                {service.description}
              </p>
            )}

            {requiredCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {isComplete
                  ? "Required information complete"
                  : `${completedCount}/${requiredCount} required fields completed`}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1">
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

            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || hasErrors}
              aria-label={
                isExpanded
                  ? `Collapse ${service.name}`
                  : `Expand ${service.name}`
              }
              aria-expanded={isExpanded}
              aria-controls={panelId}
              onClick={toggleExpanded}
            >
              <ChevronDown
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isExpanded && "rotate-180",
                )}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* SERVICE FIELDS */}
      <div id={panelId} hidden={!isExpanded}>
        {/*
         * grid-cols-1 is essential: without it the single mobile column is an
         * implicit `auto` track that grows to its widest child's min-content
         * (long select options, file names, etc.) and overflows the card.
         * Each cell also gets min-w-0 so inputs can shrink inside their track.
         */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-6 p-4 sm:grid-cols-2 sm:p-6">
          {service.fields.map((field) => {
            const fieldId = field.id;
            if (!fieldId) return null;

            return (
              <div
                key={fieldId}
                className={cn(
                  "min-w-0",
                  FULL_WIDTH_TYPES.has(field.type) && "sm:col-span-2",
                )}
              >
                <RevenueDynamicField
                  service={service}
                  field={field}
                  value={values[fieldId]}
                  error={errors[fieldId]}
                  disabled={disabled}
                  onChange={(value) => onChange(fieldId, value)}
                  onFileChange={(event) => onFileChange(event, field)}
                  onRemoveFile={() => onRemoveFile(field)}
                />
              </div>
            );
          })}
        </div>

        {/* VALIDATION ERROR SUMMARY */}
        {hasErrors && (
          <div className="border-t p-4 sm:p-6">
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium leading-5 text-amber-700 dark:text-amber-400">
                  Complete the required information for this service.
                </p>

                <ul className="mt-1 space-y-1">
                  {errorMessages.slice(0, 3).map((message, i) => (
                    <li
                      key={i}
                      className="text-xs leading-5 text-muted-foreground [overflow-wrap:anywhere]"
                    >
                      • {message}
                    </li>
                  ))}
                </ul>

                {errorMessages.length > 3 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    +{errorMessages.length - 3} more
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Meta badge: truncates long text instead of overflowing                      */
/* -------------------------------------------------------------------------- */

function MetaBadge({
  text,
  variant,
  className,
}: {
  text: string;
  variant: "outline" | "secondary";
  className?: string;
}) {
  return (
    <Badge
      variant={variant}
      title={text}
      className={cn("max-w-full min-w-0 overflow-hidden font-normal", className)}
    >
      {/* Ellipsis needs the text in its own truncating element */}
      <span className="truncate">{text}</span>
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Circular progress                                                          */
/* -------------------------------------------------------------------------- */

type CircularProgressProps = {
  value: number;
  isComplete: boolean;
  size?: number;
  strokeWidth?: number;
  label: string;
  valueNow?: number;
  valueMax?: number;
  children?: ReactNode;
};

function CircularProgress({
  value,
  isComplete,
  size = 36,
  strokeWidth = 3,
  label,
  valueNow,
  valueMax,
  children,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={valueMax ?? 100}
      aria-valuenow={valueNow ?? clampedValue}
      aria-label={label}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "transition-all duration-300",
            isComplete ? "stroke-primary" : "stroke-primary/60",
          )}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Field completion                                                           */
/* -------------------------------------------------------------------------- */

function isFieldComplete(value: unknown, field: RevenueField): boolean {
  if (field.type === "FILE") return value instanceof File;
  if (field.type === "MULTI_FILE") return Array.isArray(value) && value.length > 0;
  if (field.type === "CHECKBOX") return value === true;

  return value !== undefined && value !== null && String(value).trim() !== "";
}