"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  Info,
  Loader2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

/* =========================================================
   TYPES
========================================================= */

interface FetchDataParams {
  search: string;
  page: number;
  pageSize: number;
}

interface FetchDataResponse<T> {
  data: T[];
  total?: number;
}

interface AsyncMultiSelectProps<
  T extends Record<string, any>,
  V extends string | number,
> {
  value: V[];
  onChange: (values: V[], items: T[]) => void;

  fetchData: (
    params: FetchDataParams,
  ) => Promise<FetchDataResponse<T>>;

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
  multiple?: boolean;
  clearable?: boolean;
}

/* =========================================================
   HELPERS
========================================================= */

function truncateText(text: string, max = 40): string {
  if (!text) return "";

  return text.length > max
    ? `${text.slice(0, max)}...`
    : text;
}

/* =========================================================
   COMPONENT
========================================================= */

export function AsyncMultiSelect<
  T extends Record<string, any>,
  V extends string | number,
>({
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

  const itemsCacheRef = useRef<Map<V, T>>(new Map());
  const [, forceRerender] = useState(0);

  const mountedRef = useRef(false);
  const latestRequestIdRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const requestedPagesRef = useRef<Set<number>>(new Set());

  const searchRef = useRef(search);
  const pageRef = useRef(page);
  const totalRef = useRef<number | null>(total);
  const optionCountRef = useRef(0);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    totalRef.current = total;
  }, [total]);

  useEffect(() => {
    optionCountRef.current = optionIds.length;
  }, [optionIds]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      latestRequestIdRef.current += 1;
    };
  }, []);

  /* =====================================================
     CACHE
  ===================================================== */

  const cacheItems = useCallback(
    (items: T[]) => {
      for (const item of items) {
        itemsCacheRef.current.set(
          item[valueField] as V,
          item,
        );
      }
    },
    [valueField],
  );

  /* =====================================================
     LABELS
  ===================================================== */

  const getLabelText = useCallback(
    (item: T): string => {
      if (renderLabel) {
        return renderLabel(item);
      }

      if (displayField) {
        const fieldValue = item[displayField];

        if (
          typeof fieldValue === "string" ||
          typeof fieldValue === "number"
        ) {
          return String(fieldValue);
        }
      }

      return "";
    },
    [renderLabel, displayField],
  );

  const getOptionNode = useCallback(
    (item: T) =>
      renderOption
        ? renderOption(item)
        : getLabelText(item),
    [renderOption, getLabelText],
  );

  /* =====================================================
     LOAD OPTIONS
  ===================================================== */

  const loadOptions = useCallback(
    async (
      pageNumber: number,
      searchText: string,
      reset = false,
    ) => {
      if (!mountedRef.current) return;

      if (reset) {
        // Invalidate requests from the previous search.
        latestRequestIdRef.current += 1;
        requestedPagesRef.current.clear();
        loadingMoreRef.current = false;

        pageRef.current = 1;
        totalRef.current = null;
        optionCountRef.current = 0;

        setOptionIds([]);
        setPage(1);
        setTotal(null);
      } else {
        if (loadingMoreRef.current) return;

        const knownTotal = totalRef.current;

        if (
          knownTotal !== null &&
          optionCountRef.current >= knownTotal
        ) {
          return;
        }

        if (requestedPagesRef.current.has(pageNumber)) {
          return;
        }

        // Only request the next sequential page.
        if (pageNumber !== pageRef.current + 1) {
          return;
        }
      }

      const requestId = ++latestRequestIdRef.current;

      requestedPagesRef.current.add(pageNumber);

      if (!reset) {
        loadingMoreRef.current = true;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetchData({
          search: searchText,
          page: pageNumber,
          pageSize,
        });

        if (
          !mountedRef.current ||
          requestId !== latestRequestIdRef.current
        ) {
          return;
        }

        const fetched = Array.isArray(response?.data)
          ? response.data
          : [];

        cacheItems(fetched);

        const fetchedIds = fetched.map(
          (item) => item[valueField] as V,
        );

        setOptionIds((previousIds) => {
          const merged = reset
            ? new Set<V>()
            : new Set<V>(previousIds);

          for (const id of fetchedIds) {
            merged.add(id);
          }

          const nextIds = [...merged];
          optionCountRef.current = nextIds.length;

          return nextIds;
        });

        pageRef.current = pageNumber;
        setPage(pageNumber);

        const responseTotal =
          typeof response?.total === "number"
            ? response.total
            : null;

        totalRef.current = responseTotal;
        setTotal(responseTotal);

        // An empty page indicates there are no further results.
        if (fetched.length === 0) {
          totalRef.current = optionCountRef.current;
          setTotal(optionCountRef.current);
        }
      } catch (err) {
        console.error(
          "Failed to load dropdown options:",
          err,
        );

        if (
          mountedRef.current &&
          requestId === latestRequestIdRef.current
        ) {
          setError("Failed to load data");

          // Permit retrying a failed page.
          requestedPagesRef.current.delete(pageNumber);
        }
      } finally {
        if (
          mountedRef.current &&
          requestId === latestRequestIdRef.current
        ) {
          setLoading(false);
          loadingMoreRef.current = false;
        }
      }
    },
    [fetchData, pageSize, cacheItems, valueField],
  );

  /* =====================================================
     INITIAL LOAD / SEARCH
  ===================================================== */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOptions(1, search, true);
    }, debounceTime);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search, debounceTime, loadOptions]);

  /* =====================================================
     HYDRATE PRE-SELECTED IDS
  ===================================================== */

  useEffect(() => {
    if (!fetchItemsByIds || value.length === 0) {
      return;
    }

    const missingIds = value.filter(
      (id) => !itemsCacheRef.current.has(id),
    );

    if (missingIds.length === 0) {
      return;
    }

    let active = true;

    const resolveItems = async () => {
      try {
        const items = await fetchItemsByIds(missingIds);

        if (!active || !mountedRef.current) {
          return;
        }

        cacheItems(items);
        forceRerender((previous) => previous + 1);
      } catch (err) {
        console.error(
          "Failed to resolve selected dropdown items:",
          err,
        );
      }
    };

    void resolveItems();

    return () => {
      active = false;
    };
  }, [value, fetchItemsByIds, cacheItems]);

  /* =====================================================
     DERIVED STATE
  ===================================================== */

  const options = useMemo(
    () =>
      optionIds
        .map((id) => itemsCacheRef.current.get(id))
        .filter((item): item is T => Boolean(item)),
    [optionIds],
  );

  const selectedItems = useMemo(
    () =>
      value
        .map((id) => itemsCacheRef.current.get(id))
        .filter((item): item is T => Boolean(item)),
    [value, optionIds],
  );

  const hasMore =
    total !== null
      ? optionIds.length < total
      : options.length > 0 &&
        options.length % pageSize === 0;

  /* =====================================================
     SELECT / REMOVE
  ===================================================== */

  const toggleSelect = useCallback(
    (item: T) => {
      const id = item[valueField] as V;

      cacheItems([item]);

      if (!multiple) {
        onChange([id], [item]);
        setOpen(false);
        setSearch("");
        return;
      }

      const newValues = value.includes(id)
        ? value.filter((existingId) => existingId !== id)
        : [...value, id];

      const newItems = newValues
        .map((selectedId) =>
          itemsCacheRef.current.get(selectedId),
        )
        .filter((selectedItem): selectedItem is T =>
          Boolean(selectedItem),
        );

      onChange(newValues, newItems);
    },
    [value, valueField, cacheItems, onChange, multiple],
  );

  const removeItem = useCallback(
    (id: V) => {
      const newValues = value.filter(
        (existingId) => existingId !== id,
      );

      const newItems = newValues
        .map((selectedId) =>
          itemsCacheRef.current.get(selectedId),
        )
        .filter((item): item is T => Boolean(item));

      onChange(newValues, newItems);
    },
    [value, onChange],
  );

  const clearSingle = useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      event.stopPropagation();
      onChange([], []);
    },
    [onChange],
  );

  /* =====================================================
     INFINITE SCROLL
  ===================================================== */

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const element = event.currentTarget;

      const nearBottom =
        element.scrollTop + element.clientHeight >=
        element.scrollHeight - 24;

      if (
        !nearBottom ||
        loading ||
        loadingMoreRef.current ||
        !hasMore
      ) {
        return;
      }

      void loadOptions(
        pageRef.current + 1,
        searchRef.current,
      );
    },
    [loading, hasMore, loadOptions],
  );

  /* =====================================================
     UI
  ===================================================== */

  const singleSelectedItem = multiple
    ? undefined
    : selectedItems[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="min-h-11 w-full justify-between rounded-sm px-3"
        >
          {multiple ? (
            <div className="flex flex-wrap gap-1 text-left">
              {value.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  {placeholder}
                </span>
              ) : (
                <>
                  {selectedItems
                    .slice(0, maxSelectedDisplay)
                    .map((item) => (
                      <Badge
                        key={String(item[valueField])}
                        variant="secondary"
                        className="gap-1"
                      >
                        {truncateText(getLabelText(item))}

                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={(event) => {
                            event.stopPropagation();

                            removeItem(
                              item[valueField] as V,
                            );
                          }}
                        />
                      </Badge>
                    ))}

                  {selectedItems.length >
                    maxSelectedDisplay && (
                    <Badge
                      variant="outline"
                      className="font-normal text-muted-foreground"
                    >
                      +{selectedItems.length -
                        maxSelectedDisplay}{" "}
                      more
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
                <span className="text-muted-foreground">
                  {placeholder}
                </span>
              )}
            </span>
          )}

          <span className="flex shrink-0 items-center gap-1">
            {!multiple && clearable && singleSelectedItem && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear selection"
                className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                onClick={clearSingle}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();
                    onChange([], []);
                  }
                }}
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}

            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>

      {/* Wider, responsive dropdown */}
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        className="w-[min(36rem,calc(100vw-2rem))] min-w-[min(24rem,calc(100vw-2rem))] p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search..."
            value={search}
            onValueChange={setSearch}
          />

          <CommandList
            className="max-h-72 overflow-y-auto"
            onScroll={handleScroll}
          >
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
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selected
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />

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

              {!loading &&
                !error &&
                options.length > 0 &&
                !hasMore && (
                  <div className="py-2 text-center text-xs text-muted-foreground">
                    No more results
                  </div>
                )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
