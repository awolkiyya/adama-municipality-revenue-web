"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSelector } from "react-redux";

import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { Button } from "@/components/ui/button";
import {
  CalendarClock,
  Plus,
  AlertTriangle,
  CircleDot,
  SlidersHorizontal,
  Loader2,
  Calculator,
  FileText,
  Database,
  CheckCircle2,
  XCircle,
  Hash,
  Info,
} from "lucide-react";

import { FloatingParticles } from "@/components/design/FloatingParticles";
import { Filters } from "@/components/commen/Filters";
import { CommenTable } from "@/components/table/CommenTable";
import { DataTablePagination } from "@/components/table/data-pagination";
import { CommentTableRegistry } from "@/components/table/registry";
import { resolveActions } from "@/components/table/permissions/ResolveActions";
import { AppFilterBar } from "@/components/app-filter-bar";

import {
  CommentType,
  FilterField,
} from "@/types/commen";

import { RootState } from "@/lib/store/store";

import { useRevenueServices } from "@/hooks/revenue/revenueService.hook";
import {
  useDeleteTariffRule,
  useTariffRules,
} from "@/hooks/revenue/revenueTariffRule.hook";

import DeleteModal from "@/components/dialogs/deleteModal";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface TariffRuleApiRecord {
  id: string | number;
  [key: string]: unknown;
}

type UnknownRecord = Record<string, unknown>;

interface TariffRuleCondition {
  fieldId?: string;
  field_id?: string;
  fieldName?: string | null;
  field_name?: string | null;
  fieldCode?: string | null;
  field_code?: string | null;
  operator?: string;
  value?: unknown;
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

const CONDITION_OPERATOR_LABELS: Record<string, string> = {
  equals: "Equals",
  not_equals: "Does not equal",
  greater_than: "Greater than",
  greater_than_or_equal: "Greater than or equal to",
  less_than: "Less than",
  less_than_or_equal: "Less than or equal to",
  contains: "Contains",
  not_contains: "Does not contain",
  in: "Is one of",
  not_in: "Is not one of",
  starts_with: "Starts with",
  ends_with: "Ends with",
  is_empty: "Is empty",
  is_not_empty: "Is not empty",
};

const STATUS_OPTIONS: FilterField["options"] = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const CALC_TYPE_OPTIONS: FilterField["options"] = [
  { label: "All Types", value: "ALL" },
  ...Object.entries(CALC_TYPE_LABELS).map(([value, label]) => ({
    label,
    value,
  })),
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

function normalizeCalculationType(
  value: unknown,
): CalculationType {
  const normalized = String(value ?? "").toLowerCase();

  switch (normalized) {
    case "fixed":
    case "percentage":
    case "per_unit":
    case "range":
    case "formula":
      return normalized;

    default:
      return "fixed";
  }
}

function asRecord(value: unknown): UnknownRecord | null {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as UnknownRecord;
  }

  return null;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
}

function getRuleValue(
  rule: TariffRuleApiRecord,
  camelKey: string,
  snakeKey?: string,
): unknown {
  return (
    rule[camelKey] ??
    (snakeKey ? rule[snakeKey] : undefined)
  );
}

function getConditionValue(
  condition: UnknownRecord,
  camelKey: string,
  snakeKey?: string,
): unknown {
  return (
    condition[camelKey] ??
    (snakeKey ? condition[snakeKey] : undefined)
  );
}

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not configured";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function formatConditionOperator(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "Not specified";
  }

  const normalized = value.trim().toLowerCase();

  if (CONDITION_OPERATOR_LABELS[normalized]) {
    return CONDITION_OPERATOR_LABELS[normalized];
  }

  // Fallback for operators not explicitly listed above.
  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: unknown): string {
  if (typeof value !== "string" || !value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function mapRuleToRow(rule: TariffRuleApiRecord): TariffRuleRow {
  const service = asRecord(rule.service);

  const measurementUnit = asRecord(
    rule.measurementUnit ?? rule.measurement_unit,
  );

  const revenueCode = asRecord(
    service?.revenueCode ?? service?.revenue_code,
  );

  return {
    id: String(rule.id ?? ""),

    serviceId: String(
      rule.serviceId ?? rule.service_id ?? "",
    ),

    serviceName: String(
      service?.name ?? rule.service_name ?? "-",
    ),

    serviceCode: String(
      service?.code ??
        revenueCode?.code ??
        rule.service_code ??
        "",
    ),

    calculationType: normalizeCalculationType(
      rule.calculationType ?? rule.calculation_type,
    ),

    amount: toNullableNumber(rule.amount),

    percentage: toNullableNumber(rule.percentage),

    unit: toNullableString(
      measurementUnit?.name ?? rule.unit,
    ),

    minValue: toNullableNumber(
      rule.minValue ?? rule.min_value,
    ),

    maxValue: toNullableNumber(
      rule.maxValue ?? rule.max_value,
    ),

    formula: toNullableString(rule.formula),

    isActive: Boolean(
      rule.isActive ?? rule.is_active ?? false,
    ),
  };
}

function filtersAreEqual(
  first: TariffRuleFilters,
  second: TariffRuleFilters,
): boolean {
  return (
    first.status === second.status &&
    first.calculationType === second.calculationType &&
    first.serviceId === second.serviceId
  );
}

/**
 * Detect overlapping ranges within each service.
 * Adjacent ranges such as [10, 20] and [20, 30]
 * are not considered overlapping.
 */
function detectRangeOverlaps(
  rules: TariffRuleRow[],
): RangeConflict[] {
  const conflicts: RangeConflict[] = [];

  const rangeRulesByService = rules.reduce<
    Record<string, TariffRuleRow[]>
  >((acc, rule) => {
    if (
      rule.calculationType !== "range" ||
      rule.minValue === null ||
      rule.maxValue === null
    ) {
      return acc;
    }

    (acc[rule.serviceId] ??= []).push(rule);

    return acc;
  }, {});

  for (const items of Object.values(rangeRulesByService)) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const first = items[i];
        const second = items[j];

        if (
          first.minValue! < second.maxValue! &&
          second.minValue! < first.maxValue!
        ) {
          conflicts.push({
            serviceId: first.serviceId,
            serviceName: first.serviceName,
            ruleIds: [first.id, second.id],
          });
        }
      }
    }
  }

  return conflicts;
}

