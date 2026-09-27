import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";

import { AssessmentService } from "@/types/revenue/assessment";
import { formatAmount } from "@/lib/format";

type DecisionSummaryProps = {
  services: AssessmentService[];
  isExistingLizz: boolean;
};

export function DecisionSummary({
  services,
  isExistingLizz,
}: DecisionSummaryProps) {
  const {
    total,
    currency,
    mixedCurrency,
    hasAmount,
  } = useMemo(() => {
    const amounts = services
      .map((service) => {
        const rawAmount = isExistingLizz
          ? service.remainingAmount
          : service.computedAmount;

        if (
          rawAmount === null ||
          rawAmount === undefined
        ) {
          return null;
        }

        const amount = Number(rawAmount);

        if (!Number.isFinite(amount)) {
          return null;
        }

        return {
          amount,
          currency: service.currencyCode ?? "",
        };
      })
      .filter(
        (
          item,
        ): item is {
          amount: number;
          currency: string;
        } => item !== null,
      );

    const currencies = new Set(
      amounts.map((item) => item.currency),
    );

    return {
      total: amounts.reduce(
        (sum, item) => sum + item.amount,
        0,
      ),
      currency: amounts[0]?.currency ?? "",
      mixedCurrency: currencies.size > 1,
      hasAmount: amounts.length > 0,
    };
  }, [services, isExistingLizz]);

  if (!hasAmount) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 px-4 py-3 sm:min-w-56">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Total To Approve
      </p>

      <p className="text-2xl font-bold">
        {mixedCurrency
          ? total.toLocaleString()
          : formatAmount(total, currency)}
      </p>

      {isExistingLizz && (
        <p className="text-xs text-muted-foreground">
          Based on remaining balance
        </p>
      )}

      {mixedCurrency && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" />
          Services use different currencies — verify before approving.
        </p>
      )}
    </div>
  );
}