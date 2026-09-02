"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import {
  ShieldCheck,
  Plus,
  MoreHorizontal,
  Power,
  Trash2,
  Loader2,
  AlertCircle,
  Building2,
  CircleDot,
  Wrench,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { ServiceAccessDialog } from "@/components/dialogs/ServiceAccessDialog";

import { useRevenueService } from "@/hooks/revenue/revenueService.hook";

import DeleteModal from "@/components/dialogs/deleteModal";

import { SectorDropdown } from "@/components/input/SectorDropDown";

import { Sector } from "@/types/admin-unit";
import { FilterField } from "@/types/commen";

import { Toolbar } from "@/components/commen/Toolbar";
import { ServiceOverviewCard } from "@/components/cards/ServiceOverviewCard";
import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { FloatingParticles } from "@/components/design/FloatingParticles";

import {
  ServiceAccessRule,
  ServiceAccessRuleSummary,
} from "@/types/revenue/service-access-rule";

import { DataTablePagination } from "@/components/table/data-pagination";

import {
  useCreateServiceAccessRule,
  useDeleteServiceAccessRule,
  useServiceAccessRules,
  useUpdateServiceAccessRule,
} from "@/hooks/revenue/revenueServiceAccessRule.hook";

import { SearchInput } from "@/components/input/SearchInput";
import { FilterSheet } from "@/components/commen/FilterSheet";
import { cn } from "@/lib/utils";
import { useSectors } from "@/hooks/useAdminUnit.hook";

/* =========================================================
   TYPES
========================================================= */

interface AccessRuleFormValues {
  sectorId: string;
  isActive: boolean;
}

/* =========================================================
   STATIC CONFIG
========================================================= */

export const sectorFilters: FilterField[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    defaultValue: "ALL",
    icon: CircleDot,
    options: [
      {
        label: "All",
        value: "ALL",
      },
      {
        label: "Allowed",
        value: "ACTIVE",
      },
      {
        label: "Not Allowed",
        value: "INACTIVE",
      },
    ],
  },
];

const INITIAL_FILTERS = {
  status: "ALL",
};

/* =========================================================
   PAGE
========================================================= */

