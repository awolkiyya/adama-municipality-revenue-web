"use client"

import { Eye, ScrollText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatDateTime,
  formatRelativeTime,
  getInitials,
  getResourceLabel,
} from "@/lib/audit-log"
import type { AuditLog } from "@/types/audit-log"
import { AuditActionBadge } from "./AuditActionBadge"


interface AuditLogTableProps {
  logs: AuditLog[]
  isLoading: boolean
  /** How many placeholder rows to show while loading. */
  skeletonRows?: number
  onView: (index: number) => void
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-1.5 h-3 w-32" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-8 rounded-full" />
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1.5 h-3 w-32" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16 rounded-full" />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-56" />
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="ml-auto size-8" />
      </TableCell>
    </TableRow>
  )
}

export function AuditLogTable({
  logs,
  isLoading,
  skeletonRows = 8,
  onView,
}: AuditLogTableProps) {
  const isEmpty = !isLoading && logs.length === 0

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[170px]">Time</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead className="hidden md:table-cell">Module</TableHead>
            <TableHead>Description</TableHead>
            {/* <TableHead className="hidden lg:table-cell">
              IP address
            </TableHead> */}
            <TableHead className="w-12">
              <span className="sr-only">View</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading &&
            Array.from({ length: skeletonRows }).map((_, index) => (
              <SkeletonRow key={index} />
            ))}

          {!isLoading &&
            logs.map((log, index) => {
              const resourceLabel = getResourceLabel(log.resource)

              return (
                <TableRow
                  key={log.id}
                  tabIndex={0}
                  onClick={() => onView(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      onView(index)
                    }
                  }}
                  className="cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none"
                >
                  <TableCell className="align-top">
                    <time
                      dateTime={log.created_at}
                      title={formatDateTime(log.created_at)}
                    >
                      <span className="block text-sm font-medium">
                        {formatRelativeTime(log.created_at)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {formatDateTime(log.created_at)}
                      </span>
                    </time>
                  </TableCell>

                  <TableCell className="align-top">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
                        aria-hidden="true"
                      >
                        {getInitials(log.user?.name)}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {log.user?.name ?? "Unknown user"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {log.user?.email ?? "—"}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="align-top">
                    <AuditActionBadge action={log.action} />
                  </TableCell>

                  <TableCell className="hidden align-top text-sm md:table-cell">
                    {log.module}
                  </TableCell>

                  <TableCell className="max-w-[360px] align-top">
                    <p className="truncate text-sm">{log.description}</p>

                    {resourceLabel && (
                      <p className="truncate text-xs text-muted-foreground">
                        {resourceLabel}
                      </p>
                    )}
                  </TableCell>

                  <TableCell className="hidden align-top font-mono text-xs text-muted-foreground lg:table-cell">
                    {log.ip_address ?? "—"}
                  </TableCell>

                  <TableCell className="align-top">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={(event) => {
                        event.stopPropagation()
                        onView(index)
                      }}
                      aria-label={`View details for log ${log.id}`}
                    >
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}

          {isEmpty && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={7} className="py-16">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <ScrollText
                      className="size-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="text-sm font-medium">
                    No audit logs found
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Try a different search or clear the filters.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}