"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { PlusCircle, Layers, CircleDot } from "lucide-react";
import { toast } from "sonner";

import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { IconBadge } from "@/components/commen/icon-badge";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CommenTable } from "@/components/table/CommenTable";
import { DataTablePagination } from "@/components/table/data-pagination";

import type { CommentType } from "@/types/commen";
import type { RootState } from "@/lib/store/store";
import { resolveActions } from "@/components/table/permissions/ResolveActions";
import { CommentTableRegistry } from "@/components/table/registry";

import { ClusterDropdown } from "@/components/input/ClusterDropdown";
import type { Cluster, Sector } from "@/types/admin-unit";

import {
  useCreateSector,
  useDeleteSector,
  useSectors,
  useUpdateSector,
} from "@/hooks/useAdminUnit.hook";

import { SectorDialog } from "@/components/dialogs/SectorModal";
import { SectorDetailsDialog } from "@/components/dialogs/SectorDetailsDialog";
import { APP_PERMISSIONS } from "@/lib/authorization";
import ProtectedRoute from "@/components/access/ProtectedRoute";
import DeleteModal from "@/components/dialogs/deleteModal";
import AppFilterBar from "@/components/app-filter-bar";

import type { SectorFormData } from "@/lib/zod-forms/sector.schema";

/* =====================================================
   FILTER OPTIONS
===================================================== */

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
] as const;

type SectorStatus = "ALL" | "ACTIVE" | "INACTIVE";

type SectorFilters = {
  status: SectorStatus;
};

const INITIAL_FILTERS: SectorFilters = {
  status: "ALL",
};

/* =====================================================
   PAGE CONTENT
===================================================== */

