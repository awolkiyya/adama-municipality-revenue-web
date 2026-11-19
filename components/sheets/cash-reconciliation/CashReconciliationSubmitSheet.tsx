
"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Banknote, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { CashReconciliation } from "@/types/cash-reconciliation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  formatMoney,
  getStatusLabel,
  getStatusVariant,
} from "@/utils/cash-reconciliation-utils";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface CashReconciliationSubmitPayload {
  actual_amount: string;
  collector_notes: string | null;
}

interface CashReconciliationSubmitSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: CashReconciliation | null;
  isSubmitting: boolean;
  onSubmit: (payload: CashReconciliationSubmitPayload) => Promise<void>;
}

/* -------------------------------------------------------------------------- */
/* Public Component                                                           */
/* -------------------------------------------------------------------------- */

export function CashReconciliationSubmitSheet(
  props: CashReconciliationSubmitSheetProps,
) {
  const recordKey = props.record?.id ?? "new";

  return (
    <CashReconciliationSubmitSheetContent
      key={`${recordKey}-${props.open}`}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Internal Component                                                         */
/* -------------------------------------------------------------------------- */

function CashReconciliationSubmitSheetContent({
  open,
  onOpenChange,
  record,
  isSubmitting,
  onSubmit,
}: CashReconciliationSubmitSheetProps) {
  /* ------------------------------------------------------------------------ */
  /* Form State                                                               */
  /* ------------------------------------------------------------------------ */

  const [actualAmount, setActualAmount] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState(
    record?.collector_notes ?? "",
  );

  /* ------------------------------------------------------------------------ */
  /* Submit Handler                                                           */
  /* ------------------------------------------------------------------------ */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!record || isSubmitting) return;

    const normalizedAmount = actualAmount.trim();

    if (
      !/^\d+(\.\d{1,2})?$/.test(normalizedAmount) ||
      !Number.isFinite(Number(normalizedAmount))
    ) {
      toast.error(
        "Enter a valid cash amount with no more than two decimal places.",
      );
      return;
    }

    await onSubmit({
      actual_amount: normalizedAmount,
      collector_notes: submissionNotes.trim() || null,
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        if (!isSubmitting) {
          onOpenChange(value);
        }
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b px-5 py-5 text-left sm:px-6">
          <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <Banknote className="size-5" />
          </div>

          <SheetTitle className="text-xl">
            Submit Cash Closing
          </SheetTitle>

          <SheetDescription>
            Enter the physical cash counted and submit the closing for
            finance review.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="flex-1 space-y-6 px-5 py-6 sm:px-6">
            {record && (
              <>
                <div className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Closing reference
                      </p>

                      <p className="text-lg font-bold">
                        #{record.id}
                      </p>
                    </div>

                    <Badge variant={getStatusVariant(record.status)}>
                      {getStatusLabel(record.status)}
                    </Badge>
                  </div>

                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                      Previously recorded expected cash
                    </p>

                    <p className="mt-1 text-2xl font-bold tabular-nums">
                      {formatMoney(record.expected_amount)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 rounded-lg border bg-muted/30 p-3">
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    The backend recalculates expected cash using eligible
                    completed cash payments. The displayed amount is
                    informational and is not used as the submitted total.
                  </p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="actual_amount">
                Physical Cash Count (ETB) *
              </Label>

              <Input
                id="actual_amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={actualAmount}
                onChange={(event) => setActualAmount(event.target.value)}
                placeholder="0.00"
                required
                disabled={isSubmitting}
              />

              <p className="text-xs text-muted-foreground">
                Enter the amount physically counted. Use up to two decimal
                places.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="submission_notes">
                Closing Notes
              </Label>

              <Textarea
                id="submission_notes"
                value={submissionNotes}
                onChange={(event) => setSubmissionNotes(event.target.value)}
                placeholder="Explain relevant closing details or cash differences..."
                rows={5}
                maxLength={5000}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <SheetFooter className="sticky bottom-0 border-t bg-background px-5 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || !record}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}

              Submit for Review
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
