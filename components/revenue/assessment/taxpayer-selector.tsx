
"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Copy,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { useCitizens } from "@/hooks/useCitizen.hook";
import type { Citizen } from "@/types/citizen";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
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
/* Types & constants                                                          */
/* -------------------------------------------------------------------------- */

type TaxpayerSelectorProps = {
  /** Selected citizen ID, or "" when nothing is selected. */
  value: string;
  onChange: (taxpayerId: string) => void;
  /** Optional: receive the full record (or null when cleared). */
  onSelectCitizen?: (citizen: Citizen | null) => void;
  disabled?: boolean;
  /** Validation message shown under the field. */
  error?: string;
};

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;
const SKELETON_ROWS = 5;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getInitials(name?: string | null) {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";

  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";

  return (first + last).toUpperCase();
}

function formatGender(gender?: string | null) {
  if (!gender) return null;

  return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
}

function Avatar({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary",
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}

function ResultSkeleton() {
  return (
    <div className="space-y-1 p-1" aria-hidden="true">
      {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-2 py-2.5">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted" />

          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-muted/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CopyButton({
  text,
  label,
}: {
  text: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const id = setTimeout(() => setCopied(false), 1500);

    return () => clearTimeout(id);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard may be unavailable.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function TaxpayerSelector({
  value,
  onChange,
  onSelectCitizen,
  disabled = false,
  error,
}: TaxpayerSelectorProps) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;

  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  /*
   * Cache the selected citizen independently of the current search results.
   *
   * This ensures the selected taxpayer remains visible when:
   * - The user searches for another citizen.
   * - The user changes pagination.
   * - The selected citizen disappears from the current API response.
   */
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(
    null,
  );

  /* ------------------------------------------------------------------------ */
  /* Debounced search                                                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  /* ------------------------------------------------------------------------ */
  /* Server-side search and pagination                                       */
  /* ------------------------------------------------------------------------ */

  const citizensQuery = useCitizens({
    search: search || undefined,
    page,
    per_page: PAGE_SIZE,
    sort_by: "full_name",
    sort_direction: "asc",
  });

  const taxpayers = useMemo<Citizen[]>(() => {
    const response = citizensQuery.data;

    if (!response || response.success !== true) return [];

    return Array.isArray(response.data) ? response.data : [];
  }, [citizensQuery.data]);

  const pagination = useMemo(() => {
    const meta = citizensQuery.data?.meta;

    return {
      currentPage: meta?.current_page ?? page,
      lastPage: meta?.last_page ?? 1,
      total: meta?.total ?? taxpayers.length,
      from: meta?.from ?? (taxpayers.length ? 1 : 0),
      to: meta?.to ?? taxpayers.length,
      hasMore: meta?.has_more ?? false,
    };
  }, [citizensQuery.data, page, taxpayers.length]);

  /* ------------------------------------------------------------------------ */
  /* Selected taxpayer                                                       */
  /* ------------------------------------------------------------------------ */

  /*
   * Derive the selected taxpayer instead of synchronizing it through an
   * effect. This avoids react-hooks/set-state-in-effect.
   *
   * The cached record is used when the selected citizen is not present
   * in the current search results.
   */
  const selected = useMemo(() => {
    if (!value) return null;

    const cachedMatch =
      selectedCitizen &&
      String(selectedCitizen.id) === String(value)
        ? selectedCitizen
        : null;

    if (cachedMatch) return cachedMatch;

    return (
      taxpayers.find((citizen) => String(citizen.id) === String(value)) ??
      null
    );
  }, [value, selectedCitizen, taxpayers]);

  const isInitialLoading = citizensQuery.isLoading;
  const isRefreshing = citizensQuery.isFetching && !citizensQuery.isLoading;
  const isBusy = citizensQuery.isFetching;
  const isError = citizensQuery.isError;

  const canGoNext = pagination.hasMore || page < pagination.lastPage;
  const canGoPrevious = page > 1;

  /* ------------------------------------------------------------------------ */
  /* Actions                                                                  */
  /* ------------------------------------------------------------------------ */

  const resetSearch = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }, []);

  const handleSelect = useCallback(
    (citizen: Citizen) => {
      setSelectedCitizen(citizen);

      onChange(String(citizen.id));
      onSelectCitizen?.(citizen);

      setOpen(false);
      resetSearch();
    },
    [onChange, onSelectCitizen, resetSearch],
  );

  const handleClear = useCallback(() => {
    setSelectedCitizen(null);

    onChange("");
    onSelectCitizen?.(null);
  }, [onChange, onSelectCitizen]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (!nextOpen) {
        resetSearch();
      }
    },
    [resetSearch],
  );

  /* ------------------------------------------------------------------------ */
  /* Selected taxpayer information                                            */
  /* ------------------------------------------------------------------------ */

  const address =
    selected?.administrative_unit?.full_address ||
    selected?.address ||
    "";

  const details = selected
    ? [
        {
          label: "National ID",
          value: selected.national_id,
          copyable: true,
        },
        {
          label: "Citizen UID",
          value: selected.citizen_uid,
          copyable: true,
        },
        {
          label: "Phone",
          value: selected.phone,
          copyable: false,
        },
        {
          label: "Gender",
          value: formatGender(selected.gender),
          copyable: false,
        },
      ]
    : [];

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <section
      aria-labelledby={`${fieldId}-title`}
      className="space-y-5 p-5 sm:p-6"
    >
      {/* Header */}
      <header className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Users className="h-4 w-4" />
        </span>

        <div className="min-w-0">
          <h2
            id={`${fieldId}-title`}
            className="text-base font-semibold leading-tight"
          >
            Taxpayer
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Choose the citizen this assessment applies to.
          </p>
        </div>
      </header>

      {/* Taxpayer selector */}
      <div className="space-y-2">
        <Label htmlFor={fieldId}>
          Taxpayer <span className="text-destructive">*</span>
        </Label>

        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              id={fieldId}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              disabled={disabled}
              className={cn(
                "h-auto min-h-12 w-full justify-between gap-3 px-3 py-2 font-normal",
                error &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            >
              {selected ? (
                <span className="flex min-w-0 items-center gap-3 text-left">
                  <Avatar name={selected.full_name} />

                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {selected.full_name}
                    </span>

                    <span className="block truncate text-xs text-muted-foreground">
                      National ID {selected.national_id || "—"}
                    </span>
                  </span>
                </span>
              ) : value ? (
                <span className="truncate text-sm text-muted-foreground">
                  Taxpayer #{value}
                </span>
              ) : (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Search className="h-4 w-4" />
                  Search by name, national ID or phone
                </span>
              )}

              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            sideOffset={6}
            className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0 shadow-lg"
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search by name, national ID or phone"
                value={searchInput}
                onValueChange={setSearchInput}
              />

              <CommandList
                className={cn(
                  "max-h-[320px] overflow-y-auto transition-opacity",
                  isRefreshing && "opacity-60",
                )}
                aria-busy={isBusy}
              >
                {/* Initial loading */}
                {isInitialLoading && <ResultSkeleton />}

                {/* Error */}
                {!isInitialLoading && isError && (
                  <div
                    role="alert"
                    className="flex flex-col items-center gap-3 px-4 py-8 text-center"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </span>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Couldn’t load taxpayers
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Check your connection and try again.
                      </p>
                    </div>

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

                {/* Empty results */}
                {!isInitialLoading &&
                  !isError &&
                  taxpayers.length === 0 && (
                    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Search className="h-5 w-5 text-muted-foreground" />
                      </span>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {search
                            ? "No matching taxpayers"
                            : "No taxpayers yet"}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {search
                            ? `Nothing found for “${search}”. Try a different name, ID or phone number.`
                            : "Register the first taxpayer to continue."}
                        </p>
                      </div>
                    </div>
                  )}

                {/* Taxpayer results */}
                {!isInitialLoading &&
                  !isError &&
                  taxpayers.length > 0 && (
                    <CommandGroup className="p-1">
                      {taxpayers.map((citizen) => {
                        const isSelected =
                          String(citizen.id) === String(value);

                        const gender = formatGender(citizen.gender);
                        const unit = citizen.administrative_unit?.name;

                        return (
                          <CommandItem
                            key={citizen.id}
                            value={String(citizen.id)}
                            onSelect={() => handleSelect(citizen)}
                            className="items-start gap-3 rounded-md px-2 py-2.5"
                          >
                            <Avatar name={citizen.full_name} />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-medium">
                                  {citizen.full_name}
                                </p>

                                {gender && (
                                  <span className="shrink-0 text-xs text-muted-foreground">
                                    {gender}
                                  </span>
                                )}
                              </div>

                              <p className="truncate text-xs text-muted-foreground">
                                ID {citizen.national_id || "not recorded"}
                              </p>

                              <p className="mt-0.5 flex items-center gap-3 truncate text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {citizen.phone || "No phone"}
                                </span>

                                {unit && (
                                  <span className="inline-flex min-w-0 items-center gap-1">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    <span className="truncate">
                                      {unit}
                                    </span>
                                  </span>
                                )}
                              </p>
                            </div>

                            <Check
                              className={cn(
                                "mt-1 h-4 w-4 shrink-0 text-primary",
                                isSelected
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}
              </CommandList>

              {/* Pagination */}
              {!isError && (
                <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
                  <p
                    className="min-w-0 truncate text-xs text-muted-foreground"
                    aria-live="polite"
                  >
                    {pagination.total > 0
                      ? `${pagination.from}–${pagination.to} of ${pagination.total}`
                      : "0 results"}
                  </p>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="Previous page"
                      disabled={!canGoPrevious || isBusy}
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="min-w-[3.5rem] text-center text-xs tabular-nums text-muted-foreground">
                      {pagination.currentPage} / {pagination.lastPage}
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="Next page"
                      disabled={!canGoNext || isBusy}
                      onClick={() =>
                        setPage((current) => current + 1)
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Register taxpayer */}
              <div className="border-t bg-muted/30 p-1.5">
                <Button
                  asChild
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-full justify-start gap-2 text-sm font-medium"
                >
                  <Link
                    href="/office/dashboard/taxpayers/create"
                    onClick={() => setOpen(false)}
                  >
                    <UserPlus className="h-4 w-4" />
                    Register a new taxpayer
                  </Link>
                </Button>
              </div>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Validation */}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-sm text-destructive"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>

      {/* Selected taxpayer details */}
      {selected && (
        <div className="overflow-hidden rounded-lg border bg-muted/20">
          {/* Selection header */}
          <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5">
            <Badge variant="secondary" className="gap-1.5">
              <Check className="h-3 w-3 text-emerald-600" />
              Taxpayer selected
            </Badge>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              disabled={disabled}
              onClick={handleClear}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          </div>

          {/* Taxpayer information */}
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <Avatar
                name={selected.full_name}
                className="h-11 w-11 text-sm"
              />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {selected.full_name}
                </p>

                {selected.administrative_unit?.name && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />

                    <span className="truncate">
                      {selected.administrative_unit.name}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {details.map((detail) => (
                <div key={detail.label} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">
                    {detail.label}
                  </dt>

                  <dd className="flex items-center gap-1">
                    <span
                      className={cn(
                        "truncate font-medium",
                        !detail.value &&
                          "font-normal text-muted-foreground",
                      )}
                    >
                      {detail.value || "Not recorded"}
                    </span>

                    {detail.copyable && detail.value && (
                      <CopyButton
                        text={String(detail.value)}
                        label={detail.label}
                      />
                    )}
                  </dd>
                </div>
              ))}

              <div className="min-w-0 sm:col-span-2">
                <dt className="text-xs text-muted-foreground">
                  Address
                </dt>

                <dd
                  className={cn(
                    "font-medium",
                    !address && "font-normal text-muted-foreground",
                  )}
                >
                  {address || "Not recorded"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </section>
  );
}
