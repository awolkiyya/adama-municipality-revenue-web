// components/commen/FilterSheet.tsx
"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Filters } from "@/components/commen/Filters";
import { FilterField } from "@/types/commen";

/*
|--------------------------------------------------------------------------
| FilterSheet
|--------------------------------------------------------------------------
|
| A reusable, drop-in replacement for inline filter rows across the system.
| Wraps any `Filters` schema in a side Sheet with draft/apply/reset semantics:
|
| - Selecting options inside the sheet does NOT refetch data immediately.
| - Changes only take effect when the user clicks "Apply Filters".
| - "Reset all" clears the in-progress draft, not the applied filters.
| - Trigger button shows a badge with the count of active (non-default) filters.
| - An optional "Clear filters" ghost button appears outside the sheet
|   when filters are active, for a one-click reset without opening it.
|
| USAGE
| -----
| <FilterSheet
|   schema={revenueServiceFilters}
|   value={filters}
|   defaultValues={INITIAL_FILTERS}
|   onChange={(next) => {
|     setFilters(next);
|     setPage(1); // reset pagination on filter change, page-specific
|   }}
| />
|
*/

interface FilterSheetProps {
  /* Field schema, same shape used by <Filters /> everywhere else. */
  schema: FilterField[];

  /* Currently APPLIED filter values (owned by the parent page/query). */
  value: Record<string, any>;

  /* Values to compare against + reset to. Usually your page's INITIAL_FILTERS. */
  defaultValues: Record<string, any>;

  /* Called only when the user clicks "Apply Filters". */
  onChange: (next: Record<string, any>) => void;

  /* Optional copy overrides, so each page can customize without a new component. */
  title?: string;
  description?: string;

  /* Optional: hide the standalone "Clear filters" button next to the trigger. */
  hideClearButton?: boolean;

  /* Optional: override sheet width class, e.g. "sm:max-w-lg" for filter-heavy pages. */
  contentClassName?: string;
}

export function FilterSheet({
  schema,
  value,
  defaultValues,
  onChange,
  title = "Filters",
  description = "Narrow down the list using the options below.",
  hideClearButton = false,
  contentClassName = "sm:max-w-md",
}: FilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>(value);

  /*
  |--------------------------------------------------------------------------
  | Keep the draft in sync whenever the applied value changes externally
  | (e.g. a "Clear filters" click outside the sheet, or a reset elsewhere).
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!isOpen) {
      setDraft(value);
    }
  }, [value, isOpen]);

  const activeFilterCount = Object.entries(value).filter(
    ([key, val]) => val !== undefined && val !== null && val !== defaultValues[key]
  ).length;

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Seed the draft from whatever is currently applied, so reopening
      // never shows stale or half-finished selections from a prior session.
      setDraft(value);
    }
    setIsOpen(open);
  };

  const handleApply = () => {
    onChange(draft);
    setIsOpen(false);
  };

  const handleResetDraft = () => {
    setDraft(defaultValues);
  };

  const handleClearApplied = () => {
    onChange(defaultValues);
    setDraft(defaultValues);
  };

  return (
    <div className="flex items-center gap-2">
      {!hideClearButton && activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearApplied}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}

      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="default"
                className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px]"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent side="right" className={`flex w-full flex-col py-5 ${contentClassName}`}>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              {title}
            </SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          <Separator />

          <div className="flex-1 overflow-y-auto px-1 py-4">
            <Filters
              schema={schema}
              value={draft}
              onChange={setDraft}
              onReset={handleResetDraft}
              layout="column"
              resetPosition="end"
            />
          </div>

          <Separator />

          <SheetFooter className="gap-2 sm:justify-between">
           

            <div className="flex gap-2">
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>

              <Button onClick={handleApply}>Apply Filters</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}