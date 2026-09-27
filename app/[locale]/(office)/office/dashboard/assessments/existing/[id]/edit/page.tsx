"use client";

import { useParams } from "next/navigation";

import ExistingLizzForm from "@/components/assessment/ExistingLizzForm";
import { useAssessment } from "@/hooks/revenue/assessment.hook";

export default function UpdateExistingLizzPage() {
  const params = useParams<{
    locale: string;
    id: string;
  }>();

  const locale = params.locale;
  const assessmentId = params.id;

  const backUrl = assessmentId
    ? `/${locale}/office/dashboard/assessments/${assessmentId}/view`
    : `/${locale}/office/dashboard/assessments`;

  /*
   * ----------------------------------------------------------
   * LOAD EXISTING ASSESSMENT
   * ----------------------------------------------------------
   *
   * The assessment is loaded here and passed to
   * ExistingLizzForm as initialData.
   *
   * This matches the current useExistingAgreement hook,
   * which hydrates the form from initialData.
   */
  const {
    data: assessment,
    isLoading,
    isError,
    error,
  } = useAssessment(assessmentId);

  console.log( 
    assessment?.data,
  );

  /*
   * ----------------------------------------------------------
   * MISSING ID
   * ----------------------------------------------------------
   */

  if (!assessmentId) {
    console.error(
      "[UpdateExistingLizzPage] Missing assessment ID",
      params,
    );

    return (
      <div className="flex min-h-[400px] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h2 className="text-lg font-semibold">
            Assessment ID is missing
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Unable to load the existing LIZZ assessment.
          </p>
        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------------------------
   * LOADING
   * ----------------------------------------------------------
   */

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />

          <h2 className="text-lg font-semibold">
            Loading assessment...
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Please wait while the existing LIZZ assessment is loaded.
          </p>
        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------------------------
   * ERROR
   * ----------------------------------------------------------
   */

  if (isError || !assessment) {
    console.error(
      "[UpdateExistingLizzPage] Failed to load assessment",
      {
        assessmentId,
        error,
      },
    );

    return (
      <div className="flex min-h-[400px] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h2 className="text-lg font-semibold">
            Unable to load assessment
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            The existing LIZZ assessment could not be loaded.
            Please try again.
          </p>
        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------------------------
   * EDIT FORM
   * ----------------------------------------------------------
   *
   * IMPORTANT:
   *
   * initialData is now populated.
   *
   * ExistingLizzForm
   *      ↓
   * useExistingAgreement
   *      ↓
   * hydration useEffect
   *      ↓
   * agreement
   * financial
   * serviceFieldValues
   */
  return (
    <ExistingLizzForm
      assessmentId={assessmentId}
      initialData={assessment.data}
      backUrl={backUrl}
    />
  );
}
