"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Landmark,
  Layers,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { RevenueService } from "@/types/revenue/assessment";

/* -------------------------------------------------------------------------- */
/* Types & constants                                                          */
/* -------------------------------------------------------------------------- */

type SelectionMode = "single" | "multi";

type RevenueServiceSelectorProps = {
  services: RevenueService[];
  /** "multi" (default) allows several services; "single" allows exactly one. */
  mode?: SelectionMode;
  /** Always an array of ids, even in single mode (empty [] or [oneId]). */
  selectedServiceIds: string[];
  onChange: (serviceIds: string[]) => void;
  onRemoveService?: (serviceId: string) => void;
  onClearServices?: () => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  /** Validation message shown under the field. */
  error?: string;
};

/** Selected services shown before the list collapses behind "Show all". */
const COLLAPSED_COUNT = 4;

const COLLECTION_METHOD_LABEL: Record<string, string> = {
  ASSESSMENT_ONLY: "Assessment Only",
  FIELD_COLLECTION: "Field Collection",
  BOTH: "Assessment + Field",
};

export function formatCollectionMode(mode: string | null | undefined): string {
  if (!mode) return "Not specified";
  const key = String(mode).trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (COLLECTION_METHOD_LABEL[key]) return COLLECTION_METHOD_LABEL[key];
  return key
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const CATEGORY_PALETTE = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
];

