"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Headphones, Info, Printer, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { PaymentDetail, PaymentDetailRoutes, type PaymentView } from "@/components/payment/detail";

export const officeRoutes: PaymentDetailRoutes = {
  invoice: (id) => `/office/dashboard/invoices/${encodeURIComponent(id)}`,
  receipt: (id) => `/office/dashboard/payments/${encodeURIComponent(id)}/receipt`,
};

export const citizenRoutes: PaymentDetailRoutes = {
  invoice: (id) => `/citizen/dashboard/invoices/${encodeURIComponent(id)}`,
  // add `receipt` here when the citizen receipt page exists
};

export const citizenPaths = {
  payments: "/citizen/dashboard/payments",
  payInvoice: (invoiceId: string) =>
    `/citizen/dashboard/invoices/${encodeURIComponent(invoiceId)}/pay`,
};
const SUPPORT_EMAIL = "support@adamacity.gov.et"; // confirm before deployment

function supportLink(p: PaymentView) {
  const subject = `Payment enquiry: ${p.payment_number}`;
  const body = [
    "Hello Support Team,",
    "",
    "I need help with my payment.",
    `Payment number: ${p.payment_number}`,
    `Transaction reference: ${p.transaction_reference ?? "—"}`,
    `Invoice number: ${p.invoice?.invoice_number ?? "—"}`,
    `Status: ${p.status}`,
    "",
    "Please assist me.",
  ].join("\n");

  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function CitizenPaymentDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <PaymentDetail
      paymentId={id}
      backHref={citizenPaths.payments}
      routes={citizenRoutes}
      can={{ viewActivity: true}}
      notice={(p) =>
        ["PENDING", "PROCESSING"].includes(p.status) ? (
          <Alert>
            <Info className="size-4" />
            <AlertDescription>
              Avoid starting another payment for the same amount until this
              transaction is confirmed. Use the refresh button to check again.
            </AlertDescription>
          </Alert>
        ) : null
      }
      headerActions={(p) => {
        const balanceLeft =
          p.invoice?.balance_due == null || Number(p.invoice.balance_due) > 0;

        if (["FAILED", "CANCELLED"].includes(p.status) && p.invoice && balanceLeft) {
          return (
            <Button asChild>
              <Link href={citizenPaths.payInvoice(p.invoice.id)}>
                <RefreshCw className="mr-2 size-4" />
                Try payment again
              </Link>
            </Button>
          );
        }

        if (p.status === "COMPLETED") {
          return (
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 size-4" />
              Print receipt
            </Button>
          );
        }

        return null;
      }}
      extra={(p) => (
        <Card className="shadow-none print:hidden">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Headphones className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold">Need help?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Contact the revenue support team and quote{" "}
                  <span className="font-mono">{p.payment_number}</span>.
                </p>
              </div>
            </div>

            <Button variant="outline" asChild>
              <a href={supportLink(p)}>Contact support</a>
            </Button>
          </CardContent>
        </Card>
      )}
    />
  );
}