"use client";

import React from "react";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PaymentForm } from "@/components/forms/payment-form";
import { usePaymentOptions } from "@/hooks/revenue/payment-option.hook";

function CreatePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const invoiceId = searchParams.get("invoice_id") ?? "";

  const {
    data: paymentOptionsResponse,
    isLoading: isPaymentOptionsLoading,
    isError: isPaymentOptionsError,
    refetch: refetchPaymentOptions,
  } = usePaymentOptions();

  const paymentOptions = paymentOptionsResponse?.data;

  const hasCashPayment =
    paymentOptions?.payment_methods?.includes("CASH") ?? false;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
        {/* Page Header */}
        <div className="flex items-start gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              Cash Collection
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Collect and record a cash payment against an invoice.
            </p>
          </div>
        </div>

        {/* Loading */}
        {isPaymentOptionsLoading && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-5">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />

            <div>
              <p className="text-sm font-medium">
                Checking payment availability
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Please wait a moment.
              </p>
            </div>
          </div>
        )}

        {/* Service Error */}
        {isPaymentOptionsError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />

              <div className="min-w-0">
                <p className="text-sm font-medium">
                  Payment service unavailable
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  We could not verify payment availability at this time.
                  Please try again.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => refetchPaymentOptions()}
                >
                  Try again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Cash Unavailable */}
        {!isPaymentOptionsLoading &&
          !isPaymentOptionsError &&
          !hasCashPayment && (
            <div className="rounded-lg border bg-muted/30 p-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-background">
                  <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                </div>

                <h2 className="mt-4 text-base font-semibold">
                  Cash payment is currently unavailable
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Please use another available payment method or contact an
                  administrator.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-5"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go back
                </Button>
              </div>
            </div>
          )}

        {/* Cash Collection Form */}
        {!isPaymentOptionsLoading &&
          !isPaymentOptionsError &&
          hasCashPayment && (
            <PaymentForm
              initialInvoiceId={invoiceId}
              onCancel={() => router.back()}
              onSuccess={() =>
                router.push("/office/dashboard/payments")
              }
            />
          )}
      </div>
    </div>
  );
}

export default CreatePaymentPage;