
"use client";

import { useState, type FormEvent } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import type {
  CashReconciliation,
  CashReconciliationReviewDecision,
} from "@/types/cash-reconciliation";

import { Button } from "@/components/ui/button";
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
  formatDate,
  formatMoney,
  getCollectorName,
  getDifferenceLabel,
  getStatusLabel,
  getStatusVariant,
  REVIEW_ACTIONS,
} from "@/utils/cash-reconciliation-utils";

// ============================================================
// TYPES
// ============================================================

export interface CashReconciliationReviewPayload {
  decision: CashReconciliationReviewDecision;
  review_notes: string | null;
}

interface CashReconciliationReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: CashReconciliation | null;
  isReviewing: boolean;
  onSubmit: (payload: CashReconciliationReviewPayload) => Promise<void>;
}

// ============================================================
// DECISION STYLING
// ============================================================

type DecisionStyle = {
  icon: LucideIcon;
  selected: string;
  iconBubble: string;
  cta: string;
  notesHint: string;
};

const DECISION_STYLES: Record<string, DecisionStyle> = {
  RECONCILED: {
    icon: CheckCircle2,
    selected: "border-emerald-500 bg-emerald-500/5",
    iconBubble: "bg-emerald-500/10 text-emerald-600",
    cta: "Mark as reconciled",
    notesHint: "Optional. Add anything Finance should remember.",
  },

  RETURNED: {
    icon: Undo2,
    selected: "border-amber-500 bg-amber-500/5",
    iconBubble: "bg-amber-500/10 text-amber-600",
    cta: "Return for changes",
    notesHint: "Explain exactly what the collector needs to correct.",
  },
};

const FALLBACK_STYLE: DecisionStyle = {
  icon: ShieldCheck,
  selected: "border-primary bg-primary/5",
  iconBubble: "bg-primary/10 text-primary",
  cta: "Submit decision",
  notesHint: "Record your review notes.",
};

function getDecisionStyle(value: string): DecisionStyle {
  return DECISION_STYLES[value] ?? FALLBACK_STYLE;
}

const NOTES_MAX = 5000;

// ============================================================
// PUBLIC COMPONENT
// ============================================================

export function CashReconciliationReviewSheet(
  props: CashReconciliationReviewSheetProps,
) {
  const recordKey = props.record?.id ?? "new";

  return (
    <CashReconciliationReviewSheetContent
      key={`${recordKey}-${props.open}`}
      {...props}
    />
  );
}

// ============================================================
// INTERNAL COMPONENT
// ============================================================

