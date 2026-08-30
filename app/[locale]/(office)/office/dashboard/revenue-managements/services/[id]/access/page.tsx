"use client";

import { Fragment, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  Plus,
  MoreHorizontal,
  Power,
  Trash2,
  Pencil,
  Loader2,
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Wrench,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { ServiceAccessDialog } from "@/components/dialogs/ServiceAccessDialog";
import { useRevenueService } from "@/hooks/revenue/revenueService.hook";
import DeleteModal from "@/components/dialogs/deleteModal";
import { SectorDropdown } from "@/components/input/SectorDropDown";
import { Sector } from "@/types/admin-unit";
import { FilterField } from "@/types/commen";
import { Toolbar } from "@/components/commen/Toolbar";
import { SearchInput } from "../../../../sectors/page";
import { Filters } from "@/components/commen/Filters";
import { ServiceOverviewCard } from "@/components/cards/ServiceOverviewCard";
import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { ServiceAccessRule, ServiceAccessRuleSummary, ServiceAction } from "@/types/revenue/service-access-rule";
import { DataTablePagination } from "@/components/table/data-pagination";
import { useCreateServiceAccessRule, useDeleteServiceAccessRule, useServiceAccessRules, useUpdateServiceAccessRule } from "@/hooks/revenue/revenueServiceAccessRule.hook";

/* =========================================================
   TYPES
========================================================= */

interface AccessRuleRow {
  id: string;
  sectorId: string;
  sector: string;
  roleId: string;
  role: string;
  actions: string[];
  isActive: boolean;
}

interface AccessRuleFormValues {
  sectorId: string;
  roleId: number | null;
  actions: ServiceAction[];
  isActive: boolean;
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
      { label: "All", value: "ALL" },
      { label: "Active", value: "ACTIVE" },
      { label: "Inactive", value: "INACTIVE" },
    ],
  },
];

