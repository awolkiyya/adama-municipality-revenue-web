import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Info,
  Loader2,
  RotateCcw,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { AssessmentService } from "@/types/revenue/assessment";

import { DecisionSummary } from "./decision-summary";

type BarState =
  | "error"
  | "pending"
  | "approved"
  | "returned"
  | "idle";

const STATE_CONFIG: Record<
  BarState,
  {
    icon: LucideIcon;
    iconClasses: string;
    accentClasses: string;
    message: string;
  }
> = {
  error: {
    icon: AlertTriangle,
    iconClasses: "bg-destructive/10 text-destructive",
    accentClasses: "border-l-4 border-l-destructive",
    message:
      "Resolve the calculation error(s) above before approving.",
  },

  pending: {
    icon: ClipboardList,
    iconClasses: "bg-amber-50 text-amber-600",
    accentClasses: "border-l-4 border-l-amber-400",
    message:
      "Review the assessment and either return it for correction or approve it.",
  },

  approved: {
    icon: CheckCircle2,
    iconClasses: "bg-emerald-50 text-emerald-600",
    accentClasses: "border-l-4 border-l-emerald-400",
    message:
      "The assessment has been approved. The invoice has been issued and the taxpayer has been notified.",
  },

  returned: {
    icon: RotateCcw,
    iconClasses: "bg-orange-50 text-orange-600",
    accentClasses: "border-l-4 border-l-orange-400",
    message:
      "This assessment was returned for correction.",
  },

  idle: {
    icon: Info,
    iconClasses: "bg-muted text-muted-foreground",
    accentClasses: "border-l-4 border-l-border",
    message:
      "No further decision action is currently available.",
  },
};

function resolveState({
  hasCalculationErrors,
  isPendingApproval,
  isApproved,
  isReturned,
}: {
  hasCalculationErrors: boolean;
  isPendingApproval: boolean;
  isApproved: boolean;
  isReturned: boolean;
}): BarState {
  if (hasCalculationErrors) {
    return "error";
  }

  if (isPendingApproval) {
    return "pending";
  }

  if (isApproved) {
    return "approved";
  }

  if (isReturned) {
    return "returned";
  }

  return "idle";
}

export function AssessmentActionBar({
  services,
  isPendingApproval,
  isApproved,
  isReturned,
  hasCalculationErrors,
  approving,
  returning,
  onOpenApprove,
  onOpenReturn,
}: {
  services: AssessmentService[];

  isPendingApproval: boolean;

  isApproved: boolean;

  isReturned: boolean;

  hasCalculationErrors: boolean;

  approving: boolean;

  returning: boolean;

  onOpenApprove: () => void;

  onOpenReturn: () => void;
}) {
  const processing =
    approving ||
    returning;

  const state =
    resolveState({
      hasCalculationErrors,
      isPendingApproval,
      isApproved,
      isReturned,
    });

  const {
    icon: StateIcon,
    iconClasses,
    accentClasses,
    message,
  } = STATE_CONFIG[state];

  return (
    <Card
      className={`
        sticky
        bottom-4
        z-20
        border
        bg-background/95
        shadow-lg
        backdrop-blur
        ${accentClasses}
      `}
    >
      <CardContent
        className="
          flex
          flex-col
          gap-4
          p-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* ============================================================
            STATE INFORMATION
        ============================================================ */}

        <div
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-center
          "
        >
          <div className="flex items-start gap-3">
            <div
              className={`
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                ${iconClasses}
              `}
            >
              <StateIcon className="h-4.5 w-4.5" />
            </div>

            <div>
              <p className="font-medium leading-tight">
                Decision Officer Actions
              </p>

              <p className="mt-0.5 text-sm text-muted-foreground">
                {message}
              </p>
            </div>
          </div>

          {/* ============================================================
              DECISION SUMMARY
          ============================================================ */}

          {isPendingApproval && (
            <>
              <div className="hidden h-10 w-px bg-border sm:block" />

              <DecisionSummary
                services={services}
              />
            </>
          )}
        </div>

        {/* ============================================================
            ACTIONS
        ============================================================ */}

        <div className="flex flex-wrap gap-2">

          {/* ==========================================================
              PENDING APPROVAL
          ========================================================== */}

          {isPendingApproval && (
            <>
              {/* ------------------------------------------------------
                  RETURN FOR CORRECTION
              ------------------------------------------------------ */}

              <Button
                variant="outline"
                onClick={onOpenReturn}
                disabled={processing}
                className="
                  border-orange-300
                  text-orange-600
                  hover:bg-orange-50
                  hover:text-orange-700
                "
              >
                {returning ? (
                  <Loader2
                    className="
                      mr-2
                      h-4
                      w-4
                      animate-spin
                    "
                  />
                ) : (
                  <RotateCcw
                    className="
                      mr-2
                      h-4
                      w-4
                    "
                  />
                )}

                Return for Correction
              </Button>

              {/* ------------------------------------------------------
                  APPROVE
              ------------------------------------------------------ */}

              <Button
                onClick={onOpenApprove}
                disabled={
                  processing ||
                  hasCalculationErrors
                }
                title={
                  hasCalculationErrors
                    ? "Resolve calculation errors before approving"
                    : undefined
                }
              >
                {approving ? (
                  <Loader2
                    className="
                      mr-2
                      h-4
                      w-4
                      animate-spin
                    "
                  />
                ) : (
                  <CheckCircle2
                    className="
                      mr-2
                      h-4
                      w-4
                    "
                  />
                )}

                Approve Assessment
              </Button>
            </>
          )}

          {/* ==========================================================
              APPROVED
          ========================================================== */}

          {isApproved && (
            <div
              className="
                flex
                items-center
                gap-2
                rounded-md
                border
                border-emerald-200
                bg-emerald-50
                px-3
                py-2
                text-sm
                font-medium
                text-emerald-700
              "
            >
              <CheckCircle2 className="h-4 w-4" />

              Invoice Issued & Taxpayer Notified
            </div>
          )}

          {/* ==========================================================
              RETURNED
          ========================================================== */}

          {isReturned && (
            <div
              className="
                flex
                items-center
                gap-2
                rounded-md
                border
                border-orange-200
                bg-orange-50
                px-3
                py-2
                text-sm
                font-medium
                text-orange-700
              "
            >
              <RotateCcw className="h-4 w-4" />

              Returned for Correction
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}