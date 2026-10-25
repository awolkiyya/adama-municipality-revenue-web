"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

import {
  Check,
  ChevronsUpDown,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* =========================================================
   TYPES
========================================================= */

interface AsyncDropdownProps<T, V extends string | number> {
  value: V | null;

  onChange: (value: V, item: T) => void;

  fetchData: (params: {
    search: string;
    page: number;
    pageSize: number;
  }) => Promise<{
    data: T[];
    total?: number;
  }>;

  fetchItemById?: (id: V) => Promise<T | null>;

  displayField?: keyof T;

  renderLabel?: (item: T) => string;

  renderOption?: (item: T) => React.ReactNode;

  valueField: keyof T;

  placeholder?: string;

  pageSize?: number;

  debounceTime?: number;

  disabled?: boolean;
}

/* =========================================================
   HELPERS
========================================================= */

const truncateText = (text: string, max = 60): string => {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

/**
 * Normalize IDs for comparisons.
 * Supports API IDs returned as either 4 or "4",
 * while treating null and undefined as unselected.
 */
const sameId = (first: unknown, second: unknown): boolean => {
  if (first == null || second == null) {
    return first == null && second == null;
  }

  return String(first) === String(second);
};

/* =========================================================
   COMPONENT
========================================================= */

export const AsyncDropdown = <
  T extends Record<string, any>,
  V extends string | number
>({
  value,
  onChange,
  fetchData,
  fetchItemById,
  displayField,
  renderLabel,
  renderOption,
  valueField,
  placeholder = "Select...",
  pageSize = 20,
  debounceTime = 300,
  disabled = false,
}: AsyncDropdownProps<T, V>) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<T[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Selected object for cases where the selected item is fetched
   * individually or isn't in the current page.
   * The controlled `value` remains the source of truth.
   */
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  /**
   * Refs mirror the latest value/selectedItem so that loadOptions
   * can read them WITHOUT depending on them. Otherwise every
   * selection changes loadOptions' identity, which re-triggers the
   * fetch effect and causes an unwanted refetch.
   */
  const valueRef = useRef<V | null>(value);
  const selectedItemRef = useRef<T | null>(selectedItem);

  valueRef.current = value;
  selectedItemRef.current = selectedItem;

  /* =========================================================
     LABEL HELPERS
  ========================================================= */

  const getLabelText = useCallback(
    (item: T): string => {
      if (renderLabel) {
        return renderLabel(item);
      }

      if (displayField) {
        const raw = item[displayField];

        if (typeof raw === "string" || typeof raw === "number") {
          return String(raw);
        }
      }

      return "";
    },
    [renderLabel, displayField]
  );

  const getOptionNode = useCallback(
    (item: T): React.ReactNode => {
      if (renderOption) {
        return renderOption(item);
      }

      return getLabelText(item);
    },
    [renderOption, getLabelText]
  );

  /* =========================================================
     RESOLVE CURRENT SELECTION
  ========================================================= */

  const resolvedSelected = useMemo(() => {
    if (value == null) {
      return null;
    }

    const matchingOption = options.find((item) =>
      sameId(item[valueField], value)
    );

    if (matchingOption) {
      return matchingOption;
    }

    if (selectedItem && sameId(selectedItem[valueField], value)) {
      return selectedItem;
    }

    return null;
  }, [value, options, selectedItem, valueField]);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadOptions = useCallback(
    async (pageNum: number, searchText: string, reset = false) => {
      const requestId = ++requestIdRef.current;

      setLoading(true);
      setError(null);

      try {
        const result = await fetchData({
          search: searchText,
          page: pageNum,
          pageSize,
        });

        if (!mountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        const incomingOptions = Array.isArray(result.data)
          ? result.data
          : [];

        setOptions((previous) => {
          if (reset) {
            const currentValue = valueRef.current;
            const currentSelectedItem = selectedItemRef.current;

            /**
             * Keep the selected item visible if it isn't included
             * in the current search/page response.
             */
            const currentSelected =
              previous.find((item) =>
                sameId(item[valueField], currentValue)
              ) ??
              (currentSelectedItem &&
              sameId(currentSelectedItem[valueField], currentValue)
                ? currentSelectedItem
                : null);

            if (
              currentSelected &&
              !incomingOptions.some((item) =>
                sameId(item[valueField], currentSelected[valueField])
              )
            ) {
              return [currentSelected, ...incomingOptions];
            }

            return incomingOptions;
          }

          const merged = [...previous];

          for (const item of incomingOptions) {
            const exists = merged.some((existing) =>
              sameId(existing[valueField], item[valueField])
            );

            if (!exists) {
              merged.push(item);
            }
          }

          return merged;
        });

        setPage(pageNum);
        setTotal(result.total ?? null);
      } catch (err) {
        if (!mountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        console.error("AsyncDropdown: failed to load options", err);
        setError("Failed to load data");
      } finally {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [fetchData, pageSize, valueField]
  );

  /* =========================================================
     MOUNT TRACKING
  ========================================================= */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  /* =========================================================
     INITIAL LOAD + SEARCH
  ========================================================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadOptions(1, search, true);
    }, debounceTime);

    return () => {
      clearTimeout(timer);
    };
  }, [search, loadOptions, debounceTime]);

  /* =========================================================
     SYNCHRONIZE CONTROLLED VALUE
  ========================================================= */

  useEffect(() => {
    if (value == null) {
      setSelectedItem(null);
      return;
    }

    setSelectedItem((previous) => {
      if (previous && !sameId(previous[valueField], value)) {
        return null;
      }

      return previous;
    });
  }, [value, valueField]);

  /* =========================================================
     LOAD SELECTED ITEM BY ID
  ========================================================= */

  useEffect(() => {
    if (value == null || !fetchItemById) {
      return;
    }

    let active = true;

    const loadSelectedItem = async () => {
      try {
        const item = await fetchItemById(value);

        if (!active || !item) {
          return;
        }

        setSelectedItem(item);

        setOptions((previous) => {
          const exists = previous.some((option) =>
            sameId(option[valueField], item[valueField])
          );

          if (exists) {
            return previous;
          }

          return [item, ...previous];
        });
      } catch (err) {
        if (active) {
          console.error(
            "AsyncDropdown: failed to load selected item",
            err
          );
        }
      }
    };

    void loadSelectedItem();

    return () => {
      active = false;
    };
  }, [value, fetchItemById, valueField]);

  /* =========================================================
     INFINITE SCROLL
  ========================================================= */

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;

    const reachedBottom =
      element.scrollTop + element.clientHeight >=
      element.scrollHeight - 20;

    if (
      reachedBottom &&
      !loading &&
      total !== null &&
      options.length < total
    ) {
      void loadOptions(page + 1, search);
    }
  };

  /* =========================================================
     OPEN / CLOSE
  ========================================================= */

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    // Reset the search when closing so the next open starts fresh.
    if (!nextOpen && search) {
      setSearch("");
    }
  };

  /* =========================================================
     SELECT
  ========================================================= */

  const handleSelect = (item: T) => {
    const selectedValue = item[valueField] as V;

    setSelectedItem(item);
    onChange(selectedValue, item);
    handleOpenChange(false);
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
      // Required when rendered inside a Sheet/Dialog: lets the
      // popover manage its own scroll and pointer events.
      modal
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-11 w-full justify-between gap-2 rounded-sm px-3 text-left"
        >
          <span className="truncate text-sm font-medium">
            {resolvedSelected
              ? truncateText(getLabelText(resolvedSelected), 60)
              : placeholder}
          </span>

          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0"
        // Safety net: keep wheel/touch events away from the
        // Sheet's scroll lock (react-remove-scroll).
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        {/* shouldFilter={false}: search is handled by the server */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search..."
            value={search}
            onValueChange={setSearch}
          />

          {/* CommandList itself is the scroll container */}
          <CommandList
            className="max-h-72 overflow-y-auto overscroll-contain"
            onScroll={handleScroll}
          >
            {loading && options.length === 0 && (
              <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
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

            {!loading && options.length === 0 && !error && (
              <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                No results found
              </div>
            )}

            <CommandGroup>
              {options.map((item) => {
                const itemId = item[valueField];
                const isSelected = sameId(itemId, value);

                return (
                  <CommandItem
                    key={String(itemId)}
                    value={`${getLabelText(item)} ${String(itemId)}`}
                    onSelect={() => handleSelect(item)}
                    className="flex items-start gap-3 py-3 text-sm"
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />

                    <span className="line-clamp-2 break-words">
                      {getOptionNode(item)}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {loading && options.length > 0 && (
              <div className="flex items-center justify-center gap-2 p-3 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading more...
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};