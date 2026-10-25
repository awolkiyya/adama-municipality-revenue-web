"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CalendarClock,
  Plus,
  CheckCircle2,
  Search,
  Archive,
  Clock3,
  Sparkles,
  Inbox,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Copy,
} from "lucide-react";

import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { FloatingParticles } from "@/components/design/FloatingParticles";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DuplicateTariffVersionDialog } from "@/components/revenue/tariff-versions/DuplicateTariffVersionDialog";
import DeleteModal from "@/components/dialogs/deleteModal";



import {
  useActivateTariffVersion,
  useCurrentActiveTariff,
  useDeleteTariffVersion,
  useTariffVersions,
} from "@/hooks/revenue/revenueVersion.hook";

import type { TariffVersion } from "@/types/revenue/tariff-version";

import { DataTablePagination } from "@/components/table/data-pagination";
import { formatEthiopianDate } from "@/lib/utils";
import ProtectedRoute from "@/components/access/ProtectedRoute";
import Can from "@/components/access/Can";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VersionStatus = "active" | "scheduled" | "archived";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getVersionStatus(version: TariffVersion): VersionStatus {
  if (version.isActive) {
    return "active";
  }

  if (version.effectiveTo) {
    return "archived";
  }

  return "scheduled";
}

// ---------------------------------------------------------------------------
// Status metadata
// ---------------------------------------------------------------------------

const STATUS_META: Record<
  VersionStatus,
  {
    label: string;
    badgeClass: string;
    Icon: typeof CheckCircle2;
  }
> = {
  active: {
    label: "Active",
    badgeClass:
      "gap-1 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10",
    Icon: CheckCircle2,
  },

  scheduled: {
    label: "Scheduled",
    badgeClass:
      "gap-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/10",
    Icon: Clock3,
  },

  archived: {
    label: "Archived",
    badgeClass: "gap-1 bg-muted text-muted-foreground hover:bg-muted",
    Icon: Archive,
  },
};

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const TARIFF_VERSIONS_ROUTE =
  "/office/dashboard/revenue-managements/tariff-versions";

const TARIFF_TRASH_ROUTE = `${TARIFF_VERSIONS_ROUTE}/trash`;

function getEditRoute(id: string | number) {
  return `${TARIFF_VERSIONS_ROUTE}/${id}/edit`;
}

function getDetailsRoute(id: string | number) {
  return `${TARIFF_VERSIONS_ROUTE}/${id}`;
}

// ---------------------------------------------------------------------------
// Protected page entry point
// ---------------------------------------------------------------------------

export default function TariffVersionsPage() {
  return (
    <ProtectedRoute resource="tariff_version" action="view">
      <TariffVersionsPageContent />
    </ProtectedRoute>
  );
}

// ---------------------------------------------------------------------------
// Page content
// ---------------------------------------------------------------------------

