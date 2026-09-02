"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  CheckCircle2,
  CircleDot,
  CircleOff,
  Layers,
  Loader2,
  Plus,
  Wrench,
} from "lucide-react";

import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { Button } from "@/components/ui/button";

import { CommentType, FilterField } from "@/types/commen";
import { StatCard, StatCardGrid } from "@/components/cards/StatCard";
import { RootState } from "@/lib/store/store";
import { Toolbar } from "@/components/commen/Toolbar";
import { FilterSheet } from "@/components/commen/FilterSheet"; // ⬅ NEW — replaces Sheet/Badge/Separator/Filters imports
import { ExportDropdown } from "@/components/commen/ExportDropdown";
import { DataTablePagination } from "@/components/table/data-pagination";
import { CommenTable } from "@/components/table/CommenTable";
import { resolveActions } from "@/components/table/permissions/ResolveActions";
import { CommentTableRegistry } from "@/components/table/registry";

import { useRevenueServices } from "@/hooks/revenue/revenueService.hook";
import { RevenueServiceSummary } from "@/types/revenue/revenu-service";

/*
|--------------------------------------------------------------------------
| Search Input
|--------------------------------------------------------------------------
*/

function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary"
    />
  );
}

/*
|--------------------------------------------------------------------------
| Revenue Service Filters Schema
|--------------------------------------------------------------------------
*/

export const revenueServiceFilters: FilterField[] = [
  {
    key: "revenue_domain",
    label: "Revenue Domain",
    type: "select",
    defaultValue: "ALL",
    icon: Layers,
    options: [
      { label: "All Domains", value: "ALL" },
      { label: "Tax", value: "TAX" },
      { label: "Rent", value: "RENT" },
      { label: "Investment", value: "INVESTMENT" },
      { label: "Service", value: "SERVICE" },
      { label: "Sale", value: "SALE" },
      { label: "Capital", value: "CAPITAL" },
    ],
  },
  {
    key: "code",
    label: "Revenue Code",
    type: "select",
    defaultValue: "ALL",
    icon: Layers,
    options: [
      { label: "All Revenue Codes", value: "ALL" },
      { label: "1701 - Gibira Mana Magaalaa (Baaxii fi Gooroo)", value: "1701" },
      { label: "1719 - Other Revenue Code", value: "1719" },
    ],
  },
  {
    key: "collection_mode",
    label: "Collection Mode",
    type: "select",
    defaultValue: "ALL",
    icon: Layers,
    options: [
      { label: "All Modes", value: "ALL" },
      { label: "Assessment Only", value: "ASSESSMENT_ONLY" },
      { label: "Field Collection", value: "FIELD_COLLECTION" },
      { label: "Assessment & Field Collection", value: "BOTH" },
    ],
  },
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
];

/*
|--------------------------------------------------------------------------
| Initial Filters
|--------------------------------------------------------------------------
*/

const INITIAL_FILTERS = {
  revenue_domain: "ALL",
  code: "ALL",
  collection_mode: "ALL",
  status: "ALL",
};

/*
|--------------------------------------------------------------------------
| Safe Default Summary
|--------------------------------------------------------------------------
*/

const EMPTY_SUMMARY: RevenueServiceSummary = {
  total: 0,
  active: 0,
  inactive: 0,
};

/*
|--------------------------------------------------------------------------
| Main Page
|--------------------------------------------------------------------------
*/

