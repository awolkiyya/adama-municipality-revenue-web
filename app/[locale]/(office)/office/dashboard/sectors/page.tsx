"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";

import {
  Search,
  PlusCircle,
  Layers,
  CircleDot,
} from "lucide-react";

import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { IconBadge } from "@/components/commen/icon-badge";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Filters } from "@/components/commen/Filters";
import { Toolbar } from "@/components/commen/Toolbar";
import { ExportDropdown } from "@/components/commen/ExportDropdown";

import { CommenTable } from "@/components/table/CommenTable";
import { DataTablePagination } from "@/components/table/data-pagination";

import {
  CommentType,
  FilterField,
} from "@/types/commen";

import { RootState } from "@/lib/store/store";

import {
  resolveActions,
} from "@/components/table/permissions/ResolveActions";

import {
  CommentTableRegistry,
} from "@/components/table/registry";

import {
  ClusterDropdown,
} from "@/components/input/ClusterDropdown";

import {
  Cluster,
  Sector,
} from "@/types/admin-unit";

import {
  useCreateSector,
  useDeleteSector,
  useSectors,
  useUpdateSector,
} from "@/hooks/useAdminUnit.hook";

import { SectorDialog } from "@/components/dialogs/SectorModal";

import { toast } from "sonner";


import { APP_PERMISSIONS } from "@/lib/authorization";
import ProtectedRoute from "@/components/access/ProtectedRoute";
import DeleteModal from "@/components/dialogs/deleteModal";
import { SearchInput } from "@/components/input/SearchInput";

/* =====================================================
   FILTERS
===================================================== */

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
        label: "Active",
        value: "ACTIVE",
      },
      {
        label: "Inactive",
        value: "INACTIVE",
      },
    ],
  },
];

const INITIAL_FILTERS = {
  status: "ALL",
};


/* =====================================================
   PAGE CONTENT
===================================================== */

