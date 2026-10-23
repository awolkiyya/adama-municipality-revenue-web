"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw, ScrollText, Search, TriangleAlert } from "lucide-react"

import { Banner } from "@/components/banner/topBanner"
import { FloatingParticles } from "@/components/design/FloatingParticles"
import { IconBadge } from "@/components/commen/icon-badge"
import { Filters } from "@/components/commen/Filters"
import { Toolbar } from "@/components/commen/Toolbar"
import { ExportDropdown } from "@/components/commen/ExportDropdown"
import { DataTablePagination } from "@/components/table/data-pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { FilterField } from "@/types/commen"

import { AuditLogDetailsDialog } from "@/components/audit/AuditLogDetailsDialog"
import { useAuditLogs } from "@/hooks/audit/use-audit-logs"
import { AuditLogTable } from "@/components/audit/AuditLogTable"


/*
|--------------------------------------------------------------------------
| Filters
|--------------------------------------------------------------------------
| Add more modules here as your backend logs them.
*/

const auditFilters: FilterField[] = [
  {
    key: "action",
    label: "Action",
    type: "select",
    options: [
      { label: "Create", value: "CREATE" },
      { label: "Update", value: "UPDATE" },
      { label: "Delete", value: "DELETE" },
      { label: "View", value: "VIEW" },
      { label: "View list", value: "VIEW_LIST" },
    ],
  },
  {
    key: "module",
    label: "Module",
    type: "select",
    options: [
      { label: "Access Management", value: "Access Management" },
      { label: "Administrative", value: "Administrative" },
      { label: "Dashboard", value: "Dashboard" },
      { label: "Sectors", value: "Sectors" },
    ],
  },
]

const DEFAULT_PAGE_SIZE = 20

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)

    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounced
}

function SearchInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative w-full max-w-md">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />

      <Input className={`w-full pl-9 ${className ?? ""}`} {...props} />
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function AuditLogsPage() {
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim())

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAuditLogs({
      page,
      perPage: pageSize,
      search: debouncedSearch || undefined,
      action: filters.action || undefined,
      module: filters.module || undefined,
    })

  const logs = data?.data ?? []
  const total = data?.meta.total ?? 0

  /*
  |------------------------------------------------------------------------
  | Dialog navigation (within the current page)
  |------------------------------------------------------------------------
  */

  const selectedLog =
    selectedIndex !== null ? (logs[selectedIndex] ?? null) : null

  const handlePrevious = useCallback(() => {
    setSelectedIndex((current) =>
      current !== null && current > 0 ? current - 1 : current,
    )
  }, [])

  const handleNext = useCallback(() => {
    setSelectedIndex((current) =>
      current !== null && current < logs.length - 1
        ? current + 1
        : current,
    )
  }, [logs.length])

  /*
  |------------------------------------------------------------------------
  | Handlers
  |------------------------------------------------------------------------
  */

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleFiltersChange(next: Record<string, string>) {
    setFilters(next)
    setPage(1)
  }

  function handlePageChange(nextPage: number) {
    setSelectedIndex(null)
    setPage(nextPage)
  }

  function handlePageSizeChange(size: number) {
    setSelectedIndex(null)
    setPageSize(size)
    setPage(1)
  }

  /*
  |------------------------------------------------------------------------
  | Render
  |------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/* Header */}

      <Banner
        description="Review who did what, when, and from where across the revenue system"
        badge={
          <IconBadge
            className="gap-2 rounded-full bg-black/20 p-3 text-[10px] text-white"
            icon={<ScrollText className="h-3 w-3" />}
          >
            Security & Audit
          </IconBadge>
        }
        background={
          <FloatingParticles
            color="#040404"
            count={35}
            speed={0.2}
            connectDistance={100}
            position="bottom-right"
          />
        }
        overlayClassName="bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50"
        className="text-white"
      />

      {/* Toolbar */}

      <Toolbar
        search={
          <SearchInput
            placeholder="Search by user, description, or request ID..."
            aria-label="Search audit logs"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
          />
        }
        right={
          <>
            <Filters
              schema={auditFilters}
              value={filters}
              onChange={handleFiltersChange}
              onReset={() => handleFiltersChange({})}
            />

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh audit logs"
            >
              <RefreshCw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>

            <ExportDropdown />
          </>
        }
      />

      {/* Table or error */}

      {isError ? (
        <div
          className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center"
          role="alert"
        >
          <TriangleAlert
            className="size-8 text-muted-foreground"
            aria-hidden="true"
          />

          <div>
            <p className="font-medium">Unable to load audit logs</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Something went wrong while loading the logs."}
            </p>
          </div>

          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <AuditLogTable
          logs={logs}
          isLoading={isLoading}
          skeletonRows={Math.min(pageSize, 8)}
          onView={setSelectedIndex}
        />
      )}

      {/* Pagination */}

      {!isError && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Details dialog */}

      <AuditLogDetailsDialog
        log={selectedLog}
        open={selectedLog !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedIndex(null)
        }}
        onPrevious={
          selectedIndex !== null && selectedIndex > 0
            ? handlePrevious
            : undefined
        }
        onNext={
          selectedIndex !== null && selectedIndex < logs.length - 1
            ? handleNext
            : undefined
        }
        position={
          selectedIndex !== null
            ? { index: selectedIndex + 1, total: logs.length }
            : undefined
        }
      />
    </div>
  )
}