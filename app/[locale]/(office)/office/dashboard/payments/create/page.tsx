"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PaymentForm } from "@/components/forms/payment-form";


function CreatePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const invoiceId =
    searchParams.get("invoice_id") ?? "";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Record Payment
          </h1>

          <p className="text-sm text-muted-foreground">
            Record a payment against a municipal invoice.
          </p>
        </div>
      </div>

      {/* Payment Form */}
      <PaymentForm
        initialInvoiceId={invoiceId}
        onCancel={() => router.back()}
        onSuccess={() =>
          router.push(
            "/office/dashboard/payments",
          )
        }
      />
    </div>
  );
}

export default CreatePaymentPage;