function RevenueServicesPage() {
  const router = useRouter();

  const user = useSelector((state: RootState) => state.auth.user);

  /* ================= Pagination ================= */
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);

  /* ================= Search ================= */
  const [search, setSearch] = useState<string>("");

  /*
  |--------------------------------------------------------------------------
  | Filters (applied)
  |--------------------------------------------------------------------------
  |
  | The FilterSheet component now owns ALL of the draft/apply/reset/badge
  | logic internally. This page only needs to know the currently APPLIED
  | value and a callback for when the user hits "Apply Filters".
  |
  */

  const [filters, setFilters] = useState<Record<string, any>>(INITIAL_FILTERS);

  /*
  |--------------------------------------------------------------------------
  | Query Parameters
  |--------------------------------------------------------------------------
  */

  const queryFilters = useMemo(() => {
    const params: Record<string, any> = {
      page,
      per_page: perPage,
    };

    const trimmedSearch = search.trim();
    if (trimmedSearch.length > 0) {
      params.search = trimmedSearch;
    }

    if (filters.revenue_domain && filters.revenue_domain !== "ALL") {
      params.revenue_domain = filters.revenue_domain;
    }

    if (filters.code && filters.code !== "ALL") {
      params.code = filters.code;
    }

    if (filters.collection_mode && filters.collection_mode !== "ALL") {
      params.collection_mode = filters.collection_mode;
    }

    if (filters.status && filters.status !== "ALL") {
      params.is_active = filters.status === "ACTIVE";
    }

    return params;
  }, [filters, search, page, perPage]);

  /*
  |--------------------------------------------------------------------------
  | Revenue Services Query
  |--------------------------------------------------------------------------
  */

  const { data, isLoading, isFetching, isError, error } = useRevenueServices(queryFilters);

  const services = data?.data ?? [];

  const summary: RevenueServiceSummary = {
    total: Number(data?.meta?.summary?.total ?? 0),
    active: Number(data?.meta?.summary?.active ?? 0),
    inactive: Number(data?.meta?.summary?.inactive ?? 0),
  };

  const meta = data?.meta;

  /*
  |--------------------------------------------------------------------------
  | Permission Loading
  |--------------------------------------------------------------------------
  */

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

  const actions = resolveActions(CommentTableRegistry.revenueService, user.role.name);

  /*
  |--------------------------------------------------------------------------
  | Handlers
  |--------------------------------------------------------------------------
  */

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleFiltersApply = (next: Record<string, any>) => {
    setFilters(next);
    setPage(1); // reset pagination whenever the applied filter set changes
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (size: number) => {
    setPerPage(size);
    setPage(1);
  };

  /*
  |--------------------------------------------------------------------------
  | Error State
  |--------------------------------------------------------------------------
  */

  if (isError) {
    return (
      <div className="flex flex-col gap-6 pb-10">
        <Banner
          description="Manage revenue services, assessment rules, required fields, and collection methods."
          badge={
            <IconBadge className="gap-2 rounded-full bg-black/20 p-3 text-xs text-white" icon={<Wrench className="h-4 w-4" />}>
              Revenue Services
            </IconBadge>
          }
          background={
            <FloatingParticles color="#040404" count={35} speed={0.2} connectDistance={100} position="bottom-right" />
          }
          overlayClassName="bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50"
          className="mx-5 text-white"
        />

        <div className="mx-4 rounded-lg border border-destructive/30 bg-destructive/5 p-6 md:mx-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold text-destructive">Failed to load revenue services</h2>
            <p className="text-sm text-muted-foreground">
              We could not retrieve the revenue service list. Please try again.
            </p>
            {error instanceof Error && (
              <p className="text-xs text-muted-foreground">{error.message}</p>
            )}
            <div className="mt-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Page
  |--------------------------------------------------------------------------
  */

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* ================= Header ================= */}

      <Banner
        description="Manage revenue services, assessment rules, required fields, and collection methods."
        badge={
          <IconBadge className="gap-2 rounded-full bg-black/20 p-3 text-xs text-white" icon={<Wrench className="h-4 w-4" />}>
            Revenue Services
          </IconBadge>
        }
        background={
          <FloatingParticles color="#040404" count={35} speed={0.2} connectDistance={100} position="bottom-right" />
        }
        overlayClassName="bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50"
        className="mx-5 text-white"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push("/office/dashboard/revenue-managements/services/create")}
              className="py-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Revenue Service
            </Button>

            <div className="flex justify-end">
              <ExportDropdown />
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-6 px-4 md:px-6">
        {/* ================= Statistics ================= */}

        <div className="relative">
          {isFetching && !isLoading && (
            <div className="absolute right-0 top-0 z-10 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating...
            </div>
          )}

          <StatCardGrid columns={3}>
            <StatCard label="Total Services" value={summary.total} icon={Layers} />
            <StatCard label="Active" value={summary.active} icon={CheckCircle2} />
            <StatCard label="Inactive" value={summary.inactive} icon={CircleOff} />
          </StatCardGrid>
        </div>

        {/* ================= Toolbar ================= */}

        <Toolbar
          search={
            <SearchInput
              placeholder="Search revenue services..."
              value={search}
              onChange={handleSearchChange}
            />
          }
          right={
            <FilterSheet
              schema={revenueServiceFilters}
              value={filters}
              defaultValues={INITIAL_FILTERS}
              onChange={handleFiltersApply}
              title="Filter Revenue Services"
              description="Narrow down the list by domain, code, collection mode, or status."
            />
          }
        />

        {/* ================= Table ================= */}

        <CommenTable
          type={"revenueService" as CommentType}
          data={services}
          page={page}
          pageSize={perPage}
          isLoading={isLoading || isFetching}
          actions={actions}
          onView={(row) => {
            router.push(`/office/dashboard/revenue-managements/services/${row.id}`);
          }}
          onEdit={(row) => {
            router.push(`/office/dashboard/revenue-managements/services/${row.id}/edit`);
          }}
          onDelete={(id) => {
            console.log("delete", id);
          }}
          onManageAccess={(row) => {
            router.push(`/office/dashboard/revenue-managements/services/${row.id}/access`);
          }}
        />

        {/* ================= Pagination ================= */}

        <DataTablePagination
          page={page}
          pageSize={perPage}
          total={meta?.total ?? 0}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}

export default RevenueServicesPage;