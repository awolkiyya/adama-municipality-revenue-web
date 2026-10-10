/* =========================================================
   PUBLIC TAXPAYER APK DOWNLOAD
========================================================= */

import { AlertCircle, Download, Loader2, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

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

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) {
    return "";
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default  function TaxpayerAppDownload() {
  const [release, setRelease] =
    useState<MobileAppRelease | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLatestRelease = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

      if (!apiBaseUrl) {
        throw new Error(
          "The API URL is not configured. Please contact the system administrator.",
        );
      }

      const response = await fetch(
        `/api/mobile-app-releases/latest`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
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

      const releaseData = Array.isArray(result.data)
        ? result.data[0]
        : result.data;

      if (
        !releaseData ||
        releaseData.status?.toLowerCase() !== "published" ||
        releaseData.is_downloadable !== true ||
        releaseData.apk?.status?.toUpperCase() !== "READY" ||
        releaseData.apk?.extension?.toLowerCase() !== "apk" ||
        !releaseData.id
      ) {
        setRelease(null);
        return;
      }

      setRelease(releaseData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the taxpayer app.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLatestRelease();
  }, []);

  const handleDownload = () => {
    if (!release) {
      return;
    }

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

    if (!apiBaseUrl) {
      setError("The API URL is not configured.");
      return;
    }

    const downloadUrl = release.download_url
      ? /^https?:\/\//i.test(release.download_url)
        ? release.download_url
        : `${apiBaseUrl}${
            release.download_url.startsWith("/") ? "" : "/"
          }${release.download_url}`
      : `/api/mobile-app-releases/${encodeURIComponent(
          release.id,
        )}/download`;

    window.location.assign(downloadUrl);
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F1B2E] text-[#E8C468]">
            <Smartphone className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#0F1B2E]">
              Taxpayer Android App
            </h3>

            {loading ? (
              <p className="mt-1 text-xs text-black/45">
                Checking for the latest release...
              </p>
            ) : error ? (
              <p className="mt-1 text-xs text-red-600">
                Unable to check for updates.
              </p>
            ) : release ? (
              <>
                <p className="mt-1 text-xs text-black/50">
                  Version {release.version_name}
                  {release.is_latest ? " · Latest release" : ""}
                </p>

                <p className="mt-1 text-[10px] text-black/40">
                  Android APK
                  {release.apk?.size_bytes
                    ? ` · ${formatFileSize(release.apk.size_bytes)}`
                    : ""}
                </p>
              </>
            ) : (
              <p className="mt-1 text-xs text-black/45">
                No downloadable release is currently available.
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0F1B2E]/10 px-4 py-3 text-xs font-semibold text-[#0F1B2E]/60">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking
          </div>
        ) : error ? (
          <button
            type="button"
            onClick={() => void loadLatestRelease()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-xs font-semibold text-[#0F1B2E] transition hover:bg-black/5"
          >
            <AlertCircle className="h-4 w-4" />
            Try again
          </button>
        ) : release ? (
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0F1B2E] px-4 py-3 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1B2B45]"
          >
            <Download className="h-4 w-4" />
            Download APK
          </button>
        ) : (
          <div className="shrink-0 rounded-xl bg-black/5 px-4 py-3 text-xs font-medium text-black/40">
            Not available
          </div>
        )}
      </div>

      <p className="mt-2 text-[10px] leading-5 text-black/40">
        Download the official Adama City Revenue taxpayer
        application. Install only releases published by the
        municipal revenue office.
      </p>
    </div>
  );
}
