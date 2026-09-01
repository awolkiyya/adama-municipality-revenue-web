"use client";

import { useMemo, useState } from "react";

import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { IconBadge } from "@/components/commen/icon-badge";

import { Button } from "@/components/ui/button";

import {
  CircleDot,
  Loader2,
  Plus,
  Ruler,
} from "lucide-react";

import { Filters } from "@/components/commen/Filters";
import { Toolbar } from "@/components/commen/Toolbar";

import { CommenTable } from "@/components/table/CommenTable";
import {
  CommentType,
  FilterField,
} from "@/types/commen";

import { DataTablePagination } from "@/components/table/data-pagination";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";

import { resolveActions } from "@/components/table/permissions/ResolveActions";
import { CommentTableRegistry } from "@/components/table/registry";

import { MeasurementUnit } from "@/types/revenue/revenue-unit";

import {
  useChangeMeasurementUnitStatus,
  useCreateMeasurementUnit,
  useMeasurementUnits,
  useUpdateMeasurementUnit,
} from "@/hooks/revenue/revenueUnit.hook";

import { SearchInput } from "@/components/input/SearchInput";

import {
  MeasurementUnitDialog,
  type MeasurementUnitDialogMode,
} from "@/components/dialogs/MeasurementUnitDialog";


// ============================================================
// FILTERS
// ============================================================

