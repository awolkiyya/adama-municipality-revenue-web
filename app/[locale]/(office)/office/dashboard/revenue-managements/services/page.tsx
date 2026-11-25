
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

import {
  CheckCircle2,
  CircleDot,
  CircleOff,
  FileText,
  Hash,
  Info,
  Layers,
  Loader2,
  Plus,
  Settings2,
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

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Badge } from "@/components/ui/badge";

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

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type RevenueServiceFilters = {
  revenue_domain: string;
  code: string;
  collection_mode: string;
  status: string;
};

type RevenueServiceDetailRecord = Record<string, unknown> & {
  id?: string | number;
  name?: string | null;
  code?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

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

function countActiveFilters(
  filters: RevenueServiceFilters,
): number {
  return Object.values(filters).filter(
    (value) => value !== "" && value !== "ALL",
  ).length;
}

function formatDetailLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

/*
|--------------------------------------------------------------------------
| Detail Value Renderer
|--------------------------------------------------------------------------
*/

function RevenueServiceDetailValue({
  value,
}: {
  value: unknown;
}) {
  if (value === null || value === undefined || value === "") {
    return (
      <span className="text-sm italic text-muted-foreground">
        Not provided
      </span>
    );
  }

  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "default" : "secondary"}>
        {value ? "Yes" : "No"}
      </Badge>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <span className="text-sm italic text-muted-foreground">
          No items
        </span>
      );
    }

    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div
            key={index}
            className="rounded-lg border bg-muted/20 p-3"
          >
            {typeof item === "object" && item !== null ? (
              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5">
                {JSON.stringify(item, null, 2)}
              </pre>
            ) : (
              <p className="break-words text-sm">
                {String(item)}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/30 p-3 text-xs leading-5">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return (
    <p className="break-words text-sm font-medium text-foreground">
      {String(value)}
    </p>
  );
}

/*
|--------------------------------------------------------------------------
| Revenue Service Detail Sheet
|--------------------------------------------------------------------------
*/

