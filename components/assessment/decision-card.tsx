import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Assessment } from "@/types/revenue/assessment";
import {  formatStatus } from "@/lib/format";
import { formatEthiopianDate, formatEthiopianDateWithTime } from "@/lib/utils";

export function DecisionCard({ assessment }: { assessment: Assessment }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Decision</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Decision</p>
            <p className="mt-1 font-medium">{formatStatus(assessment.decision)}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Decided At</p>
            <p className="mt-1 font-medium">{formatEthiopianDateWithTime(assessment.decidedAt!)}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Decided By</p>
            <p className="mt-1 font-medium">{assessment.decidedBy ?? "-"}</p>
          </div>
        </div>

        {assessment.decisionNotes && (
          <div className="mt-5">
            <p className="text-xs text-muted-foreground">Decision Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{assessment.decisionNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
