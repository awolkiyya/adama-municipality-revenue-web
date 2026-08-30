"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  CalendarClock,
  Plus,
  AlertTriangle,
  Search,
  CircleDot,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";

import { FloatingParticles } from "@/components/design/FloatingParticles";
import { Filters } from "@/components/commen/Filters";
import { Toolbar } from "@/components/commen/Toolbar";
import { CommenTable } from "@/components/table/CommenTable";
import { DataTablePagination } from "@/components/table/data-pagination";
import { CommentTableRegistry } from "@/components/table/registry";
import { resolveActions } from "@/components/table/permissions/ResolveActions";

import {
  CommentType,
  FilterField,
} from "@/types/commen";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";

import { useRevenueServices } from "@/hooks/revenue/revenueService.hook";
import {
  useDeleteTariffRule,
  useTariffRules,
} from "@/hooks/revenue/revenueTariffRule.hook";

import DeleteModal from "@/components/dialogs/deleteModal";
import FormulaVariablesModal from "@/components/dialogs/FormulaVariablesModal";

/* =========================================================================
   TYPES
=========================================================================== */

type CalculationType =
  | "fixed"
  | "percentage"
  | "per_unit"
  | "range"
  | "formula";

interface TariffRuleRow {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceCode: string;
  calculationType: CalculationType;
  amount: number | null;
  percentage: number | null;
  unit: string | null;
  minValue: number | null;
  maxValue: number | null;
  formula: string | null;
  isActive: boolean;
}

interface RangeConflict {
  serviceId: string;
  serviceName: string;
  ruleIds: [string, string];
}

interface TariffRuleFilters {
  status: "ALL" | "ACTIVE" | "INACTIVE";
  calculationType: CalculationType | "ALL";
  serviceId: string;
}

/* =========================================================================
   CONSTANTS
=========================================================================== */

const CALC_TYPE_LABELS: Record<CalculationType, string> = {
  fixed: "Fixed",
  percentage: "Percentage",
  per_unit: "Per Unit",
  range: "Range",
  formula: "Formula",
};

/*
|--------------------------------------------------------------------------
| IMPORTANT
|--------------------------------------------------------------------------
|
| Do NOT use `as const` here.
|
| FilterField expects:
|
| {
|   label: string;
|   value: string;
| }[]
|
| `as const` makes the array readonly and therefore incompatible.
|
*/

const STATUS_OPTIONS: FilterField["options"] = [
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
];

const CALC_TYPE_OPTIONS: FilterField["options"] = [
  {
    label: "All Types",
    value: "ALL",
  },

  ...Object.entries(CALC_TYPE_LABELS).map(
    ([value, label]) => ({
      label,
      value,
    }),
  ),
];

const INITIAL_FILTERS: TariffRuleFilters = {
  status: "ALL",
  calculationType: "ALL",
  serviceId: "ALL",
};

const DEFAULT_PAGE_SIZE = 10;

/* =========================================================================
   HELPERS
=========================================================================== */

/**
 * Detect overlapping range rules within the same service.
 *
 * Only rules of type "range" with both minValue and maxValue
 * defined are considered.
 */
