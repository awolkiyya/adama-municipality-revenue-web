import {
    CheckCircle2,
    FileText,
    User,
  } from "lucide-react";
  
  import {
    Badge,
  } from "@/components/ui/badge";
  
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  
  import {
    Separator,
  } from "@/components/ui/separator";
  
  import type {
    Citizen,
  } from "@/types/citizen";
  
  import type {
    RevenueService,
  } from "@/types/revenue/assessment";
import { FieldValue, ServiceFieldValues } from "@/types/assessment/assessment-form.types";
import { isRecord } from "@/types/assessment/assessment-form.helpers";
  
 
  
  type ReviewStepProps = {
    selectedTaxpayer: Citizen | null;
    selectedServices: RevenueService[];
    serviceFieldValues: ServiceFieldValues;
    notes: string;
  
    onEditTaxpayerServices: () => void;
    onEditDetails: () => void;
    onEditNotes: () => void;
  };
  
  const formatValue = (
    value: FieldValue,
  ): string => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return "—";
    }
  
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
  
    if (value instanceof File) {
      return value.name;
    }
  
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return "—";
      }
  
      return value
        .map((item) => {
          if (item instanceof File) {
            return item.name;
          }
  
          if (isRecord(item)) {
            return String(
              item.name ??
                item.file_name ??
                item.filename ??
                item.id ??
                "Existing file",
            );
          }
  
          return String(item);
        })
        .join(", ");
    }
  
    if (isRecord(value)) {
      return String(
        value.name ??
          value.label ??
          value.file_name ??
          value.filename ??
          value.id ??
          "Attached file",
      );
    }
  
    return String(value);
  };
  
  export function ReviewStep({
    selectedTaxpayer,
    selectedServices,
    serviceFieldValues,
    notes,
  
    onEditTaxpayerServices,
    onEditDetails,
    onEditNotes,
  }: ReviewStepProps) {
    return (
      <div className="space-y-5">
        {/* Taxpayer */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <User className="size-4" />
                </div>
  
                <div>
                  <CardTitle className="text-base">
                    Taxpayer
                  </CardTitle>
  
                  <p className="text-xs text-muted-foreground">
                    Assessment owner
                  </p>
                </div>
              </div>
  
              <button
                type="button"
                onClick={
                  onEditTaxpayerServices
                }
                className="text-sm font-medium text-primary hover:underline"
              >
                Edit
              </button>
            </div>
          </CardHeader>
  
          <CardContent>
            {selectedTaxpayer ? (
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="font-medium">
                  {selectedTaxpayer.full_name}
                </p>
  
                {selectedTaxpayer.national_id && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    National ID:{" "}
                    {selectedTaxpayer.national_id}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No taxpayer selected.
              </p>
            )}
          </CardContent>
        </Card>
  
        {/* Services */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">
                  Revenue Services
                </CardTitle>
  
                <p className="mt-1 text-xs text-muted-foreground">
                  Services included in this
                  assessment
                </p>
              </div>
  
              <button
                type="button"
                onClick={
                  onEditTaxpayerServices
                }
                className="text-sm font-medium text-primary hover:underline"
              >
                Edit
              </button>
            </div>
          </CardHeader>
  
          <CardContent>
            {selectedServices.length ===
            0 ? (
              <p className="text-sm text-muted-foreground">
                No services selected.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedServices.map(
                  (service) => (
                    <div
                      key={service.id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">
                            {service.name}
                          </p>
  
                          {service.code && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Code:{" "}
                              {service.code}
                            </p>
                          )}
                        </div>
  
                        <Badge
                          variant="secondary"
                          className="shrink-0"
                        >
                          Selected
                        </Badge>
                      </div>
  
                      <Separator className="my-4" />
  
                      <div className="space-y-3">
                        {(
                          service.fields ??
                          []
                        ).map(
                          (field) => {
                            const value =
                              serviceFieldValues[
                                service.id
                              ]?.[
                                field.key
                              ];
  
                            return (
                              <div
                                key={
                                  field.key
                                }
                                className="grid gap-1 sm:grid-cols-[minmax(160px,0.8fr)_minmax(0,1.2fr)]"
                              >
                                <span className="text-sm text-muted-foreground">
                                  {field.label}
                                  {field.required && (
                                    <span className="ml-1">
                                      *
                                    </span>
                                  )}
                                </span>
  
                                <span className="break-words text-sm font-medium">
                                  {formatValue(
                                    value,
                                  )}
                                </span>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </CardContent>
        </Card>
  
        {/* Notes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="size-4" />
                </div>
  
                <div>
                  <CardTitle className="text-base">
                    Notes
                  </CardTitle>
  
                  <p className="text-xs text-muted-foreground">
                    Supporting information
                  </p>
                </div>
              </div>
  
              <button
                type="button"
                onClick={onEditNotes}
                className="text-sm font-medium text-primary hover:underline"
              >
                Edit
              </button>
            </div>
          </CardHeader>
  
          <CardContent>
            <div className="rounded-lg border bg-muted/20 p-4">
              {notes.trim() ? (
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {notes}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No notes added.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
  
        {/* Backend calculation notice */}
        <div className="flex gap-3 rounded-lg border bg-muted/20 p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
  
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Ready for submission
            </p>
  
            <p className="text-sm leading-6 text-muted-foreground">
              The information above will be
              submitted for server-side
              assessment processing. Tariff
              resolution and assessment amount
              calculation are performed by the
              backend.
            </p>
          </div>
        </div>
      </div>
    );
  }