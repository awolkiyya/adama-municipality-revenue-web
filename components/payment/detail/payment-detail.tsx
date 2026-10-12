"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  useCompleteCashPayment,
  usePayment,
} from "@/hooks/payment/payment.hook";
import { useOpenFile } from "@/hooks/use-open-file";

import type {
  PaymentDetailPermissions,
  PaymentDetailRoutes,
  PaymentDetailTab,
  PaymentDetailVariant,
  PaymentView,
} from "@/types/payment/ui";
import {
  PaymentDetailView,
  type PaymentDetailViewProps,
} from "./payment-detail-view";
import { Notice, PageSkeleton } from "@/components/ui";
import { errorMessage } from "@/utils/helpers";

export type PaymentDetailProps = {
  paymentId: string;
  routes?: PaymentDetailRoutes;
  can?: PaymentDetailPermissions;
  variant?: PaymentDetailVariant;
  defaultTab?: PaymentDetailTab;
  /** Where "Back" goes. Ignored if onBack is given. */
  backHref?: string;
  onBack?: () => void;
} & Pick<PaymentDetailViewProps, "headerActions" | "notice" | "extra">;

/**
 * Data container: fetches the payment, wires actions, and renders PaymentDetailView.
 * To use another data source (citizen portal, cashier app, tests), render
 * PaymentDetailView directly with your own `payment` and handlers.
 */
export function PaymentDetail({
  paymentId,
  backHref,
  onBack,
  ...viewProps
}: PaymentDetailProps) {
  const router = useRouter();

  const { data: response, isLoading, isError, error, refetch, isFetching } =
    usePayment(paymentId, Boolean(paymentId));

  // Remove this cast once the shared payment types match the current resource.
  const payment = response?.data as unknown as PaymentView | undefined;

  const completeCash = useCompleteCashPayment();
  const { openFile, isOpening } = useOpenFile();

  const goBack = onBack ?? (backHref ? () => router.push(backHref) : undefined);
  const backButton = goBack && (
    <Button variant="outline" onClick={goBack}>
      <ArrowLeft className="mr-2 size-4" />
      Back
    </Button>
  );

  if (!paymentId) {
    return (
      <Notice
        icon={<XCircle className="size-8 text-muted-foreground" />}
        title="Invalid payment ID"
        message="A valid payment identifier is required to open this page."
        actions={backButton}
      />
    );
  }

  if (isLoading && !payment) return <PageSkeleton />;

  if (isError && !payment) {
    return (
      <Notice
        icon={<XCircle className="size-8 text-destructive" />}
        title="Unable to load payment"
        message={errorMessage(error)}
        actions={
          <>
            {backButton}
            <Button onClick={() => void refetch()}>
              <RefreshCw className="mr-2 size-4" />
              Try again
            </Button>
          </>
        }
      />
    );
  }

  if (!payment) {
    return (
      <Notice
        icon={<FileText className="size-8 text-muted-foreground" />}
        title="Payment not found"
        message="The requested payment could not be found."
        actions={backButton}
      />
    );
  }

  async function handleCompleteCash() {
    try {
      await completeCash.mutateAsync(payment!.id);
      toast.success("Cash payment completed.");
      await refetch();
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    }
  }

  return (
    <PaymentDetailView
      {...viewProps}
      payment={payment}
      onBack={goBack}
      onRefresh={() => void refetch()}
      isRefreshing={isFetching}
      onCompleteCash={handleCompleteCash}
      isCompleting={completeCash.isPending}
      completeError={
        completeCash.isError ? errorMessage(completeCash.error) : null
      }
      openFile={openFile}
      isOpening={isOpening}
    />
  );
}