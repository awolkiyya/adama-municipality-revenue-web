"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";

import {
  Check,
  ChevronsUpDown,
  FileText,
  Paperclip,
  Upload,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Textarea } from "@/components/ui/textarea";

import type { RevenueField, RevenueService } from "@/types/revenue/assessment";

// =====================================================
// TYPES
// =====================================================

export interface RevenueDynamicFieldProps {
  /** Revenue service that owns this field. */
  service: RevenueService;

  /** Field definition. */
  field: RevenueField;

  /** Current value of this field. */
  value: unknown;

  /** Validation error for this field. */
  error?: string;

  /** Update only this field. */
  onChange: (value: unknown) => void;

  /**
   * Handle FILE / MULTI_FILE selection.
   * IMPORTANT: uses HTMLInputElement because the source
   * control is <input type="file" />.
   */
  onFileChange: (
    event: ChangeEvent<HTMLInputElement>,
    serviceId: string,
    field: RevenueField,
  ) => void;

  /** Remove selected file. */
  onRemoveFile: (serviceId: string, field: RevenueField) => void;

  /** Disable the field. */
  disabled?: boolean;
}

// =====================================================
// FILE NAME HELPER
// =====================================================

function fileName(value: unknown): string {
  if (value instanceof File) {
    return value.name;
  }

  if (Array.isArray(value)) {
    return `${value.length} file${value.length === 1 ? "" : "s"} selected`;
  }

  return "";
}

// =====================================================
// VALUE NORMALIZATION
// =====================================================

function valuesMatch(first: unknown, second: unknown): boolean {
  if (
    first === undefined ||
    first === null ||
    second === undefined ||
    second === null
  ) {
    return first === second;
  }

  return String(first) === String(second);
}

// =====================================================
// HELP TEXT
// =====================================================
//
// The adapter (mapRevenueServiceField in page.tsx)
// currently only populates `helpText`, not `description`.
// Read both so this component works whether the field
// came through the current adapter or a future one that
// sets `description` directly — and so nothing silently
// disappears if either name is used upstream.
// =====================================================

const fieldHelpText = (field: RevenueField): string | undefined =>
  (field as { description?: string; helpText?: string }).description ??
  (field as { description?: string; helpText?: string }).helpText;

// =====================================================
// FIELD LAYOUT
// =====================================================
//
// Parent grid: grid gap-x-6 gap-y-6 sm:grid-cols-2
//
// Single-column: TEXT, NUMBER, DECIMAL, SELECT, CHECKBOX, DATE
// Full-row: TEXTAREA, RADIO, FILE, MULTI_FILE
// =====================================================

function getFieldLayoutClass(field: RevenueField): string {
  switch (field.type) {
    case "TEXTAREA":
    case "RADIO":
    case "FILE":
    case "MULTI_FILE":
      return "sm:col-span-2";

    case "TEXT":
    case "NUMBER":
    case "DECIMAL":
    case "SELECT":
    case "CHECKBOX":
    case "DATE":
    default:
      return "sm:col-span-1";
  }
}

// =====================================================
// COMPONENT
// =====================================================

