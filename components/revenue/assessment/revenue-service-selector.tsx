"use client";

import { useMemo, useState } from "react";

import { Check, ChevronsUpDown, Landmark, Layers, X } from "lucide-react";

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

import type { RevenueService } from "@/types/revenue/assessment";

// =====================================================
// TYPES
// =====================================================
//
// NOTE: `RevenueService` here is the *adapted* shape
// produced by mapRevenueService() on the assessment
// page — { id, code, category, name, description,
// collectionMode: string, fields } — not the raw API
// type from @/types/revenue/revenu-service. Don't mix
// the two up; this selector only ever sees the adapted
// shape, and category/code are guaranteed to exist.
// =====================================================

type RevenueServiceSelectorProps = {
  services: RevenueService[];

  selectedServiceIds: string[];

  onChange: (serviceIds: string[]) => void;

  /**
   * Called whenever a service is removed.
   * Parent should immediately delete all
   * field values belonging to that service.
   */
  onRemoveService?: (serviceId: string) => void;

  /**
   * Called when all services are cleared.
   */
  onClearServices?: () => void;

  disabled?: boolean;
};

// =====================================================
// COLLECTION METHOD LABEL
// =====================================================
//
// PRESENTATION ONLY — does not perform pricing.
// Known values are the API's CollectionMode enum
// (ASSESSMENT_ONLY / FIELD_COLLECTION / BOTH), but
// this field arrives here as a plain string, so unknown
// values fall back to a readable Title Case label
// instead of breaking.
// =====================================================

const COLLECTION_METHOD_LABEL: Record<string, string> = {
  ASSESSMENT_ONLY: "Assessment Only",
  FIELD_COLLECTION: "Field Collection",
  BOTH: "Assessment + Field",
};

