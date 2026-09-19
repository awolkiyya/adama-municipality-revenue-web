"use client";

import React from "react";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import PaymentScheduleRuleForm from "@/components/forms/payment-schedule-rule-form";

import { useCreatePaymentScheduleRule } from "@/hooks/revenue/use-payment-schedule-rules";

import type {
  PaymentScheduleRuleFormValues,
  PaymentScheduleRulePayload,
} from "@/types/revenue/payment-schedule-rule";

export default function CreatePaymentScheduleRulePage() {
  const router = useRouter();

  const createMutation =
    useCreatePaymentScheduleRule();

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit = (
    values: PaymentScheduleRuleFormValues,
  ) => {
    const percentage =
      values.firstInstallmentPercentage.trim();

    const payload: PaymentScheduleRulePayload = {
      revenue_code_id:
        values.revenueCodeId,

      is_enabled:
        values.isEnabled,

      first_installment_percentage:
        percentage === ""
          ? null
          : Number(percentage),
    };

    createMutation.mutate(
      payload,
      {
        onSuccess: () => {
          router.push(
            "/office/dashboard/revenue-managements/payment-schedule-rules",
          );
        },
      },
    );
  };

  return (
    <div className="space-y-6 max-w-4xl m-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/office/dashboard"
          className="flex items-center gap-1 hover:text-foreground"
        >
          <Home className="size-4" />
          Dashboard
        </Link>

        <ChevronRight className="size-4" />

        <Link
          href="/office/dashboard/revenue-managements/payment-schedule-rules"
          className="hover:text-foreground"
        >
          Payment Schedule Rules
        </Link>

        <ChevronRight className="size-4" />

        <span className="text-foreground">
          Add Rule
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Add Payment Schedule Rule
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Create payment schedule configuration for a
          revenue code.
        </p>
      </div>

      {/* Form */}
      <PaymentScheduleRuleForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={
          createMutation.isPending
        }
      />
    </div>
  );
}