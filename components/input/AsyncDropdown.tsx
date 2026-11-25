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

interface AsyncDropdownProps<T extends object, V extends string | number> {
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

    return text.length > max
        ? `${text.slice(0, max)}...`
        : text;
};

const sameId = (
    first: unknown,
    second: unknown,
): boolean => {
    if (first == null || second == null) {
        return first == null && second == null;
    }

    return String(first) === String(second);
};

const uniqueByValue = <T extends object>(
    items: T[],
    valueField: keyof T,
): T[] => {
    const seen = new Set<string>();

    return items.filter((item) => {
        const id = item[valueField];

        if (id == null) return false;

        const normalizedId = String(id);

        if (seen.has(normalizedId)) return false;

        seen.add(normalizedId);

        return true;
    });
};

/* =========================================================
   COMPONENT
========================================================= */

export const AsyncDropdown = <
    T extends object,
    V extends string | number,
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
    /* =====================================================
       STATE
    ===================================================== */

    const [open, setOpen] = useState(false);

    const [options, setOptions] = useState<T[]>([]);

    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);

    const [total, setTotal] = useState<number | null>(null);

    const [loadedCount, setLoadedCount] = useState(0);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const [hasMore, setHasMore] = useState(true);

    const [hasLoadedFirstPage, setHasLoadedFirstPage] =
        useState(false);

    const [selectedItem, setSelectedItem] = useState<T | null>(
        null,
    );

    /* =====================================================
       REFS
    ===================================================== */

    const mountedRef = useRef(false);

    const requestIdRef = useRef(0);

    const loadingMoreRef = useRef(false);

    const valueRef = useRef<V | null>(value);

    const selectedItemRef = useRef<T | null>(null);

    const optionsRef = useRef<T[]>([]);

    const loadedIdsRef = useRef<Set<string>>(new Set());

    const loadedCountRef = useRef(0);

    const listRef = useRef<HTMLDivElement>(null);

    const fetchDataRef = useRef(fetchData);

    const fetchItemByIdRef = useRef(fetchItemById);

    const onChangeRef = useRef(onChange);

    /* =====================================================
       KEEP LATEST CALLBACKS
    ===================================================== */

    useEffect(() => {
        fetchDataRef.current = fetchData;
    }, [fetchData]);

    useEffect(() => {
        fetchItemByIdRef.current = fetchItemById;
    }, [fetchItemById]);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    /* =====================================================
       MOUNT TRACKING
    ===================================================== */

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;

            requestIdRef.current += 1;

            loadingMoreRef.current = false;
        };
    }, []);

    /* =====================================================
       SYNCHRONIZE VALUE REF
    ===================================================== */

    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    /* =====================================================
       SAFE OPTIONS UPDATER
    ===================================================== */

    const updateOptions = useCallback(
        (
            updater: T[] | ((previous: T[]) => T[]),
        ) => {
            const nextOptions =
                typeof updater === "function"
                    ? updater(optionsRef.current)
                    : updater;

            optionsRef.current = nextOptions;

            setOptions(nextOptions);
        },
        [],
    );

    /* =====================================================
       LABEL HELPERS
    ===================================================== */

    const getLabelText = useCallback(
        (item: T): string => {
            if (renderLabel) {
                return renderLabel(item);
            }

            if (displayField) {
                const raw: unknown = item[displayField];

                if (
                    typeof raw === "string" ||
                    typeof raw === "number"
                ) {
                    return String(raw);
                }
            }

            return "";
        },
        [renderLabel, displayField],
    );

    const getOptionNode = useCallback(
        (item: T): React.ReactNode => {
            if (renderOption) {
                return renderOption(item);
            }

            return getLabelText(item);
        },
        [renderOption, getLabelText],
    );

    /* =====================================================
       RESOLVE CURRENT SELECTION
    ===================================================== */

    const resolvedSelected = useMemo(() => {
        if (value == null) return null;

        const matchingOption = options.find((item) =>
            sameId(item[valueField], value),
        );

        if (matchingOption) {
            return matchingOption;
        }

        if (
            selectedItem &&
            sameId(selectedItem[valueField], value)
        ) {
            return selectedItem;
        }

        return null;
    }, [value, options, selectedItem, valueField]);

    /* =====================================================
       LOAD OPTIONS
    ===================================================== */

    const loadOptions = useCallback(
        async (
            pageNum: number,
            searchText: string,
            reset = false,
        ) => {
            if (!mountedRef.current) return;

            if (!reset && loadingMoreRef.current) {
                return;
            }

            if (reset) {
                loadingMoreRef.current = false;
            } else {
                loadingMoreRef.current = true;
            }

            const requestId = ++requestIdRef.current;

            setLoading(true);
            setError(null);

            try {
                const result = await fetchDataRef.current({
                    search: searchText,
                    page: pageNum,
                    pageSize,
                });

                if (
                    !mountedRef.current ||
                    requestId !== requestIdRef.current
                ) {
                    return;
                }

                const incomingOptions = uniqueByValue(
                    Array.isArray(result?.data)
                        ? result.data
                        : [],
                    valueField,
                );

                const responseTotal =
                    typeof result?.total === "number"
                        ? result.total
                        : null;

                if (reset) {
                    const currentValue = valueRef.current;

                    const currentSelectedItem =
                        selectedItemRef.current;

                    const previousSelected =
                        optionsRef.current.find((item) =>
                            sameId(
                                item[valueField],
                                currentValue,
                            ),
                        ) ??
                        (
                            currentSelectedItem &&
                            sameId(
                                currentSelectedItem[valueField],
                                currentValue,
                            )
                                ? currentSelectedItem
                                : null
                        );

                    const mergedOptions = [...incomingOptions];

                    if (
                        previousSelected &&
                        !mergedOptions.some((item) =>
                            sameId(
                                item[valueField],
                                previousSelected[valueField],
                            ),
                        )
                    ) {
                        mergedOptions.unshift(previousSelected);
                    }

                    updateOptions(mergedOptions);

                    loadedIdsRef.current = new Set(
                        incomingOptions.map((item) =>
                            String(item[valueField]),
                        ),
                    );

                    loadedCountRef.current =
                        incomingOptions.length;

                    setLoadedCount(incomingOptions.length);

                    setHasLoadedFirstPage(true);

                    setHasMore(
                        responseTotal !== null
                            ? incomingOptions.length < responseTotal
                            : incomingOptions.length >= pageSize,
                    );
                } else {
                    const previousIds = loadedIdsRef.current;

                    const newUniqueOptions = incomingOptions.filter(
                        (item) =>
                            !previousIds.has(
                                String(item[valueField]),
                            ),
                    );

                    for (const item of incomingOptions) {
                        previousIds.add(
                            String(item[valueField]),
                        );
                    }

                    updateOptions((previous) =>
                        uniqueByValue(
                            [...previous, ...incomingOptions],
                            valueField,
                        ),
                    );

                    const nextLoadedCount =
                        loadedCountRef.current +
                        newUniqueOptions.length;

                    loadedCountRef.current = nextLoadedCount;

                    setLoadedCount(nextLoadedCount);

                    setHasMore(
                        responseTotal !== null
                            ? nextLoadedCount < responseTotal
                            : incomingOptions.length >= pageSize,
                    );
                }

                setPage(pageNum);
                setTotal(responseTotal);
            } catch (err) {
                if (
                    !mountedRef.current ||
                    requestId !== requestIdRef.current
                ) {
                    return;
                }

                console.error(
                    "AsyncDropdown: failed to load options",
                    err,
                );

                setError(
                    "Failed to load data. Please try again.",
                );
            } finally {
                if (
                    mountedRef.current &&
                    requestId === requestIdRef.current
                ) {
                    setLoading(false);
                    loadingMoreRef.current = false;
                }
            }
        },
        [pageSize, valueField, updateOptions],
    );

    /* =====================================================
       SEARCH HANDLER

       State resets happen in the input event handler,
       not synchronously inside the search effect.
    ===================================================== */

    const handleSearchChange = useCallback(
        (nextSearch: string) => {
            setSearch(nextSearch);

            // Preserve the currently selected item before
            // clearing the previous search results.
            const currentValue = valueRef.current;

            const matchingSelected =
                optionsRef.current.find((item) =>
                    sameId(item[valueField], currentValue),
                ) ??
                (
                    selectedItemRef.current &&
                    sameId(
                        selectedItemRef.current[valueField],
                        currentValue,
                    )
                        ? selectedItemRef.current
                        : null
                );

            if (matchingSelected) {
                selectedItemRef.current = matchingSelected;
                setSelectedItem(matchingSelected);
            }

            // Invalidate any request from the previous search.
            requestIdRef.current += 1;
            loadingMoreRef.current = false;

            // Reset pagination for the new search.
            loadedIdsRef.current = new Set();
            loadedCountRef.current = 0;

            updateOptions([]);

            setPage(1);
            setTotal(null);
            setLoadedCount(0);
            setHasMore(true);
            setHasLoadedFirstPage(false);
            setError(null);
            setLoading(false);
        },
        [updateOptions, valueField],
    );

    /* =====================================================
       INITIAL LOAD + SEARCH

       No synchronous state updates are performed directly
       inside this effect.
    ===================================================== */

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadOptions(1, search, true);
        }, Math.max(0, debounceTime));

        return () => {
            window.clearTimeout(timer);

            requestIdRef.current += 1;

            loadingMoreRef.current = false;
        };
    }, [search, loadOptions, debounceTime]);

    /* =====================================================
       LOAD SELECTED ITEM BY ID
    ===================================================== */

    useEffect(() => {
        if (
            value == null ||
            !fetchItemByIdRef.current ||
            resolvedSelected
        ) {
            return;
        }

        let active = true;

        const loadSelectedItem = async () => {
            try {
                const item =
                    await fetchItemByIdRef.current?.(value);

                if (
                    !active ||
                    !mountedRef.current ||
                    !item ||
                    !sameId(item[valueField], value)
                ) {
                    return;
                }

                selectedItemRef.current = item;

                setSelectedItem(item);

                updateOptions((previous) => {
                    const exists = previous.some((option) =>
                        sameId(
                            option[valueField],
                            item[valueField],
                        ),
                    );

                    if (exists) return previous;

                    return [item, ...previous];
                });
            } catch (err) {
                if (active) {
                    console.error(
                        "AsyncDropdown: failed to load selected item",
                        err,
                    );
                }
            }
        };

        void loadSelectedItem();

        return () => {
            active = false;
        };
    }, [
        value,
        valueField,
        resolvedSelected,
        updateOptions,
    ]);

    /* =====================================================
       INFINITE SCROLL
    ===================================================== */

    const handleScroll = useCallback(
        (event: React.UIEvent<HTMLDivElement>) => {
            const element = event.currentTarget;

            const reachedBottom =
                element.scrollTop + element.clientHeight >=
                element.scrollHeight - 24;

            if (
                !reachedBottom ||
                loading ||
                loadingMoreRef.current ||
                !hasMore ||
                !hasLoadedFirstPage
            ) {
                return;
            }

            void loadOptions(page + 1, search);
        },
        [
            loading,
            hasMore,
            hasLoadedFirstPage,
            loadOptions,
            page,
            search,
        ],
    );

    /* =====================================================
       AUTO-FILL WHEN LIST DOES NOT OVERFLOW
    ===================================================== */

    useEffect(() => {
        if (
            !open ||
            loading ||
            !hasMore ||
            !hasLoadedFirstPage ||
            loadingMoreRef.current
        ) {
            return;
        }

        const element = listRef.current;

        if (!element) return;

        /*
         * If the loaded options do not fill the available
         * dropdown height, fetch another page automatically.
         */
        const hasScrollableContent =
            element.scrollHeight > element.clientHeight + 4;

        if (!hasScrollableContent) {
            void loadOptions(page + 1, search);
        }
    }, [
        open,
        options,
        loading,
        hasMore,
        hasLoadedFirstPage,
        page,
        search,
        loadOptions,
    ]);

    /* =====================================================
       OPEN / CLOSE
    ===================================================== */

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            setOpen(nextOpen);

            if (!nextOpen && search) {
                handleSearchChange("");
            }
        },
        [search, handleSearchChange],
    );

    /* =====================================================
       SELECT
    ===================================================== */

    const handleSelect = useCallback(
        (item: T) => {
            const rawValue = item[valueField];

            if (
                rawValue == null ||
                (
                    typeof rawValue !== "string" &&
                    typeof rawValue !== "number"
                )
            ) {
                console.error(
                    "AsyncDropdown: selected item has an invalid value",
                    {
                        item,
                        valueField,
                    },
                );

                return;
            }

            const selectedValue = rawValue as V;

            valueRef.current = selectedValue;

            selectedItemRef.current = item;

            setSelectedItem(item);

            onChangeRef.current(selectedValue, item);

            handleOpenChange(false);
        },
        [valueField, handleOpenChange],
    );

    /* =====================================================
       RETRY
    ===================================================== */

    const handleRetry = useCallback(() => {
        // Reload from page one to ensure the current search
        // and pagination state are consistent after an error.
        requestIdRef.current += 1;
        loadingMoreRef.current = false;

        loadedIdsRef.current = new Set();
        loadedCountRef.current = 0;

        updateOptions([]);

        setPage(1);
        setTotal(null);
        setLoadedCount(0);
        setHasMore(true);
        setHasLoadedFirstPage(false);
        setError(null);

        void loadOptions(1, search, true);
    }, [loadOptions, search, updateOptions]);

    /* =====================================================
       UI
    ===================================================== */

    return (
        <Popover
            open={open}
            onOpenChange={handleOpenChange}
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
                            ? truncateText(
                                getLabelText(resolvedSelected),
                                60,
                            )
                            : placeholder}
                    </span>

                    <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="start"
                sideOffset={6}
                className="w-[var(--radix-popover-trigger-width)] min-w-[280px] overflow-hidden p-0"
            >
                <Command shouldFilter={false}>
                    {/* Search */}

                    <CommandInput
                        placeholder="Search..."
                        value={search}
                        onValueChange={handleSearchChange}
                    />

                    {/* Scrollable Options */}

                    <CommandList
                        ref={listRef}
                        onScroll={handleScroll}
                        className={cn(
                            "max-h-72 overflow-x-hidden overflow-y-auto overscroll-contain",
                            "[&_[cmdk-list-sizer]]:min-h-0",
                        )}
                    >
                        {/* Initial Loading */}

                        {loading && options.length === 0 && (
                            <div className="flex min-h-28 flex-col items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                                <Loader2 className="size-5 animate-spin text-primary" />

                                <span>Loading options...</span>
                            </div>
                        )}

                        {/* Error */}

                        {error && (
                            <div className="flex flex-col items-center gap-2 p-4 text-center">
                                <div className="flex size-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                    <AlertCircle className="size-4" />
                                </div>

                                <p className="text-sm text-destructive">
                                    {error}
                                </p>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRetry}
                                >
                                    Try again
                                </Button>
                            </div>
                        )}

                        {/* Empty State */}

                        {!loading &&
                            !error &&
                            options.length === 0 && (
                                <div className="flex min-h-28 flex-col items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                                    <Info className="size-5" />

                                    <span>No results found</span>
                                </div>
                            )}

                        {/* Options */}

                        {options.length > 0 && (
                            <CommandGroup>
                                {options.map((item) => {
                                    const itemId = item[valueField];

                                    const isSelected = sameId(
                                        itemId,
                                        value,
                                    );

                                    return (
                                        <CommandItem
                                            key={String(itemId)}
                                            value={`${getLabelText(item)} ${String(itemId)}`}
                                            onSelect={() =>
                                                handleSelect(item)
                                            }
                                            className="flex items-start gap-3 py-3 text-sm"
                                        >
                                            <Check
                                                className={cn(
                                                    "mt-0.5 size-4 shrink-0",
                                                    isSelected
                                                        ? "opacity-100"
                                                        : "opacity-0",
                                                )}
                                            />

                                            <span className="min-w-0 flex-1 break-words">
                                                {getOptionNode(item)}
                                            </span>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        )}

                        {/* Loading More - Sticky Footer */}

                        {loading && options.length > 0 && (
                            <div className="sticky bottom-0 z-10 flex items-center justify-center gap-2 border-t bg-popover/95 px-3 py-3 text-xs text-muted-foreground backdrop-blur">
                                <Loader2 className="size-4 animate-spin text-primary" />

                                <span>Loading more options...</span>
                            </div>
                        )}

                        {/* End of Results */}

                        {!loading &&
                            !error &&
                            options.length > 0 &&
                            !hasMore && (
                                <div className="border-t py-3 text-center text-xs text-muted-foreground">
                                    {total !== null
                                        ? `${loadedCount} of ${total} results`
                                        : "No more results"}
                                </div>
                            )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};