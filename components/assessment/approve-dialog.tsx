import { Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Assessment, AssessmentService } from "@/types/revenue/assessment";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Approve Assessment
          </DialogTitle>

          <DialogDescription>
            This will approve assessment <strong>{assessment.assessmentNumber}</strong>. The
            backend will persist the final decision and calculated assessment result.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <DecisionSummary services={services} />

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Approval is a decision action. The frontend does not calculate or modify the
            assessment amount.
          </div>

          <p className="text-xs text-muted-foreground">
            Assessment {assessment.assessmentNumber} for{" "}
            {assessment.taxpayer?.fullName ?? "this taxpayer"}.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={approving}>
            Cancel
          </Button>

          <Button onClick={onConfirm} disabled={approving || hasCalculationErrors}>
            {approving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
