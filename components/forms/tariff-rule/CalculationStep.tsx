
"use client";

import {
  AlertTriangle,
  Check,
  Receipt,
  Wand2,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { BaseFieldDropdown } from "@/components/input/BasefieldDropDown";
import { MeasurementUnitDropdown } from "@/components/input/MeasurmentUnitDropDown";

import type { BaseField } from "@/types/revenue/revenue-baseField";
import type { MeasurementUnit } from "@/types/revenue/revenue-unit";

import type {
  CalculationType,
  TariffRuleFormType,
} from "@/types/revenue/tariff-form";

import {
  calculationOptions,
  DEFAULT_FORMULA_EXAMPLE,
  DEFAULT_FORMULA_VARIABLES,
  DEFAULT_SAMPLE_VALUES,
  formatCurrency,
  safeEvaluateFormula,
  tokenizeFormula,
} from "./tariffRuleForm.helpers";

type BaseFieldSummary = Pick<BaseField, "id" | "name">;
type MeasurementUnitSummary = Pick<MeasurementUnit, "id" | "name">;

type Props = {
  form: TariffRuleFormType;

  updateField: <K extends keyof TariffRuleFormType>(
    key: K,
    value: TariffRuleFormType[K],
  ) => void;

  selectedBaseField: BaseFieldSummary | null;
  setSelectedBaseField: (field: BaseFieldSummary | null) => void;

  selectedUnit: MeasurementUnitSummary | null;
  setSelectedUnit: (unit: MeasurementUnitSummary | null) => void;

  rangeIsValid: boolean;

  insertFormulaToken: (token: string) => void;
  useFormulaExample: () => void;
};

export default function CalculationStep({
  form,
  updateField,
  setSelectedBaseField,
  setSelectedUnit,
  rangeIsValid,
  insertFormulaToken,
  useFormulaExample,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Calculation type selection */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {calculationOptions.map((option) => {
          const Icon = option.icon;
          const selected = form.calculationType === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                updateField("calculationType", option.value)
              }
              aria-pressed={selected}
              className={`rounded-xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "hover:bg-muted"
              }`}
            >
              <div className="flex gap-3">
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    selected
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />

                <div>
                  <p className="font-semibold">{option.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>

                {selected && (
                  <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Calculation configuration */}
      {form.calculationType && (
        <Card className="bg-muted/20">
          <CardContent className="space-y-5 p-5">
            <h3 className="font-semibold">
              Calculation Configuration
            </h3>

            {/* Base field is independent of formula variables */}
            {(
              ["PERCENTAGE", "PER_UNIT", "RANGE"] as CalculationType[]
            ).includes(form.calculationType as CalculationType) && (
              <div className="space-y-2">
                <Label>Base Field</Label>

                <BaseFieldDropdown
                  value={form.baseFieldId}
                  onChange={(value, item) => {
                    updateField("baseFieldId", value ?? "");
                    setSelectedBaseField(item ?? null);
                  }}
                />
              </div>
            )}

            {/* Fixed amount */}
            {form.calculationType === "FIXED" && (
              <div className="space-y-2">
                <Label htmlFor="fixed-amount">
                  Fixed Amount (ETB)
                </Label>

                <Input
                  id="fixed-amount"
                  type="number"
                  min={0}
                  placeholder="500"
                  value={form.amount}
                  onChange={(event) =>
                    updateField("amount", event.target.value)
                  }
                  className="w-full py-4"
                />
              </div>
            )}

            {/* Percentage */}
            {form.calculationType === "PERCENTAGE" && (
              <div className="space-y-2">
                <Label htmlFor="percentage-rate">
                  Percentage Rate (%)
                </Label>

                <Input
                  id="percentage-rate"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  placeholder="2.5"
                  value={form.percentage}
                  onChange={(event) =>
                    updateField("percentage", event.target.value)
                  }
                  className="w-full py-4"
                />
              </div>
            )}

            {/* Per unit */}
            {form.calculationType === "PER_UNIT" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="per-unit-amount">
                    Rate Amount (ETB)
                  </Label>

                  <Input
                    id="per-unit-amount"
                    type="number"
                    min={0}
                    placeholder="50"
                    value={form.amount}
                    onChange={(event) =>
                      updateField("amount", event.target.value)
                    }
                    className="w-full py-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Measurement Unit</Label>

                  <MeasurementUnitDropdown
                    value={form.measurementUnitId}
                    onChange={(value, item) => {
                      updateField("measurementUnitId", value ?? "");
                      setSelectedUnit(item ?? null);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Range */}
            {form.calculationType === "RANGE" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="range-min">
                      Minimum Value
                    </Label>

                    <Input
                      id="range-min"
                      type="number"
                      value={form.minValue}
                      onChange={(event) =>
                        updateField("minValue", event.target.value)
                      }
                      className="w-full py-4"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="range-max">
                      Maximum Value
                    </Label>

                    <Input
                      id="range-max"
                      type="number"
                      value={form.maxValue}
                      onChange={(event) =>
                        updateField("maxValue", event.target.value)
                      }
                      className="w-full py-4"
                    />
                  </div>
                </div>

                {!rangeIsValid && (
                  <p className="flex items-start gap-1.5 text-xs text-destructive">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Minimum value must be less than the maximum value.
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="range-amount">
                    Range Amount (ETB)
                  </Label>

                  <Input
                    id="range-amount"
                    type="number"
                    min={0}
                    value={form.amount}
                    onChange={(event) =>
                      updateField("amount", event.target.value)
                    }
                    className="w-full py-4"
                  />
                </div>
              </div>
            )}

            {/* Formula */}
            {form.calculationType === "FORMULA" && (
              <FormulaConfiguration
                formula={form.formula}
                updateField={updateField}
                insertFormulaToken={insertFormulaToken}
                useFormulaExample={useFormulaExample}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type FormulaConfigurationProps = {
  formula: string;
  updateField: Props["updateField"];
  insertFormulaToken: (token: string) => void;
  useFormulaExample: () => void;
};

function FormulaConfiguration({
  formula,
  updateField,
  insertFormulaToken,
  useFormulaExample,
}: FormulaConfigurationProps) {
  const variables = DEFAULT_FORMULA_VARIABLES;
  const sampleValues = DEFAULT_SAMPLE_VALUES;
  const displayFormula = formula || DEFAULT_FORMULA_EXAMPLE;
  const isPlaceholder = !formula;

  const previewResult = safeEvaluateFormula(
    displayFormula,
    sampleValues,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="formula-expression">
          Formula Expression
        </Label>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={useFormulaExample}
        >
          <Wand2 className="h-3.5 w-3.5" />
          Use example
        </Button>
      </div>

      <Textarea
        id="formula-expression"
        className="font-mono"
        placeholder={DEFAULT_FORMULA_EXAMPLE}
        value={formula}
        onChange={(event) =>
          updateField("formula", event.target.value)
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">
          Insert:
        </span>

        {variables.map((token) => (
          <button
            key={token}
            type="button"
            onClick={() => insertFormulaToken(token)}
            className="rounded-md border bg-background px-2 py-0.5 font-mono text-xs text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {token}
          </button>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Formula Preview
          </p>

          <Receipt className="h-4 w-4 text-emerald-700" />
        </div>

        <p
          className={`break-all font-mono text-base leading-relaxed ${
            isPlaceholder ? "opacity-60" : ""
          }`}
        >
          {tokenizeFormula(displayFormula).map((token, index) => {
            if (variables.includes(token)) {
              return (
                <span
                  key={index}
                  className="font-semibold text-emerald-700"
                >
                  {token}
                </span>
              );
            }

            if (/^\d+\.?\d*$/.test(token)) {
              return (
                <span key={index} className="text-amber-700">
                  {token}
                </span>
              );
            }

            if (/^[+\-*/()]$/.test(token)) {
              return (
                <span
                  key={index}
                  className="text-muted-foreground"
                >
                  {token}
                </span>
              );
            }

            return <span key={index}>{token}</span>;
          })}
        </p>

        {isPlaceholder && (
          <p className="text-xs text-muted-foreground">
            Use the variables above to build your formula.
          </p>
        )}



      </div>
    </div>
  );
}