function CashReconciliationReviewSheetContent({
  open,
  onOpenChange,
  record,
  isReviewing,
  onSubmit,
}: CashReconciliationReviewSheetProps) {
  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [reviewDecision, setReviewDecision] =
    useState<CashReconciliationReviewDecision>("RECONCILED");

  const [reviewNotes, setReviewNotes] = useState("");

  // ==========================================================
  // DERIVED VALUES
  // ==========================================================

  const needsNotes = reviewDecision === "RETURNED";

  const notesMissing =
    needsNotes && !reviewNotes.trim();

  const activeStyle = getDecisionStyle(reviewDecision);

  const difference =
    record &&
    record.difference_amount !== null &&
    record.difference_amount !== undefined &&
    record.difference_amount !== ""
      ? Number(record.difference_amount)
      : null;

  const isBalanced =
    difference !== null &&
    Number.isFinite(difference) &&
    difference === 0;

  const isOff =
    difference !== null &&
    Number.isFinite(difference) &&
    difference !== 0;

  const isDifferenceUnavailable =
    difference === null ||
    !Number.isFinite(difference);

  // Reconciliation is only permitted when the cash difference is zero.
  const cannotReconcile =
    reviewDecision === "RECONCILED" && !isBalanced;

  // ==========================================================
  // SUBMIT
  // ==========================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!record || isReviewing) {
      return;
    }

    if (record.status !== "PENDING_REVIEW") {
      toast.error(
        "Only pending-review reconciliations can be reviewed.",
      );
      return;
    }

    if (cannotReconcile) {
      toast.error(
        "This closing cannot be reconciled because the expected and counted cash do not match. Return it for correction.",
      );
      return;
    }

    if (notesMissing) {
      toast.error(
        "Review notes are required when returning a closing.",
      );
      return;
    }

    await onSubmit({
      decision: reviewDecision,
      review_notes: reviewNotes.trim() || null,
    });
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        if (!isReviewing) {
          onOpenChange(value);
        }
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        {/* HEADER */}

        <SheetHeader className="space-y-1 border-b px-5 py-5 text-left sm:px-6">
          <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>

          <SheetTitle className="text-xl">
            Review cash closing
          </SheetTitle>

          <SheetDescription>
            Verify the counted cash against the expected amount,
            then reconcile the closing or return it for correction.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* BODY */}

          <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6 sm:px-6">
            {/* CLOSING SUMMARY */}

            {record && (
              <section
                aria-label="Closing summary"
                className="overflow-hidden rounded-xl border"
              >
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {getCollectorName(record)}
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5 shrink-0" />

                      {formatDate(record.period_start)} –{" "}
                      {formatDate(record.period_end)}
                    </p>
                  </div>

                  <Badge variant={getStatusVariant(record.status)}>
                    {getStatusLabel(record.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 divide-x border-t">
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground">
                      Expected cash
                    </p>

                    <p className="mt-1 font-semibold tabular-nums">
                      {formatMoney(record.expected_amount)}
                    </p>
                  </div>

                  <div className="p-4">
                    <p className="text-xs text-muted-foreground">
                      Counted cash
                    </p>

                    <p className="mt-1 font-semibold tabular-nums">
                      {record.actual_amount === null ||
                      record.actual_amount === undefined ||
                      record.actual_amount === ""
                        ? "—"
                        : formatMoney(record.actual_amount)}
                    </p>
                  </div>
                </div>

                {/* DIFFERENCE */}

                <div
                  className={`flex items-center justify-between gap-4 border-t p-4 ${
                    isBalanced
                      ? "bg-emerald-500/5"
                      : isOff
                        ? "bg-destructive/5"
                        : "bg-muted/30"
                  }`}
                >
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Difference
                    </p>

                    <p
                      className={`mt-0.5 text-sm font-medium ${
                        isBalanced
                          ? "text-emerald-600"
                          : isOff
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }`}
                    >
                      {isDifferenceUnavailable
                        ? "Not counted yet"
                        : getDifferenceLabel(record.difference_amount)}
                    </p>
                  </div>

                  <p
                    className={`text-xl font-bold tabular-nums ${
                      isBalanced
                        ? "text-emerald-600"
                        : isOff
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}
                  >
                    {isDifferenceUnavailable
                      ? "—"
                      : formatMoney(record.difference_amount)}
                  </p>
                </div>
              </section>
            )}

            {/* DECISION */}

            <fieldset
              className="space-y-3"
              disabled={isReviewing}
            >
              <legend className="text-sm font-semibold">
                Finance decision
              </legend>

              <div className="space-y-2">
                {REVIEW_ACTIONS.filter(
                  (action) =>
                    action.value === "RECONCILED" ||
                    action.value === "RETURNED",
                ).map((action) => {
                  const style = getDecisionStyle(action.value);
                  const Icon = style.icon;

                  const selected =
                    reviewDecision === action.value;

                  const disabled =
                    action.value === "RECONCILED" &&
                    !isBalanced;

                  return (
                    <label
                      key={action.value}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                        disabled
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer hover:bg-muted/40"
                      } ${
                        selected
                          ? style.selected
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="review_decision"
                        value={action.value}
                        checked={selected}
                        disabled={disabled}
                        onChange={() =>
                          setReviewDecision(
                            action.value as CashReconciliationReviewDecision,
                          )
                        }
                        className="sr-only"
                      />

                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${style.iconBubble}`}
                      >
                        <Icon className="size-4.5" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">
                          {action.label}
                        </span>

                        {action.description && (
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                            {action.description}
                          </span>
                        )}

                        {disabled && (
                          <span className="mt-1 block text-xs text-destructive">
                            Available only when expected and counted cash match.
                          </span>
                        )}
                      </span>

                      <span
                        aria-hidden="true"
                        className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? "border-foreground"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {selected && (
                          <span className="size-2 rounded-full bg-foreground" />
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* CASH DIFFERENCE NOTICE */}

              {isOff && (
                <div
                  role="status"
                  className="flex gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-muted-foreground"
                >
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-destructive" />

                  <p>
                    The expected and counted cash do not match.
                    You cannot reconcile this closing. Return it
                    to the collector with instructions for correction.
                    The difference remains recorded in the reconciliation.
                  </p>
                </div>
              )}

              {isDifferenceUnavailable && (
                <div
                  role="status"
                  className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground"
                >
                  A valid cash difference is not available.
                  Verify that the collector has submitted the physical cash count.
                </div>
              )}
            </fieldset>

            {/* REVIEW NOTES */}

            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor="review_notes">
                  Review notes

                  {needsNotes ? (
                    <span className="text-destructive"> *</span>
                  ) : (
                    <span className="ml-1 font-normal text-muted-foreground">
                      (optional)
                    </span>
                  )}
                </Label>

                <span className="text-xs tabular-nums text-muted-foreground">
                  {reviewNotes.length}/{NOTES_MAX}
                </span>
              </div>

              <Textarea
                id="review_notes"
                value={reviewNotes}
                onChange={(event) =>
                  setReviewNotes(event.target.value)
                }
                placeholder={
                  reviewDecision === "RETURNED"
                    ? "Explain what the collector must correct..."
                    : "Add any additional review notes..."
                }
                rows={5}
                maxLength={NOTES_MAX}
                required={needsNotes}
                disabled={isReviewing}
                aria-describedby="review_notes_hint"
              />

              <p
                id="review_notes_hint"
                className={`text-xs ${
                  notesMissing
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {notesMissing
                  ? "Review notes are required when returning a closing."
                  : activeStyle.notesHint}
              </p>
            </div>
          </div>

          {/* FOOTER */}

          <SheetFooter className="gap-2 border-t bg-background px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isReviewing}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                isReviewing ||
                !record ||
                notesMissing ||
                cannotReconcile
              }
              variant={
                reviewDecision === "RETURNED"
                  ? "outline"
                  : "default"
              }
            >
              {isReviewing && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}

              {isReviewing
                ? "Saving..."
                : activeStyle.cta}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