function detectRangeOverlaps(
  rules: TariffRuleRow[],
): RangeConflict[] {
  const conflicts: RangeConflict[] = [];

  const rangeRulesByService = rules.reduce<
    Record<string, TariffRuleRow[]>
  >(
    (acc, rule) => {
      if (
        rule.calculationType !== "range" ||
        rule.minValue === null ||
        rule.maxValue === null
      ) {
        return acc;
      }

      (acc[rule.serviceId] ??= []).push(rule);

      return acc;
    },
    {},
  );

  for (const items of Object.values(rangeRulesByService)) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];

        /*
        |--------------------------------------------------------------------------
        | Range overlap
        |--------------------------------------------------------------------------
        |
        | A: [a.min, a.max]
        | B: [b.min, b.max]
        |
        | They overlap when:
        |
        | a.min < b.max
        | AND
        | b.min < a.max
        |
        */

        const overlaps =
          a.minValue! < b.maxValue! &&
          b.minValue! < a.maxValue!;

        if (overlaps) {
          conflicts.push({
            serviceId: a.serviceId,
            serviceName: a.serviceName,
            ruleIds: [a.id, b.id],
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Convert API tariff rule into the table representation.
 *
 * Kept tolerant because the API response may contain nullable
 * values and nested relationships.
 */
function mapRuleToRow(rule: any): TariffRuleRow {
  return {
    id: rule.id,

    serviceId:
      rule.serviceId ??
      rule.service_id ??
      "",

    serviceName:
      rule.service?.name ??
      "-",

    serviceCode:
      rule.service?.code ??
      rule.service?.revenueCode?.code ??
      "",

    calculationType:
      String(
        rule.calculationType ??
        rule.calculation_type ??
        "fixed",
      ).toLowerCase() as CalculationType,

    /*
    |--------------------------------------------------------------------------
    | Preserve zero values
    |--------------------------------------------------------------------------
    |
    | Do not use:
    |
    | rule.amount ? Number(rule.amount) : null
    |
    | because 0 would become null.
    |
    */

    amount:
      rule.amount !== null &&
      rule.amount !== undefined
        ? Number(rule.amount)
        : null,

    percentage:
      rule.percentage !== null &&
      rule.percentage !== undefined
        ? Number(rule.percentage)
        : null,

    unit:
      rule.measurementUnit?.name ??
      rule.measurement_unit?.name ??
      null,

    minValue:
      rule.minValue !== null &&
      rule.minValue !== undefined
        ? Number(rule.minValue)
        : null,

    maxValue:
      rule.maxValue !== null &&
      rule.maxValue !== undefined
        ? Number(rule.maxValue)
        : null,

    formula:
      rule.formula ??
      null,

    isActive:
      Boolean(
        rule.isActive ??
        rule.is_active ??
        false,
      ),
  };
}

/* =========================================================================
   SEARCH INPUT
=========================================================================== */

function SearchInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative w-full max-w-md">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />

      <Input
        className={`w-full py-5 pl-9 ${
          className ?? ""
        }`}
        {...props}
      />
    </div>
  );
}

/* =========================================================================
   PERMISSION LOADING
=========================================================================== */

function PermissionsLoading() {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-3">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />

      <p className="text-sm text-muted-foreground">
        Checking permissions…
      </p>
    </div>
  );
}

/* =========================================================================
   OVERLAP WARNING
=========================================================================== */

function OverlapWarning({
  count,
}: {
  count: number;
}) {
  if (count === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />

      <p className="text-sm text-amber-900">
        {count} overlapping range{" "}
        {count === 1 ? "rule" : "rules"} detected
      </p>
    </div>
  );
}

/* =========================================================================
   PAGE
=========================================================================== */

