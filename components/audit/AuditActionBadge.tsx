import { Badge } from "@/components/ui/badge"
import { formatAction } from "@/lib/audit-log"
import { cn } from "@/lib/utils"
import type { AuditAction } from "@/types/audit-log"

const TONES: Record<string, string> = {
  CREATE:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  UPDATE:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  DELETE:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
}

const NEUTRAL = "border-border bg-muted text-muted-foreground"

export function AuditActionBadge({
  action,
  className,
}: {
  action: AuditAction
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        TONES[action] ?? NEUTRAL,
        className,
      )}
    >
      {formatAction(action)}
    </Badge>
  )
}