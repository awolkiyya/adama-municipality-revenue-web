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

import {
  TariffVersionFormDialog,
  TariffVersionFormValues,
} from "@/components/dialogs/TariffVersionFormDialog";

import DeleteModal from "@/components/dialogs/deleteModal";

import {
  useActivateTariffVersion,
  useCreateTariffVersion,
  useCurrentActiveTariff,
  useDeleteTariffVersion,
  useTariffVersions,
  useUpdateTariffVersion,
} from "@/hooks/revenue/revenueVersion.hook";

import { TariffVersion } from "@/types/revenue/tariff-version";

import { DataTablePagination } from "@/components/table/data-pagination";
import { formatEthiopianDate } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VersionStatus = "active" | "scheduled" | "archived";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getVersionStatus(
  version: TariffVersion
): VersionStatus {
  if (version.isActive) {
    return "active";
  }

  if (version.effectiveTo) {
    return "archived";
  }

  return "scheduled";
}

function versionDisplayName(
  year: number | string
): string {
  return `${year} Standard Tariff`;
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
    badgeClass:
      "gap-1 bg-muted text-muted-foreground hover:bg-muted",
    Icon: Archive,
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TariffVersionsPage() {
  const router = useRouter();

  // -------------------------------------------------------------------------
  // Dialog state
  // -------------------------------------------------------------------------

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [editingVersion, setEditingVersion] =
    useState<TariffVersion | null>(null);

  // -------------------------------------------------------------------------
  // Delete state
  // -------------------------------------------------------------------------

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [selectedVersion, setSelectedVersion] =
    useState<TariffVersion | null>(null);

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  const [query, setQuery] =
    useState("");

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(10);

  // -------------------------------------------------------------------------
  // API
  // -------------------------------------------------------------------------

  const {
    data: tariffResponse,
    isLoading,
  } = useTariffVersions({
    page,
    per_page: pageSize,
  });

  const {
    data: activeTariffResponse,
  } = useCurrentActiveTariff();

  const createMutation =
    useCreateTariffVersion();

  const updateMutation =
    useUpdateTariffVersion();

  const deleteMutation =
    useDeleteTariffVersion();

  const activateMutation =
    useActivateTariffVersion();

  // -------------------------------------------------------------------------
  // Normalize API response
  // -------------------------------------------------------------------------
  //
  // IMPORTANT:
  //
  // The current useTariffVersions() hook does not expose its generic
  // response type correctly to TypeScript. Therefore TypeScript sees
  // tariffResponse as NonNullable<TQueryFnData> instead of TariffVersion[].
  //
  // Runtime-wise, the API data used by this page is expected to be an array.
  //
  // This normalization prevents the page from spreading the incorrect
  // generic type throughout the component.
  // -------------------------------------------------------------------------

  const versions: TariffVersion[] =
    Array.isArray(tariffResponse)
      ? (tariffResponse as TariffVersion[])
      : [];

  // -------------------------------------------------------------------------
  // Active version
  // -------------------------------------------------------------------------

  const activeVersion =
    useMemo<TariffVersion | undefined>(
      () =>
        versions.find(
          (item: TariffVersion) =>
            item.isActive
        ),
      [versions]
    );

  // -------------------------------------------------------------------------
  // Existing years
  // -------------------------------------------------------------------------
  //
  // TariffVersion.year can be string | number.
  //
  // TariffVersionFormDialog.existingYears expects number[].
  //
  // Therefore Number() is required here.
  // -------------------------------------------------------------------------

  const existingYears =
    useMemo<number[]>(
      () =>
        versions
          .filter(
            (item: TariffVersion) =>
              item.id !==
              editingVersion?.id
          )
          .map(
            (item: TariffVersion) =>
              Number(item.year)
          )
          .filter(
            (year: number) =>
              Number.isFinite(year)
          ),
      [
        versions,
        editingVersion,
      ]
    );

  // -------------------------------------------------------------------------
  // Sort
  // -------------------------------------------------------------------------

  const sortedVersions =
    useMemo<TariffVersion[]>(
      () =>
        [...versions].sort(
          (
            a: TariffVersion,
            b: TariffVersion
          ) =>
            Number(b.year) -
            Number(a.year)
        ),
      [versions]
    );

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  const filteredVersions =
    useMemo<TariffVersion[]>(
      () => {
        const value =
          query
            .trim()
            .toLowerCase();

        if (!value) {
          return sortedVersions;
        }

        return sortedVersions.filter(
          (item: TariffVersion) =>
            String(item.year)
              .toLowerCase()
              .includes(value) ||
            String(item.name ?? "")
              .toLowerCase()
              .includes(value)
        );
      },
      [
        query,
        sortedVersions,
      ]
    );

  // -------------------------------------------------------------------------
  // Create dialog
  // -------------------------------------------------------------------------

  const openCreateDialog =
    () => {
      setEditingVersion(null);
      setDialogOpen(true);
    };

  // -------------------------------------------------------------------------
  // Edit dialog
  // -------------------------------------------------------------------------

  const openEditDialog = (
    version: TariffVersion
  ) => {
    setEditingVersion(version);
    setDialogOpen(true);
  };

  // -------------------------------------------------------------------------
  // Dialog open change
  // -------------------------------------------------------------------------

  const handleDialogOpenChange =
    (next: boolean) => {
      setDialogOpen(next);

      if (!next) {
        setEditingVersion(null);
      }
    };

  // -------------------------------------------------------------------------
  // Create / Update
  // -------------------------------------------------------------------------

  const handleSubmitVersion =
    async (
      values: TariffVersionFormValues
    ) => {
      if (editingVersion) {
        await updateMutation.mutateAsync({
          id: editingVersion.id,

          data: {
            year: Number(
              values.year
            ),

            name:
              versionDisplayName(
                values.year
              ),

            effective_from:
              values.effective_from,

            effective_to:
              values.effective_to ||
              null,

            isActive:
              values.isActive,
          },
        });
      } else {
        await createMutation.mutateAsync({
          year: Number(
            values.year
          ),

          version: 1,

          name:
            versionDisplayName(
              values.year
            ),

          effective_from:
            values.effective_from,

          effective_to:
            values.effective_to ||
            null,

          isActive:
            values.isActive,
        });
      }

      setDialogOpen(false);
      setEditingVersion(null);
    };

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  const handleDelete =
    async () => {
      if (!selectedVersion) {
        return;
      }

      await deleteMutation.mutateAsync(
        selectedVersion.id
      );

      setDeleteOpen(false);
      setSelectedVersion(null);
    };

  // -------------------------------------------------------------------------
  // Activate
  // -------------------------------------------------------------------------

  const handleActivate =
    async (
      id: string
    ) => {
      await activateMutation.mutateAsync(
        id
      );
    };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* ================================================================= */}
      {/* Banner */}
      {/* ================================================================= */}

      <Banner
        description="Manage yearly tariff versions. Each version keeps independent pricing rules for audit history and future changes."
        badge={
          <IconBadge
            className="gap-2 rounded-full bg-black/20 p-3 text-xs text-white"
            icon={
              <CalendarClock className="h-4 w-4" />
            }
          >
            Tariff Versions
          </IconBadge>
        }
        background={
          <FloatingParticles
            color="#040404"
            count={35}
            speed={0.2}
            connectDistance={100}
            position="bottom-right"
          />
        }
        overlayClassName="bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50"
        className="text-white"
        actions={
          <div className="flex gap-2">

            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  "/office/dashboard/revenue-managements/tariff-versions/trash"
                )
              }
            >
              <Archive className="mr-2 h-4 w-4" />
              Trash
            </Button>

            <Button
              onClick={
                openCreateDialog
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              New Tariff Version
            </Button>

          </div>
        }
      />

      {/* ================================================================= */}
      {/* Active tariff status */}
      {/* ================================================================= */}

      {activeTariffResponse?.data
        ?.message && (
        <ActiveTariffStatus
          message={
            activeTariffResponse
              .data.message
          }
        />
      )}

      {/* ================================================================= */}
      {/* Loading */}
      {/* ================================================================= */}

      {isLoading ? (
        <div className="space-y-4">

          <div className="h-20 animate-pulse rounded-xl border bg-muted/40" />

          {Array.from({
            length: 5,
          }).map(
            (
              _,
              index
            ) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl border bg-muted/40"
              />
            )
          )}

        </div>
      ) : versions.length ===
        0 ? (

        /* =============================================================== */
        /* Empty */
        /* =============================================================== */

        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Inbox className="h-5 w-5 text-muted-foreground" />
          </div>

          <p className="text-sm font-semibold">
            No tariff versions yet
          </p>

          <p className="text-xs text-muted-foreground">
            Create your first tariff version.
          </p>

          <Button
            size="sm"
            onClick={
              openCreateDialog
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            New Tariff Version
          </Button>

        </div>
      ) : (

        /* =============================================================== */
        /* List */
        /* =============================================================== */

        <>
          {/* ============================================================= */}
          {/* Search */}
          {/* ============================================================= */}

          <div className="relative">

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={query}
              onChange={(
                event
              ) => {
                setQuery(
                  event.target.value
                );

                setPage(1);
              }}
              placeholder="Search tariff year..."
              className="py-5 pl-9"
            />

          </div>

          {/* ============================================================= */}
          {/* Search result */}
          {/* ============================================================= */}

          {filteredVersions.length ===
          0 ? (

            <div className="rounded-xl border border-dashed px-6 py-10 text-center">

              <p className="text-sm text-muted-foreground">
                No versions match
                &quot;{query}&quot;
              </p>

            </div>

          ) : (

            /* =========================================================== */
            /* Table */
            /* =========================================================== */

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

                    {filteredVersions.map(
                      (
                        version: TariffVersion
                      ) => {

                        const status =
                          getVersionStatus(
                            version
                          );

                        const statusMeta =
                          STATUS_META[
                            status
                          ];

                        const StatusIcon =
                          statusMeta.Icon;

                        return (
                          <tr
                            key={
                              version.id
                            }
                            className="border-b transition last:border-none hover:bg-muted/40"
                          >

                            {/* Year */}

                            <td className="px-5 py-4">

                              <div className="flex items-center gap-2">

                                <div
                                  className={`flex h-9 w-14 items-center justify-center rounded-lg text-sm font-bold ${
                                    version.isActive
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  }`}
                                >
                                  {
                                    version.year
                                  }
                                </div>

                                {version.isActive && (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                )}

                              </div>

                            </td>

                            {/* Version */}

                            <td className="px-5 py-4">
                              v
                              {version.version ??
                                1}
                            </td>

                            {/* Effective period */}

                            <td className="px-5 py-4 text-muted-foreground">

                              <div>
                                {formatEthiopianDate(
                                  version.effectiveFrom
                                )}
                              </div>

                              <div className="text-xs">
                                →{" "}
                                {version.effectiveTo
                                  ? formatEthiopianDate(
                                      version.effectiveTo
                                    )
                                  : "Ongoing"}
                              </div>

                            </td>

                            {/* Status */}

                            <td className="px-5 py-4">

                              <Badge
                                className={
                                  statusMeta.badgeClass
                                }
                              >

                                <StatusIcon className="h-3 w-3" />

                                {
                                  statusMeta.label
                                }

                              </Badge>

                            </td>

                            {/* Rules */}

                            <td className="px-5 py-4">
                              {
                                version.tariffRulesCount ??
                                0
                              }
                            </td>

                            {/* Actions */}

                            <td className="px-5 py-4 text-right">

                              <DropdownMenu>

                                <DropdownMenuTrigger
                                  asChild
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                  align="end"
                                  className="w-48"
                                >

                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(
                                        `/office/dashboard/revenue-managements/tariff-versions/${version.id}`
                                      )
                                    }
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() =>
                                      openEditDialog(
                                        version
                                      )
                                    }
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Version
                                  </DropdownMenuItem>

                                  {!version.isActive && (
                                    <>
                                      <DropdownMenuSeparator />

                                      <DropdownMenuItem
                                        className="text-emerald-600"
                                        onClick={() =>
                                          handleActivate(
                                            version.id
                                          )
                                        }
                                        disabled={
                                          activateMutation.isPending
                                        }
                                      >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />

                                        {activateMutation.isPending
                                          ? "Activating..."
                                          : "Activate"}
                                      </DropdownMenuItem>

                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => {
                                          setSelectedVersion(
                                            version
                                          );

                                          setDeleteOpen(
                                            true
                                          );
                                        }}
                                        disabled={
                                          deleteMutation.isPending
                                        }
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                </DropdownMenuContent>

                              </DropdownMenu>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

              {/* Pagination */}

              <DataTablePagination
                page={page}
                pageSize={pageSize}
                total={
                  versions.length
                }
                onPageChange={
                  setPage
                }
                onPageSizeChange={(
                  size: number
                ) => {
                  setPageSize(
                    size
                  );

                  setPage(1);
                }}
              />

            </div>
          )}

        </>
      )}

      {/* ================================================================= */}
      {/* Create / Edit dialog */}
      {/* ================================================================= */}

      <TariffVersionFormDialog
        open={dialogOpen}
        onOpenChange={
          handleDialogOpenChange
        }
        existingYears={
          existingYears
        }
        hasActiveVersion={
          !!activeVersion
        }
        initialValues={
          editingVersion
            ? {
                year: String(
                  editingVersion.year
                ),

                effective_from:
                  editingVersion.effectiveFrom,

                effective_to:
                  editingVersion.effectiveTo ??
                  "",

                isActive:
                  editingVersion.isActive,
              }
            : undefined
        }
        onSubmit={
          handleSubmitVersion
        }
      />

      {/* ================================================================= */}
      {/* Delete modal */}
      {/* ================================================================= */}

      <DeleteModal
        isOpen={deleteOpen}
        onClose={(
          open: boolean
        ) => {
          setDeleteOpen(open);

          if (!open) {
            setSelectedVersion(
              null
            );
          }
        }}
        action={
          handleDelete
        }
      />

    </div>
  );
}

// ===========================================================================
// Active Tariff Status
// ===========================================================================

interface ActiveTariffStatusProps {
  message?: string | null;
}

export function ActiveTariffStatus({
  message,
}: ActiveTariffStatusProps) {
  if (!message) {
    return null;
  }

  const yearMatch =
    message.match(
      /^\d{4}/
    );

  const year =
    yearMatch?.[0];

  const parts =
    message
      .split("—")
      .map(
        (
          item: string
        ) => item.trim()
      );

  const headline =
    parts[0] ?? "";

  const detail =
    parts[1];

  const headlineWithoutYear =
    year
      ? headline
          .replace(
            year,
            ""
          )
          .trim()
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
              {
                headlineWithoutYear
              }
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