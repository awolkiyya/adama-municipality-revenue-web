"use client";

import {
  CheckCircle2,
  Clock3,
  XCircle,
  AlertCircle,
} from "lucide-react";

export type PaymentResultStatus =
  | "success"
  | "failed"
  | "pending";

interface PaymentStatusIconProps {
  status: PaymentResultStatus;
  size?: "sm" | "md" | "lg";
}

export default function PaymentStatusIcon({
  status,
  size = "lg",
}: PaymentStatusIconProps) {
  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  };

  const iconClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const styles = {
    success: {
      wrapper:
        "bg-emerald-50 text-emerald-600 ring-emerald-100",
      icon: CheckCircle2,
    },

    failed: {
      wrapper:
        "bg-red-50 text-red-600 ring-red-100",
      icon: XCircle,
    },

    pending: {
      wrapper:
        "bg-amber-50 text-amber-600 ring-amber-100",
      icon: Clock3,
    },
  };

  const config = styles[status];
  const Icon = config.icon;

  return (
    <div
      className={[
        "flex items-center justify-center rounded-full",
        "ring-8",
        sizeClasses[size],
        config.wrapper,
      ].join(" ")}
      aria-label={`Payment ${status}`}
    >
      <Icon
        className={iconClasses[size]}
        strokeWidth={1.8}
      />
    </div>
  );
}