"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  ExternalLink,
  FileCheck2,
  FileText,
  Hash,
  Loader2,
  Printer,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { PaymentDetail as PaymentDetailApi } from "@/types/payment";

import {
  useCompleteCashPayment,
  usePayment,
} from "@/hooks/payment/payment.hook";

import { useOpenFile } from "@/hooks/use-open-file";

/*
|--------------------------------------------------------------------------
| API VIEW TYPES
|--------------------------------------------------------------------------
|
| These types reflect the supplied Laravel PaymentResource.
| They deliberately do not expect fields that the resource does not return,
| such as cash_receipt_number, bank account_number, or top-level service.
|
*/

type PaymentUserView = {
  id: string;
  name: string;
  role?: string | null;
};

type PaymentFileView = {
  id: string;
  original_name: string | null;
  mime_type: string | null;
  size: number | null;
  category: string | null;
  visibility: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type PaymentServiceView = {
  id: string;
  name: string;
  description: string | null;
  service_type: string | null;
  collection_mode: string | null;
  revenue_code: {
    id: string;
    code: string | null;
    name: string | null;
  } | null;
};

type PaymentScheduleView = {
  id: string;
  status: string | null;
};

type AssessmentServiceView = {
  id: string;
  assessment_id: string;
  service_id: string;
  status: string | null;
  computed_amount: number | null;
  paid_amount: number | null;
  remaining_amount: number | null;
  payment_status: string | null;
  assessment: {
    id: string;
    assessment_number: string | null;
    status: string | null;
    source_type: string | null;
  } | null;
};

type PaymentInvoiceItemView = {
  id: string;
  line_number: number;
  description: string | null;
  service_id: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  amount: number | null;
  discount_amount: number | null;
  penalty_amount: number | null;
  interest_amount: number | null;
  total_amount: number | null;
  currency: string | null;
  service: PaymentServiceView | null;
  assessment_service: AssessmentServiceView | null;
  payment_schedule: PaymentScheduleView | null;
};

type PaymentCitizenView = {
  id: string;
  citizen_uid?: string | null;
  name: string | null;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  national_id?: string | null;
};

type PaymentInvoiceView = {
  id: string;
  invoice_number: string;
  source_type?: string | null;
  status: string;
  currency?: string | null;
  subtotal?: number | null;
  discount_amount?: number | null;
  penalty_amount?: number | null;
  interest_amount?: number | null;
  total_amount: number | null;
  paid_amount: number | null;
  balance_due: number | null;
  issued_at?: string | null;
  due_date?: string | null;
  items?: PaymentInvoiceItemView[] | null;
  citizen?: PaymentCitizenView | null;
};

type CashDetailsView = {
  id: string;
  cash_received_at: string | null;
  cashier_session_id: string | null;
  received_by: string | null;
  received_by_user: PaymentUserView | null;
  notes: string | null;
};

type BankDetailsView = {
  id: string;
  bank_account_id: string | null;
  transfer_reference: string | null;
  transfer_date: string | null;
  sender_name: string | null;
  sender_account: string | null;
  verification_status: string | null;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  verified_by_user: PaymentUserView | null;
  bank_account: {
    id: string;
    bank_name: string | null;
    account_name: string | null;
    currency: string | null;
  } | null;
  files: PaymentFileView[] | null;
};

type OnlineDetailsView = {
  id: string;
  payment_provider_id: string | null;
  checkout_reference: string | null;
  provider_transaction_id: string | null;
  checkout_url: string | null;
  provider_status: string | null;
  callback_received_at: string | null;
  paid_at: string | null;
  payment_provider: {
    id: string;
    code: string | null;
    name: string | null;
  } | null;
};

type PaymentReceiptView = {
  id: string;
  receipt_number: string;
  issued_at: string | null;
  issued_by: string | null;
  issued_by_user: PaymentUserView | null;
};

type PaymentDetailView = Omit<
  PaymentDetailApi,
  | "invoice"
  | "citizen"
  | "cash_details"
  | "bank_transfer_details"
  | "online_details"
  | "receipt"
  | "files"
  | "service"
> & {
  provider_reference?: string | null;
  payment_provider: string | null;
  payer: {
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  invoice: PaymentInvoiceView | null;
  citizen: PaymentCitizenView | null;
  cash_details: CashDetailsView | null;
  bank_transfer_details: BankDetailsView | null;
  online_details: OnlineDetailsView | null;
  receipt: PaymentReceiptView | null;
  files: PaymentFileView[] | null;
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function getErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function formatCurrency(
  amount: number | string | null | undefined,
  currency = "ETB",
): string {
  if (amount == null || amount === "") return "—";

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) return "—";

  try {
    return `${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount)} ${currency || "ETB"}`;
  } catch {
    return `${numericAmount.toFixed(2)} ${currency || "ETB"}`;
  }
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-ET", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-ET", {
    dateStyle: "medium",
  }).format(date);
}

function getStatusLabel(status?: string | null): string {
  if (!status) return "Not available";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case "CASH":
      return "Cash";

    case "BANK_TRANSFER":
      return "Bank transfer";

    case "ONLINE":
      return "Online payment";

    case "OTHER":
      return "Other";

    default:
      return getStatusLabel(method);
  }
}

