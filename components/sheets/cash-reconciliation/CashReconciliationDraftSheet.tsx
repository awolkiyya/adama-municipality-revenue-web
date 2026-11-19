"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  Paperclip,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { toast } from "sonner";

import type { CashReconciliation } from "@/types/cash-reconciliation";

import { EthiopianDatePicker } from "@/components/input/EthiopianDatePicker";

import CashReconciliationEvidenceSection, {
  type CashReconciliationEvidenceFile,
} from "@/components/CashReconciliationEvidenceSection";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { cn } from "@/lib/utils";

import {
  parseApiDate,
  sameCalendarDay,
  toApiDateBoundary,
} from "@/utils/cash-reconciliation-utils";

import {
  FilePreviewDialog,
  FileTile,
  KIND_STYLES,
  downloadLocalFile,
  formatFileSize,
  getFileExtension,
  getFileKind,
} from "./FilePreviewDialog";

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_NOTES_LENGTH = 5000;

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

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface CashReconciliationDraftPayload {
  period_start: string;
  period_end: string;
  collector_notes: string | null;
}

interface CashReconciliationDraftSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  record: CashReconciliation | null;

  isSaving: boolean;

  /**
   * Saves the reconciliation and its evidence in ONE multipart request.
   *
   * files:
   *   Newly selected files to upload.
   *
   * removeEvidenceIds:
   *   Database IDs of existing evidence files to remove.
   */
  onSave: (
    payload: CashReconciliationDraftPayload,
    files: File[],
    removeEvidenceIds: string[],
  ) => Promise<CashReconciliation>;

  /**
   * Preview an existing evidence file.
   * The parent must implement the backend Blob request.
   */
  onPreviewEvidence?: (
    file: CashReconciliationEvidenceFile,
  ) => void | Promise<void>;

  /**
   * Download an existing evidence file.
   * The parent must implement the backend Blob request.
   */
  onDownloadEvidence?: (
    file: CashReconciliationEvidenceFile,
  ) => void | Promise<void>;

  isLoadingEvidence?: boolean;

  evidenceError?: string | null;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isSameFile(first: File, second: File): boolean {
  return (
    first.name === second.name &&
    first.size === second.size &&
    first.lastModified === second.lastModified
  );
}

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

function countDaysInclusive(start: Date, end: Date): number {
  return (
    Math.round(
      (startOfDay(end) - startOfDay(start)) / 86_400_000,
    ) + 1
  );
}

