
"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  FileArchive,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  MOBILE_APP_TYPES,
  type MobileAppType,
  type CreateMobileAppReleasePayload,
  type UpdateMobileAppReleasePayload,
} from "@/types/mobile-app-release";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ReleaseFormValues = {
  appType: MobileAppType | "";
  versionName: string;
  versionCode: string;
  releaseNotes: string;
  isMandatory: boolean;
};

export type ReleaseFormSubmit = ReleaseFormValues & {
  /** New APK selected by the user. Null means keep the current APK in edit mode. */
  apkFile: File | null;
};

type ExistingApk = {
  name: string;
  sizeLabel?: string;
};

type ReleaseFormProps = {
  mode: "create" | "edit";
  initialValues?: Partial<ReleaseFormValues>;
  existingApk?: ExistingApk;
  isSubmitting?: boolean;
  cancelHref: string;
  onSubmit: (values: ReleaseFormSubmit) => void | Promise<void>;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const MAX_APK_SIZE = 200 * 1024 * 1024;
const MAX_NOTES_LENGTH = 5000;

const EMPTY_VALUES: ReleaseFormValues = {
  appType: "",
  versionName: "",
  versionCode: "",
  releaseNotes: "",
  isMandatory: false,
};

function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAppTypeLabel(appType: MobileAppType | ""): string {
  return (
    MOBILE_APP_TYPES.find((item) => item.value === appType)?.label ??
    "Unknown application"
  );
}

function validateApk(file: File): string {
  if (!file.name.toLowerCase().endsWith(".apk")) {
    return "Choose a file that ends in .apk.";
  }

  if (file.size <= 0) {
    return "This file is empty.";
  }

  if (file.size > MAX_APK_SIZE) {
    return "The APK must be 200 MB or smaller.";
  }

  return "";
}

/**
 * Payload for the update mutation.
 *
 * app_type is intentionally excluded because the backend
 * does not allow changing the application type after creation.
 */
export function toUpdatePayload(
  values: ReleaseFormSubmit,
): UpdateMobileAppReleasePayload {
  return {
    version_name: values.versionName.trim(),
    version_code: Number(values.versionCode),
    release_notes: values.releaseNotes.trim() || null,
    is_mandatory: values.isMandatory,
    ...(values.apkFile ? { apk: values.apkFile } : {}),
  };
}

/**
 * Payload for the create mutation.
 *
 * Application type and APK are required.
 */
export function toCreatePayload(
  values: ReleaseFormSubmit,
): CreateMobileAppReleasePayload {
  if (!values.appType) {
    throw new Error("Select a mobile application.");
  }

  if (!values.apkFile) {
    throw new Error("Upload an APK file.");
  }

  return {
    app_type: values.appType,
    version_name: values.versionName.trim(),
    version_code: Number(values.versionCode),
    release_notes: values.releaseNotes.trim() || null,
    is_mandatory: values.isMandatory,
    apk: values.apkFile,
  };
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function ReleaseForm({
  mode,
  initialValues,
  existingApk,
  isSubmitting = false,
  cancelHref,
  onSubmit,
}: ReleaseFormProps) {
  const isEdit = mode === "edit";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [initial] = useState<ReleaseFormValues>({
    ...EMPTY_VALUES,
    ...initialValues,
  });

  const [values, setValues] = useState<ReleaseFormValues>(initial);
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [apkError, setApkError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  function setField<K extends keyof ReleaseFormValues>(
    key: K,
    value: ReleaseFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  const codeNumber = Number(values.versionCode);

  const isCodeValid =
    Number.isInteger(codeNumber) && codeNumber > 0;

  const hasApk =
    apkFile !== null || (isEdit && Boolean(existingApk));

  const isDirty =
    apkFile !== null ||
    values.appType !== initial.appType ||
    values.versionName !== initial.versionName ||
    values.versionCode !== initial.versionCode ||
    values.releaseNotes !== initial.releaseNotes ||
    values.isMandatory !== initial.isMandatory;

  const canSubmit =
    Boolean(values.appType) &&
    values.versionName.trim().length > 0 &&
    isCodeValid &&
    hasApk &&
    !apkError &&
    !isSubmitting &&
    (!isEdit || isDirty);

  /* ------------------------------------------------------------------------ */
  /* APK                                                                      */
  /* ------------------------------------------------------------------------ */

  function selectApk(file: File | null) {
    if (!file) return;

    const error = validateApk(file);

    setApkError(error);
    setApkFile(error ? null : file);

    if (error && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearApk() {
    setApkFile(null);
    setApkError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    selectApk(event.dataTransfer.files?.[0] ?? null);
  }

  /* ------------------------------------------------------------------------ */
  /* Submit                                                                   */
  /* ------------------------------------------------------------------------ */

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) return;

    void onSubmit({
      ...values,
      apkFile,
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Display                                                                  */
  /* ------------------------------------------------------------------------ */

  const shownApk: ExistingApk | null = apkFile
    ? {
        name: apkFile.name,
        sizeLabel: formatFileSize(apkFile.size),
      }
    : isEdit && existingApk
      ? existingApk
      : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border bg-card p-5 sm:p-6"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Application Type                                                   */}
      {/* ------------------------------------------------------------------ */}

      <div className="space-y-2">
        <Label htmlFor="appType">
          Mobile application <span className="text-destructive">*</span>
        </Label>

        <Select
          value={values.appType}
          onValueChange={(value) =>
            setField("appType", value as MobileAppType)
          }
          disabled={isEdit || isSubmitting}
        >
          <SelectTrigger id="appType" className="w-full">
            <SelectValue placeholder="Select mobile application" />
          </SelectTrigger>

          <SelectContent>
            {MOBILE_APP_TYPES.map((app) => (
              <SelectItem key={app.value} value={app.value}>
                {app.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="text-xs text-muted-foreground">
          {isEdit
            ? `This release belongs to ${getAppTypeLabel(values.appType)}. Application type cannot be changed.`
            : "Select which mobile application will receive this release."}
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Version                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="versionName">
            Version name <span className="text-destructive">*</span>
          </Label>

          <Input
            id="versionName"
            value={values.versionName}
            onChange={(e) =>
              setField("versionName", e.target.value)
            }
            placeholder="1.2.0"
            maxLength={50}
            autoComplete="off"
            required
            disabled={isSubmitting}
          />

          <p className="text-xs text-muted-foreground">
            The version users see.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="versionCode">
            Version code <span className="text-destructive">*</span>
          </Label>

          <Input
            id="versionCode"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={values.versionCode}
            onChange={(e) =>
              setField("versionCode", e.target.value)
            }
            placeholder="12"
            aria-invalid={
              Boolean(values.versionCode) && !isCodeValid
            }
            required
            disabled={isSubmitting}
          />

          <p
            className={`text-xs ${
              values.versionCode && !isCodeValid
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {values.versionCode && !isCodeValid
              ? "Enter a whole number greater than 0."
              : "A whole number that increases with every release."}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* APK Upload                                                          */}
      {/* ------------------------------------------------------------------ */}

      <div className="space-y-2">
        <Label htmlFor="apkFile">
          APK file{" "}
          {!isEdit && (
            <span className="text-destructive">*</span>
          )}
        </Label>

        {shownApk ? (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
              <FileArchive className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-medium"
                title={shownApk.name}
              >
                {shownApk.name}
              </p>

              <p className="text-xs text-muted-foreground">
                {apkFile
                  ? "New file · "
                  : isEdit
                    ? "Current file · "
                    : ""}
                {shownApk.sizeLabel ?? "—"}
              </p>
            </div>

            {apkFile ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={clearApk}
                disabled={isSubmitting}
                aria-label={
                  isEdit ? "Keep current APK" : "Remove APK"
                }
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
              >
                Replace
              </Button>
            )}
          </div>
        ) : (
          <label
            htmlFor="apkFile"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors focus-within:ring-2 focus-within:ring-ring ${
              apkError
                ? "border-destructive/60 bg-destructive/5"
                : isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
            } ${isSubmitting ? "pointer-events-none opacity-60" : ""}`}
          >
            <UploadCloud className="h-6 w-6 text-muted-foreground" />

            <p className="text-sm font-medium">
              Drop your APK here, or click to browse
            </p>

            <p className="text-xs text-muted-foreground">
              .apk files up to 200 MB
            </p>
          </label>
        )}

        <input
          ref={fileInputRef}
          id="apkFile"
          type="file"
          accept=".apk,application/vnd.android.package-archive"
          className="sr-only"
          disabled={isSubmitting}
          onChange={(e) =>
            selectApk(e.target.files?.[0] ?? null)
          }
        />

        {apkError && (
          <p
            className="flex items-center gap-1.5 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {apkError}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Release Notes                                                       */}
      {/* ------------------------------------------------------------------ */}

      <div className="space-y-2">
        <Label htmlFor="releaseNotes">Release notes</Label>

        <Textarea
          id="releaseNotes"
          value={values.releaseNotes}
          onChange={(e) =>
            setField("releaseNotes", e.target.value)
          }
          placeholder="What's new in this version?"
          rows={5}
          maxLength={MAX_NOTES_LENGTH}
          className="resize-y"
          disabled={isSubmitting}
        />

        <p className="text-right text-xs tabular-nums text-muted-foreground">
          {values.releaseNotes.length.toLocaleString()} /{" "}
          {MAX_NOTES_LENGTH.toLocaleString()}
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Update Policy                                                       */}
      {/* ------------------------------------------------------------------ */}

      <label
        htmlFor="isMandatory"
        className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/30"
      >
        <input
          id="isMandatory"
          type="checkbox"
          checked={values.isMandatory}
          onChange={(e) =>
            setField("isMandatory", e.target.checked)
          }
          disabled={isSubmitting}
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        />

        <div className="space-y-0.5">
          <p className="text-sm font-medium">
            Require this update
          </p>

          <p className="text-sm text-muted-foreground">
            The app will ask users to update before they continue.
          </p>
        </div>
      </label>

      {/* ------------------------------------------------------------------ */}
      {/* Actions                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button
          asChild
          variant="outline"
          disabled={isSubmitting}
        >
          <Link href={cancelHref}>Cancel</Link>
        </Button>

        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}

          {isSubmitting
            ? isEdit
              ? "Saving…"
              : "Creating…"
            : isEdit
              ? "Save changes"
              : "Create release"}
        </Button>
      </div>
    </form>
  );
}
