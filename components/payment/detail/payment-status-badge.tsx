
import {
    CheckCircle2,
    Clock3,
    LoaderCircle,
    XCircle,
    Ban,
    TimerOff,
    type LucideIcon,
  } from "lucide-react";
  
  import { Badge } from "@/components/ui/badge";
  
  export type PaymentStatus =
    | "PENDING"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"
    | "EXPIRED";
  
  type PaymentStatusBadgeProps = {
    status: PaymentStatus;
    showIcon?: boolean;
    className?: string;
  };
  
  type StatusConfig = {
    label: string;
    icon: LucideIcon;
    className: string;
  };
  
  const STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
    PENDING: {
      label: "Pending",
      icon: Clock3,
      className:
        "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50",
    },
  
    PROCESSING: {
      label: "Processing",
      icon: LoaderCircle,
      className:
        "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-50",
    },
  
    COMPLETED: {
      label: "Completed",
      icon: CheckCircle2,
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50",
    },
  
    FAILED: {
      label: "Failed",
      icon: XCircle,
      className:
        "border-red-200 bg-red-50 text-red-800 hover:bg-red-50",
    },
  
    CANCELLED: {
      label: "Cancelled",
      icon: Ban,
      className:
        "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100",
    },
  
    EXPIRED: {
      label: "Expired",
      icon: TimerOff,
      className:
        "border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-50",
    },
  };
  
  export function PaymentStatusBadge({
    status,
    showIcon = true,
    className,
  }: PaymentStatusBadgeProps) {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
  
    return (
      <Badge
        variant="outline"
        className={[
          "inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 font-medium",
          config.className,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {showIcon && (
          <Icon
            aria-hidden="true"
            className={[
              "size-3.5 shrink-0",
              status === "PROCESSING" ? "animate-spin" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        )}
  
        <span>{config.label}</span>
      </Badge>
    );
  }
  
  export default PaymentStatusBadge;