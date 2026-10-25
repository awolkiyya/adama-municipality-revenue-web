"use client";

import {
  BadgeCheck,
  Calculator,
  FileText,
  Filter,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RevenueService } from "@/types/revenue/revenu-service";
import type { BaseField } from "@/types/revenue/revenue-baseField";
import type { MeasurementUnit } from "@/types/revenue/revenue-unit";
import type {
  RoundingRule,
  TariffRuleFormType,
} from "@/types/revenue/tariff-form";

import {
  calculationOptions,
  formatCurrency,
  ROUNDING_LABELS,
} from "./tariffRuleForm.helpers";

type BaseFieldSummary = Pick<BaseField, "id" | "name">;
type MeasurementUnitSummary = Pick<MeasurementUnit, "id" | "name">;
type RevenueServiceSummary = Pick<RevenueService, "id" | "name">;

type Props = {
  form: TariffRuleFormType;
  selectedService: RevenueServiceSummary | null;
  selectedBaseField: BaseFieldSummary | null;
  selectedUnit: MeasurementUnitSummary | null;
};

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>

      <span className="text-sm font-medium sm:max-w-[65%] sm:text-right">
        {value || "—"}
      </span>
    </div>
  );
}

export default function ReviewStep({
  form,
  selectedService,
  selectedBaseField,
  selectedUnit,
}: Props) {
  const calculationLabel =
    calculationOptions.find(
      (option) => option.value === form.calculationType,
    )?.label ?? form.calculationType;

  const conditions = form.conditions ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border p-4">
        <BadgeCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />

        <div>
          <h3 className="font-semibold">Review your tariff rule</h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Confirm the rule configuration before saving. The saved rule
            will be evaluated by the backend tariff calculation logic.
          </p>
        </div>
      </div>

      {/* Rule information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4" />
            Rule information
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-0">
          <SummaryRow label="Rule name" value={form.name} />
          <SummaryRow label="Description" value={form.description} />
          <SummaryRow label="Revenue service" value={selectedService?.name} />
          <SummaryRow label="Tariff version" value={form.tariffVersionId} />

          <SummaryRow
            label="Priority"
            value={String(form.priority ?? "")}
          />

          <SummaryRow
            label="Status"
            value={
              <Badge variant={form.isActive ? "default" : "secondary"}>
                {form.isActive ? "Active" : "Inactive"}
              </Badge>
            }
          />
        </CardContent>
      </Card>

      {/* Calculation configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="size-4" />
            Calculation configuration
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-0">
          <SummaryRow label="Calculation type" value={calculationLabel} />

          <SummaryRow
            label="Base field"
            value={selectedBaseField?.name}
          />

          <SummaryRow
            label="Measurement unit"
            value={selectedUnit?.name}
          />

          {form.calculationType === "FIXED" && (
            <SummaryRow
              label="Fixed amount"
              value={formatCurrency(form.amount)}
            />
          )}

          {form.calculationType === "PERCENTAGE" && (
            <>
              <SummaryRow
                label="Percentage rate"
                value={`${form.percentage || "0"}%`}
              />

              <SummaryRow
                label="Base field"
                value={selectedBaseField?.name}
              />
            </>
          )}

          {form.calculationType === "PER_UNIT" && (
            <>
              <SummaryRow
                label="Rate per unit"
                value={formatCurrency(form.amount)}
              />

              <SummaryRow
                label="Unit"
                value={selectedUnit?.name}
              />
            </>
          )}

          {form.calculationType === "RANGE" && (
            <>
              <SummaryRow
                label="Minimum value"
                value={
                  form.minValue !== ""
                    ? String(form.minValue)
                    : "Not specified"
                }
              />

              <SummaryRow
                label="Maximum value"
                value={
                  form.maxValue !== ""
                    ? String(form.maxValue)
                    : "Not specified"
                }
              />
            </>
          )}

          {form.calculationType === "FORMULA" && (
            <SummaryRow
              label="Formula"
              value={
                <code className="break-all whitespace-pre-wrap">
                  {form.formula || "No formula entered"}
                </code>
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4" />
            Conditions
          </CardTitle>
        </CardHeader>

        <CardContent>
          {conditions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No conditions configured. This rule can apply to all
              otherwise eligible records for the selected service.
            </p>
          ) : (
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div
                  key={`${condition.fieldId}-${index}`}
                  className="rounded-lg border p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {index === 0 ? "IF" : "AND"}
                    </Badge>

                    <span className="font-medium">
                      {condition.fieldName || condition.fieldId || "Unknown field"}
                    </span>

                    <span className="text-sm text-muted-foreground">
                      {condition.operator.replaceAll("_", " ")}
                    </span>

                    <span className="break-all font-mono text-sm">
                      {String(condition.value ?? "—")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="size-4" />
            Financial controls
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-0">
          <SummaryRow
            label="Minimum charge"
            value={
              form.minimumAmount !== ""
                ? formatCurrency(form.minimumAmount)
                : "No minimum"
            }
          />

          <SummaryRow
            label="Maximum charge"
            value={
              form.maximumAmount !== ""
                ? formatCurrency(form.maximumAmount)
                : "No maximum"
            }
          />

          <SummaryRow
            label="Rounding rule"
            value={
              ROUNDING_LABELS[form.roundingRule as RoundingRule] ??
              form.roundingRule
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
