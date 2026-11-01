
"use client";

import { useState } from "react";
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

/* =========================================================
   TYPES
========================================================= */

type FilterValues = Record<string, unknown>;

interface FilterSheetProps {
  /**
   * Field schema used by the Filters component.
   */
  schema: FilterField[];

  /**
   * Currently applied filter values.
   */
  value: FilterValues;

  /**
   * Default values used for comparison and reset.
   */
  defaultValues: FilterValues;

  /**
   * Called when the user applies filters.
   */
  onChange: (next: FilterValues) => void;

  /**
   * Optional display configuration.
   */
  title?: string;
  description?: string;
  hideClearButton?: boolean;
  contentClassName?: string;
}

/* =========================================================
   COMPONENT
========================================================= */

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
  /* =========================================================
     STATE
  ========================================================= */

  const [isOpen, setIsOpen] = useState(false);

  const [draft, setDraft] = useState<FilterValues>(() => ({
    ...value,
  }));

  /* =========================================================
     ACTIVE FILTER COUNT
  ========================================================= */

  const activeFilterCount = Object.entries(value).filter(
    ([key, val]) =>
      val !== undefined &&
      val !== null &&
      val !== defaultValues[key]
  ).length;

  /* =========================================================
     OPEN / CLOSE
  ========================================================= */

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Always initialize from the currently applied filters.
      // This prevents stale draft values when reopening the sheet.
      setDraft({
        ...value,
      });
    }

    setIsOpen(open);
  };

  /* =========================================================
     APPLY FILTERS
  ========================================================= */

  const handleApply = () => {
    onChange({
      ...draft,
    });

    setIsOpen(false);
  };

  /* =========================================================
     RESET DRAFT
  ========================================================= */

  const handleResetDraft = () => {
    setDraft({
      ...defaultValues,
    });
  };

  /* =========================================================
     CLEAR APPLIED FILTERS
  ========================================================= */

  const handleClearApplied = () => {
    const resetValues = {
      ...defaultValues,
    };

    onChange(resetValues);
    setDraft(resetValues);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="flex items-center gap-2">

      {/* =====================================================
          CLEAR FILTERS BUTTON
      ===================================================== */}

      {!hideClearButton && activeFilterCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClearApplied}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}

      {/* =====================================================
          FILTER SHEET
      ===================================================== */}

      <Sheet
        open={isOpen}
        onOpenChange={handleOpenChange}
      >
        {/* TRIGGER */}

        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="relative gap-2 p-5"
          >
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

        {/* CONTENT */}

        <SheetContent
          side="right"
          className={`flex w-full flex-col p-5 ${contentClassName}`}
        >
          {/* HEADER */}

          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              {title}
            </SheetTitle>

            <SheetDescription>
              {description}
            </SheetDescription>
          </SheetHeader>

          <Separator />

          {/* FILTER FIELDS */}

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

          {/* FOOTER */}

          <SheetFooter className="gap-2 sm:justify-between">
            <div className="flex w-full justify-end gap-2">
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              </SheetClose>

              <Button
                type="button"
                onClick={handleApply}
              >
                Apply Filters
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