export function RevenueDynamicField({
  service,
  field,
  value,
  error,
  onChange,
  onFileChange,
  onRemoveFile,
  disabled = false,
}: RevenueDynamicFieldProps) {
  const [selectOpen, setSelectOpen] = useState(false);

  // ===================================================
  // FIELD ID
  // ===================================================
  //
  // `field.key` is the one identifier the adapter
  // actually guarantees is unique per field on a given
  // service (it's derived from baseField.key/code/name
  // or baseFieldId, never blank). Using `field.id` here
  // — which the adapter never sets — collapsed every
  // field in a service to the same DOM id, breaking
  // label association and aria-describedby wiring.
  // ===================================================

  const fieldId = `${service.id}-${field.key}`;
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;

  const helpText = fieldHelpText(field);

  const setValue = (nextValue: unknown) => {
    onChange(nextValue);
  };

  // ===================================================
  // SELECTED OPTION
  // ===================================================

  const selectedOption = field.options?.find((option) =>
    valuesMatch(option.value, value),
  );

  // ===================================================
  // ACCESSIBILITY
  // ===================================================

  const describedBy =
    [helpText ? descriptionId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  // ===================================================
  // FIELD LAYOUT
  // ===================================================

  const layoutClass = getFieldLayoutClass(field);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className={`min-w-0 space-y-2 ${layoutClass}`}>
      {/* STANDARD FIELD HEADER — CHECKBOX has its own label
          because the checkbox needs its label/content
          directly associated with the native checkbox input. */}
      {field.type !== "CHECKBOX" && (
        <div className="flex min-w-0 items-start justify-between gap-3">
          <Label htmlFor={fieldId} className="min-w-0 text-sm font-medium leading-5">
            <span className="break-words">{field.label}</span>

            {field.required && (
              <span className="ml-1 text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </Label>

          {field.unit && (
            <Badge
              variant="secondary"
              className="shrink-0 whitespace-nowrap px-2 py-0.5 text-[10px] font-medium"
            >
              {field.unit}
            </Badge>
          )}
        </div>
      )}

      {/* DESCRIPTION / HELP TEXT */}
      {helpText && field.type !== "CHECKBOX" && (
        <p id={descriptionId} className="max-w-3xl text-xs leading-4 text-muted-foreground">
          {helpText}
        </p>
      )}

      {/* TEXT */}
      {field.type === "TEXT" && (
        <Input
          id={fieldId}
          aria-describedby={describedBy}
          value={value === undefined || value === null ? "" : String(value)}
          placeholder={field.placeholder}
          disabled={disabled}
          className="h-11"
          onChange={(event) => setValue(event.target.value)}
        />
      )}

      {/* NUMBER */}
      {field.type === "NUMBER" && (
        <div className="relative">
          <Input
            id={fieldId}
            aria-describedby={describedBy}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            value={value === undefined || value === null ? "" : String(value)}
            placeholder={field.placeholder ?? "Enter value"}
            disabled={disabled}
            className={field.unit ? "h-11 pr-20" : "h-11"}
            onChange={(event) => setValue(event.target.value)}
          />

          {field.unit && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-muted-foreground">
              {field.unit}
            </span>
          )}
        </div>
      )}

      {/* DECIMAL */}
      {field.type === "DECIMAL" && (
        <div className="relative">
          <Input
            id={fieldId}
            aria-describedby={describedBy}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step ?? 0.01}
            value={value === undefined || value === null ? "" : String(value)}
            placeholder={field.placeholder ?? "0.00"}
            disabled={disabled}
            className={field.unit ? "h-11 pr-20" : "h-11"}
            onChange={(event) => setValue(event.target.value)}
          />

          {field.unit && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-muted-foreground">
              {field.unit}
            </span>
          )}
        </div>
      )}

      {/* TEXTAREA */}
      {field.type === "TEXTAREA" && (
        <Textarea
          id={fieldId}
          aria-describedby={describedBy}
          value={value === undefined || value === null ? "" : String(value)}
          placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}...`}
          disabled={disabled}
          className="min-h-[120px] w-full resize-y leading-5"
          onChange={(event) => setValue(event.target.value)}
        />
      )}

      {/* SELECT */}
      {field.type === "SELECT" && (
        <Popover open={selectOpen} onOpenChange={setSelectOpen}>
          <PopoverTrigger asChild>
            <Button
              id={fieldId}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={selectOpen}
              aria-describedby={describedBy}
              disabled={disabled}
              className="h-11 w-full justify-between font-normal"
            >
              <span
                className={
                  selectedOption
                    ? "min-w-0 truncate"
                    : "min-w-0 truncate text-muted-foreground"
                }
              >
                {selectedOption?.label ?? `Select ${field.label.toLowerCase()}...`}
              </span>

              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[--radix-popover-trigger-width] min-w-[220px] p-0"
            style={{ width: "var(--radix-popover-trigger-width)" }}
            align="start"
          >
            <Command>
              <CommandInput placeholder={`Search ${field.label.toLowerCase()}...`} />

              <CommandList>
                <CommandEmpty>No option found.</CommandEmpty>

                <CommandGroup>
                  {field.options?.map((option) => {
                    const selected = valuesMatch(option.value, value);

                    return (
                      <CommandItem
                        key={String(option.value)}
                        value={`${option.label} ${option.value}`}
                        onSelect={() => {
                          setValue(option.value);
                          setSelectOpen(false);
                        }}
                      >
                        <div
                          className={`mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {selected && <Check className="h-3 w-3" />}
                        </div>

                        <span className="min-w-0 truncate text-sm">{option.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {/* RADIO */}
      {field.type === "RADIO" && (
        <div
          className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
          role="radiogroup"
          aria-label={field.label}
          aria-describedby={describedBy}
        >
          {field.options?.map((option) => {
            const selected = valuesMatch(option.value, value);

            return (
              <button
                key={String(option.value)}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => setValue(option.value)}
                className={`flex min-h-11 min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selected ? "border-primary bg-primary/5" : "bg-background hover:bg-muted/50"
                } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    selected ? "border-primary" : "border-muted-foreground/40"
                  }`}
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>

                <span className="min-w-0 break-words text-sm leading-5">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* CHECKBOX — compact single-column boolean field.
          Native checkbox remains the real input; label is
          the clickable container; no separate header above it. */}
      {field.type === "CHECKBOX" && (
        <label
          htmlFor={fieldId}
          className={`flex w-full min-w-0 items-start gap-3 rounded-xl border p-4 transition-colors ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          } ${value === true ? "border-primary bg-primary/5" : "bg-background hover:bg-muted/50"}`}
        >
          <input
            id={fieldId}
            name={fieldId}
            type="checkbox"
            checked={value === true}
            disabled={disabled}
            aria-describedby={helpText ? descriptionId : error ? errorId : undefined}
            className="sr-only"
            onChange={(event) => setValue(event.target.checked)}
          />

          <span
            aria-hidden="true"
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
              value === true
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/40 bg-background"
            }`}
          >
            {value === true && <Check className="h-3.5 w-3.5" />}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="break-words text-sm font-medium">{field.label}</span>

              {field.required && (
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              )}

              {field.unit && (
                <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
                  {field.unit}
                </Badge>
              )}
            </span>

            {helpText && (
              <span id={descriptionId} className="mt-1 block text-xs leading-4 text-muted-foreground">
                {helpText}
              </span>
            )}
          </span>
        </label>
      )}

      {/* DATE */}
      {field.type === "DATE" && (
        <Input
          id={fieldId}
          aria-describedby={describedBy}
          type="date"
          value={value === undefined || value === null ? "" : String(value)}
          disabled={disabled}
          className="h-11"
          onChange={(event) => setValue(event.target.value)}
        />
      )}

      {/* FILE */}
      {field.type === "FILE" && (
        <div className="w-full space-y-2">
          {!value ? (
            <label
              htmlFor={fieldId}
              className={`flex min-h-20 w-full min-w-0 items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors ${
                disabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:border-primary/50 hover:bg-muted/40"
              }`}
            >
              <div className="shrink-0 rounded-lg bg-primary/10 p-2">
                <Upload className="h-4 w-4 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">Upload {field.label}</p>

                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {field.accept ? field.accept.replaceAll(",", " · ") : "Choose a file"}
                </p>
              </div>

              <Input
                id={fieldId}
                type="file"
                accept={field.accept}
                disabled={disabled}
                aria-describedby={describedBy}
                className="hidden"
                onChange={(event) => onFileChange(event, service.id, field)}
              />
            </label>
          ) : (
            <div className="flex min-h-16 w-full min-w-0 items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2.5">
              <div className="shrink-0 rounded-lg bg-primary/10 p-2">
                <Paperclip className="h-4 w-4 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{fileName(value)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Ready for upload</p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                aria-label={`Remove ${field.label}`}
                onClick={() => onRemoveFile(service.id, field)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* MULTI FILE */}
      {field.type === "MULTI_FILE" && (
        <div className="w-full space-y-3">
          <label
            htmlFor={fieldId}
            className={`flex min-h-20 w-full min-w-0 items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors ${
              disabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:border-primary/50 hover:bg-muted/40"
            }`}
          >
            <div className="shrink-0 rounded-lg bg-primary/10 p-2">
              <Paperclip className="h-4 w-4 text-primary" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Add supporting documents</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Select one or more files</p>
            </div>

            <Input
              id={fieldId}
              type="file"
              multiple
              accept={field.accept}
              disabled={disabled}
              aria-describedby={describedBy}
              className="hidden"
              onChange={(event) => onFileChange(event, service.id, field)}
            />
          </label>

          {Array.isArray(value) && value.length > 0 && (
            <div className="space-y-2">
              {value.map((file: File, index: number) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex min-h-12 min-w-0 items-center gap-3 rounded-lg border px-3 py-2"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />

                  <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    aria-label={`Remove ${file.name}`}
                    onClick={() => {
                      const next = value.filter(
                        (_file: File, fileIndex: number) => fileIndex !== index,
                      );
                      onChange(next);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VALIDATION ERROR */}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium leading-4 text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}