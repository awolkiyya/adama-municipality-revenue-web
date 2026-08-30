"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, ChevronsUpDown, Info, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* =========================================================
   TYPES
========================================================= */

interface AsyncMultiSelectProps<T extends Record<string, any>, V extends string | number> {
  value: V[];
  onChange: (values: V[], items: T[]) => void;

  fetchData: (params: {
    search: string;
    page: number;
    pageSize: number;
  }) => Promise<{ data: T[]; total?: number }>;

  /** Resolves items for ids the picker hasn't seen yet (e.g. on initial load with a pre-set value). */
  fetchItemsByIds?: (ids: V[]) => Promise<T[]>;

  valueField: keyof T;
  displayField?: keyof T;
  renderLabel?: (item: T) => string;
  renderOption?: (item: T) => React.ReactNode;

  placeholder?: string;
  pageSize?: number;
  debounceTime?: number;
  disabled?: boolean;
  maxSelectedDisplay?: number;

  /**
   * When false, this behaves as a single-value picker: selecting an option
   * REPLACES the current value (instead of appending to it) and closes the
   * popover immediately. The trigger renders the single selected label as
   * plain text instead of a removable-badge list. Defaults to true so
   * existing multi-select call sites are unaffected.
   */
  multiple?: boolean;

  /** Only relevant when multiple=false. Shows a clear (x) affordance next to the selected value. */
  clearable?: boolean;
}

/* =========================================================
   HELPERS
========================================================= */

function truncateText(text: string, max: number = 40): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

/* =========================================================
   COMPONENT
========================================================= */