/* =========================================================================
   DETAIL COMPONENTS
=========================================================================== */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <div className="break-words text-sm font-medium">
        {value}
      </div>
    </div>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>

      {children}
    </section>
  );
}

/* =========================================================================
   TARIFF RULE DETAIL SHEET
=========================================================================== */

function TariffRuleDetailSheet({
  rule,
  open,
  onOpenChange,
}: {
  rule: TariffRuleApiRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const service = asRecord(rule?.service);

  const tariffVersion = asRecord(
    rule?.tariffVersion ?? rule?.tariff_version,
  );

  const revenueCode = asRecord(
    service?.revenueCode ?? service?.revenue_code,
  );

  const measurementUnit = asRecord(
    rule?.measurementUnit ?? rule?.measurement_unit,
  );

  const calculationType = normalizeCalculationType(
    rule
      ? getRuleValue(rule, "calculationType", "calculation_type")
      : undefined,
  );

  const isActive = Boolean(
    rule
      ? getRuleValue(rule, "isActive", "is_active")
      : false,
  );

  const conditionsValue = rule
    ? getRuleValue(rule, "conditions")
    : undefined;

  const conditions: TariffRuleCondition[] = Array.isArray(
    conditionsValue,
  )
    ? conditionsValue.filter(
        (condition): condition is TariffRuleCondition =>
          asRecord(condition) !== null,
      )
    : [];

  const createdAt = rule
    ? getRuleValue(rule, "createdAt", "created_at")
    : undefined;

  const updatedAt = rule
    ? getRuleValue(rule, "updatedAt", "updated_at")
    : undefined;

  const serviceName = String(
    service?.name ?? rule?.service_name ?? "—",
  );

  const ruleName = String(
    rule?.name ?? rule?.code ?? "Tariff Rule",
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b px-6 py-5 pr-12 text-left">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted/50">
              <Calculator className="size-5 text-primary" />
            </div>

            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg">
                Tariff Rule Details
              </SheetTitle>

              <SheetDescription className="mt-1">
                View the pricing configuration, conditions, and rule metadata.
              </SheetDescription>
            </div>
          </div>

          {rule && (
            <div className="mt-4 space-y-3 rounded-xl border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="outline">
                  {CALC_TYPE_LABELS[calculationType]}
                </Badge>

                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className="gap-1.5"
                >
                  {isActive ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <XCircle className="size-3.5" />
                  )}

                  {isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div>
                <h2 className="text-base font-semibold">
                  {ruleName}
                </h2>

                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {String(rule.code ?? rule.id)}
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                {serviceName}
                {service?.code
                  ? ` · ${String(service.code)}`
                  : ""}
              </p>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          {!rule ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              No tariff rule selected.
            </div>
          ) : (
            <div className="space-y-6 px-6 py-5">
              {/* Service information */}

              <DetailSection
                title="Service Information"
                icon={<Database className="size-4" />}
              >
                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  <DetailItem
                    label="Service name"
                    value={serviceName}
                  />

                  <DetailItem
                    label="Service code"
                    value={String(
                      service?.code ??
                        revenueCode?.code ??
                        rule.service_code ??
                        "—",
                    )}
                  />

                  <DetailItem
                    label="Service ID"
                    value={
                      <span className="break-all font-mono text-xs">
                        {String(
                          rule.serviceId ??
                            rule.service_id ??
                            service?.id ??
                            "—",
                        )}
                      </span>
                    }
                  />

                  <DetailItem
                    label="Measurement unit"
                    value={String(
                      measurementUnit?.name ??
                        rule.unit ??
                        "Not specified",
                    )}
                  />
                </div>
              </DetailSection>

              <Separator />

              {/* Calculation configuration */}

              <DetailSection
                title="Calculation Configuration"
                icon={<Calculator className="size-4" />}
              >
                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  <DetailItem
                    label="Calculation type"
                    value={CALC_TYPE_LABELS[calculationType]}
                  />

                  <DetailItem
                    label="Priority"
                    value={formatDetailValue(
                      getRuleValue(rule, "priority"),
                    )}
                  />

                  <DetailItem
                    label="Execution order"
                    value={formatDetailValue(
                      getRuleValue(
                        rule,
                        "executionOrder",
                        "execution_order",
                      ),
                    )}
                  />

                  <DetailItem
                    label="Rounding rule"
                    value={formatDetailValue(
                      getRuleValue(
                        rule,
                        "roundingRule",
                        "rounding_rule",
                      ),
                    )}
                  />

                  {calculationType === "fixed" && (
                    <DetailItem
                      label="Fixed amount"
                      value={formatDetailValue(
                        getRuleValue(rule, "amount"),
                      )}
                    />
                  )}

                  {calculationType === "percentage" && (
                    <>
                      <DetailItem
                        label="Percentage"
                        value={
                          rule.percentage == null
                            ? "Not configured"
                            : `${String(rule.percentage)}%`
                        }
                      />

                      <DetailItem
                        label="Minimum amount"
                        value={formatDetailValue(
                          getRuleValue(
                            rule,
                            "minimumAmount",
                            "minimum_amount",
                          ),
                        )}
                      />

                      <DetailItem
                        label="Maximum amount"
                        value={formatDetailValue(
                          getRuleValue(
                            rule,
                            "maximumAmount",
                            "maximum_amount",
                          ),
                        )}
                      />
                    </>
                  )}

                  {calculationType === "per_unit" && (
                    <>
                      <DetailItem
                        label="Rate per unit"
                        value={formatDetailValue(
                          getRuleValue(rule, "amount"),
                        )}
                      />

                      <DetailItem
                        label="Minimum amount"
                        value={formatDetailValue(
                          getRuleValue(
                            rule,
                            "minimumAmount",
                            "minimum_amount",
                          ),
                        )}
                      />

                      <DetailItem
                        label="Maximum amount"
                        value={formatDetailValue(
                          getRuleValue(
                            rule,
                            "maximumAmount",
                            "maximum_amount",
                          ),
                        )}
                      />
                    </>
                  )}

                  {calculationType === "range" && (
                    <>
                      <DetailItem
                        label="Minimum value"
                        value={formatDetailValue(
                          getRuleValue(rule, "minValue", "min_value"),
                        )}
                      />

                      <DetailItem
                        label="Maximum value"
                        value={formatDetailValue(
                          getRuleValue(rule, "maxValue", "max_value"),
                        )}
                      />

                      <DetailItem
                        label="Amount"
                        value={formatDetailValue(
                          getRuleValue(rule, "amount"),
                        )}
                      />
                    </>
                  )}
                </div>

                {calculationType === "formula" && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Formula expression
                    </p>

                    {rule.formula ? (
                      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/40 p-4 font-mono text-sm leading-6">
                        {String(rule.formula)}
                      </pre>
                    ) : (
                      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        No formula has been configured.
                      </div>
                    )}
                  </div>
                )}
              </DetailSection>

              <Separator />

              {/* Rule conditions */}

              <DetailSection
                title="Conditions"
                icon={<FileText className="size-4" />}
              >
                {conditions.length > 0 ? (
                  <div className="space-y-3">
                    {conditions.map((condition, index) => {
                      const item = asRecord(condition) ?? {};

                      const fieldId = getConditionValue(
                        item,
                        "fieldId",
                        "field_id",
                      );

                      const fieldName = getConditionValue(
                        item,
                        "fieldName",
                        "field_name",
                      );

                      const fieldCode = getConditionValue(
                        item,
                        "fieldCode",
                        "field_code",
                      );

                      const operator = getConditionValue(
                        item,
                        "operator",
                      );

                      const conditionValue = getConditionValue(
                        item,
                        "value",
                      );

                      const displayFieldName =
                        typeof fieldName === "string" &&
                        fieldName.trim()
                          ? fieldName
                          : "Unnamed field";

                      const displayFieldCode =
                        typeof fieldCode === "string" &&
                        fieldCode.trim()
                          ? fieldCode
                          : null;

                      return (
                        <div
                          key={`${String(fieldId ?? "condition")}-${index}`}
                          className="rounded-xl border p-4"
                        >
                          <div className="mb-4 flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                              <Info className="size-4 text-muted-foreground" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold">
                                {displayFieldName}
                              </p>

                              {displayFieldCode && (
                                <p className="mt-1 font-mono text-xs text-muted-foreground">
                                  {displayFieldCode}
                                </p>
                              )}

                              {!displayFieldCode &&
                                displayFieldName ===
                                  "Unnamed field" && (
                                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                                    {String(fieldId ?? "No field ID")}
                                  </p>
                                )}
                            </div>

                            <Badge variant="outline">
                              {index + 1}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <DetailItem
                              label="Operator"
                              value={formatConditionOperator(operator)}
                            />

                            <DetailItem
                              label="Condition value"
                              value={
                                <span className="break-words">
                                  {formatDetailValue(conditionValue)}
                                </span>
                              }
                            />
                          </div>

                          {fieldId != null && (
                            <div className="mt-4 border-t pt-3">
                              <p className="text-xs text-muted-foreground">
                                Field ID
                              </p>

                              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                                {String(fieldId)}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No conditions configured for this tariff rule.
                  </p>
                )}
              </DetailSection>

              <Separator />

              {/* Additional information */}

              <DetailSection
                title="Additional Information"
                icon={<Hash className="size-4" />}
              >
                <div className="grid grid-cols-1 gap-5">
                  <DetailItem
                    label="Tariff rule ID"
                    value={
                      <span className="break-all font-mono text-xs">
                        {String(rule.id)}
                      </span>
                    }
                  />

                  <DetailItem
                    label="Tariff version"
                    value={String(
                      tariffVersion?.name ??
                        rule.tariff_version_id ??
                        "—",
                    )}
                  />

                  <DetailItem
                    label="Description"
                    value={
                      typeof rule.description === "string" &&
                      rule.description
                        ? rule.description
                        : "No description provided."
                    }
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DetailItem
                      label="Created at"
                      value={formatDate(createdAt)}
                    />

                    <DetailItem
                      label="Last updated"
                      value={formatDate(updatedAt)}
                    />
                  </div>

                  <DetailItem
                    label="Created by"
                    value={
                      <span className="break-all font-mono text-xs">
                        {String(
                          getRuleValue(rule, "createdBy", "created_by") ??
                            "—",
                        )}
                      </span>
                    }
                  />
                </div>
              </DetailSection>
            </div>
          )}
        </ScrollArea>

        <div className="border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Close details
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* =========================================================================
   LOADING
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

function OverlapWarning({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <AlertTriangle className="size-4 shrink-0 text-amber-600" />

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
  const { id, locale } = useParams<{
    id: string;
    locale: string;
  }>();

  const router = useRouter();

  const user = useSelector(
    (state: RootState) => state.auth.user,
  );

  /* Live search */

  const [search, setSearch] = useState("");

  /* Draft filters and applied filters */

  const [filters, setFilters] =
    useState<TariffRuleFilters>({ ...INITIAL_FILTERS });

  const [appliedFilters, setAppliedFilters] =
    useState<TariffRuleFilters>({ ...INITIAL_FILTERS });

  /* Pagination */

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* View details */

  const [selectedViewRule, setSelectedViewRule] =
    useState<TariffRuleApiRecord | null>(null);

  /* Services */

  const { data: servicesData } = useRevenueServices();
  const revenueServices = servicesData?.data ?? [];

  /* Delete */

  const deleteRule = useDeleteTariffRule();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDeleteRuleId, setSelectedDeleteRuleId] =
    useState<string | null>(null);

  /*
   * The API receives applied server-side filters.
   * Search and calculation type are filtered client-side.
   */
  const { data, isLoading } = useTariffRules({
    tariff_version_id: id,
    page,
    per_page: pageSize,

    service_id:
      appliedFilters.serviceId === "ALL"
        ? undefined
        : appliedFilters.serviceId,

    is_active:
      appliedFilters.status === "ACTIVE"
        ? true
        : appliedFilters.status === "INACTIVE"
          ? false
          : undefined,
  });

  const rules: TariffRuleApiRecord[] = data?.data ?? [];
  const meta = data?.meta;

  /* Normalize API records */

  const tableData = useMemo<TariffRuleRow[]>(
    () => rules.map(mapRuleToRow),
    [rules],
  );

  /* Search and client-side calculation type filter */

  const filteredTableData = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tableData.filter((rule) => {
      const searchableText = [
        rule.serviceName,
        rule.serviceCode,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        query.length === 0 || searchableText.includes(query);

      const matchesCalculationType =
        appliedFilters.calculationType === "ALL" ||
        rule.calculationType === appliedFilters.calculationType;

      return matchesSearch && matchesCalculationType;
    });
  }, [
    tableData,
    search,
    appliedFilters.calculationType,
  ]);

  /* Preserve original API records for the table and detail sheet */

  const filteredIds = useMemo(
    () => new Set(filteredTableData.map((rule) => rule.id)),
    [filteredTableData],
  );

  const filteredRules = useMemo(
    () =>
      rules.filter((rule) =>
        filteredIds.has(String(rule.id)),
      ),
    [rules, filteredIds],
  );

  /* Filter schema */

  const ruleFilters: FilterField[] = useMemo(
    () => [
      {
        key: "status",
        label: "Status",
        type: "select",
        defaultValue: "ALL",
        icon: CircleDot,
        options: STATUS_OPTIONS,
      },
      {
        key: "calculationType",
        label: "Calculation",
        type: "select",
        defaultValue: "ALL",
        icon: SlidersHorizontal,
        options: CALC_TYPE_OPTIONS,
      },
      {
        key: "serviceId",
        label: "Service",
        type: "select",
        defaultValue: "ALL",
        icon: CircleDot,
        options: [
          { label: "All Services", value: "ALL" },
          ...revenueServices.map((service) => ({
            label: service.name,
            value: String(service.id),
          })),
        ],
      },
    ],
    [revenueServices],
  );

  /* Applied filter count */

  const activeFilterCount =
    Number(appliedFilters.status !== "ALL") +
    Number(appliedFilters.calculationType !== "ALL") +
    Number(appliedFilters.serviceId !== "ALL") +
    Number(search.trim().length > 0);

  /* Pending filter changes */

  const hasPendingChanges = !filtersAreEqual(
    filters,
    appliedFilters,
  );

  const hasFilters =
    activeFilterCount > 0 || hasPendingChanges;

  /* Range conflicts */

  const overlaps = useMemo(
    () => detectRangeOverlaps(filteredTableData),
    [filteredTableData],
  );

  /* Live search */

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  /* Draft filters */

  const handleFiltersChange = useCallback(
    (next: Partial<TariffRuleFilters>) => {
      setFilters((previous) => ({
        ...previous,
        ...next,
      }));
    },
    [],
  );

  /* Reset filter controls without applying */

  const handleFiltersReset = useCallback(() => {
    setFilters({ ...INITIAL_FILTERS });
  }, []);

  /* Apply filters */

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...filters });
    setPage(1);
  }, [filters]);

  /* Clear search and all filters */

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilters({ ...INITIAL_FILTERS });
    setAppliedFilters({ ...INITIAL_FILTERS });
    setPage(1);
  }, []);

  /* Pagination */

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  /* Add rule */

  const handleAddRule = useCallback(() => {
    router.push(
      `/${locale}/office/dashboard/revenue-managements/tariff-versions/${id}/tariff-rule/new`,
    );
  }, [router, locale, id]);

  /* View details in the Sheet */

  const handleViewRule = useCallback(
    (rule: TariffRuleRow) => {
      const originalRule = rules.find(
        (item) => String(item.id) === rule.id,
      );

      if (!originalRule) {
        toast.error("Unable to find the selected tariff rule.");
        return;
      }

      setSelectedViewRule(originalRule);
    },
    [rules],
  );

  /* Edit rule */

  const handleEditRule = useCallback(
    (rule: TariffRuleRow) => {
      router.push(
        `/${locale}/office/dashboard/revenue-managements/tariff-versions/${id}/tariff-rule/${rule.id}`,
      );
    },
    [router, locale, id],
  );

  /* Manage formula variables */

  const handleManageFormulaVariables = useCallback(
    (rule: TariffRuleRow) => {
      router.push(
        `/${locale}/office/dashboard/revenue-managements/tariff-versions/${id}/tariff-rule/${rule.id}/formula-variables`,
      );
    },
    [router, locale, id],
  );

  /* Delete rule */

  const handleDeleteRule = useCallback((ruleId: string) => {
    setSelectedDeleteRuleId(ruleId);
    setDeleteModalOpen(true);
  }, []);

  const confirmDeleteRule = useCallback(() => {
    if (!selectedDeleteRuleId) return;

    deleteRule.mutate(selectedDeleteRuleId, {
      onSuccess: () => {
        toast.success("Tariff rule deleted successfully");
        setDeleteModalOpen(false);
        setSelectedDeleteRuleId(null);
      },

      onError: (error: Error) => {
        toast.error(
          error.message || "Failed to delete tariff rule",
        );
      },
    });
  }, [deleteRule, selectedDeleteRuleId]);

  /* Permission loading */

  if (!user?.role) {
    return <PermissionsLoading />;
  }

  const actions = resolveActions(
    CommentTableRegistry.tariffRule,
    user.permissions,
  );

  /* Render */

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <Banner
        description="Manage pricing rules for this tariff version."
        badge={
          <IconBadge
            className="gap-2 rounded-full p-3 text-xs"
            icon={<CalendarClock className="size-4" />}
          >
            {`Tariff Version · ${id}`}
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
          <Button onClick={handleAddRule}>
            <Plus className="mr-2 size-4" />
            Add Rule
          </Button>
        }
      />

      <OverlapWarning count={overlaps.length} />

      {/* Search and filters */}

      <AppFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search rules by service..."
        searchLabel="Search tariff rules"
        title="Search and filter"
        description="Search instantly, or choose filters and click Apply."
        activeFilterCount={activeFilterCount}
        hasFilters={hasFilters}
        onApply={applyFilters}
        onClear={clearFilters}
      >
        <Filters
          schema={ruleFilters}
          value={filters}
          onChange={handleFiltersChange}
          onReset={handleFiltersReset}
          layout="row"
          resetPosition="end"
        />
      </AppFilterBar>

      {/* Table */}

      <CommenTable
        type={"tariffRule" as CommentType}
        data={filteredRules}
        page={page}
        pageSize={pageSize}
        isLoading={isLoading}
        actions={actions}
        onView={handleViewRule}
        onEdit={handleEditRule}
        onDelete={handleDeleteRule}
        onManageFormulaVariables={handleManageFormulaVariables}
      />

      {/* Pagination */}

      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={meta?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* View tariff rule details */}

      <TariffRuleDetailSheet
        rule={selectedViewRule}
        open={selectedViewRule !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedViewRule(null);
          }
        }}
      />

      {/* Delete confirmation */}

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedDeleteRuleId(null);
        }}
        action={confirmDeleteRule}
        title="Delete Tariff Rule"
        description="Are you sure you want to delete this tariff rule? This action will permanently remove the pricing configuration and cannot be undone."
      />
    </div>
  );
}