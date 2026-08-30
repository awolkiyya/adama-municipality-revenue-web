import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";

import { AssessmentService } from "@/types/revenue/assessment";
import { formatAmount } from "@/lib/format";

export function DecisionSummary({ services }: { services: AssessmentService[] }) {
  const { total, currency, mixedCurrency, hasAmount } = useMemo(() => {
    const amounts = services
      .filter((s) => s.computedAmount !== null && s.computedAmount !== undefined)
      .map((s) => ({ amount: Number(s.computedAmount), currency: s.currencyCode ?? "" }));

    const currencies = new Set(amounts.map((a) => a.currency));

    return {
      total: amounts.reduce((sum, a) => sum + a.amount, 0),
      currency: amounts[0]?.currency ?? "",
      mixedCurrency: currencies.size > 1,
      hasAmount: amounts.length > 0,
    };
  }, [services]);

  if (!hasAmount) return null;

  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 px-4 py-3 sm:min-w-56">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Total To Approve
      </p>

      <p className="text-2xl font-bold">
        {mixedCurrency ? total.toLocaleString() : formatAmount(total, currency)}
      </p>

      {mixedCurrency && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" />
          Services use different currencies — verify before approving.
        </p>
      )}
    </div>
  );
}
