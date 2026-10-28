
"use client";

import type { ChangeEvent, JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Camera,
  Check,
  ChevronsUpDown,
  File,
  FileCheck2,
  FileImage,
  FileText,
  Film,
  LoaderCircle,
  Paperclip,
  RefreshCw,
  Sparkles,
  Upload,
  Video,
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

import type {
  RevenueField,
  RevenueService,
} from "@/types/revenue/assessment";
import { EthiopianDatePicker } from "@/components/input/EthiopianDatePicker";
import type { BaseFieldInputSource } from "@/types/revenue/revenue-baseField";

// =====================================================
// PUBLIC TYPES
// =====================================================

export type AIInputMode = "IMAGE" | "VIDEO";

export interface RevenueDynamicFieldProps {
  service: RevenueService;
  field: RevenueField;
  value: unknown;
  error?: string;

  onChange: (value: unknown) => void;

  onFileChange: (
    event: ChangeEvent<HTMLInputElement>,
    serviceId: string,
    field: RevenueField,
  ) => void;

  onRemoveFile: (
    serviceId: string,
    field: RevenueField,
  ) => void;

  onStartAI?: (
    service: RevenueService,
    field: RevenueField,
    mode: AIInputMode,
    file?: File,
  ) => void | Promise<void>;

  aiProcessing?: boolean;
  disabled?: boolean;
}

// =====================================================
// FILE TYPES
// =====================================================

type ExistingFileMetadata = {
  id?: string;
  fileId?: string;
  name?: string;
  originalName?: string;
  originalFilename?: string;
  filename?: string;
  mimeType?: string;
  mime_type?: string;
  contentType?: string;
  size?: number | string | null;
  sizeBytes?: number | string | null;
  status?: string;
  url?: string;
  downloadUrl?: string;
  download_url?: string;
};

type DisplayFile = {
  key: string;
  name: string;
  mimeType?: string;
  size?: number;
  status: string;
  existing: boolean;
  fileId?: string;
  file?: File;
  url?: string;
};

function isBrowserFile(value: unknown): value is File {
  return (
    typeof File !== "undefined" &&
    typeof File === "function" &&
    value instanceof File
  );
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !isBrowserFile(value)
  );
}