function getProviderLabel(provider?: string | null): string {
  switch (provider) {
    case "CBE":
      return "Commercial Bank of Ethiopia";

    case "TELEBIRR":
      return "Telebirr";

    case "CHAPA":
      return "Chapa";

    case "OTHER":
      return "Other provider";

    default:
      return provider ? getStatusLabel(provider) : "—";
  }
}

function getPaymentDate(payment: PaymentDetailView): string | null {
  switch (payment.payment_method) {
    case "CASH":
      return (
        payment.cash_details?.cash_received_at ??
        payment.created_at
      );

    case "BANK_TRANSFER":
      return (
        payment.bank_transfer_details?.transfer_date ??
        payment.created_at
      );

    case "ONLINE":
      return (
        payment.online_details?.paid_at ??
        payment.created_at
      );

    default:
      return payment.created_at;
  }
}

function getPaymentMethodDescription(
  payment: PaymentDetailView,
): string {
  switch (payment.payment_method) {
    case "CASH":
      return "Municipal office collection";

    case "BANK_TRANSFER":
      return (
        payment.bank_transfer_details?.bank_account?.bank_name ??
        "Bank transfer"
      );

    case "ONLINE":
      return (
        payment.online_details?.payment_provider?.name ??
        getProviderLabel(payment.payment_provider)
      );

    default:
      return getPaymentMethodLabel(payment.payment_method);
  }
}

function getPaymentStatusDescription(
  payment: PaymentDetailView,
): string {
  switch (payment.status) {
    case "PENDING":
      if (payment.payment_method === "CASH") {
        return "This cash payment is awaiting completion.";
      }

      if (payment.payment_method === "BANK_TRANSFER") {
        return "This bank transfer is awaiting verification.";
      }

      return "This payment is awaiting processing.";

    case "PROCESSING":
      return "The payment is being processed.";

    case "COMPLETED":
      return "Payment completed. Use the official receipt as confirmation.";

    case "FAILED":
      return payment.failure_reason || "The payment attempt failed.";

    case "CANCELLED":
      return "This payment has been cancelled.";

    case "EXPIRED":
      return "This payment attempt has expired.";

    default:
      return `Payment status: ${getStatusLabel(payment.status)}.`;
  }
}

function getPaymentDateLabel(payment: PaymentDetailView): string {
  switch (payment.payment_method) {
    case "CASH":
      return "Cash received";

    case "BANK_TRANSFER":
      return "Transfer date";

    case "ONLINE":
      return payment.online_details?.paid_at
        ? "Provider payment date"
        : "Payment initiated";

    default:
      return "Payment date";
  }
}

function getTaxpayerName(payment: PaymentDetailView): string {
  return (
    payment.citizen?.full_name ||
    payment.citizen?.name ||
    payment.invoice?.citizen?.full_name ||
    payment.invoice?.citizen?.name ||
    payment.payer?.name ||
    "Name not available"
  );
}

function getTaxpayerPhone(payment: PaymentDetailView): string {
  return (
    payment.payer?.phone ||
    payment.citizen?.phone ||
    payment.invoice?.citizen?.phone ||
    "—"
  );
}

function getTaxpayerEmail(payment: PaymentDetailView): string {
  return (
    payment.payer?.email ||
    payment.citizen?.email ||
    payment.invoice?.citizen?.email ||
    "—"
  );
}

function getInvoiceItems(
  payment: PaymentDetailView,
): PaymentInvoiceItemView[] {
  return payment.invoice?.items ?? [];
}

function getServiceSummary(payment: PaymentDetailView): string {
  const items = getInvoiceItems(payment);

  if (items.length === 0) return "Revenue payment";

  if (items.length === 1) {
    return (
      items[0].service?.name ||
      items[0].description ||
      "Revenue service"
    );
  }

  return `${items.length} billed services`;
}

function formatFileSize(size?: number | null): string | null {
  if (size == null || size <= 0) return null;

  if (size < 1024) return `${size} B`;

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeLabel(mimeType?: string | null): string {
  if (!mimeType) return "Document";

  if (mimeType === "application/pdf") return "PDF document";

  if (mimeType.startsWith("image/")) return "Image";

  return mimeType;
}

function getReceiptPath(paymentId: string): string {
  return `/office/dashboard/payments/${encodeURIComponent(paymentId)}/receipt`;
}

function getPrintReceiptPath(paymentId: string): string {
  return `${getReceiptPath(paymentId)}?print=1`;
}

function getMetadataNote(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  const notes = metadata?.notes;

  if (typeof notes !== "string") return null;

  return notes.trim() || null;
}

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

function PaymentStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="size-3.5" />
          Completed
        </Badge>
      );

    case "PENDING":
      return (
        <Badge className="gap-1.5 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          <Clock3 className="size-3.5" />
          Pending
        </Badge>
      );

    case "PROCESSING":
      return (
        <Badge className="gap-1.5 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
          <Loader2 className="size-3.5" />
          Processing
        </Badge>
      );

    case "FAILED":
      return (
        <Badge variant="destructive" className="gap-1.5">
          <XCircle className="size-3.5" />
          Failed
        </Badge>
      );

    case "CANCELLED":
    case "EXPIRED":
      return (
        <Badge variant="secondary" className="gap-1.5">
          {getStatusLabel(status)}
        </Badge>
      );

    default:
      return <Badge variant="outline">{getStatusLabel(status)}</Badge>;
  }
}