export default function TariffVersionDetailPage() {
  const {
    id,
    locale,
  } = useParams<{
    id: string;
    locale: string;
  }>();

  const router = useRouter();

  const user = useSelector(
    (state: RootState) => state.auth.user,
  );

  /* -----------------------------------------------------------------------
     Formula modal
  ----------------------------------------------------------------------- */

  const [formulaModalOpen, setFormulaModalOpen] =
    useState(false);

  const [selectedRuleId, setSelectedRuleId] =
    useState<string | null>(null);

  /* -----------------------------------------------------------------------
     Search
  ----------------------------------------------------------------------- */

  const [search, setSearch] = useState("");

  /* -----------------------------------------------------------------------
     Filters
  ----------------------------------------------------------------------- */

  const [filters, setFilters] =
    useState<TariffRuleFilters>(
      INITIAL_FILTERS,
    );

  /* -----------------------------------------------------------------------
     Pagination
  ----------------------------------------------------------------------- */

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] =
    useState(DEFAULT_PAGE_SIZE);

  /* -----------------------------------------------------------------------
     Revenue services
  ----------------------------------------------------------------------- */

  const {
    data: servicesData,
  } = useRevenueServices();

  const revenueServices =
    servicesData?.data ?? [];

  /* -----------------------------------------------------------------------
     Delete
  ----------------------------------------------------------------------- */

  const deleteRule =
    useDeleteTariffRule();

  const [
    deleteModalOpen,
    setDeleteModalOpen,
  ] = useState(false);

  const [
    selectedDeleteRuleId,
    setSelectedDeleteRuleId,
  ] = useState<string | null>(null);

  /* -----------------------------------------------------------------------
     Tariff rules query
  ----------------------------------------------------------------------- */

  const {
    data,
    isLoading,
  } = useTariffRules({
    tariff_version_id: id,

    page,

    per_page: pageSize,

    service_id:
      filters.serviceId === "ALL"
        ? undefined
        : filters.serviceId,

    is_active:
      filters.status === "ACTIVE"
        ? true
        : filters.status === "INACTIVE"
          ? false
          : undefined,
  });

  /* -----------------------------------------------------------------------
     Safe API data
  ----------------------------------------------------------------------- */

  const rules = data?.data ?? [];

  const meta = data?.meta;

  /* -----------------------------------------------------------------------
     Table data
  ----------------------------------------------------------------------- */

  const tableData: TariffRuleRow[] =
    useMemo(
      () =>
        rules.map(
          mapRuleToRow,
        ),
      [rules],
    );

  /* -----------------------------------------------------------------------
     Search
  ----------------------------------------------------------------------- */

  /*
  |--------------------------------------------------------------------------
  | Currently the API query does not receive `search`.
  |--------------------------------------------------------------------------
  |
  | Therefore this searches the currently loaded page.
  |
  | Once the backend supports search, add:
  |
  | search: search.trim() || undefined
  |
  | to useTariffRules().
  |
  */

  const filteredTableData =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return tableData;
      }

      return tableData.filter(
        (row) =>
          row.serviceName
            .toLowerCase()
            .includes(query) ||
          row.serviceCode
            .toLowerCase()
            .includes(query),
      );
    }, [
      tableData,
      search,
    ]);

  /* -----------------------------------------------------------------------
     Range conflicts
  ----------------------------------------------------------------------- */

  const overlaps = useMemo(
    () =>
      detectRangeOverlaps(
        filteredTableData,
      ),
    [filteredTableData],
  );

  /* -----------------------------------------------------------------------
     Selected rule
  ----------------------------------------------------------------------- */

  const selectedRule =
    useMemo(
      () =>
        tableData.find(
          (rule) =>
            rule.id ===
            selectedRuleId,
        ) ?? null,
      [
        tableData,
        selectedRuleId,
      ],
    );

  /* -----------------------------------------------------------------------
     Filter schema
  ----------------------------------------------------------------------- */

  const ruleFilters: FilterField[] =
    useMemo(
      () => [
        {
          key: "status",

          label: "Status",

          type: "select",

          defaultValue: "ALL",

          icon: CircleDot,

          options:
            STATUS_OPTIONS,
        },

        {
          key: "calculationType",

          label: "Calculation",

          type: "select",

          defaultValue: "ALL",

          icon:
            SlidersHorizontal,

          options:
            CALC_TYPE_OPTIONS,
        },

        {
          key: "serviceId",

          label: "Service",

          type: "select",

          defaultValue: "ALL",

          icon: CircleDot,

          options: [
            {
              label:
                "All Services",
              value: "ALL",
            },

            ...revenueServices.map(
              (service) => ({
                label:
                  service.name,

                value:
                  service.id,
              }),
            ),
          ],
        },
      ],
      [revenueServices],
    );

  /* -----------------------------------------------------------------------
     Formula modal handlers
  ----------------------------------------------------------------------- */

  const handleManageFormulaVariables =
    useCallback(
      (rule: TariffRuleRow) => {
        setSelectedRuleId(
          rule.id,
        );

        setFormulaModalOpen(
          true,
        );
      },
      [],
    );

  const handleCloseFormulaModal =
    useCallback(() => {
      setFormulaModalOpen(
        false,
      );

      setSelectedRuleId(
        null,
      );
    }, []);

  /* -----------------------------------------------------------------------
     Search handler
  ----------------------------------------------------------------------- */

  const handleSearchChange =
    useCallback(
      (
        e: React.ChangeEvent<HTMLInputElement>,
      ) => {
        setSearch(
          e.target.value,
        );

        setPage(1);
      },
      [],
    );

  /* -----------------------------------------------------------------------
     Filter handler
  ----------------------------------------------------------------------- */

  const handleFiltersChange =
    useCallback(
      (
        next: Partial<TariffRuleFilters>,
      ) => {
        setFilters(
          (prev) => ({
            ...prev,
            ...next,
          }),
        );

        setPage(1);
      },
      [],
    );

  /* -----------------------------------------------------------------------
     Filter reset
  ----------------------------------------------------------------------- */

  const handleFiltersReset =
    useCallback(() => {
      setFilters(
        INITIAL_FILTERS,
      );

      setPage(1);
    }, []);

  /* -----------------------------------------------------------------------
     Page size
  ----------------------------------------------------------------------- */

  const handlePageSizeChange =
    useCallback(
      (size: number) => {
        setPageSize(size);

        setPage(1);
      },
      [],
    );

  /* -----------------------------------------------------------------------
     Add rule
  ----------------------------------------------------------------------- */

  const handleAddRule =
    useCallback(() => {
      router.push(
        `/${locale}/office/dashboard/revenue-managements/tariff-versions/${id}/tariff-rule/new`,
      );
    }, [
      router,
      locale,
      id,
    ]);

  /* -----------------------------------------------------------------------
     Edit rule
  ----------------------------------------------------------------------- */

  const handleEditRule =
    useCallback(
      (rule: TariffRuleRow) => {
        router.push(
          `/${locale}/office/dashboard/revenue-managements/tariff-versions/${id}/tariff-rule/${rule.id}`,
        );
      },
      [
        router,
        locale,
        id,
      ],
    );

  /* -----------------------------------------------------------------------
     Delete rule
  ----------------------------------------------------------------------- */

  const handleDeleteRule =
    useCallback(
      (ruleId: string) => {
        setSelectedDeleteRuleId(
          ruleId,
        );

        setDeleteModalOpen(
          true,
        );
      },
      [],
    );

  /* -----------------------------------------------------------------------
     Confirm delete
  ----------------------------------------------------------------------- */

  const confirmDeleteRule =
    useCallback(() => {
      if (
        !selectedDeleteRuleId
      ) {
        return;
      }

      deleteRule.mutate(
        selectedDeleteRuleId,
        {
          onSuccess: () => {
            toast.success(
              "Tariff rule deleted successfully",
            );

            setDeleteModalOpen(
              false,
            );

            setSelectedDeleteRuleId(
              null,
            );
          },

          onError: (
            error: any,
          ) => {
            toast.error(
              error?.message ??
                "Failed to delete tariff rule",
            );
          },
        },
      );
    }, [
      deleteRule,
      selectedDeleteRuleId,
    ]);

  /* -----------------------------------------------------------------------
     Permission loading
  ----------------------------------------------------------------------- */

  if (!user?.role) {
    return (
      <PermissionsLoading />
    );
  }

  /* -----------------------------------------------------------------------
     Actions
  ----------------------------------------------------------------------- */

  const actions =
    resolveActions(
      CommentTableRegistry.tariffRule,
      user.role.name,
    );

  /* =========================================================================
     RENDER
  ========================================================================== */

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">

      {/* -------------------------------------------------------------------
          HEADER
      ------------------------------------------------------------------- */}

      <Banner
        description="Manage pricing rules for this tariff version."
        badge={
          <IconBadge
            className="gap-2 rounded-full bg-black/20 p-3 text-xs text-white"
            icon={
              <CalendarClock className="h-4 w-4" />
            }
          >
            {`Tariff Version · ${id}`}
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
        className="text-white"
        actions={
          <Button
            onClick={
              handleAddRule
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        }
      />

      {/* -------------------------------------------------------------------
          RANGE OVERLAP WARNING
      ------------------------------------------------------------------- */}

      <OverlapWarning
        count={overlaps.length}
      />

      {/* -------------------------------------------------------------------
          TOOLBAR
      ------------------------------------------------------------------- */}

      <Toolbar
        search={
          <SearchInput
            placeholder="Search rules by service..."
            value={search}
            onChange={
              handleSearchChange
            }
            aria-label="Search tariff rules"
          />
        }
        right={
          <Filters
            schema={ruleFilters}
            value={filters}
            onChange={
              handleFiltersChange
            }
            onReset={
              handleFiltersReset
            }
          />
        }
      />

      {/* -------------------------------------------------------------------
          TABLE
      ------------------------------------------------------------------- */}

      <CommenTable
        type={
          "tariffRule" as CommentType
        }
        data={
          filteredTableData
        }
        page={page}
        pageSize={
          pageSize
        }
        isLoading={
          isLoading
        }
        actions={
          actions
        }
        onEdit={
          handleEditRule
        }
        onDelete={
          handleDeleteRule
        }
        onManageFormulaVariables={
          handleManageFormulaVariables
        }
      />

      {/* -------------------------------------------------------------------
          PAGINATION
      ------------------------------------------------------------------- */}

      <DataTablePagination
        page={page}
        pageSize={
          pageSize
        }
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

      {/* -------------------------------------------------------------------
          DELETE CONFIRMATION
      ------------------------------------------------------------------- */}

      <DeleteModal
        isOpen={
          deleteModalOpen
        }
        onClose={() => {
          setDeleteModalOpen(
            false,
          );

          setSelectedDeleteRuleId(
            null,
          );
        }}
        action={
          confirmDeleteRule
        }
        title="Delete Tariff Rule"
        description="Are you sure you want to delete this tariff rule? This action will permanently remove the pricing configuration and cannot be undone."
      />

      {/* -------------------------------------------------------------------
          FORMULA VARIABLES MODAL
      ------------------------------------------------------------------- */}

      {selectedRuleId && (
        <FormulaVariablesModal
          open={
            formulaModalOpen
          }
          onClose={
            handleCloseFormulaModal
          }
          tariffRuleId={
            selectedRuleId
          }
          formula={
            selectedRule?.formula ??
            null
          }
        />
      )}
    </div>
  );
}