function positiveSize(value: unknown): number | undefined {
  if (
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : undefined;
}

function metadataToDisplayFile(
  input: unknown,
  index: number,
): DisplayFile | null {
  if (isBrowserFile(input)) {
    return {
      key: `local-${input.name}-${input.lastModified}-${index}`,
      name: input.name,
      mimeType: input.type || undefined,
      size: input.size,
      status: "SELECTED",
      existing: false,
      file: input,
    };
  }

  if (typeof input === "string") {
    const trimmed = input.trim();

    if (!trimmed) return null;

    // An opaque ID alone is not a filename. Prefer the metadata
    // object returned by the backend when it is available.
    return {
      key: `id-${trimmed}-${index}`,
      name: `Existing file ${trimmed}`,
      status: "SAVED",
      existing: true,
      fileId: trimmed,
    };
  }

  if (!isRecord(input)) return null;

  const name = [
    input.name,
    input.originalName,
    input.originalFilename,
    input.filename,
  ].find(
    (candidate): candidate is string =>
      typeof candidate === "string" &&
      candidate.trim().length > 0,
  );

  const fileId = [
    input.id,
    input.fileId,
  ].find(
    (candidate): candidate is string =>
      typeof candidate === "string" &&
      candidate.trim().length > 0,
  );

  const mimeType = [
    input.mimeType,
    input.mime_type,
    input.contentType,
  ].find(
    (candidate): candidate is string =>
      typeof candidate === "string" &&
      candidate.trim().length > 0,
  );

  const size = positiveSize(
    input.size ?? input.sizeBytes,
  );

  const status =
    typeof input.status === "string" &&
    input.status.trim()
      ? input.status.toUpperCase()
      : "SAVED";

  const url = [
    input.downloadUrl,
    input.download_url,
    input.url,
  ].find(
    (candidate): candidate is string =>
      typeof candidate === "string" &&
      candidate.trim().length > 0,
  );

  if (!name && !fileId) return null;

  return {
    key: `existing-${fileId ?? name}-${index}`,
    name: name ?? `Existing file ${fileId}`,
    mimeType,
    size,
    status,
    existing: true,
    fileId,
    url,
  };
}

function getDisplayFiles(value: unknown): DisplayFile[] {
  if (isBrowserFile(value)) {
    return [
      metadataToDisplayFile(value, 0),
    ].filter(
      (item): item is DisplayFile => item !== null,
    );
  }

  if (Array.isArray(value)) {
    return value
      .map((item, index) =>
        metadataToDisplayFile(item, index),
      )
      .filter(
        (item): item is DisplayFile => item !== null,
      );
  }

  if (isRecord(value)) {
    // A parent may store a file reference in a wrapper object.
    if (value.__file && typeof value.__file === "string") {
      return [
        {
          key: `reference-${value.__file}`,
          name: "Selected file reference",
          status: "PENDING",
          existing: false,
          fileId: value.__file,
        },
      ];
    }

    const normalized = metadataToDisplayFile(value, 0);

    return normalized ? [normalized] : [];
  }

  if (typeof value === "string" && value.trim()) {
    return [
      metadataToDisplayFile(value, 0),
    ].filter(
      (item): item is DisplayFile => item !== null,
    );
  }

  return [];
}

// =====================================================
// SHARED HELPERS
// =====================================================

function asString(value: unknown): string {
  return value === undefined || value === null
    ? ""
    : String(value);
}

function valuesMatch(a: unknown, b: unknown): boolean {
  if (
    a === undefined ||
    a === null ||
    b === undefined ||
    b === null
  ) {
    return a === b;
  }

  return String(a) === String(b);
}

function fieldHelpText(
  field: RevenueField,
): string | undefined {
  return (
    field.description ??
    (field as { helpText?: string }).helpText
  );
}

function getInputSource(
  field: RevenueField,
): BaseFieldInputSource {
  return field.baseField?.inputSource ?? "MANUAL";
}

function getInputSourceLabel(
  source: BaseFieldInputSource,
): string {
  switch (source) {
    case "AI":
      return "AI";
    case "MANUAL_OR_AI":
      return "AI / Manual";
    default:
      return "Manual";
  }
}

function getInputSourceDescription(
  source: BaseFieldInputSource,
): string | undefined {
  switch (source) {
    case "AI":
      return "This value is generated by AI. Use the actions below to capture or upload media and obtain the result.";
    case "MANUAL_OR_AI":
      return "Enter a value manually or use AI to generate a result that you can review and edit.";
    default:
      return undefined;
  }
}

function formatFileSize(size?: number): string | undefined {
  if (size === undefined || !Number.isFinite(size)) {
    return undefined;
  }

  if (size < 1024) return `${size} B`;

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function fileExtension(name: string): string {
  const dotIndex = name.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === name.length - 1) {
    return "FILE";
  }

  return name.slice(dotIndex + 1).toUpperCase();
}

function getFileIcon(
  file: DisplayFile,
): JSX.Element {
  const mime = file.mimeType?.toLowerCase() ?? "";
  const extension = fileExtension(file.name);

  if (mime.startsWith("image/")) {
    return <FileImage className="h-5 w-5" />;
  }

  if (mime.startsWith("video/")) {
    return <Film className="h-5 w-5" />;
  }

  if (
    mime.includes("pdf") ||
    mime.includes("word") ||
    mime.includes("document") ||
    ["PDF", "DOC", "DOCX", "TXT", "RTF"].includes(extension)
  ) {
    return <FileText className="h-5 w-5" />;
  }

  return <File className="h-5 w-5" />;
}

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status.toUpperCase()) {
    case "READY":
    case "COMPLETED":
    case "UPLOADED":
      return "default";
    case "FAILED":
    case "ERROR":
      return "destructive";
    default:
      return "secondary";
  }
}

// Fields that need the full grid row rather than a half column.
const FULL_WIDTH_TYPES = new Set<RevenueField["type"]>([
  "TEXTAREA",
  "RADIO",
  "FILE",
  "MULTI_FILE",
]);

function getFieldLayoutClass(
  field: RevenueField,
): string {
  return FULL_WIDTH_TYPES.has(field.type)
    ? "sm:col-span-2"
    : "sm:col-span-1";
}

