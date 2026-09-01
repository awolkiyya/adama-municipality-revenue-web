"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import {
  Search,
  MapPin,
  Layers,
} from "lucide-react";

import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { IconBadge } from "@/components/commen/icon-badge";

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

import { resolveActions } from "@/components/table/permissions/ResolveActions";
import { CommentTableRegistry } from "@/components/table/registry";

import { useAdminUnits } from "@/hooks/useAdminUnit.hook";


import { APP_PERMISSIONS } from "@/lib/authorization";
import ProtectedRoute from "@/components/access/ProtectedRoute";
import { SearchInput } from "@/components/input/SearchInput";

/* =====================================================
   FILTERS
===================================================== */

export const administrativeUnitFilters: FilterField[] = [
  {
    key: "level",
    label: "Level",
    type: "select",
    defaultValue: "ALL",
    icon: Layers,
    options: [
      {
        label: "All",
        value: "ALL",
      },
      {
        label: "City",
        value: "CITY",
      },
      {
        label: "Subcity",
        value: "SUBCITY",
      },
      {
        label: "Wereda",
        value: "WEREDA",
      },
    ],
  },
];

const INITIAL_FILTERS = {
  level: "ALL",
};


/* =====================================================
   PAGE CONTENT
===================================================== */

function AdministrativeUnitContent() {
  const user = useSelector(
    (state: RootState) => state.auth.user,
  );

  /* ===================================================
     PAGINATION
  =================================================== */

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(10);

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
     ADMINISTRATIVE UNITS
  =================================================== */

  const {
    data,
    isLoading,
    isError,
  } = useAdminUnits({
    search,
    page,
    per_page: pageSize,
    ...filters,
  });

  const units = data?.data ?? [];

  const meta = data?.meta;

  /* ===================================================
     USER
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
    CommentTableRegistry.administrativeUnit,
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
            Failed to load administrative units
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
    <div className="space-y-6 max-w-7xl m-auto">

      {/* =================================================
          HEADER
      ================================================= */}

      <Banner
        description="
          Manage administrative boundaries including
          Cities, Subcities, and Weredas
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
              <MapPin className="w-3 h-3" />
            }
          >
            City &gt; Subcity &gt; Wereda
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
        overlayClassName="
          bg-gradient-to-r
          from-primary/95
          via-primary/80
          to-primary/50
        "
        className="text-white"
        actions={
          <ExportDropdown />
        }
      />

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <Toolbar
        search={
          <SearchInput
            placeholder="Search administrative units..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        }
        right={
          <>
            <Filters
              schema={administrativeUnitFilters}
              value={filters}
              onChange={setFilters}
              onReset={() =>
                setFilters(INITIAL_FILTERS)
              }
              layout="row"
              resetPosition="end"



            />
          </>
        }
      />

      {/* =================================================
          TABLE
      ================================================= */}

      <CommenTable
        type={
          "administrativeUnit" as CommentType
        }
        data={units}
        page={
          meta?.current_page ?? page
        }
        pageSize={
          meta?.per_page ?? pageSize
        }
        isLoading={isLoading}
        actions={actions}
        onView={(row) =>
          console.log("view", row)
        }
        onEdit={(row) =>
          console.log("edit", row)
        }
        onDelete={(id) =>
          console.log("delete", id)
        }
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
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
      />

    </div>
  );
}

/* =====================================================
   PROTECTED PAGE
===================================================== */

export default function AdministrativeUnitPage() {
  return (
    <ProtectedRoute
      resource={
        APP_PERMISSIONS.ADMINISTRATIVE_UNITS_VIEW.resource
      }
      action={
        APP_PERMISSIONS.ADMINISTRATIVE_UNITS_VIEW.action
      }
    >
      <AdministrativeUnitContent />
    </ProtectedRoute>
  );
}