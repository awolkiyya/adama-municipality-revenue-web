"use client";

import React from "react";
import {
  Building2,
  CheckCircle2,
  CreditCard,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

export type PaymentMethod = "ONLINE" | "BANK_TRANSFER";

interface PaymentMethodSectionProps {
  hasOnlinePayment: boolean;
  hasBankTransfer: boolean;
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
}

interface MethodOptionProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  selected: boolean;
  disabled?: boolean;
  badge?: string;
  onClick: () => void;
}

function MethodOption({
  title,
  description,
  icon: Icon,
  selected,
  disabled = false,
  badge,
  onClick,
}: MethodOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-full rounded-xl border p-4 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:bg-muted/50",
        selected
          ? "border-primary bg-primary/5"
          : "border-border",
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
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <p className="text-sm font-medium">
                {title}
              </p>

              {badge && (
                <Badge
                  variant="secondary"
                  className="shrink-0 text-[10px]"
                >
                  {badge}
                </Badge>
              )}
            </div>

            {selected && (
              <CheckCircle2 className="size-5 shrink-0 text-primary" />
            )}
          </div>

          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

export function PaymentMethodSection({
  hasOnlinePayment,
  hasBankTransfer,
  method,
  onMethodChange,
}: PaymentMethodSectionProps) {
  const hasMethods =
    hasOnlinePayment || hasBankTransfer;

  if (!hasMethods) {
    return (
      <section className="rounded-xl border bg-card">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">
            Payment method
          </h2>
        </div>

        <div className="p-5">
          <div className="rounded-lg border border-dashed px-4 py-6 text-center">
            <p className="text-sm font-medium">
              Online payment unavailable
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              No supported self-service payment method is currently
              available for this invoice.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b px-5 py-4">
        <h2 className="text-sm font-semibold">
          Payment method
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Choose how you want to pay this invoice.
        </p>
      </div>

      <div className="grid gap-3 p-5 md:grid-cols-2">
        {hasOnlinePayment && (
          <MethodOption
            title="Online payment"
            description="Pay securely using an available mobile payment provider."
            icon={CreditCard}
            selected={method === "ONLINE"}
            badge="Instant"
            onClick={() => onMethodChange("ONLINE")}
          />
        )}

        {hasBankTransfer && (
          <MethodOption
            title="Bank transfer"
            description="Transfer the payment to a municipal bank account and submit the transfer details."
            icon={Building2}
            selected={method === "BANK_TRANSFER"}
            onClick={() => onMethodChange("BANK_TRANSFER")}
          />
        )}
      </div>
    </section>
  );
}