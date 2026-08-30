"use client";

import { useMemo, useState } from "react";

import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { IconBadge } from "@/components/commen/icon-badge";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { CircleDot, Loader2, Plus, Ruler, Search, Tag } from "lucide-react";

import { Filters } from "@/components/commen/Filters";
import { Toolbar } from "@/components/commen/Toolbar";
import { ExportDropdown } from "@/components/commen/ExportDropdown";

import { CommenTable } from "@/components/table/CommenTable";
import { CommentType, FilterField } from "@/types/commen";
import { DataTablePagination } from "@/components/table/data-pagination";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { resolveActions } from "@/components/table/permissions/ResolveActions";
import { CommentTableRegistry } from "@/components/table/registry";

import { MeasurementUnit } from "@/types/revenue/revenue-unit";

import { toast } from "sonner";
import { useCreateMeasurementUnit, useMeasurementUnits, useUpdateMeasurementUnit } from "@/hooks/revenue/revenueUnit.hook";

/**
 * ASSUMPTIONS — same caveat as the Base Fields page: these names weren't
 * given, so they're inferred from the Sector/Base Fields conventions.
 * Rename if your codebase differs:
 *
 * - Hooks: useMeasurementUnits / useCreateMeasurementUnit / useUpdateMeasurementUnit
 *   from "@/hooks/useRevenue.hook"
 * - Dialog: MeasurementUnitDialog from "@/components/dialogs/MeasurementUnitModal"
 *   (same prop shape as SectorDialog: open, onOpenChange, unit, isLoading, onSubmit)
 * - Registry key: CommentTableRegistry.measurementUnit
 * - Table type: "measurementUnit"
 * - MeasurementUnit fields referenced below: id, name, symbol, category, is_active
 */

/* =========================
   FILTERS
========================= */
export const measurementUnitFilters: FilterField[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    defaultValue: "ALL",
    icon: CircleDot,
    options: [
      { label: "All", value: "ALL" },
      { label: "Active", value: "ACTIVE" },
      { label: "Inactive", value: "INACTIVE" },
    ],
  },
  {
    key: "category",
    label: "Category",
    type: "select",
    defaultValue: "ALL",
    icon: Tag,
    options: [
      { label: "All Categories", value: "ALL" },
      { label: "Area", value: "AREA" },
      { label: "Length", value: "LENGTH" },
      { label: "Weight", value: "WEIGHT" },
      { label: "Volume", value: "VOLUME" },
      { label: "Count", value: "COUNT" },
    ],
  },
];

const INITIAL_FILTERS = {
  status: "ALL",
  category: "ALL",
};

/* =========================
   SEARCH INPUT
========================= */
export function SearchInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className={`w-full py-5 pl-9 ${className ?? ""}`} {...props} />
    </div>
  );
}

/* =========================
   PAGE
========================= */
export default function MeasurementUnitsPage() {
  const user = useSelector((state: RootState) => state.auth.user);

  const [open, setOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<MeasurementUnit | null>(null);

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState<Record<string, any>>(INITIAL_FILTERS);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const createMeasurementUnit = useCreateMeasurementUnit();
  const updateMeasurementUnit = useUpdateMeasurementUnit();

  const { data, isLoading } = useMeasurementUnits({
    page,
    per_page: pageSize,

    search,
    isActive:
      filters.status === "ACTIVE"
        ? true
        : filters.status === "INACTIVE"
          ? false
          : undefined,

  });

  const units = data?.data ?? [];
  const meta = data?.meta;

  /* =========================
     TABLE DATA
  ========================= */
  const tableData = useMemo(() => {
    return units.map((unit) => ({
      ...unit,

      id: unit.id,
      name: unit.name,
      symbol: unit.symbol,
    }));
  }, [units]);

  if (!user?.role) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium text-foreground">Checking permissions</p>
          <p className="text-xs text-muted-foreground">This will only take a moment</p>
        </div>
      </div>
    );
  }

  const actions = resolveActions(CommentTableRegistry.measurementUnit, user.role.name);
  // role based action here

  return (
    <div className="m-auto max-w-5xl space-y-6">
      {/* ================= HEADER ================= */}
      <Banner
        description="Configure and manage measurement units used for revenue calculations, tariffs, and service assessments."
        badge={
          <IconBadge
            className="gap-2 rounded-full bg-black/20 p-3 text-[10px] text-white"
            icon={<Ruler className="h-3 w-3" />}
          >
            {"Measurement Units"}
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
          <Button
            variant="outline"
            onClick={() => {
              setSelectedUnit(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Create New
          </Button>
        }
        overlayClassName="bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50"
        className="text-white"
      />

      {/* ================= TOOLBAR ================= */}
      <Toolbar
        search={
          <SearchInput
            placeholder="Search measurement units..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        }
        right={
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Filters */}
            <div className="flex-1">
              <Filters
                schema={measurementUnitFilters}
                value={filters}
                onChange={(next) => {
                  setFilters(next);
                  setPage(1);
                }}
                onReset={() => {
                  setFilters(INITIAL_FILTERS);
                  setPage(1);
                }}
              />
            </div>
          </div>
        }
      />

      {/* ================= TABLE ================= */}
      <CommenTable
        type={"measurementUnit" as CommentType}
        data={tableData}
        page={page}
        pageSize={pageSize}
        isLoading={isLoading}
        actions={actions}
        onView={(row) => console.log("view", row)}
        onEdit={(row) => {
          setSelectedUnit(row);
          setOpen(true);
        }}
        onDelete={(id) => console.log("delete", id)}
      />

      {/* ===== PAGINATION ===== */}
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={meta?.total ?? 0}
        onPageChange={(newPage) => {
          setPage(newPage);
        }}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {/* <MeasurementUnitDialog
        open={open}
        onOpenChange={setOpen}
        unit={selectedUnit}
        isLoading={createMeasurementUnit.isPending || updateMeasurementUnit.isPending}
        onSubmit={(data) => {
          if (selectedUnit) {
            updateMeasurementUnit.mutate(
              {
                id: selectedUnit.id,
                data,
              },
              {
                onSuccess: () => {
                  toast.success("Measurement unit updated successfully");
                  setOpen(false);
                  setSelectedUnit(null);
                },
                onError: (error: any) => {
                  toast.error(error?.message ?? "Failed to update measurement unit");
                },
              }
            );
          } else {
            createMeasurementUnit.mutate(data, {
              onSuccess: () => {
                toast.success("Measurement unit created successfully");
                setOpen(false);
                setSelectedUnit(null);
              },
              onError: (error: any) => {
                toast.error(error?.message ?? "Failed to create measurement unit");
              },
            });
          }
        }}
      /> */}
    </div>
  );
}