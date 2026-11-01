
"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import {
    ShieldCheck,
    Power,
    Loader2,
    AlertCircle,
    Building2,
    CircleDot,
    Wrench,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { ServiceAccessDialog } from "@/components/dialogs/ServiceAccessDialog";

import { useRevenueService } from "@/hooks/revenue/revenueService.hook";

import { SectorDropdown } from "@/components/input/SectorDropDown";

import type { FilterField } from "@/types/commen";

import { Toolbar } from "@/components/commen/Toolbar";
import { ServiceOverviewCard } from "@/components/cards/ServiceOverviewCard";
import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { FloatingParticles } from "@/components/design/FloatingParticles";

import type {
    ServiceAccessRuleSummary,
} from "@/types/revenue/service-access-rule";

import { DataTablePagination } from "@/components/table/data-pagination";

import {
    useServiceAccessRules,
    useSyncServiceAccessRules,
} from "@/hooks/revenue/revenueServiceAccessRule.hook";

import { SearchInput } from "@/components/input/SearchInput";
import { cn } from "@/lib/utils";

import { useSectors } from "@/hooks/useAdminUnit.hook";

/* =========================================================
   TYPES
========================================================= */

interface SectorAccess {
    sectorId: string;
    sectorName: string;
    isActive: boolean;
}

interface ServiceAccessFormValues {
    sectors: SectorAccess[];
}

type AccessStatusFilter =
    | "ALL"
    | "ACTIVE"
    | "INACTIVE";

interface AccessFilters {
    status: AccessStatusFilter;
}

/* =========================================================
   STATIC CONFIG
========================================================= */

export const sectorFilters: FilterField[] = [
    {
        key: "status",
        label: "Status",
        type: "select",
        defaultValue: "ALL",
        icon: CircleDot,
        options: [
            {
                label: "All",
                value: "ALL",
            },
            {
                label: "Allowed",
                value: "ACTIVE",
            },
            {
                label: "Not Allowed",
                value: "INACTIVE",
            },
        ],
    },
];

const INITIAL_FILTERS: AccessFilters = {
    status: "ALL",
};

/* =========================================================
   PAGE
========================================================= */

