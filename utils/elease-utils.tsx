import type { MobileAppRelease } from "@/types/mobile-app-release";

export type ReleaseStatus = "draft" | "published" | "withdrawn";

const STATUS_STYLES: Record<ReleaseStatus, { label: string; badge: string; dot: string }> = {
  published: {
    label: "Published",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  draft: {
    label: "Draft",
    badge:
      "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
    dot: "bg-slate-400",
  },
  withdrawn: {
    label: "Withdrawn",
    badge:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300",
    dot: "bg-red-500",
  },
};

export function getStatus(release: MobileAppRelease): ReleaseStatus {
  const status = release.status?.toLowerCase();
  return status === "published" || status === "withdrawn" ? status : "draft";
}

export function isApkReady(release: MobileAppRelease): boolean {
  return (
    release.apk?.status?.toUpperCase() === "READY" &&
    release.apk.extension?.toLowerCase() === "apk" &&
    release.apk.size_bytes > 0
  );
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StatusBadge({ status }: { status: ReleaseStatus }) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}