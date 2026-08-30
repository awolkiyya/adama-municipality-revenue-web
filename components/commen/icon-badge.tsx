// components/badge/icon-badge.tsx
import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type IconBadgeProps = {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: React.ComponentProps<typeof Badge>["variant"];
};

export function IconBadge({ icon, children, className, variant = "secondary" }: IconBadgeProps) {
  return (
    <Badge variant={variant} className={cn("gap-1", className)}>
        <p className="text-sm">      {icon}
</p>
      {children}
    </Badge>
  );
}