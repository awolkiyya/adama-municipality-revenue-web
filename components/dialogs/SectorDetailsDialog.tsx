"use client";

import {
  Building2,
  Hash,
  Layers,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sector } from "@/types/admin-unit";

type SectorDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sector: Sector | null;
};

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">
          {label}
        </p>

        <div className="break-words text-sm font-medium">
          {value ?? "-"}
        </div>
      </div>
    </div>
  );
}

export function SectorDetailsDialog({
  open,
  onOpenChange,
  sector,
}: SectorDetailsDialogProps) {
  if (!sector) return null;

  const isActive = sector.is_active;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <Layers className="size-5 text-primary" />
          </div>

          <DialogTitle className="text-xl">
            Sector details
          </DialogTitle>

          <DialogDescription>
            View the information and administrative assignment
            for this revenue sector.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Sector summary */}
          <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="break-words text-base font-semibold">
                {sector.name}
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Sector code: {sector.code || "-"}
              </p>
            </div>

            <Badge
              variant={isActive ? "default" : "secondary"}
              className="w-fit gap-1"
            >
              {isActive ? (
                <CheckCircle2 className="size-3" />
              ) : (
                <XCircle className="size-3" />
              )}

              {isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          <Separator />

          {/* General information */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-muted-foreground" />

              <h4 className="text-sm font-semibold">
                General information
              </h4>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem
                icon={Building2}
                label="Sector name"
                value={sector.name}
              />

              <DetailItem
                icon={Hash}
                label="Sector code"
                value={sector.code || "-"}
              />

              <DetailItem
                icon={Layers}
                label="Assigned cluster"
                value={sector.cluster?.name || "-"}
              />

              <DetailItem
                icon={CheckCircle2}
                label="Status"
                value={isActive ? "Active" : "Inactive"}
              />
            </div>
          </section>

          {/* Timestamps, when returned by the API */}
          {(sector.created_at || sector.updated_at) && (
            <>
              <Separator />

              <section className="space-y-3">
                <h4 className="text-sm font-semibold">
                  Record information
                </h4>

                <div className="grid gap-3 sm:grid-cols-2">
                  {sector.created_at && (
                    <DetailItem
                      icon={CalendarDays}
                      label="Created"
                      value={new Date(
                        sector.created_at,
                      ).toLocaleString()}
                    />
                  )}

                  {sector.updated_at && (
                    <DetailItem
                      icon={CalendarDays}
                      label="Last updated"
                      value={new Date(
                        sector.updated_at,
                      ).toLocaleString()}
                    />
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}