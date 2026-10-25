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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CommentType, FilterField } from "@/types/commen";
import { StatCard, StatCardGrid } from "@/components/cards/StatCard";
import { RootState } from "@/lib/store/store";
import { ExportDropdown } from "@/components/commen/ExportDropdown";
import { DataTablePagination } from "@/components/table/data-pagination";
import { CommenTable } from "@/components/table/CommenTable";
import { resolveActions } from "@/components/table/permissions/ResolveActions";
import { CommentTableRegistry } from "@/components/table/registry";

import { useRevenueServices } from "@/hooks/revenue/revenueService.hook";
import { RevenueServiceSummary } from "@/types/revenue/revenu-service";
import { RevenueCodeDropdown } from "@/components/input/RevenuCodeDropDown";
import { RevenueCode } from "@/types/revenue/revenue-code";
import AppFilterBar from "@/components/app-filter-bar";

type RevenueServiceFilters = {
  revenue_domain: string;
  code: string;
  collection_mode: string;
  status: string;
};

const ALL_FILTERS: RevenueServiceFilters = {
  revenue_domain: "ALL",
  code: "ALL",
  collection_mode: "ALL",
  status: "ALL",
};

/*
|--------------------------------------------------------------------------
| Revenue Service Filter Options
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
| Helpers
|--------------------------------------------------------------------------
*/

function filtersEqual(
  first: RevenueServiceFilters,
  second: RevenueServiceFilters,
): boolean {
  return (
    first.revenue_domain === second.revenue_domain &&
    first.code === second.code &&
    first.collection_mode === second.collection_mode &&
    first.status === second.status
  );
}

function countActiveFilters(filters: RevenueServiceFilters): number {
  return Object.values(filters).filter(
    (value) => value !== "" && value !== "ALL",
  ).length;
}

/*
|--------------------------------------------------------------------------
| Main Page
|--------------------------------------------------------------------------
*/

