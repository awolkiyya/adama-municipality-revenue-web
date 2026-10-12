"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { PaymentDetail, type PaymentDetailProps } from "./payment-detail";

type Props = Omit<PaymentDetailProps, "paymentId" | "variant" | "backHref"> & {
  paymentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Quick-view of a payment from any table or list, without leaving the page. */
export function PaymentDetailSheet({
  paymentId,
  open,
  onOpenChange,
  ...rest
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-4 sm:max-w-3xl sm:p-6">
        <SheetHeader className="sr-only">
          <SheetTitle>Payment details</SheetTitle>
          <SheetDescription>Full details for the selected payment.</SheetDescription>
        </SheetHeader>

        {open && paymentId && (
          <PaymentDetail {...rest} paymentId={paymentId} variant="embedded" />
        )}
      </SheetContent>
    </Sheet>
  );
}