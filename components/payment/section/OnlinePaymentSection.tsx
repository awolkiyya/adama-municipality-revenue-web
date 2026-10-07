"use client";

import React from "react";
import { CheckCircle2, CreditCard, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PaymentProvider } from "@/types/revenue/payment-provider";

interface OnlinePaymentSectionProps {
  currency: string;
  amount: number;
  providers: PaymentProvider[];
  selectedProvider: PaymentProvider | null;
  onProviderChange: (provider: PaymentProvider) => void;
}

interface ProviderOptionProps {
  provider: PaymentProvider;
  selected: boolean;
  onClick: () => void;
}

function parseMoney(value: number | string): number {
  const parsed = Number(
    String(value).replace(/,/g, ""),
  );

  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatMoney(
  currency: string,
  amount: number,
): string {
  return `${currency} ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function ProviderOption({
  provider,
  selected,
  onClick,
}: ProviderOptionProps) {
  const feePercentage = parseMoney(
    provider.fee_percentage,
  );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "w-full rounded-xl border p-4 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected
          ? "border-primary bg-primary/5"
          : "hover:bg-muted/50",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            selected
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          ].join(" ")}
        >
          <CreditCard className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {provider.name}
              </p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {provider.code}
              </p>
            </div>

            {selected && (
              <CheckCircle2 className="size-5 shrink-0 text-primary" />
            )}
          </div>

          <div className="mt-3">
            {feePercentage > 0 ? (
              <Badge
                variant="secondary"
                className="text-xs"
              >
                {formatAmount(feePercentage)}% provider fee
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="text-xs"
              >
                No provider fee
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  emphasized?: boolean;
}

function SummaryRow({
  label,
  value,
  emphasized = false,
}: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span
        className={
          emphasized
            ? "text-sm font-medium"
            : "text-sm text-muted-foreground"
        }
      >
        {label}
      </span>

      <span
        className={[
          "tabular-nums",
          emphasized
            ? "text-lg font-bold"
            : "text-sm font-medium",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

export function OnlinePaymentSection({
  currency,
  amount,
  providers,
  selectedProvider,
  onProviderChange,
}: OnlinePaymentSectionProps) {
  if (providers.length === 0) {
    return (
      <section className="rounded-xl border bg-card">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">
            Online payment
          </h2>
        </div>

        <div className="p-5">
          <div className="rounded-lg border border-dashed px-4 py-6 text-center">
            <p className="text-sm font-medium">
              No payment provider available
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Online payment is currently unavailable.
              Please choose another payment method.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const providerFeePercentage = selectedProvider
    ? parseMoney(selectedProvider.fee_percentage)
    : 0;

  const providerFeeAmount =
    selectedProvider && amount > 0
      ? roundMoney(
          (amount * providerFeePercentage) / 100,
        )
      : 0;

  const totalAmount =
    selectedProvider && amount > 0
      ? roundMoney(amount + providerFeeAmount)
      : amount;

  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">
            Online payment
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Select the payment provider you want to use.
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* Providers */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <ProviderOption
              key={provider.id}
              provider={provider}
              selected={
                selectedProvider?.id === provider.id
              }
              onClick={() =>
                onProviderChange(provider)
              }
            />
          ))}
        </div>

        {/* Payment summary */}
        {selectedProvider && amount > 0 && (
          <div className="rounded-xl border bg-background">
            <div className="border-b px-4 py-3">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  <Info className="size-4 text-muted-foreground" />
                </div>

                <div>
                  <p className="text-sm font-medium">
                    Payment summary
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Final charges are confirmed by the payment
                    service.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y">
              <SummaryRow
                label="Payment amount"
                value={formatMoney(currency, amount)}
              />

              {providerFeePercentage > 0 ? (
                <SummaryRow
                  label={`Provider fee (${formatAmount(
                    providerFeePercentage,
                  )}%)`}
                  value={formatMoney(
                    currency,
                    providerFeeAmount,
                  )}
                />
              ) : (
                <SummaryRow
                  label="Provider fee"
                  value="No fee"
                />
              )}

              <SummaryRow
                label="Total to pay"
                value={formatMoney(
                  currency,
                  totalAmount,
                )}
                emphasized
              />
            </div>
          </div>
        )}

        {/* Selected provider information */}
        {selectedProvider && (
          <div className="rounded-lg bg-muted/50 px-4 py-3">
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

              <div>
                <p className="text-sm font-medium">
                  Paying with {selectedProvider.name}
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  You will be redirected to the provider&apos;s
                  secure checkout to complete the payment.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}