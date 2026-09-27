import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Assessment } from "@/types/revenue/assessment";

import { formatStatus } from "@/lib/format";
import { formatEthiopianDateWithTime } from "@/lib/utils";

export function DecisionCard({
  assessment,
}: {
  assessment: Assessment;
}) {
  const decision = assessment.decision
    ? formatStatus(assessment.decision)
    : "-";

  const decidedAt = assessment.decidedAt
    ? formatEthiopianDateWithTime(
        assessment.decidedAt,
      )
    : "-";

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">
          Revenue Decision
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Decision Information */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">
              Decision
            </p>

            <p className="mt-1 text-sm font-medium">
              {decision}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Decided At
            </p>

            <p className="mt-1 text-sm font-medium">
              {decidedAt}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Decided By
            </p>

            <p className="mt-1 text-sm font-medium">
              {assessment.decidedBy?.name ?? "-"}
            </p>
          </div>
        </div>

        {/* Decision Notes */}
        {assessment.decisionNotes && (
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Decision Notes
            </p>

            <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
              {assessment.decisionNotes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}