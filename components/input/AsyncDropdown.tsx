"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
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

import { ScrollArea } from "@/components/ui/scroll-area";

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

  /**
   * Default label field (plain text).
   * Used when renderLabel is not provided.
   */
  displayField?: keyof T;

  /**
   * Plain-text label generator.
   *
   * IMPORTANT: must return a string — this is used in the trigger
   * button (and as the fallback row label). Returning JSX here will
   * break the trigger (it needs a plain string, not a React node).
   *
   * Example:
   * renderLabel={(item) => `${item.code} - ${item.name}`}
   */
  renderLabel?: (item: T) => string;

  /**
   * Optional rich JSX renderer for dropdown list rows only
   * (badges, icons, secondary text, etc). Falls back to
   * renderLabel / displayField when not provided.
   *
   * Example:
   * renderOption={(item) => (
   *   <div className="flex flex-col">
   *     <span className="font-medium">{item.name}</span>
   *     <span className="text-xs text-muted-foreground">{item.code}</span>
   *   </div>
   * )}
   */
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

const truncateText = (text: string, max: number = 60) => {
  if (!text) return "";

  return text.length > max ? text.slice(0, max) + "..." : text;
};

/* =========================================================
   COMPONENT
========================================================= */

export const AsyncDropdown = <T extends Record<string, any>, V extends string | number>({
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

  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const mountedRef = useRef(true);

  const resolvedSelected =
    selectedItem ||
    options.find((item) => item[valueField] === value) ||
    null;

  /**
   * Plain-text label — SAFE for the trigger button.
   * Always guaranteed to return a string, never an object/JSX.
   */
  const getLabelText = (item: T): string => {
    if (renderLabel) {
      return renderLabel(item);
    }

    if (displayField) {
      const raw = item[displayField];

      // Guard against fields that are objects/arrays instead of primitives
      if (typeof raw === "string" || typeof raw === "number") {
        return String(raw);
      }

      return "";
    }

    return "";
  };

  /**
   * Rich node for dropdown rows — can be JSX if renderOption is given,
   * otherwise falls back to the plain-text label.
   */
  const getOptionNode = (item: T): React.ReactNode => {
    if (renderOption) {
      return renderOption(item);
    }

    return getLabelText(item);
  };

  /* =========================
     LOAD DATA
  ========================= */

  const loadOptions = useCallback(
    async (pageNum: number, searchText: string, reset = false) => {
      setLoading(true);

      setError(null);

      try {
        const res = await fetchData({
          search: searchText,
          page: pageNum,
          pageSize,
        });

        if (!mountedRef.current) return;

        setOptions((prev) => (reset ? res.data ?? [] : [...prev, ...(res.data ?? [])]));

        setPage(pageNum);

        setTotal(res.total ?? null);
      } catch (err) {
        console.error(err);

        setError("Failed to load data");
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [fetchData, pageSize]
  );

  /* =========================
     INITIAL LOAD + SEARCH
  ========================= */

  useEffect(() => {
    mountedRef.current = true;

    const timer = setTimeout(() => {
      loadOptions(1, search, true);
    }, debounceTime);

    return () => {
      clearTimeout(timer);

      mountedRef.current = false;
    };
  }, [search, loadOptions, debounceTime]);

  /* =========================
     LOAD SELECTED ITEM
  ========================= */

  useEffect(() => {
    if (value == null || !fetchItemById) return;

    let active = true;

    (async () => {
      try {
        const item = await fetchItemById(value);

        if (!active || !item) return;

        setSelectedItem(item);

        setOptions((prev) => {
          const exists = prev.some((p) => p[valueField] === item[valueField]);

          return exists ? prev : [item, ...prev];
        });
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      active = false;
    };
  }, [value, fetchItemById, valueField]);

  /* =========================
     INFINITE SCROLL
  ========================= */

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;

    if (
      el.scrollTop + el.clientHeight >= el.scrollHeight - 20 &&
      !loading &&
      total !== null &&
      options.length < total
    ) {
      loadOptions(page + 1, search);
    }
  };

  /* =========================
     SELECT
  ========================= */

  const handleSelect = (item: T) => {
    const val = item[valueField] as V;

    setSelectedItem(item);

    onChange(val, item);

    setOpen(false);
  };

  /* =========================
     UI
  ========================= */

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="h-11 w-full justify-between gap-2 px-3 text-left rounded-sm"
        >
          <span className="truncate text-sm font-medium">
            {resolvedSelected ? truncateText(getLabelText(resolvedSelected), 60) : placeholder}
          </span>

          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0"
      >
        <Command>
          <div className="border-b p-2">
            <CommandInput placeholder="Search..." value={search} onValueChange={setSearch} />
          </div>

          <CommandList>
            <ScrollArea className="max-h-72" onScroll={handleScroll}>
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
                  const isSelected = item[valueField] === value;

                  return (
                    <CommandItem
                      key={String(item[valueField])}
                      onSelect={() => handleSelect(item)}
                      className="flex items-start gap-3 py-3 text-sm"
                    >
                      <Check
                        className={cn("mt-0.5 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}
                      />

                      <span className="line-clamp-2 break-words">{getOptionNode(item)}</span>
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
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};