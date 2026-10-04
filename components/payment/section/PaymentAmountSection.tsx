"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AmountMode = "FULL" | "PARTIAL";

interface PaymentAmountSectionProps {
  currency: string;
  balanceDue: number;
  mode: AmountMode;
  amount: string;
  onModeChange: (mode: AmountMode) => void;
  onAmountChange: (amount: string) => void;
}

const QUICK_PERCENTAGES = [25, 50, 75];

function formatMoney(currency: string, amount: number): string {
  return `${currency} ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

function parseMoney(value: string): number {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function PaymentAmountSection({
  currency,
  balanceDue,
  mode,
  amount,
  onModeChange,
  onAmountChange,
}: PaymentAmountSectionProps) {
  const numericAmount = parseMoney(amount);

  const handleModeChange = (nextMode: AmountMode) => {
    onModeChange(nextMode);

    if (nextMode === "FULL") {
      onAmountChange(balanceDue.toFixed(2));
    } else {
      onAmountChange("");
    }
  };

  const handleQuickPercentage = (percentage: number) => {
    const calculatedAmount = (balanceDue * percentage) / 100;
    onModeChange("PARTIAL");
    onAmountChange(calculatedAmount.toFixed(2));
  };

  const handleAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;

    if (value === "") {
      onAmountChange("");
      return;
    }

    if (!/^\d*\.?\d{0,2}$/.test(value)) {
      return;
    }

    const nextAmount = parseMoney(value);

    if (nextAmount > balanceDue) {
      onAmountChange(balanceDue.toFixed(2));
      return;
    }

    onAmountChange(value);
  };

  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">
            Payment amount
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Choose how much of the outstanding balance you want to pay.
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* Amount mode */}
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleModeChange("FULL")}
            className={[
              "rounded-lg border p-4 text-left transition-colors",
              mode === "FULL"
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  Pay full balance
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Pay the entire outstanding amount.
                </p>
              </div>

              {mode === "FULL" && (
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
              )}
            </div>

            <p className="mt-3 text-lg font-semibold tabular-nums">
              {formatMoney(currency, balanceDue)}
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("PARTIAL")}
            className={[
              "rounded-lg border p-4 text-left transition-colors",
              mode === "PARTIAL"
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  Pay partial amount
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the amount you want to pay now.
                </p>
              </div>

              {mode === "PARTIAL" && (
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
              )}
            </div>
          </button>
        </div>

        {/* Partial amount input */}
        {mode === "PARTIAL" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">
                Amount
              </Label>

              <div className="relative">
                <Input
                  id="payment-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="pr-16 text-lg tabular-nums"
                />

                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                  {currency}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                Maximum payment:
                {" "}
                {formatMoney(currency, balanceDue)}
              </p>
            </div>

            {/* Quick amounts */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Quick amount
              </p>

              <div className="flex flex-wrap gap-2">
                {QUICK_PERCENTAGES.map((percentage) => {
                  const quickAmount =
                    (balanceDue * percentage) / 100;

                  const isSelected =
                    Math.abs(numericAmount - quickAmount) < 0.005;

                  return (
                    <button
                      key={percentage}
                      type="button"
                      onClick={() =>
                        handleQuickPercentage(percentage)
                      }
                      className={[
                        "rounded-md border px-3 py-2 text-sm transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5 text-primary"
                          : "hover:bg-muted",
                      ].join(" ")}
                    >
                      {percentage}%
                      <span className="ml-1 text-muted-foreground">
                        ({formatAmount(quickAmount)})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Current amount */}
        {numericAmount > 0 && (
          <div className="rounded-lg bg-muted/50 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                Amount to pay
              </span>

              <span className="font-semibold tabular-nums">
                {formatMoney(currency, numericAmount)}
              </span>
            </div>
          </div>
        )}

        {/* Remaining balance */}
        {numericAmount > 0 && numericAmount < balanceDue && (
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">
              Remaining balance
            </span>

            <span className="font-medium tabular-nums">
              {formatMoney(
                currency,
                Math.max(balanceDue - numericAmount, 0),
              )}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}