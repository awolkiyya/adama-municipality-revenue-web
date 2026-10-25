
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  RoundingRule,
  TariffRuleFormType,
} from "@/types/revenue/tariff-form";

import { formatCurrency, ROUNDING_LABELS } from "./tariffRuleForm.helpers";

type Props = {
  form: TariffRuleFormType;

  updateField: <K extends keyof TariffRuleFormType>(
    key: K,
    value: TariffRuleFormType[K],
  ) => void;
};

export default function FinancialControlsStep({
  form,
  updateField,
}: Props) {
  const hasFinancialLimits =
    form.minimumAmount !== "" || form.maximumAmount !== "";

  const minimumIsValid =
    form.minimumAmount === "" ||
    (Number.isFinite(Number(form.minimumAmount)) &&
      Number(form.minimumAmount) >= 0);

  const maximumIsValid =
    form.maximumAmount === "" ||
    (Number.isFinite(Number(form.maximumAmount)) &&
      Number(form.maximumAmount) >= 0);

  const limitsAreValid =
    minimumIsValid &&
    maximumIsValid &&
    (!form.minimumAmount ||
      !form.maximumAmount ||
      Number(form.minimumAmount) <= Number(form.maximumAmount));

  return (
    <div className="space-y-5">
      {/* Charge limits */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="min-charge">Minimum Charge (ETB)</Label>

          <Input
            id="min-charge"
            type="number"
            min={0}
            step="0.01"
            placeholder="0"
            value={form.minimumAmount}
            onChange={(event) =>
              updateField("minimumAmount", event.target.value)
            }
            aria-invalid={!minimumIsValid}
            className="py-5"
          />

          <p className="text-xs text-muted-foreground">
            The minimum amount charged when this rule is applied.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-charge">Maximum Charge (ETB)</Label>

          <Input
            id="max-charge"
            type="number"
            min={0}
            step="0.01"
            placeholder="50000"
            value={form.maximumAmount}
            onChange={(event) =>
              updateField("maximumAmount", event.target.value)
            }
            aria-invalid={!maximumIsValid}
            className="py-5"
          />

          <p className="text-xs text-muted-foreground">
            The maximum amount charged when this rule is applied.
          </p>
        </div>
      </div>

      {!limitsAreValid && (
        <p className="text-sm text-destructive" role="alert">
          Enter non-negative amounts, and ensure the minimum charge
          does not exceed the maximum charge.
        </p>
      )}

      {/* Rounding */}
      <div className="space-y-2">
        <Label htmlFor="rounding-rule">Rounding Rule</Label>

        <Select
          value={form.roundingRule}
          onValueChange={(value) =>
            updateField("roundingRule", value as RoundingRule)
          }
        >
          <SelectTrigger id="rounding-rule" className="w-full py-5">
            <SelectValue placeholder="Select rounding rule" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="NONE">None</SelectItem>
            <SelectItem value="ROUND_UP">Round Up</SelectItem>
            <SelectItem value="ROUND_DOWN">Round Down</SelectItem>
            <SelectItem value="NEAREST">Nearest</SelectItem>
          </SelectContent>
        </Select>

        <p className="text-xs text-muted-foreground">
          {ROUNDING_LABELS[form.roundingRule]}
        </p>
      </div>

      {/* Summary */}
      {hasFinancialLimits && limitsAreValid && (
        <div className="rounded-lg bg-muted p-4 text-sm">
          Every charge from this rule will stay
          {form.minimumAmount !== "" && (
            <>
              {" "}at or above{" "}
              <span className="font-mono font-medium text-emerald-700">
                {formatCurrency(form.minimumAmount)}
              </span>
            </>
          )}
          {form.minimumAmount !== "" &&
            form.maximumAmount !== "" &&
            " and"}
          {form.maximumAmount !== "" && (
            <>
              {" "}at or below{" "}
              <span className="font-mono font-medium text-emerald-700">
                {formatCurrency(form.maximumAmount)}
              </span>
            </>
          )}
          .
        </div>
      )}
    </div>
  );
}
