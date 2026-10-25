"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import {
  Landmark,
  Plus,
  Layers,
  FolderTree,
  BadgeCheck,
  Archive,
  ReceiptText,
  CircleDot,
  Pencil,
  X,
  Hash,
  FileText,
  CalendarDays,
  Tag,
  CheckCircle2,
  XCircle,
  CalendarClock,
  ArrowRightLeft,
} from "lucide-react"

import ProtectedRoute from "@/components/access/ProtectedRoute"
import Can from "@/components/access/Can"

import { Banner } from "@/components/banner/topBanner"
import { IconBadge } from "@/components/commen/icon-badge"
import { FloatingParticles } from "@/components/design/FloatingParticles"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"

import { DataTablePagination } from "@/components/table/data-pagination"
import { Filters } from "@/components/commen/Filters"
import { ExportDropdown } from "@/components/commen/ExportDropdown"
import { resolveActions } from "@/components/table/permissions/ResolveActions"
import { CommentTableRegistry } from "@/components/table/registry"
import { CommenTable } from "@/components/table/CommenTable"
import { StatCard, StatCardGrid } from "@/components/cards/StatCard"
import AppFilterBar from "@/components/app-filter-bar"

import { useRevenueCategories } from "@/hooks/revenue/revenueCategory.hook"
import type {
  RevenueCategory,
  RevenueCategoryFilters as ApiRevenueCategoryFilters,
  RevenueCategorySummary,
} from "@/types/revenue/revenue-category"
import type { CommentType, FilterField } from "@/types/commen"
import type { RootState } from "@/lib/store/store"

// -----------------------------------------------------------------------------
// Permission resource
// -----------------------------------------------------------------------------
//
// Replace this value if your permission seeder uses a different resource key.
// The same resource must be used by ProtectedRoute, Can, and your API policy.
//

const REVENUE_CATEGORY_RESOURCE = "revenue_categorys"
// -----------------------------------------------------------------------------
// Filter configuration
// -----------------------------------------------------------------------------

export const sectorFilters: FilterField[] = [
  {
    key: "revenue_domain",
    label: "Revenue Domain",
    type: "select",
    defaultValue: "ALL",
    icon: Layers,
    options: [
      { label: "All Domains", value: "ALL" },
      { label: "Tax", value: "TAX" },
      { label: "Rent", value: "RENT" },
      { label: "Investment", value: "INVESTMENT" },
      { label: "Service", value: "SERVICE" },
      { label: "Sale", value: "SALE" },
      { label: "Capital", value: "CAPITAL" },
    ],
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    defaultValue: "ALL",
    icon: CircleDot,
    options: [
      { label: "All", value: "ALL" },
      { label: "Active", value: "ACTIVE" },
      { label: "Inactive", value: "INACTIVE" },
    ],
  },
]

const INITIAL_FILTERS = {
  revenue_domain: "ALL",
  status: "ALL",
} as const

type RevenueCategoryDraftFilters = {
  revenue_domain: string
  status: string
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

type CategoryRecord = Record<string, unknown>

function getCategoryRecord(category: RevenueCategory): CategoryRecord {
  return category as unknown as CategoryRecord
}

function getString(
  record: CategoryRecord,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === "string" && value.trim().length > 0) {
      return value
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }

  return undefined
}

function getNumber(
  record: CategoryRecord,
  ...keys: string[]
): number | undefined {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }

    if (
      typeof value === "string" &&
      value.trim() !== "" &&
      Number.isFinite(Number(value))
    ) {
      return Number(value)
    }
  }

  return undefined
}

function getBoolean(
  record: CategoryRecord,
  ...keys: string[]
): boolean | undefined {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === "boolean") {
      return value
    }

    if (value === 1 || value === 0) {
      return value === 1
    }

    if (value === "1" || value === "0") {
      return value === "1"
    }
  }

  return undefined
}