function TariffVersionsPageContent() {
  const router = useRouter();

  // -------------------------------------------------------------------------
  // Duplicate dialog
  // -------------------------------------------------------------------------

  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [sourceVersion, setSourceVersion] =
    useState<TariffVersion | null>(null);

  // -------------------------------------------------------------------------
  // Delete dialog
  // -------------------------------------------------------------------------

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] =
    useState<TariffVersion | null>(null);

  // -------------------------------------------------------------------------
  // Search and pagination
  // -------------------------------------------------------------------------

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // -------------------------------------------------------------------------
  // API
  // -------------------------------------------------------------------------

  const {
    data: tariffResponse,
    isLoading,
    isError,
    refetch,
  } = useTariffVersions({
    page,
    per_page: pageSize,
  });

  const { data: activeTariffResponse } = useCurrentActiveTariff();

  const deleteMutation = useDeleteTariffVersion();
  const activateMutation = useActivateTariffVersion();

  // -------------------------------------------------------------------------
  // Normalize API response
  // -------------------------------------------------------------------------

  const versions: TariffVersion[] = Array.isArray(tariffResponse?.data)
    ? tariffResponse.data
    : [];

  const responseTotal =
    typeof tariffResponse?.meta?.total === "number"
      ? tariffResponse.meta.total
      : versions.length;

  // -------------------------------------------------------------------------
  // Sort
  // -------------------------------------------------------------------------

  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => Number(b.year) - Number(a.year)),
    [versions],
  );

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  const filteredVersions = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return sortedVersions;
    }

    return sortedVersions.filter(
      (item) =>
        String(item.year).toLowerCase().includes(value) ||
        String(item.name ?? "").toLowerCase().includes(value) ||
        `v${item.version ?? 1}`.includes(value),
    );
  }, [query, sortedVersions]);

  // -------------------------------------------------------------------------
  // Create
  // -------------------------------------------------------------------------

  const openCreatePage = () => {
    router.push(`${TARIFF_VERSIONS_ROUTE}/new`);
  };

  // -------------------------------------------------------------------------
  // Edit
  // -------------------------------------------------------------------------

  const openEditPage = (version: TariffVersion) => {
    router.push(getEditRoute(version.id));
  };

  // -------------------------------------------------------------------------
  // Duplicate
  // -------------------------------------------------------------------------

  const openDuplicateDialog = (version: TariffVersion) => {
    setSourceVersion(version);
    setDuplicateOpen(true);
  };

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  const handleDelete = async () => {
    if (!selectedVersion) {
      return;
    }

    await deleteMutation.mutateAsync(selectedVersion.id);

    setDeleteOpen(false);
    setSelectedVersion(null);

    await refetch();
  };

  // -------------------------------------------------------------------------
  // Activate
  // -------------------------------------------------------------------------

  const handleActivate = async (id: string | number) => {
    await activateMutation.mutateAsync(String(id));

    await refetch();
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}

      <Banner
        description="Manage yearly tariff versions. Duplicate an existing version to carry forward its pricing rules and formulas without changing historical records."
        badge={
          <IconBadge
            className="gap-2 rounded-full p-3 text-xs"
            icon={<CalendarClock className="h-4 w-4" />}
          >
            Tariff Versions
          </IconBadge>
        }
        overlayClassName="bg-transparent"
        background={
          <FloatingParticles
            color="#040404"
            count={35}
            speed={0.2}
            connectDistance={100}
            position="bottom-right"
          />
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Can resource="tariff_version" action="delete">
              <Button
                variant="outline"
                onClick={() => router.push(TARIFF_TRASH_ROUTE)}
              >
                <Archive className="mr-2 h-4 w-4" />
                Trash
              </Button>
            </Can>

            <Can resource="tariff_version" action="create">
              <Button onClick={openCreatePage}>
                <Plus className="mr-2 h-4 w-4" />
                New Tariff Version
              </Button>
            </Can>
          </div>
        }
      />

      {/* Active tariff status */}

      {activeTariffResponse?.data?.message && (
        <ActiveTariffStatus message={activeTariffResponse.data.message} />
      )}

      {/* Error, loading, empty state, or table */}

      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 px-6 py-12 text-center">
          <p className="text-sm font-semibold">
            Unable to load tariff versions
          </p>

          <p className="text-sm text-muted-foreground">
            Something went wrong while retrieving tariff versions.
          </p>

          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          <div className="h-20 animate-pulse rounded-xl border bg-muted/40" />

          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl border bg-muted/40"
            />
          ))}
        </div>
      ) : versions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Inbox className="h-5 w-5 text-muted-foreground" />
          </div>

          <p className="text-sm font-semibold">No tariff versions yet</p>

          <p className="max-w-sm text-xs text-muted-foreground">
            Create your first tariff version. Once you have configured its
            rules and formulas, you can duplicate it for future years.
          </p>

          <Can resource="tariff_version" action="create">
            <Button size="sm" onClick={openCreatePage}>
              <Plus className="mr-2 h-4 w-4" />
              New Tariff Version
            </Button>
          </Can>
        </div>
      ) : (
        <>
          {/* Search */}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search tariff year or version..."
              className="py-5 pl-9"
            />
          </div>

          {/* Search results */}

          {filteredVersions.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No versions match &quot;{query}&quot;
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Year
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Version
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Effective Period
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Status
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">
                        Price Rules
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredVersions.map((version) => {
                      const status = getVersionStatus(version);
                      const statusMeta = STATUS_META[status];
                      const StatusIcon = statusMeta.Icon;

                      return (
                        <tr
                          key={version.id}
                          className="border-b transition last:border-none hover:bg-muted/40"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex h-9 min-w-14 items-center justify-center rounded-lg px-2 text-sm font-bold ${
                                  version.isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                {version.year}
                              </div>

                              {version.isActive && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            v{version.version ?? 1}
                          </td>

                          <td className="px-5 py-4 text-muted-foreground">
                            <div>
                              {version.effectiveFrom
                                ? formatEthiopianDate(version.effectiveFrom)
                                : "—"}
                            </div>

                            <div className="text-xs">
                              →{" "}
                              {version.effectiveTo
                                ? formatEthiopianDate(version.effectiveTo)
                                : "Ongoing"}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <Badge className={statusMeta.badgeClass}>
                              <StatusIcon className="h-3 w-3" />
                              {statusMeta.label}
                            </Badge>
                          </td>

                          <td className="px-5 py-4">
                            {version.tariffRulesCount ?? 0}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label={`Actions for ${version.year} version ${version.version ?? 1}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent
                                align="end"
                                className="w-52"
                              >
                                <Can
                                  resource="tariff_version"
                                  action="view"
                                >
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(getDetailsRoute(version.id))
                                    }
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                </Can>

                                <Can
                                  resource="tariff_version"
                                  action="update"
                                >
                                  <DropdownMenuItem
                                    onClick={() => openEditPage(version)}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Version
                                  </DropdownMenuItem>
                                </Can>

                                <Can
                                  resource="tariff_version"
                                  action="duplicate"
                                >
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openDuplicateDialog(version)
                                    }
                                    disabled={duplicateOpen}
                                  >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate Version
                                  </DropdownMenuItem>
                                </Can>

                                {!version.isActive && (
                                  <>
                                    <DropdownMenuSeparator />

                                    {/* Use approve only if activation is part
                                        of your approval workflow. */}

                                    <Can
                                      resource="tariff_version"
                                      action="approve"
                                    >
                                      <DropdownMenuItem
                                        className="text-emerald-600"
                                        onClick={() =>
                                          void handleActivate(version.id)
                                        }
                                        disabled={activateMutation.isPending}
                                      >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        {activateMutation.isPending
                                          ? "Activating..."
                                          : "Activate"}
                                      </DropdownMenuItem>
                                    </Can>

                                    <Can
                                      resource="tariff_version"
                                      action="delete"
                                    >
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => {
                                          setSelectedVersion(version);
                                          setDeleteOpen(true);
                                        }}
                                        disabled={deleteMutation.isPending}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </Can>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <DataTablePagination
                page={page}
                pageSize={pageSize}
                total={responseTotal}
                onPageChange={setPage}
                onPageSizeChange={(size: number) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Duplicate dialog */}

      <DuplicateTariffVersionDialog
        open={duplicateOpen}
        onOpenChange={(open) => {
          setDuplicateOpen(open);

          if (!open) {
            setSourceVersion(null);
          }
        }}
        sourceVersion={sourceVersion}
      />

      {/* Delete confirmation */}

      <Can resource="tariff_version" action="delete">
        <DeleteModal
          isOpen={deleteOpen}
          onClose={(open: boolean) => {
            setDeleteOpen(open);

            if (!open) {
              setSelectedVersion(null);
            }
          }}
          action={handleDelete}
        />
      </Can>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active tariff status
// ---------------------------------------------------------------------------

interface ActiveTariffStatusProps {
  message?: string | null;
}

export function ActiveTariffStatus({
  message,
}: ActiveTariffStatusProps) {
  if (!message) {
    return null;
  }

  const yearMatch = message.match(/^\d{4}/);
  const year = yearMatch?.[0];

  const parts = message.split("—").map((item) => item.trim());
  const headline = parts[0] ?? "";
  const detail = parts[1];

  const headlineWithoutYear = year
    ? headline.replace(year, "").trim()
    : headline;

  return (
    <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
      <span className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />

      <div className="flex items-start gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
          <Sparkles className="h-5 w-5" />

          <span className="absolute right-0 top-0 h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500 ring-2 ring-emerald-50 dark:ring-emerald-950" />
        </div>

        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700/80 dark:text-emerald-400/80">
            Active tariff
          </p>

          <p className="text-sm text-emerald-900 dark:text-emerald-200">
            {year && (
              <span className="mr-2 inline-flex rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                {year}
              </span>
            )}

            <span className="font-medium">
              {headlineWithoutYear}
            </span>
          </p>

          {detail && (
            <p className="text-xs text-emerald-800/70 dark:text-emerald-300/70">
              {detail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}