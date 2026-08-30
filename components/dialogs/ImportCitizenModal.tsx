"use client";

import { useCallback, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Users,
  CheckCircle2,
  X,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  PartyPopper,
} from "lucide-react";

/* ============================================================
   CONSTANTS
============================================================ */

const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const MAX_FILE_SIZE_MB = 10;
const MAX_ROWS = 10_000;

type Step = "upload" | "review" | "importing" | "done";

interface ValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: { row: number; reason: string }[];
}

/* ============================================================
   MOCK API — swap these for real endpoints
============================================================ */

async function validateFile(file: File): Promise<ValidationResult> {
  // Replace with: const res = await fetch("/api/citizens/import/validate", { method: "POST", body: form });
  await new Promise((r) => setTimeout(r, 900));
  const totalRows = Math.floor(120 + Math.random() * 400);
  const errorRows = Array.from({ length: Math.floor(Math.random() * 4) }, (_, i) => ({
    row: 12 + i * 7,
    reason: i % 2 === 0 ? "Missing national ID" : "Invalid phone number format",
  }));
  return { totalRows, validRows: totalRows - errorRows.length, errorRows };
}

async function importFile(
  file: File,
  onProgress: (pct: number) => void
): Promise<{ imported: number }> {
  // Replace with: real upload with progress (e.g. axios onUploadProgress) or chunked import polling.
  for (let pct = 0; pct <= 100; pct += 10) {
    await new Promise((r) => setTimeout(r, 120));
    onProgress(pct);
  }
  return { imported: 0 };
}

/* ============================================================
   HELPERS
============================================================ */

function getExtension(name: string) {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx).toLowerCase();
}

function formatFileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/* ============================================================
   STEPPER
============================================================ */

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "review", label: "Review" },
  { key: "importing", label: "Import" },
  { key: "done", label: "Done" },
];

function Stepper({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "active" : "upcoming";
        return (
          <div key={step.key} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  state === "done"
                    ? "bg-primary text-primary-foreground"
                    : state === "active"
                    ? "border-2 border-primary text-primary"
                    : "border border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {state === "done" ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`hidden text-xs font-medium sm:inline ${
                  state === "upcoming" ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px flex-1 ${i < currentIndex ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   MODAL
============================================================ */

export function ImportCitizenModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const [progress, setProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  const resetAll = useCallback(() => {
    setStep("upload");
    setFile(null);
    setFileError(null);
    setValidating(false);
    setValidation(null);
    setProgress(0);
    setImportedCount(0);
  }, []);

  const handleOpenChange = (next: boolean) => {
    // Block closing mid-import so an in-flight upload isn't abandoned silently.
    if (!next && step === "importing") return;
    if (!next) resetAll();
    setOpen(next);
  };

  const handleFile = useCallback((selected: File | undefined) => {
    if (!selected) return;
    setFileError(null);

    const ext = getExtension(selected.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(`Unsupported file type "${ext || "unknown"}". Please upload a .csv or .xlsx file.`);
      return;
    }

    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    setFile(selected);
  }, []);

  const handleContinueToReview = async () => {
    if (!file) return;
    setStep("review");
    setValidating(true);
    setValidation(null);

    try {
      const result = await validateFile(file);
      setValidation(result);
    } catch {
      setFileError("Couldn't validate this file. Please check the format and try again.");
      setStep("upload");
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file || !validation) return;
    setStep("importing");
    setProgress(0);

    const { imported } = await importFile(file, setProgress);
    setImportedCount(imported || validation.validRows);
    setStep("done");
  };

  const handleBackToUpload = () => {
    setStep("upload");
    setValidation(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 py-4">
          <Users className="h-4 w-4" />
          Import Citizens
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <UploadCloud className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Import Citizen Records</DialogTitle>
              <DialogDescription>Upload citizen data from Excel or CSV files.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2">
          <Stepper current={step} />
        </div>

        {/* ---------------- STEP 1: UPLOAD ---------------- */}
        {step === "upload" && (
          <div className="space-y-5">
            <div className="rounded-xl border bg-muted/40 p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <span className="font-medium">Supported Import File</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Excel (.xlsx)</Badge>
                <Badge variant="secondary">CSV (.csv)</Badge>
                <Badge variant="secondary">Max {MAX_ROWS.toLocaleString()} rows</Badge>
                <Badge variant="secondary">Max {MAX_FILE_SIZE_MB} MB</Badge>
              </div>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleFile(e.dataTransfer.files[0]);
              }}
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition ${
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30"
              }`}
            >
              <UploadCloud className="mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-sm font-medium">Drag and drop your file here</p>
              <p className="mt-1 text-xs text-muted-foreground">or click below to browse</p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            {fileError && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {fileError}
              </div>
            )}

            {file && !fileError && (
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button variant="outline" className="w-full gap-2">
              <Download className="h-4 w-4" />
              Download Citizen Import Template
            </Button>
          </div>
        )}

        {/* ---------------- STEP 2: REVIEW & VALIDATE ---------------- */}
        {step === "review" && (
          <div className="space-y-5">
            {validating ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Validating {file?.name}…</p>
                <p className="text-xs text-muted-foreground">Checking formatting, required fields, and duplicates.</p>
              </div>
            ) : validation ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-muted-foreground">Ready to import</p>
                    <p className="mt-1 text-2xl font-bold text-green-700">{validation.validRows}</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-muted-foreground">Rows with errors</p>
                    <p className={`mt-1 text-2xl font-bold ${validation.errorRows.length ? "text-destructive" : ""}`}>
                      {validation.errorRows.length}
                    </p>
                  </div>
                </div>

                {validation.errorRows.length > 0 && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5">
                    <div className="flex items-center justify-between border-b border-destructive/20 px-4 py-2.5">
                      <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        Rows that will be skipped
                      </div>
                      <button className="text-xs font-medium text-destructive underline underline-offset-2">
                        Download error report
                      </button>
                    </div>
                    <ul className="max-h-32 divide-y divide-destructive/10 overflow-y-auto">
                      {validation.errorRows.map((err) => (
                        <li key={err.row} className="flex justify-between px-4 py-2 text-xs">
                          <span className="text-muted-foreground">Row {err.row}</span>
                          <span className="text-destructive">{err.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Valid rows will be imported; rows with errors will be skipped and can be fixed and re-uploaded separately.
                </p>
              </>
            ) : null}
          </div>
        )}

        {/* ---------------- STEP 3: IMPORTING ---------------- */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="w-full space-y-2">
              <p className="text-sm font-medium">Importing citizen records…</p>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">{progress}% complete — please don't close this window.</p>
            </div>
          </div>
        )}

        {/* ---------------- STEP 4: DONE ---------------- */}
        {step === "done" && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <PartyPopper className="h-7 w-7 text-green-700" />
            </div>
            <p className="text-lg font-semibold">Import complete</p>
            <p className="text-sm text-muted-foreground">
              {importedCount} citizen{importedCount === 1 ? "" : "s"} imported successfully.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {step === "review" && !validating ? (
            <Button variant="ghost" onClick={handleBackToUpload} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Choose a different file
            </Button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            {step === "upload" && (
              <Button disabled={!file || !!fileError} onClick={handleContinueToReview} className="gap-2">
                Continue
              </Button>
            )}

            {step === "review" && !validating && validation && (
              <Button disabled={validation.validRows === 0} onClick={handleImport} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Import {validation.validRows} record{validation.validRows === 1 ? "" : "s"}
              </Button>
            )}

            {step === "done" && (
              <Button onClick={() => handleOpenChange(false)} className="gap-2">
                Done
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}