function PaymentMethodIcon({ method }: { method: string }) {
  switch (method) {
    case "CASH":
      return <Wallet className="size-4" />;

    case "BANK_TRANSFER":
      return <Building2 className="size-4" />;

    case "ONLINE":
      return <Smartphone className="size-4" />;

    default:
      return <CreditCard className="size-4" />;
  }
}

/*
|--------------------------------------------------------------------------
| DETAIL ROW
|--------------------------------------------------------------------------
*/

function DetailRow({
  label,
  value,
  icon,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-h-12 items-start justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        {icon && (
          <span className="shrink-0 text-muted-foreground/70">
            {icon}
          </span>
        )}
        <span>{label}</span>
      </div>

      <div
        className={`min-w-0 max-w-[60%] text-right text-sm font-medium text-foreground ${valueClassName ?? ""}`}
      >
        {value}
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SECTION HEADING
|--------------------------------------------------------------------------
*/

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
        {icon}
      </div>

      <div className="min-w-0">
        <h2 className="font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SERVICE BREAKDOWN
|--------------------------------------------------------------------------
*/

function ServiceBreakdown({
  payment,
}: {
  payment: PaymentDetailView;
}) {
  const items = getInvoiceItems(payment);
  const currency = payment.invoice?.currency || payment.currency || "ETB";

  return (
    <Card>
      <CardHeader className="pb-3">
        <SectionHeading
          icon={<ReceiptText className="size-4" />}
          title="Billed services"
          description="Services recorded on this invoice."
        />
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <FileText className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium">
              No invoice items available
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              The API did not return any billed service items for this invoice.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => {
              const serviceName =
                item.service?.name ||
                item.description ||
                `Service ${index + 1}`;

              const serviceCode = item.service?.revenue_code?.code;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                        <FileText className="size-4 text-muted-foreground" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-medium leading-5">
                          {serviceName}
                        </p>

                        {item.description &&
                          item.service?.name &&
                          item.description !== item.service.name && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          )}

                        <div className="mt-2 flex flex-wrap gap-2">
                          {serviceCode && (
                            <Badge variant="outline" className="font-mono text-xs">
                              Code {serviceCode}
                            </Badge>
                          )}

                          {item.service?.service_type && (
                            <Badge variant="secondary" className="text-xs">
                              {getStatusLabel(item.service.service_type)}
                            </Badge>
                          )}

                          {item.service?.collection_mode && (
                            <Badge variant="outline" className="text-xs">
                              {getStatusLabel(item.service.collection_mode)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 sm:text-right">
                      <p className="text-lg font-semibold tabular-nums">
                        {formatCurrency(
                          item.total_amount ?? item.amount,
                          item.currency || currency,
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Line {item.line_number}
                      </p>
                    </div>
                  </div>

                  {(item.quantity != null ||
                    item.unit ||
                    item.unit_price != null) && (
                    <>
                      <Separator className="my-3" />

                      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Quantity
                          </p>
                          <p className="mt-1 font-medium">
                            {item.quantity ?? "—"} {item.unit ?? ""}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Unit price
                          </p>
                          <p className="mt-1 font-medium">
                            {formatCurrency(item.unit_price, item.currency || currency)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Base amount
                          </p>
                          <p className="mt-1 font-medium">
                            {formatCurrency(item.amount, item.currency || currency)}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {(Number(item.discount_amount ?? 0) > 0 ||
                    Number(item.penalty_amount ?? 0) > 0 ||
                    Number(item.interest_amount ?? 0) > 0) && (
                    <>
                      <Separator className="my-3" />

                      <div className="space-y-1">
                        {Number(item.discount_amount ?? 0) > 0 && (
                          <DetailRow
                            label="Discount"
                            value={formatCurrency(item.discount_amount, item.currency || currency)}
                          />
                        )}

                        {Number(item.penalty_amount ?? 0) > 0 && (
                          <DetailRow
                            label="Penalty"
                            value={formatCurrency(item.penalty_amount, item.currency || currency)}
                          />
                        )}

                        {Number(item.interest_amount ?? 0) > 0 && (
                          <DetailRow
                            label="Interest"
                            value={formatCurrency(item.interest_amount, item.currency || currency)}
                          />
                        )}
                      </div>
                    </>
                  )}

                  {item.assessment_service && (
                    <div className="mt-3 rounded-lg bg-muted/30 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Assessment context
                      </p>

                      <div className="mt-2 space-y-1.5 text-sm">
                        {item.assessment_service.assessment?.assessment_number && (
                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">
                              Assessment
                            </span>
                            <span className="font-medium">
                              {item.assessment_service.assessment.assessment_number}
                            </span>
                          </div>
                        )}

                        {item.assessment_service.payment_status && (
                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">
                              Payment status
                            </span>
                            <span className="font-medium">
                              {getStatusLabel(
                                item.assessment_service.payment_status,
                              )}
                            </span>
                          </div>
                        )}

                        {item.assessment_service.remaining_amount != null && (
                          <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">
                              Service balance
                            </span>
                            <span className="font-medium tabular-nums">
                              {formatCurrency(
                                item.assessment_service.remaining_amount,
                                currency,
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {item.payment_schedule && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      <span>Payment schedule</span>
                      <span className="font-mono">
                        {item.payment_schedule.id}
                      </span>
                      {item.payment_schedule.status && (
                        <Badge variant="outline">
                          {getStatusLabel(item.payment_schedule.status)}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {payment.invoice && (
          <>
            <Separator className="my-5" />

            <div className="space-y-1">
              <DetailRow
                label="Subtotal"
                value={formatCurrency(
                  payment.invoice.subtotal,
                  currency,
                )}
              />

              {Number(payment.invoice.discount_amount ?? 0) > 0 && (
                <DetailRow
                  label="Discount"
                  value={formatCurrency(
                    payment.invoice.discount_amount,
                    currency,
                  )}
                />
              )}

              {Number(payment.invoice.penalty_amount ?? 0) > 0 && (
                <DetailRow
                  label="Penalty"
                  value={formatCurrency(
                    payment.invoice.penalty_amount,
                    currency,
                  )}
                />
              )}

              {Number(payment.invoice.interest_amount ?? 0) > 0 && (
                <DetailRow
                  label="Interest"
                  value={formatCurrency(
                    payment.invoice.interest_amount,
                    currency,
                  )}
                />
              )}

              <Separator className="my-2" />

              <DetailRow
                label="Invoice total"
                value={
                  <span className="text-base font-semibold">
                    {formatCurrency(payment.invoice.total_amount, currency)}
                  </span>
                }
              />

              <DetailRow
                label="Amount paid"
                value={formatCurrency(payment.invoice.paid_amount, currency)}
              />

              <DetailRow
                label="Outstanding balance"
                value={
                  <span
                    className={
                      Number(payment.invoice.balance_due ?? 0) > 0
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-emerald-700 dark:text-emerald-300"
                    }
                  >
                    {formatCurrency(payment.invoice.balance_due, currency)}
                  </span>
                }
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function PaymentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const paymentId =
    typeof params?.id === "string" ? params.id : "";

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = usePayment(paymentId, Boolean(paymentId));

  /*
   * The page's view type follows the current Laravel resource.
   * Update your shared payment types to remove this compatibility cast.
   */
  const payment = response?.data as
    | unknown as PaymentDetailView
    | undefined;

  const completeCashPayment = useCompleteCashPayment();
  const { openFile, isOpening } = useOpenFile();

  const isCompleting = completeCashPayment.isPending;

  const canCompleteCash =
    payment?.payment_method === "CASH" &&
    payment?.status === "PENDING";

  const isCompleted = payment?.status === "COMPLETED";

  if (!paymentId) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Card>
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <XCircle className="size-6 text-muted-foreground" />
            </div>
            <h2 className="font-semibold">Invalid payment ID</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              A valid payment identifier is required to open this page.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/office/dashboard/payments")}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to payments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading && !payment) {
    return (
      <div className="mx-auto flex min-h-[420px] max-w-6xl items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
          <p className="text-sm font-medium">Loading payment details</p>
          <p className="text-xs text-muted-foreground">
            Retrieving payment, invoice, and receipt information.
          </p>
        </div>
      </div>
    );
  }

  if (isError && !payment) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-5"
          onClick={() => router.push("/office/dashboard/payments")}
        >
          <ArrowLeft className="mr-2 size-4" />
          Payments
        </Button>

        <Card>
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="size-6 text-destructive" />
            </div>

            <div>
              <h2 className="font-semibold">Unable to load payment</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {getErrorMessage(error)}
              </p>
            </div>

            <Button variant="outline" onClick={() => void refetch()}>
              <RefreshCw className="mr-2 size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Card>
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-4 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <div>
              <h2 className="font-semibold">Payment not found</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The requested payment could not be found.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/office/dashboard/payments")}
            >
              Back to payments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const paymentDate = getPaymentDate(payment);
  const receiptPath = getReceiptPath(payment.id);
  const printReceiptPath = getPrintReceiptPath(payment.id);
  const currency = payment.currency || "ETB";

  const bankDetails =
    payment.payment_method === "BANK_TRANSFER"
      ? payment.bank_transfer_details
      : null;

  const onlineDetails =
    payment.payment_method === "ONLINE"
      ? payment.online_details
      : null;

  const cashDetails =
    payment.payment_method === "CASH"
      ? payment.cash_details
      : null;

  const evidenceFiles = bankDetails?.files ?? [];
  const metadataNote = getMetadataNote(payment.metadata);
  const serviceSummary = getServiceSummary(payment);

  async function handleCompletePayment() {
    if (
      !payment ||
      payment.payment_method !== "CASH" ||
      payment.status !== "PENDING"
    ) {
      toast.error("Only pending cash payments can be completed.");
      return;
    }

    try {
      await completeCashPayment.mutateAsync(payment.id);
      setCompleteDialogOpen(false);

      toast.success("Cash payment completed successfully.");
      await refetch();
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        {/* Breadcrumbs */}
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/office/dashboard"
            className="transition-colors hover:text-foreground"
          >
            Dashboard
          </Link>
          <ChevronRight className="size-3.5" />
          <Link
            href="/office/dashboard/payments"
            className="transition-colors hover:text-foreground"
          >
            Payments
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="font-medium text-foreground">
            Payment details
          </span>
        </div>

        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 mb-3"
              onClick={() => router.push("/office/dashboard/payments")}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to payments
            </Button>

            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="break-all text-2xl font-semibold tracking-tight sm:text-3xl">
                {payment.payment_number}
              </h1>
              <PaymentStatusBadge status={payment.status} />
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {serviceSummary}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Hash className="size-3.5" />
                Transaction:
                <span className="break-all font-mono text-foreground">
                  {payment.transaction_reference || "—"}
                </span>
              </span>

              {payment.invoice && (
                <span className="inline-flex items-center gap-1.5">
                  <ReceiptText className="size-3.5" />
                  Invoice:
                  <Link
                    href={`/office/dashboard/invoices/${encodeURIComponent(payment.invoice.id)}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {payment.invoice.invoice_number}
                  </Link>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button
              variant="outline"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`mr-2 size-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            {isCompleted && payment.receipt && (
              <>
                <Button variant="outline" asChild>
                  <Link href={receiptPath}>
                    <FileText className="mr-2 size-4" />
                    View receipt
                  </Link>
                </Button>

                <Button asChild>
                  <Link href={printReceiptPath}>
                    <Printer className="mr-2 size-4" />
                    Print receipt
                  </Link>
                </Button>
              </>
            )}

            {canCompleteCash && (
              <Button
                onClick={() => setCompleteDialogOpen(true)}
                disabled={isCompleting}
              >
                <CheckCircle2 className="mr-2 size-4" />
                Complete cash payment
              </Button>
            )}
          </div>
        </div>

        {/* Summary card */}
        <Card className="mb-6 overflow-hidden border-border/80 shadow-sm">
          <CardContent className="p-0">
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Payment amount
                </p>

                <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                  {formatCurrency(payment.amount, currency)}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex size-8 items-center justify-center rounded-lg border bg-background">
                    <PaymentMethodIcon method={payment.payment_method} />
                  </span>
                  <span className="font-medium text-foreground">
                    {getPaymentMethodLabel(payment.payment_method)}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span>{getPaymentMethodDescription(payment)}</span>
                </div>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4 lg:p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Payment status
                  </span>
                  <PaymentStatusBadge status={payment.status} />
                </div>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {getPaymentStatusDescription(payment)}
                </p>

                {payment.failure_reason && (
                  <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    {payment.failure_reason}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
              <div className="p-4 sm:px-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Invoice
                </p>

                {payment.invoice ? (
                  <Link
                    href={`/office/dashboard/invoices/${encodeURIComponent(payment.invoice.id)}`}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    {payment.invoice.invoice_number}
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                ) : (
                  <p className="mt-2 text-sm font-medium">No invoice linked</p>
                )}
              </div>

              <div className="p-4 sm:px-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {getPaymentDateLabel(payment)}
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {formatDateTime(paymentDate)}
                </p>
              </div>

              <div className="p-4 sm:px-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Taxpayer
                </p>
                <p className="mt-2 truncate text-sm font-semibold">
                  {getTaxpayerName(payment)}
                </p>
              </div>

              <div className="p-4 sm:px-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Official receipt
                </p>

                {isCompleted && payment.receipt ? (
                  <Link
                    href={receiptPath}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    {payment.receipt.receipt_number}
                    <ReceiptText className="size-3.5" />
                  </Link>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isCompleted
                      ? "Receipt not available"
                      : "Issued after completion"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main content */}
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.85fr)]">
          <div className="min-w-0 space-y-6">
            {/* Invoice and service details */}
            {payment.invoice && (
              <ServiceBreakdown payment={payment} />
            )}

            {/* Payment method details */}
            <Card>
              <CardHeader className="pb-3">
                <SectionHeading
                  icon={<CreditCard className="size-4" />}
                  title="Payment details"
                  description="References and information specific to this payment method."
                />
              </CardHeader>

              <CardContent>
                <DetailRow
                  label="Payment number"
                  value={
                    <span className="break-all font-mono text-xs">
                      {payment.payment_number}
                    </span>
                  }
                  icon={<Hash className="size-4" />}
                />

                <Separator />

                <DetailRow
                  label="Payment method"
                  value={getPaymentMethodLabel(payment.payment_method)}
                  icon={<PaymentMethodIcon method={payment.payment_method} />}
                />

                <Separator />

                <DetailRow
                  label="Payment provider"
                  value={getProviderLabel(payment.payment_provider)}
                  icon={<Smartphone className="size-4" />}
                />

                <Separator />

                <DetailRow
                  label="Payment source"
                  value={getStatusLabel(payment.payment_source)}
                />

                <Separator />

                <DetailRow
                  label="Transaction reference"
                  value={
                    <span className="break-all font-mono text-xs">
                      {payment.transaction_reference || "—"}
                    </span>
                  }
                />

                <Separator />

                <DetailRow
                  label="Provider reference"
                  value={
                    <span className="break-all font-mono text-xs">
                      {payment.provider_reference || "—"}
                    </span>
                  }
                />

                {bankDetails && (
                  <>
                    <Separator />
                    <div className="pb-2 pt-4">
                      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <Building2 className="size-4 text-muted-foreground" />
                        Bank transfer information
                      </p>

                      <DetailRow
                        label="Bank"
                        value={bankDetails.bank_account?.bank_name ?? "—"}
                      />

                      <Separator />

                      <DetailRow
                        label="Account name"
                        value={bankDetails.bank_account?.account_name ?? "—"}
                      />

                      <Separator />

                      <DetailRow
                        label="Account currency"
                        value={bankDetails.bank_account?.currency ?? currency}
                      />

                      <Separator />

                      <DetailRow
                        label="Transfer reference"
                        value={
                          <span className="break-all font-mono text-xs">
                            {bankDetails.transfer_reference || "—"}
                          </span>
                        }
                      />

                      <Separator />

                      <DetailRow
                        label="Transfer date"
                        value={formatDateTime(bankDetails.transfer_date)}
                      />

                      <Separator />

                      <DetailRow
                        label="Sender name"
                        value={bankDetails.sender_name || "—"}
                      />

                      {bankDetails.sender_account && (
                        <>
                          <Separator />
                          <DetailRow
                            label="Sender account"
                            value={
                              <span className="break-all font-mono text-xs">
                                {bankDetails.sender_account}
                              </span>
                            }
                          />
                        </>
                      )}

                      {bankDetails.verification_status && (
                        <>
                          <Separator />
                          <DetailRow
                            label="Transfer verification"
                            value={
                              <Badge
                                variant="outline"
                                className={
                                  ["VERIFIED", "POSTED"].includes(
                                    bankDetails.verification_status,
                                  )
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : bankDetails.verification_status === "REJECTED"
                                      ? "border-red-200 bg-red-50 text-red-700"
                                      : "border-amber-200 bg-amber-50 text-amber-700"
                                }
                              >
                                {getStatusLabel(
                                  bankDetails.verification_status,
                                )}
                              </Badge>
                            }
                          />
                        </>
                      )}

                      {bankDetails.notes && (
                        <>
                          <Separator />
                          <DetailRow
                            label="Transfer notes"
                            value={bankDetails.notes}
                          />
                        </>
                      )}
                    </div>
                  </>
                )}

                {onlineDetails && (
                  <>
                    <Separator />
                    <div className="pb-2 pt-4">
                      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <Smartphone className="size-4 text-muted-foreground" />
                        Online payment information
                      </p>

                      <DetailRow
                        label="Provider"
                        value={
                          onlineDetails.payment_provider?.name ??
                          getProviderLabel(payment.payment_provider)
                        }
                      />

                      <Separator />

                      <DetailRow
                        label="Checkout reference"
                        value={
                          <span className="break-all font-mono text-xs">
                            {onlineDetails.checkout_reference || "—"}
                          </span>
                        }
                      />

                      <Separator />

                      <DetailRow
                        label="Provider transaction ID"
                        value={
                          <span className="break-all font-mono text-xs">
                            {onlineDetails.provider_transaction_id || "—"}
                          </span>
                        }
                      />

                      <Separator />

                      <DetailRow
                        label="Provider status"
                        value={
                          onlineDetails.provider_status
                            ? getStatusLabel(onlineDetails.provider_status)
                            : "—"
                        }
                      />

                      <Separator />

                      <DetailRow
                        label="Callback received"
                        value={formatDateTime(onlineDetails.callback_received_at)}
                      />

                      <Separator />

                      <DetailRow
                        label="Provider paid at"
                        value={formatDateTime(onlineDetails.paid_at)}
                      />

                      {onlineDetails.checkout_url &&
                        ["PENDING", "PROCESSING"].includes(payment.status) && (
                          <>
                            <Separator />
                            <div className="pt-4">
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  const confirmed = window.confirm(
                                    "Open the payment provider checkout page?",
                                  );

                                  if (confirmed && onlineDetails.checkout_url) {
                                    window.open(
                                      onlineDetails.checkout_url,
                                      "_blank",
                                      "noopener,noreferrer",
                                    );
                                  }
                                }}
                              >
                                <ExternalLink className="mr-2 size-4" />
                                Open checkout page
                              </Button>

                              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                Only use the checkout link while this payment is
                                pending or processing. Confirm the payment status
                                from the server before taking further action.
                              </p>
                            </div>
                          </>
                        )}
                    </div>
                  </>
                )}

                {cashDetails && (
                  <>
                    <Separator />
                    <div className="pb-2 pt-4">
                      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <Banknote className="size-4 text-muted-foreground" />
                        Cash collection information
                      </p>

                      <DetailRow
                        label="Cash received at"
                        value={formatDateTime(cashDetails.cash_received_at)}
                      />

                      <Separator />

                      <DetailRow
                        label="Cashier session"
                        value={
                          <span className="break-all font-mono text-xs">
                            {cashDetails.cashier_session_id || "—"}
                          </span>
                        }
                      />

                      <Separator />

                      <DetailRow
                        label="Cash received by"
                        value={
                          cashDetails.received_by_user?.name ||
                          cashDetails.received_by ||
                          "—"
                        }
                      />

                      {cashDetails.notes && (
                        <>
                          <Separator />
                          <DetailRow
                            label="Cash notes"
                            value={cashDetails.notes}
                          />
                        </>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Bank transfer evidence */}
            {bankDetails && evidenceFiles.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <SectionHeading
                    icon={<FileCheck2 className="size-4" />}
                    title="Transfer evidence"
                    description="Documents attached to the bank transfer."
                  />
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {evidenceFiles.map((file) => {
                      const opening = isOpening(file.id);
                      const sizeLabel = formatFileSize(file.size);
                      const fileName =
                        file.original_name || "Transfer evidence";

                      return (
                        <div
                          key={file.id}
                          className="flex items-center justify-between gap-3 rounded-xl border p-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                              <FileText className="size-5 text-muted-foreground" />
                            </div>

                            <div className="min-w-0">
                              <p
                                className="truncate text-sm font-medium"
                                title={fileName}
                              >
                                {fileName}
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {getFileTypeLabel(file.mime_type)}
                                {sizeLabel ? ` · ${sizeLabel}` : ""}
                              </p>

                              {file.created_at && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Uploaded {formatDateTime(file.created_at)}
                                </p>
                              )}
                            </div>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={opening}
                            onClick={() => {
                              void openFile(file);
                            }}
                          >
                            {opening ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <ExternalLink className="size-4" />
                            )}
                            <span className="ml-2">
                              {opening ? "Opening" : "View"}
                            </span>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {metadataNote && (
              <Card>
                <CardHeader className="pb-3">
                  <SectionHeading
                    icon={<FileText className="size-4" />}
                    title="Payment notes"
                  />
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {metadataNote}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="min-w-0 space-y-6">
            {/* Taxpayer */}
            <Card>
              <CardHeader className="pb-3">
                <SectionHeading
                  icon={<UserRound className="size-4" />}
                  title="Taxpayer"
                  description="Payer information associated with this payment."
                />
              </CardHeader>

              <CardContent>
                <div className="rounded-xl border bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full border bg-background">
                      <UserRound className="size-5 text-muted-foreground" />
                    </div>

                    <div className="min-w-0">
                      <p className="break-words font-semibold">
                        {getTaxpayerName(payment)}
                      </p>

                      {payment.citizen?.citizen_uid && (
                        <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                          {payment.citizen.citizen_uid}
                        </p>
                      )}

                      {payment.citizen?.national_id && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          National ID: {payment.citizen.national_id}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-2">
                  <DetailRow
                    label="Phone"
                    value={getTaxpayerPhone(payment)}
                  />

                  <Separator />

                  <DetailRow
                    label="Email"
                    value={
                      <span className="break-all">
                        {getTaxpayerEmail(payment)}
                      </span>
                    }
                  />

                  <Separator />

                  <DetailRow
                    label="Citizen ID"
                    value={
                      <span className="break-all font-mono text-xs">
                        {payment.citizen_id || "—"}
                      </span>
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Invoice summary */}
            {payment.invoice && (
              <Card>
                <CardHeader className="pb-3">
                  <SectionHeading
                    icon={<ReceiptText className="size-4" />}
                    title="Invoice summary"
                    description="Financial status of the linked invoice."
                  />
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      Invoice status
                    </span>
                    <Badge
                      variant={
                        payment.invoice.status === "PAID"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {getStatusLabel(payment.invoice.status)}
                    </Badge>
                  </div>

                  <Separator className="my-3" />

                  <DetailRow
                    label="Invoice total"
                    value={formatCurrency(
                      payment.invoice.total_amount,
                      payment.invoice.currency || currency,
                    )}
                  />

                  <Separator />

                  <DetailRow
                    label="Amount paid"
                    value={formatCurrency(
                      payment.invoice.paid_amount,
                      payment.invoice.currency || currency,
                    )}
                  />

                  <Separator />

                  <DetailRow
                    label="Balance due"
                    value={
                      <span
                        className={
                          Number(payment.invoice.balance_due ?? 0) > 0
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-emerald-700 dark:text-emerald-300"
                        }
                      >
                        {formatCurrency(
                          payment.invoice.balance_due,
                          payment.invoice.currency || currency,
                        )}
                      </span>
                    }
                  />

                  <Separator />

                  <DetailRow
                    label="Issued date"
                    value={formatDate(payment.invoice.issued_at)}
                  />

                  <Separator />

                  <DetailRow
                    label="Due date"
                    value={formatDate(payment.invoice.due_date)}
                  />

                  <Button
                    asChild
                    variant="outline"
                    className="mt-4 w-full"
                  >
                    <Link
                      href={`/office/dashboard/invoices/${encodeURIComponent(payment.invoice.id)}`}
                    >
                      View invoice
                      <ArrowUpRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Processing and verification */}
            <Card>
              <CardHeader className="pb-3">
                <SectionHeading
                  icon={<ShieldCheck className="size-4" />}
                  title="Processing & verification"
                  description="Recorded payment handling and audit details."
                />
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                      <UserRound className="size-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        Processed by
                      </p>
                      <p className="mt-1 break-words text-sm font-medium">
                        {payment.processed_by_user?.name ||
                          payment.processed_by ||
                          "Not recorded"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                      <ShieldCheck className="size-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        Payment verifier
                      </p>
                      <p className="mt-1 break-words text-sm font-medium">
                        {payment.verified_by_user?.name ||
                          payment.verified_by ||
                          "No staff verifier recorded"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {payment.verified_at
                          ? `Recorded ${formatDateTime(payment.verified_at)}`
                          : "No staff verification timestamp"}
                      </p>
                    </div>
                  </div>

                  {bankDetails && (
                    <>
                      <Separator />

                      <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                          <Building2 className="size-4 text-muted-foreground" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">
                            Bank transfer verifier
                          </p>

                          <p className="mt-1 break-words text-sm font-medium">
                            {bankDetails.verified_by_user?.name ||
                              bankDetails.verified_by ||
                              "No bank verifier recorded"}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {bankDetails.verified_at
                              ? `Recorded ${formatDateTime(bankDetails.verified_at)}`
                              : "No bank verification timestamp"}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                      <CalendarDays className="size-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        Payment created
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {formatDateTime(payment.created_at)}
                      </p>
                    </div>
                  </div>

                  {onlineDetails?.callback_received_at && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                          <RefreshCw className="size-4 text-muted-foreground" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">
                            Provider callback received
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {formatDateTime(onlineDetails.callback_received_at)}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                      <Clock3 className="size-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        Last updated
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {formatDateTime(payment.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Receipt */}
            <Card>
              <CardHeader className="pb-3">
                <SectionHeading
                  icon={<ReceiptText className="size-4" />}
                  title="Official receipt"
                  description="Receipt issued for this payment."
                />
              </CardHeader>

              <CardContent>
                {isCompleted && payment.receipt ? (
                  <>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background">
                          <CheckCircle2 className="size-5 text-emerald-600" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                            Receipt issued
                          </p>
                          <p className="mt-1 break-all font-mono text-sm font-semibold">
                            {payment.receipt.receipt_number}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatDateTime(payment.receipt.issued_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {payment.receipt.issued_by_user && (
                      <div className="mt-3">
                        <DetailRow
                          label="Issued by"
                          value={payment.receipt.issued_by_user.name}
                        />
                      </div>
                    )}

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <Button variant="outline" asChild>
                        <Link href={receiptPath}>
                          <FileText className="mr-2 size-4" />
                          View receipt
                        </Link>
                      </Button>

                      <Button asChild>
                        <Link href={printReceiptPath}>
                          <Printer className="mr-2 size-4" />
                          Print receipt
                        </Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed p-5 text-center">
                    <ReceiptText className="mx-auto size-8 text-muted-foreground/60" />

                    <p className="mt-3 text-sm font-medium">
                      Receipt not available
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {isCompleted
                        ? "This completed payment does not currently have a receipt linked in the API response."
                        : "An official receipt will be available after the payment is completed and a receipt is issued."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* Audit footer */}
        <div className="mt-8 border-t pt-5">
          <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <Hash className="size-3.5 shrink-0" />
              <span className="shrink-0">Payment ID</span>
              <span className="break-all font-mono text-foreground/80">
                {payment.id}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span>Created {formatDateTime(payment.created_at)}</span>
              <span>Updated {formatDateTime(payment.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Complete cash payment confirmation */}
      <Dialog
        open={completeDialogOpen}
        onOpenChange={(open) => {
          if (!isCompleting) {
            setCompleteDialogOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete cash payment</DialogTitle>
            <DialogDescription>
              Review the payment information before confirming cash collection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Payment number
                  </p>
                  <p className="mt-1 break-all font-mono text-sm font-semibold">
                    {payment.payment_number}
                  </p>
                </div>

                <PaymentStatusBadge status={payment.status} />
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Amount received
                </span>
                <span className="text-xl font-semibold tabular-nums">
                  {formatCurrency(payment.amount, currency)}
                </span>
              </div>

              <div className="mt-4 flex items-start justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Invoice
                </span>
                <span className="text-right text-sm font-medium">
                  {payment.invoice?.invoice_number || "No linked invoice"}
                </span>
              </div>

              <div className="mt-3 flex items-start justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Taxpayer
                </span>
                <span className="max-w-[60%] text-right text-sm font-medium">
                  {getTaxpayerName(payment)}
                </span>
              </div>

              {cashDetails?.received_by_user && (
                <div className="mt-3 flex items-start justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    Recorded receiver
                  </span>
                  <span className="text-right text-sm font-medium">
                    {cashDetails.received_by_user.name}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <p className="leading-5">
                Confirm only after the cash has actually been received.
                The backend should validate the current payment status and
                atomically update the invoice balance and receipt records.
              </p>
            </div>

            {completeCashPayment.isError && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {getErrorMessage(completeCashPayment.error)}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isCompleting}
              onClick={() => setCompleteDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={isCompleting || !canCompleteCash}
              onClick={() => void handleCompletePayment()}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  Confirm cash received
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}