"use client";

import type { ChangeEvent, JSX } from "react";
import { useEffect, useMemo, useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

import type { RevenueField, RevenueService } from "@/types/revenue/assessment";
import { EthiopianDatePicker } from "@/components/input/EthiopianDatePicker";

export interface RevenueDynamicFieldProps {
  service: RevenueService;
  field: RevenueField;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>, serviceId: string, field: RevenueField) => void;
  onRemoveFile: (serviceId: string, field: RevenueField) => void;
  disabled?: boolean;
}

// =====================================================
// SHARED HELPERS
// =====================================================

function asString(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function fileName(value: unknown): string {
  if (value instanceof File) return value.name;
  if (Array.isArray(value)) return `${value.length} file${value.length === 1 ? "" : "s"} selected`;
  return "";
}

function valuesMatch(a: unknown, b: unknown): boolean {
  if (a === undefined || a === null || b === undefined || b === null) return a === b;
  return String(a) === String(b);
}

function fieldHelpText(field: RevenueField): string | undefined {
  return (field as { description?: string; helpText?: string }).description ??
    (field as { description?: string; helpText?: string }).helpText;
}

// Fields that need the full grid row rather than a half column.
const FULL_WIDTH_TYPES = new Set<RevenueField["type"]>(["TEXTAREA", "RADIO", "FILE", "MULTI_FILE"]);

function getFieldLayoutClass(field: RevenueField): string {
  return FULL_WIDTH_TYPES.has(field.type) ? "sm:col-span-2" : "sm:col-span-1";
}

// Common props every field-type renderer receives. Keeping this one shape
// means adding a new field type is just adding one component + one map entry.
type FieldRendererProps = {
  service: RevenueService;
  field: RevenueField;
  value: unknown;
  fieldId: string;
  describedBy?: string;
  disabled: boolean;
  onChange: (value: unknown) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>, serviceId: string, field: RevenueField) => void;
  onRemoveFile: (serviceId: string, field: RevenueField) => void;
};

// =====================================================
// FIELD HEADER (label + required marker + unit badge)
// =====================================================

function FieldHeader({ field, fieldId }: { field: RevenueField; fieldId: string }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <Label htmlFor={fieldId} className="min-w-0 text-sm font-medium leading-5">
        <span className="break-words">{field.label}</span>
        {field.required && (
          <span className="ml-1 text-destructive" aria-hidden="true">*</span>
        )}
      </Label>

      {field.unit && (
        <Badge variant="secondary" className="shrink-0 whitespace-nowrap px-2 py-0.5 text-[10px] font-medium">
          {field.unit}
        </Badge>
      )}
    </div>
  );
}

// =====================================================
// SHARED: TEXT-LIKE INPUT (TEXT / NUMBER / DECIMAL)
// =====================================================
// DATE has its own renderer (see DateField below), so it's no longer
// handled here.

function TextLikeField({ field, value, fieldId, describedBy, disabled, onChange }: FieldRendererProps) {
  const type = field.type === "NUMBER" || field.type === "DECIMAL" ? "number" : "text";
  const step = field.type === "DECIMAL" ? field.step ?? 0.01 : field.type === "NUMBER" ? field.step ?? 1 : undefined;
  const showUnit = field.unit && (field.type === "NUMBER" || field.type === "DECIMAL");

  return (
    <div className="relative">
      <Input
        id={fieldId}
        aria-describedby={describedBy}
        type={type}
        min={field.min}
        max={field.max}
        step={step}
        value={asString(value)}
        placeholder={field.placeholder ?? (field.type === "DECIMAL" ? "0.00" : undefined)}
        disabled={disabled}
        className={showUnit ? "h-11 pr-20" : "h-11"}
        onChange={(e) => onChange(e.target.value)}
      />
      {showUnit && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-muted-foreground">
          {field.unit}
        </span>
      )}
    </div>
  );
}

// =====================================================
// TEXTAREA
// =====================================================