function SectionHeading({
  title,
  description,
  aside,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold tracking-tight">
          {title}
        </h3>

        {description && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {aside}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The outer component gives the form a stable reset boundary.
 *
 * When the sheet opens/closes or the selected record changes,
 * the inner component remounts and initializes its form state
 * from the current record.
 *
 * This avoids synchronizing React state through useEffect.
 */
export function CashReconciliationDraftSheet(
  props: CashReconciliationDraftSheetProps,
) {
  const recordKey = JSON.stringify([
    props.open,
    props.record?.id ?? null,
    props.record?.period_start ?? null,
    props.record?.period_end ?? null,
    props.record?.collector_notes ?? null,
  ]);

  return (
    <CashReconciliationDraftSheetContent
      key={recordKey}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Stateful sheet content                                                     */
/* -------------------------------------------------------------------------- */

function CashReconciliationDraftSheetContent({
  open,
  onOpenChange,
  record,
  isSaving,
  onSave,
  onPreviewEvidence,
  isLoadingEvidence = false,
  evidenceError = null,
}: CashReconciliationDraftSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ------------------------------------------------------------------------ */
  /* Form state                                                               */
  /* ------------------------------------------------------------------------ */

  const [periodStart, setPeriodStart] = useState<Date | undefined>(
    () => parseApiDate(record?.period_start),
  );

  const [periodEnd, setPeriodEnd] = useState<Date | undefined>(
    () => parseApiDate(record?.period_end),
  );

  const [collectorNotes, setCollectorNotes] = useState(
    () => record?.collector_notes ?? "",
  );

  /**
   * Newly selected files are staged locally.
   * They are uploaded when the user saves the draft.
   */
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  /**
   * Existing evidence database IDs marked for removal.
   *
   * Actual removal happens only after a successful save.
   */
  const [removedEvidenceIds, setRemovedEvidenceIds] = useState<
    string[]
  >([]);

  const [isDragging, setIsDragging] = useState(false);

  const [previewIndex, setPreviewIndex] = useState<number | null>(
    null,
  );

  const isPreviewOpen = previewIndex !== null;
  const isBusy = isSaving;

  /* ------------------------------------------------------------------------ */
  /* Existing evidence                                                        */
  /* ------------------------------------------------------------------------ */

  /**
   * Hide evidence files that the user has marked for removal.
   * The actual removal happens only after saving successfully.
   *
   * The fallback array is created inside useMemo so the dependency
   * remains stable when record.evidence is undefined.
   */
  const visibleEvidenceFiles = useMemo(
    () =>
      (record?.evidence ?? []).filter(
        (file) => !removedEvidenceIds.includes(String(file.id)),
      ),
    [record?.evidence, removedEvidenceIds],
  );

  const canEditEvidence =
    !record ||
    record.status === "DRAFT" ||
    record.status === "RETURNED";

  /* ------------------------------------------------------------------------ */
  /* Derived values                                                           */
  /* ------------------------------------------------------------------------ */

  const hasInvalidRange =
    !!periodStart &&
    !!periodEnd &&
    periodEnd.getTime() < periodStart.getTime();

  const dayCount =
    periodStart && periodEnd && !hasInvalidRange
      ? countDaysInclusive(periodStart, periodEnd)
      : null;

  const totalEvidenceChanges =
    pendingFiles.length + removedEvidenceIds.length;

  /* ------------------------------------------------------------------------ */
  /* File handling                                                            */
  /* ------------------------------------------------------------------------ */

  const processFiles = useCallback(
    (selectedFiles: File[]) => {
      if (selectedFiles.length === 0) {
        return;
      }

      if (!canEditEvidence) {
        toast.error(
          "Evidence cannot be changed for this reconciliation.",
        );
        return;
      }

      const invalidFiles = selectedFiles.filter((file) => {
        const extension = getFileExtension(file.name).toLowerCase();

        return !ACCEPTED_FILE_TYPES.includes(`.${extension}`);
      });

      if (invalidFiles.length > 0) {
        toast.error(
          `Unsupported file type: ${invalidFiles
            .map((file) => file.name)
            .join(", ")}`,
        );

        return;
      }

      const oversizedFiles = selectedFiles.filter(
        (file) => file.size > MAX_FILE_SIZE,
      );

      if (oversizedFiles.length > 0) {
        toast.error(
          `Each file must be 10 MB or smaller: ${oversizedFiles
            .map((file) => file.name)
            .join(", ")}`,
        );

        return;
      }

      const additions = selectedFiles.filter(
        (file) =>
          !pendingFiles.some((existing) =>
            isSameFile(existing, file),
          ),
      );

      if (additions.length === 0) {
        toast.info("These files have already been selected.");
        return;
      }

      setPendingFiles((current) => {
        const combined = [...current];

        for (const file of additions) {
          if (
            !combined.some((existing) =>
              isSameFile(existing, file),
            )
          ) {
            combined.push(file);
          }
        }

        return combined;
      });

      toast.success(
        `${additions.length} evidence ${
          additions.length === 1 ? "file" : "files"
        } added. Save the draft to upload.`,
      );
    },
    [canEditEvidence, pendingFiles],
  );

  function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFiles = Array.from(
      event.target.files ?? [],
    );

    event.target.value = "";

    processFiles(selectedFiles);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();

    setIsDragging(false);

    if (isBusy) {
      return;
    }

    processFiles(Array.from(event.dataTransfer.files));
  }

  /* ------------------------------------------------------------------------ */
  /* Remove pending files                                                     */
  /* ------------------------------------------------------------------------ */

  function removePendingFile(index: number) {
    setPendingFiles((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );

    setPreviewIndex((currentIndex) => {
      if (currentIndex === null) {
        return null;
      }

      if (currentIndex === index) {
        return pendingFiles.length <= 1
          ? null
          : Math.min(index, pendingFiles.length - 2);
      }

      return currentIndex > index
        ? currentIndex - 1
        : currentIndex;
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Mark existing evidence for removal                                      */
  /* ------------------------------------------------------------------------ */

  function handleMarkEvidenceForRemoval(
    file: CashReconciliationEvidenceFile,
  ): Promise<void> {
    if (isBusy) {
      return Promise.resolve();
    }

    if (!canEditEvidence) {
      toast.error(
        "Evidence cannot be changed for this reconciliation.",
      );

      return Promise.resolve();
    }

    const evidenceId = String(file.id);

    if (!evidenceId || evidenceId === "undefined") {
      toast.error("Unable to identify this evidence file.");

      return Promise.resolve();
    }

    setRemovedEvidenceIds((current) => {
      if (current.includes(evidenceId)) {
        return current;
      }

      return [...current, evidenceId];
    });

    toast.success(
      `"${file.original_name}" marked for removal. Save the draft to apply the change.`,
    );

    return Promise.resolve();
  }

  /* ------------------------------------------------------------------------ */
  /* Existing evidence preview                                                */
  /* ------------------------------------------------------------------------ */

  async function handlePreviewExistingEvidence(
    file: CashReconciliationEvidenceFile,
  ): Promise<void> {
    if (isBusy) {
      return;
    }

    if (!file.uuid) {
      toast.error("This evidence file cannot be previewed.");
      return;
    }

    if (!onPreviewEvidence) {
      toast.error("Evidence preview is not configured.");
      return;
    }

    await onPreviewEvidence(file);
  }

  /* ------------------------------------------------------------------------ */
  /* Save draft, upload new evidence and remove selected evidence             */
  /* ------------------------------------------------------------------------ */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    if (!periodStart || !periodEnd) {
      toast.error(
        "Select both the closing period start and end.",
      );
      return;
    }

    if (
      Number.isNaN(periodStart.getTime()) ||
      Number.isNaN(periodEnd.getTime())
    ) {
      toast.error("Select valid closing period dates.");
      return;
    }

    if (periodEnd.getTime() < periodStart.getTime()) {
      toast.error(
        "The period end must be on or after the period start.",
      );
      return;
    }

    if (!canEditEvidence && totalEvidenceChanges > 0) {
      toast.error(
        "Evidence cannot be changed for this reconciliation.",
      );
      return;
    }

    const payload: CashReconciliationDraftPayload = {
      period_start: toApiDateBoundary(periodStart),
      period_end: toApiDateBoundary(periodEnd, true),
      collector_notes: collectorNotes.trim() || null,
    };

    /**
     * Snapshot all changes before submitting.
     */
    const filesToUpload = [...pendingFiles];
    const evidenceIdsToRemove = [...removedEvidenceIds];

    try {
      /**
       * ONE API REQUEST:
       *
       * 1. Draft fields
       * 2. Newly selected evidence files
       * 3. IDs of existing evidence files to remove
       */
      const savedRecord = await onSave(
        payload,
        filesToUpload,
        evidenceIdsToRemove,
      );

      if (!savedRecord?.id) {
        throw new Error(
          "The server did not return the saved reconciliation ID.",
        );
      }

      /**
       * Clear local changes only after successful saving.
       */
      setPendingFiles([]);
      setRemovedEvidenceIds([]);
      setPreviewIndex(null);
    } catch {
      /**
       * The parent handles the API error and displays the toast.
       *
       * Keep selected files and removal IDs so the user
       * can retry without selecting everything again.
       */
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Labels                                                                   */
  /* ------------------------------------------------------------------------ */

  const submitLabel = isSaving
    ? "Saving draft and evidence…"
    : record
      ? totalEvidenceChanges > 0
        ? `Save changes (${totalEvidenceChanges} evidence changes)`
        : "Save changes"
      : pendingFiles.length > 0
        ? `Create draft & upload ${pendingFiles.length}`
        : "Create draft";

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        if (isBusy || isPreviewOpen) {
          return;
        }

        onOpenChange(value);
      }}
    >
      <SheetContent
        side="right"
        onEscapeKeyDown={(event) => {
          if (isPreviewOpen) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (isPreviewOpen) {
            event.preventDefault();
          }
        }}
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl"
      >
        {/* ------------------------------ Header ------------------------------ */}

        <SheetHeader className="border-b bg-gradient-to-b from-primary/[0.06] to-transparent px-5 py-5 text-left sm:px-6">
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <CalendarDays className="size-5" />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-xl">
                  {record
                    ? "Edit cash closing"
                    : "New cash closing"}
                </SheetTitle>

                {record && (
                  <Badge
                    variant="secondary"
                    className="font-mono text-[11px]"
                  >
                    #{record.id}
                  </Badge>
                )}
              </div>

              <SheetDescription className="leading-relaxed">
                Choose the period this closing covers and attach
                your proof of cash. Expected cash is calculated
                when you submit.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col"
        >
          <div className="flex-1 space-y-8 px-5 py-6 sm:px-6">
            {/* ---------------------------- Closing period ---------------------------- */}

            <section className="space-y-4">
              <SectionHeading
                title="Closing period"
                description="The date range covered by this reconciliation."
              />

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Start · Ethiopian calendar</Label>

                  <EthiopianDatePicker
                    value={periodStart}
                    onChange={(date) => {
                      setPeriodStart(date);

                      if (
                        periodEnd &&
                        date.getTime() > periodEnd.getTime()
                      ) {
                        setPeriodEnd(undefined);
                      }
                    }}
                    placeholder="Select start date"
                    disabled={isBusy}
                    searchable
                    showTime
                    timeFormat="12h"
                  />

                  <p className="text-xs text-muted-foreground">
                    Counted from 12:00:00 AM.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>End · Ethiopian calendar</Label>

                  <EthiopianDatePicker
                    value={periodEnd}
                    onChange={setPeriodEnd}
                    placeholder="Select end date"
                    disabled={isBusy}
                    searchable
                    showTime
                    timeFormat="12h"
                  />

                  <p className="text-xs text-muted-foreground">
                    Counted until 11:59:59 PM, so the selected
                    day is included.
                  </p>
                </div>
              </div>

              {hasInvalidRange && (
                <div
                  role="alert"
                  className="flex gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />

                  <p>
                    The end date must be on or after the start date.
                  </p>
                </div>
              )}

              {dayCount !== null &&
                periodStart &&
                periodEnd && (
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                    <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-background text-center ring-1 ring-border">
                      <span className="text-sm font-semibold leading-none">
                        {dayCount}
                      </span>

                      <span className="mt-0.5 text-[9px] leading-none text-muted-foreground">
                        {dayCount === 1 ? "day" : "days"}
                      </span>
                    </div>

                    <p className="text-sm leading-snug text-muted-foreground">
                      {sameCalendarDay(
                        periodStart,
                        periodEnd,
                      )
                        ? "This closing covers one full calendar day."
                        : `This closing covers ${dayCount} calendar days, start and end included.`}
                    </p>
                  </div>
                )}
            </section>

            {/* ---------------------------- Collector notes ---------------------------- */}

            <section className="space-y-3">
              <SectionHeading
                title="Collector notes"
                description="Anything the reviewer should know about this closing."
                aside={
                  <span
                    className={cn(
                      "shrink-0 text-xs tabular-nums text-muted-foreground",
                      collectorNotes.length >
                        MAX_NOTES_LENGTH * 0.9 &&
                        "text-amber-600",
                    )}
                  >
                    {collectorNotes.length}/{MAX_NOTES_LENGTH}
                  </span>
                }
              />

              <Textarea
                id="collector_notes"
                value={collectorNotes}
                onChange={(event) =>
                  setCollectorNotes(event.target.value)
                }
                placeholder="For example: a deposit was made after cut-off, or a receipt is missing."
                rows={4}
                maxLength={MAX_NOTES_LENGTH}
                disabled={isBusy}
                className="resize-none"
              />
            </section>

            {/* ---------------------------- Supporting evidence ---------------------------- */}

            <section className="space-y-3">
              <SectionHeading
                title="Supporting evidence"
                description="Bank statements, deposit receipts, handover receipts, or similar proof."
                aside={
                  totalEvidenceChanges > 0 ? (
                    <Badge
                      variant="secondary"
                      className="shrink-0"
                    >
                      {totalEvidenceChanges} pending change
                      {totalEvidenceChanges === 1 ? "" : "s"}
                    </Badge>
                  ) : undefined
                }
              />

              {/* Existing evidence from the API */}

              {record && (
                <CashReconciliationEvidenceSection
                  files={visibleEvidenceFiles}
                  isEditable={canEditEvidence && !isBusy}
                  isLoading={isLoadingEvidence}
                  onUpload={async (files) => {
                    processFiles(files);
                  }}
                  onRemove={handleMarkEvidenceForRemoval}
                  onPreview={handlePreviewExistingEvidence}
                />
              )}

              {evidenceError && (
                <p
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {evidenceError}
                </p>
              )}

              {/* File selection */}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_FILE_TYPES.join(",")}
                onChange={handleFileSelection}
                disabled={isBusy || !canEditEvidence}
                className="hidden"
              />

              {/* Drop zone */}

              {canEditEvidence && (
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  onDragOver={(event) => {
                    event.preventDefault();

                    if (!isBusy) {
                      setIsDragging(true);
                    }
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  disabled={isBusy}
                  className={cn(
                    "group flex w-full items-center gap-4 rounded-2xl border-2 border-dashed px-5 text-left outline-none transition-all",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    pendingFiles.length > 0
                      ? "py-4"
                      : "py-7",
                    isDragging
                      ? "scale-[1.01] border-primary bg-primary/5"
                      : "bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform",
                      isDragging
                        ? "scale-110"
                        : "group-hover:-translate-y-0.5",
                    )}
                  >
                    <UploadCloud className="size-6" />
                  </span>

                  <span className="min-w-0 space-y-0.5">
                    <span className="block text-sm font-medium">
                      {isDragging
                        ? "Drop to add files"
                        : pendingFiles.length > 0
                          ? "Add more documents"
                          : "Drop files here or browse"}
                    </span>

                    <span className="block text-xs text-muted-foreground">
                      PDF, images, Word, Excel or CSV · up to
                      10 MB each
                    </span>
                  </span>
                </button>
              )}

              {/* Staged files */}

              {pendingFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      New evidence · Not yet uploaded
                    </p>

                    <Badge variant="outline">
                      {pendingFiles.length} pending
                    </Badge>
                  </div>

                  <ul className="space-y-2">
                    {pendingFiles.map((file, index) => {
                      const kind = getFileKind(file);
                      const styles = KIND_STYLES[kind];

                      return (
                        <li
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                          className="group flex min-w-0 items-center gap-3 rounded-xl border bg-background p-2.5 pr-2 shadow-sm transition-colors hover:border-primary/30"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewIndex(index)
                            }
                            disabled={isBusy}
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`Preview ${file.name}`}
                          >
                            <FileTile
                              kind={kind}
                              className="size-11"
                            />

                            <span className="min-w-0 flex-1 space-y-1">
                              <span
                                className="block truncate text-sm font-medium"
                                title={file.name}
                              >
                                {file.name}
                              </span>

                              <span className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "px-1.5 py-0 text-[10px] font-semibold",
                                    styles.badge,
                                  )}
                                >
                                  {getFileExtension(
                                    file.name,
                                  ).toUpperCase() ||
                                    styles.label}
                                </Badge>

                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)}
                                </span>
                              </span>
                            </span>
                          </button>

                          <div className="flex shrink-0 items-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              disabled={isBusy}
                              onClick={() =>
                                setPreviewIndex(index)
                              }
                              aria-label={`Preview ${file.name}`}
                              title="Preview"
                            >
                              <Eye className="size-4" />
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              disabled={isBusy}
                              onClick={() =>
                                downloadLocalFile(file)
                              }
                              aria-label={`Download ${file.name}`}
                              title="Download"
                            >
                              <Download className="size-4" />
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              disabled={isBusy}
                              onClick={() =>
                                removePendingFile(index)
                              }
                              aria-label={`Remove ${file.name}`}
                              title="Remove"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Evidence removal summary */}

              {removedEvidenceIds.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />

                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {removedEvidenceIds.length} existing{" "}
                        {removedEvidenceIds.length === 1
                          ? "file"
                          : "files"}{" "}
                        marked for removal
                      </p>

                      <p className="text-xs leading-relaxed text-muted-foreground">
                        These files will only be removed when you
                        successfully save the draft.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <Paperclip className="mt-0.5 size-3.5 shrink-0" />

                New evidence uploads and existing evidence removals
                are submitted together with the draft through one
                API request.
              </p>
            </section>

            {/* ---------------------------- Financial control ---------------------------- */}

            <section className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />

              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Saving does not submit
                </p>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  A draft stores your period, notes and evidence.
                  When you submit, the server calculates expected
                  cash from eligible completed cash payments.
                  Evidence stays linked to this reconciliation
                  for audit.
                </p>
              </div>
            </section>
          </div>

          {/* ------------------------------ Footer ------------------------------ */}

          <SheetFooter className="sticky bottom-0 gap-2 border-t bg-background/95 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isBusy}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isBusy || hasInvalidRange}
              className="min-w-40"
            >
              {isBusy ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 size-4" />
              )}

              {submitLabel}
            </Button>
          </SheetFooter>
        </form>

        {/* ------------------------------ Local file preview ------------------------------ */}

        <FilePreviewDialog
          files={pendingFiles}
          index={previewIndex}
          onIndexChange={setPreviewIndex}
          onClose={() => setPreviewIndex(null)}
          onRemove={removePendingFile}
          disabled={isBusy}
        />
      </SheetContent>
    </Sheet>
  );
}