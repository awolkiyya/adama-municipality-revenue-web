"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Download,
  FileArchive,
  Loader2,
  Pencil,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";



import type { MobileAppRelease } from "@/types/mobile-app-release";
import { formatSize, getStatus } from "@/utils/elease-utils";
import { StatusBadge } from "../assessment/status-badge";
import { formatEthiopianDate } from "@/lib/utils";

type ReleaseDetailsSheetProps = {
  release: MobileAppRelease | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  editHref: string;
  onPublish: () => void;
  onWithdraw: () => void;
  onDownload: () => void;
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

export function ReleaseDetailsSheet({
  release,
  open,
  onOpenChange,
  busy = false,
  editHref,
  onPublish,
  onWithdraw,
  onDownload,
}: ReleaseDetailsSheetProps) {
  const status = release ? getStatus(release) : "draft";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {release && (
          <>
            {/* Header */}
            <SheetHeader className="space-y-2 border-b px-6 py-5 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-xl">v{release.version_name}</SheetTitle>
                <StatusBadge status={status} />
              </div>

              <SheetDescription className="flex flex-wrap items-center gap-2">
                Version code {release.version_code}
                {release.is_latest && <Badge variant="secondary">Latest</Badge>}
                {release.is_mandatory && (
                  <Badge variant="outline" className="gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    Mandatory
                  </Badge>
                )}
              </SheetDescription>
            </SheetHeader>

            {/* Body */}
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {/* APK */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">APK file</h3>

                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
                    <FileArchive className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium"
                      title={release.apk?.original_name}
                    >
                      {release.apk?.original_name || "No APK uploaded"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(release.apk?.size_bytes)}
                      {release.apk?.status && ` · ${release.apk.status}`}
                    </p>
                  </div>
                </div>
              </section>

              {/* Details */}
              <section>
                <h3 className="text-sm font-semibold">Details</h3>

                <dl className="mt-1 divide-y">
                  <Row label="Update type">
                    {release.is_mandatory ? "Mandatory" : "Optional"}
                  </Row>
                  <Row label="Created">{formatEthiopianDate(release.created_at)}</Row>
                  <Row label="Published">
                    {status === "published" ? formatEthiopianDate(release.published_at!) : "—"}
                  </Row>
                  <Row label="Downloadable">
                    {release.is_downloadable ? "Yes" : "No"}
                  </Row>
                </dl>
              </section>

              {/* Notes */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Release notes</h3>

                {release.release_notes ? (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {release.release_notes}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No release notes.</p>
                )}
              </section>
            </div>

            {/* Actions */}
            {status !== "withdrawn" && (
              <SheetFooter className="flex-row gap-2 border-t px-6 py-4 sm:justify-end">
                {status === "draft" && (
                  <>
                    <Button asChild variant="outline" disabled={busy}>
                      <Link href={editHref}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>

                    <Button onClick={onPublish} disabled={busy}>
                      {busy ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Publish
                    </Button>
                  </>
                )}

                {status === "published" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={onDownload}
                      disabled={busy || !release.is_downloadable}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download APK
                    </Button>

                    <Button variant="destructive" onClick={onWithdraw} disabled={busy}>
                      {busy ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Withdraw
                    </Button>
                  </>
                )}
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}