"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  ExternalLink,
  FileText,
  Loader2,
  ReceiptText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Fields, Panel, Empty } from "./ui";
import { PaymentView } from "./payment/detail";
import {
  fileMeta,
  initials,
  label,
  money,
  providerName,
} from "@/utils/helpers";
import { formatEthiopianDate } from "@/lib/utils";
import type { FileView, InvoiceView } from "@/types/payment/ui";

/**
 * Format a date using the Ethiopian calendar.
 * Missing or invalid dates should not crash the payment detail page.
 */
export const ethDate = (value?: string | Date | null) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return formatEthiopianDate(date.toISOString());
};

/**
 * Safely format optional dates used by payment and invoice details.
 */
const safeDate = (value?: string | Date | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return formatEthiopianDate(date.toISOString());
};

/**
 * Payment overview.
 *
 * showTaxpayer:
 * - true: display taxpayer information and the official receipt.
 * - false: display only the official receipt.
 *
 * This is useful when the office and agent portals have different
 * permissions for viewing taxpayer details.
 */
export function OverviewTab({
  p,
  showTaxpayer = true,
}: {
  p: PaymentView;
  showTaxpayer?: boolean;
}) {
  const citizen = p.citizen ?? p.invoice?.citizen;

  const taxpayerName =
    citizen?.full_name ||
    citizen?.name ||
    p.payer?.name ||
    "Name not available";

  const hasReceipt = p.status === "COMPLETED" && Boolean(p.receipt);

  return (
    <div
      className={`grid items-start gap-4 ${
        showTaxpayer ? "md:grid-cols-2" : "grid-cols-1"
      }`}
    >
      {showTaxpayer && (
        <Panel title="Taxpayer">
          <div className="mb-2 flex items-center gap-3 pt-1">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initials(taxpayerName)}
            </span>

            <div className="min-w-0">
              <p className="truncate font-semibold">{taxpayerName}</p>

              {citizen?.citizen_uid && (
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {citizen.citizen_uid}
                </p>
              )}
            </div>
          </div>

          <Fields
            rows={[
              {
                label: "Phone",
                value: p.payer?.phone || citizen?.phone,
              },
              {
                label: "Email",
                value: p.payer?.email || citizen?.email,
              },
              {
                label: "National ID",
                value: citizen?.national_id,
              },
            ]}
          />
        </Panel>
      )}

      <Panel title="Official receipt">
        {hasReceipt ? (
          <>
            <div className="mb-2 mt-1 rounded-lg border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">
                Receipt number
              </p>

              <p className="mt-1 break-all font-mono text-base font-semibold">
                {p.receipt?.receipt_number || "—"}
              </p>
            </div>

            <Fields
              rows={[
                {
                  label: "Issued",
                  value: safeDate(p.receipt?.issued_at),
                },
                {
                  label: "Issued by",
                  value:
                    p.receipt?.issued_by_user?.name ??
                    p.receipt?.issued_by ??
                    "—",
                },
              ]}
            />
          </>
        ) : (
          <Empty icon={<ReceiptText className="size-7" />}>
            {p.status === "COMPLETED"
              ? "No receipt is linked to this completed payment."
              : "A receipt is issued once the payment is completed."}
          </Empty>
        )}
      </Panel>
    </div>
  );
}

/**
 * Invoice line items and financial summary.
 */
