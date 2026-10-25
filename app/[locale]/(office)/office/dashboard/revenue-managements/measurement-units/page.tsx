"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { IconBadge } from "@/components/commen/icon-badge";
import { Button } from "@/components/ui/button";
import Can from "@/components/access/Can";

import { Loader2, Plus, Ruler } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CommenTable } from "@/components/table/CommenTable";
import type { CommentType } from "@/types/commen";
import { DataTablePagination } from "@/components/table/data-pagination";

import { RootState } from "@/lib/store/store";
import { resolveActions } from "@/components/table/permissions/ResolveActions";
import { CommentTableRegistry } from "@/components/table/registry";

import type { MeasurementUnit } from "@/types/revenue/revenue-unit";

import {
  useChangeMeasurementUnitStatus,
  useCreateMeasurementUnit,
  useMeasurementUnits,
  useUpdateMeasurementUnit,
} from "@/hooks/revenue/revenueUnit.hook";

import {
  MeasurementUnitDialog,
  type MeasurementUnitDialogMode,
} from "@/components/dialogs/MeasurementUnitDialog";

import AppFilterBar from "@/components/app-filter-bar";
import ProtectedRoute from "@/components/access/ProtectedRoute";

// ============================================================
// FILTER TYPES AND INITIAL VALUES
// ============================================================

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

type MeasurementUnitFilters = {
  status: StatusFilter;
};

const INITIAL_FILTERS: MeasurementUnitFilters = {
  status: "ALL",
};

// ============================================================
// PAGE CONTENT
// ============================================================

