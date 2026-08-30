import {
  CheckCircle2,
  CircleDot,
  Clock3,
  RotateCcw,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { formatStatus } from "@/lib/format";

const STATUS_CONFIG: Record<
  string,
  { icon: LucideIcon; label: string; classes: string }
> = {
  APPROVED: {
    icon: CheckCircle2,
    label: "Approved",
    classes: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  REJECTED: {
    icon: XCircle,
    label: "Rejected",
    classes: "border-red-200 bg-red-50 text-red-700",
  },
  RETURNED: {
    icon: RotateCcw,
    label: "Returned",
    classes: "border-orange-200 bg-orange-50 text-orange-700",
  },
  PENDING_APPROVAL: {
    icon: Clock3,
    label: "Pending Approval",
    classes: "border-amber-200 bg-amber-50 text-amber-700",
  },
};

export function StatusBadge({ status }: { status?: string | null }) {
  const config = STATUS_CONFIG[status?.toUpperCase() ?? ""];

  if (!config) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground">
        <CircleDot className="h-4 w-4" />
        {formatStatus(status)}
      </div>
    );
  }

  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${config.classes}`}
    >
      <Icon className="h-4 w-4" />
      {config.label}
    </div>
  );
}
