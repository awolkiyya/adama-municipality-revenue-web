
"use client";

import { useRef } from "react";
import type { ChangeEvent } from "react";

import {
  Eye,
  File,
  FileImage,
  FilePlus2,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";

import type { CashReconciliationEvidence } from "@/types/cash-reconciliation";

import { Button } from "@/components/ui/button";

// ============================================================
// TYPES
// ============================================================

export type CashReconciliationEvidenceFile =
  CashReconciliationEvidence;

type CashReconciliationEvidenceSectionProps = {
  files: CashReconciliationEvidenceFile[];

  /**
   * Only DRAFT and RETURNED reconciliations should be editable.
   */
  isEditable: boolean;

  isLoading?: boolean;
  isUploading?: boolean;
  removingFileId?: string | null;

  /**
   * Upload selected files.
   */
  onUpload: (files: File[]) => Promise<void>;

  /**
   * Remove an existing evidence record.
   */
  onRemove: (
    file: CashReconciliationEvidenceFile
  ) => Promise<void>;

  /**
   * Open the preview dialog for an existing server file.
   */
  onPreview: (
    file: CashReconciliationEvidenceFile
  ) => void | Promise<void>;

  error?: string | null;
};

// ============================================================
// CONSTANTS
// ============================================================

const ACCEPTED_FILE_TYPES = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
];

const ACCEPTED_EXTENSIONS = new Set(
  ACCEPTED_FILE_TYPES.map((type) =>
    type.replace(".", "")
  )
);

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
]);

const DOCUMENT_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ============================================================
// HELPERS
// ============================================================

function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".");

  return index <= 0
    ? ""
    : fileName.slice(index + 1).toLowerCase();
}