function MeasurementUnitsPageContent() {
  // ==========================================================
  // AUTH
  // ==========================================================

  const user = useSelector((state: RootState) => state.auth.user);

  // ==========================================================
  // DIALOG STATE
  // ==========================================================

  const [open, setOpen] = useState(false);

  const [dialogMode, setDialogMode] =
    useState<MeasurementUnitDialogMode>("create");

  const [selectedUnit, setSelectedUnit] =
    useState<MeasurementUnit | null>(null);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const [search, setSearch] = useState("");

  // ==========================================================
  // FILTER STATE
  // ==========================================================

  const [filters, setFilters] =
    useState<MeasurementUnitFilters>({
      ...INITIAL_FILTERS,
    });

  const [appliedFilters, setAppliedFilters] =
    useState<MeasurementUnitFilters>({
      ...INITIAL_FILTERS,
    });

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ==========================================================
  // MUTATIONS
  // ==========================================================

  const createMeasurementUnit = useCreateMeasurementUnit();

  const updateMeasurementUnit = useUpdateMeasurementUnit();

  const changeMeasurementUnitStatus =
    useChangeMeasurementUnitStatus();

  // ==========================================================
  // QUERY
  // ==========================================================

  const { data, isLoading } = useMeasurementUnits({
    page,
    per_page: pageSize,
    search,
    isActive:
      appliedFilters.status === "ACTIVE"
        ? true
        : appliedFilters.status === "INACTIVE"
          ? false
          : undefined,
  });

  // ==========================================================
  // DATA
  // ==========================================================

  const units = data?.data ?? [];
  const meta = data?.meta;

  // ==========================================================
  // TABLE DATA
  // ==========================================================

  const tableData = useMemo(
    () =>
      units.map((unit) => ({
        ...unit,
        id: unit.id,
        code: unit.code,
        name: unit.name,
        symbol: unit.symbol,
        description: unit.description,
        is_active: unit.is_active,
        sort_order: unit.sort_order,
      })),
    [units],
  );

  // ==========================================================
  // OPEN CREATE
  // ==========================================================

  const handleCreate = () => {
    setSelectedUnit(null);
    setDialogMode("create");
    setOpen(true);
  };

  // ==========================================================
  // CHANGE STATUS
  // ==========================================================

  const handleStatusChange = (row: MeasurementUnit) => {
    changeMeasurementUnitStatus.mutate({
      id: row.id,
      isActive: !row.is_active,
    });
  };

  // ==========================================================
  // OPEN EDIT
  // ==========================================================

  const handleEdit = (row: MeasurementUnit) => {
    setSelectedUnit(row);
    setDialogMode("edit");
    setOpen(true);
  };

  // ==========================================================
  // OPEN VIEW
  // ==========================================================

  const handleView = (row: MeasurementUnit) => {
    setSelectedUnit(row);
    setDialogMode("view");
    setOpen(true);
  };

  // ==========================================================
  // CLOSE DIALOG
  // ==========================================================

  const handleDialogChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      setSelectedUnit(null);
      setDialogMode("create");
    }
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = (formData: {
    name: string;
    symbol: string;
    is_active: boolean;
  }) => {
    if (dialogMode === "create") {
      createMeasurementUnit.mutate(formData, {
        onSuccess: () => {
          setOpen(false);
          setSelectedUnit(null);
          setDialogMode("create");
        },
      });

      return;
    }

    if (dialogMode === "edit" && selectedUnit) {
      updateMeasurementUnit.mutate(
        {
          id: selectedUnit.id,
          data: formData,
        },
        {
          onSuccess: () => {
            setOpen(false);
            setSelectedUnit(null);
            setDialogMode("create");
          },
        },
      );
    }
  };

  // ==========================================================
  // AUTH LOADING
  // ==========================================================

  if (!user?.role) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />

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

  // ==========================================================
  // TABLE ACTIONS
  // ==========================================================

  const actions = resolveActions(
    CommentTableRegistry.measurementUnit,
    user.permissions,
  );

  // ==========================================================
  // DIALOG LOADING
  // ==========================================================

  const isDialogLoading =
    createMeasurementUnit.isPending ||
    updateMeasurementUnit.isPending;

  // ==========================================================
  // FILTER HELPERS
  // ==========================================================

  const hasDraftFilterChanges =
    filters.status !== appliedFilters.status;

  const hasAppliedFilters =
    appliedFilters.status !== INITIAL_FILTERS.status;

  const activeFilterCount = hasAppliedFilters ? 1 : 0;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="m-auto max-w-4xl space-y-6">
      {/* HEADER */}

      <Banner
        description="Configure and manage measurement units used for revenue calculations, tariffs, and service assessments."
        badge={
          <IconBadge
            className="gap-2 rounded-full p-3 text-[10px]"
            icon={<Ruler className="h-3 w-3" />}
          >
            Measurement Units
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
        actions={
          <Can resource="measurement_units" action="create">
            <Button variant="default" onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              Create New
            </Button>
          </Can>
        }
        overlayClassName="bg-transparent"
      />

      {/* FILTERS */}

      <AppFilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search measurement units..."
        searchLabel="Search measurement units"
        title="Search and filter"
        description="Find measurement units by name, code, symbol, or status."
        activeFilterCount={activeFilterCount}
        hasFilters={hasAppliedFilters || hasDraftFilterChanges}
        onApply={() => {
          setAppliedFilters({ ...filters });
          setPage(1);
        }}
        onClear={() => {
          setSearch("");
          setFilters({ ...INITIAL_FILTERS });
          setAppliedFilters({ ...INITIAL_FILTERS });
          setPage(1);
        }}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>

          <Select
            value={filters.status}
            onValueChange={(value) => {
              if (
                value !== "ALL" &&
                value !== "ACTIVE" &&
                value !== "INACTIVE"
              ) {
                return;
              }

              setFilters((current) => ({
                ...current,
                status: value,
              }));
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </AppFilterBar>

      {/* TABLE */}

      <CommenTable
        type={"measurementUnit" as CommentType}
        data={tableData}
        page={page}
        pageSize={pageSize}
        isLoading={isLoading}
        actions={actions}
        onView={handleView}
        onEdit={handleEdit}
        onToggleStatus={handleStatusChange}
        onDelete={(id) => {
          console.log("delete", id);
        }}
      />

      {/* PAGINATION */}

      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={meta?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {/* DIALOG */}

      <MeasurementUnitDialog
        open={open}
        onOpenChange={handleDialogChange}
        mode={dialogMode}
        unit={selectedUnit}
        isLoading={isDialogLoading}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

// ============================================================
// PROTECTED PAGE ENTRY POINT
// ============================================================

export default function MeasurementUnitsPage() {
  return (
    <ProtectedRoute resource="measurement_units" action="view">
      <MeasurementUnitsPageContent />
    </ProtectedRoute>
  );
}