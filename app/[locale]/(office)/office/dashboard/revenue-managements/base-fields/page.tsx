"use client";

import { useMemo, useState } from "react";

import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { IconBadge } from "@/components/commen/icon-badge";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { CircleDot, Database, Loader2, Plus, Ruler, Search } from "lucide-react";

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

import { BaseField } from "@/types/revenue/revenue-baseField";


import { toast } from "sonner";
import { useBaseFields, useCreateBaseField, useUpdateBaseField } from "@/hooks/revenue/revenueBaseField.hook";

/**
 * ASSUMPTIONS — these names weren't in what you shared, so they're guesses
 * based on the Sector page's conventions. If your codebase uses different
 * names, these are the only spots that need to change:
 *
 * - Hooks: useBaseFields / useCreateBaseField / useUpdateBaseField from "@/hooks/useRevenue.hook"
 * - Dialog: BaseFieldDialog from "@/components/dialogs/BaseFieldModal" (same prop
 *   shape as SectorDialog: open, onOpenChange, baseField, isLoading, onSubmit)
 * - Registry key: CommentTableRegistry.baseField
 * - Table type: "baseField"
 * - BaseField fields referenced below: id, name, code, dataType, unit, is_active
 */

/* =========================
   FILTERS
========================= */
export const baseFieldFilters: FilterField[] = [
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
    key: "dataType",
    label: "Data Type",
    type: "select",
    defaultValue: "ALL",
    icon: Ruler,
    options: [
      { label: "All Types", value: "ALL" },
      { label: "Number", value: "NUMBER" },
      { label: "Percentage", value: "PERCENTAGE" },
      { label: "Text", value: "TEXT" },
      { label: "Date", value: "DATE" },
      { label: "Boolean", value: "BOOLEAN" },
    ],
  },
];

const INITIAL_FILTERS = {
  status: "ALL",
  dataType: "ALL",
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
export default function BaseFieldsPage() {
  const user = useSelector((state: RootState) => state.auth.user);

  const [open, setOpen] = useState(false);
  const [selectedBaseField, setSelectedBaseField] = useState<BaseField | null>(null);

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState<Record<string, any>>(INITIAL_FILTERS);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const createBaseField = useCreateBaseField();
  const updateBaseField = useUpdateBaseField();

  const { data, isLoading } = useBaseFields({
    page,
    per_page: pageSize,

    search,

    dataType: filters.dataType === "ALL" ? undefined : filters.dataType,

    isActive:
      filters.status === "ACTIVE"
        ? true
        : filters.status === "INACTIVE"
          ? false
          : undefined,
  });

  const baseFields = data?.data ?? [];
  const meta = data?.meta;

  /* =========================
     TABLE DATA
  ========================= */
  const tableData = useMemo(() => {
    return baseFields.map((field) => ({
      ...field,

      id: field.id,
      name: field.name,
      code: field.code,
      dataType: field.data_type,
      unit_code: field.unit_code,
    }));
  }, [baseFields]);

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

  const actions = resolveActions(CommentTableRegistry.baseField, user.role.name);
  // role based action here

  return (
    <div className="m-auto max-w-5xl space-y-6">
      {/* ================= HEADER ================= */}
      <Banner
        description="Create and manage reusable base fields used in revenue calculations, tariff formulas, and service assessments."
        badge={
          <IconBadge
            className="gap-2 rounded-full bg-black/20 p-3 text-[10px] text-white"
            icon={<Database className="h-3 w-3" />}
          >
            {"Base Fields"}
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
              setSelectedBaseField(null);
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
            placeholder="Search base fields..."
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
                schema={baseFieldFilters}
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
        type={"baseField" as CommentType}
        data={tableData}
        page={page}
        pageSize={pageSize}
        isLoading={isLoading}
        actions={actions}
        onView={(row) => console.log("view", row)}
        onEdit={(row) => {
          setSelectedBaseField(row);
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

      {/* <BaseFieldDialog
        open={open}
        onOpenChange={setOpen}
        baseField={selectedBaseField}
        isLoading={createBaseField.isPending || updateBaseField.isPending}
        onSubmit={(data) => {
          if (selectedBaseField) {
            updateBaseField.mutate(
              {
                id: selectedBaseField.id,
                data,
              },
              {
                onSuccess: () => {
                  toast.success("Base field updated successfully");
                  setOpen(false);
                  setSelectedBaseField(null);
                },
                onError: (error: any) => {
                  toast.error(error?.message ?? "Failed to update base field");
                },
              }
            );
          } else {
            createBaseField.mutate(data, {
              onSuccess: () => {
                toast.success("Base field created successfully");
                setOpen(false);
                setSelectedBaseField(null);
              },
              onError: (error: any) => {
                toast.error(error?.message ?? "Failed to create base field");
              },
            });
          }
        }}
      /> */}
    </div>
  );
}