
"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileArchive,
  FileCheck2,
  Info,
  Package,
  Save,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const MAX_APK_SIZE = 200 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function CreateMobileAppReleasePage() {
  const router = useRouter();
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const basePath = `/${locale}/office/dashboard/mobile-app-releases`;

  const [versionName, setVersionName] = useState("");
  const [versionCode, setVersionCode] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [isMandatory, setIsMandatory] = useState(false);
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [apkError, setApkError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const releaseNotesCount = useMemo(
    () => releaseNotes.length,
    [releaseNotes],
  );

  const canSubmit =
    versionName.trim().length > 0 &&
    versionCode.trim().length > 0 &&
    Number.isInteger(Number(versionCode)) &&
    Number(versionCode) > 0 &&
    apkFile !== null &&
    !apkError &&
    !isSubmitting;

  function handleApkChange(file: File | null) {
    setApkError("");

    if (!file) {
      setApkFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".apk")) {
      setApkFile(null);
      setApkError("Please select an Android APK file ending in .apk.");
      return;
    }

    if (file.size <= 0) {
      setApkFile(null);
      setApkError("The selected APK file is empty.");
      return;
    }

    if (file.size > MAX_APK_SIZE) {
      setApkFile(null);
      setApkError("The APK exceeds the maximum allowed size of 200 MB.");
      return;
    }

    setApkFile(file);
  }

  function removeApk() {
    setApkFile(null);
    setApkError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function resetForm() {
    setVersionName("");
    setVersionCode("");
    setReleaseNotes("");
    setIsMandatory(false);
    setApkFile(null);
    setApkError("");
    setShowPreview(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!versionName.trim()) {
      toast.error("Enter the release version name.");
      return;
    }

    if (
      !versionCode.trim() ||
      !Number.isInteger(Number(versionCode)) ||
      Number(versionCode) <= 0
    ) {
      toast.error("Enter a valid positive version code.");
      return;
    }

    if (!apkFile) {
      toast.error("Upload the APK file before creating the release.");
      return;
    }

    if (apkError) {
      toast.error(apkError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock only: no API request or database write occurs here.
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success("Mock release validated successfully.", {
        description:
          "No release was saved. Connect this form to your Laravel API to persist the release.",
        duration: 5000,
      });

      setShowPreview(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mt-1 shrink-0"
            onClick={() => router.push(basePath)}
            aria-label="Back to mobile app releases"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Create Mobile App Release
              </h1>
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Mock Mode
              </span>
            </div>

            <p className="text-sm text-muted-foreground sm:text-base">
              Upload an Android APK and configure the next mobile app release.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(basePath)}
        >
          Cancel
        </Button>
      </div>

      {/* Mock mode notice */}
      <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
        <Info className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-1 text-sm">
          <p className="font-semibold">Demo form — no data is saved</p>
          <p className="text-blue-900/80 dark:text-blue-200/80">
            This page validates your input locally. APK upload, release creation,
            and publication will require connection to the Laravel API.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Main form */}
          <div className="space-y-6">
            {/* Version details */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <CardTitle>Release Information</CardTitle>
                    <CardDescription className="mt-1">
                      Define the version that users will see in the app.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="versionName">
                      Version Name <span className="text-destructive">*</span>
                    </Label>

                    <Input
                      id="versionName"
                      value={versionName}
                      onChange={(event) =>
                        setVersionName(event.target.value)
                      }
                      placeholder="e.g. 1.2.0"
                      maxLength={50}
                      required
                    />

                    <p className="text-xs text-muted-foreground">
                      Human-readable version shown to users.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="versionCode">
                      Version Code <span className="text-destructive">*</span>
                    </Label>

                    <Input
                      id="versionCode"
                      type="number"
                      min={1}
                      step={1}
                      value={versionCode}
                      onChange={(event) =>
                        setVersionCode(event.target.value)
                      }
                      placeholder="e.g. 12"
                      required
                    />

                    <p className="text-xs text-muted-foreground">
                      Positive integer used to identify the release.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="releaseNotes">Release Notes</Label>

                  <Textarea
                    id="releaseNotes"
                    value={releaseNotes}
                    onChange={(event) =>
                      setReleaseNotes(event.target.value)
                    }
                    placeholder={
                      "What's new in this release?\n\n• Improved performance\n• Fixed reported issues\n• Updated application features"
                    }
                    rows={6}
                    maxLength={5000}
                    className="resize-y"
                  />

                  <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                    <span>
                      Describe new features, fixes, and improvements.
                    </span>
                    <span className="shrink-0">
                      {releaseNotesCount.toLocaleString()} / 5,000
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* APK upload */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <UploadCloud className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <CardTitle>Android APK File</CardTitle>
                    <CardDescription className="mt-1">
                      Select the application package for this release.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {!apkFile ? (
                  <div
                    className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors sm:p-10 ${
                      apkError
                        ? "border-destructive/60 bg-destructive/5"
                        : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <FileArchive className="h-7 w-7 text-muted-foreground" />
                    </div>

                    <div className="mt-4 space-y-1">
                      <p className="font-semibold">
                        Upload your APK package
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Select an .apk file from your computer.
                      </p>
                    </div>

                    <div className="mt-5">
                      <Input
                        ref={fileInputRef}
                        id="apkFile"
                        type="file"
                        accept=".apk,application/vnd.android.package-archive"
                        className="mx-auto max-w-md cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
                        onChange={(event) =>
                          handleApkChange(
                            event.target.files?.[0] ?? null,
                          )
                        }
                      />
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground">
                      APK format only · Maximum file size: 200 MB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <FileCheck2 className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-all font-medium">{apkFile.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatFileSize(apkFile.size)} · APK file selected
                      </p>

                      <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        File extension and size checks passed
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeApk}
                      className="shrink-0"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                )}

                {apkError && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{apkError}</p>
                  </div>
                )}

                <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    This browser check verifies only the file extension and
                    size. The server must independently validate and securely
                    store the uploaded APK before making it available to users.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Update policy */}
            <Card>
              <CardHeader>
                <CardTitle>Update Policy</CardTitle>
                <CardDescription>
                  Configure how the app should treat this release.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <label
                  htmlFor="isMandatory"
                  className="flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/30"
                >
                  <input
                    id="isMandatory"
                    type="checkbox"
                    checked={isMandatory}
                    onChange={(event) =>
                      setIsMandatory(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-primary"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">Mandatory Update</p>

                      {isMandatory && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Enabled
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Mark this release as required. The client application
                      must enforce the update policy when it checks release
                      information.
                    </p>
                  </div>
                </label>

                <p className="mt-3 text-xs text-muted-foreground">
                  Selecting this option alone does not force an update. Your
                  mobile app must implement the mandatory-update behavior.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Release Summary</CardTitle>
                <CardDescription>
                  Review the release before submitting.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    Version name
                  </span>
                  <span className="max-w-[55%] break-all text-right text-sm font-medium">
                    {versionName.trim() || "Not set"}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    Version code
                  </span>
                  <span className="text-sm font-medium">
                    {versionCode || "Not set"}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">APK</span>
                  <span className="text-sm font-medium">
                    {apkFile ? "Selected" : "Not uploaded"}
                  </span>
                </div>

                {apkFile && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Package size
                      </p>
                      <p className="text-sm font-medium">
                        {formatFileSize(apkFile.size)}
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    Update policy
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      isMandatory
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isMandatory ? "Mandatory" : "Optional"}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    Initial status
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Draft
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Before You Publish</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Use the correct version name and code.</span>
                </div>

                <div className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Upload the intended production APK.</span>
                </div>

                <div className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Document important changes in release notes.</span>
                </div>

                <div className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Confirm whether the update should be mandatory.</span>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Info className="h-4 w-4 text-muted-foreground" />
                Publication workflow
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                A new release should start as a draft. Validate the APK and
                release metadata before publishing it as the latest version.
              </p>
            </div>
          </aside>
        </div>

        {/* Bottom actions */}
        <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">*</span> Required fields
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                Reset Form
              </Button>

              <Button
                type="submit"
                disabled={!canSubmit}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Validating..." : "Validate Mock Release"}
              </Button>
            </div>
          </div>
        </div>

        {/* Mock validation result */}
        {showPreview && (
          <Card className="border-emerald-300 dark:border-emerald-900">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <h2 className="font-semibold">Mock validation complete</h2>
                <p className="text-sm text-muted-foreground">
                  The form passed its local checks. This is only a preview;
                  the release and APK have not been saved or uploaded.
                </p>

                <div className="rounded-md bg-muted/50 p-3 text-sm">
                  <p>
                    <span className="text-muted-foreground">Release:</span>{" "}
                    <strong>{versionName}</strong> (code {versionCode})
                  </p>
                  <p className="mt-1 break-all">
                    <span className="text-muted-foreground">APK:</span>{" "}
                    {apkFile?.name}
                  </p>
                  <p className="mt-1">
                    <span className="text-muted-foreground">Size:</span>{" "}
                    {apkFile ? formatFileSize(apkFile.size) : "—"}
                  </p>
                  <p className="mt-1">
                    <span className="text-muted-foreground">
                      Validated on:
                    </span>{" "}
                    {formatDate(new Date())}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  To persist a release, connect this form to your
                  `POST /api/v1/mobile-app-releases` endpoint using
                  `multipart/form-data`.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}