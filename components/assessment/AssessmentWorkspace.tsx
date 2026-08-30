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
  // ROLE
  // ===================================================

  const role =
    user?.role?.name;


  // ===================================================
  // CONFIG
  // ===================================================

  const config =
    getAssessmentConfig(
      role ?? "",
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
    config?.role ===
    "REVENUE_DECISION_OFFICER";


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

      pending:
        isPendingQueue,

    });


  // ===================================================
  // ASSESSMENTS
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

  const handleNewAssessment =
    () => {

      router.push(
        "/office/dashboard/assessments/create",
      );

    };


  const handleRegisterTaxpayer =
    () => {

      router.push(
        "/office/dashboard/taxpayers/create",
      );

    };


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
    !user?.role ||
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
      />


      {/* =================================================
          SUMMARY
          ================================================= */}
      {/*
        The normal assessment workspace shows the
        complete assessment summary.

        The decision officer pending queue does not
        show general assessment status cards.
      */}

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

        onApprove={
          (
            row,
          ) => {

            console.log(
              "approve assessment",
              row,
            );

          }
        }

        onReject={
          (
            row,
          ) => {

            console.log(
              "reject assessment",
              row,
            );

          }
        }

        onReturn={
          (
            row,
          ) => {

            console.log(
              "return assessment",
              row,
            );

          }
        }

      />

    </div>
  );
}