function SectorPageContent() {
  const user = useSelector(
    (state: RootState) => state.auth.user,
  );

  const [deleteTarget, setDeleteTarget] = useState<Sector | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  /* ===================================================
     DIALOG
  =================================================== */

  const [open, setOpen] = useState(false);

  const [selectedSector, setSelectedSector] =
    useState<Sector | null>(null);

  /* ===================================================
     SEARCH
  =================================================== */

  const [search, setSearch] = useState("");

  /* ===================================================
     FILTERS
  =================================================== */

  const [filters, setFilters] = useState<
    Record<string, any>
  >(INITIAL_FILTERS);

  /* ===================================================
     CLUSTER
  =================================================== */

  const [cluster, setCluster] =
    useState<Cluster | null>(null);

  /* ===================================================
     PAGINATION
  =================================================== */

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);

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

    cluster_id: cluster?.id,

    is_active:
      filters.status === "ACTIVE"
        ? true
        : filters.status === "INACTIVE"
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

  const tableData = useMemo(() => {
    return sectors.map((sector) => ({
      ...sector,

      id: sector.id,

      name: sector.name,

      cluster_name:
        sector.cluster?.name ?? "-",

      cluster: sector.cluster,

      code: sector.code,
    }));
  }, [sectors]);

  /* ===================================================
     USER CHECK
  =================================================== */

  if (!user?.role) {
    return (
      <div
        className="
          flex
          flex-col
          items-center
          justify-center
          h-40
          gap-3
          text-center
        "
      >
        <div
          className="
            size-6
            rounded-full
            border-2
            border-muted
            border-t-primary
            animate-spin
          "
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

  /* ===================================================
     TABLE ACTIONS
  =================================================== */

  const actions = resolveActions(
    CommentTableRegistry.sector,
    user.role.name,
  );

  /* ===================================================
     ERROR
  =================================================== */

  if (isError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-2">
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
     OPEN CREATE
  =================================================== */

  const handleCreate = () => {
    setSelectedSector(null);
    setOpen(true);
  };

  /* ===================================================
     OPEN EDIT
  =================================================== */

  const handleEdit = (row: Sector) => {
    setSelectedSector(row);
    setOpen(true);
  };

  /* ===================================================
     SUBMIT
  =================================================== */

  const handleSubmit = (data: any) => {
    /* =================================================
       UPDATE
    ================================================= */

    if (selectedSector) {
      updateSector.mutate(
        {
          id: selectedSector.id,

          data,
        },

        {
          onSuccess: () => {
            toast.success(
              "Sector updated successfully",
            );

            setOpen(false);

            setSelectedSector(null);
          },

          onError: (error: any) => {
            toast.error(
              error?.message ??
                "Failed to update sector",
            );
          },
        },
      );

      return;
    }

    /* =================================================
       CREATE
    ================================================= */

    createSector.mutate(
      data,

      {
        onSuccess: () => {
          toast.success(
            "Sector created successfully",
          );

          setOpen(false);

          setSelectedSector(null);
        },

        onError: (error: any) => {
          toast.error(
            error?.message ??
              "Failed to create sector",
          );
        },
      },
    );
  };

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <div className="space-y-6 max-w-6xl m-auto">

      {/* =================================================
          HEADER
      ================================================= */}

      <Banner
        description="
          Manage revenue sectors used to classify
          and collect municipal revenue across the city
        "
        badge={
          <IconBadge
            className="
              p-3
              text-[10px]
              bg-black/20
              text-white
              gap-2
              rounded-full
            "
            icon={
              <Layers className="w-3 h-3" />
            }
          >
            Sector Revenue Collection
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
            onClick={handleCreate}
          >
            <PlusCircle />

            Add New Sector
          </Button>
        }

        overlayClassName="
          bg-gradient-to-r
          from-primary/95
          via-primary/80
          to-primary/50
        "

        className="text-white"
      />

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <Toolbar
        search={
          <SearchInput
            placeholder="Search sector..."
            value={search}

            onChange={(event) => {
              setSearch(event.target.value);

              setPage(1);
            }}
          />
        }

        right={
          <div
            className="
              flex
              flex-col
              gap-4
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >

            {/* ==========================================
                CLUSTER
            ========================================== */}

            <div className="w-full md:w-60">
              <ClusterDropdown
                value={
                  cluster?.id ?? null
                }

                onChange={(
                  value: string,
                  item: Cluster,
                ) => {
                  setCluster(item);

                  setPage(1);
                }}
              />
            </div>

            {/* ==========================================
                FILTER
            ========================================== */}

            <div className="flex-1">
              <Filters
                schema={sectorFilters}

                value={filters}

                onChange={setFilters}

                onReset={() => {
                  setFilters(
                    INITIAL_FILTERS,
                  );

                  setPage(1);
                }}
                layout="row"
                resetPosition="end"
              />
            </div>

            {/* ==========================================
                EXPORT
            ========================================== */}

            <div className="flex justify-end">
              <ExportDropdown />
            </div>
          </div>
        }
      />

      {/* =================================================
          TABLE
      ================================================= */}

      <CommenTable
        type={
          "sector" as CommentType
        }

        data={tableData}

        page={
          meta?.current_page ?? page
        }

        pageSize={
          meta?.per_page ?? pageSize
        }

        isLoading={isLoading}

        actions={actions}

        onView={(row) => {
          console.log(
            "view",
            row,
          );
        }}

        onEdit={(row) => {
          handleEdit(row);
        }}

        onDelete={(id) => {
          const sector = sectors.find((item) => item.id === id);
        
          if (!sector) {
            toast.error("Sector not found");
            return;
          }
        
          setDeleteTarget(sector);
          setDeleteModalOpen(true);
        }}
      />

      {/* =================================================
          PAGINATION
      ================================================= */}

      <DataTablePagination
        page={
          meta?.current_page ?? page
        }

        pageSize={
          meta?.per_page ?? pageSize
        }

        total={
          meta?.total ?? 0
        }

        onPageChange={(newPage) => {
          setPage(newPage);
        }}

        onPageSizeChange={(size) => {
          setPageSize(size);

          setPage(1);
        }}
      />

      {/* =================================================
          SECTOR DIALOG
      ================================================= */}

      <SectorDialog
        open={open}

        onOpenChange={setOpen}

        sector={selectedSector}

        isLoading={
          createSector.isPending ||
          updateSector.isPending
        }

        onSubmit={handleSubmit}
      />

      {/* delete logic */}
      <DeleteModal
        isOpen={deleteModalOpen}
        title="Delete Sector"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : "Are you sure you want to delete this sector?"
        }
        onClose={(open) => {
          if (deleteSector.isPending) return;

          setDeleteModalOpen(open);

          if (!open) {
            setDeleteTarget(null);
          }
        }}
        action={() => {
          if (!deleteTarget) return;

          deleteSector.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Sector deleted successfully");

              setDeleteModalOpen(false);
              setDeleteTarget(null);
            },

            onError: (error: any) => {
              toast.error(
                error?.message ?? "Failed to delete sector"
              );
            },
          });
        }}
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
      resource={
        APP_PERMISSIONS.SECTORS_VIEW.resource
      }

      action={
        APP_PERMISSIONS.SECTORS_VIEW.action
      }
    >
      <SectorPageContent />
    </ProtectedRoute>
  );
}