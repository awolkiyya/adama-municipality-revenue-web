"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

import {
  LeaseAmendmentForm,
  type LeaseAmendmentFormValues,
} from "@/components/forms/lease-amendment-form";
import { useAssessment } from "@/hooks/revenue/assessment.hook";
import { useCitizens } from "@/hooks/useCitizen.hook";

import type { Assessment } from "@/types/revenue/assessment";
import type { Citizen } from "@/types/citizen";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function extractAssessment(response: unknown): Assessment | null {
  let current: unknown = response;

  for (let depth = 0; depth < 3; depth += 1) {
    if (!current || typeof current !== "object") {
      return null;
    }

    const record = current as Record<string, unknown>;

    if (
      typeof record.id === "string" &&
      typeof record.assessmentNumber === "string" &&
      Array.isArray(record.services)
    ) {
      return record as unknown as Assessment;
    }

    if (!("data" in record)) {
      return null;
    }

    current = record.data;
  }

  return null;
}

/**
 * Supports:
 *   Citizen[]
 *   { data: Citizen[] }
 *   { data: { data: Citizen[] } }
 */
function extractCitizens(response: unknown): Citizen[] {
  let current: unknown = response;

  for (let depth = 0; depth < 3; depth += 1) {
    if (Array.isArray(current)) {
      return current as Citizen[];
    }

    if (!current || typeof current !== "object") {
      return [];
    }

    const record = current as Record<string, unknown>;

    if (!("data" in record)) {
      return [];
    }

    current = record.data;
  }

  return Array.isArray(current) ? (current as Citizen[]) : [];
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CreateLeaseAmendmentPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();

  const assessmentId = searchParams.get("assessment_id");

  // Load the source assessment.
  const assessmentQuery = useAssessment(assessmentId ?? "");

  const assessment = useMemo(
    () => extractAssessment(assessmentQuery.data),
    [assessmentQuery.data],
  );

  // Load taxpayers/citizens using your existing hook.
  const citizensQuery = useCitizens();

  const taxpayers = useMemo(
    () => extractCitizens(citizensQuery.data),
    [citizensQuery.data],
  );

  const isLoading =
    Boolean(assessmentId) &&
    assessmentQuery.isLoading;

  const errorMessage = !assessmentId
    ? "Assessment ID is missing from the URL."
    : assessmentQuery.error
      ? "Failed to load the assessment."
      : !assessmentQuery.isLoading && !assessment
        ? "Assessment not found or the API response has an unexpected structure."
        : null;

  /* ---------------------------------------------------------------------- */
  /* Submit                                                                  */
  /* ---------------------------------------------------------------------- */

  const handleSubmit = async (
    values: LeaseAmendmentFormValues,
  ) => {
    if (!assessmentId || !assessment) {
      throw new Error("A valid source assessment is required.");
    }

    /*
     * TODO: Replace this with your Laravel lease-amendment mutation.
     * The current code logs the payload but does not persist it.
     */
    console.log("CREATE LEASE AMENDMENT:", {
      assessmentId: assessment.id,
      values,
    });

    router.push(`/${locale}/office/dashboard/lease-amendments`);
  };

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                 */
  /* ---------------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading assessment...
        </p>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Error                                                                   */
  /* ---------------------------------------------------------------------- */

  if (errorMessage || !assessment) {
    return (
      <div className="space-y-3 rounded-lg border p-5">
        <p className="text-sm text-destructive">
          {errorMessage ?? "Assessment not found."}
        </p>

        <button
          type="button"
          className="text-sm underline underline-offset-4"
          onClick={() => router.back()}
        >
          Go back
        </button>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Form                                                                    */
  /* ---------------------------------------------------------------------- */

  return (
    <LeaseAmendmentForm
      mode="create"
      assessment={assessment}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}