function TextareaField({ field, value, fieldId, describedBy, disabled, onChange }: FieldRendererProps) {
  return (
    <Textarea
      id={fieldId}
      aria-describedby={describedBy}
      value={asString(value)}
      placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}...`}
      disabled={disabled}
      className="min-h-[120px] w-full resize-y leading-5"
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// =====================================================
// SELECT (searchable combobox)
// =====================================================
//
// IMPORTANT: option.value is submitted, option.label is displayed.
// sortOrder controls display order. Options are never filtered by
// isActive/status/isDefault — base_field_options uses SoftDeletes,
// so the backend already returns only what should render here.

function SelectField({ field, value, fieldId, describedBy, disabled, onChange }: FieldRendererProps) {
  const [open, setOpen] = useState(false);

  const options = useMemo(
    () => [...(field.options ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [field.options],
  );

  const selected = options.find((o) => valuesMatch(o.value, value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={fieldId}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-describedby={describedBy}
          disabled={disabled}
          className="h-11 w-full justify-between font-normal"
        >
          <span className={`min-w-0 truncate ${selected ? "" : "text-muted-foreground"}`}>
            {selected?.label ?? `Select ${field.label.toLowerCase()}...`}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="min-w-[220px] p-0"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command>
          <CommandInput placeholder={`Search ${field.label.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>{options.length === 0 ? "No options configured." : "No option found."}</CommandEmpty>
            {options.length > 0 && (
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = valuesMatch(option.value, value);
                  return (
                    <CommandItem
                      key={option.id ?? String(option.value)}
                      value={`${option.label} ${option.value}`}
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      <div
                        className={`mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span className="min-w-0 truncate text-sm">{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// =====================================================
// RADIO
// =====================================================

function RadioField({ field, value, describedBy, disabled, onChange }: FieldRendererProps) {
  const options = useMemo(
    () => [...(field.options ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [field.options],
  );

  return (
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
      role="radiogroup"
      aria-label={field.label}
      aria-describedby={describedBy}
    >
      {options.map((option) => {
        const isSelected = valuesMatch(option.value, value);
        return (
          <button
            key={option.id ?? String(option.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`flex min-h-11 min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isSelected ? "border-primary bg-primary/5" : "bg-background hover:bg-muted/50"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                isSelected ? "border-primary" : "border-muted-foreground/40"
              }`}
            >
              {isSelected && <span className="h-2 w-2 rounded-full bg-primary" />}
            </span>
            <span className="min-w-0 break-words text-sm leading-5">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// =====================================================
// CHECKBOX
// =====================================================
// Self-contained: renders its own label/help text, since its layout
// (a clickable card) differs from every other field type's header.
//
// BEHAVIOR: checkboxes default to `true` when no value has been set yet,
// and are NEVER treated as required — a checkbox is always in a valid
// state (checked or unchecked), so it's excluded from required-field
// validation upstream in RevenueServiceFields (see isFieldComplete).
// No required asterisk is shown here for the same reason.

function CheckboxField({ field, value, fieldId, disabled, onChange }: FieldRendererProps) {
  const helpText = fieldHelpText(field);
  const descriptionId = `${fieldId}-description`;

  // Undefined/null means "never touched" — treat as checked by default.
  // Once a value exists (true or false), respect it as-is.
  const isUnset = value === undefined || value === null;
  const checked = isUnset ? true : value === true;

  // Sync the default up to parent state once, so the form's actual
  // values object reflects `true` rather than staying undefined.
  useEffect(() => {
    if (isUnset) {
      onChange(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <label
      htmlFor={fieldId}
      className={`flex w-full min-w-0 items-start gap-3 rounded-xl border p-4 transition-colors ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${checked ? "border-primary bg-primary/5" : "bg-background hover:bg-muted/50"}`}
    >
      <input
        id={fieldId}
        name={fieldId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-describedby={helpText ? descriptionId : undefined}
        className="sr-only"
        onChange={(e) => onChange(e.target.checked)}
      />

      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 bg-background"
        }`}
      >
        {checked && <Check className="h-3.5 w-3.5" />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="break-words text-sm font-medium">{field.label}</span>
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
  );
}

// =====================================================
// DATE
// =====================================================
// Uses the Ethiopian calendar picker instead of a native <input type="date">.
// Field values stay ISO date strings ("YYYY-MM-DD") to stay consistent
// with every other field type — conversion to/from Date only happens here,
// at the edge. The error message is intentionally NOT passed down: the
// shared shell in RevenueDynamicField already renders `error` beneath
// every non-checkbox field, so passing it here too would show it twice.

function DateField({ field, value, fieldId, describedBy, disabled, onChange }: FieldRendererProps) {
  const dateValue = useMemo(() => {
    if (typeof value !== "string" || !value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }, [value]);

  return (
    <EthiopianDatePicker
      value={dateValue}
      disabled={disabled}
      placeholder={field.placeholder ?? "ቀን ይምረጡ"}
      onChange={(date) => onChange(date.toISOString().slice(0, 10))}
    />
  );
}

// =====================================================
// FILE (single)
// =====================================================

function SingleFileField({ service, field, value, fieldId, describedBy, disabled, onFileChange, onRemoveFile }: FieldRendererProps) {
  if (!value) {
    return (
      <label
        htmlFor={fieldId}
        className={`flex min-h-20 w-full min-w-0 items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-primary/50 hover:bg-muted/40"
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
          onChange={(e) => onFileChange(e, service.id, field)}
        />
      </label>
    );
  }

  return (
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
  );
}

// =====================================================
// MULTI FILE
// =====================================================

function MultiFileField({ service, field, value, fieldId, describedBy, disabled, onChange, onFileChange }: FieldRendererProps) {
  const files: File[] = Array.isArray(value) ? value : [];

  return (
    <div className="w-full space-y-3">
      <label
        htmlFor={fieldId}
        className={`flex min-h-20 w-full min-w-0 items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-primary/50 hover:bg-muted/40"
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
          onChange={(e) => onFileChange(e, service.id, field)}
        />
      </label>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex min-h-12 min-w-0 items-center gap-3 rounded-lg border px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// TYPE -> RENDERER LOOKUP
// =====================================================
// Adding a new field type: write the component, add one line here.
// No other part of this file needs to change.

const FIELD_RENDERERS: Record<string, (props: FieldRendererProps) => JSX.Element> = {
  TEXT: TextLikeField,
  NUMBER: TextLikeField,
  DECIMAL: TextLikeField,
  DATE: DateField,
  TEXTAREA: TextareaField,
  SELECT: SelectField,
  RADIO: RadioField,
  CHECKBOX: CheckboxField,
  FILE: SingleFileField,
  MULTI_FILE: MultiFileField,
};

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
  const fieldId = `${service.id}-${field.key}`;
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;

  const helpText = fieldHelpText(field);
  const describedBy = [helpText ? descriptionId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  const Renderer = FIELD_RENDERERS[field.type];

  if (!Renderer) {
    // Defensive fallback so an unrecognized field type from the backend
    // never silently disappears — it's visible and reportable instead.
    return (
      <div className={`min-w-0 space-y-2 ${getFieldLayoutClass(field)}`}>
        <FieldHeader field={field} fieldId={fieldId} />
        <p className="text-xs text-destructive">
          Unsupported field type: <code>{field.type}</code>
        </p>
      </div>
    );
  }

  // CHECKBOX renders its own label/help text since its layout differs entirely,
  // and it never shows a validation error since it's never "incomplete".
  if (field.type === "CHECKBOX") {
    return (
      <div className={`min-w-0 space-y-2 ${getFieldLayoutClass(field)}`}>
        <Renderer
          service={service}
          field={field}
          value={value}
          fieldId={fieldId}
          describedBy={describedBy}
          disabled={disabled}
          onChange={onChange}
          onFileChange={onFileChange}
          onRemoveFile={onRemoveFile}
        />
      </div>
    );
  }

  return (
    <div className={`min-w-0 space-y-2 ${getFieldLayoutClass(field)}`}>
      <FieldHeader field={field} fieldId={fieldId} />

      {helpText && (
        <p id={descriptionId} className="max-w-3xl text-xs leading-4 text-muted-foreground">
          {helpText}
        </p>
      )}

      <Renderer
        service={service}
        field={field}
        value={value}
        fieldId={fieldId}
        describedBy={describedBy}
        disabled={disabled}
        onChange={onChange}
        onFileChange={onFileChange}
        onRemoveFile={onRemoveFile}
      />

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium leading-4 text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}