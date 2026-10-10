
"use client";

import { useMemo, useState, type ElementType } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileArchive,
  FileCheck2,
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Upload,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ReleaseStatus = "draft" | "published" | "withdrawn";

type MobileAppRelease = {
  id: string;
  versionName: string;
  versionCode: number;
  releaseNotes: string;
  status: ReleaseStatus;
  isLatest: boolean;
  isMandatory: boolean;
  apkName: string;
  apkSize: number;
  apkSha256: string;
  createdBy: string;
  createdAt: string;
  publishedAt: string | null;
};

const INITIAL_RELEASES: MobileAppRelease[] = [
  {
    id: "rel-001",
    versionName: "2.4.0",
    versionCode: 24,
    releaseNotes:
      "Improved payment experience, security enhancements, and performance optimizations.",
    status: "published",
    isLatest: true,
    isMandatory: true,
    apkName: "municipal-app-v2.4.0.apk",
    apkSize: 38.6,
    apkSha256: "a14d8e72f39c4b10",
    createdBy: "System Administrator",
    createdAt: "2026-10-08T09:30:00",
    publishedAt: "2026-10-09T14:00:00",
  },
  {
    id: "rel-002",
    versionName: "2.3.1",
    versionCode: 23,
    releaseNotes:
      "Fixed invoice display issues and minor application bugs.",
    status: "published",
    isLatest: false,
    isMandatory: false,
    apkName: "municipal-app-v2.3.1.apk",
    apkSize: 36.2,
    apkSha256: "7b21d5c93e804a62",
    createdBy: "Mobile Administrator",
    createdAt: "2026-09-20T10:00:00",
    publishedAt: "2026-09-22T11:30:00",
  },
  {
    id: "rel-003",
    versionName: "2.5.0",
    versionCode: 25,
    releaseNotes:
      "Planned improvements to mobile payment and notification features.",
    status: "draft",
    isLatest: false,
    isMandatory: false,
    apkName: "municipal-app-v2.5.0.apk",
    apkSize: 41.8,
    apkSha256: "c932a74d61ef508b",
    createdBy: "System Administrator",
    createdAt: "2026-10-10T08:15:00",
    publishedAt: null,
  },
  {
    id: "rel-004",
    versionName: "2.3.0",
    versionCode: 22,
    releaseNotes: "Introduced updated taxpayer invoice screens.",
    status: "published",
    isLatest: false,
    isMandatory: false,
    apkName: "municipal-app-v2.3.0.apk",
    apkSize: 35.7,
    apkSha256: "d83f0a19e25b674c",
    createdBy: "Mobile Administrator",
    createdAt: "2026-08-10T08:00:00",
    publishedAt: "2026-08-12T15:45:00",
  },
  {
    id: "rel-005",
    versionName: "2.2.0",
    versionCode: 21,
    releaseNotes:
      "Older release withdrawn after a compatibility issue was identified.",
    status: "withdrawn",
    isLatest: false,
    isMandatory: false,
    apkName: "municipal-app-v2.2.0.apk",
    apkSize: 34.9,
    apkSha256: "e45a81c0d92b376f",
    createdBy: "System Administrator",
    createdAt: "2026-07-12T12:00:00",
    publishedAt: "2026-07-14T09:00:00",
  },
  {
    id: "rel-006",
    versionName: "2.1.0",
    versionCode: 20,
    releaseNotes: "Previous stable version.",
    status: "published",
    isLatest: false,
    isMandatory: false,
    apkName: "municipal-app-v2.1.0.apk",
    apkSize: 32.4,
    apkSha256: "f0284c6d91b357ea",
    createdBy: "Mobile Administrator",
    createdAt: "2026-06-01T09:00:00",
    publishedAt: "2026-06-03T10:30:00",
  },
];

const PAGE_SIZE = 5;