const INITIAL_FILTERS = {
  status: "ALL",
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function ActionChips({ actions }: { actions: string[] }) {
  if (!actions.length) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {actions.map((action) => (
        <Badge key={action} variant="outline" className="text-[10px] font-mono font-normal">
          {action}
        </Badge>
      ))}
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ServiceAccessPage() {
  const params = useParams<{ id: string }>();
  const serviceId = params.id;

  /* --- data -------------------------------------------------------- */

  const { data: serviceResponse, isLoading: isServiceLoading, isError: isServiceError } =
    useRevenueService(serviceId);
  const service = serviceResponse?.data;

  const { data: rulesResponse, isLoading: isRulesLoading, refetch } =
    useServiceAccessRules(serviceId);

  const rows = rulesResponse?.data ?? [];
  const summary = rulesResponse?.meta?.summary as ServiceAccessRuleSummary | undefined;
  const meta = rulesResponse?.meta;

  const createRule = useCreateServiceAccessRule();
  const updateRule = useUpdateServiceAccessRule();
  const deleteRule = useDeleteServiceAccessRule();
  // const toggleStatus = useToggleServiceAccessRuleStatus();

  /* --- filters ------------------------------------------------------ */

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>(INITIAL_FILTERS);
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const [collapsedSectors, setCollapsedSectors] = useState<Set<string>>(new Set());

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* --- selection ------------------------------------------------------ */

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /* --- dialogs ------------------------------------------------------ */

  const [addOpen, setAddOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ServiceAccessRule | null>(null);
  const [removing, setRemoving] = useState<ServiceAccessRule[] | null>(null);

  /* --- derived: filtering + grouping ------------------------------------------------------ */

  const hasFiltersApplied =
    search.trim() !== "" || filters.status !== "ALL" || sectorFilter !== null;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (filters.status === "ACTIVE" && !row.isActive) return false;
      if (filters.status === "INACTIVE" && row.isActive) return false;
      if (sectorFilter && row.sector.id !== sectorFilter) return false;

      if (term) {
        const haystack = `${row.sector} ${row.role} ${row.actions.join(" ")}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  }, [rows, search, filters.status, sectorFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, ServiceAccessRule[]>();

    for (const row of filtered) {
      const list = map.get(row.sector.name) ?? [];
      list.push(row);
      map.set(row.sector.name, list);
    }

    return Array.from(map.entries());
  }, [filtered]);

  const clearFilters = () => {
    setSearch("");
    setFilters(INITIAL_FILTERS);
    setSectorFilter(null);
  };

  /* --- selection handlers ------------------------------------------------------ */

  const toggleSector = (sector: string) => {
    setCollapsedSectors((prev) => {
      const next = new Set(prev);
      next.has(sector) ? next.delete(sector) : next.add(sector);
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const allSelected = filtered.length > 0 && filtered.every((f) => prev.has(f.id));

      if (allSelected) return new Set();

      return new Set(filtered.map((f) => f.id));
    });
  };

  /* --- mutation handlers ------------------------------------------------------ */

  const handleStatusToggle = async (row: ServiceAccessRule) => {
    try {
      // await toggleStatus.mutateAsync({ id: row.id, isActive: !row.isActive });
      refetch();
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const handleBulkStatus = async (isActive: boolean) => {
    const targets = rows.filter((r) => selectedIds.has(r.id));

    try {
      // await Promise.all(
      //   targets.map((row) => toggleStatus.mutateAsync({ id: row.id, isActive }))
      // );
      refetch();
    } catch (err) {
      console.error("Failed to bulk update status", err);
    } finally {
      setSelectedIds(new Set());
    }
  };

  const handleConfirmRemove = async () => {
    if (!removing) return;

    try {
      // await Promise.all(removing.map((row) => deleteRule.mutateAsync({})));
      refetch();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        removing.forEach((r) => next.delete(r.id));
        return next;
      });
    } catch (err) {
      console.error("Failed to remove rule(s)", err);
    } finally {
      setRemoving(null);
    }
  };

  const handleCreateOrUpdate = async (
    values: AccessRuleFormValues,
    ruleId?: string
  ) => {
    if (values.roleId === null) {
      throw new Error("Role is required");
    }
  
    const data = {
      sector_id: values.sectorId,
      role_id: values.roleId,
      actions: values.actions,
      is_active: values.isActive,
    };
  
    if (ruleId) {
      await updateRule.mutateAsync({
        serviceId,
        ruleId,
        data,
      });
    } else {
      await createRule.mutateAsync({
        serviceId,
        data,
      });
    }
  
    await refetch();
  
    setAddOpen(false);
    setEditingRule(null);
  };

  /* --- loading / error states ------------------------------------------------------ */

  if (isServiceLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading service...
      </div>
    );
  }

  if (isServiceError || !service) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
        <AlertCircle className="h-7 w-7 text-destructive" />
        <p className="font-medium">Failed to load revenue service</p>
      </div>
    );
  }

  const existingAccessForDialog = rows.map((r) => ({
    id: r.id,
    sectorId: r.sector.id,
    roleId: Number(r.role.id),
    actions: r.actions,
    isActive: r.isActive,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* BANNER */}
      <Banner
        description="Control which sectors and roles can act on this service, and what they're allowed to do."
        badge={
          <IconBadge
            className="gap-2 rounded-full bg-black/20 p-3 text-xs text-white"
            icon={<Wrench className="h-4 w-4" />}
          >
            Service Access Rules
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
        actions={
          <Button onClick={() => setAddOpen(true)} className="gap-2 py-5">
            <Plus size={16} />
            Add rule
          </Button>
        }
      />

      {/* SERVICE OVERVIEW */}
      <ServiceOverviewCard
        service={service}
        activeCount={summary?.active ?? 0}
        inactiveCount={summary?.inactive ?? 0}
        sectorsCount={summary?.sectors ?? 0}
        totalRulesCount={(summary?.total??0)}
        defaultOpen={false}
      />

      {/* TOOLBAR */}
      <Toolbar
        search={
          <SearchInput
            placeholder="Search sector, role or action..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        }
        right={
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-full">
              <SectorDropdown
                value={sectorFilter}
                onChange={(value: string, _item: Sector) => {
                  setSectorFilter(value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex-1">
              <Filters
                schema={sectorFilters}
                value={filters}
                onChange={(next) => {
                  setFilters(next);
                  setPage(1);
                }}
                onReset={clearFilters}
              />
            </div>
          </div>
        }
      />

      {/* BULK ACTION BAR */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2.5">
          <p className="text-sm font-medium">{selectedIds.size} selected</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => handleBulkStatus(true)}>
              Activate
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatus(false)}>
              Deactivate
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setRemoving(rows.filter((r) => selectedIds.has(r.id)))}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Remove
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* TABLE */}
      {isRulesLoading ? (
        <div className="flex min-h-[200px] items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading access rules...
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck size={22} />
            </div>
            <p className="font-medium">No access rules yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add the first rule to control which sector and role can act on this service.
            </p>
            <Button onClick={() => setAddOpen(true)} className="mt-2 gap-2">
              <Plus size={16} />
              Add rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 border-b bg-muted/50">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={filtered.length > 0 && filtered.every((f) => selectedIds.has(f.id))}
                      onCheckedChange={toggleSelectAllFiltered}
                      aria-label="Select all visible rules"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="w-10" />
                </tr>
              </thead>

              <tbody className="divide-y">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-14">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <p className="font-medium text-muted-foreground">
                          No access rules match your filters.
                        </p>
                        {hasFiltersApplied && (
                          <Button variant="link" size="sm" onClick={clearFilters}>
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {grouped.map(([sector, sectorRows]) => {
                  const isCollapsed = collapsedSectors.has(sector);

                  return (
                    <Fragment key={sector}>
                      <tr className="bg-muted/30">
                        <td colSpan={5} className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => toggleSector(sector)}
                            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                          >
                            {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                            <Building2 size={14} />
                            {sector}
                            <span className="font-normal normal-case text-muted-foreground/70">
                              ({sectorRows.length})
                            </span>
                          </button>
                        </td>
                      </tr>

                      {!isCollapsed &&
                        sectorRows.map((row) => (
                          <tr key={row.id} className="transition hover:bg-muted/30">
                            <td className="px-4 py-4">
                              <Checkbox
                                checked={selectedIds.has(row.id)}
                                onCheckedChange={() => toggleSelected(row.id)}
                                aria-label={`Select ${row.role} in ${row.sector}`}
                              />
                            </td>

                            <td className="px-4 py-4 font-medium">{row.role.name}</td>

                            <td className="px-6 py-4">
                              <ActionChips actions={row.actions} />
                            </td>

                            <td className="px-6 py-4 text-center">
                              <Badge variant={row.isActive ? "default" : "secondary"}>
                                {row.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>

                            <td className="px-6 py-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost" aria-label="Row actions">
                                    <MoreHorizontal size={16} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingRule(row)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusToggle(row)}>
                                    <Power className="mr-2 h-4 w-4" />
                                    {row.isActive ? "Deactivate" : "Activate"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setRemoving([row])}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* PAGINATION */}
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={meta?.total ?? rows.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />

      {/* ADD / EDIT DIALOG (shared, mode-aware) */}
      <ServiceAccessDialog
        open={addOpen || !!editingRule}
        onOpenChange={(v) => {
          if (!v) {
            setAddOpen(false);
            setEditingRule(null);
          }
        }}
        serviceName={service.name}
        existingAccess={existingAccessForDialog}
        editingRule={
          editingRule
            ? {
                id: editingRule.id,
                sectorId: editingRule.sector.id,
                roleId: Number(editingRule.role.id),
                actions: editingRule.actions,
                isActive: editingRule.isActive,
              }
            : null
        }
        onSubmit={handleCreateOrUpdate}
      />

      {/* REMOVE CONFIRMATION */}
      <DeleteModal
        isOpen={!!removing}
        onClose={() => setRemoving(null)}
        action={handleConfirmRemove}
      />
    </div>
  );
}