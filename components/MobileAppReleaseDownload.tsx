
"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Loader2,
  ShieldCheck,
  Smartphone,
  AlertCircle,
} from "lucide-react";

type MobileAppType = "taxpayer" | "field_collector";

type MobileAppRelease = {
  id: string;
  app_type: MobileAppType;
  version_name: string;
  version_code: number;
  status: "draft" | "published" | "withdrawn";
  is_latest: boolean;
  is_mandatory: boolean;
  is_downloadable: boolean;
  download_url?: string | null;
  apk_download_url?: string | null;
  apk?: {
    uuid?: string;
    original_name?: string | null;
    size_bytes?: number | null;
  } | null;
};

type ApiResponse = {
  data?: MobileAppRelease;
  message?: string;
};

type MobileAppReleaseDownloadProps = {
  appType: MobileAppType;
  appName: string;
  description: string;
  platform?: string;
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";

  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveDownloadUrl(release: MobileAppRelease): string | null {
  const suppliedUrl = release.download_url ?? release.apk_download_url;

  if (suppliedUrl) {
    try {
      return new URL(suppliedUrl, API_URL || window.location.origin).toString();
    } catch {
      return null;
    }
  }

  // Fallback to the release download route when the resource omits its URL.
  if (release.id && API_URL) {
    return `${API_URL}/api/v1/mobile-app-releases/${encodeURIComponent(
      release.id,
    )}/download`;
  }

  return null;
}

export default function MobileAppReleaseDownload({
  appType,
  appName,
  description,
  platform = "Android",
}: MobileAppReleaseDownloadProps) {
  const [release, setRelease] = useState<MobileAppRelease | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLatestRelease() {
      setLoading(true);
      setError(null);
      setRelease(null);
      setDownloadUrl(null);

      if (!API_URL) {
        setError("The application API URL is not configured.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/v1/mobile-app-releases/latest?app_type=${encodeURIComponent(
            appType,
          )}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const payload = (await response.json().catch(() => null)) as
          | ApiResponse
          | MobileAppRelease
          | null;

        if (!response.ok) {
          const message =
            payload && "message" in payload && payload.message
              ? payload.message
              : response.status === 404
                ? "No published release is available yet."
                : "Unable to load the latest application release.";

          if (response.status !== 404) {
            setError(message);
          }

          return;
        }

        const latest =
          payload && "data" in payload && payload.data
            ? payload.data
            : (payload as MobileAppRelease | null);

        if (
          !latest ||
          latest.app_type !== appType ||
          latest.status !== "published" ||
          !latest.is_latest
        ) {
          setError("No published release is available yet.");
          return;
        }

        setRelease(latest);
        setDownloadUrl(
          latest.is_downloadable ? resolveDownloadUrl(latest) : null,
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the application release.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadLatestRelease();

    return () => controller.abort();
  }, [appType]);

  const apkSize = formatFileSize(release?.apk?.size_bytes);
  const isAvailable = Boolean(release && downloadUrl && release.is_downloadable);

  return (
    <div className="space-y-4">
      {/* Application identity */}
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Smartphone className="size-5" />
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">
            {appName}
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Release information */}
      <dl className="grid grid-cols-3 divide-x overflow-hidden rounded-xl border bg-card">
        <div className="min-w-0 px-2 py-3 text-center sm:px-3">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Version
          </dt>
          <dd className="mt-1 break-words text-sm font-semibold text-foreground">
            {loading ? "…" : release?.version_name ?? "—"}
          </dd>
        </div>

        <div className="min-w-0 px-2 py-3 text-center sm:px-3">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            APK size
          </dt>
          <dd className="mt-1 break-words text-sm font-semibold text-foreground">
            {loading ? "…" : apkSize}
          </dd>
        </div>

        <div className="min-w-0 px-2 py-3 text-center sm:px-3">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Platform
          </dt>
          <dd className="mt-1 break-words text-sm font-semibold text-foreground">
            {platform}
          </dd>
        </div>
      </dl>

      {/* Release status */}
      {loading && (
        <div
          className="flex items-center justify-center gap-2 rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
          role="status"
        >
          <Loader2 className="size-4 animate-spin" />
          Checking for the latest release…
        </div>
      )}

      {!loading && error && (
        <div
          className="flex items-start gap-2 rounded-xl border bg-muted/30 px-3 py-3 text-sm text-muted-foreground"
          role="status"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && isAvailable && release && downloadUrl && (
        <a
          href={downloadUrl}
          download={release.apk?.original_name || undefined}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Download className="size-4" />
          Download for Android
        </a>
      )}

      {!loading && !error && !isAvailable && (
        <button
          type="button"
          disabled
          className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground opacity-60"
        >
          <Download className="size-4" />
          Download unavailable
        </button>
      )}

      {/* Security note */}
      <div className="flex items-start gap-2.5 rounded-xl bg-muted/50 p-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-xs leading-5 text-muted-foreground">
          Download the official {appName} APK. Install it on a compatible
          Android device and use your registered account to sign in.
        </p>
      </div>
    </div>
  );
}