export default function ServiceAccessPage() {
  const params = useParams<{ id: string }>();

  const serviceId = params.id;

  /* =======================================================
     SERVICE
  ======================================================= */

  const {
    data: serviceResponse,
    isLoading: isServiceLoading,
    isError: isServiceError,
  } = useRevenueService(serviceId);

  const service = serviceResponse?.data;

  /* =======================================================
     ACCESS RULES
  ======================================================= */

  const {
    data: rulesResponse,
    isLoading: isRulesLoading,
    refetch,
  } = useServiceAccessRules(serviceId);

  const rows = rulesResponse?.data ?? [];

  const summary =
    rulesResponse?.meta?.summary as
      | ServiceAccessRuleSummary
      | undefined;

  const meta = rulesResponse?.meta;

  /* =======================================================
     MUTATIONS
  ======================================================= */

  const createRule =
    useCreateServiceAccessRule();

  const updateRule =
    useUpdateServiceAccessRule();

  const deleteRule =
    useDeleteServiceAccessRule();

  /* =======================================================
     FILTERS
  ======================================================= */

  const [search, setSearch] =
    useState("");

  const [filters, setFilters] =
    useState<Record<string, any>>(
      INITIAL_FILTERS
    );

  const [sectorFilter, setSectorFilter] =
    useState<string | null>(null);

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(10);


    /* ===================================================
   FETCH SECTORS
=================================================== */

const {
  data: sectorsResponse,
  isLoading: isSectorsLoading,
  isError: isSectorsError,
} = useSectors({
  page: 1,
  per_page: 1000,
  search: "",
  // cluster_id: cluster?.id,
  is_active: true,
  sort_by: "name",
  sort_order: "asc",
});

const sectors = sectorsResponse?.data ?? [];

  /* =======================================================
     SELECTION
  ======================================================= */

  const [selectedIds, setSelectedIds] =
    useState<Set<string>>(new Set());

  /* =======================================================
     DIALOGS
  ======================================================= */

  const [addOpen, setAddOpen] =
    useState(false);

  const [editingRule, setEditingRule] =
    useState<ServiceAccessRule | null>(
      null
    );

  const [removing, setRemoving] =
    useState<ServiceAccessRule[] | null>(
      null
    );

  /* =======================================================
     FILTERED ROWS
  ======================================================= */

  const hasFiltersApplied =
    search.trim() !== "" ||
    filters.status !== "ALL" ||
    sectorFilter !== null;

  const filtered = useMemo(() => {
    const term =
      search.trim().toLowerCase();

    return rows.filter((row) => {
      /* ---------------------------------------------------
         STATUS
      --------------------------------------------------- */

      if (
        filters.status === "ACTIVE" &&
        !row.isActive
      ) {
        return false;
      }

      if (
        filters.status === "INACTIVE" &&
        row.isActive
      ) {
        return false;
      }

      /* ---------------------------------------------------
         SECTOR
      --------------------------------------------------- */

      if (
        sectorFilter &&
        row.sector.id !== sectorFilter
      ) {
        return false;
      }

      /* ---------------------------------------------------
         SEARCH
      --------------------------------------------------- */

      if (term) {
        const haystack =
          row.sector.name.toLowerCase();

        if (!haystack.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [
    rows,
    search,
    filters.status,
    sectorFilter,
  ]);

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {
    setSearch("");

    setFilters({
      ...INITIAL_FILTERS,
    });

    setSectorFilter(null);

    setPage(1);
  };

  /* =======================================================
     SELECTION
  ======================================================= */

  const toggleSelected = (
    id: string
  ) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const allSelected =
        filtered.length > 0 &&
        filtered.every((row) =>
          prev.has(row.id)
        );

      if (allSelected) {
        const next = new Set(prev);

        filtered.forEach((row) =>
          next.delete(row.id)
        );

        return next;
      }

      const next = new Set(prev);

      filtered.forEach((row) =>
        next.add(row.id)
      );

      return next;
    });
  };

  /* =======================================================
     STATUS TOGGLE
  ======================================================= */

  const handleStatusToggle = async (
    row: ServiceAccessRule
  ) => {
    try {
      await updateRule.mutateAsync({
        serviceId,
        ruleId: row.id,
        data: {
          is_active: !row.isActive,
        },
      });

      await refetch();
    } catch (err) {
      console.error(
        "Failed to update sector access:",
        err
      );
    }
  };

  /* =======================================================
     BULK STATUS
  ======================================================= */

  const handleBulkStatus = async (
    isActive: boolean
  ) => {
    const targets = rows.filter((row) =>
      selectedIds.has(row.id)
    );

    if (!targets.length) {
      return;
    }

    try {
      await Promise.all(
        targets.map((row) =>
          updateRule.mutateAsync({
            serviceId,
            ruleId: row.id,
            data: {
              is_active: isActive,
            },
          })
        )
      );

      await refetch();
    } catch (err) {
      console.error(
        "Failed to update sector access:",
        err
      );
    } finally {
      setSelectedIds(new Set());
    }
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleConfirmRemove = async () => {
    if (!removing) {
      return;
    }

    try {
      await Promise.all(
        removing.map((row) =>
          deleteRule.mutateAsync({
            serviceId,
            ruleId: row.id,
          })
        )
      );

      await refetch();

      setSelectedIds((prev) => {
        const next = new Set(prev);

        removing.forEach((row) =>
          next.delete(row.id)
        );

        return next;
      });
    } catch (err) {
      console.error(
        "Failed to remove sector access rule(s):",
        err
      );
    } finally {
      setRemoving(null);
    }
  };

  /* =======================================================
     CREATE / UPDATE
  ======================================================= */

  const handleCreateOrUpdate = async (
    values: AccessRuleFormValues,
    ruleId?: string
  ) => {
    const data = {
      sector_id: values.sectorId,
      is_active: values.isActive,
    };

    if (ruleId) {
      await updateRule.mutateAsync({
        serviceId,
        ruleId,
        data,
      });
    } else {
      await createRule.mutateAsync({
        serviceId,
        data,
      });
    }

    await refetch();

    setAddOpen(false);
    setEditingRule(null);
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (isServiceLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading service...
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    isServiceError ||
    !service
  ) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
        <AlertCircle className="h-7 w-7 text-destructive" />

        <p className="font-medium">
          Failed to load revenue service
        </p>
      </div>
    );
  }

  /* =======================================================
     DIALOG DATA
  ======================================================= */

  const existingAccessForDialog =
    rows.map((row) => ({
      id: row.id,
      sectorId: row.sector.id,
      isActive: row.isActive,
    }));

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">

      {/* =====================================================
          BANNER
      ===================================================== */}

      <Banner
        description="Control which sectors are allowed to access this revenue service."
        badge={
          <IconBadge
            className="gap-2 rounded-full bg-black/20 p-3 text-xs text-white"
            icon={
              <Wrench className="h-4 w-4" />
            }
          >
            Service Access
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
          <Button
            onClick={() => setAddOpen(true)}
            className="gap-2 py-5"
          >
            <Plus size={16} />
            Add sector
          </Button>
        }
      />

      {/* =====================================================
          SERVICE OVERVIEW
      ===================================================== */}

      <ServiceOverviewCard
        service={service}
        activeCount={
          summary?.active ?? 0
        }
        inactiveCount={
          summary?.inactive ?? 0
        }
        sectorsCount={
          summary?.sectors ?? 0
        }
        totalRulesCount={
          summary?.total ?? 0
        }
        defaultOpen={false}
      />

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <Toolbar
        search={
          <SearchInput
            placeholder="Search sector..."
            value={search}
            onChange={(e) => {
              setSearch(
                e.target.value
              );

              setPage(1);
            }}
          />
        }
        right={
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            {/* -----------------------------------------------
                SECTOR FILTER
            ----------------------------------------------- */}

            <div className="max-w-full">
              <SectorDropdown
                value={sectorFilter}
                onChange={(
                  value: string,
                  _item: Sector
                ) => {
                  setSectorFilter(value);

                  setPage(1);
                }}
              />
            </div>

            {/* -----------------------------------------------
                STATUS FILTER
            ----------------------------------------------- */}

            <div className="flex-1">
              <FilterSheet
                schema={sectorFilters}
                value={filters}
                defaultValues={
                  INITIAL_FILTERS
                }
                onChange={(next: any) => {
                  setFilters(next);

                  setPage(1);
                }}
                title="Filter Sector Access"
                description="Filter sectors by access status."
              />
            </div>
          </div>
        }
      />

      {/* =====================================================
          BULK ACTION BAR
      ===================================================== */}

      {selectedIds.size > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">
            {selectedIds.size} selected
          </p>

          <div className="flex flex-wrap items-center gap-2">

            {/* ALLOW */}

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                handleBulkStatus(true)
              }
            >
              <Power className="mr-1.5 h-3.5 w-3.5" />
              Allow
            </Button>

            {/* NOT ALLOW */}

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                handleBulkStatus(false)
              }
            >
              <Power className="mr-1.5 h-3.5 w-3.5" />
              Not Allow
            </Button>

            {/* REMOVE */}

            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() =>
                setRemoving(
                  rows.filter((row) =>
                    selectedIds.has(
                      row.id
                    )
                  )
                )
              }
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Remove
            </Button>

            {/* CLEAR */}

            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setSelectedIds(
                  new Set()
                )
              }
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* =====================================================
          TABLE
      ===================================================== */}

      {isRulesLoading ? (
        <div className="flex min-h-[200px] items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading sector access...
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck size={22} />
            </div>

            <p className="font-medium">
              No sector access rules yet
            </p>

            <p className="max-w-sm text-sm text-muted-foreground">
              Add a sector to control whether it
              is allowed to access this revenue
              service.
            </p>

            <Button
              onClick={() =>
                setAddOpen(true)
              }
              className="mt-2 gap-2"
            >
              <Plus size={16} />
              Add sector
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              {/* =================================================
                  HEADER
              ================================================= */}

              <thead className="sticky top-0 z-10 border-b bg-muted/50">
                <tr>

                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={
                        filtered.length > 0 &&
                        filtered.every(
                          (row) =>
                            selectedIds.has(
                              row.id
                            )
                        )
                      }
                      onCheckedChange={
                        toggleSelectAllFiltered
                      }
                      aria-label="Select all visible rules"
                    />
                  </th>

                  <th className="px-4 py-3 text-left">
                    Sector
                  </th>

                  <th className="px-6 py-3 text-center">
                    Access
                  </th>

                  <th className="w-10" />

                </tr>
              </thead>

              {/* =================================================
                  BODY
              ================================================= */}

              <tbody className="divide-y">

                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-14"
                    >
                      <div className="flex flex-col items-center gap-2 text-center">

                        <p className="font-medium text-muted-foreground">
                          No sector access rules
                          match your filters.
                        </p>

                        {hasFiltersApplied && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={
                              clearFilters
                            }
                          >
                            Clear filters
                          </Button>
                        )}

                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.id}
                      className="transition hover:bg-muted/30"
                    >

                      {/* =========================================
                          SELECT
                      ========================================= */}

                      <td className="px-4 py-4">
                        <Checkbox
                          checked={selectedIds.has(
                            row.id
                          )}
                          onCheckedChange={() =>
                            toggleSelected(
                              row.id
                            )
                          }
                          aria-label={`Select ${row.sector.name}`}
                        />
                      </td>

                      {/* =========================================
                          SECTOR
                      ========================================= */}

                      <td className="px-4 py-4">

                        <div className="flex min-w-0 items-center gap-3">

                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                              row.isActive
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <Building2 size={16} />
                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-medium">
                              {row.sector.name}
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {row.isActive
                                ? "This sector can access the service"
                                : "This sector cannot access the service"}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* =========================================
                          ACCESS
                      ========================================= */}

                      <td className="px-6 py-4 text-center">

                        <Badge
                          variant={
                            row.isActive
                              ? "default"
                              : "secondary"
                          }
                        >
                          {row.isActive
                            ? "Allowed"
                            : "Not Allowed"}
                        </Badge>

                      </td>

                      {/* =========================================
                          ACTIONS
                      ========================================= */}

                      <td className="px-6 py-4 text-right">

                        <DropdownMenu>

                          <DropdownMenuTrigger
                            asChild
                          >
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Row actions"
                            >
                              <MoreHorizontal
                                size={16}
                              />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">

                            {/* EDIT */}

                            <DropdownMenuItem
                              onClick={() =>
                                setEditingRule(
                                  row
                                )
                              }
                            >
                              <Building2 className="mr-2 h-4 w-4" />
                              Edit Sector
                            </DropdownMenuItem>

                            {/* ALLOW / NOT ALLOW */}

                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusToggle(
                                  row
                                )
                              }
                            >
                              <Power className="mr-2 h-4 w-4" />

                              {row.isActive
                                ? "Not Allow"
                                : "Allow"}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* REMOVE */}

                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                setRemoving([
                                  row,
                                ])
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>

                          </DropdownMenuContent>
                        </DropdownMenu>

                      </td>

                    </tr>
                  ))
                )}

              </tbody>
            </table>

          </div>
        </Card>
      )}

      {/* =====================================================
          PAGINATION
      ===================================================== */}

      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={
          meta?.total ??
          rows.length
        }
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {/* =====================================================
          ADD / EDIT DIALOG
      ===================================================== */}

      <ServiceAccessDialog
        open={
          addOpen ||
          !!editingRule
        }
        onOpenChange={(value) => {
          if (!value) {
            setAddOpen(false);
            setEditingRule(null);
          }
        }}
        sectors={sectors}
        serviceName={service.name}
        existingAccess={
          existingAccessForDialog
        }
        editingRule={
          editingRule
            ? {
                id: editingRule.id,
                sectorId:
                  editingRule.sector.id,
                isActive:
                  editingRule.isActive,
              }
            : null
        }
        onSubmit={
          handleCreateOrUpdate
        }
      />

      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      <DeleteModal
        isOpen={!!removing}
        onClose={() =>
          setRemoving(null)
        }
        action={
          handleConfirmRemove
        }
      />

    </div>
  );
}

