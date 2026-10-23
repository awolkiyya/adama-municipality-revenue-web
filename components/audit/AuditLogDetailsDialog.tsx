"use client"

import * as React from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  buildDiff,
  formatDateTime,
  formatRelativeTime,
  getResourceLabel,
  getResourceName,
  humanizeKey,
  parseUserAgent,
  summarizeDiff,
  type DiffEntry,
} from "@/lib/audit-log"
import type { AuditLog } from "@/types/audit-log"
import { AuditActionBadge } from "./AuditActionBadge"


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type TabKey = "overview" | "changes" | "technical" | "raw"

interface AuditLogDetailsDialogProps {
  log: AuditLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPrevious?: () => void
  onNext?: () => void
  /** 1-based position of the log within the current page. */
  position?: { index: number; total: number }
}

/*
|--------------------------------------------------------------------------
| Small building blocks
|--------------------------------------------------------------------------
*/

const ADDED_TONE =
  "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"

const REMOVED_TONE =
  "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"

function CopyButton({
  value,
  label,
}: {
  value: string
  label: string
}) {
  const [copied, setCopied] = React.useState(false)
  const timeoutRef = React.useRef<number | null>(null)

  React.useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    },
    [],
  )

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)

      timeoutRef.current = window.setTimeout(
        () => setCopied(false),
        1500,
      )
    } catch {
      // Clipboard can be blocked; nothing useful to show.
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7 shrink-0"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : `Copy ${label}`}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </Button>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <dt className="text-xs font-medium text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

function Chip({
  children,
  tone,
}: {
  children: React.ReactNode
  tone?: "added" | "removed"
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center break-all rounded-md border px-2 py-0.5 font-mono text-xs",
        tone === "added" && ADDED_TONE,
        tone === "removed" && REMOVED_TONE,
        !tone && "bg-muted/50 text-muted-foreground",
      )}
    >
      {tone === "added" && (
        <span className="mr-1 font-semibold" aria-hidden="true">
          +
        </span>
      )}
      {tone === "removed" && (
        <span className="mr-1 font-semibold" aria-hidden="true">
          −
        </span>
      )}
      {children}
    </span>
  )
}

/** Renders any JSON value in a readable way. */
function ValueView({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return (
      <span className="italic text-muted-foreground">Empty</span>
    )
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <span className="italic text-muted-foreground">
          Empty list
        </span>
      )
    }

    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, index) => (
          <Chip key={`${String(item)}-${index}`}>{String(item)}</Chip>
        ))}
      </div>
    )
  }

  if (typeof value === "object") {
    return (
      <pre className="overflow-x-auto rounded-md bg-muted/50 p-2 font-mono text-xs">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }

  if (typeof value === "boolean") {
    return <span className="font-mono">{String(value)}</span>
  }

  return <span className="break-words">{String(value)}</span>
}

/** One field in the Changes tab. */
function ChangeRow({
  entry,
  showUnchanged,
}: {
  entry: DiffEntry
  showUnchanged: boolean
}) {
  const kindLabel =
    entry.kind === "added"
      ? "Added"
      : entry.kind === "removed"
        ? "Removed"
        : entry.kind === "changed"
          ? "Changed"
          : "Unchanged"

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        entry.kind === "unchanged" && "bg-muted/20",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{entry.label}</p>

        <Badge
          variant="outline"
          className={cn(
            "px-1.5 py-0 text-[11px] font-normal",
            entry.kind === "added" && ADDED_TONE,
            entry.kind === "removed" && REMOVED_TONE,
            entry.kind === "changed" &&
              "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
          )}
        >
          {kindLabel}
        </Badge>
      </div>

      {entry.list ? (
        <div className="flex flex-wrap gap-1.5">
          {entry.list.added.map((item) => (
            <Chip key={`add-${item}`} tone="added">
              {item}
            </Chip>
          ))}

          {entry.list.removed.map((item) => (
            <Chip key={`remove-${item}`} tone="removed">
              {item}
            </Chip>
          ))}

          {showUnchanged &&
            entry.list.unchanged.map((item) => (
              <Chip key={`same-${item}`}>{item}</Chip>
            ))}

          {!showUnchanged &&
            entry.list.unchanged.length > 0 &&
            (entry.list.added.length > 0 ||
              entry.list.removed.length > 0) && (
              <span className="self-center text-xs text-muted-foreground">
                {entry.list.unchanged.length} unchanged
              </span>
            )}
        </div>
      ) : entry.kind === "changed" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className={cn("rounded-md border p-2", REMOVED_TONE)}>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide opacity-70">
              Before
            </p>
            <div className="text-sm">
              <ValueView value={entry.before} />
            </div>
          </div>

          <div className={cn("rounded-md border p-2", ADDED_TONE)}>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide opacity-70">
              After
            </p>
            <div className="text-sm">
              <ValueView value={entry.after} />
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "rounded-md border p-2 text-sm",
            entry.kind === "added" && ADDED_TONE,
            entry.kind === "removed" && REMOVED_TONE,
            entry.kind === "unchanged" && "border-transparent",
          )}
        >
          <ValueView
            value={
              entry.kind === "removed" ? entry.before : entry.after
            }
          />
        </div>
      )}
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Dialog
|--------------------------------------------------------------------------
*/

