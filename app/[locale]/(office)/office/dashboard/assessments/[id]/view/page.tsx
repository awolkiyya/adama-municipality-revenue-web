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
import { Card, CardContent } from "@/components/ui/card";
import { FloatingParticles } from "@/components/design/FloatingParticles";

import { Assessment } from "@/types/revenue/assessment";

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

/*
|--------------------------------------------------------------------------
| Assessment View Page
|--------------------------------------------------------------------------
|
| Assessment decision workflow:
|
| DRAFT
|    ↓
| PENDING_APPROVAL
|    ↓
| ┌───────────────┐
| │ Decision      │
| │ Officer      │
| └───────────────┘
|    │
|    ├── APPROVE
|    │      ↓
|    │   APPROVED
|    │      ↓
|    │   INVOICE CREATED
|    │      ↓
|    │   INVOICE ISSUED
|    │      ↓
|    │   TAXPAYER SMS
|    │
|    └── RETURN
|           ↓
|        RETURNED
|           ↓
|        Correction
|           ↓
|      Resubmission
|           ↓
|    PENDING_APPROVAL
|
|--------------------------------------------------------------------------
|
| This page does NOT:
|
| - calculate tariffs
| - calculate assessment amounts
| - calculate invoice totals
| - resolve tariff rules
|
| All financial decisions are performed by the backend.
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
    (state: RootState) => state.auth.user
  );

  const isDecisionOfficer =
    user?.role?.name === "REVENUE_DECISION_OFFICER";


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
    assessmentId ?? ""
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
    assessment?.status === "PENDING_APPROVAL";

  const isApproved =
    assessment?.status === "APPROVED";

  const isReturned =
    assessment?.status === "RETURNED";


  /*
  |--------------------------------------------------------------------------
  | SERVICE STATISTICS
  |--------------------------------------------------------------------------
  */

  const serviceCount =
    assessment?.services?.length ?? 0;


  /*
  |--------------------------------------------------------------------------
  | FILE COUNT
  |--------------------------------------------------------------------------
  */

  const fileCount = useMemo(() => {
    if (!assessment?.services) {
      return 0;
    }

    return assessment.services.reduce(
      (total, service) =>
        total +
        (service.values ?? []).reduce(
          (valueTotal, value) =>
            valueTotal +
            (value.files?.length ?? 0),
          0
        ),
      0
    );
  }, [assessment?.services]);


  /*
  |--------------------------------------------------------------------------
  | CALCULATION ERRORS
  |--------------------------------------------------------------------------
  |
  | An assessment cannot be approved if one or more
  | assessment services failed their calculation.
  |
  */

  const servicesWithErrors =
    useMemo(
      () =>
        (assessment?.services ?? []).filter(
          (service) =>
            Boolean(service.calculationError)
        ),
      [assessment?.services]
    );

  const hasCalculationErrors =
    servicesWithErrors.length > 0;


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
  |
  | Backend workflow:
  |
  | Assessment
  |      ↓
  | APPROVED
  |      ↓
  | Invoice created
  |      ↓
  | Invoice issued
  |      ↓
  | SMS sent
  |
  */

  const handleConfirmApprove =
    async () => {
      if (
        !assessment ||
        !isPendingApproval ||
        hasCalculationErrors
      ) {
        return;
      }

      try {
        await approveAssessment(
          assessment.id
        );

        setApproveDialogOpen(false);

        toast.success(
          "Assessment approved and invoice issued successfully."
        );

        await refreshAfterDecision();

      } catch (error) {
        console.error(
          "Failed to approve assessment:",
          error
        );

        toast.error(
          "Could not approve this assessment. Please try again."
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
  |
  | This does NOT reject or permanently terminate the assessment.
  |
  | PENDING_APPROVAL
  |        ↓
  |     RETURNED
  |        ↓
  |    Correction
  |        ↓
  |   Resubmission
  |
  */

  const handleReturn =
    async () => {
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

        setReturnDialogOpen(false);

        setReturnReason("");

        toast.success(
          "Assessment returned for correction."
        );

        await refreshAfterDecision();

      } catch (error) {
        console.error(
          "Failed to return assessment:",
          error
        );

        toast.error(
          "Could not return this assessment. Please try again."
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | INITIATE INVOICE PAGE
  |--------------------------------------------------------------------------
  |
  | Normally an approved assessment already has an issued invoice
  | because approval now performs:
  |
  | APPROVE
  |   ↓
  | CREATE INVOICE
  |   ↓
  | ISSUE INVOICE
  |   ↓
  | SEND SMS
  |
  | This route is therefore only useful if the application
  | provides a separate invoice viewing page.
  |
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
        `/office/dashboard/revenue/assessments/${assessment.id}/invoice`
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
            onClick={() => router.back()}
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
                onClick={() => router.back()}
              >
                Go Back
              </Button>

              <Button
                onClick={() => refetch()}
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
    <div className="mx-auto max-w-6xl space-y-6 pb-8">

      {/* ---------------------------------------------------------------- */}
      {/* HEADER                                                          */}
      {/* ---------------------------------------------------------------- */}

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

        description={`Review assessment ${assessment.assessmentNumber} and make the appropriate revenue decision.`}

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
            onClick={() => router.back()}
            className="-ml-2 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to Assessments
          </Button>
        }
      />


      {/* ---------------------------------------------------------------- */}
      {/* REFRESHING                                                      */}
      {/* ---------------------------------------------------------------- */}

      {isFetching && (
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />

          Refreshing assessment...
        </div>
      )}


      {/* ---------------------------------------------------------------- */}
      {/* SUMMARY                                                         */}
      {/* ---------------------------------------------------------------- */}

      <SummaryHeaderCard
        assessment={assessment}
        serviceCount={serviceCount}
        fileCount={fileCount}
      />


      {/* ---------------------------------------------------------------- */}
      {/* TAXPAYER                                                        */}
      {/* ---------------------------------------------------------------- */}

      <TaxpayerCard
        assessment={assessment}
      />


      {/* ---------------------------------------------------------------- */}
      {/* AUDIT                                                           */}
      {/* ---------------------------------------------------------------- */}

      <AuditCard
        assessment={assessment}
      />


      {/* ---------------------------------------------------------------- */}
      {/* NOTES                                                           */}
      {/* ---------------------------------------------------------------- */}

      {assessment.notes && (
        <NotesCard
          notes={assessment.notes}
        />
      )}


      {/* ---------------------------------------------------------------- */}
      {/* REVENUE SERVICES                                                */}
      {/* ---------------------------------------------------------------- */}

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">
            Revenue Services
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Review the information captured by
            the assessment officer.
          </p>
        </div>


        {assessment.services?.length ? (
          assessment.services.map(
            (service) => (
              <AssessmentServiceCard
                key={service.id}
                service={service}
              />
            )
          )
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No revenue services were captured.
              </p>
            </CardContent>
          </Card>
        )}
      </div>


      {/* ---------------------------------------------------------------- */}
      {/* DECISION                                                        */}
      {/* ---------------------------------------------------------------- */}

      {assessment.decisionNotes && (
        <DecisionCard
          assessment={assessment}
        />
      )}


      {/* ---------------------------------------------------------------- */}
      {/* DECISION OFFICER ACTIONS                                        */}
      {/* ---------------------------------------------------------------- */}
      
      {isDecisionOfficer && (
        <AssessmentActionBar
          services={
            assessment.services ?? []
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


      {/* ---------------------------------------------------------------- */}
      {/* APPROVE DIALOG                                                  */}
      {/* ---------------------------------------------------------------- */}

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
          assessment.services ?? []
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


      {/* ---------------------------------------------------------------- */}
      {/* RETURN DIALOG                                                   */}
      {/* ---------------------------------------------------------------- */}

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

    </div>
  );
}