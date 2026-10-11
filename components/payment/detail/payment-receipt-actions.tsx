"use client";

import {
  Download,
  Eye,
  Info,
  LoaderCircle,
  Printer,
  ReceiptText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type PaymentReceiptStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

type PaymentReceiptActionsProps = {
  status: PaymentReceiptStatus;
  receiptAvailable: boolean;
  receiptNumber?: string | null;

  isLoading?: boolean;
  isDownloading?: boolean;

  onViewReceipt?: () => void;
  onDownloadReceipt?: () => void;
  onPrintReceipt?: () => void;

  title?: string;
  description?: string;
  className?: string;
};

export function PaymentReceiptActions({
  status,
  receiptAvailable,
  receiptNumber,
  isLoading = false,
  isDownloading = false,
  onViewReceipt,
  onDownloadReceipt,
  onPrintReceipt,
  title = "Payment receipt",
  description = "View, download, or print the official payment receipt.",
  className,
}: PaymentReceiptActionsProps) {
  const isCompleted = status === "COMPLETED";
  const canAccessReceipt = isCompleted && receiptAvailable;
  const isBusy = isLoading || isDownloading;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ReceiptText className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!canAccessReceipt ? (
          <div className="flex items-start gap-3 rounded-lg border border-dashed p-4">
            <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

            <div className="space-y-1">
              <p className="text-sm font-medium">
                {!isCompleted
                  ? "Receipt not available yet"
                  : "Receipt is not available"}
              </p>

              <p className="text-sm text-muted-foreground">
                {!isCompleted
                  ? "An official receipt becomes available after the payment is completed."
                  : "The system has not confirmed that a receipt is available for this payment."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {receiptNumber && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Receipt number
                </p>
                <p className="mt-1 break-all font-mono text-sm font-semibold">
                  {receiptNumber}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {onViewReceipt && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={onViewReceipt}
                  disabled={isBusy}
                >
                  {isLoading ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Eye className="mr-2 size-4" />
                  )}
                  View receipt
                </Button>
              )}

              {onDownloadReceipt && (
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={onDownloadReceipt}
                  disabled={isBusy}
                >
                  {isDownloading ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 size-4" />
                  )}
                  Download receipt
                </Button>
              )}

              {onPrintReceipt && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={onPrintReceipt}
                  disabled={isBusy}
                >
                  <Printer className="mr-2 size-4" />
                  Print receipt
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PaymentReceiptActions;