export const formatCollectionMode = (
  mode: string | null | undefined,
): string => {
  if (!mode) return "Not specified";

  const normalized = String(mode).trim().toUpperCase().replace(/[\s-]+/g, "_");

  if (COLLECTION_METHOD_LABEL[normalized]) {
    return COLLECTION_METHOD_LABEL[normalized];
  }

  // Graceful fallback for future/unknown collection methods.
  return normalized
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// =====================================================
// CATEGORY COLOR
// =====================================================
//
// Categories come from revenueCode.name — free text set
// by whoever configures revenue codes, not a fixed enum.
// A deterministic color per category (rather than a
// hardcoded icon map) keeps grouping visually scannable
// without assuming a closed set of categories.
// =====================================================

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

const categoryColor = (category: string): string => {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
};

// =====================================================
// COMPONENT
// =====================================================

export function RevenueServiceSelector({
  services,
  selectedServiceIds,
  onChange,
  onRemoveService,
  onClearServices,
  disabled = false,
}: RevenueServiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // ===================================================
  // SELECTED SERVICES
  // ===================================================

  const selectedServices = useMemo(() => {
    // Map using selectedServiceIds instead of filtering
    // services directly — preserves selection order.
    return selectedServiceIds
      .map((id) => services.find((service) => service.id === id))
      .filter((service): service is RevenueService => Boolean(service));
  }, [services, selectedServiceIds]);

  // ===================================================
  // CATEGORIES
  // ===================================================

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const service of services) {
      counts.set(service.category, (counts.get(service.category) ?? 0) + 1);
    }

    return Array.from(counts.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
  }, [services]);

  // ===================================================
  // FILTERED / GROUPED SERVICES
  // ===================================================

  const servicesByCategory = useMemo(() => {
    const filtered =
      categoryFilter === null
        ? services
        : services.filter((service) => service.category === categoryFilter);

    const grouped = new Map<string, RevenueService[]>();

    for (const service of filtered) {
      const current = grouped.get(service.category) ?? [];
      current.push(service);
      grouped.set(service.category, current);
    }

    for (const list of grouped.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return Array.from(grouped.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
  }, [services, categoryFilter]);

  // ===================================================
  // HELPERS
  // ===================================================

  const isServiceSelected = (serviceId: string) =>
    selectedServiceIds.includes(serviceId);

  // ===================================================
  // TOGGLE SERVICE
  // ===================================================

  const handleServiceToggle = (serviceId: string) => {
    if (disabled) return;

    const alreadySelected = selectedServiceIds.includes(serviceId);

    if (alreadySelected) {
      onChange(selectedServiceIds.filter((id) => id !== serviceId));
      onRemoveService?.(serviceId);
      return;
    }

    // Append new service — selection order stays stable.
    onChange([...selectedServiceIds, serviceId]);
  };

  // ===================================================
  // REMOVE SERVICE
  // ===================================================

  const handleRemoveService = (serviceId: string) => {
    if (disabled) return;
    onChange(selectedServiceIds.filter((id) => id !== serviceId));
    onRemoveService?.(serviceId);
  };

  // ===================================================
  // CLEAR ALL
  // ===================================================

  const handleClearAll = () => {
    if (disabled || selectedServiceIds.length === 0) return;
    onChange([]);
    onClearServices?.();
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* HEADER */}
      <div className="flex items-center gap-3 border-b p-5 sm:p-6">
        <div className="rounded-lg bg-primary/10 p-2">
          <Landmark className="h-4 w-4 text-primary" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Revenue Services</h2>

            {selectedServices.length > 0 && (
              <Badge variant="secondary">{selectedServices.length}</Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Select one or more applicable municipal revenue services.
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="space-y-4 p-5 sm:p-6">
        <div>
          <Label htmlFor="revenue-service-selector">
            Revenue services
            <span className="ml-1 text-destructive">*</span>
          </Label>

          {/* COMBOBOX */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id="revenue-service-selector"
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                disabled={disabled}
                className="mt-2 h-auto min-h-11 w-full justify-between py-2 font-normal"
              >
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-left">
                  {selectedServices.length === 0 ? (
                    <span className="text-muted-foreground">
                      Search and select revenue services...
                    </span>
                  ) : (
                    <>
                      {selectedServices.slice(0, 3).map((service) => (
                        <Badge
                          key={service.id}
                          variant="secondary"
                          className="max-w-full"
                        >
                          <span className="max-w-[180px] truncate">
                            {service.name}
                          </span>
                        </Badge>
                      ))}

                      {selectedServices.length > 3 && (
                        <Badge variant="outline">
                          +{selectedServices.length - 3} more
                        </Badge>
                      )}
                    </>
                  )}
                </span>

                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            <PopoverContent
              align="start"
              sideOffset={6}
              className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] overflow-hidden p-0"
            >
              <Command>
                <CommandInput placeholder="Search revenue services..." />

                {/* CATEGORY FILTERS */}
                <div className="flex flex-wrap gap-1.5 border-b p-2">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setCategoryFilter(null)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                      categoryFilter === null
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    All · {services.length}
                  </button>

                  {categoryCounts.map(([category, count]) => {
                    const active = categoryFilter === category;

                    return (
                      <button
                        key={category}
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          setCategoryFilter((current) =>
                            current === category ? null : category,
                          )
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-transparent bg-muted text-muted-foreground hover:bg-muted/70"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${categoryColor(category)}`}
                        />
                        {category} · {count}
                      </button>
                    );
                  })}
                </div>

                {/* SERVICE LIST */}
                <CommandList className="max-h-[320px] overflow-y-auto">
                  <CommandEmpty>No revenue service found.</CommandEmpty>

                  {servicesByCategory.map(([category, categoryServices]) => (
                    <CommandGroup
                      key={category}
                      heading={
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${categoryColor(category)}`}
                          />
                          {category}
                        </span>
                      }
                    >
                      {categoryServices.map((service) => {
                        const selected = isServiceSelected(service.id);

                        return (
                          <CommandItem
                            key={service.id}
                            value={`${service.name} ${service.code} ${service.category}`}
                            onSelect={() => handleServiceToggle(service.id)}
                            className="py-3"
                          >
                            {/* CHECKBOX */}
                            <div
                              className={`mr-3 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/30"
                              }`}
                            >
                              {selected && <Check className="h-3 w-3" />}
                            </div>

                            {/* SERVICE */}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {service.name}
                              </p>

                              <p className="truncate text-xs text-muted-foreground">
                                {service.code}
                              </p>
                            </div>

                            {/* META */}
                            <div className="ml-2 flex shrink-0 items-center gap-1.5">
                              {service.fields.length > 0 && (
                                <Badge variant="outline" className="text-[10px]">
                                  <Layers className="mr-1 h-2.5 w-2.5" />
                                  {service.fields.length}
                                </Badge>
                              )}

                              <Badge variant="outline" className="text-[10px]">
                                {formatCollectionMode(service.collectionMode)}
                              </Badge>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ))}
                </CommandList>

                {/* FOOTER */}
                <div className="flex items-center justify-between gap-2 border-t p-2.5">
                  <span className="text-xs text-muted-foreground">
                    {selectedServices.length === 0
                      ? "No services selected"
                      : `${selectedServices.length} service${
                          selectedServices.length === 1 ? "" : "s"
                        } selected`}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={disabled || selectedServices.length === 0}
                      onClick={handleClearAll}
                    >
                      Clear
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={disabled}
                      onClick={() => setOpen(false)}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* SELECTED SERVICES */}
        {selectedServices.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Selected services
              </p>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                disabled={disabled}
                onClick={handleClearAll}
              >
                Clear all
              </Button>
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {selectedServices.map((service, index) => (
                <div
                  key={service.id}
                  className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3"
                >
                  {/* ORDER */}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </div>

                  {/* CATEGORY DOT */}
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${categoryColor(service.category)}`}
                    title={service.category}
                  />

                  {/* SERVICE */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {service.name}
                    </p>

                    <p className="truncate text-xs text-muted-foreground">
                      {service.code} · {service.category}
                    </p>
                  </div>

                  {/* COLLECTION METHOD */}
                  <Badge
                    variant="secondary"
                    className="hidden shrink-0 text-[10px] sm:inline-flex"
                  >
                    {formatCollectionMode(service.collectionMode)}
                  </Badge>

                  {/* REMOVE */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    disabled={disabled}
                    aria-label={`Remove ${service.name}`}
                    onClick={() => handleRemoveService(service.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}