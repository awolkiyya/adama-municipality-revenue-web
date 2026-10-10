"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileArchive,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import SummaryCard from "@/components/cards/summary-card";
import AppFilterBar from "@/components/app-filter-bar";
import AppDataTableLayout from "@/components/app-data-table-layout";
import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";


import {
  useMobileAppReleases,
  usePublishMobileAppRelease,
  useWithdrawMobileAppRelease,
} from "@/hooks/use-mobile-app-releases";

import type {
  MobileAppRelease,
  MobileAppReleaseFilters,
} from "@/types/mobile-app-release";
import { formatSize, getStatus, isApkReady, ReleaseStatus, StatusBadge } from "@/utils/elease-utils";
import { formatEthiopianDate } from "@/lib/utils";
import { ReleaseDetailsSheet } from "@/components/sheets/release-details-sheet";

/* -------------------------------------------------------------------------- */
/* Types and constants                                                        */
/* -------------------------------------------------------------------------- */

type StatusFilter = "all" | ReleaseStatus;
type PolicyFilter = "all" | "mandatory" | "optional";

type ReleaseResponse = {
  data?: MobileAppRelease[];
  meta?: {
    total?: number;
    summary?: {
      total?: number;
      published?: number;
      drafts?: number;
      mandatory?: number;
      latest?: MobileAppRelease | null;
    };
  };
};

type PendingAction = {
  type: "publish" | "withdraw";
  release: MobileAppRelease;
} | null;

const DEFAULT_PAGE_SIZE = 10;

