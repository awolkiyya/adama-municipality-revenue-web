import { useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Car,
  ChevronDown,
  FileText,
  Landmark,
  Paperclip,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AssessmentService } from "@/types/revenue/assessment";
import { useOpenFile } from "@/hooks/use-open-file";
import { formatAmount } from "@/lib/format";
import { formatEthiopianDate } from "@/lib/utils";

import { StatusBadge } from "./status-badge";
import { FieldRow } from "./field-row";
import { EvidenceFileRow } from "./evidence-file-row";

// Maps a service name/code to the icon that best represents what it actually
// is, so the card is scannable in a list without reading every title.
const SERVICE_ICON_RULES: Array<{ match: RegExp; icon: LucideIcon }> = [
  { match: /land|property|real estate|cadastr/i, icon: Landmark },
  { match: /vehicle|car|transport|plate/i, icon: Car },
  { match: /business|trade|license|licence/i, icon: Briefcase },
  { match: /building|construction|permit/i, icon: Building2 },
  { match: /income|salary|payroll|wage/i, icon: Wallet },
];

function getServiceIcon(name?: string | null): LucideIcon {
  if (!name) return FileText;
  return SERVICE_ICON_RULES.find((rule) => rule.match.test(name))?.icon ?? FileText;
}

export function AssessmentServiceCard({ service }: { service: AssessmentService }) {
  const { openFile, isOpening } = useOpenFile();

  // Errors need eyes on them immediately, so those cards start open;
  // everything else starts collapsed to keep a long service list scannable.
  const hasError = Boolean(service.calculationError);
  const [open, setOpen] = useState(hasError);

  const computedAmount = service.computedAmount;
  const files = service.values?.flatMap((value) => value.files ?? []) ?? [];
  const fieldCount = service.values?.length ?? 0;

  const title = service.service?.name ?? service.serviceCode ?? service.serviceId;
  const Icon = getServiceIcon(service.service?.name ?? service.serviceCode);

  return (
    <Card className={hasError ? "border-destructive/40" : undefined}>
      <CardHeader
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className="cursor-pointer select-none"
      >
        <div className="flex items-start gap-3">
          {/* ============ SERVICE ICON ============ */}
          <div className="relative shrink-0">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                hasError
                  ? "border-destructive/30 bg-destructive/10"
                  : "border-border bg-muted/40"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${hasError ? "text-destructive" : "text-muted-foreground"}`}
              />
            </div>

            {hasError && (
              <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                <AlertTriangle className="h-2.5 w-2.5" />
              </div>
            )}
          </div>

          {/* ============ TITLE + META ============ */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold leading-tight">{title}</h3>
              <StatusBadge status={service.status} />
            </div>

            {service.service?.code && (
              <p className="mt-0.5 text-xs text-muted-foreground">{service.service.code}</p>
            )}

            {/* ============ SUMMARY STRIP — stays visible when collapsed ============ */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {computedAmount !== null && computedAmount !== undefined && (
                <span className="font-medium text-foreground">
                  {formatAmount(Number(computedAmount), service.currencyCode ?? "")}
                </span>
              )}

              {fieldCount > 0 && <span>{fieldCount} field{fieldCount === 1 ? "" : "s"}</span>}

              {files.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  {files.length}
                </span>
              )}

              {hasError && (
                <span className="inline-flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  Calculation error
                </span>
              )}
            </div>
          </div>

          {/* ============ COLLAPSE TOGGLE ============ */}
          <ChevronDown
            className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </CardHeader>

      {open && (
        <CardContent className="pt-0">
          {computedAmount !== null && computedAmount !== undefined && (
            <div className="mb-5 rounded-lg border bg-muted/30 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Calculated Amount
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    {formatAmount(Number(computedAmount), service.currencyCode ?? "")}
                  </p>
                </div>

                {service.calculatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Calculated {formatEthiopianDate(service.calculatedAt)}
                  </p>
                )}
              </div>

              {service.calculationError && (
                <p className="mt-3 flex items-start gap-2 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {service.calculationError}
                </p>
              )}
            </div>
          )}

          {service.service?.description && (
            <p className="mb-4 text-sm text-muted-foreground">{service.service.description}</p>
          )}

          {service.values?.length ? (
            <div>
              <h4 className="mb-2 text-sm font-semibold">Captured Information</h4>
              {service.values.map((value) => (
                <FieldRow key={value.id} value={value} />
              ))}
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">No captured values.</p>
          )}

          {files.length > 0 && (
            <div className="mt-5 border-t pt-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">Evidence Files</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Supporting documents submitted with this service.
                  </p>
                </div>

                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                  {files.length}
                </span>
              </div>

              <div className="space-y-2">
                {service.values?.flatMap(
                  (value) =>
                    value.files?.map((file) => (
                      <EvidenceFileRow
                        key={file.id}
                        file={file}
                        isOpening={isOpening(file.id)}
                        onOpen={openFile}
                      />
                    )) ?? [],
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}