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
  hasAssessmentPermission,
  INITIAL_ASSESSMENT_FILTERS,
} from "./assessment.config";


// =====================================================
// WORKSPACE
// =====================================================

export default function AssessmentWorkspace() {

  const router =
    useRouter();


  // ===================================================
  // USER
  // ===================================================

  const user =
    useSelector(
      (
        state: RootState,
      ) =>
        state.auth.user,
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

  /**
   * Permissions come from the authenticated user.
   *
   * The fallback to [] is only for the initial state
   * before the authenticated user has been loaded.
   */
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
  // PENDING QUEUE
  // ===================================================
  //
  // REVENUE_DECISION_OFFICER works with the
  // PENDING_APPROVAL queue.
  //
  // The queue is handled through the normal
  // /assessments endpoint using:
  //
  // ?pending=true
  //
  // No separate /assessments/pendings endpoint
  // is required.
  //
  // ===================================================

  const isPendingQueue =
    hasAssessmentPermission(
      permissions,
      {
        resource: "assessment",
        action: "approve",
      },
    ) ||
    hasAssessmentPermission(
      permissions,
      {
        resource: "assessment",
        action: "reject",
      },
    ) ||
    hasAssessmentPermission(
      permissions,
      {
        resource: "assessment",
        action: "return",
      },
    );


  // ===================================================
  // API QUERY
  // ===================================================

  const assessmentQuery =
    useMemo<AssessmentQueryFilters>(
      () => {

        const date =
          filters.date;

        return {

          page,

          per_page:
            pageSize,

          search:
            search.trim() ||
            undefined,

          /*
           * Normal assessment lists may filter
           * by status.
           *
           * Pending queue does not send status
           * because the hook adds:
           *
           * pending=true
           *
           * which the backend resolves to:
           *
           * PENDING_APPROVAL
           */
          status:
            isPendingQueue
              ? undefined
              : (
                  filters.status === "ALL"
                    ? undefined
                    : filters.status
                ),

          date_from:
            date?.from ||
            undefined,

          date_to:
            date?.to ||
            undefined,

        };

      },
      [
        page,
        pageSize,
        search,
        filters,
        isPendingQueue,
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

  } =
    useAssessments({

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
          assessmentsResponse?.data ??
          []
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
          (
            assessment,
          ) => {

            return {

              ...assessment,

              id:
                assessment.id,

              assessment_number:
                assessment.assessmentNumber ??
                assessment.id ??
                "-",

              taxpayer_name:
                assessment.taxpayer?.fullName ??
                "-",

              taxpayer_no:
                assessment.taxpayer?.citizenUid ??
                "-",

              status:
                assessment.status,

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
    !isPendingQueue &&
    assessmentsResponse?.success
      ? assessmentsResponse.meta?.summary
      : undefined;


  // ===================================================
  // ACTIONS
  // ===================================================

  /**
   * Create a completely new assessment.
   */
  const handleNewAssessment =
    () => {

      router.push(
        "/office/dashboard/assessments/create",
      );

    };


  /**
   * Register a taxpayer.
   */
  const handleRegisterTaxpayer =
    () => {

      router.push(
        "/office/dashboard/taxpayers/create",
      );

    };


  /**
   * Register an existing agreement.
   *
   * This is specifically for obligations that existed
   * before the system and need to continue from their
   * current financial state.
   *
   * The existing agreement page should handle:
   *
   * - taxpayer selection
   * - service selection
   * - original obligation
   * - previous payments
   * - opening balance
   * - remaining payment schedule
   */
  const handleRegisterExistingAgreement =
    () => {

      router.push(
        "/office/dashboard/assessments/existing",
      );

    };


  /**
   * View assessment.
   */
  const handleViewAssessment =
    (
      row: any,
    ) => {

      if (!row?.id) {
        return;
      }

      router.push(
        `/office/dashboard/assessments/${row.id}/view`,
      );

    };


  /**
   * Edit assessment.
   */
  const handleEditAssessment =
    (
      row: any,
    ) => {

      if (!row?.id) {
        return;
      }

      router.push(
        `/office/dashboard/assessments/${row.id}`,
      );

    };


  /**
   * Delete assessment.
   *
   * Actual delete mutation can be connected later.
   */
  const handleDeleteAssessment =
    (
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

  const resetFilters =
    () => {

      setFilters(
        INITIAL_ASSESSMENT_FILTERS,
      );

      setSearch("");

      setPage(1);

    };


  // ===================================================
  // LOADING / INVALID ROLE
  // ===================================================

  if (
    !config
  ) {

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
        config={
          config
        }

        onCreate={
          handleNewAssessment
        }

        onRegisterTaxpayer={
          handleRegisterTaxpayer
        }

        onRegisterExistingAgreement={
          handleRegisterExistingAgreement
        }
      />


      {/* =================================================
          SUMMARY
          ================================================= */}

      {!isPendingQueue && (
        <AssessmentSummary
          total={
            total
          }

          summary={
            summary
          }

          config={
            config
          }
        />
      )}


      {/* =================================================
          TOOLBAR
          ================================================= */}

      <AssessmentToolbar
        config={
          config
        }

        search={
          search
        }

        setSearch={(
          value,
        ) => {

          setSearch(
            value,
          );

          setPage(
            1,
          );

        }}

        filters={
          filters
        }

        setFilters={(
          value,
        ) => {

          setFilters(
            value,
          );

          setPage(
            1,
          );

        }}

        reset={
          resetFilters
        }

        onPageReset={() => {

          setPage(
            1,
          );

        }}
      />


      {/* =================================================
          TABLE
          ================================================= */}

      <AssessmentTable

        config={
          config
        }

        permissions={
          permissions
        }

        data={
          tableData
        }

        page={
          page
        }

        pageSize={
          pageSize
        }

        total={
          total
        }

        isLoading={
          assessmentsLoading ||
          assessmentsFetching
        }

        error={
          assessmentsError
        }

        onView={
          handleViewAssessment
        }

        onEdit={
          handleEditAssessment
        }

        onDelete={
          handleDeleteAssessment
        }

        onRetry={
          refetchAssessments
        }

        onPageChange={
          setPage
        }

        onPageSizeChange={(
          size,
        ) => {

          setPageSize(
            size,
          );

          setPage(
            1,
          );

        }}

        onApprove={(
          row,
        ) => {

          console.log(
            "approve assessment",
            row,
          );

        }}

        onReject={(
          row,
        ) => {

          console.log(
            "reject assessment",
            row,
          );

        }}

        onReturn={(
          row,
        ) => {

          console.log(
            "return assessment",
            row,
          );

        }}
      />

    </div>
  );
}
