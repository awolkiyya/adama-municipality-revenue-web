import { AssessmentServiceValue } from "@/types/revenue/assessment";
import { formatValue } from "@/lib/format";

export function FieldRow({ value }: { value: AssessmentServiceValue }) {
  return (
    <div className="grid gap-2 border-b py-4 last:border-b-0 md:grid-cols-[240px_1fr]">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {value.fieldLabel}
        </p>

        {value.fieldCode && (
          <p className="mt-1 text-xs text-muted-foreground">
            {value.fieldCode}
          </p>
        )}
      </div>

      <div className="break-words text-sm font-medium">
        {formatValue(value.displayValue ?? value.value)}
      </div>
    </div>
  );
}