export function AsyncMultiSelect<T extends Record<string, any>, V extends string | number>({
  value,
  onChange,
  fetchData,
  fetchItemsByIds,
  valueField,
  displayField,
  renderLabel,
  renderOption,
  placeholder = "Select...",
  pageSize = 20,
  debounceTime = 300,
  disabled = false,
  maxSelectedDisplay = 3,
  multiple = true,
  clearable = true,
}: AsyncMultiSelectProps<T, V>) {
  const [open, setOpen] = useState(false);
  const [optionIds, setOptionIds] = useState<V[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Every item this component has ever seen (current page, prior pages,
  // and items resolved by id) lives here, keyed by its id. Rendering reads
  // from this cache rather than the current `options` page, so a badge for
  // an already-selected item never disappears just because a new search
  // replaced the visible result list.
  const itemsCacheRef = useRef<Map<V, T>>(new Map());
  const [, forceRerender] = useState(0);

  const mountedRef = useRef(true);
  // Guards against out-of-order responses: only the most recent search
  // request is allowed to commit its results.
  const latestRequestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const cacheItems = useCallback((items: T[]) => {
    for (const item of items) {
      itemsCacheRef.current.set(item[valueField] as V, item);
    }
  }, [valueField]);

  /* =====================================================
     LABEL / OPTION RENDERING
  ===================================================== */

  const getLabelText = useCallback(
    (item: T): string => {
      if (renderLabel) return renderLabel(item);

      if (displayField) {
        const fieldValue = item[displayField];
        if (typeof fieldValue === "string" || typeof fieldValue === "number") {
          return String(fieldValue);
        }
      }

      return "";
    },
    [renderLabel, displayField],
  );

  const getOptionNode = useCallback(
    (item: T) => (renderOption ? renderOption(item) : getLabelText(item)),
    [renderOption, getLabelText],
  );

  /* =====================================================
     LOAD OPTIONS (search + pagination)
  ===================================================== */

  const loadOptions = useCallback(
    async (pageNumber: number, searchText: string, reset = false) => {
      const requestId = ++latestRequestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const response = await fetchData({ search: searchText, page: pageNumber, pageSize });

        // A newer request superseded this one, or the component unmounted
        // while the request was in flight — drop this stale response.
        if (!mountedRef.current || requestId !== latestRequestIdRef.current) return;

        const fetched = response.data ?? [];
        cacheItems(fetched);

        const fetchedIds = fetched.map((item) => item[valueField] as V);
        setOptionIds((prev) => (reset ? fetchedIds : [...prev, ...fetchedIds]));
        setPage(pageNumber);
        setTotal(response.total ?? null);
      } catch (err) {
        console.error(err);
        if (mountedRef.current && requestId === latestRequestIdRef.current) {
          setError("Failed to load data");
        }
      } finally {
        if (mountedRef.current && requestId === latestRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [fetchData, pageSize, cacheItems, valueField],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOptions(1, search, true);
    }, debounceTime);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, debounceTime]);

  /* =====================================================
     RESOLVE PRE-SELECTED IDS NOT YET IN CACHE
  ===================================================== */

  useEffect(() => {
    if (!fetchItemsByIds) return;

    const missingIds = value.filter((id) => !itemsCacheRef.current.has(id));
    if (missingIds.length === 0) return;

    let active = true;

    (async () => {
      try {
        const items = await fetchItemsByIds(missingIds);
        if (!active) return;
        cacheItems(items);
        forceRerender((n) => n + 1);
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, fetchItemsByIds, cacheItems]);

  /* =====================================================
     DERIVED STATE
  ===================================================== */

  const options = useMemo(
    () => optionIds.map((id) => itemsCacheRef.current.get(id)).filter((x): x is T => Boolean(x)),
    [optionIds],
  );

  const selectedItems = useMemo(
    () => value.map((id) => itemsCacheRef.current.get(id)).filter((x): x is T => Boolean(x)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, optionIds],
  );

  const hasMore = total !== null ? options.length < total : optionIds.length % pageSize === 0 && optionIds.length > 0;

  /* =====================================================
     SELECT / REMOVE
  ===================================================== */

  const toggleSelect = useCallback(
    (item: T) => {
      const id = item[valueField] as V;
      cacheItems([item]);

      if (!multiple) {
        // Single-select: selecting always replaces the current value,
        // even if the same item is clicked again (re-picking is a no-op,
        // not a way to clear — use the clear affordance for that).
        onChange([id], [item]);
        setOpen(false);
        setSearch("");
        return;
      }

      const newValues = value.includes(id) ? value.filter((x) => x !== id) : [...value, id];
      const newItems = newValues
        .map((v) => itemsCacheRef.current.get(v))
        .filter((x): x is T => Boolean(x));

      onChange(newValues, newItems);
    },
    [value, valueField, cacheItems, onChange, multiple],
  );

  const removeItem = useCallback(
    (id: V) => {
      const newValues = value.filter((x) => x !== id);
      const newItems = newValues
        .map((v) => itemsCacheRef.current.get(v))
        .filter((x): x is T => Boolean(x));

      onChange(newValues, newItems);
    },
    [value, onChange],
  );

  const clearSingle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange([], []);
    },
    [onChange],
  );

  /* =====================================================
     INFINITE SCROLL
  ===================================================== */

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;

      if (nearBottom && !loading && hasMore) {
        loadOptions(page + 1, search);
      }
    },
    [loading, hasMore, page, search, loadOptions],
  );

  /* =====================================================
     UI
  ===================================================== */

  const singleSelectedItem = !multiple ? selectedItems[0] : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="min-h-11 w-full justify-between rounded-sm px-3"
        >
          {multiple ? (
            <div className="flex flex-wrap gap-1 text-left">
              {value.length === 0 ? (
                <span className="text-sm text-muted-foreground">{placeholder}</span>
              ) : (
                <>
                  {selectedItems.slice(0, maxSelectedDisplay).map((item) => (
                    <Badge key={String(item[valueField])} variant="secondary" className="gap-1">
                      {truncateText(getLabelText(item))}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item[valueField] as V);
                        }}
                      />
                    </Badge>
                  ))}

                  {selectedItems.length > maxSelectedDisplay && (
                    <Badge variant="outline" className="font-normal text-muted-foreground">
                      +{selectedItems.length - maxSelectedDisplay} more
                    </Badge>
                  )}
                </>
              )}
            </div>
          ) : (
            <span className="flex-1 truncate text-left text-sm">
              {singleSelectedItem ? (
                getLabelText(singleSelectedItem)
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </span>
          )}

          <div className="flex shrink-0 items-center gap-1">
            {!multiple && clearable && singleSelectedItem && (
              <X
                className="h-3.5 w-3.5 cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={clearSingle}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        {/* shouldFilter=false: search is already handled server-side via
            fetchData, so cmdk's own text-matching filter must be disabled —
            otherwise it hides valid server results that don't textually
            match the query, especially when renderOption returns non-text JSX. */}
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search..." value={search} onValueChange={setSearch} />

          <CommandList>
            <ScrollArea className="max-h-72" onScroll={handleScroll}>
              {loading && options.length === 0 && (
                <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-4 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {!loading && !error && options.length === 0 && (
                <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  No results
                </div>
              )}

              <CommandGroup>
                {options.map((item) => {
                  const id = item[valueField] as V;
                  const selected = value.includes(id);

                  return (
                    <CommandItem
                      key={String(id)}
                      value={String(id)}
                      onSelect={() => toggleSelect(item)}
                      className="flex gap-3 py-3"
                    >
                      <Check className={cn("h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                      {getOptionNode(item)}
                    </CommandItem>
                  );
                })}

                {loading && options.length > 0 && (
                  <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading more...
                  </div>
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}