import {
  CalendarClock,
  CalendarDays,
  FileStack,
  Paperclip,
  ScrollText,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Assessment } from "@/types/revenue/assessment";
import { formatEthiopianDate } from "@/lib/utils";

import { StatusBadge } from "./status-badge";

// Reuses the same palette as StatusBadge so the masthead accent and the
// badge always agree visually.
const STATUS_ACCENT: Record<string, string> = {
  APPROVED: "border-t-emerald-400",
  REJECTED: "border-t-red-400",
  RETURNED: "border-t-orange-400",
  PENDING_APPROVAL: "border-t-amber-400",
};

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-1 py-1">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 truncate text-base font-semibold">{value}</p>
      </div>
    </div>
  );
}

export function SummaryHeaderCard({
  assessment,
  serviceCount,
  fileCount,
}: {
  assessment: Assessment;
  serviceCount: number;
  fileCount: number;
}) {
  const accent = STATUS_ACCENT[assessment.status?.toUpperCase() ?? ""] ?? "border-t-border";

  return (
    <Card className={`border-t-4 ${accent}`}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ScrollText className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Assessment Number</p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight">
                {assessment.assessmentNumber}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Created {formatEthiopianDate(assessment.createdAt)}
              </p>
            </div>
          </div>

          <StatusBadge status={assessment.status} />
        </div>

        <div className="mt-6 grid gap-x-4 gap-y-5 border-t pt-5 sm:grid-cols-2 lg:grid-cols-5 lg:divide-x lg:border-t-0 lg:pt-0">
          <div className="lg:pr-4">
            <Stat icon={FileStack} label="Services" value={serviceCount} />
          </div>

          <div className="lg:px-4">
            <Stat icon={Paperclip} label="Evidence Files" value={fileCount} />
          </div>

          <div className="lg:px-4">
            <Stat
              icon={CalendarDays}
              label="Assessment Date"
              value={assessment.assessmentDate ?? "-"}
            />
          </div>

          <div className="lg:px-4">
            <Stat
              icon={CalendarClock}
              label="Submitted"
              value={
                assessment.submittedAt ? formatEthiopianDate(assessment.submittedAt) : "-"
              }
            />
          </div>

          <div className="lg:pl-4">
            <Stat
              icon={UserPlus}
              label="Created By"
              value={
                <>
                  {assessment.createdBy?.name ?? "-"}
                  {assessment.createdBy?.label && (
                    <span className="block text-xs font-normal text-muted-foreground">
                      {assessment.createdBy.label}
                    </span>
                  )}
                </>
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}