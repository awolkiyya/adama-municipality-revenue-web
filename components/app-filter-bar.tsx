"use client";

import { useState, type ReactNode } from "react";
import { Filter, RotateCcw, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type AppFilterBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;

  children: ReactNode;

  onApply: () => void;
  onClear: () => void;

  activeFilterCount?: number;
  hasFilters?: boolean;

  title?: string;
  description?: string;

  className?: string;
};

export function AppFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  searchLabel = "Search",
  children,
  onApply,
  onClear,
  activeFilterCount = 0,
  hasFilters = false,
  title = "Filters",
  description = "Configure the filters to narrow down your results.",
  className,
}: AppFilterBarProps) {
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    onApply();
    setOpen(false);
  };

  const handleClear = () => {
    onClear();
    setOpen(false);
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />

          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchLabel}
            className="h-10 pl-9 pr-9"
          />

          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Clear search"
              className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
              onClick={() => onSearchChange("")}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 gap-2">
                <Filter className="size-4" />
                Filters

                {activeFilterCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="flex w-full flex-col gap-0 sm:max-w-md"
            >
              <SheetHeader className="border-b px-6 py-5 text-left">
                <SheetTitle>{title}</SheetTitle>
                <SheetDescription>{description}</SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                {children}
              </div>

              <SheetFooter className="border-t px-6 py-4 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="gap-2"
                >
                  <RotateCcw className="size-4" />
                  Clear filters
                </Button>

                <Button type="button" onClick={handleApply}>
                  Apply filters
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              className="h-10"
              onClick={handleClear}
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppFilterBar;