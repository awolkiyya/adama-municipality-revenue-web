"use client";

import { formatDate, formatEthiopianDate } from "@/lib/utils";
import { PaymentView } from "@/types/payment/ui";
import { label, TERMINAL_FAILURES } from "@/utils/helpers";
import {
  Check,
  Loader2,
  X,
} from "lucide-react";


export type StepState = "done" | "current" | "failed" | "upcoming";

export function Lifecycle({ p }: { p: PaymentView }) {
  const failed = TERMINAL_FAILURES.includes(p.status);
  const completed = p.status === "COMPLETED";
  const doneCount = failed ? 1 : completed ? (p.receipt ? 4 : 3) : 1;

  const confirmTitle =
    p.payment_method === "CASH"
      ? "Cash received"
      : p.payment_method === "BANK_TRANSFER"
        ? "Transfer verified"
        : p.payment_method === "ONLINE"
          ? "Provider confirmed"
          : "Confirmed";

  const confirmAt =
    p.payment_method === "CASH"
      ? p.cash_details?.cash_received_at
      : p.payment_method === "BANK_TRANSFER"
        ? (p.bank_transfer_details?.verified_at ??
          p.bank_transfer_details?.transfer_date)
        : p.payment_method === "ONLINE"
          ? p.online_details?.paid_at
          : p.verified_at;

  const steps = [
    { title: "Created", at: p.created_at },
    { title: failed ? (label(p.status) ?? "Failed") : confirmTitle, at: failed ? p.updated_at : confirmAt },
    { title: "Completed", at: completed ? (p.verified_at ?? p.updated_at) : null },
    { title: "Receipt issued", at: p.receipt?.issued_at },
  ].map((s, i) => {
    const state: StepState =
      i < doneCount
        ? "done"
        : i === doneCount
          ? failed
            ? "failed"
            : "current"
          : "upcoming";
    return { ...s, state };
  });

  return (
    <ol className="grid grid-cols-4" aria-label="Payment progress">
      {steps.map((s, i) => (
        <li
          key={s.title}
          className="relative flex flex-col items-center px-1 text-center"
          aria-current={s.state === "current" ? "step" : undefined}
        >
          {i > 0 && (
            <span
              aria-hidden
              className={`absolute left-[-50%] top-4 h-0.5 w-full -translate-y-1/2 ${
                s.state === "failed"
                  ? "bg-destructive/40"
                  : s.state === "upcoming"
                    ? "bg-border"
                    : "bg-primary"
              }`}
            />
          )}

          <span
            className={`relative z-10 flex size-8 items-center justify-center rounded-full border-2 bg-background ${
              s.state === "done"
                ? "border-primary bg-primary text-primary-foreground"
                : s.state === "current"
                  ? "border-primary text-primary"
                  : s.state === "failed"
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border text-muted-foreground"
            }`}
          >
            {s.state === "done" ? (
              <Check className="size-4" />
            ) : s.state === "failed" ? (
              <X className="size-4" />
            ) : s.state === "current" && p.status === "PROCESSING" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <span
                className={`size-2 rounded-full ${
                  s.state === "current" ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </span>

          <span
            className={`mt-2 text-xs font-medium ${
              s.state === "upcoming" ? "text-muted-foreground" : ""
            }`}
          >
            {s.title}
          </span>
          <span className="mt-0.5 min-h-4 text-[11px] text-muted-foreground">
            {s.state === "done" || s.state === "failed"
              ? formatEthiopianDate(s.at!.toString())
              : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}