function formatFileSize(bytes: number | null): string {
  if (
    bytes === null ||
    !Number.isFinite(bytes) ||
    bytes < 0
  ) {
    return "Size unavailable";
  }

  if (bytes === 0) {
    return "0 Bytes";
  }

  const units = ["Bytes", "KB", "MB", "GB"];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  const size = bytes / Math.pow(1024, index);

  return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function formatUploadDate(value: string | null): string {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isImageFile(
  file: CashReconciliationEvidenceFile
): boolean {
  const mimeType = file.mime_type?.toLowerCase() ?? "";
  const extension = getFileExtension(file.original_name);

  return (
    mimeType.startsWith("image/") ||
    IMAGE_EXTENSIONS.has(extension)
  );
}

// ============================================================
// FILE ICON
// ============================================================

function EvidenceFileIcon({
  file,
}: {
  file: CashReconciliationEvidenceFile;
}) {
  const mimeType = file.mime_type?.toLowerCase() ?? "";
  const extension = getFileExtension(file.original_name);

  const isImage =
    mimeType.startsWith("image/") ||
    IMAGE_EXTENSIONS.has(extension);

  const isDocument =
    mimeType === "application/pdf" ||
    mimeType.includes("word") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv") ||
    DOCUMENT_EXTENSIONS.has(extension);

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
      {isImage ? (
        <FileImage className="h-5 w-5 text-muted-foreground" />
      ) : isDocument ? (
        <FileText className="h-5 w-5 text-muted-foreground" />
      ) : (
        <File className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function CashReconciliationEvidenceSection({
  files,
  isEditable,
  isLoading = false,
  isUploading = false,
  removingFileId = null,
  onUpload,
  onRemove,
  onPreview,
  error,
}: CashReconciliationEvidenceSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // ==========================================================
  // FILE SELECTION
  // ==========================================================

  async function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    const selectedFiles = Array.from(
      event.target.files ?? []
    );

    // Allow selecting the same file again.
    event.target.value = "";

    if (
      selectedFiles.length === 0 ||
      !isEditable ||
      isUploading
    ) {
      return;
    }

    // Validate file extensions.
    const unsupportedFiles = selectedFiles.filter(
      (file) =>
        !ACCEPTED_EXTENSIONS.has(
          getFileExtension(file.name)
        )
    );

    if (unsupportedFiles.length > 0) {
      const names = unsupportedFiles
        .map((file) => file.name)
        .join(", ");

      window.alert(
        `Unsupported file formats: ${names}\n\nSupported formats: ${ACCEPTED_FILE_TYPES.join(", ")}`
      );

      return;
    }

    // Validate individual file sizes.
    const oversizedFiles = selectedFiles.filter(
      (file) => file.size > MAX_FILE_SIZE
    );

    if (oversizedFiles.length > 0) {
      const names = oversizedFiles
        .map((file) => file.name)
        .join(", ");

      window.alert(
        `The following files exceed the 10 MB limit: ${names}`
      );

      return;
    }

    try {
      await onUpload(selectedFiles);
    } catch {
      // Parent handles API errors and notifications.
    }
  }

  // ==========================================================
  // REMOVE EVIDENCE
  // ==========================================================

  async function handleRemove(
    file: CashReconciliationEvidenceFile
  ): Promise<void> {
    if (
      !isEditable ||
      removingFileId ||
      isUploading
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove "${file.original_name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await onRemove(file);
    } catch {
      // Parent handles API errors and notifications.
    }
  }

  // ==========================================================
  // PREVIEW EVIDENCE
  // ==========================================================

  async function handlePreview(
    file: CashReconciliationEvidenceFile
  ): Promise<void> {
    try {
      await onPreview(file);
    } catch {
      // Parent handles API errors and notifications.
    }
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="space-y-4">
      {/* SINGLE FILE INPUT */}

      {isEditable && (
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES.join(",")}
          onChange={handleFileSelection}
          disabled={isUploading}
          className="hidden"
        />
      )}

      {/* SECTION HEADING */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />

            <h3 className="text-sm font-semibold">
              Supporting Evidence
            </h3>

            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {files.length}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Bank statements, deposit receipts, handover
            receipts, and other supporting documents.
          </p>
        </div>

        {isEditable && (
          <Button
            type="button"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="shrink-0"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Evidence
              </>
            )}
          </Button>
        )}
      </div>

      {/* UPLOAD INFORMATION */}

      {isEditable && (
        <div className="rounded-lg border border-dashed bg-muted/30 p-3">
          <div className="flex items-start gap-3">
            <FilePlus2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

            <div className="space-y-1">
              <p className="text-xs font-medium">
                Evidence upload requirements
              </p>

              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, JPG, JPEG, PNG,
                WEBP, DOC, DOCX, XLS, XLSX, and CSV.
              </p>

              <p className="text-xs text-muted-foreground">
                Maximum file size: 10 MB per file.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* LOADING STATE */}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading evidence documents...
        </div>
      ) : files.length === 0 ? (
        // EMPTY STATE

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </div>

          <p className="text-sm font-medium">
            No evidence uploaded
          </p>

          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {isEditable
              ? "Upload supporting documents to provide evidence for this cash reconciliation."
              : "No supporting documents are attached to this reconciliation."}
          </p>

          {isEditable && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Add Evidence
            </Button>
          )}
        </div>
      ) : (
        // EVIDENCE LIST

        <div className="divide-y rounded-lg border">
          {files.map((file) => {
            const isRemoving =
              removingFileId === file.id;

            return (
              <div
                key={file.id}
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* FILE INFORMATION */}

                <div className="flex min-w-0 items-start gap-3">
                  <EvidenceFileIcon file={file} />

                  <div className="min-w-0 flex-1 space-y-1">
                    <p
                      className="break-all text-sm font-medium"
                      title={file.original_name}
                    >
                      {file.original_name}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {formatFileSize(file.size)}
                      </span>

                      <span aria-hidden="true">•</span>

                      <span>
                        {formatUploadDate(file.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* FILE ACTIONS */}

                <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Preview evidence"
                    aria-label={`Preview ${file.original_name}`}
                    onClick={() => void handlePreview(file)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {isEditable && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Remove evidence"
                      aria-label={`Remove ${file.original_name}`}
                      disabled={
                        isRemoving ||
                        !!removingFileId ||
                        isUploading
                      }
                      onClick={() => void handleRemove(file)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      {isRemoving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* READ-ONLY INFORMATION */}

      {!isEditable && (
        <p className="text-xs text-muted-foreground">
          Evidence is read-only because this reconciliation
          is no longer editable.
        </p>
      )}
    </section>
  );
}
