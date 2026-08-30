import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReturnDialog({
  open,
  onOpenChange,
  reason,
  onReasonChange,
  returning,
  onReturn,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  returning: boolean;
  onReturn: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Return Assessment for Correction</DialogTitle>

          <DialogDescription>
            This assessment will be returned to the responsible officer
            for correction. It will not be permanently rejected or deleted.
            Please provide a clear reason explaining what needs to be corrected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="return-reason">
            Correction Reason
          </Label>

          <Textarea
            id="return-reason"
            value={reason}
            onChange={(event) =>
              onReasonChange(event.target.value)
            }
            placeholder="Explain what needs to be corrected, for example: Incorrect taxpayer information, missing supporting document, or incorrect assessment data..."
            rows={5}
            disabled={returning}
          />

          <p className="text-xs text-muted-foreground">
            A reason is required. The assessment will move to
            <span className="font-medium"> RETURNED </span>
            and can be corrected and resubmitted for approval.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={returning}
          >
            Cancel
          </Button>

          <Button
            variant="default"
            onClick={onReturn}
            disabled={returning || !reason.trim()}
          >
            {returning && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            Return for Correction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}