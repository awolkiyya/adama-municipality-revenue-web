
import {
    Ban,
    CheckCircle2,
    Clock3,
    Info,
    LoaderCircle,
    TimerOff,
    XCircle,
    type LucideIcon,
  } from "lucide-react";
  
  import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PaymentStatusBadge, { PaymentStatus } from "./payment-status-badge";
  
  type PaymentStatusBannerProps = {
    status: PaymentStatus;
    paymentNumber?: string;
    message?: string;
    failureReason?: string | null;
    actions?: React.ReactNode;
    className?: string;
  };
  
  type BannerConfig = {
    title: string;
    description: string;
    icon: LucideIcon;
    containerClassName: string;
    iconClassName: string;
  };
  
  const BANNER_CONFIG: Record<PaymentStatus, BannerConfig> = {
    PENDING: {
      title: "Payment pending",
      description:
        "Your payment request has been created. Confirmation is still pending. Check the status before attempting another payment.",
      icon: Clock3,
      containerClassName: "border-amber-200 bg-amber-50/70",
      iconClassName: "text-amber-600",
    },
  
    PROCESSING: {
      title: "Payment processing",
      description:
        "Your transaction is being processed. Wait for confirmation before starting another payment for the same invoice.",
      icon: LoaderCircle,
      containerClassName: "border-blue-200 bg-blue-50/70",
      iconClassName: "text-blue-600",
    },
  
    COMPLETED: {
      title: "Payment completed",
      description:
        "The payment has been confirmed by the revenue system. You can review the transaction details and access an available receipt.",
      icon: CheckCircle2,
      containerClassName: "border-emerald-200 bg-emerald-50/70",
      iconClassName: "text-emerald-600",
    },
  
    FAILED: {
      title: "Payment failed",
      description:
        "The transaction was not completed. Review the details and check the outstanding invoice balance before trying again.",
      icon: XCircle,
      containerClassName: "border-red-200 bg-red-50/70",
      iconClassName: "text-red-600",
    },
  
    CANCELLED: {
      title: "Payment cancelled",
      description:
        "This payment attempt was cancelled. If the invoice still has an outstanding balance, an authorized payer may start another payment.",
      icon: Ban,
      containerClassName: "border-slate-200 bg-slate-50",
      iconClassName: "text-slate-600",
    },
  
    EXPIRED: {
      title: "Payment expired",
      description:
        "This payment request has expired. Check the invoice balance and create a new payment request if payment is still required.",
      icon: TimerOff,
      containerClassName: "border-orange-200 bg-orange-50/70",
      iconClassName: "text-orange-600",
    },
  };
  
  export function PaymentStatusBanner({
    status,
    paymentNumber,
    message,
    failureReason,
    actions,
    className,
  }: PaymentStatusBannerProps) {
    const config = BANNER_CONFIG[status];
    const Icon = config.icon;
  
    return (
      <section
        aria-labelledby="payment-status-title"
        className={[
          "overflow-hidden rounded-xl border",
          config.containerClassName,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background/80">
            <Icon
              aria-hidden="true"
              className={[
                "size-5",
                config.iconClassName,
                status === "PROCESSING" ? "animate-spin" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          </div>
  
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="payment-status-title"
                className="text-base font-semibold sm:text-lg"
              >
                {config.title}
              </h2>
  
              <PaymentStatusBadge status={status} />
            </div>
  
            {paymentNumber && (
              <p className="text-xs font-medium text-muted-foreground">
                Payment number:{" "}
                <span className="font-mono text-foreground">
                  {paymentNumber}
                </span>
              </p>
            )}
  
            <p className="text-sm leading-6 text-muted-foreground">
              {message || config.description}
            </p>
  
            {status === "FAILED" && failureReason && (
              <Alert className="mt-3 border-red-200 bg-background/80">
                <Info className="size-4 text-red-600" />
                <AlertTitle>Failure details</AlertTitle>
                <AlertDescription className="break-words">
                  {failureReason}
                </AlertDescription>
              </Alert>
            )}
  
            {(status === "PENDING" || status === "PROCESSING") && (
              <p className="flex items-start gap-2 pt-1 text-xs leading-5 text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                Payment status can change after confirmation from the payment
                provider or verification by an authorized officer.
              </p>
            )}
          </div>
  
          {actions && (
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              {actions}
            </div>
          )}
        </div>
      </section>
    );
  }
  
  export default PaymentStatusBanner;