const EMPTY_FILTERS: { status: StatusFilter; policy: PolicyFilter } = {
  status: "all",
  policy: "all",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

/* -------------------------------------------------------------------------- */
/* Row actions                                                                */
/* -------------------------------------------------------------------------- */

type RowActionsProps = {
  release: MobileAppRelease;
  busy: boolean;
  editHref: string;
  onView: () => void;
  onPublish: () => void;
  onWithdraw: () => void;
  onDownload: () => void;
};

function RowActions({
  release,
  busy,
  editHref,
  onView,
  onPublish,
  onWithdraw,
  onDownload,
}: RowActionsProps) {
  const status = getStatus(release);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={`Actions for version ${release.version_name}`}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={onView}>
          <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
          View details
        </DropdownMenuItem>

        {status === "draft" && (
          <>
            <DropdownMenuItem asChild>
              <Link href={editHref} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                Edit
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={onPublish}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
              Publish
            </DropdownMenuItem>
          </>
        )}

        {status === "published" && (
          <>
            <DropdownMenuItem disabled={!release.is_downloadable} onSelect={onDownload}>
              <Download className="mr-2 h-4 w-4 text-muted-foreground" />
              Download APK
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={onWithdraw}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Withdraw
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function MobileAppReleasesPage() {
  const locale = useLocale();

  const basePath = `/${locale}/office/dashboard/mobile-app-releases`;
  const editUrl = (id: string) => `${basePath}/${encodeURIComponent(id)}/edit`;

  /* Draft values live in the filter bar; applied values drive the query. */
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pending, setPending] = useState<PendingAction>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* ------------------------------- Data ----------------------------------- */

  const filters = useMemo<MobileAppReleaseFilters>(
    () => ({
      search: appliedSearch || undefined,
      status: appliedFilters.status === "all" ? undefined : appliedFilters.status,
      is_mandatory:
        appliedFilters.policy === "all"
          ? undefined
          : appliedFilters.policy === "mandatory",
      page,
      per_page: pageSize,
      sort_by: "version_code",
      sort_direction: "desc",
    }),
    [appliedSearch, appliedFilters, page, pageSize],
  );

  const { data, isLoading, isError, error, refetch, isFetching } =
    useMobileAppReleases(filters);

  const publishMutation = usePublishMobileAppRelease();
  const withdrawMutation = useWithdrawMobileAppRelease();
  const isActionPending = publishMutation.isPending || withdrawMutation.isPending;

  const result = data as ReleaseResponse | undefined;
  const releases = Array.isArray(result?.data) ? result.data : [];
  const total = Number(result?.meta?.total ?? releases.length) || 0;

  /* The open release is read from the list, so it refreshes after any action. */
  const selected = releases.find((r) => r.id === selectedId) ?? null;

  /* Prefer the API's overall summary; fall back to counting this page. */
  const apiSummary = result?.meta?.summary;

  const summary = {
    total: apiSummary?.total ?? total,
    published:
      apiSummary?.published ?? releases.filter((r) => getStatus(r) === "published").length,
    drafts: apiSummary?.drafts ?? releases.filter((r) => getStatus(r) === "draft").length,
    mandatory: apiSummary?.mandatory ?? releases.filter((r) => r.is_mandatory).length,
  };

  const latest =
    apiSummary?.latest ??
    releases.find((r) => getStatus(r) === "published" && r.is_latest);

  /* ------------------------------ Filters --------------------------------- */

  const hasFilters =
    Boolean(appliedSearch) ||
    appliedFilters.status !== "all" ||
    appliedFilters.policy !== "all";

  const activeFilterCount =
    Number(appliedFilters.status !== "all") + Number(appliedFilters.policy !== "all");

  const hasPendingChanges =
    search.trim() !== appliedSearch ||
    draftFilters.status !== appliedFilters.status ||
    draftFilters.policy !== appliedFilters.policy;

  function applyFilters() {
    setPage(1);
    setAppliedSearch(search.trim());
    setAppliedFilters({ ...draftFilters });
  }

  function clearFilters() {
    setSearch("");
    setAppliedSearch("");
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  }

  /* ------------------------------ Actions --------------------------------- */

  function requestPublish(release: MobileAppRelease) {
    if (!isApkReady(release)) {
      toast.error("Upload a valid APK and wait until it is READY before publishing.");
      return;
    }
    setPending({ type: "publish", release });
  }

  function confirmPending() {
    if (!pending || isActionPending) return;

    const { type, release } = pending;
    const mutation = type === "publish" ? publishMutation : withdrawMutation;

    mutation.mutate(
      { id: release.id, payload: {} },
      {
        onSuccess: () =>
          toast.success(
            type === "publish"
              ? `Published v${release.version_name}.`
              : `Withdrawn v${release.version_name}.`,
          ),
        onError: (e) =>
          toast.error(
            errorMessage(
              e,
              type === "publish"
                ? "Couldn't publish this release."
                : "Couldn't withdraw this release.",
            ),
          ),
        onSettled: () => setPending(null),
      },
    );
  }

  function downloadApk(release: MobileAppRelease) {
    if (!release.is_downloadable || !release.download_url) {
      toast.info("This release isn't available for download.");
      return;
    }

    try {
      const url = new URL(release.download_url, window.location.origin);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      window.open(url.href, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("The download link is invalid.");
    }
  }

  /* -------------------------------- UI ------------------------------------ */

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Banner
        title="Mobile App Releases"
        description="Upload, publish, and withdraw Android versions."
        icon={<Smartphone className="h-4 w-4" />}
        background={
          <FloatingParticles
            color="#0B3784"
            count={35}
            speed={0.2}
            connectDistance={100}
            position="bottom-right"
          />
        }
        overlayClassName="bg-transparent"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button asChild size="sm">
              <Link href={`${basePath}/create`}>
                <Plus className="mr-2 h-4 w-4" />
                New release
              </Link>
            </Button>
          </div>
        }
      />

      {/* Summary */}
      <section
        aria-label="Release summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryCard
          label="Total releases"
          value={summary.total}
          description="All releases"
          icon={FileArchive}
          tone="primary"
          loading={isLoading}
        />
        <SummaryCard
          label="Published"
          value={summary.published}
          description={latest ? `Latest: v${latest.version_name}` : "Published releases"}
          icon={CheckCircle2}
          tone="success"
          loading={isLoading}
        />
        <SummaryCard
          label="Drafts"
          value={summary.drafts}
          description="Awaiting publication"
          icon={Clock}
          tone="warning"
          attention={summary.drafts > 0}
          loading={isLoading}
        />
        <SummaryCard
          label="Mandatory updates"
          value={summary.mandatory}
          description="Marked as required"
          icon={ShieldCheck}
          tone="info"
          loading={isLoading}
        />
      </section>

      {/* Filters */}
      <AppFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search version or APK name"
        searchLabel="Search releases"
        title="Find releases"
        description="Search by version and filter by status or update type."
        activeFilterCount={activeFilterCount}
        hasFilters={hasFilters || hasPendingChanges}
        onApply={applyFilters}
        onClear={clearFilters}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={draftFilters.status}
            onValueChange={(value) =>
              setDraftFilters((c) => ({ ...c, status: value as StatusFilter }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Update type</label>
          <Select
            value={draftFilters.policy}
            onValueChange={(value) =>
              setDraftFilters((c) => ({ ...c, policy: value as PolicyFilter }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All updates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All updates</SelectItem>
              <SelectItem value="mandatory">Mandatory</SelectItem>
              <SelectItem value="optional">Optional</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AppFilterBar>

      {/* Releases */}
      <section aria-label="Releases" className="min-w-0 space-y-2">
        <div className="flex h-5 items-center justify-between text-sm text-muted-foreground">
          <span>
            {isLoading
              ? "Loading…"
              : `${total.toLocaleString()} ${total === 1 ? "release" : "releases"}`}
          </span>

          {isFetching && !isLoading && (
            <span className="inline-flex items-center gap-1.5 text-xs" role="status">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating
            </span>
          )}
        </div>

        {isLoading ? (
          <div
            className="flex min-h-[240px] items-center justify-center rounded-xl border bg-card"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border bg-card p-6 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <div className="space-y-1">
              <h2 className="font-semibold">Couldn&apos;t load releases</h2>
              <p className="text-sm text-muted-foreground">
                {errorMessage(error, "Check your connection and try again.")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Try again
            </Button>
          </div>
        ) : (
          <AppDataTableLayout
            isEmpty={releases.length === 0}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            emptyTitle="No releases yet"
            emptyDescription="Create your first release to distribute an APK."
            filteredEmptyDescription="No releases match your search or filters."
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          >
            <div className="w-full overflow-hidden rounded-none border-none bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                      <th scope="col" className="h-11 px-5">Version</th>
                      <th scope="col" className="h-11 px-5">APK</th>
                      <th scope="col" className="h-11 px-5">Status</th>
                      <th scope="col" className="h-11 px-5">Published</th>
                      <th scope="col" className="h-11 w-16 px-5 text-right">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {releases.map((release) => {
                      const status = getStatus(release);
                      const apkStatus = release.apk?.status?.toUpperCase();

                      return (
                        <tr key={release.id} className="transition-colors hover:bg-muted/30">
                          {/* Version, with latest and mandatory flags inline */}
                          <td className="px-5 py-3.5 align-middle">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedId(release.id)}
                                className="font-semibold tracking-tight hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                v{release.version_name || "—"}
                              </button>

                              {release.is_latest && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Latest
                                </Badge>
                              )}

                              {release.is_mandatory && (
                                <Badge variant="outline" className="gap-1 text-[10px]">
                                  <ShieldAlert className="h-3 w-3" />
                                  Mandatory
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Code {release.version_code}
                            </p>
                          </td>

                          {/* APK */}
                          <td className="px-5 py-3.5 align-middle">
                            <div className="flex items-center gap-2.5">
                              <FileArchive className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0">
                                <p
                                  className="max-w-[220px] truncate font-medium"
                                  title={release.apk?.original_name}
                                >
                                  {release.apk?.original_name || "APK file"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatSize(release.apk?.size_bytes)}
                                  {apkStatus && apkStatus !== "READY" && (
                                    <span className="text-amber-600 dark:text-amber-400">
                                      {" "}· {apkStatus}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 align-middle">
                            <StatusBadge status={status} />
                          </td>

                          <td className="whitespace-nowrap px-5 py-3.5 align-middle text-muted-foreground">
                            {status === "published" ? formatEthiopianDate(release.published_at!) : "—"}
                          </td>

                          <td className="px-5 py-3.5 text-right align-middle">
                            <RowActions
                              release={release}
                              busy={isActionPending && pending?.release.id === release.id}
                              editHref={editUrl(release.id)}
                              onView={() => setSelectedId(release.id)}
                              onPublish={() => requestPublish(release)}
                              onWithdraw={() => setPending({ type: "withdraw", release })}
                              onDownload={() => downloadApk(release)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </AppDataTableLayout>
        )}
      </section>

      {/* Details */}
      <ReleaseDetailsSheet
        release={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        busy={isActionPending && pending?.release.id === selected?.id}
        editHref={selected ? editUrl(selected.id) : basePath}
        onPublish={() => selected && requestPublish(selected)}
        onWithdraw={() => selected && setPending({ type: "withdraw", release: selected })}
        onDownload={() => selected && downloadApk(selected)}
      />

      {/* Confirmation */}
      <AlertDialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open && !isActionPending) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.type === "publish" ? "Publish" : "Withdraw"} v
              {pending?.release.version_name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.type === "publish"
                ? "This version will become available to users."
                : "Users may no longer be able to download this version."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isActionPending}
              onClick={(event) => {
                event.preventDefault();
                confirmPending();
              }}
              className={
                pending?.type === "withdraw"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {isActionPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pending?.type === "publish" ? "Publish" : "Withdraw"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}