"use client";

import {
  CircleDollarSign,
  ReceiptText,
  Wallet,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { PaymentAmountSummary as PaymentAmountSummaryType } from "@/types/payment/detail";

type PaymentAmountSummaryProps = PaymentAmountSummaryType & {
  title?: string;
  showIcons?: boolean;
  className?: string;
};

function formatMoney(
  amount: number | null | undefined,
  currency: string,
): string {
  if (amount == null || !Number.isFinite(amount)) {
    return "Not available";
  }

  try {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-ET", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

type AmountRowProps = {
  label: string;
  amount: number | null | undefined;
  currency: string;
  emphasized?: boolean;
};

function AmountRow({
  label,
  amount,
  currency,
  emphasized = false,
}: AmountRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span
        className={cn(
          "text-right text-sm tabular-nums",
          emphasized
            ? "font-semibold text-foreground"
            : "font-medium",
        )}
      >
        {formatMoney(amount, currency)}
      </span>
    </div>
  );
}

export function PaymentAmountSummary({
  amount,
  currency = "ETB",
  invoiceAmount,
  previouslyPaid,
  remainingBalance,
  fees,
  title = "Payment summary",
  showIcons = true,
  className,
}: PaymentAmountSummaryProps) {
  const isSettled =
    remainingBalance != null &&
    Number.isFinite(remainingBalance) &&
    remainingBalance <= 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {showIcons && (
            <CircleDollarSign className="size-5 text-primary" />
          )}
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">
            Amount of this payment
          </p>

          <p className="mt-2 break-words text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
            {formatMoney(amount, currency)}
          </p>
        </div>

        <div className="mt-3 divide-y">
          <AmountRow
            label="Invoice total"
            amount={invoiceAmount}
            currency={currency}
          />

          <AmountRow
            label="Previously paid"
            amount={previouslyPaid}
            currency={currency}
          />

          <AmountRow
            label="This payment"
            amount={amount}
            currency={currency}
            emphasized
          />

          {fees != null && fees !== 0 && (
            <AmountRow
              label="Fees"
              amount={fees}
              currency={currency}
            />
          )}
        </div>

        <Separator className="my-2" />

        <div
          className={cn(
            "mt-3 rounded-lg border p-4",
            isSettled && "border-emerald-200 bg-emerald-50/70",
          )}
        >
          <div className="flex items-center gap-2">
            {showIcons &&
              (isSettled ? (
                <ReceiptText className="size-4 text-emerald-700" />
              ) : (
                <Wallet className="size-4 text-muted-foreground" />
              ))}

            <p className="text-sm font-medium">
              {isSettled
                ? "Outstanding balance"
                : "Remaining balance"}
            </p>
          </div>

          <p
            className={cn(
              "mt-2 break-words text-xl font-semibold tabular-nums",
              isSettled && "text-emerald-700",
            )}
          >
            {formatMoney(remainingBalance, currency)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {remainingBalance == null
              ? "The remaining balance is not available."
              : isSettled
                ? "The supplied financial data indicates that the invoice is fully settled."
                : "The supplied financial data indicates that the invoice still has an outstanding balance."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentAmountSummary;