export function InvoiceTab({
  invoice,
  href,
}: {
  invoice: InvoiceView;
  href?: string;
}) {
  const items = invoice.items ?? [];
  const currency = invoice.currency || "ETB";
  const balance = Number(invoice.balance_due ?? 0);

  const hasAmount = (value?: number | string | null) =>
    Number(value ?? 0) > 0;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Card className="shadow-none">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-sm font-semibold">
            Billed services
            <span className="ml-2 font-normal text-muted-foreground">
              {items.length}
            </span>
          </CardTitle>

          {href ? (
            <Button
              variant="ghost"
              size="sm"
              className="-mr-2"
              asChild
            >
              <Link href={href}>
                {invoice.invoice_number}
                <ArrowUpRight className="ml-1.5 size-3.5" />
              </Link>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              {invoice.invoice_number || "—"}
            </span>
          )}
        </CardHeader>

        <CardContent>
          {items.length === 0 ? (
            <Empty icon={<FileText className="size-7" />}>
              No billed items on this invoice.
            </Empty>
          ) : (
            <ul className="divide-y">
              {items.map((item) => {
                const itemName =
                  item.service?.name ||
                  item.description ||
                  `Line ${item.line_number}`;

                const itemCurrency = item.currency || currency;

                const metadata = [
                  item.service?.revenue_code?.code
                    ? `Code ${item.service.revenue_code.code}`
                    : null,

                  item.assessment_service?.assessment?.assessment_number
                    ? `Assessment ${item.assessment_service.assessment.assessment_number}`
                    : null,

                  item.description && item.description !== itemName
                    ? item.description
                    : null,
                ].filter(Boolean);

                const quantity =
                  item.quantity != null
                    ? `${item.quantity}${
                        item.unit ? ` ${item.unit}` : ""
                      } × ${money(item.unit_price, itemCurrency) ?? "—"}`
                    : null;

                const adjustments = [
                  hasAmount(item.penalty_amount)
                    ? {
                        text: `Penalty +${money(
                          item.penalty_amount,
                          itemCurrency,
                        )}`,
                        className:
                          "text-amber-700 dark:text-amber-400",
                      }
                    : null,

                  hasAmount(item.interest_amount)
                    ? {
                        text: `Interest +${money(
                          item.interest_amount,
                          itemCurrency,
                        )}`,
                        className:
                          "text-amber-700 dark:text-amber-400",
                      }
                    : null,

                  hasAmount(item.discount_amount)
                    ? {
                        text: `Discount −${money(
                          item.discount_amount,
                          itemCurrency,
                        )}`,
                        className:
                          "text-emerald-700 dark:text-emerald-400",
                      }
                    : null,
                ].filter(
                  (
                    adjustment,
                  ): adjustment is {
                    text: string;
                    className: string;
                  } => adjustment !== null,
                );

                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 py-3.5"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                      {item.line_number}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-5">
                        {itemName}
                      </p>

                      {metadata.length > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {metadata.join(" · ")}
                        </p>
                      )}

                      {adjustments.length > 0 && (
                        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                          {adjustments.map((adjustment) => (
                            <span
                              key={adjustment.text}
                              className={adjustment.className}
                            >
                              {adjustment.text}
                            </span>
                          ))}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {money(
                          item.total_amount ?? item.amount,
                          itemCurrency,
                        ) ?? "—"}
                      </p>

                      {quantity && (
                        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                          {quantity}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Panel title="Invoice totals">
        <Fields
          rows={[
            {
              label: "Status",
              value: label(invoice.status),
            },
            {
              label: "Due",
              value: safeDate(invoice.due_date),
            },
            {
              label: "Subtotal",
              value: money(invoice.subtotal, currency),
            },
            ...(hasAmount(invoice.penalty_amount)
              ? [
                  {
                    label: "Penalty",
                    value: money(invoice.penalty_amount, currency),
                  },
                ]
              : []),
            ...(hasAmount(invoice.interest_amount)
              ? [
                  {
                    label: "Interest",
                    value: money(invoice.interest_amount, currency),
                  },
                ]
              : []),
            ...(hasAmount(invoice.discount_amount)
              ? [
                  {
                    label: "Discount",
                    value: `−${money(
                      invoice.discount_amount,
                      currency,
                    )}`,
                  },
                ]
              : []),
            {
              label: "Total",
              value: (
                <span className="text-base font-semibold tabular-nums">
                  {money(invoice.total_amount, currency)}
                </span>
              ),
            },
            {
              label: "Paid",
              value: money(invoice.paid_amount, currency),
            },
            ...(invoice.balance_due != null
              ? [
                  {
                    label: "Balance due",
                    value: (
                      <span
                        className={`font-semibold tabular-nums ${
                          balance > 0
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {money(invoice.balance_due, currency)}
                      </span>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Panel>
    </div>
  );
}

/**
 * Payment method details and transfer evidence.
 */
export function PaymentTab({
  p,
  openFile,
  isOpening,
}: {
  p: PaymentView;
  openFile?: (file: FileView) => Promise<unknown> | void;
  isOpening?: (id: string) => boolean;
}) {
  const bank =
    p.payment_method === "BANK_TRANSFER"
      ? p.bank_transfer_details
      : null;

  const online =
    p.payment_method === "ONLINE" ? p.online_details : null;

  const cash = p.payment_method === "CASH" ? p.cash_details : null;

  const files = bank?.files ?? [];

  const note =
    typeof p.metadata?.notes === "string"
      ? p.metadata.notes.trim()
      : "";

  const canOpenCheckout =
    Boolean(online?.checkout_url) &&
    ["PENDING", "PROCESSING"].includes(p.status);

  const openCheckout = () => {
    if (!online?.checkout_url) return;

    const confirmed = window.confirm(
      "Open the payment provider checkout page?",
    );

    if (!confirmed) return;

    window.open(
      online.checkout_url,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Panel title="References">
        <Fields
          rows={[
            {
              label: "Payment number",
              value: p.payment_number,
              mono: true,
            },
            {
              label: "Transaction",
              value: p.transaction_reference,
              mono: true,
            },
            {
              label: "Provider reference",
              value: p.provider_reference,
              mono: true,
            },
            {
              label: "Source",
              value: label(p.payment_source),
            },
            {
              label: "Provider",
              value: providerName(p.payment_provider),
            },
          ]}
        />
      </Panel>

      {bank && (
        <Panel title="Bank transfer">
          <Fields
            rows={[
              {
                label: "Bank",
                value: bank.bank_account?.bank_name,
              },
              {
                label: "Account name",
                value: bank.bank_account?.account_name,
              },
              {
                label: "Reference",
                value: bank.transfer_reference,
                mono: true,
              },
              {
                label: "Transfer date",
                value: safeDate(bank.transfer_date),
              },
              {
                label: "Sender",
                value: bank.sender_name,
              },
              {
                label: "Sender account",
                value: bank.sender_account,
                mono: true,
              },
              {
                label: "Verification",
                value: bank.verification_status ? (
                  <Badge variant="outline">
                    {label(bank.verification_status)}
                  </Badge>
                ) : null,
              },
              {
                label: "Notes",
                value: bank.notes,
              },
            ]}
          />
        </Panel>
      )}

      {online && (
        <Panel title="Online payment">
          <Fields
            rows={[
              {
                label: "Checkout reference",
                value: online.checkout_reference,
                mono: true,
              },
              {
                label: "Provider transaction",
                value: online.provider_transaction_id,
                mono: true,
              },
              {
                label: "Provider status",
                value: label(online.provider_status),
              },
              {
                label: "Paid at",
                value: safeDate(online.paid_at),
              },
            ]}
          />

          {canOpenCheckout && (
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={openCheckout}
            >
              <ExternalLink className="mr-2 size-4" />
              Open checkout page
            </Button>
          )}
        </Panel>
      )}

      {cash && (
        <Panel title="Cash collection">
          <Fields
            rows={[
              {
                label: "Received",
                value: safeDate(cash.cash_received_at),
              },
              {
                label: "Received by",
                value:
                  cash.received_by_user?.name ??
                  cash.received_by,
              },
              {
                label: "Cashier session",
                value: cash.cashier_session_id,
                mono: true,
              },
              {
                label: "Notes",
                value: cash.notes,
              },
            ]}
          />
        </Panel>
      )}

      {files.length > 0 && (
        <Panel title="Transfer evidence">
          <ul className="space-y-2 pt-2">
            {files.map((file) => {
              const opening = Boolean(isOpening?.(file.id));

              return (
                <li
                  key={file.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <FileText className="size-4" />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {file.original_name || "Transfer evidence"}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {fileMeta(file)}
                      </p>
                    </div>
                  </div>

                  {openFile && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={opening}
                      onClick={() => {
                        void openFile(file);
                      }}
                    >
                      {opening ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <ExternalLink className="mr-2 size-4" />
                      )}
                      View
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      {note && (
        <Panel title="Notes">
          <p className="whitespace-pre-wrap pt-2 text-sm leading-6 text-muted-foreground">
            {note}
          </p>
        </Panel>
      )}
    </div>
  );
}

/**
 * Payment activity timeline.
 */
export function ActivityTab({ p }: { p: PaymentView }) {
  type Event = {
    title: string;
    at?: string | Date | null;
    by?: string | null;
  };

  const events: Event[] = [
    {
      title: "Payment created",
      at: p.created_at,
      by: p.processed_by_user?.name ?? p.processed_by,
    },
    {
      title: "Cash received",
      at: p.cash_details?.cash_received_at,
      by: p.cash_details?.received_by_user?.name ??
        p.cash_details?.received_by,
    },
    {
      title: "Provider callback received",
      at: p.online_details?.callback_received_at,
    },
    {
      title: "Transfer verified",
      at: p.bank_transfer_details?.verified_at,
      by:
        p.bank_transfer_details?.verified_by_user?.name ??
        p.bank_transfer_details?.verified_by,
    },
    {
      title: "Payment verified",
      at: p.verified_at,
      by: p.verified_by_user?.name ?? p.verified_by,
    },
    {
      title: "Receipt issued",
      at: p.receipt?.issued_at,
      by:
        p.receipt?.issued_by_user?.name ??
        p.receipt?.issued_by,
    },
  ]
    .filter((event) => {
      if (!event.at) return false;

      return !Number.isNaN(new Date(event.at).getTime());
    })
    .sort(
      (a, b) =>
        new Date(a.at!).getTime() - new Date(b.at!).getTime(),
    );

  return (
    <Panel title="Activity">
      {events.length === 0 ? (
        <Empty icon={<ReceiptText className="size-7" />}>
          No payment activity is available.
        </Empty>
      ) : (
        <ol className="relative mt-3 space-y-6 border-l pl-6">
          {events.map((event, index) => {
            const latest = index === events.length - 1;

            return (
              <li
                key={`${event.title}-${String(event.at)}`}
                className="relative"
              >
                <span
                  aria-hidden="true"
                  className={`absolute -left-[29px] top-1 size-2.5 rounded-full ring-4 ring-card ${
                    latest
                      ? "bg-primary"
                      : "bg-muted-foreground/40"
                  }`}
                />

                <p className="text-sm font-medium">
                  {event.title}
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {safeDate(event.at)}
                  {event.by ? ` · ${event.by}` : ""}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
