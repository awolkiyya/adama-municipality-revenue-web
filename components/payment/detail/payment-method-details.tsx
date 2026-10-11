
import {
    Banknote,
    Building2,
    CalendarDays,
    CheckCircle2,
    Copy,
    CreditCard,
    ExternalLink,
    Landmark,
    Smartphone,
    UserRound,
  } from "lucide-react";
  import { useState } from "react";
  import type { LucideIcon } from "lucide-react";
  
  import { Badge } from "@/components/ui/badge";
  import { Button } from "@/components/ui/button";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Separator } from "@/components/ui/separator";
  
  export type PaymentMethod =
    | "CASH"
    | "BANK_TRANSFER"
    | "ONLINE"
    | "OTHER";
  
  export type TransferVerificationStatus =
    | "PENDING_VERIFICATION"
    | "VERIFIED"
    | "POSTED"
    | "REJECTED"
    | "PENDING";
  
  export type PaymentMethodDetailsData = {
    method: PaymentMethod;
    provider?: string | null;
    transactionReference?: string | null;
    providerReference?: string | null;
    createdAt?: string | null;
    completedAt?: string | null;
  
    bankTransfer?: {
      bankName?: string | null;
      bankAccountName?: string | null;
      maskedAccountNumber?: string | null;
      transferReference?: string | null;
      transferDate?: string | null;
      senderName?: string | null;
      senderAccount?: string | null;
      verificationStatus?: TransferVerificationStatus | null;
      verifiedAt?: string | null;
    } | null;
  
    onlinePayment?: {
      provider?: string | null;
      providerReference?: string | null;
    } | null;
  
    cashPayment?: {
      receivedBy?: string | null;
      receiptNumber?: string | null;
    } | null;
  };
  
  type PaymentMethodDetailsProps = {
    payment: PaymentMethodDetailsData;
    title?: string;
    description?: string;
    showSensitiveDetails?: boolean;
    className?: string;
  };
  
  type DetailRowProps = {
    label: string;
    value?: string | null;
    icon?: LucideIcon;
    copyable?: boolean;
  };
  
  function formatDate(value?: string | null): string | null {
    if (!value) return null;
  
    const date = new Date(value);
  
    if (Number.isNaN(date.getTime())) return null;
  
    return new Intl.DateTimeFormat("en-ET", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      timeZone: "Africa/Addis_Ababa",
    }).format(date);
  }
  
  function getMethodConfig(method: PaymentMethod): {
    label: string;
    icon: LucideIcon;
  } {
    switch (method) {
      case "CASH":
        return { label: "Cash", icon: Banknote };
  
      case "BANK_TRANSFER":
        return { label: "Bank transfer", icon: Landmark };
  
      case "ONLINE":
        return { label: "Online payment", icon: Smartphone };
  
      default:
        return { label: "Other payment method", icon: CreditCard };
    }
  }
  
  function getVerificationConfig(status?: TransferVerificationStatus | null) {
    switch (status) {
      case "VERIFIED":
        return {
          label: "Verified",
          className: "border-emerald-200 bg-emerald-50 text-emerald-800",
        };
  
      case "POSTED":
        return {
          label: "Posted",
          className: "border-blue-200 bg-blue-50 text-blue-800",
        };
  
      case "REJECTED":
        return {
          label: "Rejected",
          className: "border-red-200 bg-red-50 text-red-800",
        };
  
      case "PENDING_VERIFICATION":
      case "PENDING":
        return {
          label: "Pending verification",
          className: "border-amber-200 bg-amber-50 text-amber-800",
        };
  
      default:
        return null;
    }
  }
  
  function DetailRow({
    label,
    value,
    icon: Icon,
    copyable = false,
  }: DetailRowProps) {
    const [copied, setCopied] = useState(false);
  
    if (!value) return null;
  
    async function handleCopy() {
      try {
        await navigator.clipboard.writeText(value!);
        setCopied(true);
  
        window.setTimeout(() => setCopied(false), 1500);
      } catch {
        setCopied(false);
      }
    }
  
    return (
      <div className="flex items-start gap-3 py-3">
        {Icon ? (
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/70">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        ) : null}
  
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 break-all text-sm font-medium">{value}</p>
        </div>
  
        {copyable ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label={`Copy ${label}`}
            onClick={handleCopy}
          >
            {copied ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        ) : null}
      </div>
    );
  }
  
  export function PaymentMethodDetails({
    payment,
    title = "Payment method",
    description = "Method and transaction information recorded by the revenue system.",
    showSensitiveDetails = false,
    className,
  }: PaymentMethodDetailsProps) {
    const methodConfig = getMethodConfig(payment.method);
    const MethodIcon = methodConfig.icon;
  
    const bankTransfer = payment.bankTransfer;
    const onlinePayment = payment.onlinePayment;
    const cashPayment = payment.cashPayment;
  
    const verification = getVerificationConfig(
      bankTransfer?.verificationStatus,
    );
  
    const provider =
      payment.provider ||
      onlinePayment?.provider ||
      null;
  
    const providerReference =
      payment.providerReference ||
      onlinePayment?.providerReference ||
      null;
  
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MethodIcon className="size-5 text-primary" />
            {title}
          </CardTitle>
  
          <CardDescription>{description}</CardDescription>
        </CardHeader>
  
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-background">
                <MethodIcon className="size-5 text-primary" />
              </div>
  
              <div>
                <p className="text-xs text-muted-foreground">Method</p>
                <p className="mt-1 text-sm font-semibold">
                  {methodConfig.label}
                </p>
              </div>
            </div>
  
            {verification ? (
              <Badge
                variant="outline"
                className={verification.className}
              >
                {verification.label}
              </Badge>
            ) : null}
          </div>
  
          <div className="mt-3 divide-y">
            <DetailRow
              label="Payment provider"
              value={provider}
              icon={Building2}
            />
  
            <DetailRow
              label="Transaction reference"
              value={payment.transactionReference}
              icon={CreditCard}
              copyable
            />
  
            <DetailRow
              label="Provider reference"
              value={providerReference}
              icon={ExternalLink}
              copyable
            />
  
            <DetailRow
              label="Payment initiated"
              value={formatDate(payment.createdAt)}
              icon={CalendarDays}
            />
  
            <DetailRow
              label="Payment completed"
              value={formatDate(payment.completedAt)}
              icon={CheckCircle2}
            />
          </div>
  
          {payment.method === "BANK_TRANSFER" && bankTransfer ? (
            <>
              <Separator className="my-4" />
  
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Landmark className="size-4 text-primary" />
                  Bank transfer details
                </h3>
  
                <div className="mt-2 divide-y">
                  <DetailRow
                    label="Receiving bank"
                    value={bankTransfer.bankName}
                    icon={Building2}
                  />
  
                  <DetailRow
                    label="Receiving account name"
                    value={bankTransfer.bankAccountName}
                    icon={UserRound}
                  />
  
                  <DetailRow
                    label="Receiving account number"
                    value={bankTransfer.maskedAccountNumber}
                    icon={Landmark}
                    copyable={false}
                  />
  
                  <DetailRow
                    label="Transfer reference"
                    value={bankTransfer.transferReference}
                    icon={CreditCard}
                    copyable
                  />
  
                  <DetailRow
                    label="Transfer date"
                    value={formatDate(bankTransfer.transferDate)}
                    icon={CalendarDays}
                  />
  
                  <DetailRow
                    label="Sender name"
                    value={bankTransfer.senderName}
                    icon={UserRound}
                  />
  
                  {showSensitiveDetails ? (
                    <DetailRow
                      label="Sender account"
                      value={bankTransfer.senderAccount}
                      icon={Landmark}
                    />
                  ) : null}
  
                  <DetailRow
                    label="Verified at"
                    value={formatDate(bankTransfer.verifiedAt)}
                    icon={CheckCircle2}
                  />
                </div>
              </div>
            </>
          ) : null}
  
          {payment.method === "CASH" && cashPayment ? (
            <>
              <Separator className="my-4" />
  
              <div>
                <h3 className="text-sm font-semibold">Cash collection details</h3>
  
                <div className="mt-2 divide-y">
                  <DetailRow
                    label="Received by"
                    value={cashPayment.receivedBy}
                    icon={UserRound}
                  />
  
                  <DetailRow
                    label="Receipt number"
                    value={cashPayment.receiptNumber}
                    icon={CreditCard}
                    copyable
                  />
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    );
  }
  
  export default PaymentMethodDetails;