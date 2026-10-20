"use client";

import { AlertCircle, Download, Loader2, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isDownloadable(release?: MobileAppRelease | null): boolean {
  return Boolean(
    release?.id &&
      release.status?.toLowerCase() === "published" &&
      release.is_downloadable === true &&
      release.apk?.status?.toUpperCase() === "READY" &&
      release.apk?.extension?.toLowerCase() === "apk",
  );
}

function getDownloadUrl(release: MobileAppRelease): string | null {
  if (!release.download_url) {
    return `/api/mobile-app-releases/${encodeURIComponent(release.id)}/download`;
  }

  if (/^https?:\/\//i.test(release.download_url)) {
    return release.download_url;
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!apiBaseUrl) return null;

  const path = release.download_url.startsWith("/")
    ? release.download_url
    : `/${release.download_url}`;

  return `${apiBaseUrl}${path}`;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function TaxpayerAppDownload() {
  const [release, setRelease] = useState<MobileAppRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLatestRelease = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/mobile-app-releases/latest", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      const result = (await response.json()) as LatestReleaseResponse;

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
            "Unable to retrieve the latest taxpayer app release.",
        );
      }

      const data = Array.isArray(result.data) ? result.data[0] : result.data;
      setRelease(isDownloadable(data) ? (data as MobileAppRelease) : null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load the taxpayer app.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLatestRelease();
  }, []);

  const handleDownload = () => {
    if (!release) return;

    const url = getDownloadUrl(release);

    if (!url) {
      setError("The API URL is not configured.");
      return;
    }

    window.location.assign(url);
  };

  /* ---- Status line under the title ---- */
  let status: React.ReactNode;

  if (loading) {
    status = (
      <p className="text-sm text-muted-foreground">
        Checking for the latest release...
      </p>
    );
  } else if (error) {
    status = (
      <p className="text-sm text-destructive">Unable to check for updates.</p>
    );
  } else if (release) {
    const size = formatFileSize(release.apk?.size_bytes);

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

  /* ---- Action button ---- */
  let action: React.ReactNode;

  if (loading) {
    action = (
      <Button size="lg" className="w-full" disabled>
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
        onClick={() => void loadLatestRelease()}
      >
        <AlertCircle className="size-4" />
        Try again
      </Button>
    );
  } else if (release) {
    action = (
      <Button size="lg" className="w-full" onClick={handleDownload}>
        <Download className="size-4" />
        Download APK
      </Button>
    );
  } else {
    action = (
      <Button size="lg" variant="secondary" className="w-full" disabled>
        Not available
      </Button>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Smartphone className="size-5" />
        </div>

        <div className="min-w-0 space-y-0.5" aria-live="polite">
          <h3 className="text-sm font-semibold">Taxpayer Android App</h3>
          {status}
        </div>
      </div>

      {action}

      <p className="text-xs leading-5 text-muted-foreground">
        Download the official Adama City Revenue taxpayer application. Install
        only releases published by the municipal revenue office.
      </p>
    </div>
  );
}