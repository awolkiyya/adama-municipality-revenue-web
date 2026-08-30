"use client";

import PaymentStatusIcon, {
  PaymentResultStatus,
} from "./PaymentStatusIcon";

interface PaymentResultHeaderProps {
  status: PaymentResultStatus;
  title?: string;
  description?: string;
}

const DEFAULT_CONTENT: Record<
  PaymentResultStatus,
  {
    title: string;
    description: string;
  }
> = {
  success: {
    title: "Payment Successful",
    description:
      "Your payment has been successfully completed and recorded.",
  },

  failed: {
    title: "Payment Failed",
    description:
      "We could not complete your payment. No successful payment was recorded.",
  },

  pending: {
    title: "Verifying Payment",
    description:
      "We are confirming your payment with the payment provider. Please wait.",
  },
};

export default function PaymentResultHeader({
  status,
  title,
  description,
}: PaymentResultHeaderProps) {
  const content = DEFAULT_CONTENT[status];

  return (
    <div className="flex flex-col items-center text-center">
      <PaymentStatusIcon
        status={status}
        size="lg"
      />

      <div className="mt-7">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title ?? content.title}
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
          {description ?? content.description}
        </p>
      </div>
    </div>
  );
}