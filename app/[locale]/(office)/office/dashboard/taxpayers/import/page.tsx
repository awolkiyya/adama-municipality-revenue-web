"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  X,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  PartyPopper,
  RotateCcw,
} from "lucide-react";

import { useImportCitizens } from "@/hooks/useCitizen.hook";

/* ============================================================
   CONSTANTS
============================================================ */

const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

const MAX_FILE_SIZE_MB = 10;

const MAX_ROWS = 10_000;

type Step =
  | "upload"
  | "importing"
  | "done"
  | "error";

const TEMPLATE_HEADERS = [
  "Full Name",
  "National ID",
  "Phone Number",
  "Gender",
];

/* ============================================================
   HELPERS
============================================================ */

function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");

  return idx === -1
    ? ""
    : name.slice(idx).toLowerCase();
}

function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function downloadTemplate(): void {
  const worksheet =
    XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
    ]);

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Citizens"
  );

  XLSX.writeFile(
    workbook,
    "citizen-import-template.xlsx"
  );
}

/* ============================================================
   STEPPER
============================================================ */

const STEPPER_NODES: {
  key: Step;
  label: string;
  description: string;
}[] = [
  {
    key: "upload",
    label: "Select File",
    description: "Choose a file",
  },
  {
    key: "importing",
    label: "Send File",
    description: "Upload & process",
  },
  {
    key: "done",
    label: "Completed",
    description: "Confirmation",
  },
];

function stepperIndexFor(
  step: Step
): number {
  if (step === "error") {
    return 1;
  }

  return STEPPER_NODES.findIndex(
    (node) => node.key === step
  );
}

