"use client";

import React from "react";
import {
  ChevronRight,
  Home,
} from "lucide-react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";

import PaymentScheduleRuleForm from "@/components/forms/payment-schedule-rule-form";

import {
  usePaymentScheduleRule,
  useUpdatePaymentScheduleRule,
} from "@/hooks/revenue/use-payment-schedule-rules";

import type {
  PaymentScheduleRuleFormValues,
  UpdatePaymentScheduleRulePayload,
} from "@/types/revenue/payment-schedule-rule";

export default function EditPaymentScheduleRulePage() {
  const router = useRouter();
  const params = useParams();

  const id = String(params.id);

  /*
  |--------------------------------------------------------------------------
  | GET PAYMENT SCHEDULE RULE
  |--------------------------------------------------------------------------
  */

  const {
    data: response,
    isLoading,
    isError,
  } = usePaymentScheduleRule(id);

  /*
  |--------------------------------------------------------------------------
  | UPDATE MUTATION
  |--------------------------------------------------------------------------
  */

  const updateMutation =
    useUpdatePaymentScheduleRule();

  /*
  |--------------------------------------------------------------------------
  | API DATA
  |--------------------------------------------------------------------------
  */

  const rule = response?.data;

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

    const payload: UpdatePaymentScheduleRulePayload = {
      is_enabled:
        values.isEnabled,

      first_installment_percentage:
        percentage === ""
          ? null
          : Number(percentage),
    };

    updateMutation.mutate(
      {
        id,
        data: payload,
      },
      {
        onSuccess: () => {
          router.push(
            "/office/dashboard/revenue-managements/payment-schedule-rules",
          );
        },
      },
    );
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (isLoading) {
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
            Edit Rule
          </span>
        </div>

        {/* Loading */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Payment Schedule Rule
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Loading payment schedule rule...
          </p>
        </div>

        <div className="flex min-h-64 items-center justify-center rounded-lg border">
          <p className="text-sm text-muted-foreground">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NOT FOUND / ERROR
  |--------------------------------------------------------------------------
  */

  if (isError || !rule) {
    return (
      <div className="space-y-6 p-6">
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
            Edit Rule
          </span>
        </div>

        {/* Error */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Payment Schedule Rule Not Found
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            The requested payment schedule rule does not
            exist or could not be loaded.
          </p>
        </div>

        <Link
          href="/office/dashboard/revenue-managements/payment-schedule-rules"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Back to Payment Schedule Rules
        </Link>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FORM VALUES
  |--------------------------------------------------------------------------
  */

  const initialValues: PaymentScheduleRuleFormValues = {
    revenueCodeId:
      rule.revenue_code_id,

    isEnabled:
      rule.is_enabled,

    firstInstallmentPercentage:
      rule.first_installment_percentage !== null
        ? String(
            rule.first_installment_percentage,
          )
        : "",
  };

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6 p-6">
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
          Edit Rule
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit Payment Schedule Rule
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Update payment schedule configuration for
          this revenue code.
        </p>
      </div>

      {/* Form */}
      <PaymentScheduleRuleForm
        mode="edit"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isSubmitting={
          updateMutation.isPending
        }
      />
    </div>
  );
}