function formatLabel(value?: string): string {
  if (!value) return "Not provided"

  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_\s]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatDate(value?: string): string | undefined {
  if (!value) return undefined

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatCodeRange(
  startCode?: number,
  endCode?: number
): string {
  if (startCode === undefined && endCode === undefined) {
    return "Not provided"
  }

  if (startCode === undefined) {
    return `Up to ${endCode}`
  }

  if (endCode === undefined) {
    return `From ${startCode}`
  }

  if (startCode === endCode) {
    return String(startCode)
  }

  return `${startCode} – ${endCode}`
}

// -----------------------------------------------------------------------------
// Page content
// -----------------------------------------------------------------------------

function RevenueCategoriesPageContent() {
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user)

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState("")

  const [filters, setFilters] =
    useState<RevenueCategoryDraftFilters>({
      ...INITIAL_FILTERS,
    })

  const [draftFilters, setDraftFilters] =
    useState<RevenueCategoryDraftFilters>({
      ...INITIAL_FILTERS,
    })

  const [selectedCategory, setSelectedCategory] =
    useState<RevenueCategory | null>(null)

  // ---------------------------------------------------------------------------
  // Filter state
  // ---------------------------------------------------------------------------

  const activeFilterCount = useMemo(
    () =>
      Object.values(filters).filter(
        (value) => value !== "ALL" && value !== ""
      ).length,
    [filters]
  )

  const hasAppliedFilters =
    activeFilterCount > 0 || search.trim().length > 0

  const hasPendingChanges =
    draftFilters.revenue_domain !== filters.revenue_domain ||
    draftFilters.status !== filters.status

  const applyFilters = () => {
    setFilters({ ...draftFilters })
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ ...INITIAL_FILTERS })
    setDraftFilters({ ...INITIAL_FILTERS })
    setSearch("")
    setPage(1)
  }

  // ---------------------------------------------------------------------------
  // API query
  // ---------------------------------------------------------------------------

  const queryFilters = useMemo<ApiRevenueCategoryFilters>(
    () => ({
      revenue_domain:
        filters.revenue_domain === "ALL"
          ? undefined
          : (filters.revenue_domain as ApiRevenueCategoryFilters["revenue_domain"]),

      is_active:
        filters.status === "ALL"
          ? undefined
          : filters.status === "ACTIVE",

      search: search.trim() || undefined,
      page,
      per_page: perPage,
    }),
    [filters, search, page, perPage]
  )

  const { data, isPending } = useRevenueCategories(queryFilters)

  const revenueCategories = data?.data ?? []
  const meta = data?.meta
  const summary = meta?.summary as RevenueCategorySummary | undefined

  // ---------------------------------------------------------------------------
  // Table permissions
  // ---------------------------------------------------------------------------
  //
  // Keep resolveActions so CommenTable only exposes row actions permitted by
  // the authenticated user's permissions. ProtectedRoute handles page access,
  // while Can below handles individual controls.
  //

  const actions = useMemo(
    () =>
      resolveActions(
        CommentTableRegistry.revenueCategory,
        user?.permissions ?? []
      ),
    [user?.permissions]
  )

  // ---------------------------------------------------------------------------
  // Selected category details
  // ---------------------------------------------------------------------------

  const selectedRecord = selectedCategory
    ? getCategoryRecord(selectedCategory)
    : null

  const categoryId = selectedRecord
    ? getString(selectedRecord, "id")
    : undefined

  const categoryName = selectedRecord
    ? getString(selectedRecord, "name", "category_name", "title") ??
      "Revenue Category"
    : "Revenue Category"

  const categoryDomain = selectedRecord
    ? getString(
        selectedRecord,
        "revenueDomain",
        "revenue_domain",
        "domain"
      )
    : undefined

  const categoryStartCode = selectedRecord
    ? getNumber(selectedRecord, "startCode", "start_code")
    : undefined

  const categoryEndCode = selectedRecord
    ? getNumber(selectedRecord, "endCode", "end_code")
    : undefined

  const categoryCodesCount = selectedRecord
    ? getNumber(selectedRecord, "codesCount", "codes_count") ?? 0
    : 0

  const categoryDescription = selectedRecord
    ? getString(selectedRecord, "description", "remarks")
    : undefined

  const categoryActive = selectedRecord
    ? getBoolean(selectedRecord, "isActive", "is_active", "active")
    : undefined

  const categoryStatus = selectedRecord
    ? getString(selectedRecord, "status") ??
      (categoryActive === undefined
        ? undefined
        : categoryActive
          ? "ACTIVE"
          : "INACTIVE")
    : undefined

  const categorySortOrder = selectedRecord
    ? getNumber(selectedRecord, "sortOrder", "sort_order")
    : undefined

  const categoryCreatedAt = selectedRecord
    ? getString(selectedRecord, "created_at", "createdAt")
    : undefined

  const categoryUpdatedAt = selectedRecord
    ? getString(selectedRecord, "updated_at", "updatedAt")
    : undefined

  const categoryIsActive =
    categoryActive ??
    (categoryStatus
      ? categoryStatus.toUpperCase() === "ACTIVE"
      : undefined)

  const closeViewSheet = () => {
    setSelectedCategory(null)
  }

  const editSelectedCategory = () => {
    if (!categoryId) return

    closeViewSheet()

    router.push(
      `/office/dashboard/revenue-managements/categories/${categoryId}`
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <TooltipProvider delayDuration={200}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-10 md:p-10">
        {/* Page header */}

        <Banner
          description="Organize municipal revenue categories by domain and maintain a consistent classification for revenue services and reporting."
          badge={
            <IconBadge
              className="gap-2 rounded-full p-3 text-xs"
              icon={<Landmark className="h-4 w-4" />}
            >
              Revenue Categories
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
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Can
                resource={REVENUE_CATEGORY_RESOURCE}
                action="export"
              >
                <ExportDropdown />
              </Can>

              <Can
                resource={REVENUE_CATEGORY_RESOURCE}
                action="create"
              >
                <Button
                  onClick={() =>
                    router.push(
                      "/office/dashboard/revenue-managements/categories/create"
                    )
                  }
                >
                  <Plus className="mr-2 size-4" />
                  New Category
                </Button>
              </Can>
            </div>
          }
          overlayClassName="bg-transparent"
        />

        <div className="flex flex-col gap-6">
          {/* Statistics */}

          <StatCardGrid columns={4}>
            <StatCard
              label="Total Categories"
              value={summary?.total ?? 0}
              icon={FolderTree}
              accent="primary"
              loading={!summary}
            />

            <StatCard
              label="Active"
              value={summary?.active ?? 0}
              icon={BadgeCheck}
              accent="emerald"
              loading={!summary}
            />

            <StatCard
              label="Inactive"
              value={summary?.inactive ?? 0}
              icon={Archive}
              accent="red"
              loading={!summary}
            />

            <StatCard
              label="Total Revenue Codes"
              value={summary?.totalCodes ?? 0}
              icon={ReceiptText}
              accent="blue"
              loading={!summary}
            />
          </StatCardGrid>

          {/* Search and filters */}

          <AppFilterBar
            search={search}
            onSearchChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            searchPlaceholder="Search revenue categories..."
            searchLabel="Search revenue categories"
            title="Search and filter"
            description="Narrow the category register by revenue domain or status."
            activeFilterCount={activeFilterCount}
            hasFilters={hasAppliedFilters || hasPendingChanges}
            onApply={applyFilters}
            onClear={clearFilters}
          >
            <Filters
              schema={sectorFilters}
              value={draftFilters}
              onChange={(value) =>
                setDraftFilters(value as RevenueCategoryDraftFilters)
              }
              onReset={() =>
                setDraftFilters({ ...INITIAL_FILTERS })
              }
              layout="row"
              resetPosition="end"
            />
          </AppFilterBar>

          {/* Revenue categories table */}

          <CommenTable
            type={"revenueCategory" as CommentType}
            data={revenueCategories}
            page={page}
            pageSize={perPage}
            isLoading={isPending}
            actions={actions}
            onView={(row) => {
              setSelectedCategory(row as RevenueCategory)
            }}
            onEdit={(row) => {
              router.push(
                `/office/dashboard/revenue-managements/categories/${row.id}`
              )
            }}
          />

          {/* Pagination */}

          <DataTablePagination
            page={page}
            pageSize={perPage}
            total={meta?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPerPage(size)
              setPage(1)
            }}
          />
        </div>
      </div>

      {/* View revenue category sheet */}

      <Sheet
        open={selectedCategory !== null}
        onOpenChange={(open) => {
          if (!open) closeViewSheet()
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl"
        >
          {/* Sheet header */}

          <SheetHeader className="border-b px-6 py-5 pr-12 text-left">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FolderTree className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <SheetTitle className="break-words text-lg">
                  {categoryName}
                </SheetTitle>

                <SheetDescription className="mt-1">
                  Revenue category details and assigned code range.
                </SheetDescription>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {categoryStatus && (
                <Badge
                  variant={
                    categoryIsActive === true
                      ? "default"
                      : "destructive"
                  }
                  className={
                    categoryIsActive === true
                      ? "gap-1.5 border-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                      : "gap-1.5"
                  }
                >
                  {categoryIsActive === true ? (
                    <CheckCircle2 className="size-3" />
                  ) : (
                    <XCircle className="size-3" />
                  )}
                  {formatLabel(categoryStatus)}
                </Badge>
              )}

              {categoryDomain && (
                <Badge variant="outline" className="gap-1.5">
                  <Layers className="size-3" />
                  {formatLabel(categoryDomain)}
                </Badge>
              )}
            </div>
          </SheetHeader>

          {/* Sheet body */}

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {/* Overview */}

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Overview</h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Basic classification information for this revenue category.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Tag className="size-4" />
                    <span className="text-xs font-medium">
                      Category Name
                    </span>
                  </div>

                  <p className="break-words text-sm font-medium">
                    {categoryName}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Layers className="size-4" />
                    <span className="text-xs font-medium">
                      Revenue Domain
                    </span>
                  </div>

                  <p className="text-sm font-medium">
                    {formatLabel(categoryDomain)}
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Assigned code range */}

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">
                  Assigned Code Range
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  The numeric range reserved for revenue codes in this category.
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                  <Hash className="size-4" />
                  <span className="text-xs font-medium">
                    Start code to end code
                  </span>
                </div>

                <p className="text-2xl font-semibold tracking-tight tabular-nums">
                  {formatCodeRange(categoryStartCode, categoryEndCode)}
                </p>

                {categoryStartCode !== undefined &&
                  categoryEndCode !== undefined && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/60 p-3">
                      <ArrowRightLeft className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                      <p className="text-xs leading-5 text-muted-foreground">
                        This is the assigned code range. It does not imply
                        that every number within the range has a registered
                        revenue code.
                      </p>
                    </div>
                  )}
              </div>
            </section>

            <Separator />

            {/* Revenue code count */}

            <section className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Revenue Codes</h3>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Number of revenue codes associated with this category.
                  </p>
                </div>

                <Badge variant="secondary" className="shrink-0 gap-1.5">
                  <ReceiptText className="size-3" />
                  {categoryCodesCount}
                </Badge>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ReceiptText className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {categoryCodesCount === 1
                        ? "1 registered revenue code"
                        : `${categoryCodesCount} registered revenue codes`}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      This count is provided by the API through the{" "}
                      <code className="rounded bg-muted px-1 py-0.5">
                        codesCount
                      </code>{" "}
                      field. Individual code names and descriptions are not
                      included in the current category list response.
                    </p>
                  </div>
                </div>

                {categoryCodesCount === 0 && (
                  <div className="mt-4 rounded-lg border border-dashed p-3">
                    <p className="text-xs leading-5 text-muted-foreground">
                      No revenue codes are currently associated with this
                      category according to the API response.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <Separator />

            {/* Description */}

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Description</h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  The purpose and scope of this revenue category.
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <FileText className="size-4" />
                  <span className="text-xs font-medium">
                    Category Description
                  </span>
                </div>

                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                  {categoryDescription ?? "No description provided."}
                </p>
              </div>
            </section>

            {/* Record information */}

            {(categorySortOrder !== undefined ||
              categoryCreatedAt ||
              categoryUpdatedAt) && (
              <>
                <Separator />

                <section className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Record Information
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Administrative and audit information for this record.
                    </p>
                  </div>

                  <div className="space-y-4 rounded-xl border p-4">
                    {categorySortOrder !== undefined && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ArrowRightLeft className="size-4" />
                          Display Order
                        </span>

                        <span className="text-right text-xs font-medium tabular-nums">
                          {categorySortOrder}
                        </span>
                      </div>
                    )}

                    {categoryCreatedAt && (
                      <div className="flex items-start justify-between gap-4">
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarDays className="size-4 shrink-0" />
                          Created
                        </span>

                        <span className="text-right text-xs font-medium">
                          {formatDate(categoryCreatedAt)}
                        </span>
                      </div>
                    )}

                    {categoryUpdatedAt && (
                      <div className="flex items-start justify-between gap-4">
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarClock className="size-4 shrink-0" />
                          Last Updated
                        </span>

                        <span className="text-right text-xs font-medium">
                          {formatDate(categoryUpdatedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Sheet footer */}

          <SheetFooter className="border-t px-6 py-4 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={closeViewSheet}
            >
              <X className="mr-2 size-4" />
              Close
            </Button>

            <Can
              resource={REVENUE_CATEGORY_RESOURCE}
              action="update"
            >
              <Button
                type="button"
                onClick={editSelectedCategory}
                disabled={!categoryId}
              >
                <Pencil className="mr-2 size-4" />
                Edit Category
              </Button>
            </Can>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}

// -----------------------------------------------------------------------------
// Protected page entry point
// -----------------------------------------------------------------------------

export default function RevenueCategoriesPage() {
  return (
    <ProtectedRoute
      resource={REVENUE_CATEGORY_RESOURCE}
      action="view"
    >
      <RevenueCategoriesPageContent />
    </ProtectedRoute>
  )
}
