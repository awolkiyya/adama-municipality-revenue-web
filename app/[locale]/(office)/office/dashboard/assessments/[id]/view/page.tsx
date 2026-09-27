"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  FileText,
  Loader2,
  XCircle,
} from "lucide-react";

import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSelector } from "react-redux";

import { Button } from "@/components/ui/button";
import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { FloatingParticles } from "@/components/design/FloatingParticles";

import {
  Assessment,
  AssessmentService,
} from "@/types/revenue/assessment";

import {
  useAssessment,
  useApproveAssessment,
  useReturnAssessment,
} from "@/hooks/revenue/assessment.hook";

import { SummaryHeaderCard } from "@/components/assessment/summary-header-card";
import { TaxpayerCard } from "@/components/assessment/taxpayer-card";
import { AuditCard } from "@/components/assessment/audit-card";
import { NotesCard } from "@/components/assessment/notes-card";
import { DecisionCard } from "@/components/assessment/decision-card";
import { AssessmentServiceCard } from "@/components/assessment/service-card";
import { AssessmentActionBar } from "@/components/assessment/action-bar";
import { ApproveDialog } from "@/components/assessment/approve-dialog";
import { ReturnDialog } from "@/components/assessment/return-dialog";

import { RootState } from "@/lib/store/store";
import {
  PermissionAction,
  UserPermission,
} from "@/types/user";

/*
|--------------------------------------------------------------------------
| Assessment View Page
|--------------------------------------------------------------------------
|
| Assessment-level navigation:
|
| Overview
|   ├── Summary
|   ├── Taxpayer
|   ├── Audit
|   └── Notes
|
| Services
|   ├── One-time services
|   └── Scheduled services
|          └── View Payment Schedule
|
| Decision
|   └── Decision history / notes
|
|--------------------------------------------------------------------------
|
| IMPORTANT
|--------------------------------------------------------------------------
|
| Payment schedules belong to AssessmentService.
|
| One assessment may contain:
|
|   Service A → ONE_TIME
|   Service B → SCHEDULED
|   Service C → ONE_TIME
|   Service D → SCHEDULED
|
| Therefore:
|
| Assessment
|      ↓
| Services
|      ↓
| Specific scheduled service
|      ↓
| Payment Schedule
|
|--------------------------------------------------------------------------
|
| Financial responsibility
|--------------------------------------------------------------------------
|
| This page does NOT:
|
| - calculate tariffs
| - calculate assessment amounts
| - calculate invoice totals
| - calculate payment schedules
|
| All financial calculations remain backend-authoritative.
|
|--------------------------------------------------------------------------
*/