function SectorPageContent() {
  const user = useSelector(
    (state: RootState) => state.auth.user,
  );

  /* ===================================================
     CREATE / EDIT DIALOG
  =================================================== */

  const [open, setOpen] = useState(false);
  const [selectedSector, setSelectedSector] =
    useState<Sector | null>(null);

  /* ===================================================
     DETAILS DIALOG
  =================================================== */

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsSector, setDetailsSector] =
    useState<Sector | null>(null);

  /* ===================================================
     DELETE DIALOG
  =================================================== */

  const [deleteTarget, setDeleteTarget] =
    useState<Sector | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] =
    useState(false);

  /* ===================================================
     SEARCH
  =================================================== */

  const [search, setSearch] = useState("");

  /* ===================================================
     STATUS FILTER
  =================================================== */

  const [draftFilters, setDraftFilters] =
    useState<SectorFilters>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<SectorFilters>(INITIAL_FILTERS);

  /* ===================================================
     CLUSTER FILTER
  =================================================== */

  // Draft selection only changes the filter UI.
  const [draftCluster, setDraftCluster] =
    useState<Cluster | null>(null);

  // Applied selection is used by the server query.
  const [appliedCluster, setAppliedCluster] =
    useState<Cluster | null>(null);

  /* ===================================================
     PAGINATION
  =================================================== */

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ===================================================
     FILTER STATE
  =================================================== */

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (appliedFilters.status !== "ALL") {
      count += 1;
    }

    if (appliedCluster) {
      count += 1;
    }

    return count;
  }, [appliedFilters.status, appliedCluster]);

  const hasAppliedFilters = activeFilterCount > 0;

  const hasPendingChanges =
    draftFilters.status !== appliedFilters.status ||
    (draftCluster?.id ?? null) !==
      (appliedCluster?.id ?? null);

  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setAppliedCluster(draftCluster);
    setPage(1);
  };

  const clearFilters = () => {
    setDraftFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setDraftCluster(null);
    setAppliedCluster(null);
    setPage(1);
  };

  /* ===================================================
     MUTATIONS
  =================================================== */

  const createSector = useCreateSector();
  const updateSector = useUpdateSector();
  const deleteSector = useDeleteSector();

  /* ===================================================
     FETCH SECTORS
  =================================================== */

  const {
    data,
    isLoading,
    isError,
  } = useSectors({
    page,
    per_page: pageSize,
    search,
    cluster_id: appliedCluster?.id,
    is_active:
      appliedFilters.status === "ACTIVE"
        ? true
        : appliedFilters.status === "INACTIVE"
          ? false
          : undefined,
    sort_by: "name",
    sort_order: "asc",
  });

  const sectors = data?.data ?? [];
  const meta = data?.meta;

  /* ===================================================
     TABLE DATA
  =================================================== */

  const tableData = useMemo(
    () =>
      sectors.map((sector) => ({
        ...sector,
        id: sector.id,
        name: sector.name,
        cluster_name: sector.cluster?.name ?? "-",
        cluster: sector.cluster,
        code: sector.code,
        is_active:sector.is_active
      })),
    [sectors],
  );

  /* ===================================================
     TABLE ACTIONS
  =================================================== */

  const actions = resolveActions(
    CommentTableRegistry.sector,
    user?.permissions ?? [],
  );

  /* ===================================================
     CREATE
  =================================================== */

  const handleCreate = () => {
    setSelectedSector(null);
    setOpen(true);
  };

  /* ===================================================
     EDIT
  =================================================== */

  const handleEdit = (row: Sector) => {
    const sector = sectors.find(
      (item) => item.id === row.id,
    );

    if (!sector) {
      toast.error("Sector not found on the current page");
      return;
    }

    setSelectedSector(sector);
    setOpen(true);
  };

  /* ===================================================
     VIEW DETAILS
  =================================================== */

  const handleView = (row: Sector) => {
    const sector = sectors.find(
      (item) => item.id === row.id,
    );

    if (!sector) {
      toast.error("Sector not found on the current page");
      return;
    }

    setDetailsSector(sector);
    setDetailsOpen(true);
  };

  /* ===================================================
     SUBMIT CREATE / UPDATE
  =================================================== */

  const handleSubmit = (formData: SectorFormData) => {
    if (selectedSector) {
      updateSector.mutate(
        {
          id: selectedSector.id,
          data: formData,
        },
        {
          onSuccess: () => {
            toast.success("Sector updated successfully");
            setOpen(false);
            setSelectedSector(null);
          },
          onError: (error: Error) => {
            toast.error(
              error.message || "Failed to update sector",
            );
          },
        },
      );

      return;
    }

    createSector.mutate(formData, {
      onSuccess: () => {
        toast.success("Sector created successfully");
        setOpen(false);
        setSelectedSector(null);
      },
      onError: (error: Error) => {
        toast.error(
          error.message || "Failed to create sector",
        );
      },
    });
  };

  /* ===================================================
     DELETE
  =================================================== */

  const handleDelete = (id: string) => {
    const sector = sectors.find(
      (item) => item.id === id,
    );

    if (!sector) {
      toast.error("Sector not found on the current page");
      return;
    }

    setDeleteTarget(sector);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget || deleteSector.isPending) {
      return;
    }

    deleteSector.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Sector deleted successfully");
        setDeleteModalOpen(false);
        setDeleteTarget(null);
      },
      onError: (error: Error) => {
        toast.error(
          error.message || "Failed to delete sector",
        );
      },
    });
  };

  /* ===================================================
     USER CHECK
  =================================================== */

  if (!user?.role) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-3 text-center">
        <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />

        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium text-foreground">
            Checking permissions
          </p>

          <p className="text-xs text-muted-foreground">
            This will only take a moment
          </p>
        </div>
      </div>
    );
  }

  /* ===================================================
     ERROR
  =================================================== */

  if (isError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold text-destructive">
            Failed to load sectors
          </p>

          <p className="text-xs text-muted-foreground">
            Please try again later.
          </p>
        </div>
      </div>
    );
  }

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* HEADER */}

      <Banner
        description="Manage revenue sectors used to classify and collect municipal revenue across the city."
        badge={
          <IconBadge
            className="gap-2 rounded-full p-3 text-[10px]"
            icon={<Layers className="h-3 w-3" />}
          >
            Sector Revenue Collection
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
          <Button onClick={handleCreate}>
            <PlusCircle />
            Add New Sector
          </Button>
        }
      />

      {/* SEARCH AND FILTERS */}

      <div className="w-full min-w-0 lg:flex-1 [&>*]:w-full">
        <AppFilterBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Search sectors by name or code..."
          searchLabel="Search sectors"
          title="Search and filter"
          description="Find sectors by name, code, cluster, or activity status."
          activeFilterCount={activeFilterCount}
          hasFilters={hasAppliedFilters || hasPendingChanges}
          onApply={applyFilters}
          onClear={clearFilters}
        >
          <div className="space-y-4">
            {/* Status filter */}

            <div className="space-y-2">
              <label
                className="flex items-center gap-2 text-sm font-medium"
                htmlFor="sector-status"
              >
                <CircleDot className="h-4 w-4 text-muted-foreground" />
                Status
              </label>

              <Select
                value={draftFilters.status}
                onValueChange={(value) => {
                  setDraftFilters((current) => ({
                    ...current,
                    status: value as SectorStatus,
                  }));
                }}
              >
                <SelectTrigger
                  id="sector-status"
                  className="w-full py-5"
                >
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="ALL">
                    All statuses
                  </SelectItem>

                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cluster filter */}

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Cluster
              </label>

              <ClusterDropdown
                value={draftCluster?.id ?? null}
                onChange={(_value: string, item: Cluster) => {
                  setDraftCluster(item);
                }}
              />
            </div>
          </div>
        </AppFilterBar>
      </div>

      {/* SECTORS TABLE */}

      <CommenTable
        type={"sector" as CommentType}
        data={tableData}
        page={meta?.current_page ?? page}
        pageSize={meta?.per_page ?? pageSize}
        isLoading={isLoading}
        actions={actions}
        onView={handleView}
        onEdit={handleEdit}
      />

      {/* PAGINATION */}

      <DataTablePagination
        page={meta?.current_page ?? page}
        pageSize={meta?.per_page ?? pageSize}
        total={meta?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {/* CREATE / EDIT DIALOG */}

      <SectorDialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);

          if (!isOpen) {
            setSelectedSector(null);
          }
        }}
        sector={selectedSector}
        isLoading={
          createSector.isPending || updateSector.isPending
        }
        onSubmit={handleSubmit}
      />

      {/* SECTOR DETAILS DIALOG */}

      <SectorDetailsDialog
        open={detailsOpen}
        onOpenChange={(isOpen) => {
          setDetailsOpen(isOpen);

          if (!isOpen) {
            setDetailsSector(null);
          }
        }}
        sector={detailsSector}
      />

    </div>
  );
}

/* =====================================================
   PROTECTED PAGE
===================================================== */

export default function SectorPage() {
  return (
    <ProtectedRoute
      resource={APP_PERMISSIONS.SECTORS_VIEW.resource}
      action={APP_PERMISSIONS.SECTORS_VIEW.action}
    >
      <SectorPageContent />
    </ProtectedRoute>
  );
}