export const measurementUnitFilters: FilterField[] = [
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


// ============================================================
// INITIAL FILTERS
// ============================================================

const INITIAL_FILTERS = {
  status: "ALL",
};


// ============================================================
// PAGE
// ============================================================

export default function MeasurementUnitsPage() {

  // ==========================================================
  // AUTH
  // ==========================================================

  const user = useSelector(
    (state: RootState) => state.auth.user,
  );


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
  // FILTERS
  // ==========================================================

  const [filters, setFilters] =
    useState<Record<string, any>>(
      INITIAL_FILTERS,
    );


  // ==========================================================
  // PAGINATION
  // ==========================================================

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] =
    useState(10);


  // ==========================================================
  // MUTATIONS
  // ==========================================================

  const createMeasurementUnit =
    useCreateMeasurementUnit();

  const updateMeasurementUnit =
    useUpdateMeasurementUnit();

  const changeMeasurementUnitStatus =
  useChangeMeasurementUnitStatus();


  // ==========================================================
  // QUERY
  // ==========================================================

  const {
    data,
    isLoading,
  } = useMeasurementUnits({
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


  // ==========================================================
  // DATA
  // ==========================================================

  const units =
    data?.data ?? [];

  const meta =
    data?.meta;


  // ==========================================================
  // TABLE DATA
  // ==========================================================

  const tableData =
    useMemo(() => {
      return units.map(
        (unit) => ({
          ...unit,

          id: unit.id,

          code: unit.code,

          name: unit.name,

          symbol: unit.symbol,

          description:
            unit.description,

          is_active:
            unit.is_active,

          sort_order:
            unit.sort_order,
        }),
      );
    }, [units]);


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

  const handleStatusChange = (
    row: MeasurementUnit,
  ) => {

    changeMeasurementUnitStatus.mutate({
      id: row.id,
      isActive: !row.is_active,
    });
  };


  // ==========================================================
  // OPEN EDIT
  // ==========================================================

  const handleEdit = (
    row: MeasurementUnit,
  ) => {

    setSelectedUnit(row);

    setDialogMode("edit");

    setOpen(true);
  };


  // ==========================================================
  // OPEN VIEW
  // ==========================================================

  const handleView = (
    row: MeasurementUnit,
  ) => {

    setSelectedUnit(row);

    setDialogMode("view");

    setOpen(true);
  };


  // ==========================================================
  // CLOSE DIALOG
  // ==========================================================

  const handleDialogChange = (
    value: boolean,
  ) => {

    setOpen(value);

    if (!value) {

      setSelectedUnit(null);

      setDialogMode("create");
    }
  };


  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = (
    formData: {
      name: string;
      symbol: string;
      is_active: boolean;
    },
  ) => {

    // --------------------------------------------------------
    // CREATE
    // --------------------------------------------------------

    if (dialogMode === "create") {

      createMeasurementUnit.mutate(
        formData,
        {
          onSuccess: () => {

            setOpen(false);

            setSelectedUnit(null);

            setDialogMode("create");
          },
        },
      );

      return;
    }


    // --------------------------------------------------------
    // UPDATE
    // --------------------------------------------------------

    if (
      dialogMode === "edit" &&
      selectedUnit
    ) {

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
      <div
        className="
          flex
          h-40
          flex-col
          items-center
          justify-center
          gap-3
          text-center
        "
      >

        <Loader2
          className="
            size-6
            animate-spin
            text-muted-foreground
          "
        />

        <div
          className="
            flex
            flex-col
            gap-0.5
          "
        >

          <p
            className="
              text-sm
              font-medium
              text-foreground
            "
          >
            Checking permissions
          </p>

          <p
            className="
              text-xs
              text-muted-foreground
            "
          >
            This will only take a moment
          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // TABLE ACTIONS
  // ==========================================================

  const actions =
    resolveActions(
      CommentTableRegistry.measurementUnit,
      user.role.name,
    );


  // ==========================================================
  // DIALOG LOADING
  // ==========================================================

  const isDialogLoading =
    createMeasurementUnit.isPending ||
    updateMeasurementUnit.isPending;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="
        m-auto
        max-w-7xl
        space-y-6
      "
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <Banner
        description="
          Configure and manage measurement units
          used for revenue calculations, tariffs,
          and service assessments.
        "
        badge={
          <IconBadge
            className="
              gap-2
              rounded-full
              bg-black/20
              p-3
              text-[10px]
              text-white
            "
            icon={
              <Ruler
                className="
                  h-3
                  w-3
                "
              />
            }
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
          <Button
            variant="outline"
            onClick={handleCreate}
          >
            <Plus
              className="
                h-4
                w-4
              "
            />

            Create New
          </Button>
        }
        overlayClassName="
          bg-gradient-to-r
          from-primary/95
          via-primary/80
          to-primary/50
        "
        className="
          text-white
        "
      />


      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <Toolbar
        search={
          <SearchInput
            placeholder="
              Search measurement units...
            "
            value={search}
            onChange={(event) => {

              setSearch(
                event.target.value,
              );

              setPage(1);
            }}
          />
        }

        right={
          <Filters
            schema={
              measurementUnitFilters
            }

            value={
              filters
            }

            onChange={(
              next,
            ) => {

              setFilters(
                next,
              );

              setPage(1);
            }}

            onReset={() => {

              setFilters(
                INITIAL_FILTERS,
              );

              setPage(1);
            }}

            layout="row"

            resetPosition="end"
          />
        }
      />


      {/* ======================================================
          TABLE
      ====================================================== */}

<CommenTable
  type={
    "measurementUnit" as CommentType
  }

  data={
    tableData
  }

  page={
    page
  }

  pageSize={
    pageSize
  }

  isLoading={
    isLoading
  }

  actions={
    actions
  }

  onView={
    handleView
  }

  onEdit={
    handleEdit
  }

  onToggleStatus={
    handleStatusChange
  }

  onDelete={(
    id,
  ) => {

    console.log(
      "delete",
      id,
    );

  }}
/>


      {/* ======================================================
          PAGINATION
      ====================================================== */}

      <DataTablePagination
        page={
          page
        }

        pageSize={
          pageSize
        }

        total={
          meta?.total ?? 0
        }

        onPageChange={(
          newPage,
        ) => {

          setPage(
            newPage,
          );

        }}

        onPageSizeChange={(
          size,
        ) => {

          setPageSize(
            size,
          );

          setPage(1);

        }}
      />


      {/* ======================================================
          REUSABLE DIALOG
      ====================================================== */}

      <MeasurementUnitDialog
        open={
          open
        }

        onOpenChange={
          handleDialogChange
        }

        mode={
          dialogMode
        }

        unit={
          selectedUnit
        }

        isLoading={
          isDialogLoading
        }

        onSubmit={
          handleSubmit
        }
      />

    </div>
  );
}