function formatDate(value: string | null) {
  if (!value) return "Not published";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatFileSize(sizeInMb: number) {
  return `${sizeInMb.toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: ReleaseStatus }) {
  const config: Record<
    ReleaseStatus,
    { label: string; className: string }
  > = {
    draft: {
      label: "Draft",
      className:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    },
    published: {
      label: "Published",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    },
    withdrawn: {
      label: "Withdrawn",
      className:
        "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
  };

  const selected = config[status];

  return (
    <Badge variant="outline" className={selected.className}>
      {selected.label}
    </Badge>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="rounded-lg border bg-muted/40 p-2.5">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function MobileAppReleasesPage() {
  const locale = useLocale();

  const [releases, setReleases] =
    useState<MobileAppRelease[]>(INITIAL_RELEASES);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mandatoryFilter, setMandatoryFilter] = useState("all");
  const [page, setPage] = useState(1);

  const basePath = `/${locale}/office/dashboard/mobile-app-releases`;
  const createPath = `${basePath}/create`;

  const summary = useMemo(
    () => ({
      total: releases.length,
      published: releases.filter(
        (release) => release.status === "published",
      ).length,
      drafts: releases.filter(
        (release) => release.status === "draft",
      ).length,
      mandatory: releases.filter(
        (release) =>
          release.status === "published" && release.isMandatory,
      ).length,
    }),
    [releases],
  );

  const filteredReleases = useMemo(() => {
    const term = search.trim().toLowerCase();

    return releases
      .filter((release) => {
        const matchesSearch =
          !term ||
          release.versionName.toLowerCase().includes(term) ||
          String(release.versionCode).includes(term) ||
          release.apkName.toLowerCase().includes(term) ||
          release.createdBy.toLowerCase().includes(term);

        const matchesStatus =
          statusFilter === "all" ||
          release.status === statusFilter;

        const matchesMandatory =
          mandatoryFilter === "all" ||
          (mandatoryFilter === "mandatory" &&
            release.isMandatory) ||
          (mandatoryFilter === "optional" &&
            !release.isMandatory);

        return (
          matchesSearch &&
          matchesStatus &&
          matchesMandatory
        );
      })
      .sort((a, b) => b.versionCode - a.versionCode);
  }, [
    releases,
    search,
    statusFilter,
    mandatoryFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReleases.length / PAGE_SIZE),
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedReleases = filteredReleases.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const latestRelease = releases.find(
    (release) =>
      release.status === "published" && release.isLatest,
  );

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setMandatoryFilter("all");
    setPage(1);
  }

  function publishRelease(id: string) {
    const release = releases.find((item) => item.id === id);

    if (!release || release.status !== "draft") return;

    if (!release.apkName) {
      toast.error("An APK file is required before publishing.");
      return;
    }

    const confirmed = window.confirm(
      `Publish version ${release.versionName}?`,
    );

    if (!confirmed) return;

    setReleases((current) =>
      current.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status: "published",
            isLatest: true,
            publishedAt: new Date().toISOString(),
          };
        }

        return {
          ...item,
          isLatest: false,
        };
      }),
    );

    toast.success(
      `Version ${release.versionName} published in mock mode.`,
    );
  }

  function withdrawRelease(id: string) {
    const release = releases.find((item) => item.id === id);

    if (!release || release.status !== "published") return;

    const confirmed = window.confirm(
      `Withdraw version ${release.versionName}?`,
    );

    if (!confirmed) return;

    setReleases((current) => {
      const updated = current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "withdrawn" as const,
              isLatest: false,
            }
          : item,
      );

      const hasLatest = updated.some(
        (item) =>
          item.status === "published" && item.isLatest,
      );

      if (hasLatest) return updated;

      const replacement = updated
        .filter((item) => item.status === "published")
        .sort((a, b) => b.versionCode - a.versionCode)[0];

      if (!replacement) return updated;

      return updated.map((item) => ({
        ...item,
        isLatest: item.id === replacement.id,
      }));
    });

    toast.success(
      `Version ${release.versionName} withdrawn in mock mode.`,
    );
  }

  function handleRefresh() {
    setReleases((current) => [...current]);
    toast.success("Mock release list refreshed.");
  }

  function handleDownload(release: MobileAppRelease) {
    toast.info(
      `APK download for v${release.versionName} is unavailable in mock mode.`,
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border bg-muted/40 p-3">
            <Smartphone className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Mobile App Releases
              </h1>

              <Badge variant="secondary">Mock data</Badge>
            </div>

            <p className="max-w-2xl text-sm text-muted-foreground">
              Manage Android application versions, APK files,
              publication status, and mandatory updates.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <Button asChild>
            <Link href={createPath}>
              <Plus className="mr-2 h-4 w-4" />
              Create Release
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Releases"
          value={summary.total}
          description="All recorded versions"
          icon={FileArchive}
        />

        <SummaryCard
          title="Published"
          value={summary.published}
          description="Published release records"
          icon={CheckCircle2}
        />

        <SummaryCard
          title="Drafts"
          value={summary.drafts}
          description="Awaiting publication"
          icon={Clock3}
        />

        <SummaryCard
          title="Mandatory Updates"
          value={summary.mandatory}
          description="Published releases marked mandatory"
          icon={ShieldCheck}
        />
      </div>

      {/* Latest release overview */}
      {latestRelease && (
        <Card className="border-primary/20">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <FileCheck2 className="h-5 w-5 text-primary" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">
                    Current latest release · v
                    {latestRelease.versionName}
                  </p>

                  <Badge variant="outline">
                    Code {latestRelease.versionCode}
                  </Badge>

                  {latestRelease.isMandatory && (
                    <Badge variant="destructive">
                      Mandatory
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  Published {formatDate(latestRelease.publishedAt)} ·{" "}
                  {formatFileSize(latestRelease.apkSize)}
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" asChild>
              <Link href={`${basePath}/${latestRelease.id}`}>
                View release
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Release history */}
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Release History</CardTitle>
              <CardDescription className="mt-1">
                Review versions, manage publication, and inspect APK
                details.
              </CardDescription>
            </div>

            <p className="text-sm text-muted-foreground">
              {filteredReleases.length}{" "}
              {filteredReleases.length === 1
                ? "release"
                : "releases"}{" "}
              found
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search version, code, APK, or creator..."
                className="pl-9"
                aria-label="Search releases"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={mandatoryFilter}
                onValueChange={(value) => {
                  setMandatoryFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[175px]">
                  <SelectValue placeholder="Update policy" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All update policies
                  </SelectItem>
                  <SelectItem value="mandatory">
                    Mandatory
                  </SelectItem>
                  <SelectItem value="optional">
                    Optional
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="ghost"
                onClick={resetFilters}
                disabled={
                  !search &&
                  statusFilter === "all" &&
                  mandatoryFilter === "all"
                }
              >
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Release</TableHead>
                  <TableHead>APK File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Update Policy</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedReleases.map((release) => (
                  <TableRow key={release.id}>
                    <TableCell>
                      <div className="flex min-w-[150px] items-start gap-3">
                        <div className="rounded-lg border bg-muted/30 p-2">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div className="space-y-1">
                          <Link
                            href={`${basePath}/${release.id}`}
                            className="font-medium hover:underline"
                          >
                            v{release.versionName}
                          </Link>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">
                              Code {release.versionCode}
                            </span>

                            {release.isLatest && (
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                Latest
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex min-w-[210px] items-start gap-2">
                        <FileArchive className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                        <div className="min-w-0 space-y-1">
                          <p className="max-w-[240px] truncate text-sm font-medium">
                            {release.apkName}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(release.apkSize)}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={release.status} />
                    </TableCell>

                    <TableCell>
                      {release.isMandatory ? (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
                          <ShieldCheck className="h-4 w-4" />
                          Mandatory
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Optional
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex min-w-[125px] items-start gap-2">
                        <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />

                        <div className="space-y-1">
                          <p className="text-sm">
                            {formatDate(release.publishedAt)}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Created {formatDate(release.createdAt)}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Actions for version ${release.versionName}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`${basePath}/${release.id}`}>
                              <FileCheck2 className="mr-2 h-4 w-4" />
                              View details
                            </Link>
                          </DropdownMenuItem>

                          {release.status === "draft" && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`${basePath}/${release.id}/edit`}
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Edit release
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() =>
                                  publishRelease(release.id)
                                }
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Publish release
                              </DropdownMenuItem>
                            </>
                          )}

                          {release.status === "published" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleDownload(release)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download APK
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() =>
                                  withdrawRelease(release.id)
                                }
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Withdraw release
                              </DropdownMenuItem>
                            </>
                          )}

                          {release.status === "withdrawn" && (
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info(
                                  "This release is withdrawn. Create a new version to publish an update.",
                                )
                              }
                            >
                              <AlertCircle className="mr-2 h-4 w-4" />
                              View withdrawal status
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {paginatedReleases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48">
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <div className="rounded-full bg-muted p-3">
                          <Search className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <p className="font-medium">No releases found</p>

                        <p className="text-sm text-muted-foreground">
                          Try another search term or reset your filters.
                        </p>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={resetFilters}
                        >
                          Clear filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredReleases.length === 0
                ? "Showing 0 releases"
                : `Showing ${
                    (currentPage - 1) * PAGE_SIZE + 1
                  }–${Math.min(
                    currentPage * PAGE_SIZE,
                    filteredReleases.length,
                  )} of ${filteredReleases.length} releases`}
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() =>
                  setPage((value) => Math.max(1, value - 1))
                }
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>

              <span className="min-w-[85px] text-center text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setPage((value) =>
                    Math.min(totalPages, value + 1),
                  )
                }
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mock mode notice */}
      <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

        <div className="space-y-1">
          <p className="text-sm font-medium">Development preview</p>

          <p className="text-sm text-muted-foreground">
            This page uses local mock data. Publishing and withdrawal
            actions only update browser state; they do not update Laravel
            or upload APK files. Connect these actions to your release API
            before using this page in production.
          </p>
        </div>
      </div>
    </div>
  );
}