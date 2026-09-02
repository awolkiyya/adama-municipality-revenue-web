"use client"

import { useMemo, useState } from 'react'
import { Banner } from '@/components/banner/topBanner'
import { IconBadge } from '@/components/commen/icon-badge'
import { FloatingParticles } from '@/components/design/FloatingParticles'
import { Button } from '@/components/ui/button'
import {
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  Landmark,
  Plus,
  Layers,
  FolderTree,
  BadgeCheck,
  Archive,
  ReceiptText,
  CircleDot,
  Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DataTablePagination } from '@/components/table/data-pagination'
import { Toolbar } from '@/components/commen/Toolbar'
import { Filters } from '@/components/commen/Filters'
import { ExportDropdown } from '@/components/commen/ExportDropdown'
import { CommentType, FilterField } from '@/types/commen'
import { RootState } from '@/lib/store/store'
import { useSelector } from 'react-redux'
import { resolveActions } from '@/components/table/permissions/ResolveActions'
import { CommentTableRegistry } from '@/components/table/registry'
import { CommenTable } from '@/components/table/CommenTable'
import { useRevenueCategories } from '@/hooks/revenue/revenueCategory.hook'
import { RevenueCategorySummary } from '@/types/revenue/revenue-category'
import { StatCard, StatCardGrid } from '@/components/cards/StatCard'
import { SearchInput } from '@/components/input/SearchInput'





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
];


const INITIAL_FILTERS = {

  revenue_domain: "ALL",

  status: "ALL",

};


// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function RevenueCategoriesPage() {
  const router = useRouter();
  const user = useSelector((state:RootState) => state.auth.user);

  const [page,setPage] = useState<number>(1);
  const [perPage,setPerPage] = useState<number>(10);

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState<Record<string, any>>(
    INITIAL_FILTERS
  );

  const queryFilters = useMemo(
    () => ({
      revenue_domain:
        filters.revenue_domain === "ALL"
          ? undefined
          : filters.revenue_domain,
  
      is_active:
        filters.status === "ALL"
          ? undefined
          : filters.status === "ACTIVE",
  
      search,
      page,
      per_page: perPage,
    }),
    [filters, search, page, perPage]
  );
  
  const {
    data,
    isPending,
  } = useRevenueCategories(queryFilters);


  const revenueCategories = data?.data ?? [];


  const meta = data?.meta;


  const summary = meta?.summary as RevenueCategorySummary;




  if (!user?.role) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
        <Loader2 className="size-6 text-muted-foreground animate-spin" />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium text-foreground">
            Checking permissions
          </p>
          <p className="text-xs text-muted-foreground">
            This will only take a moment
          </p>
        </div>
      </div>
    );
  }

  const actions = resolveActions(
    CommentTableRegistry.revenueCategory,
    user.role.name
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-6 pb-10 max-w-7xl m-auto">
        <Banner
          description="Define and organize revenue categories by domain — tax, rent, service, sale, investment, and capital — each mapped to its own account code range."
          badge={
            <IconBadge
              className="p-3 text-xs bg-black/20 text-white gap-2 rounded-full"
              icon={<Landmark className="w-4 h-4" />}
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
          overlayClassName="bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50"
          className="text-white mx-5"
          actions={
            <Button onClick={()=> router.push("/office/dashboard/revenue-managements/categories/create")}>
              <Plus className="mr-2 h-4 w-4" />
              New Revenue Category
            </Button>
          }
        />

        <div className="px-4 md:px-6 flex flex-col gap-6">
          {/* Stats */}
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

           {/* ================= TOOLBAR ================= */}
            <Toolbar
              search={
                <SearchInput
                  placeholder="Search sector..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              }
              right={
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                {/* Center */}
                <div className="flex-1">
                  <Filters
                    schema={sectorFilters}
                    value={filters}
                    onChange={setFilters}
                    onReset={() => setFilters(INITIAL_FILTERS)}
                    layout="row"
                    resetPosition="end"
                  />
                </div>

                {/* Right */}
                <div className="flex justify-end">
                  <ExportDropdown />
                </div>
              </div>
              }
            />
        {/* ================= TABLE ================= */}
        <CommenTable
            type={"revenueCategory" as CommentType}
            data={revenueCategories}
            page={1}
            pageSize={10}
            isLoading={isPending}
            actions={actions}
            onView={(row) => console.log("view", row)}
            onEdit={(row) => {
              router.push(`/office/dashboard/revenue-managements/categories/${row.id}`)
            }}

        />

        <DataTablePagination
          page={page}
          pageSize={perPage}
          total={meta?.total ?? 0}
          onPageChange={(newPage) => {
            setPage(newPage);
          }}
          onPageSizeChange={(size) => {
            setPerPage(size);
            setPage(1); // Reset to first page when page size changes
          }}
        />
        </div>
        {/* here delete modal so */}

      </div>
    </TooltipProvider>
  )
}

export default RevenueCategoriesPage
