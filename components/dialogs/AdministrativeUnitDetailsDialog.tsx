"use client";

import type { ReactNode } from "react";

import {
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleX,
  Hash,
  Network,
  UserRound,
} from "lucide-react";

import type { AdminUnit } from "@/types/admin-unit";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

/* -------------------------------------------------------------------------- */
/* Props                                                                      */
/* -------------------------------------------------------------------------- */

interface AdministrativeUnitDetailsDialogProps {
  unit: AdminUnit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatLevel(level: AdminUnit["level"]): string {
  switch (level) {
    case "CITY":
      return "City";
    case "SUBCITY":
      return "Sub-city";
    case "WEREDA":
      return "Wereda";
    default:
      return level;
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function DetailField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </p>

      <p className="break-words text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AdministrativeUnitDetailsDialog({
  unit,
  open,
  onOpenChange,
}: AdministrativeUnitDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        {!unit ? (
          <DialogHeader>
            <DialogTitle>Administrative unit details</DialogTitle>
            <DialogDescription>
              No administrative unit is selected.
            </DialogDescription>
          </DialogHeader>
        ) : (
          <>
            <DialogHeader>
              <div className="mb-2 flex size-11 items-center justify-center rounded-xl border bg-muted">
                <Building2
                  className="size-5 text-foreground"
                  aria-hidden="true"
                />
              </div>

              <DialogTitle className="text-lg">{unit.name}</DialogTitle>

              <DialogDescription>
                View administrative unit information, hierarchy, and audit
                details.
              </DialogDescription>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Badge variant="outline">{formatLevel(unit.level)}</Badge>

                <Badge
                  variant={unit.is_active ? "default" : "secondary"}
                  className="gap-1"
                >
                  {unit.is_active ? (
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                  ) : (
                    <CircleX className="size-3" aria-hidden="true" />
                  )}

                  {unit.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-5">
              {/* Overview */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Overview</h3>

                <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2">
                  <DetailField
                    label="Unit name"
                    value={unit.name}
                    icon={<Building2 className="size-3.5" />}
                  />

                  <DetailField
                    label="Unit code"
                    value={unit.code}
                    icon={<Hash className="size-3.5" />}
                  />

                  <DetailField
                    label="Administrative level"
                    value={formatLevel(unit.level)}
                  />

                  <DetailField label="Unit ID" value={unit.id} />

                  <DetailField
                    label="Status"
                    value={unit.is_active ? "Active" : "Inactive"}
                  />
                </div>
              </section>

              <Separator />

              {/* Hierarchy */}
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Network className="size-4" aria-hidden="true" />
                  Hierarchy
                </h3>

                <div className="space-y-4 rounded-lg border p-4">
                  {/* Parent unit */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Parent unit</p>

                    {unit.parent ? (
                      <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border p-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                            <Building2
                              className="size-4"
                              aria-hidden="true"
                            />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <p className="break-words text-sm font-medium">
                              {unit.parent.name}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              Code: {unit.parent.code}
                            </p>

                            <p className="break-all text-xs text-muted-foreground">
                              ID: {unit.parent.id}
                            </p>
                          </div>
                        </div>

                        <Badge variant="outline">
                          {formatLevel(unit.parent.level)}
                        </Badge>
                      </div>
                    ) : unit.parent_id ? (
                      <div className="rounded-md bg-muted/50 p-3">
                        <p className="text-sm text-muted-foreground">
                          Parent unit details are not available.
                        </p>

                        <p className="mt-1 break-all text-xs text-muted-foreground">
                          Parent ID: {unit.parent_id}
                        </p>
                      </div>
                    ) : (
                      <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                        This unit has no parent. It is a top-level
                        administrative unit.
                      </p>
                    )}
                  </div>

                  {/* Child units */}
                  {unit.children !== undefined && (
                    <>
                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">Child units</p>

                          <Badge variant="secondary">
                            {unit.children.length}
                          </Badge>
                        </div>

                        {unit.children.length > 0 ? (
                          <div className="space-y-2">
                            {unit.children.map((child) => (
                              <div
                                key={child.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                              >
                                <div className="flex min-w-0 items-start gap-3">
                                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                                    <Building2
                                      className="size-4"
                                      aria-hidden="true"
                                    />
                                  </div>

                                  <div className="min-w-0 space-y-1">
                                    <p className="break-words text-sm font-medium">
                                      {child.name}
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                      Code: {child.code}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline">
                                    {formatLevel(child.level)}
                                  </Badge>

                                  <Badge
                                    variant={
                                      child.is_active
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {child.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                            No child units are available.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </section>

              <Separator />

              {/* Audit information */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Audit information</h3>

                <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2">
                  <DetailField
                    label="Created by"
                    value={unit.audit.created_by ?? "Not available"}
                    icon={<UserRound className="size-3.5" />}
                  />

                  <DetailField
                    label="Updated by"
                    value={unit.audit.updated_by ?? "Not available"}
                    icon={<UserRound className="size-3.5" />}
                  />

                  <DetailField
                    label="Created at"
                    value={formatDate(unit.audit.created_at)}
                    icon={<CalendarDays className="size-3.5" />}
                  />

                  <DetailField
                    label="Updated at"
                    value={formatDate(unit.audit.updated_at)}
                    icon={<CalendarDays className="size-3.5" />}
                  />
                </div>
              </section>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}