"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { ListChecks, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";

import type { PermissionSelectorProps } from "@/types/permission.types";
import { PermissionModuleCard } from "../cards/PermissionModuleCard";

export function PermissionSelector({
  groups,
  value,
  onChange,
  disabled = false,
//   isLoading = false,
}: PermissionSelectorProps) {
  const [search, setSearch] = useState("");
  // Lets typing stay responsive on large catalogs — filtering lags one
  // tick behind the input instead of blocking every keystroke.
  const deferredSearch = useDeferredValue(search);

  // Which modules the admin has manually expanded/collapsed. Seeded with
  // whatever already has a selection, so existing roles open pre-scoped.
  const [openModules, setOpenModules] = useState<string[]>(() =>
    groups
      .filter((group) => group.permissions.some((p) => value.includes(p.name)))
      .map((group) => group.key)
  );

  const selectedSet = useMemo(() => new Set(value), [value]);

  const totalPermissions = useMemo(
    () => groups.reduce((total, group) => total + group.permissions.length, 0),
    [groups]
  );

  const filteredGroups = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return groups;

    return groups
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (permission) =>
            permission.name.toLowerCase().includes(query) ||
            permission.label?.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [groups, deferredSearch]);

  const visibleKeys = useMemo(
    () => filteredGroups.flatMap((group) => group.permissions.map((p) => p.name)),
    [filteredGroups]
  );

  const isSearching = deferredSearch.trim().length > 0;
  // While searching, force every module with a match open so results
  // aren't hidden behind a collapsed accordion; revert to the admin's
  // manual state as soon as the search clears.
  const openAccordionValues = isSearching
    ? filteredGroups.map((group) => group.key)
    : openModules;

  const allVisibleSelected =
    visibleKeys.length > 0 && visibleKeys.every((key) => selectedSet.has(key));

  const overallProgress = totalPermissions > 0 ? (value.length / totalPermissions) * 100 : 0;

  const handleModuleChange = useCallback(
    (permissions: string[]) => {
      const next = new Set(selectedSet);
      permissions.forEach((permission) => {
        if (next.has(permission)) next.delete(permission);
        else next.add(permission);
      });
      onChange(Array.from(next));
    },
    [selectedSet, onChange]
  );

  const selectAllVisible = useCallback(() => {
    const next = new Set(selectedSet);
    visibleKeys.forEach((key) => next.add(key));
    onChange(Array.from(next));
  }, [selectedSet, visibleKeys, onChange]);

  const clearVisible = useCallback(() => {
    const next = new Set(selectedSet);
    visibleKeys.forEach((key) => next.delete(key));
    onChange(Array.from(next));
  }, [selectedSet, visibleKeys, onChange]);

//   if (isLoading) {
//     return (
//       <div className="space-y-4">
//         <Skeleton className="h-14 w-full rounded-lg" />
//         <Skeleton className="h-9 w-full" />
//         <div className="space-y-2">
//           {Array.from({ length: 4 }).map((_, i) => (
//             <Skeleton key={i} className="h-14 w-full rounded-lg" />
//           ))}
//         </div>
//       </div>
//     );
//   }

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center">
        <p className="text-sm font-medium">No permission modules configured</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Permission modules will show up here once they&rsquo;re set up.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold leading-none">Permissions</h3>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Choose what this role can see and do
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ListChecks className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium tabular-nums">
            {value.length}/{totalPermissions}
          </span>
          <Progress value={overallProgress} className="h-1.5 w-24" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={disabled}
            aria-label="Search permissions"
            className="pl-8 pr-8 py-5"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || allVisibleSelected || visibleKeys.length === 0}
            onClick={selectAllVisible}
            className="py-5"
          >
            Select all{isSearching ? " matching" : ""}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || value.length === 0}
            onClick={clearVisible}
            className="py-5"

          >
            Clear{isSearching ? " matching" : " all"}
          </Button>
        </div>
      </div>

      {/* Modules */}
      {filteredGroups.length === 0 ? (
        <div className="rounded-lg border border-dashed py-10 text-center">
          <p className="text-sm font-medium">No permissions match &ldquo;{search}&rdquo;</p>
          <p className="mt-1 text-xs text-muted-foreground">Try a different search term.</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => setSearch("")}
          >
            Clear search
          </Button>
        </div>
      ) : (
        <Accordion
          type="multiple"
          value={openAccordionValues}
          onValueChange={setOpenModules}
          className="space-y-2"
        >
          {filteredGroups.map((group) => (
  <PermissionModuleCard
    key={group.key}
    value={group.key}
    group={group}
    selected={selectedSet}
    onChange={handleModuleChange}
    disabled={disabled}
  />
))}
        </Accordion>
      )}
    </div>
  );
}