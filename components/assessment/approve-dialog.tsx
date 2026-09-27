import {
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Assessment,
  AssessmentService,
} from "@/types/revenue/assessment";

import { DecisionSummary } from "./decision-summary";

export function ApproveDialog({
  open,
  onOpenChange,
  assessment,
  services,
  approving,
  hasCalculationErrors,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: Assessment;
  services: AssessmentService[];
  approving: boolean;
  hasCalculationErrors: boolean;
  onConfirm: () => void;
}) {
  /*
  |--------------------------------------------------------------------------
  | ASSESSMENT TYPE
  |--------------------------------------------------------------------------
  */

  const isExistingLizz =
    assessment.sourceType === "EXISTING_LIZZ";

  /*
  |--------------------------------------------------------------------------
  | APPROVAL BLOCKING
  |--------------------------------------------------------------------------
  |
  | Calculation errors only apply to NEW assessments.
  |
  | Existing LIZZ does not depend on tariff calculation.
  |
  */

  const approvalBlocked =
    !isExistingLizz &&
    hasCalculationErrors;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-lg">

        {/* ============================================================
            HEADER
        ============================================================ */}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />

            Approve Assessment
          </DialogTitle>

          <DialogDescription>
            Review the assessment amount and confirm the
            approval for{" "}
            <strong>
              {assessment.assessmentNumber}
            </strong>
            .
          </DialogDescription>
        </DialogHeader>

        {/* ============================================================
            CONTENT
        ============================================================ */}

        <div className="space-y-4 py-2">

          {/* ==========================================================
              ASSESSMENT TYPE
          ========================================================== */}

          <div
            className="
              rounded-lg
              border
              bg-muted/30
              px-3
              py-2.5
            "
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-muted-foreground">
                Assessment Type
              </span>

              <span className="text-sm font-medium">
                {isExistingLizz
                  ? "Existing LIZZ"
                  : "New Assessment"}
              </span>
            </div>
          </div>

          {/* ==========================================================
              DECISION SUMMARY
          ========================================================== */}

          <DecisionSummary
            services={services}
            isExistingLizz={isExistingLizz}
          />

          {/* ==========================================================
              EXISTING LIZZ EXPLANATION
          ========================================================== */}

          {isExistingLizz && (
            <div
              className="
                rounded-lg
                border
                border-blue-200
                bg-blue-50
                p-3
              "
            >
              <div className="flex items-start gap-2">

                <ShieldCheck
                  className="
                    mt-0.5
                    h-4
                    w-4
                    shrink-0
                    text-blue-600
                  "
                />

                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-800">
                    Existing LIZZ financial position
                  </p>

                  <p className="text-xs leading-relaxed text-blue-700/80">
                    The approval amount is based on the
                    remaining outstanding balance from the
                    recorded historical financial position.
                    It is not recalculated from the current
                    tariff rules.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* ==========================================================
              NEW ASSESSMENT EXPLANATION
          ========================================================== */}

          {!isExistingLizz && (
            <div
              className="
                rounded-lg
                border
                border-amber-200
                bg-amber-50
                p-3
              "
            >
              <div className="flex items-start gap-2">

                <ShieldCheck
                  className="
                    mt-0.5
                    h-4
                    w-4
                    shrink-0
                    text-amber-700
                  "
                />

                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800">
                    Server-calculated assessment
                  </p>

                  <p className="text-xs leading-relaxed text-amber-700/80">
                    The displayed amount comes from the
                    assessment calculation performed by the
                    backend. The frontend does not calculate
                    or modify the amount.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* ==========================================================
              CALCULATION ERROR
          ========================================================== */}

          {approvalBlocked && (
            <div
              className="
                rounded-lg
                border
                border-destructive/20
                bg-destructive/5
                p-3
              "
            >
              <div className="flex items-start gap-2">

                <AlertTriangle
                  className="
                    mt-0.5
                    h-4
                    w-4
                    shrink-0
                    text-destructive
                  "
                />

                <div>
                  <p className="text-sm font-medium text-destructive">
                    Approval blocked
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    One or more services have calculation
                    errors. Resolve the errors before
                    approving this assessment.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* ==========================================================
              TAXPAYER
          ========================================================== */}

          <p className="text-xs text-muted-foreground">
            Assessment{" "}
            <span className="font-medium text-foreground">
              {assessment.assessmentNumber}
            </span>{" "}
            for{" "}
            <span className="font-medium text-foreground">
              {assessment.taxpayer?.fullName ??
                "this taxpayer"}
            </span>
            .
          </p>

        </div>

        {/* ============================================================
            FOOTER
        ============================================================ */}

        <DialogFooter className="gap-2 sm:gap-2">

          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={approving}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={
              approving ||
              approvalBlocked
            }
          >
            {approving && (
              <Loader2
                className="
                  mr-2
                  h-4
                  w-4
                  animate-spin
                "
              />
            )}

            Confirm Approval
          </Button>

        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}