// =====================================================
// RENDERER PROPS
// =====================================================

type FieldRendererProps = {
  service: RevenueService;
  field: RevenueField;
  value: unknown;
  fieldId: string;
  describedBy?: string;
  disabled: boolean;

  onChange: (value: unknown) => void;

  onFileChange: (
    event: ChangeEvent<HTMLInputElement>,
    serviceId: string,
    field: RevenueField,
  ) => void;

  onRemoveFile: (
    serviceId: string,
    field: RevenueField,
  ) => void;
};

// =====================================================
// FIELD HEADER
// =====================================================

function FieldHeader({
  field,
  fieldId,
}: {
  field: RevenueField;
  fieldId: string;
}) {
  const inputSource = getInputSource(field);

  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Label
          htmlFor={fieldId}
          className="min-w-0 text-sm font-medium leading-5"
        >
          <span className="break-words">{field.label}</span>

          {field.required && (
            <span
              className="ml-1 text-destructive"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </Label>

        {inputSource !== "MANUAL" && (
          <Badge
            variant={inputSource === "AI" ? "secondary" : "outline"}
            className="shrink-0 gap-1 text-[10px] font-medium"
          >
            <Sparkles className="h-3 w-3" />
            {getInputSourceLabel(inputSource)}
          </Badge>
        )}
      </div>

      {field.unit && (
        <Badge
          variant="secondary"
          className="shrink-0 whitespace-nowrap px-2 py-0.5 text-[10px] font-medium"
        >
          {field.unit}
        </Badge>
      )}
    </div>
  );
}

// =====================================================
// AI ACTIONS
// =====================================================

function AIFieldActions({
  service,
  field,
  disabled,
  aiProcessing,
  onStartAI,
}: {
  service: RevenueService;
  field: RevenueField;
  disabled: boolean;
  aiProcessing: boolean;
  onStartAI?: RevenueDynamicFieldProps["onStartAI"];
}) {
  const imageInputId = `${service.id}-${field.id}-ai-image`;
  const videoInputId = `${service.id}-${field.id}-ai-video`;

  const actionsDisabled =
    disabled || aiProcessing || !onStartAI;

  return (
    <div className="space-y-3 rounded-xl border bg-muted/20 p-3 sm:p-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={actionsDisabled}
          onClick={() => {
            void onStartAI?.(service, field, "IMAGE");
          }}
        >
          <Camera className="mr-2 h-4 w-4" />
          Capture image
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={actionsDisabled}
          onClick={() => {
            void onStartAI?.(service, field, "VIDEO");
          }}
        >
          <Video className="mr-2 h-4 w-4" />
          Start video counting
        </Button>

        <label
          htmlFor={imageInputId}
          className={
            actionsDisabled
              ? "pointer-events-none opacity-50"
              : "cursor-pointer"
          }
        >
          <span className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted">
            <Upload className="mr-2 h-4 w-4" />
            Upload image
          </span>

          <input
            id={imageInputId}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={actionsDisabled}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];

              if (file && onStartAI) {
                void onStartAI(service, field, "IMAGE", file);
              }

              event.currentTarget.value = "";
            }}
          />
        </label>

        <label
          htmlFor={videoInputId}
          className={
            actionsDisabled
              ? "pointer-events-none opacity-50"
              : "cursor-pointer"
          }
        >
          <span className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-muted">
            <Video className="mr-2 h-4 w-4" />
            Upload video
          </span>

          <input
            id={videoInputId}
            type="file"
            accept="video/*"
            className="sr-only"
            disabled={actionsDisabled}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];

              if (file && onStartAI) {
                void onStartAI(service, field, "VIDEO", file);
              }

              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      {aiProcessing && (
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle className="h-4 w-4 animate-spin" />
          AI processing is in progress. Please wait...
        </div>
      )}

      {!onStartAI && (
        <p className="text-xs text-muted-foreground">
          AI actions are not connected yet. Configure the onStartAI
          handler in the parent assessment form.
        </p>
      )}
    </div>
  );
}

// =====================================================
// TEXT / NUMBER / DECIMAL
// =====================================================

