"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { Building2, MapPin } from "lucide-react";

import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { IconBadge } from "@/components/commen/icon-badge";
import { ExportDropdown } from "@/components/commen/ExportDropdown";
import { CommenTable } from "@/components/table/CommenTable";
import { DataTablePagination } from "@/components/table/data-pagination";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { CommentType } from "@/types/commen";
import type { AdminUnit } from "@/types/admin-unit";

import { RootState } from "@/lib/store/store";
import { APP_PERMISSIONS } from "@/lib/authorization";

import { resolveActions } from "@/components/table/permissions/ResolveActions";
import { CommentTableRegistry } from "@/components/table/registry";

import { useAdminUnits } from "@/hooks/useAdminUnit.hook";

import ProtectedRoute from "@/components/access/ProtectedRoute";
import AdministrativeUnitDetailsDialog from "@/components/dialogs/AdministrativeUnitDetailsDialog";
import AppFilterBar from "@/components/app-filter-bar";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const INITIAL_FILTERS: Record<string, string> = {
  level: "ALL",
};

const LEVEL_OPTIONS = [
  { label: "City", value: "CITY" },
  { label: "Sub-city", value: "SUBCITY" },
  { label: "Wereda", value: "WEREDA" },
] as const;

/* -------------------------------------------------------------------------- */
/* Loading state                                                              */
/* -------------------------------------------------------------------------- */

function CheckingPermissions() {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-3 text-center">
      <div
        className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary"
        aria-hidden="true"
      />

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

/* -------------------------------------------------------------------------- */
/* Error state                                                                */
/* -------------------------------------------------------------------------- */

function AdministrativeUnitError() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="space-y-2 text-center">
        <p className="text-sm font-semibold text-destructive">
          Failed to load administrative units
        </p>

        <p className="text-xs text-muted-foreground">
          Please try again later.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page content                                                               */
/* -------------------------------------------------------------------------- */

function AdministrativeUnitContent() {
  const user = useSelector((state: RootState) => state.auth.user);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  // Applied filters are sent to the API.
  const [filters, setFilters] = useState<Record<string, string>>(
    INITIAL_FILTERS,
  );

  // Draft filters change locally until Apply is clicked.
  const [draftFilters, setDraftFilters] = useState<Record<string, string>>(
    INITIAL_FILTERS,
  );

  const [selectedUnit, setSelectedUnit] = useState<AdminUnit | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data, isLoading, isError } = useAdminUnits({
    search,
    page,
    per_page: pageSize,
    ...filters,
  });

  const units: AdminUnit[] = data?.data ?? [];
  const meta = data?.meta;

  /* ------------------------------------------------------------------------ */
  /* Filter state                                                             */
  /* ------------------------------------------------------------------------ */

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) =>
      value !== "" &&
      value !== "ALL" &&
      INITIAL_FILTERS[key] !== value,
  ).length;

  const hasAppliedFilters =
    search.trim().length > 0 || activeFilterCount > 0;

  const hasPendingChanges = Object.keys(INITIAL_FILTERS).some(
    (key) => (draftFilters[key] ?? "") !== (filters[key] ?? ""),
  );

  const applyFilters = () => {
    setFilters({ ...draftFilters });
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setDraftFilters({ ...INITIAL_FILTERS });
    setFilters({ ...INITIAL_FILTERS });
    setPage(1);
  };

  /* ------------------------------------------------------------------------ */
  /* Dialog actions                                                           */
  /* ------------------------------------------------------------------------ */

  const handleView = (row: AdminUnit) => {
    setSelectedUnit(row);
    setDetailsOpen(true);
  };

  const handleDetailsOpenChange = (open: boolean) => {
    setDetailsOpen(open);

    if (!open) {
      setSelectedUnit(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Permissions                                                              */
  /* ------------------------------------------------------------------------ */

  if (!user || !Array.isArray(user.permissions)) {
    return <CheckingPermissions />;
  }

  const actions = resolveActions(
    CommentTableRegistry.administrativeUnit,
    user.permissions,
  );

  if (isError) {
    return <AdministrativeUnitError />;
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <Banner
        description="Manage administrative boundaries including Cities, Subcities, and Weredas."
        badge={
          <IconBadge
            className="gap-2 rounded-full"
            icon={<MapPin className="size-3" />}
          >
            City &gt; Subcity &gt; Wereda
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
        actions={<ExportDropdown />}
      />

      {/* Search and filters */}
      <AppFilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search by unit name or code..."
        searchLabel="Search administrative units"
        title="Search and filter"
        description="Narrow the register by administrative level."
        activeFilterCount={activeFilterCount}
        hasFilters={hasAppliedFilters || hasPendingChanges}
        onApply={applyFilters}
        onClear={clearFilters}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="admin-unit-level">
            Administrative level
          </label>

          <Select
            value={draftFilters.level || "ALL"}
            onValueChange={(value) => {
              setDraftFilters((current) => ({
                ...current,
                level: value,
              }));
            }}
          >
            <SelectTrigger id="admin-unit-level" className="w-full">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">All levels</SelectItem>

              {LEVEL_OPTIONS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </AppFilterBar>

      {/* Table */}
      <CommenTable
        type={"administrativeUnit" as CommentType}
        data={units}
        page={meta?.current_page ?? page}
        pageSize={meta?.per_page ?? pageSize}
        isLoading={isLoading}
        actions={actions}
        onView={(row) => handleView(row as AdminUnit)}
        onEdit={(row) => {
          console.log("edit", row);
        }}
        onDelete={(id) => {
          console.log("delete", id);
        }}
      />

      {/* Pagination */}
      <DataTablePagination
        page={meta?.current_page ?? page}
        pageSize={meta?.per_page ?? pageSize}
        total={meta?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
      />

      {/* Administrative unit details modal */}
      <AdministrativeUnitDetailsDialog
        unit={selectedUnit}
        open={detailsOpen}
        onOpenChange={handleDetailsOpenChange}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Protected page                                                             */
/* -------------------------------------------------------------------------- */

export default function AdministrativeUnitPage() {
  return (
    <ProtectedRoute
      resource={APP_PERMISSIONS.ADMINISTRATIVE_UNITS_VIEW.resource}
      action={APP_PERMISSIONS.ADMINISTRATIVE_UNITS_VIEW.action}
    >
      <AdministrativeUnitContent />
    </ProtectedRoute>
  );
}