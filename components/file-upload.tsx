
"use client";

import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import {
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FileUploadProps = {
  /** Selected files controlled by the parent form. */
  value: File[];

  /** Called whenever the selected files change. */
  onChange: (files: File[]) => void;

  /** Allow one file or multiple files. Defaults to true. */
  multiple?: boolean;

  /** Accepted extensions or MIME types. */
  accept?: string;

  /** Maximum allowed size per file, in MB. */
  maxSizeMB?: number;

  /** Maximum number of files. Applies to multiple mode. */
  maxFiles?: number;

  /** Field label. */
  label?: string;

  /** Helper text below the label. */
  description?: string;

  /** Upload area text. */
  placeholder?: string;

  /** Disable selection and removal. */
  disabled?: boolean;

  /** Display a required indicator. */
  required?: boolean;

  /** Additional wrapper classes. */
  className?: string;

  /** Optional input ID. Generated automatically when omitted. */
  id?: string;
};

const DEFAULT_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileExtension(file: File): string {
  const parts = file.name.split(".");

  return parts.length > 1
    ? parts.pop()!.toUpperCase()
    : "FILE";
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function getFileKey(file: File): string {
  return [
    file.name,
    file.size,
    file.lastModified,
    file.type,
  ].join("-");
}

function isAcceptedFile(file: File, accept: string): boolean {
  const rules = accept
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);

  if (rules.length === 0) {
    return true;
  }

  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  return rules.some((rule) => {
    if (rule.startsWith(".")) {
      return fileName.endsWith(rule);
    }

    if (rule.endsWith("/*")) {
      return mimeType.startsWith(rule.slice(0, -1));
    }

    return mimeType === rule;
  });
}

export function FileUpload({
  value,
  onChange,
  multiple = true,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 10,
  maxFiles,
  label = "Supporting Documents",
  description,
  placeholder,
  disabled = false,
  required = false,
  className,
  id,
}: FileUploadProps) {
  const generatedId = useId();
  const inputId = id ?? `file-upload-${generatedId}`;

  const inputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const effectiveMaxFiles = multiple
    ? Math.max(1, maxFiles ?? Number.MAX_SAFE_INTEGER)
    : 1;

  const sizeLimit = maxSizeMB * 1024 * 1024;

  const helperText =
    description ??
    (multiple
      ? `Select one or more files. Maximum ${maxSizeMB} MB per file.`
      : `Select one file. Maximum ${maxSizeMB} MB.`);

  const canAddFiles =
    !disabled &&
    (multiple
      ? value.length < effectiveMaxFiles
      : true);

  const processFiles = (selectedFiles: FileList | File[]) => {
    if (disabled) {
      return;
    }

    const incomingFiles = Array.from(selectedFiles);
    const nextErrors: string[] = [];
    const validFiles: File[] = [];

    // Single-file mode replaces the current selection.
    const startingFiles = multiple ? [...value] : [];

    for (const file of incomingFiles) {
      if (!isAcceptedFile(file, accept)) {
        nextErrors.push(
          `"${file.name}" has an unsupported file type.`,
        );
        continue;
      }

      if (file.size === 0) {
        nextErrors.push(`"${file.name}" is empty.`);
        continue;
      }

      if (file.size > sizeLimit) {
        nextErrors.push(
          `"${file.name}" exceeds the ${maxSizeMB} MB size limit.`,
        );
        continue;
      }

      const duplicate = [
        ...startingFiles,
        ...validFiles,
      ].some(
        (existing) => getFileKey(existing) === getFileKey(file),
      );

      if (duplicate) {
        continue;
      }

      if (
        startingFiles.length + validFiles.length >=
        effectiveMaxFiles
      ) {
        nextErrors.push(
          multiple
            ? `You can select a maximum of ${effectiveMaxFiles} files.`
            : "Only one file can be selected.",
        );
        break;
      }

      validFiles.push(file);
    }

    const nextFiles = multiple
      ? [...startingFiles, ...validFiles]
      : validFiles.slice(0, 1);

    onChange(nextFiles);
    setErrors(nextErrors);
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.currentTarget.files;

    if (files) {
      processFiles(files);
    }

    // Allow the same file to be selected again later.
    event.currentTarget.value = "";
  };

  const handleRemove = (index: number) => {
    if (disabled) {
      return;
    }

    onChange(value.filter((_, i) => i !== index));
    setErrors([]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (disabled) {
      return;
    }

    if (event.dataTransfer.files.length > 0) {
      processFiles(event.dataTransfer.files);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Keep the input mounted so Replace file always works. */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        required={required && value.length === 0}
        className="sr-only"
        onChange={handleInputChange}
        aria-describedby={`${inputId}-description`}
        aria-invalid={errors.length > 0}
      />

      <div className="space-y-1">
        <label
          htmlFor={inputId}
          className="text-sm font-medium leading-none"
        >
          {label}

          {required && (
            <span
              className="ml-1 text-destructive"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>

        <p
          id={`${inputId}-description`}
          className="text-xs text-muted-foreground"
        >
          {helperText}
        </p>
      </div>

      {canAddFiles && (
        <div
          onDragOver={(event) => {
            event.preventDefault();

            if (!disabled) {
              setIsDragging(true);
            }
          }}
          onDragLeave={(event) => {
            const nextTarget = event.relatedTarget;

            if (
              !(nextTarget instanceof Node) ||
              !event.currentTarget.contains(nextTarget)
            ) {
              setIsDragging(false);
            }
          }}
          onDrop={handleDrop}
          className={cn(
            "rounded-lg border border-dashed transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/40",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-2 p-6 text-center",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "focus-visible:ring-offset-2",
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </span>

            <span className="text-sm font-medium">
              {placeholder ??
                (multiple
                  ? "Choose files to upload"
                  : "Choose a file to upload")}
            </span>

            <span className="text-xs text-muted-foreground">
              Click to browse or drag and drop
            </span>
          </button>
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-2" aria-live="polite">
          {value.map((file, index) => (
            <div
              key={getFileKey(file)}
              className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                  {isImageFile(file) ? (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {file.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {getFileExtension(file)}
                    {" · "}
                    {isImageFile(file) ? "Image" : "Document"}
                    {" · "}
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                onClick={() => handleRemove(index)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {multiple && maxFiles !== undefined && (
            <p className="text-xs text-muted-foreground">
              {value.length} of {effectiveMaxFiles} files selected
            </p>
          )}
        </div>
      )}

      {errors.length > 0 && (
        <div
          role="alert"
          className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-3"
        >
          {errors.map((error, index) => (
            <p
              key={`${error}-${index}`}
              className="flex items-start gap-2 text-xs text-destructive"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          ))}
        </div>
      )}

      {!multiple && value.length > 0 && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          Replace file
        </Button>
      )}
    </div>
  );
}