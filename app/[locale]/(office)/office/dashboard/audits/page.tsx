
"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw, ScrollText, TriangleAlert } from "lucide-react"

import { Banner } from "@/components/banner/topBanner"
import { FloatingParticles } from "@/components/design/FloatingParticles"
import { IconBadge } from "@/components/commen/icon-badge"
import { ExportDropdown } from "@/components/commen/ExportDropdown"
import { DataTablePagination } from "@/components/table/data-pagination"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { AuditLogDetailsDialog } from "@/components/audit/AuditLogDetailsDialog"
import { AuditLogTable } from "@/components/audit/AuditLogTable"
import { useAuditLogs } from "@/hooks/audit/use-audit-logs"
import AppFilterBar from "@/components/app-filter-bar"

const DEFAULT_PAGE_SIZE = 20

const ACTION_OPTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "VIEW",
  "VIEW_LIST",
] as const

const MODULE_OPTIONS = [
  "Access Management",
  "Administrative",
  "Dashboard",
  "Sectors",
] as const

type AuditFilters = {
  action: string
  module: string
}

const EMPTY_FILTERS: AuditFilters = {
  action: "",
  module: "",
}

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

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ")
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function AuditLogsPage() {
  const [search, setSearch] = useState("")
  const [draftFilters, setDraftFilters] =
    useState<AuditFilters>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] =
    useState<AuditFilters>(EMPTY_FILTERS)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim())

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAuditLogs({
    page,
    perPage: pageSize,
    search: debouncedSearch || undefined,
    action: appliedFilters.action || undefined,
    module: appliedFilters.module || undefined,
  })

  const logs = data?.data ?? []
  const total = data?.meta.total ?? 0

  /*
  |--------------------------------------------------------------------------
  | Filter state
  |--------------------------------------------------------------------------
  */

  const activeFilterCount = [
    appliedFilters.action,
    appliedFilters.module,
  ].filter(Boolean).length

  const hasAppliedFilters = activeFilterCount > 0

  const hasPendingChanges =
    draftFilters.action !== appliedFilters.action ||
    draftFilters.module !== appliedFilters.module

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...draftFilters })
    setPage(1)
    setSelectedIndex(null)
  }, [draftFilters])

  const clearFilters = useCallback(() => {
    setDraftFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
    setPage(1)
    setSelectedIndex(null)
  }, [])

  /*
  |--------------------------------------------------------------------------
  | Dialog navigation
  |--------------------------------------------------------------------------
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
  |--------------------------------------------------------------------------
  | Handlers
  |--------------------------------------------------------------------------
  */

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
    setSelectedIndex(null)
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
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6 max-w-5xl m-auto">
      {/* Header */}

      <Banner
        description="Review who did what, when, and from where across the revenue system"
        badge={
          <IconBadge
            className="gap-2 "
            icon={<ScrollText className="size-3" />}
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
        overlayClassName="bg-transparent"

       actions={

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label="Refresh audit logs"
            title="Refresh audit logs"
          >
            <RefreshCw
              className={`size-4 ${
                isFetching ? "animate-spin" : ""
              }`}
            />
          </Button>
  
          <ExportDropdown />
        </div>}
      />

      {/* Search and filters */}

      <AppFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by user, description, or request ID..."
        searchLabel="Search audit logs"
        title="Search and filter"
        description="Narrow the audit log by action or module."
        activeFilterCount={activeFilterCount}
        hasFilters={hasAppliedFilters || hasPendingChanges}
        onApply={applyFilters}
        onClear={clearFilters}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Action
          </label>

          <Select
            value={draftFilters.action || "ALL"}
            onValueChange={(value) => {
              setDraftFilters((current) => ({
                ...current,
                action: value === "ALL" ? "" : value,
              }))
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">All actions</SelectItem>

              {ACTION_OPTIONS.map((action) => (
                <SelectItem key={action} value={action}>
                  {formatLabel(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Module
          </label>

          <Select
            value={draftFilters.module || "ALL"}
            onValueChange={(value) => {
              setDraftFilters((current) => ({
                ...current,
                module: value === "ALL" ? "" : value,
              }))
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All modules" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">All modules</SelectItem>

              {MODULE_OPTIONS.map((module) => (
                <SelectItem key={module} value={module}>
                  {module}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </AppFilterBar>


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

          <Button
            type="button"
            variant="outline"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
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
          if (!open) {
            setSelectedIndex(null)
          }
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
            ? {
                index: selectedIndex + 1,
                total: logs.length,
              }
            : undefined
        }
      />
    </div>
  )
}
