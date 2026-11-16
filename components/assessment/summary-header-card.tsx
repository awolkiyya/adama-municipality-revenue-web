
import {
  CalendarClock,
  CalendarDays,
  FileStack,
  Paperclip,
  ScrollText,
  UserPlus,
  Building2,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Assessment } from "@/types/revenue/assessment";
import { formatEthiopianDate } from "@/lib/utils";

import { StatusBadge } from "./status-badge";

// Keep the masthead accent consistent with StatusBadge.
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
  description,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 px-1 py-1">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-semibold text-foreground">
          {value}
        </p>

        {description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {description}
          </p>
        )}
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
  const accent =
    STATUS_ACCENT[assessment.status?.toUpperCase() ?? ""] ??
    "border-t-border";

  // Assessment's assigned administrative unit.
  // This is independent of the creator's organizational unit.
  const administrativeUnit = assessment.administrativeUnit;

  // Build the administrative hierarchy from the API context.
  const unitHierarchy = [
    administrativeUnit?.context?.city?.name,
    administrativeUnit?.context?.subcity?.name,
    administrativeUnit?.context?.wereda?.name,
  ]
    .filter(Boolean)
    .join(" / ");

  // Creator's own administrative unit.
  const creatorAdministrativeUnit =
    assessment.createdBy?.administrative_unit?.name;

  return (
    <Card className={`overflow-hidden border-t-4 ${accent}`}>
      <CardContent className="p-5 sm:p-6">
        {/* Assessment identity and status */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ScrollText className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Assessment Number
              </p>

              <h1 className="mt-0.5 break-all text-xl font-bold tracking-tight sm:text-2xl">
                {assessment.assessmentNumber}
              </h1>

              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Created{" "}
                {assessment.createdAt
                  ? formatEthiopianDate(assessment.createdAt)
                  : "-"}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <StatusBadge status={assessment.status} />
          </div>
        </div>

        {/* Assessment information */}
        <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-5 border-t pt-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <Stat
            icon={FileStack}
            label="Services"
            value={serviceCount}
            description="Assessment services"
          />

          <Stat
            icon={Paperclip}
            label="Evidence Files"
            value={fileCount}
            description="Attached documents"
          />

          <Stat
            icon={CalendarDays}
            label="Assessment Date"
            value={
              assessment.assessmentDate
                ? formatEthiopianDate(assessment.assessmentDate)
                : "Not set"
            }
            description="Date assigned to the assessment"
          />

          <Stat
            icon={CalendarClock}
            label="Submitted"
            value={
              assessment.submittedAt
                ? formatEthiopianDate(assessment.submittedAt)
                : "Not submitted"
            }
            description="Submission date"
          />

          <Stat
            icon={Building2}
            label="Administrative Unit"
            value={administrativeUnit?.name ?? "-"}
            description={unitHierarchy || "Assigned assessment unit"}
          />

          <Stat
            icon={UserPlus}
            label="Created By"
            value={assessment.createdBy?.name ?? "-"}
            description={
              assessment.createdBy?.label ??
              creatorAdministrativeUnit ??
              "Assessment creator"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