export default function AssessmentViewPage() {
  /*
  |--------------------------------------------------------------------------
  | AUTHENTICATED USER
  |--------------------------------------------------------------------------
  */

  const user = useSelector(
    (state: RootState) =>
      state.auth.user,
  );

  /*
  |--------------------------------------------------------------------------
  | PERMISSIONS
  |--------------------------------------------------------------------------
  */

  const permissions =
    user?.permissions ?? [];

  const hasPermission = (
    resource: string,
    action: PermissionAction,
  ): boolean => {
    return permissions.some(
      (permission: UserPermission) =>
        permission.resource === resource &&
        permission.actions.includes(action),
    );
  };

  const canApproveAssessment =
    hasPermission(
      "assessment",
      "approve",
    );

  const canReturnAssessment =
    hasPermission(
      "assessment",
      "return",
    );

  const canTakeAssessmentDecision =
    canApproveAssessment ||
    canReturnAssessment;

  /*
  |--------------------------------------------------------------------------
  | ROUTER / QUERY
  |--------------------------------------------------------------------------
  */

  const router = useRouter();

  const params =
    useParams<{ id: string }>();

  const assessmentId =
    params?.id;

  const queryClient =
    useQueryClient();

  /*
  |--------------------------------------------------------------------------
  | TAB STATE
  |--------------------------------------------------------------------------
  |
  | Default to Overview.
  |
  | We intentionally keep tabs local to the page.
  | The selected tab is UI state, not business state.
  |
  */

  const [
    activeTab,
    setActiveTab,
  ] = useState<
    "overview" | "services" | "decision"
  >("overview");

  /*
  |--------------------------------------------------------------------------
  | DIALOG STATE
  |--------------------------------------------------------------------------
  */

  const [
    approveDialogOpen,
    setApproveDialogOpen,
  ] = useState(false);

  const [
    returnDialogOpen,
    setReturnDialogOpen,
  ] = useState(false);

  const [
    returnReason,
    setReturnReason,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | ASSESSMENT QUERY
  |--------------------------------------------------------------------------
  */

  const {
    data: assessmentResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useAssessment(
    assessmentId ?? "",
  );

  const assessment =
    assessmentResponse?.data as
      | Assessment
      | undefined;

  /*
  |--------------------------------------------------------------------------
  | DECISION MUTATIONS
  |--------------------------------------------------------------------------
  */

  const {
    mutateAsync: approveAssessment,
    isPending: approving,
  } = useApproveAssessment();

  const {
    mutateAsync: returnAssessment,
    isPending: returning,
  } = useReturnAssessment();

  /*
  |--------------------------------------------------------------------------
  | ASSESSMENT STATE
  |--------------------------------------------------------------------------
  */

  const isPendingApproval =
    assessment?.status ===
    "PENDING_APPROVAL";

  const isApproved =
    assessment?.status ===
    "APPROVED";

  const isReturned =
    assessment?.status ===
    "RETURNED";

  /*
  |--------------------------------------------------------------------------
  | SERVICE STATISTICS
  |--------------------------------------------------------------------------
  */

  const services =
    assessment?.services ?? [];

  const serviceCount =
    services.length;

  /*
  |--------------------------------------------------------------------------
  | FILE COUNT
  |--------------------------------------------------------------------------
  */

  const fileCount =
    useMemo(() => {
      return services.reduce(
        (total, service) =>
          total +
          (service.values ?? []).reduce(
            (
              valueTotal,
              value,
            ) =>
              valueTotal +
              (value.files?.length ??
                0),
            0,
          ),
        0,
      );
    }, [services]);

  /*
  |--------------------------------------------------------------------------
  | EXISTING LIZZ
  |--------------------------------------------------------------------------
  */

  const isExistingLizz =
    assessment?.sourceType ===
    "EXISTING_LIZZ";

  /*
  |--------------------------------------------------------------------------
  | CALCULATION ERRORS
  |--------------------------------------------------------------------------
  */

  const servicesWithErrors =
    useMemo(
      () =>
        services.filter(
          (service) =>
            Boolean(
              service.calculationError,
            ),
        ),
      [services],
    );

  const hasCalculationErrors =
    !isExistingLizz &&
    servicesWithErrors.length > 0;

  /*
  |--------------------------------------------------------------------------
  | SERVICE PAYMENT TYPE
  |--------------------------------------------------------------------------
  |
  | The actual payment type should ideally come
  | from the backend.
  |
  | The service card also handles the detailed
  | display logic.
  |
  | Here we only use it for page-level statistics.
  |
  */

  const scheduledServiceCount =
    useMemo(() => {
      return services.filter(
        (service) => {
          const candidate =
            service as AssessmentService & {
              paymentType?: string | null;
              payment_type?: string | null;
              paymentScheduleRule?: {
                isEnabled?: boolean | null;
                is_enabled?: boolean | null;
              } | null;
              payment_schedule_rule?: {
                isEnabled?: boolean | null;
                is_enabled?: boolean | null;
              } | null;
            };

          const paymentType =
            candidate.paymentType ??
            candidate.payment_type;

          if (
            typeof paymentType ===
            "string"
          ) {
            return (
              paymentType.toUpperCase() ===
              "SCHEDULED"
            );
          }

          const rule =
            candidate.paymentScheduleRule ??
            candidate.payment_schedule_rule;

          if (rule) {
            return Boolean(
              rule.isEnabled ??
                rule.is_enabled,
            );
          }

          /*
           * Existing LIZZ with remaining
           * balance is scheduled.
           */
          if (
            isExistingLizz &&
            service.remainingAmount !==
              null &&
            service.remainingAmount !==
              undefined
          ) {
            return (
              Number(
                service.remainingAmount,
              ) > 0
            );
          }

          return false;
        },
      ).length;
    }, [
      services,
      isExistingLizz,
    ]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH AFTER DECISION
  |--------------------------------------------------------------------------
  */

  const refreshAfterDecision =
    async () => {
      await Promise.all([
        refetch(),

        queryClient.invalidateQueries({
          queryKey: ["assessments"],
        }),
      ]);
    };

  /*
  |--------------------------------------------------------------------------
  | OPEN APPROVE DIALOG
  |--------------------------------------------------------------------------
  */

  const handleOpenApprove =
    () => {
      if (
        !canApproveAssessment
      ) {
        toast.error(
          "You do not have permission to approve assessments.",
        );

        return;
      }

      if (
        !assessment ||
        !isPendingApproval ||
        hasCalculationErrors
      ) {
        return;
      }

      setApproveDialogOpen(true);
    };

  /*
  |--------------------------------------------------------------------------
  | CONFIRM APPROVAL
  |--------------------------------------------------------------------------
  */

  const handleConfirmApprove =
    async () => {
      if (
        !canApproveAssessment
      ) {
        toast.error(
          "You do not have permission to approve assessments.",
        );

        return;
      }

      if (
        !assessment ||
        !isPendingApproval ||
        hasCalculationErrors
      ) {
        return;
      }

      try {
        await approveAssessment(
          assessment.id,
        );

        setApproveDialogOpen(
          false,
        );

        toast.success(
          "Assessment approved successfully.",
        );

        await refreshAfterDecision();

        /*
         * After approval, keep the officer
         * on the Overview tab.
         */
        setActiveTab(
          "overview",
        );
      } catch (error) {
        console.error(
          "Failed to approve assessment:",
          error,
        );

        toast.error(
          "Could not approve this assessment. Please try again.",
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | OPEN RETURN DIALOG
  |--------------------------------------------------------------------------
  */

  const handleOpenReturn =
    () => {
      if (
        !canReturnAssessment
      ) {
        toast.error(
          "You do not have permission to return assessments.",
        );

        return;
      }

      if (
        !assessment ||
        !isPendingApproval
      ) {
        return;
      }

      setReturnReason("");

      setReturnDialogOpen(true);
    };

  /*
  |--------------------------------------------------------------------------
  | RETURN ASSESSMENT
  |--------------------------------------------------------------------------
  */

  const handleReturn =
    async () => {
      if (
        !canReturnAssessment
      ) {
        toast.error(
          "You do not have permission to return assessments.",
        );

        return;
      }

      if (
        !assessment ||
        !isPendingApproval
      ) {
        return;
      }

      const reason =
        returnReason.trim();

      if (!reason) {
        return;
      }

      try {
        await returnAssessment({
          id: assessment.id,
          reason,
        });

        setReturnDialogOpen(
          false,
        );

        setReturnReason("");

        toast.success(
          "Assessment returned for correction.",
        );

        await refreshAfterDecision();

        setActiveTab(
          "overview",
        );
      } catch (error) {
        console.error(
          "Failed to return assessment:",
          error,
        );

        toast.error(
          "Could not return this assessment. Please try again.",
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | VIEW INVOICE
  |--------------------------------------------------------------------------
  */

  const handleViewInvoice =
    () => {
      if (
        !assessment ||
        !isApproved
      ) {
        return;
      }

      router.push(
        `/office/dashboard/revenue/assessments/${assessment.id}/invoice`,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | VIEW SERVICE PAYMENT SCHEDULE
  |--------------------------------------------------------------------------
  |
  | The service card does NOT own routing.
  |
  | It reports the selected AssessmentService.
  |
  */

  const handleManageScheduledPayments =
    (
      service: AssessmentService,
    ) => {
      if (!assessment) {
        return;
      }

      router.push(
        `/office/dashboard/revenue/assessments/${assessment.id}/services/${service.id}/schedule`,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | INVALID ASSESSMENT ID
  |--------------------------------------------------------------------------
  */

  if (!assessmentId) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-8 w-8 text-destructive" />

          <p className="mt-3 font-medium">
            Invalid assessment
          </p>

          <Button
            variant="outline"
            className="mt-4"
            onClick={() =>
              router.back()
            }
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (isLoading) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />

        <p className="text-sm text-muted-foreground">
          Loading assessment...
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR / NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (
    isError ||
    !assessment
  ) {
    return (
      <div className="flex min-h-80 items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="mx-auto h-9 w-9 text-destructive" />

            <h2 className="mt-4 font-semibold">
              Assessment not found
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              The assessment could not be loaded
              or may no longer be available.
            </p>

            <div className="mt-5 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  router.back()
                }
              >
                Go Back
              </Button>

              <Button
                onClick={() =>
                  refetch()
                }
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-8">
      {/* ================================================================
          HEADER
          ================================================================ */}

      <Banner
        badge={
          <IconBadge
            className="gap-2 rounded-full bg-black/20 p-3 text-[10px] text-white"
            icon={
              <FileText className="h-4 w-4" />
            }
          >
            Revenue Assessment
          </IconBadge>
        }
        description={`Review assessment ${assessment.assessmentNumber} and manage its revenue workflow.`}
        background={
          <FloatingParticles
            color="#040404"
            count={35}
            speed={0.2}
            connectDistance={100}
            position="bottom-right"
          />
        }
        overlayClassName="bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50"
        className="text-white"
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              router.back()
            }
            className="-ml-2 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to Assessments
          </Button>
        }
      />

      {/* ================================================================
          REFRESHING
          ================================================================ */}

      {isFetching && (
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />

          Refreshing assessment...
        </div>
      )}

      {/* ================================================================
          MAIN TABS
          ================================================================ */}

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(
            value as
              | "overview"
              | "services"
              | "decision",
          )
        }
        className="space-y-5"
      >
        {/* ============================================================
            TAB NAVIGATION
            ============================================================ */}

        <div className="sticky top-0 z-10 -mx-2 bg-background/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <TabsList className="grid h-auto w-full grid-cols-3">
            <TabsTrigger
              value="overview"
              className="py-2.5"
            >
              Overview
            </TabsTrigger>

            <TabsTrigger
              value="services"
              className="gap-2 py-2.5"
            >
              Services

              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                {serviceCount}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="decision"
              className="py-2.5"
            >
              Decision
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ============================================================
            OVERVIEW
            ============================================================ */}

        <TabsContent
          value="overview"
          className="space-y-5"
        >
          <SummaryHeaderCard
            assessment={
              assessment
            }
            serviceCount={
              serviceCount
            }
            fileCount={
              fileCount
            }
          />

          <TaxpayerCard
            assessment={
              assessment
            }
          />

          <AuditCard
            assessment={
              assessment
            }
          />

          {assessment.notes && (
            <NotesCard
              notes={
                assessment.notes
              }
            />
          )}
        </TabsContent>

        {/* ============================================================
            SERVICES
            ============================================================ */}

        <TabsContent
          value="services"
          className="space-y-4"
        >
          {/* ==========================================================
              SERVICES HEADER
              ========================================================== */}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Revenue Services
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Review each revenue service and access
                its payment management workflow.
              </p>
            </div>

            {/* ========================================================
                SERVICE SUMMARY
                ======================================================== */}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {serviceCount} service
                {serviceCount === 1
                  ? ""
                  : "s"}
              </span>

              {scheduledServiceCount >
                0 && (
                <>
                  <span>
                    •
                  </span>

                  <span>
                    {
                      scheduledServiceCount
                    }{" "}
                    scheduled
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ==========================================================
              SERVICE CARDS
              ========================================================== */}

          {services.length > 0 ? (
            <div className="space-y-3">
              {services.map(
                (
                  service,
                ) => (
                  <AssessmentServiceCard
                    key={
                      service.id
                    }
                    service={
                      service
                    }
                    isExistingLizz={
                      isExistingLizz
                    }
                    onManageScheduledPayments={
                      handleManageScheduledPayments
                    }
                  />
                ),
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />

                <p className="mt-3 font-medium">
                  No revenue services
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  No revenue services were captured
                  for this assessment.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============================================================
            DECISION
            ============================================================ */}

        <TabsContent
          value="decision"
          className="space-y-5"
        >
          {/* ==========================================================
              DECISION HISTORY / NOTES
              ========================================================== */}

          {assessment.decisionNotes ? (
            <DecisionCard
              assessment={
                assessment
              }
            />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      Decision
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      No decision notes have been recorded
                      for this assessment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ==========================================================
              STATUS SUMMARY
              ========================================================== */}

          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Current Status
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {assessment.status}
                  </p>
                </div>

                <div className="text-sm text-muted-foreground">
                  {isPendingApproval &&
                    "This assessment is waiting for a decision."}

                  {isApproved &&
                    "This assessment has been approved."}

                  {isReturned &&
                    "This assessment has been returned for correction."}

                  {!isPendingApproval &&
                    !isApproved &&
                    !isReturned &&
                    "Review the assessment status and workflow history."}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ================================================================
          ASSESSMENT ACTIONS
          ================================================================ */}

      {canTakeAssessmentDecision && (
        <AssessmentActionBar
          services={
            assessment.services ??
            []
          }
          isExistingLizz={
            isExistingLizz
          }
          isPendingApproval={
            isPendingApproval
          }
          isApproved={
            isApproved
          }
          isReturned={
            isReturned
          }
          hasCalculationErrors={
            hasCalculationErrors
          }
          approving={
            approving
          }
          returning={
            returning
          }
          canApprove={
            canApproveAssessment
          }
          canReturn={
            canReturnAssessment
          }
          onOpenApprove={
            handleOpenApprove
          }
          onOpenReturn={
            handleOpenReturn
          }
          // onViewInvoice={
          //   handleViewInvoice
          // }
        />
      )}

      {/* ================================================================
          APPROVE DIALOG
          ================================================================ */}

      {canApproveAssessment && (
        <ApproveDialog
          open={
            approveDialogOpen
          }
          onOpenChange={
            setApproveDialogOpen
          }
          assessment={
            assessment
          }
          services={
            assessment.services ??
            []
          }
          approving={
            approving
          }
          hasCalculationErrors={
            hasCalculationErrors
          }
          onConfirm={
            handleConfirmApprove
          }
        />
      )}

      {/* ================================================================
          RETURN DIALOG
          ================================================================ */}

      {canReturnAssessment && (
        <ReturnDialog
          open={
            returnDialogOpen
          }
          onOpenChange={
            setReturnDialogOpen
          }
          reason={
            returnReason
          }
          onReasonChange={
            setReturnReason
          }
          returning={
            returning
          }
          onReturn={
            handleReturn
          }
        />
      )}
    </div>
  );
}