function Stepper({
  current,
}: {
  current: Step;
}) {
  const currentIndex =
    stepperIndexFor(current);

  const hasError =
    current === "error";

  return (
    <div className="flex items-start">
      {STEPPER_NODES.map(
        (node, index) => {
          const isCurrent =
            index === currentIndex;

          const state =
            index < currentIndex
              ? "done"
              : isCurrent
                ? "active"
                : "upcoming";

          const showError =
            isCurrent && hasError;

          return (
            <div
              key={node.key}
              className="flex flex-1 items-start last:flex-none"
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    showError
                      ? "border-2 border-destructive bg-destructive/10 text-destructive"
                      : state === "done"
                        ? "bg-primary text-primary-foreground"
                        : state === "active"
                          ? "border-2 border-primary bg-background text-primary"
                          : "border border-muted-foreground/30 bg-background text-muted-foreground"
                  }`}
                >
                  {showError ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : state === "done" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>

                <div className="text-center">
                  <p
                    className={`text-sm font-medium ${
                      state === "upcoming"
                        ? "text-muted-foreground"
                        : showError
                          ? "text-destructive"
                          : ""
                    }`}
                  >
                    {showError
                      ? "Import failed"
                      : node.label}
                  </p>

                  <p className="hidden text-xs text-muted-foreground sm:block">
                    {node.description}
                  </p>
                </div>
              </div>

              {index <
                STEPPER_NODES.length -
                  1 && (
                <div
                  className={`mt-4 h-px flex-1 ${
                    index < currentIndex
                      ? "bg-primary"
                      : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        }
      )}
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function ImportCitizensPage() {
  const router =
    useRouter();

  const importCitizensMutation =
    useImportCitizens();

  /* ==========================================================
     STEP
  ========================================================== */

  const [step, setStep] =
    useState<Step>("upload");

  /* ==========================================================
     FILE
  ========================================================== */

  const [file, setFile] =
    useState<File | null>(null);

  const [fileError, setFileError] =
    useState<string | null>(null);

  const [dragActive, setDragActive] =
    useState(false);

  /* ==========================================================
     IMPORT STATE
  ========================================================== */

  const [progress, setProgress] =
    useState(0);

  const [importedCount, setImportedCount] =
    useState(0);

  /**
   * IMPORTANT:
   *
   * Backend result contains:
   *
   * {
   *   imported: number;
   *   failed: number;
   *   errors?: unknown[];
   * }
   *
   * There is NO `skipped` property.
   *
   * Therefore this state represents failed rows.
   */
  const [failedCount, setFailedCount] =
    useState(0);

  const [importError, setImportError] =
    useState<string | null>(null);

  const inputRef =
    useRef<HTMLInputElement>(null);

  /* ==========================================================
     FILE VALIDATION
  ========================================================== */

  const handleFile = useCallback(
    (selected: File | undefined) => {
      if (!selected) {
        return;
      }

      setFileError(null);

      const extension =
        getExtension(
          selected.name
        );

      if (
        !ALLOWED_EXTENSIONS.includes(
          extension
        )
      ) {
        setFileError(
          `Unsupported file type "${
            extension || "unknown"
          }". Please upload a .csv or .xlsx file.`
        );

        setFile(null);

        return;
      }

      if (
        selected.size >
        MAX_FILE_SIZE_MB *
          1024 *
          1024
      ) {
        setFileError(
          `File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`
        );

        setFile(null);

        return;
      }

      setFile(selected);
    },
    []
  );

  /* ==========================================================
     IMPORT
  ========================================================== */

  const handleImport =
    useCallback(() => {
      if (!file) {
        return;
      }

      setStep("importing");

      setProgress(0);

      setImportError(null);

      setImportedCount(0);

      setFailedCount(0);

      importCitizensMutation.mutate(
        {
          file,
          onProgress: setProgress,
        },
        {
          onSuccess: (result) => {
            setProgress(100);

            /*
             * Current mutation contract:
             *
             * result.data = {
             *   imported: number,
             *   failed: number,
             *   errors?: unknown[]
             * }
             */

            setImportedCount(
              result?.data?.imported ??
                0
            );

            setFailedCount(
              result?.data?.failed ??
                0
            );

            setStep("done");
          },

          onError: (error) => {
            setImportError(
              error instanceof Error
                ? error.message
                : "Something went wrong while importing this file. Please try again."
            );

            setStep("error");
          },
        }
      );
    }, [
      file,
      importCitizensMutation,
    ]);

  /* ==========================================================
     RETRY
  ========================================================== */

  const handleRetry =
    () => {
      handleImport();
    };

  /* ==========================================================
     CHOOSE DIFFERENT FILE
  ========================================================== */

  const handleChooseDifferentFile =
    () => {
      setFile(null);

      setFileError(null);

      setImportError(null);

      setImportedCount(0);

      setFailedCount(0);

      setProgress(0);

      setStep("upload");

      /*
       * Reset the native file input as well.
       * This allows selecting the same file again.
       */
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    };

  /* ==========================================================
     EXIT
  ========================================================== */

  const handleExit =
    () => {
      router.push(
        "/office/dashboard/taxpayers"
      );
    };

  const canLeave =
    step !== "importing";

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="space-y-4">
        <button
          type="button"
          onClick={
            canLeave
              ? handleExit
              : undefined
          }
          disabled={!canLeave}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Citizens
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <UploadCloud className="h-6 w-6 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Import Citizen Records
            </h1>

            <p className="text-sm text-muted-foreground">
              Upload citizen data from an
              Excel or CSV file.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          STEPPER
      ======================================================== */}

      <Card>
        <CardContent className="py-6">
          <Stepper current={step} />
        </CardContent>
      </Card>

      {/* ========================================================
          STEP CONTENT
      ======================================================== */}

      <Card>
        <CardContent className="space-y-5 p-0 py-6 sm:px-6">
          {/* ====================================================
              STEP 1 — SELECT FILE
          ==================================================== */}

          {step === "upload" && (
            <div className="space-y-5 px-6 sm:px-0">
              {/* Supported format information */}

              <div className="rounded-xl border bg-muted/40 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />

                  <span className="font-medium">
                    Supported Import File
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    Excel (.xlsx)
                  </Badge>

                  <Badge variant="secondary">
                    CSV (.csv)
                  </Badge>

                  <Badge variant="secondary">
                    Max{" "}
                    {MAX_ROWS.toLocaleString()}{" "}
                    rows
                  </Badge>

                  <Badge variant="secondary">
                    Max{" "}
                    {MAX_FILE_SIZE_MB} MB
                  </Badge>
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  Expected columns: Full
                  Name, National ID, Phone
                  Number, Gender (column
                  order and exact
                  capitalization don&apos;t
                  matter). Rows are checked
                  and matched automatically
                  once uploaded.
                </p>
              </div>

              {/* File drop zone */}

              <div
                onDragOver={(event) => {
                  event.preventDefault();

                  setDragActive(true);
                }}
                onDragLeave={() => {
                  setDragActive(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();

                  setDragActive(false);

                  handleFile(
                    event.dataTransfer
                      .files[0]
                  );
                }}
                className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30"
                }`}
              >
                <UploadCloud className="mb-3 h-14 w-14 text-muted-foreground" />

                <p className="text-sm font-medium">
                  Drag and drop your file
                  here
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  or click below to browse
                </p>

                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(event) =>
                    handleFile(
                      event.target.files?.[0]
                    )
                  }
                />
              </div>

              {/* File validation error */}

              {fileError && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

                  <span>
                    {fileError}
                  </span>
                </div>
              )}

              {/* Selected file */}

              {file &&
                !fileError && (
                  <div className="flex items-center justify-between rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-green-100 p-2">
                        <FileSpreadsheet className="h-5 w-5 text-green-700" />
                      </div>

                      <div>
                        <p className="text-sm font-medium">
                          {file.name}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(
                            file.size
                          )}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setFile(null);

                        if (
                          inputRef.current
                        ) {
                          inputRef.current.value =
                            "";
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

              {/* Template */}

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 sm:w-auto"
                onClick={
                  downloadTemplate
                }
              >
                <Download className="h-4 w-4" />

                Download Citizen Import
                Template
              </Button>
            </div>
          )}

          {/* ====================================================
              STEP 2 — IMPORTING
          ==================================================== */}

          {step === "importing" && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />

              <div className="w-full max-w-sm space-y-2">
                <p className="text-sm font-medium">
                  Uploading{" "}
                  {file?.name}…
                </p>

                <Progress
                  value={progress}
                  className="h-2"
                />

                <p className="text-xs text-muted-foreground">
                  {progress}% complete —
                  please don&apos;t close
                  this window.
                </p>
              </div>
            </div>
          )}

          {/* ====================================================
              STEP 3 — COMPLETED
          ==================================================== */}

          {step === "done" && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <PartyPopper className="h-7 w-7 text-green-700" />
              </div>

              <p className="text-lg font-semibold">
                Import complete
              </p>

              <p className="text-sm text-muted-foreground">
                {importedCount} citizen
                {importedCount === 1
                  ? ""
                  : "s"}{" "}
                imported successfully.
              </p>

              {/* Failed rows */}

              {failedCount > 0 && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />

                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    {failedCount} row
                    {failedCount === 1
                      ? ""
                      : "s"}{" "}
                    failed to import.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ====================================================
              ERROR
          ==================================================== */}

          {step === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center sm:px-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-7 w-7 text-destructive" />
              </div>

              <p className="text-lg font-semibold">
                Import didn&apos;t go through
              </p>

              <p className="max-w-sm text-sm text-muted-foreground">
                {importError}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================
          ACTIONS
      ======================================================== */}

      <div className="flex items-center justify-between">
        {/* Left action */}

        {step === "error" ? (
          <Button
            type="button"
            variant="ghost"
            onClick={
              handleChooseDifferentFile
            }
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />

            Choose a different file
          </Button>
        ) : (
          <span />
        )}

        {/* Right actions */}

        <div className="flex gap-2">
          {/* Upload */}

          {step === "upload" && (
            <Button
              type="button"
              disabled={
                !file ||
                !!fileError ||
                importCitizensMutation.isPending
              }
              onClick={
                handleImport
              }
              className="gap-2"
            >
              {importCitizensMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  Importing...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />

                  Upload & Import
                </>
              )}
            </Button>
          )}

          {/* Retry */}

          {step === "error" && (
            <Button
              type="button"
              onClick={
                handleRetry
              }
              disabled={
                importCitizensMutation.isPending
              }
              className="gap-2"
            >
              {importCitizensMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  Retrying...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />

                  Try again
                </>
              )}
            </Button>
          )}

          {/* Done */}

          {step === "done" && (
            <Button
              type="button"
              onClick={
                handleExit
              }
              className="gap-2"
            >
              Go to Citizens
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}