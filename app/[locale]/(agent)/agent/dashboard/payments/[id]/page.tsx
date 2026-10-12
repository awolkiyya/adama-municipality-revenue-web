"use client";

import { useParams } from "next/navigation";

import {
  PaymentDetail,
  type PaymentDetailRoutes,
} from "@/components/payment/detail";

/* =========================================================
   AGENT PAYMENT ROUTES
   ========================================================= */

export const agentRoutes: PaymentDetailRoutes = {
  invoice: (id) =>
    `/agent/dashboard/invoices/${encodeURIComponent(id)}`,

  receipt: (id) =>
    `/agent/dashboard/payments/${encodeURIComponent(id)}/receipt`,
};

/* =========================================================
   AGENT PAYMENT DETAIL PAGE
   ========================================================= */

export default function AgentPaymentDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <PaymentDetail
      paymentId={id}
      backHref="/agent/dashboard/payments"
      routes={agentRoutes}
      can={{
        printReceipt: true,
        viewInvoice: true,
        viewActivity: false,
        viewTaxpayer: true,
      }}
    />
  );
}
