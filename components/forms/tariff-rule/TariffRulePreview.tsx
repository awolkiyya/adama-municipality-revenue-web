
"use client";

import { Calculator, CircleCheck, CircleX } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TariffRuleFormType } from "@/types/revenue/tariff-form";
import { formatCurrency } from "./tariffRuleForm.helpers";

type Props = {
  form: TariffRuleFormType;
  calculatedAmount?: number | null;
  calculationError?: string | null;
};

export default function TariffRulePreview({
  form,
  calculatedAmount,
  calculationError,
}: Props) {
  const hasResult =
    typeof calculatedAmount === "number" &&
    Number.isFinite(calculatedAmount);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="size-4" />
          Tariff preview
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Rule</p>
          <p className="font-medium">{form.name || "Untitled tariff rule"}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Calculation type</p>
          <Badge variant="outline">
            {form.calculationType.replaceAll("_", " ")}
          </Badge>
        </div>

        {form.calculationType === "FORMULA" && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Formula</p>
            <code className="block break-all rounded-md bg-muted p-3 text-sm">
              {form.formula || "Enter a formula to preview it"}
            </code>
          </div>
        )}

        {calculationError ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <CircleX className="mt-0.5 size-4 shrink-0" />
            <p>{calculationError}</p>
          </div>
        ) : hasResult ? (
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              Estimated amount
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {formatCurrency(calculatedAmount)}
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <CircleCheck className="size-3.5" />
              <span>Preview only; final amounts are calculated by the backend.</span>
            </div>
          </div>
        ) : (
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Enter the required calculation values to display a preview.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
