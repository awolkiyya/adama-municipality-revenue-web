"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Landmark,
  Search,
  CircleDot,
  Database,
  Users,
  UserPlus,
  Upload,
  Plus,
  UserRoundCheck,
  SlidersHorizontal,
  X,
  RotateCcw,
  Minus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { IconBadge } from "@/components/commen/icon-badge";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

import {
  CommentType,
  FilterField,
} from "@/types/commen";

import { useCitizens, useToggleCitizenStatus } from "@/hooks/useCitizen.hook";

import { Toolbar } from "@/components/commen/Toolbar";
import { ExportDropdown } from "@/components/commen/ExportDropdown";
import { CommenTable } from "@/components/table/CommenTable";
import { DataTablePagination } from "@/components/table/data-pagination";
import { Skeleton } from "@/components/ui/skeleton";


import { cn } from "@/lib/utils";
import ProtectedRoute from "@/components/access/ProtectedRoute";

/**
 * Extract the exact filter type used by useCitizens.
 *
 * NonNullable is required because the hook accepts:
 *
 * CitizenFilters | undefined
 */
type CitizenQueryParams = NonNullable<
  Parameters<typeof useCitizens>[0]
>;

type CitizenSource = NonNullable<
  CitizenQueryParams["source"]
>;

type CitizenGender = NonNullable<
  CitizenQueryParams["gender"]
>;


/* ============================================================
   FILTER SCHEMA
============================================================ */

export const citizenFilters: FilterField[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    icon: CircleDot,
    defaultValue: "ALL",
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

  {
    key: "source",
    label: "Registration Source",
    type: "select",
    icon: Database,
    defaultValue: "ALL",
    options: [
      {
        label: "All Sources",
        value: "ALL",
      },
      {
        label: "Manual Registration",
        value: "MANUAL",
      },
      {
        label: "Imported Records",
        value: "IMPORT",
      },
      {
        label: "External System",
        value: "EXTERNAL_SYSTEM",
      },
    ],
  },

  {
    key: "gender",
    label: "Gender",
    type: "select",
    icon: UserRoundCheck,
    defaultValue: "ALL",
    options: [
      {
        label: "All",
        value: "ALL",
      },
      {
        label: "Male",
        value: "MALE",
      },
      {
        label: "Female",
        value: "FEMALE",
      },
    ],
  },
];


/* ============================================================
   INITIAL FILTERS
============================================================ */

const INITIAL_FILTERS: Record<string, string> = {
  status: "ALL",
  source: "ALL",
  gender: "ALL",
};

const DEFAULT_PAGE_SIZE = 10;


/* ============================================================
   SEARCH INPUT
============================================================ */

function SearchInput(
  props: React.ComponentProps<typeof Input>
) {
  return (
    <div className="relative w-full max-w-xl">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      <Input
        {...props}
        className="h-11 pl-10"
      />
    </div>
  );
}


/* ============================================================
   FILTER HELPERS
============================================================ */

function isActiveValue(
  value: string | undefined
): boolean {
  return Boolean(value) && value !== "ALL";
}

function activeEntries(
  value: Record<string, string>
) {
  return Object.entries(value).filter(
    ([, currentValue]) =>
      isActiveValue(currentValue)
  );
}

function fieldLabelFor(
  key: string
): string {
  return (
    citizenFilters.find(
      (field) => field.key === key
    )?.label ?? key
  );
}

function optionLabelFor(
  key: string,
  value: string
): string {
  const field =
    citizenFilters.find(
      (item) => item.key === key
    );

  return (
    field?.options?.find(
      (option) =>
        option.value === value
    )?.label ?? value
  );
}


/* ============================================================
   FILTER DEFAULT VALUE
============================================================ */

/**
 * FilterField.defaultValue supports multiple
 * field types:
 *
 * string | DateRangeValue | null | undefined
 *
 * Citizens only use string-based select filters.
 */
function getStringDefaultValue(
  field: FilterField
): string {
  return typeof field.defaultValue === "string"
    ? field.defaultValue
    : "ALL";
}


/* ============================================================
   PILL GROUP
============================================================ */