function RevenueServicesPageContent() {
  const router = useRouter();

  const user = useSelector((state: RootState) => state.auth.user);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);

  // Search
  const [search, setSearch] = useState<string>("");

  // Applied filters: these are sent to the API.
  const [filters, setFilters] =
    useState<RevenueServiceFilters>({ ...ALL_FILTERS });

  // Draft filters: these change inside the filter panel before Apply.
  const [draftFilters, setDraftFilters] =
    useState<RevenueServiceFilters>({ ...ALL_FILTERS });

  const activeFilterCount = countActiveFilters(filters);
  const hasAppliedFilters = activeFilterCount > 0;
  const hasPendingChanges = !filtersEqual(filters, draftFilters);

  /*
  |--------------------------------------------------------------------------
  | API Query Parameters
  |--------------------------------------------------------------------------
  */

  const queryFilters = useMemo(() => {
    const params: Record<string, string | number | boolean> = {
      page,
      per_page: perPage,
    };

    const trimmedSearch = search.trim();

    if (trimmedSearch) {
      params.search = trimmedSearch;
    }

    if (filters.revenue_domain !== "ALL") {
      params.revenue_domain = filters.revenue_domain;
    }

    if (filters.code !== "ALL") {
      params.code = filters.code;
    }

    if (filters.collection_mode !== "ALL") {
      params.collection_mode = filters.collection_mode;
    }

    if (filters.status !== "ALL") {
      params.is_active = filters.status === "ACTIVE";
    }

    return params;
  }, [filters, search, page, perPage]);

  /*
  |--------------------------------------------------------------------------
  | Revenue Services Query
  |--------------------------------------------------------------------------
  */

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useRevenueServices(queryFilters);

  const services = data?.data ?? [];

  const summary: RevenueServiceSummary = {
    total: Number(data?.meta?.summary?.total ?? 0),
    active: Number(data?.meta?.summary?.active ?? 0),
    inactive: Number(data?.meta?.summary?.inactive ?? 0),
  };

  const meta = data?.meta;

  /*
  |--------------------------------------------------------------------------
  | Handlers
  |--------------------------------------------------------------------------
  */

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFiltersApply = () => {
    setFilters({ ...draftFilters });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ ...ALL_FILTERS });
    setDraftFilters({ ...ALL_FILTERS });
    setPage(1);
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
  | Permission Loading
  |--------------------------------------------------------------------------
  */

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

  const actions = resolveActions(
    CommentTableRegistry.revenueService,
    user.permissions,
  );

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
            <IconBadge
              className="gap-2 rounded-full bg-black/20 p-3 text-xs text-white"
              icon={<Wrench className="h-4 w-4" />}
            >
              Revenue Services
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
          className="mx-5 text-white"
        />

        <div className="mx-4 rounded-lg border border-destructive/30 bg-destructive/5 p-6 md:mx-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold text-destructive">
              Failed to load revenue services
            </h2>

            <p className="text-sm text-muted-foreground">
              We could not retrieve the revenue service list. Please try again.
            </p>

            {error instanceof Error && (
              <p className="text-xs text-muted-foreground">
                {error.message}
              </p>
            )}

            <div className="mt-2">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
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
      {/* Header */}

      <Banner
        description="Manage revenue services, assessment rules, required fields, and collection methods."
        badge={
          <IconBadge
            className="gap-2 rounded-full p-3 text-xs"
            icon={<Wrench className="h-4 w-4" />}
          >
            Revenue Services
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
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={() =>
                router.push(
                  "/office/dashboard/revenue-managements/services/create",
                )
              }
              className="py-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Revenue Service
            </Button>

            <ExportDropdown />
          </div>
        }
      />

      <div className="flex flex-col gap-6">
        {/* Statistics */}

        <div className="relative">
          {isFetching && !isLoading && (
            <div className="absolute right-0 top-0 z-10 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating...
            </div>
          )}

          <StatCardGrid columns={3}>
            <StatCard
              label="Total Services"
              value={summary.total}
              icon={Layers}
            />
            <StatCard
              label="Active"
              value={summary.active}
              icon={CheckCircle2}
            />
            <StatCard
              label="Inactive"
              value={summary.inactive}
              icon={CircleOff}
            />
          </StatCardGrid>
        </div>

        {/* Search and Filters */}

        <AppFilterBar
          search={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search revenue services..."
          searchLabel="Search revenue services"
          title="Search and filter"
          description="Narrow down revenue services by domain, revenue code, collection mode, or status."
          activeFilterCount={activeFilterCount}
          hasFilters={hasAppliedFilters || hasPendingChanges}
          onApply={handleFiltersApply}
          onClear={clearFilters}
        >
          {/* Revenue Domain */}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Revenue domain
            </label>

            <Select
              value={draftFilters.revenue_domain}
              onValueChange={(value) => {
                setDraftFilters((current) => ({
                  ...current,
                  revenue_domain: value,
                }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All domains" />
              </SelectTrigger>

              <SelectContent>
                {revenueServiceFilters
                  .find((field) => field.key === "revenue_domain")
                  ?.options?.map((option) => (
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

          {/* Revenue Code */}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Revenue code
            </label>

            <RevenueCodeDropdown
              value={
                draftFilters.code === "ALL"
                  ? null
                  : draftFilters.code
              }
              onChange={(value: string, _item: RevenueCode) => {
                setDraftFilters((current) => ({
                  ...current,
                  code: value || "ALL",
                }));
              }}
            />
          </div>

          {/* Collection Mode */}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Collection mode
            </label>

            <Select
              value={draftFilters.collection_mode}
              onValueChange={(value) => {
                setDraftFilters((current) => ({
                  ...current,
                  collection_mode: value,
                }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All collection modes" />
              </SelectTrigger>

              <SelectContent>
                {revenueServiceFilters
                  .find((field) => field.key === "collection_mode")
                  ?.options?.map((option) => (
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

          {/* Status */}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Status
            </label>

            <Select
              value={draftFilters.status}
              onValueChange={(value) => {
                setDraftFilters((current) => ({
                  ...current,
                  status: value,
                }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>

              <SelectContent>
                {revenueServiceFilters
                  .find((field) => field.key === "status")
                  ?.options?.map((option) => (
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
        </AppFilterBar>

        {/* Revenue Services Table */}

        <CommenTable
          type={"revenueService" as CommentType}
          data={services}
          page={page}
          pageSize={perPage}
          isLoading={isLoading || isFetching}
          actions={actions}
          onView={(row) => {
            router.push(
              `/office/dashboard/revenue-managements/services/${row.id}`,
            );
          }}
          onEdit={(row) => {
            router.push(
              `/office/dashboard/revenue-managements/services/${row.id}/edit`,
            );
          }}
          onDelete={(id) => {
            console.log("delete", id);
          }}
          onManageAccess={(row) => {
            router.push(
              `/office/dashboard/revenue-managements/services/${row.id}/access`,
            );
          }}
        />

        {/* Pagination */}

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

export default function RevenueServicesPage() {
  return <RevenueServicesPageContent />;
}