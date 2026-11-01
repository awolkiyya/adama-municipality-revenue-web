"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Download,
  Loader2,
  Smartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";

// =====================================================
// TYPES
// =====================================================

type MobileAppRelease = {
  id: string;
  version_name: string;
  version_code: number;
  release_notes?: string | null;
  status: string;
  is_latest: boolean;
  is_mandatory: boolean;
  is_downloadable: boolean;
  download_url: string | null;
  apk?: {
    original_name?: string;
    extension?: string;
    size_bytes?: number;
    status?: string;
  } | null;
};

type LatestReleaseResponse = {
  success?: boolean;
  message?: string;
  data?: MobileAppRelease | MobileAppRelease[] | null;
};

type ReleaseState = {
  release: MobileAppRelease | null;
  loading: boolean;
  error: string | null;
};

// =====================================================
// HELPERS
// =====================================================

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) {
    return "";
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isDownloadable(
  release?: MobileAppRelease | null,
): boolean {
  return Boolean(
    release?.id &&
      release.status?.toLowerCase() === "published" &&
      release.is_downloadable === true &&
      release.apk?.status?.toUpperCase() === "READY" &&
      release.apk?.extension?.toLowerCase() === "apk",
  );
}

function getDownloadUrl(
  release: MobileAppRelease,
): string | null {
  if (!release.download_url) {
    return `/api/mobile-app-releases/${encodeURIComponent(
      release.id,
    )}/download`;
  }

  if (/^https?:\/\//i.test(release.download_url)) {
    return release.download_url;
  }

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

  if (!apiBaseUrl) {
    return null;
  }

  const path = release.download_url.startsWith("/")
    ? release.download_url
    : `/${release.download_url}`;

  return `${apiBaseUrl}${path}`;
}

// =====================================================
// COMPONENT
// =====================================================

export default function TaxpayerAppDownload() {
  // ===================================================
  // STATE
  // ===================================================

  const [releaseState, setReleaseState] =
    useState<ReleaseState>({
      release: null,
      loading: true,
      error: null,
    });

  const [retryCount, setRetryCount] = useState(0);

  const { release, loading, error } = releaseState;

  // ===================================================
  // LOAD LATEST RELEASE
  // ===================================================

  useEffect(() => {
    let cancelled = false;

    const controller = new AbortController();

    const fetchLatestRelease = async () => {
      try {
        const response = await fetch(
          "/api/mobile-app-releases/latest",
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result =
          (await response.json()) as LatestReleaseResponse;

        if (!response.ok || result.success === false) {
          throw new Error(
            result.message ||
              "Unable to retrieve the latest taxpayer app release.",
          );
        }

        const data = Array.isArray(result.data)
          ? (result.data[0] ?? null)
          : (result.data ?? null);

        const availableRelease = isDownloadable(data)
          ? data
          : null;

        if (!cancelled) {
          setReleaseState({
            release: availableRelease,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (
          cancelled ||
          (err instanceof Error &&
            err.name === "AbortError")
        ) {
          return;
        }

        setReleaseState({
          release: null,
          loading: false,
          error:
            err instanceof Error
              ? err.message
              : "Unable to load the taxpayer app.",
        });
      }
    };

    void fetchLatestRelease();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [retryCount]);

  // ===================================================
  // HANDLERS
  // ===================================================

  const handleRetry = () => {
    setReleaseState({
      release: null,
      loading: true,
      error: null,
    });

    setRetryCount((previous) => previous + 1);
  };

  const handleDownload = () => {
    if (!release) {
      return;
    }

    const url = getDownloadUrl(release);

    if (!url) {
      setReleaseState((previous) => ({
        ...previous,
        error: "The API URL is not configured.",
      }));

      return;
    }

    window.location.assign(url);
  };

  // ===================================================
  // STATUS
  // ===================================================

  let status: React.ReactNode;

  if (loading) {
    status = (
      <p className="text-sm text-muted-foreground">
        Checking for the latest release...
      </p>
    );
  } else if (error) {
    status = (
      <p className="text-sm text-destructive">
        Unable to check for updates.
      </p>
    );
  } else if (release) {
    const size = formatFileSize(
      release.apk?.size_bytes,
    );

    status = (
      <>
        <p className="text-sm text-muted-foreground">
          Version {release.version_name}
          {release.is_latest ? " · Latest release" : ""}
        </p>

        <p className="text-xs text-muted-foreground">
          Android APK{size ? ` · ${size}` : ""}
        </p>
      </>
    );
  } else {
    status = (
      <p className="text-sm text-muted-foreground">
        No downloadable release is currently available.
      </p>
    );
  }

  // ===================================================
  // ACTION BUTTON
  // ===================================================

  let action: React.ReactNode;

  if (loading) {
    action = (
      <Button
        size="lg"
        className="w-full"
        disabled
      >
        <Loader2 className="size-4 animate-spin" />
        Checking
      </Button>
    );
  } else if (error) {
    action = (
      <Button
        size="lg"
        variant="outline"
        className="w-full"
        onClick={handleRetry}
      >
        <AlertCircle className="size-4" />
        Try again
      </Button>
    );
  } else if (release) {
    action = (
      <Button
        size="lg"
        className="w-full"
        onClick={handleDownload}
      >
        <Download className="size-4" />
        Download APK
      </Button>
    );
  } else {
    action = (
      <Button
        size="lg"
        variant="secondary"
        className="w-full"
        disabled
      >
        Not available
      </Button>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Smartphone className="size-5" />
        </div>

        <div
          className="min-w-0 space-y-0.5"
          aria-live="polite"
        >
          <h3 className="text-sm font-semibold">
            Taxpayer Android App
          </h3>

          {status}
        </div>
      </div>

      {action}

      <p className="text-xs leading-5 text-muted-foreground">
        Download the official Adama City Revenue taxpayer
        application. Install only releases published by the
        municipal revenue office.
      </p>
    </div>
  );
}
