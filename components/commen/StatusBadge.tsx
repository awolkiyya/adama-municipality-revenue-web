import { Clock, Sparkles } from "lucide-react";
import { Badge } from "../ui/badge";

export type FeatureStatus = "live" | "beta" | "soon";

const STATUS_CONFIG: Record<
  FeatureStatus,
  { label: string; icon: typeof Sparkles; className: string }
> = {
  live: {
    label: "Live",
    icon: Sparkles,
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  beta: {
    label: "Beta",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  soon: {
    label: "Coming soon",
    icon: Clock,
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function StatusBadge({ status }: { status: FeatureStatus }) {
    const cfg = STATUS_CONFIG[status];
    const Icon = cfg.icon;
    return (
      <Badge variant="outline" className={`gap-1 text-[11px] font-medium ${cfg.className}`}>
        <Icon className="h-3 w-3" />
        {cfg.label}
      </Badge>
    );
  }