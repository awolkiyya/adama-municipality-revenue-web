
"use client";

import React, { useCallback, useMemo } from "react";

import { AsyncDropdown } from "./AsyncDropdown";
import type { BaseField } from "@/types/revenue/revenue-baseField";
import { baseFieldService } from "@/services/revenue/revenueBaseField.service";

interface BaseFieldDropdownProps {
    value: string | null;
    onChange: (value: string, item: BaseField) => void;
    excludeIds?: string[];
    disabled?: boolean;
}

interface FetchBaseFieldsParams {
    search: string;
    page: number;
    pageSize: number;
}

interface FetchBaseFieldsResult {
    data: BaseField[];
    total: number;
}

const normalizeId = (value: unknown): string =>
    String(value ?? "").trim();

export const BaseFieldDropdown: React.FC<BaseFieldDropdownProps> = ({
    value,
    onChange,
    excludeIds = [],
    disabled = false,
}) => {
    const pageSize = 100;

    /**
     * Normalize and deduplicate excluded IDs.
     *
     * Sorting ensures that equivalent exclusion arrays
     * produce the same dependency value.
     */
    const excludeKey = useMemo(
        () =>
            [...new Set(
                excludeIds
                    .map(normalizeId)
                    .filter(Boolean)
            )]
                .sort()
                .join("|"),
        [excludeIds]
    );

    const normalizedExcludeIds = useMemo(
        () => new Set(
            excludeKey ? excludeKey.split("|") : []
        ),
        [excludeKey]
    );

    /**
     * Fetch active base fields.
     *
     * Excluded IDs are filtered from the returned page.
     *
     * NOTE:
     * For accurate pagination across all pages, the backend
     * should support an exclude_ids parameter and calculate
     * the filtered total itself.
     */
    const fetchBaseFields = useCallback(
        async ({
            search,
            page,
            pageSize: requestedPageSize,
        }: FetchBaseFieldsParams): Promise<FetchBaseFieldsResult> => {
            const result = await baseFieldService.getBaseFields({
                search,
                page,
                per_page: requestedPageSize,
                isActive: true,
            });

            const responseData: BaseField[] = Array.isArray(result?.data)
                ? result.data
                : [];

            const filteredFields = responseData.filter((field) => {
                const id = normalizeId(field.id);

                if (!id) {
                    return false;
                }

                if (normalizedExcludeIds.has(id)) {
                    return false;
                }

                // Ignore explicitly inactive records.
                // Supports either API naming convention.
                const isActive = (
                    field as BaseField & {
                        is_active?: boolean;
                        isActive?: boolean;
                    }
                ).is_active ?? (
                    field as BaseField & {
                        isActive?: boolean;
                    }
                ).isActive;

                return isActive !== false;
            });

            const serverTotal = Number(result?.meta?.total ?? 0);

            return {
                data: filteredFields,

                // The backend total is retained because client-side
                // filtering only sees the current page.
                // Do not pretend this is the exact filtered total.
                total: Number.isFinite(serverTotal)
                    ? serverTotal
                    : filteredFields.length,
            };
        },
        [normalizedExcludeIds]
    );

    /**
     * Validate the selected ID before notifying the parent.
     */
    const handleChange = useCallback(
        (selectedValue: string, selectedItem: BaseField) => {
            const selectedId = normalizeId(selectedItem?.id);
            const receivedId = normalizeId(selectedValue);

            if (!selectedId || !receivedId || selectedId !== receivedId) {
                console.error(
                    "Invalid base field selection: selected ID mismatch",
                    {
                        selectedValue,
                        selectedItemId: selectedItem?.id,
                        selectedItem,
                    }
                );

                return;
            }

            if (normalizedExcludeIds.has(selectedId)) {
                console.error(
                    "Duplicate base field selection is not allowed",
                    {
                        selectedId,
                        excludedIds: Array.from(normalizedExcludeIds),
                    }
                );

                return;
            }

            // Pass the original canonical ID without modifying it.
            onChange(selectedId, selectedItem);
        },
        [onChange, normalizedExcludeIds]
    );

    return (
        <AsyncDropdown<BaseField, string>
            value={value}
            onChange={handleChange}
            fetchData={fetchBaseFields}
            displayField="name"
            valueField="id"
            placeholder="Select base field"
            pageSize={pageSize}
            disabled={disabled}
        />
    );
};
