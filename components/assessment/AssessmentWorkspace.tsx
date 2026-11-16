
"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Loader2,
} from "lucide-react";

import {
  useSelector,
} from "react-redux";

import {
  useRouter,
} from "next/navigation";

import {
  RootState,
} from "@/lib/store/store";

import {
  useAssessments,
} from "@/hooks/revenue/assessment.hook";

import type {
  Assessment,
  AssessmentFilters as AssessmentQueryFilters,
} from "@/types/revenue/assessment";

import {
  AssessmentHeader,
} from "./AssessmentHeader";

import {
  AssessmentSummary,
} from "./AssessmentSummary";

import {
  AssessmentToolbar,
} from "./AssessmentToolbar";

import {
  AssessmentTable,
} from "./AssessmentTable";

import {
  getAssessmentConfig,
  INITIAL_ASSESSMENT_FILTERS,
} from "./assessment.config";


// =====================================================
// WORKSPACE
// =====================================================

export default function AssessmentWorkspace() {

  const router = useRouter();


  // ===================================================
  // USER
  // ===================================================

  const user = useSelector(
    (state: RootState) => state.auth.user,
  );


  // ===================================================
  // STATE
  // ===================================================

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filters,
    setFilters,
  ] = useState(
    INITIAL_ASSESSMENT_FILTERS,
  );

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(10);


  // ===================================================
  // PERMISSIONS
  // ===================================================

  const permissions =
    user?.permissions ?? [];


  // ===================================================
  // CONFIG
  // ===================================================

  const config =
    getAssessmentConfig(
      permissions,
    );


  // ===================================================
  // API QUERY
  // ===================================================

  /**
   * Build API query parameters.
   *
   * Status:
   *   ALL              -> omitted
   *   DRAFT            -> DRAFT
   *   PENDING_APPROVAL -> PENDING_APPROVAL
   *   RETURNED         -> RETURNED
   *   APPROVED         -> APPROVED
   *   CANCELLED        -> CANCELLED
   *
   * Source:
   *   ALL              -> omitted
   *   EXISTING_LIZZ    -> EXISTING_LIZZ
   *   NEW              -> NEW
   *
   * Dates:
   *   date_from        -> optional
   *   date_to          -> optional
   */

  const assessmentQuery =
    useMemo<AssessmentQueryFilters>(
      () => {

        const date = filters.date;

        return {

          // -------------------------------------------
          // PAGINATION
          // -------------------------------------------

          page,

          per_page:
            pageSize,


          // -------------------------------------------
          // SEARCH
          // -------------------------------------------

          search:
            search.trim() || undefined,


          // -------------------------------------------
          // STATUS
          // -------------------------------------------

          status:
            filters.status === "ALL"
              ? undefined
              : filters.status,


          // -------------------------------------------
          // SOURCE TYPE
          // -------------------------------------------

          source_type:
            filters.source_type === "ALL"
              ? undefined
              : filters.source_type,


          // -------------------------------------------
          // DATE RANGE
          // -------------------------------------------

          date_from:
            date?.from || undefined,

          date_to:
            date?.to || undefined,

        };

      },
      [
        page,
        pageSize,
        search,
        filters,
      ],
    );


  // ===================================================
  // ASSESSMENTS
  // ===================================================

  const {
    data:
      assessmentsResponse,

    isLoading:
      assessmentsLoading,

    isFetching:
      assessmentsFetching,

    isError:
      assessmentsError,

    refetch:
      refetchAssessments,

  } = useAssessments({

    params:
      assessmentQuery,

  });


  // ===================================================
  // ASSESSMENT DATA
  // ===================================================

  const assessments =
    useMemo<Assessment[]>(
      () => {

        return (
          assessmentsResponse?.data ?? []
        ) as Assessment[];

      },
      [
        assessmentsResponse,
      ],
    );


  // ===================================================
  // META
  // ===================================================

  const meta =
    assessmentsResponse?.meta;

  const total =
    meta?.total ?? 0;


  // ===================================================
  // TABLE DATA
  // ===================================================

  const tableData =
    useMemo(
      () => {

        return assessments.map(
          (assessment) => {

            return {

              ...assessment,


              // ---------------------------------------
              // ID
              // ---------------------------------------

              id:
                assessment.id,


              // ---------------------------------------
              // ASSESSMENT NUMBER
              // ---------------------------------------

              assessment_number:
                assessment.assessmentNumber ??
                assessment.id ??
                "-",


              // ---------------------------------------
              // SOURCE TYPE
              // ---------------------------------------

              source_type:
                assessment.sourceType ??
                "NEW",


              // ---------------------------------------
              // TAXPAYER
              // ---------------------------------------

              taxpayer_name:
                assessment.taxpayer?.fullName ??
                "-",

              taxpayer_no:
                assessment.taxpayer?.citizenUid ??
                "-",


              // ---------------------------------------
              // STATUS
              // ---------------------------------------

              status:
                assessment.status,


              // ---------------------------------------
              // CREATED
              // ---------------------------------------

              created_at:
                assessment.createdAt,

              created_by:
                assessment.createdBy?.name ??
                "-",

            };

          },
        );

      },
      [
        assessments,
      ],
    );


  // ===================================================
  // SUMMARY
  // ===================================================

  const summary =
    assessmentsResponse?.success
      ? assessmentsResponse.meta?.summary
      : undefined;


  // ===================================================
  // ACTIONS
  // ===================================================

  const handleNewAssessment = () => {

    router.push(
      "/office/dashboard/assessments/create",
    );

  };


  const handleRegisterTaxpayer = () => {

    router.push(
      "/office/dashboard/taxpayers/create",
    );

  };


  const handleRegisterExistingAgreement = () => {

    router.push(
      "/office/dashboard/assessments/existing/create",
    );

  };


  // ===================================================
  // VIEW ASSESSMENT
  // ===================================================

  const handleViewAssessment = (
    row: Assessment,
  ) => {

    if (!row?.id) {
      return;
    }

    router.push(
      `/office/dashboard/assessments/${row.id}/view`,
    );

  };


  // ===================================================
  // EDIT ASSESSMENT
  // ===================================================

  const handleEditAssessment = (
    row: Assessment,
  ) => {

    if (!row?.id) {
      return;
    }

    if (row.sourceType === "EXISTING_LIZZ") {

      router.push(
        `/office/dashboard/assessments/existing/${row.id}/edit`,
      );

      return;
    }

    router.push(
      `/office/dashboard/assessments/${row.id}`,
    );

  };


  // ===================================================
  // DELETE ASSESSMENT
  // ===================================================

  const handleDeleteAssessment = (
    id: string,
  ) => {

    console.log(
      "delete assessment",
      id,
    );

  };


  // ===================================================
  // RESET
  // ===================================================

  const resetFilters = () => {

    setFilters(
      INITIAL_ASSESSMENT_FILTERS,
    );

    setSearch("");

    setPage(1);

  };


  // ===================================================
  // LOADING / INVALID PERMISSIONS
  // ===================================================

  if (!config) {

    return (

      <div
        className="
          flex
          h-40
          flex-col
          items-center
          justify-center
          gap-3
        "
      >

        <Loader2
          className="
            size-6
            animate-spin
            text-muted-foreground
          "
        />

        <p
          className="
            text-sm
            text-muted-foreground
          "
        >
          Checking assessment permissions...
        </p>

      </div>

    );

  }


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      className="
        relative
        min-h-full
        space-y-8
        pb-4
      "
    >

      {/* =================================================
          HEADER
          ================================================= */}

      <AssessmentHeader
        config={config}
        onCreate={handleNewAssessment}
        onRegisterTaxpayer={handleRegisterTaxpayer}
        onRegisterExistingAgreement={handleRegisterExistingAgreement}
      />


      {/* =================================================
          SUMMARY
          ================================================= */}

      <AssessmentSummary
        total={total}
        summary={summary}
        config={config}
      />


      {/* =================================================
          TOOLBAR
          ================================================= */}

      <AssessmentToolbar
        config={config}
        search={search}
        setSearch={(value) => {

          setSearch(value);

          setPage(1);

        }}
        filters={filters}
        setFilters={(value) => {

          setFilters(value);

          setPage(1);

        }}
        reset={resetFilters}
        onPageReset={() => {

          setPage(1);

        }}
      />


      {/* =================================================
          TABLE
          ================================================= */}

      <AssessmentTable
        config={config}
        permissions={permissions}
        data={tableData}
        page={page}
        pageSize={pageSize}
        total={total}
        isLoading={
          assessmentsLoading ||
          assessmentsFetching
        }
        error={assessmentsError}
        onView={handleViewAssessment}
        onEdit={handleEditAssessment}
        onDelete={handleDeleteAssessment}
        onRetry={refetchAssessments}
        onPageChange={setPage}
        onPageSizeChange={(size) => {

          setPageSize(size);

          setPage(1);

        }}
        onApprove={(row) => {

          console.log(
            "approve assessment",
            row,
          );

        }}
        onReject={(row) => {

          console.log(
            "reject assessment",
            row,
          );

        }}
        onReturn={(row) => {

          console.log(
            "return assessment",
            row,
          );

        }}
      />

    </div>

  );

}