function PillGroup({
  field,
  value,
  onChange,
}: {
  field: FilterField;
  value: string;
  onChange: (value: string) => void;
}) {
  const Icon =
    field.icon ?? SlidersHorizontal;

  const isActive =
    isActiveValue(value);

  const defaultValue =
    getStringDefaultValue(field);

  return (
    <div className="space-y-2.5">
      {/* Field header */}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />

          {field.label}
        </div>

        {isActive && (
          <button
            type="button"
            onClick={() =>
              onChange(defaultValue)
            }
            className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {/* Options */}

      <div className="flex flex-wrap gap-2">
        {field.options?.map(
          (option) => {
            const selected =
              value === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange(
                    option.value
                  )
                }
                aria-pressed={selected}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-input bg-background text-foreground hover:bg-muted"
                )}
              >
                {option.label}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}


/* ============================================================
   FILTERS SHEET
============================================================ */

interface FiltersSheetProps {
  value: Record<string, string>;

  onApply: (
    value: Record<string, string>
  ) => void;

  onReset: () => void;
}

function FiltersSheet({
  value,
  onApply,
  onReset,
}: FiltersSheetProps) {
  const [open, setOpen] =
    useState(false);

  const [draft, setDraft] =
    useState<Record<string, string>>(
      value
    );

  /* ----------------------------------------------------------
     Applied filter count
  ---------------------------------------------------------- */

  const appliedCount = useMemo(
    () =>
      activeEntries(value).length,
    [value]
  );

  /* ----------------------------------------------------------
     Draft active filters
  ---------------------------------------------------------- */

  const draftActive = useMemo(
    () => activeEntries(draft),
    [draft]
  );

  /* ----------------------------------------------------------
     Detect changes
  ---------------------------------------------------------- */

  const isDirty = useMemo(
    () =>
      JSON.stringify(draft) !==
      JSON.stringify(value),
    [draft, value]
  );

  /* ----------------------------------------------------------
     Sheet open state
  ---------------------------------------------------------- */

  const handleOpenChange = (
    next: boolean
  ) => {
    if (next) {
      setDraft({
        ...value,
      });
    }

    setOpen(next);
  };

  /* ----------------------------------------------------------
     Field change
  ---------------------------------------------------------- */

  const handleFieldChange = (
    key: string,
    value: string
  ) => {
    setDraft(
      (previous) => ({
        ...previous,
        [key]: value,
      })
    );
  };

  /* ----------------------------------------------------------
     Remove chip
  ---------------------------------------------------------- */

  const handleRemoveChip = (
    key: string
  ) => {
    setDraft(
      (previous) => ({
        ...previous,
        [key]:
          INITIAL_FILTERS[key] ??
          "ALL",
      })
    );
  };

  /* ----------------------------------------------------------
     Clear all
  ---------------------------------------------------------- */

  const handleClearAll = () => {
    setDraft({
      ...INITIAL_FILTERS,
    });
  };

  /* ----------------------------------------------------------
     Apply
  ---------------------------------------------------------- */

  const handleApply = () => {
    onApply({
      ...draft,
    });

    setOpen(false);
  };

  /* ----------------------------------------------------------
     Reset
  ---------------------------------------------------------- */

  const handleReset = () => {
    onReset();

    setDraft({
      ...INITIAL_FILTERS,
    });

    setOpen(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={
        handleOpenChange
      }
    >
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-11 gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />

          Filters

          {appliedCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 rounded-full px-1.5 py-0 text-xs"
            >
              {appliedCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        {/* Header */}

        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>
            Filter Citizens
          </SheetTitle>

          <SheetDescription>
            Narrow the list by status,
            registration source, and
            gender.
          </SheetDescription>
        </SheetHeader>

        {/* Active filter chips */}

        {draftActive.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-6 py-3">
            {draftActive.map(
              ([key, currentValue]) => (
                <span
                  key={key}
                  className="flex items-center gap-1.5 rounded-full bg-background py-1 pl-3 pr-1.5 text-xs font-medium shadow-sm ring-1 ring-border"
                >
                  <span className="text-muted-foreground">
                    {fieldLabelFor(
                      key
                    )}
                    :
                  </span>

                  {optionLabelFor(
                    key,
                    currentValue
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveChip(
                        key
                      )
                    }
                    className="rounded-full p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label={`Remove ${fieldLabelFor(
                      key
                    )} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            )}

            <button
              type="button"
              onClick={
                handleClearAll
              }
              className="ml-auto flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />

              Clear all
            </button>
          </div>
        )}

        {/* Filter fields */}

        <ScrollArea className="flex-1 px-6 py-5">
          <div className="space-y-6">
            {citizenFilters.map(
              (field, index) => {
                const fieldValue =
                  draft[field.key] ??
                  getStringDefaultValue(
                    field
                  );

                return (
                  <div
                    key={field.key}
                  >
                    <PillGroup
                      field={field}
                      value={
                        fieldValue
                      }
                      onChange={(
                        selectedValue
                      ) =>
                        handleFieldChange(
                          field.key,
                          selectedValue
                        )
                      }
                    />

                    {index <
                      citizenFilters.length -
                        1 && (
                      <Separator className="mt-6" />
                    )}
                  </div>
                );
              }
            )}
          </div>
        </ScrollArea>

        {/* Footer */}

        <SheetFooter className="gap-2 border-t px-6 py-4 sm:justify-between">
          <Button
            variant="ghost"
            onClick={
              handleReset
            }
            disabled={
              appliedCount === 0 &&
              draftActive.length ===
                0
            }
          >
            Reset all
          </Button>

          <div className="flex gap-2">
            <SheetClose asChild>
              <Button variant="outline">
                Cancel
              </Button>
            </SheetClose>

            <Button
              onClick={
                handleApply
              }
              disabled={!isDirty}
            >
              Apply

              {draftActive.length >
                0 &&
                ` · ${draftActive.length}`}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}


/* ============================================================
   PROTECTED PAGE
============================================================ */

/**
 * Page-level authorization.
 *
 * The permission check happens before
 * CitizensPageContent is rendered.
 *
 * Use "citizens" instead of "taxpayers"
 * if that is the resource name defined
 * in your permission system.
 */
export default function Page() {
  return (
    <ProtectedRoute
      resource="citizens"
      action="view"
    >
      <CitizensPageContent />
    </ProtectedRoute>
  );
}


/* ============================================================
   CITIZENS PAGE CONTENT
============================================================ */

function CitizensPageContent() {
  const router = useRouter();

  /* ----------------------------------------------------------
     Search
  ---------------------------------------------------------- */

  const [search, setSearch] =
    useState("");

  /* ----------------------------------------------------------
     Pagination
  ---------------------------------------------------------- */

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(
      DEFAULT_PAGE_SIZE
    );

  /* ----------------------------------------------------------
     Filters
  ---------------------------------------------------------- */

  const [filters, setFilters] =
    useState<
      Record<string, string>
    >({
      ...INITIAL_FILTERS,
    });

  /* ==========================================================
     TYPED CITIZEN FILTER VALUES
  ========================================================== */

  /**
   * These variables convert the generic
   * Record<string, string> values into the exact
   * types expected by useCitizens().
   *
   * The cast is safe because the values come from
   * citizenFilters, which only contains valid API
   * values.
   */

  const sourceFilter =
    filters.source === "ALL"
      ? undefined
      : (filters.source as CitizenSource);

  const genderFilter =
    filters.gender === "ALL"
      ? undefined
      : (filters.gender as CitizenGender);

  /* ----------------------------------------------------------
     Citizens query
  ---------------------------------------------------------- */

  const {
    data,
    isLoading,
    isFetching,
  } = useCitizens({
    search,
    page,
    per_page: pageSize,

    source: sourceFilter,

    gender: genderFilter,
  });


  const toggleStatusMutation =
  useToggleCitizenStatus();
  /* ----------------------------------------------------------
     Response data
  ---------------------------------------------------------- */

  const citizens =
    data?.data ?? [];

  const meta =
    data?.meta;

  /* ----------------------------------------------------------
     Statistics
  ---------------------------------------------------------- */

  const stats = useMemo(
    () => ({
      total:
        meta?.total ?? 0,

      manual:
        citizens.filter(
          (citizen) =>
            citizen.source ===
            "MANUAL"
        ).length,

      imported:
        citizens.filter(
          (citizen) =>
            citizen.source ===
            "IMPORT"
        ).length,

      external:
        citizens.filter(
          (citizen) =>
            citizen.source ===
            "EXTERNAL_SYSTEM"
        ).length,
    }),
    [citizens, meta]
  );

  /* ----------------------------------------------------------
     Search handler
  ---------------------------------------------------------- */

  const handleSearchChange =
    useCallback(
      (
        event: React.ChangeEvent<HTMLInputElement>
      ) => {
        setSearch(
          event.target.value
        );

        setPage(1);
      },
      []
    );

  /* ----------------------------------------------------------
     Filter apply
  ---------------------------------------------------------- */

  const handleFiltersApply =
    useCallback(
      (
        value: Record<
          string,
          string
        >
      ) => {
        setFilters({
          ...value,
        });

        setPage(1);
      },
      []
    );

  /* ----------------------------------------------------------
     Filter reset
  ---------------------------------------------------------- */

  const handleFiltersReset =
    useCallback(() => {
      setFilters({
        ...INITIAL_FILTERS,
      });

      setPage(1);
    }, []);

  /* ----------------------------------------------------------
     Page size
  ---------------------------------------------------------- */

  const handlePageSizeChange =
    useCallback(
      (size: number) => {
        setPageSize(size);
        setPage(1);
      },
      []
    );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <Banner
        description="Manage citizen registration, identity records, imports, and external system synchronization across the revenue platform."
        badge={
          <IconBadge
            className="rounded-full bg-black/20 px-3 py-2 text-white"
            icon={
              <Landmark className="h-3 w-3" />
            }
          >
            Citizen Management
          </IconBadge>
        }
        background={
          <FloatingParticles
            color="#111"
            count={35}
            speed={0.2}
            connectDistance={100}
            position="bottom-right"
          />
        }
        overlayClassName="bg-gradient-to-r from-primary via-primary/90 to-primary/60"
        actions={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() =>
                router.push(
                  "/office/dashboard/taxpayers/create"
                )
              }
            >
              <Plus className="mr-2 h-4 w-4" />

              New Citizen
            </Button>

            <Button
              onClick={() =>
                router.push(
                  "/office/dashboard/taxpayers/import"
                )
              }
            >
              <Upload className="mr-2 h-4 w-4" />

              Import Citizens
            </Button>
          </div>
        }
        className="text-white"
      />

      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          title="Total Citizens"
          subtitle="Registered citizens"
          value={stats.total}
        />

        <StatCard
          icon={UserPlus}
          title="Manual Registration"
          subtitle="Created by officers"
          value={stats.manual}
        />

        <StatCard
          icon={Upload}
          title="Imported Records"
          subtitle="Excel / CSV imports"
          value={stats.imported}
        />

        <StatCard
          icon={Database}
          title="External System"
          subtitle="National ID synchronization"
          value={stats.external}
        />
      </div>

      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <Toolbar
        search={
          <SearchInput
            placeholder="Search by citizen ID, full name, national ID or phone number..."
            value={search}
            onChange={
              handleSearchChange
            }
          />
        }
        right={
          <div className="flex items-center gap-3">
            <FiltersSheet
              value={filters}
              onApply={
                handleFiltersApply
              }
              onReset={
                handleFiltersReset
              }
            />

            <ExportDropdown />
          </div>
        }
      />

      {/* ======================================================
          CITIZEN TABLE
      ====================================================== */}

    <CommenTable
      type={"taxpayer" as CommentType}
      data={citizens}
      page={page}
      pageSize={pageSize}
      isLoading={
        isLoading ||
        isFetching ||
        toggleStatusMutation.isPending
      }
      actions={{
        view: true,
        edit: true,
        delete: true,
        create: false,
        toggleStatus: true,
        updatePassword: false,
        updateRole: false,
        updateHierarchy: false,
      }}
      onView={(row) =>
        router.push(
          `/office/dashboard/taxpayers/${row.id}/detail`
        )
      }
      onEdit={(row) =>
        router.push(
          `/office/dashboard/taxpayers/${row.id}/edit`
        )
      }
      onDelete={(id) =>
        console.log(
          "delete citizen",
          id
        )
      }
      onToggleStatus={(row) => {
        toggleStatusMutation.mutate({
          id: row.id,
          isActive: !row.is_active,
        });
      }}
    />

      {/* ======================================================
          PAGINATION
      ====================================================== */}

      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={
          meta?.total ?? 0
        }
        onPageChange={
          setPage
        }
        onPageSizeChange={
          handlePageSizeChange
        }
      />
    </div>
  );
}


/* ============================================================
   STAT CARD TYPES
============================================================ */

type StatVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive";

type StatTrend = {
  /**
   * Signed percentage change.
   *
   * Example:
   * 12.4
   * -3.2
   */
  value: number;

  /**
   * Example:
   * "vs last month"
   */
  label?: string;
};

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  value: number;

  /**
   * Tints the icon chip and
   * left accent bar.
   */
  variant?: StatVariant;

  /**
   * Optional period-over-period
   * change.
   */
  trend?: StatTrend;

  /**
   * Shows skeleton while loading.
   */
  isLoading?: boolean;

  /**
   * Override number formatting.
   */
  formatValue?: (
    value: number
  ) => string;
}


/* ============================================================
   STAT CARD STYLES
============================================================ */

const VARIANT_STYLES: Record<
  StatVariant,
  {
    icon: string;
    accent: string;
  }
> = {
  default: {
    icon:
      "bg-primary/10 text-primary",
    accent:
      "bg-primary",
  },

  success: {
    icon:
      "bg-emerald-500/10 text-emerald-600",
    accent:
      "bg-emerald-500",
  },

  warning: {
    icon:
      "bg-amber-500/10 text-amber-600",
    accent:
      "bg-amber-500",
  },

  destructive: {
    icon:
      "bg-destructive/10 text-destructive",
    accent:
      "bg-destructive",
  },
};


/* ============================================================
   TREND INDICATOR
============================================================ */

function TrendIndicator({
  trend,
}: {
  trend: StatTrend;
}) {
  const isFlat =
    trend.value === 0;

  const isUp =
    trend.value > 0;

  const Icon = isFlat
    ? Minus
    : isUp
    ? TrendingUp
    : TrendingDown;

  const color = isFlat
    ? "text-muted-foreground"
    : isUp
    ? "text-emerald-600"
    : "text-destructive";

  return (
    <p
      className={cn(
        "mt-2 flex items-center gap-1 text-xs font-medium",
        color
      )}
    >
      <Icon
        className="h-3.5 w-3.5"
        aria-hidden="true"
      />

      {isFlat
        ? "No change"
        : `${isUp ? "+" : ""}${trend.value}%`}

      {trend.label && (
        <span className="font-normal text-muted-foreground">
          {trend.label}
        </span>
      )}
    </p>
  );
}


/* ============================================================
   STAT CARD
============================================================ */

export function StatCard({
  icon: Icon,
  title,
  subtitle,
  value,
  variant = "default",
  trend,
  isLoading = false,
  formatValue,
}: StatCardProps) {
  const styles =
    VARIANT_STYLES[variant];

  /* ----------------------------------------------------------
     Loading
  ---------------------------------------------------------- */

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="space-y-3 py-5 pl-6">
          <Skeleton className="h-4 w-24" />

          <Skeleton className="h-3 w-32" />

          <Skeleton className="h-8 w-20" />
        </CardContent>
      </Card>
    );
  }

  /* ----------------------------------------------------------
     Value formatting
  ---------------------------------------------------------- */

  const displayValue =
    formatValue
      ? formatValue(value)
      : value.toLocaleString();

  /* ----------------------------------------------------------
     Render
  ---------------------------------------------------------- */

  return (
    <Card className="group relative overflow-hidden border shadow-sm transition hover:shadow-md">
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          styles.accent
        )}
        aria-hidden="true"
      />

      <CardContent className="flex items-start justify-between gap-4 py-5 pl-6">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>

          <p className="mt-0.5 truncate text-xs text-muted-foreground/80">
            {subtitle}
          </p>

          <h3 className="mt-3 text-3xl font-bold tabular-nums tracking-tight">
            {displayValue}
          </h3>

          {trend && (
            <TrendIndicator
              trend={trend}
            />
          )}
        </div>

        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
            styles.icon
          )}
        >
          <Icon
            className="h-6 w-6"
            aria-hidden="true"
          />
        </div>
      </CardContent>
    </Card>
  );
}