export function AuditLogDetailsDialog({
  log,
  open,
  onOpenChange,
  onPrevious,
  onNext,
  position,
}: AuditLogDetailsDialogProps) {
  const [tab, setTab] = React.useState<TabKey>("overview")
  const [showUnchanged, setShowUnchanged] = React.useState(false)

  const diff = React.useMemo(
    () => (log ? buildDiff(log.old_values, log.new_values) : []),
    [log],
  )

  const changedCount = diff.filter(
    (entry) => entry.kind !== "unchanged",
  ).length
  const hasChanges = changedCount > 0
  const summary = React.useMemo(() => summarizeDiff(diff), [diff])

  const visibleDiff = showUnchanged
    ? diff
    : diff.filter((entry) => entry.kind !== "unchanged" || entry.list)

  const rawJson = React.useMemo(
    () => (log ? JSON.stringify(log, null, 2) : ""),
    [log],
  )

  // Fall back to Overview when the next log has no changes tab.
  const activeTab: TabKey =
    tab === "changes" && !hasChanges ? "overview" : tab

  // Left and right arrow keys step through the logs on the page.
  React.useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null

      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return
      }

      if (event.key === "ArrowLeft" && onPrevious) {
        event.preventDefault()
        onPrevious()
      }

      if (event.key === "ArrowRight" && onNext) {
        event.preventDefault()
        onNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onPrevious, onNext])

  function handleOpenChange(next: boolean) {
    if (!next) {
      setTab("overview")
      setShowUnchanged(false)
    }

    onOpenChange(next)
  }

  const parsedAgent = parseUserAgent(log?.user_agent)
  const resourceLabel = log ? getResourceLabel(log.resource) : null
  const metadataEntries = Object.entries(log?.metadata ?? {})

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        {log ? (
          <>
            {/* Header */}

            <DialogHeader className="gap-3 border-b px-6 py-5 text-left">
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <AuditActionBadge action={log.action} />

                <Badge variant="outline">{log.module}</Badge>

                <span className="text-xs text-muted-foreground">
                  Log #{log.id}
                </span>
              </div>

              <DialogTitle className="text-lg font-semibold leading-snug">
                {log.description}
              </DialogTitle>

              <DialogDescription>
                {log.user?.name ?? "Unknown user"}
                {" · "}
                {formatDateTime(log.created_at)}
                {" · "}
                {formatRelativeTime(log.created_at)}
              </DialogDescription>
            </DialogHeader>

            {/* Tabs */}

            <Tabs
              value={activeTab}
              onValueChange={(value) => setTab(value as TabKey)}
              className="flex min-h-0 flex-1 flex-col gap-0"
            >
              <TabsList className="mx-6 mt-4 w-fit shrink-0">
                <TabsTrigger value="overview">Overview</TabsTrigger>

                <TabsTrigger value="changes" disabled={!hasChanges}>
                  Changes
                  {hasChanges && (
                    <Badge
                      variant="secondary"
                      className="ml-1.5 px-1.5 py-0 text-[11px] tabular-nums"
                    >
                      {changedCount}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="raw">Raw JSON</TabsTrigger>
              </TabsList>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {/* Overview */}

                <TabsContent value="overview" className="mt-0 space-y-5">
                  <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    <Field label="Performed by">
                      <p className="font-medium">
                        {log.user?.name ?? "Unknown user"}
                      </p>
                      {log.user?.email && (
                        <p className="break-all text-xs text-muted-foreground">
                          {log.user.email}
                        </p>
                      )}
                    </Field>

                    <Field label="When">
                      <p>{formatDateTime(log.created_at)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(log.created_at)}
                      </p>
                    </Field>

                    <Field label="Module">{log.module}</Field>

                    <Field label="Action">
                      <AuditActionBadge action={log.action} />
                    </Field>

                    <Field label="Resource" className="sm:col-span-2">
                      {resourceLabel ? (
                        <div className="flex items-center gap-1">
                          <span className="min-w-0 break-all">
                            <span className="font-medium">
                              {getResourceName(log.resource)}
                            </span>
                            {log.resource.id && (
                              <span className="ml-1 font-mono text-xs text-muted-foreground">
                                {log.resource.id}
                              </span>
                            )}
                          </span>

                          {log.resource.id && (
                            <CopyButton
                              value={log.resource.id}
                              label="resource ID"
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          Not tied to a specific record
                        </span>
                      )}
                    </Field>
                  </dl>

                  {summary.length > 0 && (
                    <div className="rounded-lg border bg-muted/20 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          What changed
                        </p>

                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => setTab("changes")}
                        >
                          View details
                        </Button>
                      </div>

                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {summary.map((line) => (
                          <li key={line} className="flex gap-2">
                            <span
                              className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                              aria-hidden="true"
                            />
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                {/* Changes */}

                <TabsContent value="changes" className="mt-0 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      {changedCount} changed
                      {diff.length - changedCount > 0 &&
                        `, ${diff.length - changedCount} unchanged`}
                    </p>

                    <Button
                      type="button"
                      variant={showUnchanged ? "secondary" : "outline"}
                      size="sm"
                      aria-pressed={showUnchanged}
                      onClick={() => setShowUnchanged((value) => !value)}
                    >
                      Show unchanged
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {visibleDiff.map((entry) => (
                      <ChangeRow
                        key={entry.key}
                        entry={entry}
                        showUnchanged={showUnchanged}
                      />
                    ))}
                  </div>
                </TabsContent>

                {/* Technical */}

                <TabsContent value="technical" className="mt-0 space-y-6">
                  <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    <Field label="Request ID" className="sm:col-span-2">
                      {log.request_id ? (
                        <div className="flex items-center gap-1">
                          <span className="min-w-0 break-all font-mono text-xs">
                            {log.request_id}
                          </span>
                          <CopyButton
                            value={log.request_id}
                            label="request ID"
                          />
                        </div>
                      ) : (
                        "—"
                      )}
                    </Field>

                    <Field label="IP address">
                      <span className="font-mono text-xs">
                        {log.ip_address ?? "—"}
                      </span>
                    </Field>

                    <Field label="User ID">
                      {log.user_id ? (
                        <div className="flex items-center gap-1">
                          <span className="min-w-0 break-all font-mono text-xs">
                            {log.user_id}
                          </span>
                          <CopyButton
                            value={log.user_id}
                            label="user ID"
                          />
                        </div>
                      ) : (
                        "—"
                      )}
                    </Field>

                    <Field label="Device">
                      {parsedAgent.device}
                      <span className="text-muted-foreground">
                        {" · "}
                        {parsedAgent.os}
                        {" · "}
                        {parsedAgent.browser}
                      </span>
                    </Field>

                    <Field label="User agent" className="sm:col-span-2">
                      <span className="break-words font-mono text-xs text-muted-foreground">
                        {log.user_agent ?? "—"}
                      </span>
                    </Field>
                  </dl>

                  {metadataEntries.length > 0 && (
                    <div>
                      <p className="mb-3 text-sm font-medium">
                        Event metadata
                      </p>

                      <dl className="space-y-3 rounded-lg border p-4">
                        {metadataEntries.map(([key, value]) => (
                          <Field key={key} label={humanizeKey(key)}>
                            <ValueView value={value} />
                          </Field>
                        ))}
                      </dl>
                    </div>
                  )}
                </TabsContent>

                {/* Raw JSON */}

                <TabsContent value="raw" className="mt-0">
                  <div className="relative">
                    <div className="absolute right-2 top-2">
                      <CopyButton value={rawJson} label="JSON" />
                    </div>

                    <pre className="max-h-[50vh] overflow-auto rounded-lg border bg-muted/30 p-4 pr-12 font-mono text-xs leading-relaxed">
                      {rawJson}
                    </pre>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {/* Footer */}

            <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-6 py-3">
              <p className="hidden text-xs text-muted-foreground sm:block">
                Use{" "}
                <kbd className="rounded border bg-background px-1.5 py-0.5">
                  ←
                </kbd>{" "}
                <kbd className="rounded border bg-background px-1.5 py-0.5">
                  →
                </kbd>{" "}
                to browse logs
              </p>

              <div className="ml-auto flex items-center gap-2">
                {position && (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {position.index} of {position.total}
                  </span>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onPrevious}
                  disabled={!onPrevious}
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Previous
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onNext}
                  disabled={!onNext}
                >
                  Next
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}