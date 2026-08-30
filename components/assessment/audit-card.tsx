import { Building2, Landmark, MapPin, UserCog, UserPlus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEthiopianDate } from "@/lib/utils";
import { Assessment } from "@/types/revenue/assessment";

// Matches AssessmentResource::transformAdministrativeUnit / transformSector.
// If AssessmentActor (createdBy/updatedBy) already has a shared TS type,
// import it instead of redeclaring this here.
type AdministrativeUnitInfo = {
  id: string;
  name: string;
  code?: string | null;
  level: "CITY" | "SUBCITY" | "WEREDA";
  context: {
    city: { id: string; name: string } | null;
    subcity: { id: string; name: string } | null;
    wereda: { id: string; name: string } | null;
  };
};

type SectorInfo = {
  id: string;
  name: string;
  code?: string | null;
};

type AssessmentActor = {
  name?: string | null;
  label?: string | null;
  email?: string | null;
  administrativeUnit?: AdministrativeUnitInfo | null;
  sector?: SectorInfo | null;
};

const LEVEL_CONFIG: Record<AdministrativeUnitInfo["level"], { label: string; classes: string }> = {
  CITY: { label: "City", classes: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  SUBCITY: { label: "Subcity", classes: "bg-blue-50 text-blue-700 border-blue-200" },
  WEREDA: { label: "Wereda", classes: "bg-teal-50 text-teal-700 border-teal-200" },
};

function TimelineEntry({
  icon: Icon,
  label,
  name,
  email,
  date,
  isLast,
}: {
  icon: typeof UserPlus;
  label: string;
  name: string;
  email?: string | null;
  date: string;
  isLast?: boolean;
}) {
  return (
    <div className="relative flex gap-3 pb-6 last:pb-0">
      {!isLast && (
        <span className="absolute left-4 top-8 h-[calc(100%-1.5rem)] w-px bg-border" aria-hidden="true" />
      )}

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted/40">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate font-medium">{name}</p>
          {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
        </div>

        <p className="shrink-0 text-xs text-muted-foreground sm:text-right">{date}</p>
      </div>
    </div>
  );
}

function LocationPanel({ actor }: { actor?: AssessmentActor | null }) {
  const unit = actor?.administrativeUnit;
  const sector = actor?.sector;

  // Nothing to show if the backend didn't eager-load these relations —
  // fails quietly rather than rendering an empty shell.
  if (!unit && !sector) return null;

  const breadcrumb = [
    unit?.context.city?.name,
    unit?.context.subcity?.name,
    unit?.context.wereda?.name,
  ].filter(Boolean);

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Building2 className="h-4.5 w-4.5" />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        {unit && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-medium">{unit.name}</p>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${LEVEL_CONFIG[unit.level].classes}`}
            >
              {LEVEL_CONFIG[unit.level].label}
            </span>
          </div>
        )}

        {breadcrumb.length > 0 && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            {breadcrumb.join(" • ")}
          </p>
        )}

        {sector && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Landmark className="h-3 w-3 shrink-0" />
            {sector.name}
            {sector.code && <span className="text-muted-foreground/70">({sector.code})</span>}
          </p>
        )}
      </div>
    </div>
  );
}

export function AuditCard({ assessment }: { assessment: Assessment }) {
  const creator = assessment.createdBy as AssessmentActor | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit & Location</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <LocationPanel actor={creator} />

        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            History
          </p>

          <TimelineEntry
            icon={UserPlus}
            label="Created By"
            name={creator?.name ?? "-"}
            email={creator?.email}
            date={formatEthiopianDate(assessment.createdAt)}
          />

          <TimelineEntry
            icon={UserCog}
            label="Updated By"
            name={assessment.updatedBy?.name ?? "-"}
            date={formatEthiopianDate(assessment.updatedAt)}
            isLast
          />
        </div>
      </CardContent>
    </Card>
  );
}