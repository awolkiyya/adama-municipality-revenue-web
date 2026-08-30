"use client";

import {
  AlertTriangle,
  Check,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import {
  RevenueField,
  RevenueService,
} from "@/types/revenue/assessment";

/* =====================================================
 * TYPES
 * ===================================================== */

type AssessmentSubmissionOverviewProps = {
  /**
   * Revenue services currently selected
   * for this assessment.
   */
  services: RevenueService[];

  /**
   * Field values isolated by service id.
   *
   * Example:
   *
   * {
   *   rs_001: {
   *     license_number: "BL-001",
   *   },
   *   rs_002: {
   *     land_area: "250",
   *   }
   * }
   */
  serviceFieldValues: Record<
    string,
    Record<string, any>
  >;
};

/* =====================================================
 * COMPONENT
 * ===================================================== */

export function AssessmentSubmissionOverview({
  services,
  serviceFieldValues,
}: AssessmentSubmissionOverviewProps) {
  if (services.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* =================================================
       * HEADER
       * ================================================= */}

      <div className="flex items-center gap-3 border-b p-5 sm:p-6">
        <div className="rounded-lg bg-primary/10 p-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
        </div>

        <div>
          <h2 className="text-base font-semibold">
            Submission Overview
          </h2>

          <p className="text-sm text-muted-foreground">
            This is the data that will be sent to the
            decision engine. Amounts and the final total
            are calculated server-side.
          </p>
        </div>
      </div>

      {/* =================================================
       * SERVICES
       * ================================================= */}

      <div className="space-y-3 p-5 sm:p-6">
        {services.map((service) => {
          const values =
            serviceFieldValues[service.id] ?? {};

          const requiredFields =
            service.fields.filter(
              (field) => field.required,
            );

          const requiredCount =
            requiredFields.length;

          const completedCount =
            requiredFields.filter((field) =>
              isFieldComplete(
                values[field.key],
                field,
              ),
            ).length;

          const ready =
            requiredCount === 0 ||
            completedCount === requiredCount;

          return (
            <div
              key={service.id}
              className="flex items-center justify-between gap-4 rounded-lg border p-4"
            >
              {/* SERVICE */}

              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {service.name}
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {service.code}
                </p>
              </div>

              {/* STATUS */}

              <Badge
                variant={
                  ready
                    ? "secondary"
                    : "outline"
                }
                className={
                  ready
                    ? "gap-1 text-emerald-700 dark:text-emerald-400"
                    : "gap-1 text-amber-700 dark:text-amber-400"
                }
              >
                {ready ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}

                {ready
                  ? "Ready"
                  : "Incomplete"}
              </Badge>
            </div>
          );
        })}

        {/* =================================================
         * SERVER-SIDE PRICING NOTICE
         * ================================================= */}

        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

          <p>
            No amount is calculated on this page.
            Once submitted, the decision engine loads
            the active tariff configuration, validates
            and prices every selected service
            independently, sums the total, and returns
            the official decision.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
 * FIELD COMPLETION
 * ===================================================== */

function isFieldComplete(
  value: unknown,
  field: RevenueField,
): boolean {
  if (field.type === "FILE") {
    return value instanceof File;
  }

  if (field.type === "MULTI_FILE") {
    return (
      Array.isArray(value) &&
      value.length > 0
    );
  }

  if (field.type === "CHECKBOX") {
    return value === true;
  }

  return (
    value !== undefined &&
    value !== null &&
    String(value).trim() !== ""
  );
}
