
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  MapPin,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { useCitizens } from "@/hooks/useCitizen.hook";
import type { Citizen } from "@/types/citizen";

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

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type TaxpayerSelectorProps = {
  value: string;
  onChange: (taxpayerId: string) => void;
  disabled?: boolean;
};

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function TaxpayerSelector({
  value,
  onChange,
  disabled = false,
}: TaxpayerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  /*
   * Debounce search input to avoid requesting the API on every keystroke.
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  /*
   * Server-side search and pagination through the existing hook.
   *
   * Assumes useCitizens returns the standard TanStack Query result and
   * citizenService.getAll returns ApiResponse<Citizen[]>.
   */
  const citizensQuery = useCitizens({
    search: search || undefined,
    page,
    per_page: PAGE_SIZE,
    sort_by: "full_name",
    sort_direction: "asc",
  });

  const taxpayers = useMemo<Citizen[]>(() => {
    const response = citizensQuery.data;

    if (!response || response.success !== true) {
      return [];
    }

    return Array.isArray(response.data) ? response.data : [];
  }, [citizensQuery.data]);

  const pagination = useMemo(() => {
    const meta = citizensQuery.data?.meta;

    return {
      currentPage: meta?.current_page ?? page,
      lastPage: meta?.last_page ?? 1,
      total: meta?.total ?? taxpayers.length,
      from: meta?.from ?? (taxpayers.length ? 1 : null),
      to: meta?.to ?? taxpayers.length,
      hasMore: meta?.has_more ?? false,
    };
  }, [citizensQuery.data, page, taxpayers.length]);

  /*
   * The currently selected citizen might not be on the current search page.
   * Preserve the selected ID and show its details when it is present in the
   * currently loaded results. The selection itself is never cleared by search.
   */
  const selected = useMemo(
    () => taxpayers.find((citizen) => String(citizen.id) === String(value)) ?? null,
    [taxpayers, value],
  );

  const details = selected
    ? [
        { label: "Full name", value: selected.full_name || "—" },
        { label: "National ID", value: selected.national_id || "—" },
        { label: "Citizen UID", value: selected.citizen_uid || "—" },
        { label: "Phone", value: selected.phone || "—" },
        { label: "Gender", value: selected.gender || "—" },
        {
          label: "Address",
          value:
            selected.administrative_unit?.full_address ||
            selected.address ||
            "—",
        },
      ]
    : [];

  const isLoading =
    citizensQuery.isLoading || citizensQuery.isFetching;

  const isInitialLoading = citizensQuery.isLoading;
  const isError = citizensQuery.isError;

  const goToPreviousPage = () => {
    setPage((currentPage) => Math.max(1, currentPage - 1));
  };

  const goToNextPage = () => {
    if (pagination.hasMore || page < pagination.lastPage) {
      setPage((currentPage) => currentPage + 1);
    }
  };

  const handleSelect = (citizen: Citizen) => {
    onChange(String(citizen.id));
    setOpen(false);
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="space-y-4 rounded-xl border-none bg-card p-5 shadow-none sm:p-6">
      {/* Header */}
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <User className="h-4 w-4 text-primary" />
          Taxpayer
        </h2>

        <p className="text-sm text-muted-foreground">
          Select the citizen this assessment applies to.
        </p>
      </div>

      {/* Selector */}
      <div>
        <Label htmlFor="taxpayer-selector">
          Taxpayer <span className="text-destructive">*</span>
        </Label>

        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);

            if (!nextOpen) {
              setSearchInput("");
              setSearch("");
              setPage(1);
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              id="taxpayer-selector"
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="mt-2 h-auto min-h-11 w-full justify-between py-2 font-normal"
            >
              {selected ? (
                <span className="flex min-w-0 flex-col items-start text-left">
                  <span className="truncate text-sm font-medium">
                    {selected.full_name}
                  </span>

                  <span className="truncate text-xs text-muted-foreground">
                    National ID {selected.national_id || "—"}
                  </span>
                </span>
              ) : value ? (
                <span className="truncate text-muted-foreground">
                  Selected taxpayer ID: {value}
                </span>
              ) : (
                <span className="truncate text-muted-foreground">
                  Search by name, national ID, or phone...
                </span>
              )}

              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            className="w-[var(--radix-popover-trigger-width)] p-0"
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search by name, national ID, or phone..."
                value={searchInput}
                onValueChange={setSearchInput}
                disabled={disabled}
              />

              <CommandList className="max-h-[320px] overflow-y-auto">
                {/* Initial loading */}
                {isInitialLoading && (
                  <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading taxpayers...
                  </div>
                )}

                {/* API error */}
                {!isInitialLoading && isError && (
                  <div className="space-y-3 px-4 py-6 text-center">
                    <AlertCircle className="mx-auto h-5 w-5 text-destructive" />

                    <p className="text-sm text-destructive">
                      Failed to load taxpayers.
                    </p>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void citizensQuery.refetch()}
                    >
                      <RefreshCw className="mr-2 h-3.5 w-3.5" />
                      Try again
                    </Button>
                  </div>
                )}

                {/* Results */}
                {!isInitialLoading && !isError && (
                  <>
                    {taxpayers.length === 0 ? (
                      <CommandEmpty>
                        <div className="py-5 text-center text-sm text-muted-foreground">
                          {search
                            ? "No taxpayer matches your search."
                            : "No taxpayers found."}
                        </div>
                      </CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {taxpayers.map((citizen) => {
                          const isSelected =
                            String(citizen.id) === String(value);

                          return (
                            <CommandItem
                              key={citizen.id}
                              value={String(citizen.id)}
                              onSelect={() => handleSelect(citizen)}
                              className="py-3"
                            >
                              <Check
                                className={`mr-2 h-4 w-4 shrink-0 ${
                                  isSelected
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {citizen.full_name}
                                </p>

                                <p className="truncate text-xs text-muted-foreground">
                                  {citizen.national_id || "No national ID"}
                                  {" · "}
                                  {citizen.gender || "Gender unspecified"}
                                </p>

                                <p className="truncate text-xs text-muted-foreground">
                                  {citizen.phone || "No phone"}
                                  {citizen.administrative_unit?.name
                                    ? ` · ${citizen.administrative_unit.name}`
                                    : ""}
                                </p>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    )}
                  </>
                )}
              </CommandList>

              {/* Pagination */}
              {!isError && (
                <div className="flex items-center justify-between gap-2 border-t p-2">
                  <p className="min-w-0 text-xs text-muted-foreground">
                    {pagination.total > 0
                      ? `${pagination.from ?? 0}–${pagination.to ?? 0} of ${pagination.total}`
                      : "No results"}
                    {isLoading && !isInitialLoading ? " · Updating..." : ""}
                  </p>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Previous page"
                      disabled={disabled || page <= 1 || isLoading}
                      onClick={goToPreviousPage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="px-1 text-xs text-muted-foreground">
                      {pagination.currentPage} / {pagination.lastPage}
                    </span>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Next page"
                      disabled={
                        disabled ||
                        isLoading ||
                        (!pagination.hasMore &&
                          page >= pagination.lastPage)
                      }
                      onClick={goToNextPage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Register taxpayer */}
              <div className="border-t p-2">
                <Button
                  asChild
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full justify-center text-xs"
                >
                  <Link
                    href="/revenue/taxpayers/create"
                    onClick={() => setOpen(false)}
                  >
                    <User className="mr-2 h-3.5 w-3.5" />
                    Register new taxpayer
                  </Link>
                </Button>
              </div>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected taxpayer details */}
      {selected && (
        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="gap-1">
              <Check className="h-3 w-3" />
              Selected
            </Badge>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={handleClear}
            >
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {details.map((detail) => (
              <div key={detail.label} className="min-w-0">
                <span className="text-xs text-muted-foreground">
                  {detail.label}
                </span>

                <p className="truncate font-medium">
                  {detail.value}
                </p>
              </div>
            ))}
          </div>

          {selected.administrative_unit?.name && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {selected.administrative_unit.name}
            </p>
          )}
        </div>
      )}
    </div>
  );
}