function TextLikeField({
  field,
  value,
  fieldId,
  describedBy,
  disabled,
  onChange,
}: FieldRendererProps) {
  const type =
    field.type === "NUMBER" || field.type === "DECIMAL"
      ? "number"
      : "text";

  const step =
    field.type === "DECIMAL"
      ? field.step ?? 0.01
      : field.type === "NUMBER"
        ? field.step ?? 1
        : undefined;

  const showUnit =
    Boolean(field.unit) &&
    (field.type === "NUMBER" || field.type === "DECIMAL");

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
        placeholder={
          field.placeholder ??
          (field.type === "DECIMAL" ? "0.00" : undefined)
        }
        disabled={disabled}
        className={showUnit ? "h-11 pr-20" : "h-11"}
        onChange={(event) => onChange(event.target.value)}
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

function TextareaField({
  field,
  value,
  fieldId,
  describedBy,
  disabled,
  onChange,
}: FieldRendererProps) {
  return (
    <Textarea
      id={fieldId}
      aria-describedby={describedBy}
      value={asString(value)}
      placeholder={
        field.placeholder ??
        `Enter ${field.label.toLowerCase()}...`
      }
      disabled={disabled}
      className="min-h-[120px] w-full resize-y leading-5"
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

// =====================================================
// SELECT
// =====================================================

function SelectField({
  field,
  value,
  fieldId,
  describedBy,
  disabled,
  onChange,
}: FieldRendererProps) {
  const [open, setOpen] = useState(false);

  const options = useMemo(
    () =>
      [...(field.options ?? [])].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      ),
    [field.options],
  );

  const selected = options.find((option) =>
    valuesMatch(option.value, value),
  );

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
          <span
            className={`min-w-0 truncate ${
              selected ? "" : "text-muted-foreground"
            }`}
          >
            {selected?.label ??
              `Select ${field.label.toLowerCase()}...`}
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
          <CommandInput
            placeholder={`Search ${field.label.toLowerCase()}...`}
          />

          <CommandList>
            <CommandEmpty>
              {options.length === 0
                ? "No options configured."
                : "No option found."}
            </CommandEmpty>

            {options.length > 0 && (
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = valuesMatch(option.value, value);

                  return (
                    <CommandItem
                      key={option.id ?? String(option.value)}
                      value={`${option.label} ${option.value}`}
                      onSelect={() => {
                        if (disabled) return;

                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      <div
                        className={`mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>

                      <span className="min-w-0 truncate text-sm">
                        {option.label}
                      </span>
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

function RadioField({
  field,
  value,
  describedBy,
  disabled,
  onChange,
}: FieldRendererProps) {
  const options = useMemo(
    () =>
      [...(field.options ?? [])].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      ),
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
              isSelected
                ? "border-primary bg-primary/5"
                : "bg-background hover:bg-muted/50"
            } ${
              disabled ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                isSelected
                  ? "border-primary"
                  : "border-muted-foreground/40"
              }`}
            >
              {isSelected && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </span>

            <span className="min-w-0 break-words text-sm leading-5">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// =====================================================
// CHECKBOX
// =====================================================

function CheckboxField({
  field,
  value,
  fieldId,
  disabled,
  onChange,
}: FieldRendererProps) {
  const helpText = fieldHelpText(field);
  const descriptionId = `${fieldId}-description`;

  const checked = value === true;

  return (
    <label
      htmlFor={fieldId}
      className={`flex w-full min-w-0 items-start gap-3 rounded-xl border p-4 transition-colors ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${
        checked
          ? "border-primary bg-primary/5"
          : "bg-background hover:bg-muted/50"
      }`}
    >
      <input
        id={fieldId}
        name={fieldId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-describedby={helpText ? descriptionId : undefined}
        className="sr-only"
        onChange={(event) => onChange(event.target.checked)}
      />

      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40 bg-background"
        }`}
      >
        {checked && <Check className="h-3.5 w-3.5" />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="break-words text-sm font-medium">
            {field.label}
          </span>

          {field.unit && (
            <Badge
              variant="secondary"
              className="ml-auto shrink-0 text-[10px]"
            >
              {field.unit}
            </Badge>
          )}
        </span>

        {helpText && (
          <span
            id={descriptionId}
            className="mt-1 block text-xs leading-4 text-muted-foreground"
          >
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

function DateField({
  field,
  value,
  disabled,
  onChange,
}: FieldRendererProps) {
  const dateValue = useMemo(() => {
    if (typeof value !== "string" || !value) {
      return undefined;
    }

    // Parse date-only values as local calendar dates. Avoid the
    // timezone shift that can occur with new Date("YYYY-MM-DD").
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const day = Number(match[3]);
      const parsed = new Date(year, month, day);

      if (
        parsed.getFullYear() === year &&
        parsed.getMonth() === month &&
        parsed.getDate() === day
      ) {
        return parsed;
      }
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }, [value]);

  return (
    <EthiopianDatePicker
      value={dateValue}
      disabled={disabled}
      placeholder={field.placeholder ?? "ቀን ይምረጡ"}
      onChange={(date) => {
        if (date) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");

          onChange(`${year}-${month}-${day}`);
        }
      }}
    />
  );
}

// =====================================================
// FILE ROW
// =====================================================

function FileRow({
  file,
  disabled,
  onRemove,
}: {
  file: DisplayFile;
  disabled: boolean;
  onRemove?: () => void;
}) {
  const formattedSize = formatFileSize(file.size);
  const extension = fileExtension(file.name);

  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border bg-background p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {getFileIcon(file)}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p
          className="break-words text-sm font-medium leading-5"
          title={file.name}
        >
          {file.name}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">
            {extension}
          </Badge>

          {formattedSize && (
            <span>{formattedSize}</span>
          )}

          {file.mimeType && (
            <span className="max-w-full break-all">
              {file.mimeType}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <Badge
            variant={statusVariant(file.status)}
            className="gap-1 text-[10px]"
          >
            {file.status === "READY" ||
            file.status === "UPLOADED" ||
            file.status === "COMPLETED" ? (
              <FileCheck2 className="h-3 w-3" />
            ) : file.status === "SELECTED" ? (
              <Check className="h-3 w-3" />
            ) : null}
            {file.status === "SELECTED"
              ? "Selected"
              : file.status}
          </Badge>

          {file.existing && (
            <span className="text-[11px] text-muted-foreground">
              Saved document
            </span>
          )}

          {!file.existing && file.file && (
            <span className="text-[11px] text-muted-foreground">
              Ready to submit
            </span>
          )}
        </div>
      </div>

      {file.url && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => window.open(file.url, "_blank", "noopener,noreferrer")}
        >
          View
        </Button>
      )}

      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label={`Remove ${file.name}`}
          className="h-8 w-8 shrink-0"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// =====================================================
// FILE (SINGLE)
// =====================================================

function SingleFileField({
  service,
  field,
  value,
  fieldId,
  describedBy,
  disabled,
  onFileChange,
  onRemoveFile,
}: FieldRendererProps) {
  const files = getDisplayFiles(value);
  const currentFile = files[0];

  const inputId = `${fieldId}-upload`;
  const replaceInputId = `${fieldId}-replace`;

  return (
    <div className="space-y-3">
      {currentFile ? (
        <>
          <FileRow
            file={currentFile}
            disabled={disabled}
            onRemove={() =>
              onRemoveFile(service.id, field)
            }
          />

          {!disabled && (
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor={replaceInputId}
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Replace file

                <Input
                  id={replaceInputId}
                  type="file"
                  accept={field.accept}
                  className="sr-only"
                  onChange={(event) =>
                    onFileChange(event, service.id, field)
                  }
                />
              </label>

              <p className="text-xs text-muted-foreground">
                Choose a replacement to update this document.
              </p>
            </div>
          )}
        </>
      ) : (
        <label
          htmlFor={inputId}
          className={`flex min-h-24 w-full min-w-0 items-center gap-3 rounded-xl border border-dashed px-4 py-4 transition-colors ${
            disabled
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:border-primary/50 hover:bg-muted/40"
          }`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Upload className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-medium">
              Upload {field.label}
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {field.accept
                ? `Accepted formats: ${field.accept.replaceAll(",", " · ")}`
                : "Choose a supporting document from your device."}
            </p>
          </div>

          <Input
            id={inputId}
            type="file"
            accept={field.accept}
            disabled={disabled}
            aria-describedby={describedBy}
            className="sr-only"
            onChange={(event) =>
              onFileChange(event, service.id, field)
            }
          />
        </label>
      )}
    </div>
  );
}

// =====================================================
// MULTI FILE
// =====================================================

function MultiFileField({
  service,
  field,
  value,
  fieldId,
  describedBy,
  disabled,
  onChange,
  onFileChange,
}: FieldRendererProps) {
  const files = getDisplayFiles(value);
  const inputId = `${fieldId}-multi-upload`;

  return (
    <div className="w-full space-y-3">
      <label
        htmlFor={inputId}
        className={`flex min-h-24 w-full min-w-0 items-center gap-3 rounded-xl border border-dashed px-4 py-4 transition-colors ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-primary/50 hover:bg-muted/40"
        }`}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Paperclip className="h-5 w-5 text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            Add supporting documents
          </p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {field.accept
              ? `Accepted formats: ${field.accept.replaceAll(",", " · ")}`
              : "Select one or more files."}
          </p>
        </div>

        <Input
          id={inputId}
          type="file"
          multiple
          accept={field.accept}
          disabled={disabled}
          aria-describedby={describedBy}
          className="sr-only"
          onChange={(event) => {
            onFileChange(event, service.id, field);
          }}
        />
      </label>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              Selected documents
            </p>
            <Badge variant="secondary">
              {files.length} {files.length === 1 ? "file" : "files"}
            </Badge>
          </div>

          {files.map((file, index) => (
            <FileRow
              key={file.key}
              file={file}
              disabled={disabled}
              onRemove={
                !file.existing
                  ? () => {
                      onChange(
                        files
                          .filter((_, fileIndex) => fileIndex !== index)
                          .map((item) => item.file)
                          .filter(
                            (item): item is File =>
                              item instanceof File,
                          ),
                      );
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// TYPE -> RENDERER LOOKUP
// =====================================================

const FIELD_RENDERERS: Record<
  string,
  (props: FieldRendererProps) => JSX.Element
> = {
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
  onStartAI,
  aiProcessing = false,
  disabled = false,
}: RevenueDynamicFieldProps) {
  const fieldId = `${service.id}-${field.id}`;
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;
  const sourceDescriptionId = `${fieldId}-source-description`;

  const helpText = fieldHelpText(field);
  const inputSource = getInputSource(field);
  const isAiOnly = inputSource === "AI";

  const isFieldDisabled = disabled || isAiOnly;
  const sourceDescription = getInputSourceDescription(inputSource);

  const describedBy = [
    helpText ? descriptionId : null,
    sourceDescription ? sourceDescriptionId : null,
    error ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  const Renderer = FIELD_RENDERERS[field.type];

  if (!Renderer) {
    return (
      <div className={`min-w-0 space-y-2 ${getFieldLayoutClass(field)}`}>
        <FieldHeader field={field} fieldId={fieldId} />

        <p className="text-xs text-destructive">
          Unsupported field type: <code>{field.type}</code>
        </p>
      </div>
    );
  }

  return (
    <div className={`min-w-0 space-y-2.5 ${getFieldLayoutClass(field)}`}>
      {field.type !== "CHECKBOX" && (
        <FieldHeader field={field} fieldId={fieldId} />
      )}

      {field.type !== "CHECKBOX" && helpText && (
        <p
          id={descriptionId}
          className="max-w-3xl text-xs leading-5 text-muted-foreground"
        >
          {helpText}
        </p>
      )}

      {sourceDescription && (
        <p
          id={sourceDescriptionId}
          className="text-xs leading-5 text-muted-foreground"
        >
          {sourceDescription}
        </p>
      )}

      <Renderer
        service={service}
        field={field}
        value={value}
        fieldId={fieldId}
        describedBy={describedBy}
        disabled={isFieldDisabled}
        onChange={onChange}
        onFileChange={onFileChange}
        onRemoveFile={onRemoveFile}
      />

      {(isAiOnly || inputSource === "MANUAL_OR_AI") && (
        <AIFieldActions
          service={service}
          field={field}
          disabled={disabled}
          aiProcessing={aiProcessing}
          onStartAI={onStartAI}
        />
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-2 text-xs font-medium leading-5 text-destructive"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
