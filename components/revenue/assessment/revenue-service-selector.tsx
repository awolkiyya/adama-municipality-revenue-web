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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import type { RevenueService } from "@/types/revenue/assessment";

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
};

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
}: RevenueServiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
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
    for (const s of services) counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
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
    for (const list of grouped.values()) list.sort((a, b) => a.name.localeCompare(b.name));

    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [services, categoryFilter]);

  const isSelected = (id: string) => selectedServiceIds.includes(id);

  // This is the only branch point for single vs multi behavior.
  const toggleService = (id: string) => {
    if (disabled) return;

    if (isSingle) {
      onChange([id]);
      setOpen(false); // picking a value closes the combobox, like a normal select
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
  };

  return (
    <div className="rounded-xl border-none bg-card shadow-xs p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Landmark className="h-4 w-4 text-primary" />
          Revenue Services
          {!isSingle && selectedServices.length > 0 && (
            <Badge variant="secondary">{selectedServices.length}</Badge>
          )}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isSingle
            ? "Select the applicable municipal revenue service."
            : "Select one or more applicable municipal revenue services."}
        </p>
      </div>

      <div>
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
              disabled={disabled}
              className="mt-2 h-auto min-h-11 w-full justify-between py-2 font-normal"
            >
              {isSingle ? (
                selectedServices[0] ? (
                  <span className="flex min-w-0 flex-col items-start text-left">
                    <span className="truncate text-sm font-medium">
                      {selectedServices[0].name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {selectedServices[0].code}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground truncate">{placeholder}</span>
                )
              ) : (
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-left">
                  {selectedServices.length === 0 ? (
                    <span className="text-muted-foreground">{placeholder}</span>
                  ) : (
                    <>
                      {selectedServices.slice(0, 3).map((s) => (
                        <Badge key={s.id} variant="secondary" className="max-w-[180px] truncate">
                          {s.name}
                        </Badge>
                      ))}
                      {selectedServices.length > 3 && (
                        <Badge variant="outline">+{selectedServices.length - 3} more</Badge>
                      )}
                    </>
                  )}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            className="w-[var(--radix-popover-trigger-width)] p-0"
          >
            <Command>
              <CommandInput placeholder={placeholder} />

              <div className="flex flex-wrap gap-1.5 border-b p-2">
                <CategoryChip
                  label={`All · ${services.length}`}
                  active={categoryFilter === null}
                  onClick={() => setCategoryFilter(null)}
                  disabled={disabled}
                />
                {categoryCounts.map(([category, count]) => (
                  <CategoryChip
                    key={category}
                    label={`${category} · ${count}`}
                    dotColor={categoryColor(category)}
                    active={categoryFilter === category}
                    disabled={disabled}
                    onClick={() =>
                      setCategoryFilter((c) => (c === category ? null : category))
                    }
                  />
                ))}
              </div>

              <CommandList className="max-h-[320px] overflow-y-auto">
                <CommandEmpty>No revenue service found.</CommandEmpty>

                {servicesByCategory.map(([category, categoryServices]) => (
                  <CommandGroup
                    key={category}
                    heading={
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${categoryColor(category)}`} />
                        {category}
                      </span>
                    }
                  >
                    {categoryServices.map((service) => (
                      <CommandItem
                        key={service.id}
                        value={`${service.name} ${service.code} ${service.category}`}
                        onSelect={() => toggleService(service.id)}
                        className="py-3"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 shrink-0 ${
                            isSelected(service.id) ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{service.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{service.code}</p>
                        </div>
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
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>

              {!isSingle && (
                <div className="flex items-center justify-between gap-2 border-t p-2.5">
                  <span className="text-xs text-muted-foreground">
                    {selectedServices.length === 0
                      ? "No services selected"
                      : `${selectedServices.length} selected`}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={disabled || selectedServices.length === 0}
                      onClick={clearAll}
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
              )}
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* In single mode there's nothing extra to show below — the trigger already shows the pick. */}
      {!isSingle && selectedServices.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Selected services</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={disabled}
              onClick={clearAll}
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
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </div>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${categoryColor(service.category)}`}
                  title={service.category}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{service.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {service.code} · {service.category}
                  </p>
                </div>
                <Badge variant="secondary" className="hidden shrink-0 text-[10px] sm:inline-flex">
                  {formatCollectionMode(service.collectionMode)}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  disabled={disabled}
                  aria-label={`Remove ${service.name}`}
                  onClick={() => removeService(service.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
  disabled,
  dotColor,
}: {
  label: string;
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-transparent bg-muted text-muted-foreground hover:bg-muted/70"
      }`}
    >
      {dotColor && <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />}
      {label}
    </button>
  );
}