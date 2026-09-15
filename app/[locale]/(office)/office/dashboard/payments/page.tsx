"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CreditCard,
  Eye,
  History,
  MoreHorizontal,
  Printer,
  RotateCcw,
  Smartphone,
  Wallet,
  XCircle,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const payments = [
  {
    id: "PAY-0001",
    invoice: "INV-2026-001",
    taxpayer: "Abebe Trading",
    method: "Cash",
    provider: null,
    amount: "25,000 ETB",
    date: "2026-09-15",
    status: "Completed",
  },
  {
    id: "PAY-0002",
    invoice: "INV-2026-002",
    taxpayer: "Biftu Construction",
    method: "Bank Transfer",
    provider: "Commercial Bank",
    amount: "75,000 ETB",
    date: "2026-09-14",
    status: "Completed",
  },
  {
    id: "PAY-0003",
    invoice: "INV-2026-003",
    taxpayer: "Hawa Hotel",
    method: "Mobile Banking",
    provider: "Telebirr",
    amount: "15,500 ETB",
    date: "2026-09-14",
    status: "Completed",
  },
  {
    id: "PAY-0004",
    invoice: "INV-2026-004",
    taxpayer: "Oromia Transport",
    method: "Mobile Banking",
    provider: "Chapa",
    amount: "42,000 ETB",
    date: "2026-09-13",
    status: "Pending",
  },
  {
    id: "PAY-0005",
    invoice: "INV-2026-005",
    taxpayer: "Adama Business Center",
    method: "Mobile Banking",
    provider: "Telebirr",
    amount: "18,750 ETB",
    date: "2026-09-13",
    status: "Completed",
  },
];

function getPaymentIcon(method: string) {
  switch (method) {
    case "Cash":
      return <Wallet className="h-4 w-4" />;

    case "Bank Transfer":
      return <Building2 className="h-4 w-4" />;

    case "Mobile Banking":
      return <Smartphone className="h-4 w-4" />;

    default:
      return <CreditCard className="h-4 w-4" />;
  }
}

function PaymentsPage() {
  const router = useRouter();

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleRecordPayment = () => {
    router.push("/office/dashboard/payments/create");
  };

  const handleViewPayment = (paymentId: string) => {
    router.push(`/office/dashboard/payments/${paymentId}`);
  };

  const handleViewHistory = (paymentId: string) => {
    router.push(
      `/office/dashboard/payments/${paymentId}/history`,
    );
  };

  const handlePrintReceipt = (paymentId: string) => {
    // TODO: Replace with receipt route/API when implemented.
    console.log("Print receipt:", paymentId);
  };

  const handleCancelPayment = (paymentId: string) => {
    // TODO: Replace with confirmation dialog + API mutation.
    console.log("Cancel payment:", paymentId);
  };

  const handleReversePayment = (paymentId: string) => {
    // TODO: Replace with confirmation dialog + API mutation.
    console.log("Reverse payment:", paymentId);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Payments
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage collected payments and payment transactions.
          </p>
        </div>

        {/* Record Payment */}
        <button
          type="button"
          onClick={handleRecordPayment}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <CreditCard className="h-4 w-4" />
          Record Payment
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-background p-4">
          <p className="text-sm text-muted-foreground">
            Total Payments
          </p>

          <p className="mt-1 text-2xl font-semibold">
            5
          </p>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <p className="text-sm text-muted-foreground">
            Collected Amount
          </p>

          <p className="mt-1 text-2xl font-semibold">
            176,250 ETB
          </p>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <p className="text-sm text-muted-foreground">
            Mobile Payments
          </p>

          <p className="mt-1 text-2xl font-semibold">
            76,250 ETB
          </p>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <p className="text-sm text-muted-foreground">
            Pending
          </p>

          <p className="mt-1 text-2xl font-semibold">
            1
          </p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-lg border">
        <div className="border-b p-4">
          <h2 className="font-semibold">
            Payment Transactions
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Cash, bank transfers, mobile banking, and digital
            payment transactions.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">
                  Payment
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Invoice
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Taxpayer
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Method
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Provider
                </th>

                <th className="px-4 py-3 text-right font-medium">
                  Amount
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Date
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Status
                </th>

                <th className="px-4 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b last:border-0"
                >
                  {/* Payment */}
                  <td className="px-4 py-3 font-medium">
                    {payment.id}
                  </td>

                  {/* Invoice */}
                  <td className="px-4 py-3">
                    {payment.invoice}
                  </td>

                  {/* Taxpayer */}
                  <td className="px-4 py-3">
                    {payment.taxpayer}
                  </td>

                  {/* Method */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getPaymentIcon(payment.method)}

                      <span>
                        {payment.method}
                      </span>
                    </div>
                  </td>

                  {/* Provider */}
                  <td className="px-4 py-3">
                    {payment.provider ? (
                      <span className="font-medium">
                        {payment.provider}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        —
                      </span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3 text-right font-medium">
                    {payment.amount}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3">
                    {payment.date}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={
                        payment.status === "Completed"
                          ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                          : "rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700"
                      }
                    >
                      {payment.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Primary View */}
                      <button
                        type="button"
                        title="View Payment"
                        onClick={() =>
                          handleViewPayment(payment.id)
                        }
                        className="rounded-md p-2 hover:bg-muted"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* More Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="rounded-md p-2 hover:bg-muted"
                            title="More Actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="end"
                          className="w-48"
                        >
                          {/* View */}
                          <DropdownMenuItem
                            onClick={() =>
                              handleViewPayment(payment.id)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Payment
                          </DropdownMenuItem>

                          {/* Print */}
                          {payment.status === "Completed" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handlePrintReceipt(payment.id)
                              }
                            >
                              <Printer className="mr-2 h-4 w-4" />
                              Print Receipt
                            </DropdownMenuItem>
                          )}

                          {/* History */}
                          <DropdownMenuItem
                            onClick={() =>
                              handleViewHistory(payment.id)
                            }
                          >
                            <History className="mr-2 h-4 w-4" />
                            View History
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {/* Cancel Pending */}
                          {payment.status === "Pending" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleCancelPayment(payment.id)
                              }
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel Payment
                            </DropdownMenuItem>
                          )}

                          {/* Reverse Completed */}
                          {payment.status === "Completed" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleReversePayment(payment.id)
                              }
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Reverse Payment
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PaymentsPage;