function RevenueServiceDetailSheet({
  service,
  open,
  onOpenChange,
}: {
  service: RevenueServiceDetailRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const excludedFields = new Set([
    "id",
    "name",
    "code",
    "is_active",
    "created_at",
    "updated_at",
    "deleted_at",
  ]);

  const detailEntries = service
    ? Object.entries(service).filter(
        ([key, value]) =>
          !excludedFields.has(key) &&
          value !== undefined,
      )
    : [];

  const serviceName =
    service?.name?.trim() || "Revenue service";

  const serviceCode =
    service?.code?.trim() || "No code";

  const isActive = service?.is_active === true;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        {/* Header */}

        <div className="border-b px-6 py-5">
          <SheetHeader className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Settings2 className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <SheetTitle className="text-lg">
                  Revenue service details
                </SheetTitle>

                <SheetDescription>
                  View service information and configuration.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Scrollable Content */}

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {!service ? (
            <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
              No revenue service selected.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Service Overview */}

              <section className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Layers className="size-4" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Service name
                      </p>

                      <h3 className="break-words text-lg font-semibold">
                        {serviceName}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="size-3.5 shrink-0" />
                      <span className="break-all">
                        {serviceCode}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className="shrink-0"
                  >
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </section>

              {/* Basic Information */}

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="size-4 text-primary" />

                  <h3 className="text-sm font-semibold">
                    Basic information
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Service name
                    </p>

                    <p className="break-words text-sm font-medium">
                      {serviceName}
                    </p>
                  </div>

                  <div className="rounded-lg border p-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Revenue code
                    </p>

                    <p className="break-words text-sm font-medium">
                      {serviceCode}
                    </p>
                  </div>

                  <div className="rounded-lg border p-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Status
                    </p>

                    <Badge
                      variant={isActive ? "default" : "secondary"}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {service.id !== undefined && (
                    <div className="rounded-lg border p-3">
                      <p className="mb-2 text-xs text-muted-foreground">
                        Service ID
                      </p>

                      <p className="break-all font-mono text-xs">
                        {String(service.id)}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <div className="border-t" />

              {/* Additional Details */}

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />

                  <div>
                    <h3 className="text-sm font-semibold">
                      Additional details
                    </h3>

                    <p className="text-xs text-muted-foreground">
                      Service properties and configuration.
                    </p>
                  </div>
                </div>

                {detailEntries.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-5 text-center">
                    <FileText className="mx-auto mb-2 size-6 text-muted-foreground" />

                    <p className="text-sm font-medium">
                      No additional details
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      No additional service properties were returned.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {detailEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="space-y-2 rounded-lg border p-3"
                      >
                        <p className="text-xs font-semibold text-muted-foreground">
                          {formatDetailLabel(key)}
                        </p>

                        <RevenueServiceDetailValue value={value} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Record Information */}

              {(service.created_at || service.updated_at) && (
                <>
                  <div className="border-t" />

                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold">
                      Record information
                    </h3>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {service.created_at && (
                        <div className="rounded-lg border p-3">
                          <p className="mb-2 text-xs text-muted-foreground">
                            Created at
                          </p>

                          <p className="break-words text-sm font-medium">
                            {formatDetailValue(service.created_at)}
                          </p>
                        </div>
                      )}

                      {service.updated_at && (
                        <div className="rounded-lg border p-3">
                          <p className="mb-2 text-xs text-muted-foreground">
                            Last updated
                          </p>

                          <p className="break-words text-sm font-medium">
                            {formatDetailValue(service.updated_at)}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/*
|--------------------------------------------------------------------------
| Main Page
|--------------------------------------------------------------------------
*/

function RevenueServicesPageContent() {
  const router = useRouter();

  const user = useSelector(
    (state: RootState) => state.auth.user,
  );

  // Pagination

  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);

  // Search

  const [search, setSearch] = useState<string>("");

  // Applied filters

  const [filters, setFilters] =
    useState<RevenueServiceFilters>({ ...ALL_FILTERS });

  // Draft filters

  const [draftFilters, setDraftFilters] =
    useState<RevenueServiceFilters>({ ...ALL_FILTERS });

  // Revenue service detail Sheet

  const [selectedService, setSelectedService] =
    useState<RevenueServiceDetailRecord | null>(null);

  const [isDetailOpen, setIsDetailOpen] =
    useState<boolean>(false);

  const activeFilterCount = countActiveFilters(filters);
  const hasAppliedFilters = activeFilterCount > 0;
  const hasPendingChanges = !filtersEqual(
    filters,
    draftFilters,
  );

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

  /*
  |--------------------------------------------------------------------------
  | Table-Compatible Data
  |--------------------------------------------------------------------------
  */

  const tableData = useMemo(
    () =>
      services.map(
        (service) =>
          ({ ...service }) as typeof service &
            Record<string, unknown>,
      ),
    [services],
  );

  /*
  |--------------------------------------------------------------------------
  | Summary
  |--------------------------------------------------------------------------
  */

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
  | View Revenue Service
  |--------------------------------------------------------------------------
  */

  const handleViewService = (row: Record<string, unknown>) => {
    const serviceId = String(row.id ?? "");

    if (!serviceId) return;

    const service = services.find(
      (item) => String(item.id) === serviceId,
    );

    if (!service) return;

    setSelectedService({
      ...service,
    } as RevenueServiceDetailRecord);

    setIsDetailOpen(true);
  };

  const handleDetailSheetChange = (open: boolean) => {
    setIsDetailOpen(open);

    if (!open) {
      setSelectedService(null);
    }
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
              <Plus className="mr-2 size-4" />
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
              <Loader2 className="size-3.5 animate-spin" />
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
          data={tableData}
          page={page}
          pageSize={perPage}
          isLoading={isLoading || isFetching}
          actions={actions}
          onView={handleViewService}
          onEdit={(row) => {
            const serviceId = String(row.id ?? "");

            if (!serviceId) return;

            router.push(
              `/office/dashboard/revenue-managements/services/${encodeURIComponent(serviceId)}/edit`,
            );
          }}
          onDelete={(id) => {
            console.log("delete", id);
          }}
          onManageAccess={(row) => {
            const serviceId = String(row.id ?? "");

            if (!serviceId) return;

            router.push(
              `/office/dashboard/revenue-managements/services/${encodeURIComponent(serviceId)}/access`,
            );
          }}
        />

        {/* Revenue Service Detail Sheet */}

        <RevenueServiceDetailSheet
          service={selectedService}
          open={isDetailOpen}
          onOpenChange={handleDetailSheetChange}
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

/*
|--------------------------------------------------------------------------
| Page Export
|--------------------------------------------------------------------------
*/

export default function RevenueServicesPage() {
  return <RevenueServicesPageContent />;
}
