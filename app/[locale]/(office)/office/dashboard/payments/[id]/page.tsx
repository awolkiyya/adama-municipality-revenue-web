"use client";

import { useParams } from "next/navigation";

import {
  PaymentDetail,
  type PaymentDetailRoutes,
} from "@/components/payment/detail";

/* =========================================================
   OFFICE PAYMENT ROUTES
   ========================================================= */

export const officeRoutes: PaymentDetailRoutes = {
  invoice: (id) =>
    `/office/dashboard/invoices/${encodeURIComponent(id)}`,

  receipt: (id) =>
    `/office/dashboard/payments/${encodeURIComponent(id)}/receipt`,
};

/* =========================================================
   OFFICE PAYMENT DETAIL PAGE
   ========================================================= */

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <PaymentDetail
      paymentId={id}
      backHref="/office/dashboard/payments"
      routes={officeRoutes}
      can={{
        printReceipt: true,
        viewInvoice: true,
        viewActivity: true,
        viewTaxpayer: true,
      }}
    />
  );
}