function categoryColor(category: string): string {
  let hash = 0;
  for (const char of category) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function RevenueServiceSelector({
  services,
  mode = "multi",
  selectedServiceIds,
  onChange,
  onRemoveService,
  onClearServices,
  disabled = false,
  label = "Revenue services",
  placeholder = "Search revenue services...",
  error,
}: RevenueServiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showAllSelected, setShowAllSelected] = useState(false);
  const isSingle = mode === "single";

  const selectedServices = useMemo(
    () =>
      selectedServiceIds
        .map((id) => services.find((s) => s.id === id))
        .filter((s): s is RevenueService => Boolean(s)),
    [services, selectedServiceIds],
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of services) {
      counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [services]);

  const servicesByCategory = useMemo(() => {
    const filtered = categoryFilter
      ? services.filter((s) => s.category === categoryFilter)
      : services;

    const grouped = new Map<string, RevenueService[]>();
    for (const s of filtered) {
      grouped.set(s.category, [...(grouped.get(s.category) ?? []), s]);
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [services, categoryFilter]);

  const isSelected = (id: string) => selectedServiceIds.includes(id);

  // The only branch point for single vs multi behavior.
  const toggleService = (id: string) => {
    if (disabled) return;

    if (isSingle) {
      onChange([id]);
      setOpen(false);
      return;
    }

    if (isSelected(id)) {
      onChange(selectedServiceIds.filter((sid) => sid !== id));
      onRemoveService?.(id);
    } else {
      onChange([...selectedServiceIds, id]);
    }
  };

  const removeService = (id: string) => {
    if (disabled) return;
    onChange(selectedServiceIds.filter((sid) => sid !== id));
    onRemoveService?.(id);
  };

  const clearAll = () => {
    if (disabled || selectedServiceIds.length === 0) return;
    onChange([]);
    onClearServices?.();
    setShowAllSelected(false);
  };

  const hiddenCount = Math.max(0, selectedServices.length - COLLAPSED_COUNT);
  const visibleSelected = showAllSelected
    ? selectedServices
    : selectedServices.slice(0, COLLAPSED_COUNT);

  const firstSelected = selectedServices[0];

  return (
    <section className="min-w-0 max-w-full space-y-5 rounded-xl border bg-card p-5 sm:p-6">
      {/* Header */}
      <header className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Landmark className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold leading-tight">
            Revenue services
            {!isSingle && selectedServices.length > 0 && (
              <Badge variant="secondary" className="tabular-nums">
                {selectedServices.length}
              </Badge>
            )}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSingle
              ? "Choose the applicable municipal revenue service."
              : "Choose one or more applicable municipal revenue services."}
          </p>
        </div>
      </header>

      {/* Selector */}
      <div className="min-w-0 space-y-2">
        <Label htmlFor="revenue-service-selector">
          {label} <span className="text-destructive">*</span>
        </Label>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="revenue-service-selector"
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-invalid={Boolean(error)}
              disabled={disabled}
              className={cn(
                "h-auto min-h-12 w-full min-w-0 max-w-full justify-between gap-3 overflow-hidden px-3 py-2 font-normal",
                error && "border-destructive",
              )}
            >
              {/*
               * The trigger is always a fixed-height, single-line summary.
               * Full details live in the list and the "Selected" panel, so a
               * long name can never stretch the field.
               */}
              {isSingle ? (
                firstSelected ? (
                  <span
                    className="min-w-0 flex-1 text-left"
                    title={`${firstSelected.name} (${firstSelected.code})`}
                  >
                    <span className="block truncate text-sm font-medium">
                      {firstSelected.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {firstSelected.code}
                    </span>
                  </span>
                ) : (
                  <span className="truncate text-sm text-muted-foreground">
                    {placeholder}
                  </span>
                )
              ) : selectedServices.length === 0 ? (
                <span className="truncate text-sm text-muted-foreground">
                  {placeholder}
                </span>
              ) : (
                <span
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  title={selectedServices.map((s) => s.name).join(", ")}
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {firstSelected.name}
                  </span>
                  {selectedServices.length > 1 && (
                    <Badge
                      variant="secondary"
                      className="shrink-0 tabular-nums"
                    >
                      +{selectedServices.length - 1} more
                    </Badge>
                  )}
                </span>
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            sideOffset={6}
            className="w-[var(--radix-popover-trigger-width)] min-w-[320px] max-w-[calc(100vw-2rem)] p-0 shadow-lg"
          >
            <Command>
              <CommandInput placeholder={placeholder} />

              {/* Category filters: one scrollable row, never a tall wrap */}
              <div
                role="toolbar"
                aria-label="Filter by category"
                className="flex gap-1.5 overflow-x-auto border-b px-2 py-2 [scrollbar-width:thin]"
              >
                <CategoryChip
                  label="All"
                  count={services.length}
                  active={categoryFilter === null}
                  onClick={() => setCategoryFilter(null)}
                  disabled={disabled}
                />
                {categoryCounts.map(([category, count]) => (
                  <CategoryChip
                    key={category}
                    label={category}
                    count={count}
                    dotColor={categoryColor(category)}
                    active={categoryFilter === category}
                    disabled={disabled}
                    onClick={() =>
                      setCategoryFilter((c) => (c === category ? null : category))
                    }
                  />
                ))}
              </div>

              <CommandList className="max-h-[340px] overflow-y-auto">
                <CommandEmpty>
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm font-medium">No service found</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Try a different name or code
                      {categoryFilter ? ", or clear the category filter." : "."}
                    </p>
                  </div>
                </CommandEmpty>

                {servicesByCategory.map(([category, categoryServices]) => (
                  <CommandGroup
                    key={category}
                    heading={
                      <span
                        className="flex min-w-0 items-center gap-1.5"
                        title={category}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            categoryColor(category),
                          )}
                        />
                        <span className="truncate">{category}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground/70">
                          {categoryServices.length}
                        </span>
                      </span>
                    }
                  >
                    {categoryServices.map((service) => {
                      const selected = isSelected(service.id);
                      const fieldCount = service.fields.length;

                      return (
                        <CommandItem
                          key={service.id}
                          value={`${service.name} ${service.code} ${service.category}`}
                          onSelect={() => toggleService(service.id)}
                          className="min-w-0 items-start gap-3 overflow-hidden rounded-md px-2 py-2.5"
                        >
                          {/* Checkbox in multi mode, check in single mode */}
                          {isSingle ? (
                            <Check
                              className={cn(
                                "mt-0.5 h-4 w-4 shrink-0 text-primary",
                                selected ? "opacity-100" : "opacity-0",
                              )}
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className={cn(
                                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/40",
                              )}
                            >
                              {selected && <Check className="h-3 w-3" />}
                            </span>
                          )}

                          {/*
                           * Name gets the full row width and wraps to two
                           * lines; badges sit underneath instead of competing
                           * with the name for horizontal space.
                           */}
                          <div className="min-w-0 flex-1">
                            <p
                              title={service.name}
                              className="truncate text-sm font-medium"
                            >
                              {service.name}
                            </p>
                            <p
                              title={service.code!}
                              className="mt-0.5 truncate text-xs text-muted-foreground"
                            >
                              {service.code}
                            </p>

                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="max-w-full truncate text-[10px] font-normal"
                              >
                                {formatCollectionMode(service.collectionMode)}
                              </Badge>
                              {fieldCount > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-normal"
                                >
                                  <Layers className="mr-1 h-2.5 w-2.5" />
                                  {fieldCount} {fieldCount === 1 ? "field" : "fields"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ))}
              </CommandList>

              {!isSingle && (
                <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-3 py-2.5">
                  <span
                    className="text-xs text-muted-foreground"
                    aria-live="polite"
                  >
                    {selectedServices.length === 0
                      ? "None selected"
                      : `${selectedServices.length} selected`}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={disabled || selectedServices.length === 0}
                      onClick={clearAll}
                    >
                      Clear
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={disabled}
                      onClick={() => setOpen(false)}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </Command>
          </PopoverContent>
        </Popover>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      {/* Selected services (multi mode only; single mode shows it in the trigger) */}
      {!isSingle && selectedServices.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              Selected services
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              disabled={disabled}
              onClick={clearAll}
            >
              Clear all
            </Button>
          </div>

          <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {visibleSelected.map((service) => (
              <li
                key={service.id}
                className="flex min-w-0 items-start gap-3 overflow-hidden rounded-lg border bg-muted/20 p-3"
              >
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    categoryColor(service.category),
                  )}
                  title={service.category}
                  aria-hidden="true"
                />

                <div className="min-w-0 flex-1">
                  <p
                    title={service.name}
                    className="truncate text-sm font-medium"
                  >
                    {service.name}
                  </p>
                  <p
                    title={`${service.code} · ${service.category}`}
                    className="mt-0.5 truncate text-xs text-muted-foreground"
                  >
                    {service.code} · {service.category}
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-1.5 max-w-full truncate text-[10px] font-normal"
                  >
                    {formatCollectionMode(service.collectionMode)}
                  </Badge>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="-mr-1 -mt-1 h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={disabled}
                  aria-label={`Remove ${service.name}`}
                  onClick={() => removeService(service.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>

          {hiddenCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full text-xs text-muted-foreground"
              onClick={() => setShowAllSelected((v) => !v)}
            >
              {showAllSelected ? (
                <>
                  <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
                  Show fewer
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
                  Show {hiddenCount} more
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Category chip                                                              */
/* -------------------------------------------------------------------------- */

function CategoryChip({
  label,
  count,
  active,
  onClick,
  disabled,
  dotColor,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  dotColor?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      title={`${label} (${count})`}
      className={cn(
        "inline-flex max-w-[200px] shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-transparent bg-muted text-muted-foreground hover:bg-muted/70",
      )}
    >
      {dotColor && (
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotColor)} />
      )}
      <span className="truncate">{label}</span>
      <span className="shrink-0 tabular-nums opacity-70">{count}</span>
    </button>
  );
}