export default function ServiceAccessPage() {
    const params = useParams<{ id: string }>();

    const serviceId = params.id;

    /* =======================================================
       SERVICE
    ======================================================= */

    const {
        data: serviceResponse,
        isLoading: isServiceLoading,
        isError: isServiceError,
    } = useRevenueService(serviceId);

    const service = serviceResponse?.data;

    /* =======================================================
       ACCESS RULES
    ======================================================= */

    const {
        data: rulesResponse,
        isLoading: isRulesLoading,
        isError: isRulesError,
        refetch,
    } = useServiceAccessRules(serviceId);

    const rows = useMemo(
        () => rulesResponse?.data ?? [],
        [rulesResponse?.data],
    );

    const summary =
        rulesResponse?.meta?.summary as
            | ServiceAccessRuleSummary
            | undefined;

    /* =======================================================
       BULK SYNC MUTATION
    ======================================================= */

    const syncAccessRules =
        useSyncServiceAccessRules();

    /* =======================================================
       FILTERS
    ======================================================= */

    const [search, setSearch] = useState("");

    const [filters, setFilters] =
        useState<AccessFilters>(INITIAL_FILTERS);

    const [sectorFilter, setSectorFilter] =
        useState<string | null>(null);

    /* =======================================================
       PAGINATION
    ======================================================= */

    const [page, setPage] = useState(1);

    const [pageSize, setPageSize] = useState(10);

    /* =======================================================
       FETCH SECTORS
    ======================================================= */

    const {
        data: sectorsResponse,
        isLoading: isSectorsLoading,
        isError: isSectorsError,
    } = useSectors({
        page: 1,
        per_page: 1000,
        search: "",
        is_active: true,
        sort_by: "name",
        sort_order: "asc",
    });

    const sectors = sectorsResponse?.data ?? [];

    /* =======================================================
       DIALOG
    ======================================================= */

    const [accessDialogOpen, setAccessDialogOpen] =
        useState(false);

    /* =======================================================
       SELECTION
    ======================================================= */

    const [selectedIds, setSelectedIds] =
        useState<Set<string>>(new Set());

    /* =======================================================
       FILTERED ROWS
    ======================================================= */

    const hasFiltersApplied =
        search.trim() !== "" ||
        filters.status !== "ALL" ||
        sectorFilter !== null;

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        return rows.filter((row) => {
            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            if (
                filters.status === "ACTIVE" &&
                !row.isActive
            ) {
                return false;
            }

            if (
                filters.status === "INACTIVE" &&
                row.isActive
            ) {
                return false;
            }

            /*
            |--------------------------------------------------------------------------
            | SECTOR
            |--------------------------------------------------------------------------
            */

            if (
                sectorFilter &&
                row.sector.id !== sectorFilter
            ) {
                return false;
            }

            /*
            |--------------------------------------------------------------------------
            | SEARCH
            |--------------------------------------------------------------------------
            */

            if (term) {
                const haystack =
                    row.sector.name.toLowerCase();

                if (!haystack.includes(term)) {
                    return false;
                }
            }

            return true;
        });
    }, [
        rows,
        search,
        filters.status,
        sectorFilter,
    ]);

    /* =======================================================
       PAGINATED ROWS
    ======================================================= */

    const paginatedRows = useMemo(() => {
        const startIndex = (page - 1) * pageSize;

        return filtered.slice(
            startIndex,
            startIndex + pageSize,
        );
    }, [
        filtered,
        page,
        pageSize,
    ]);

    /* =======================================================
       CLEAR FILTERS
    ======================================================= */

    const clearFilters = () => {
        setSearch("");

        setFilters(INITIAL_FILTERS);

        setSectorFilter(null);

        setPage(1);
    };

    /* =======================================================
       SELECTION
    ======================================================= */

    const toggleSelected = (id: string) => {
        setSelectedIds((previous) => {
            const next = new Set(previous);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };

    const toggleSelectAllFiltered = () => {
        setSelectedIds((previous) => {
            const allSelected =
                filtered.length > 0 &&
                filtered.every((row) =>
                    previous.has(row.id),
                );

            const next = new Set(previous);

            if (allSelected) {
                filtered.forEach((row) => {
                    next.delete(row.id);
                });
            } else {
                filtered.forEach((row) => {
                    next.add(row.id);
                });
            }

            return next;
        });
    };

    /* =======================================================
       BUILD COMPLETE ACCESS PAYLOAD
    ======================================================= */

    const buildAccessPayload = (
        overrides?: Map<string, boolean>,
    ): ServiceAccessFormValues => {
        /*
        |--------------------------------------------------------------------------
        | Existing access configuration
        |--------------------------------------------------------------------------
        */

        const accessMap = new Map<string, boolean>();

        rows.forEach((row) => {
            accessMap.set(
                row.sector.id,
                row.isActive,
            );
        });

        /*
        |--------------------------------------------------------------------------
        | Apply requested overrides
        |--------------------------------------------------------------------------
        */

        overrides?.forEach((isActive, sectorId) => {
            accessMap.set(sectorId, isActive);
        });

        /*
        |--------------------------------------------------------------------------
        | Backend expects ALL sectors
        |--------------------------------------------------------------------------
        */

        return {
            sectors: sectors.map((sector) => ({
                sectorId: sector.id,
                sectorName: sector.name,
                isActive:
                    accessMap.get(sector.id) ?? false,
            })),
        };
    };

    /* =======================================================
       BULK STATUS
    ======================================================= */

    const handleBulkStatus = async (
        isActive: boolean,
    ) => {
        const selectedRows = rows.filter((row) =>
            selectedIds.has(row.id),
        );

        if (!selectedRows.length || !sectors.length) {
            return;
        }

        const overrides = new Map<string, boolean>();

        selectedRows.forEach((row) => {
            overrides.set(
                row.sector.id,
                isActive,
            );
        });

        const payload =
            buildAccessPayload(overrides);

        try {
            await syncAccessRules.mutateAsync({
                serviceId,
                data: payload,
            });

            await refetch();

            setSelectedIds(new Set());
        } catch (error) {
            console.error(
                "Failed to synchronize sector access:",
                error,
            );
        }
    };

    /* =======================================================
       CREATE / UPDATE / BULK SYNC
    ======================================================= */

    const handleSubmitAccess = async (
        values: ServiceAccessFormValues,
    ) => {
        try {
            await syncAccessRules.mutateAsync({
                serviceId,
                data: values,
            });

            await refetch();

            setAccessDialogOpen(false);

            setSelectedIds(new Set());
        } catch (error) {
            console.error(
                "Failed to synchronize service access:",
                error,
            );

            throw error;
        }
    };

    /* =======================================================
       LOADING
    ======================================================= */

    if (isServiceLoading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />

                <span className="text-sm">
                    Loading service...
                </span>
            </div>
        );
    }

    /* =======================================================
       SERVICE ERROR
    ======================================================= */

    if (isServiceError || !service) {
        return (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
                <AlertCircle className="h-7 w-7 text-destructive" />

                <p className="font-medium">
                    Failed to load revenue service
                </p>

                <p className="text-sm text-muted-foreground">
                    The requested service could not be found.
                </p>
            </div>
        );
    }

    /* =======================================================
       DIALOG DATA
    ======================================================= */

    const existingAccessForDialog =
        rows.map((row) => ({
            id: row.id,
            sectorId: row.sector.id,
            isActive: row.isActive,
        }));

    /* =======================================================
       RENDER
    ======================================================= */

    return (
        <div className="mx-auto max-w-4xl space-y-8 p-6">

            {/* =====================================================
                BANNER
            ===================================================== */}

            <Banner
                description="Control which sectors are allowed to access this revenue service."
                badge={
                    <IconBadge
                        className="gap-2 rounded-full p-3 text-xs"
                        icon={
                            <Wrench className="h-4 w-4" />
                        }
                    >
                        Service Access
                    </IconBadge>
                }
                overlayClassName="bg-transparent"
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
                    <div className="flex flex-wrap gap-2">
                        <Button
                            onClick={() =>
                                setAccessDialogOpen(true)
                            }
                            className="gap-2 py-5"
                            disabled={
                                isSectorsLoading ||
                                isSectorsError ||
                                syncAccessRules.isPending
                            }
                        >
                            {syncAccessRules.isPending ? (
                                <Loader2
                                    size={16}
                                    className="animate-spin"
                                />
                            ) : (
                                <Wrench size={16} />
                            )}

                            Configure access
                        </Button>
                    </div>
                }
            />

            {/* =====================================================
                SERVICE OVERVIEW
            ===================================================== */}

            <ServiceOverviewCard
                service={service}
                activeCount={summary?.active ?? 0}
                inactiveCount={summary?.inactive ?? 0}
                sectorsCount={summary?.sectors ?? 0}
                totalRulesCount={summary?.total ?? 0}
                defaultOpen={false}
            />

            {/* =====================================================
                TOOLBAR
            ===================================================== */}

            <Toolbar
                search={
                    <SearchInput
                        placeholder="Search sector..."
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                    />
                }
                right={
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-full">
                            <SectorDropdown
                                value={sectorFilter}
                                onChange={(value: string) => {
                                    setSectorFilter(value);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>
                }
            />

            {/* =====================================================
                BULK ACTION BAR
            ===================================================== */}

            {selectedIds.size > 0 && (
                <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium">
                        {selectedIds.size} selected
                    </p>

                    <div className="flex flex-wrap items-center gap-2">

                        {/* ALLOW */}

                        <Button
                            size="sm"
                            variant="outline"
                            disabled={
                                syncAccessRules.isPending ||
                                isSectorsLoading ||
                                isSectorsError
                            }
                            onClick={() =>
                                handleBulkStatus(true)
                            }
                        >
                            {syncAccessRules.isPending ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Power className="mr-1.5 h-3.5 w-3.5" />
                            )}

                            Allow
                        </Button>

                        {/* NOT ALLOW */}

                        <Button
                            size="sm"
                            variant="outline"
                            disabled={
                                syncAccessRules.isPending ||
                                isSectorsLoading ||
                                isSectorsError
                            }
                            onClick={() =>
                                handleBulkStatus(false)
                            }
                        >
                            {syncAccessRules.isPending ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Power className="mr-1.5 h-3.5 w-3.5" />
                            )}

                            Not Allow
                        </Button>

                        {/* CLEAR */}

                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={syncAccessRules.isPending}
                            onClick={() =>
                                setSelectedIds(new Set())
                            }
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            )}

            {/* =====================================================
                TABLE
            ===================================================== */}

            {isRulesLoading || isSectorsLoading ? (
                <div className="flex min-h-[200px] items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />

                    <span className="text-sm">
                        Loading sector access...
                    </span>
                </div>
            ) : isSectorsError ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <AlertCircle className="h-7 w-7 text-destructive" />

                        <p className="font-medium">
                            Failed to load sectors
                        </p>

                        <p className="max-w-sm text-sm text-muted-foreground">
                            Sector information could not be loaded.
                            Please refresh the page and try again.
                        </p>
                    </CardContent>
                </Card>
            ) : isRulesError ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <AlertCircle className="h-7 w-7 text-destructive" />

                        <p className="font-medium">
                            Failed to load sector access rules
                        </p>

                        <p className="max-w-sm text-sm text-muted-foreground">
                            Please refresh the page and try again.
                        </p>
                    </CardContent>
                </Card>
            ) : rows.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <ShieldCheck size={22} />
                        </div>

                        <p className="font-medium">
                            No sector access rules yet
                        </p>

                        <p className="max-w-sm text-sm text-muted-foreground">
                            Configure sector access to control
                            which sectors are allowed to use this
                            revenue service.
                        </p>

                        <Button
                            onClick={() =>
                                setAccessDialogOpen(true)
                            }
                            className="mt-2 gap-2"
                            disabled={
                                isSectorsLoading ||
                                isSectorsError
                            }
                        >
                            <Wrench size={16} />
                            Configure access
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">

                            {/* =========================================
                                HEADER
                            ========================================= */}

                            <thead className="sticky top-0 z-10 border-b bg-muted/50">
                                <tr>
                                    <th className="w-10 px-4 py-3">
                                        <Checkbox
                                            checked={
                                                filtered.length > 0 &&
                                                filtered.every((row) =>
                                                    selectedIds.has(row.id),
                                                )
                                            }
                                            onCheckedChange={() =>
                                                toggleSelectAllFiltered()
                                            }
                                            aria-label="Select all visible rules"
                                        />
                                    </th>

                                    <th className="px-4 py-3 text-left">
                                        Sector
                                    </th>

                                    <th className="px-6 py-3 text-center">
                                        Access
                                    </th>
                                </tr>
                            </thead>

                            {/* =========================================
                                BODY
                            ========================================= */}

                            <tbody className="divide-y">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="py-14"
                                        >
                                            <div className="flex flex-col items-center gap-2 text-center">
                                                <p className="font-medium text-muted-foreground">
                                                    No sector access rules
                                                    match your filters.
                                                </p>

                                                {hasFiltersApplied && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        onClick={clearFilters}
                                                    >
                                                        Clear filters
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedRows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="transition hover:bg-muted/30"
                                        >

                                            {/* SELECT */}

                                            <td className="px-4 py-4">
                                                <Checkbox
                                                    checked={selectedIds.has(
                                                        row.id,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleSelected(row.id)
                                                    }
                                                    aria-label={`Select ${row.sector.name}`}
                                                />
                                            </td>

                                            {/* SECTOR */}

                                            <td className="px-4 py-4">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div
                                                        className={cn(
                                                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                                            row.isActive
                                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                : "bg-muted text-muted-foreground",
                                                        )}
                                                    >
                                                        <Building2 size={16} />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium">
                                                            {row.sector.name}
                                                        </p>

                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {row.isActive
                                                                ? "This sector can access the service"
                                                                : "This sector cannot access the service"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* ACCESS */}

                                            <td className="px-6 py-4 text-center">
                                                <Badge
                                                    variant={
                                                        row.isActive
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                >
                                                    {row.isActive
                                                        ? "Allowed"
                                                        : "Not Allowed"}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* =====================================================
                PAGINATION
            ===================================================== */}

            {!isRulesLoading &&
                !isRulesError &&
                !isSectorsLoading &&
                !isSectorsError &&
                filtered.length > 0 && (
                    <DataTablePagination
                        page={page}
                        pageSize={pageSize}
                        total={filtered.length}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setPage(1);
                        }}
                    />
                )}

            {/* =====================================================
                SERVICE ACCESS DIALOG
            ===================================================== */}

            <ServiceAccessDialog
                open={accessDialogOpen}
                onOpenChange={setAccessDialogOpen}
                sectors={sectors}
                serviceName={service.name}
                existingAccess={existingAccessForDialog}
                onSubmit={handleSubmitAccess}
            />
        </div>
    );
}
