"use client";

import { useCallback } from "react";

import { AsyncMultiSelect } from "./AsyncMultiSelect";

import type { BaseField } from "@/types/revenue/revenue-baseField";
import { baseFieldService } from "@/services/revenue/revenueBaseField.service";

interface BaseFieldDropdownProps {
  value: string | null;
  onChange: (
    value: string | null,
    item: BaseField | null,
  ) => void;
  disabled?: boolean;
}

export const BaseFieldDropdown = ({
  value,
  onChange,
  disabled = false,
}: BaseFieldDropdownProps) => {
  /**
   * Fetch active base fields for dropdown options.
   * This request is paginated and supports searching.
   */
  const fetchBaseFields = useCallback(
    async ({
      search,
      page,
      pageSize,
    }: {
      search: string;
      page: number;
      pageSize: number;
    }) => {
      const result = await baseFieldService.getBaseFields({
        search,
        page,
        per_page: pageSize,
        isActive: true,
      });

      return {
        data: Array.isArray(result?.data)
          ? result.data
          : [],
        total:
          typeof result?.meta?.total === "number"
            ? result.meta.total
            : undefined,
      };
    },
    [],
  );

  /**
   * Resolve selected IDs independently of the current dropdown page.
   *
   * Important:
   * The API must support filtering by IDs for this request to work
   * reliably when a saved field is outside the first page.
   */
  const fetchBaseFieldsByIds = useCallback(
    async (ids: string[]): Promise<BaseField[]> => {
      const uniqueIds = [...new Set(ids.filter(Boolean))];

      if (uniqueIds.length === 0) {
        return [];
      }

      const result = await baseFieldService.getBaseFields({
        ids: uniqueIds,
        per_page: uniqueIds.length,
      });

      const fields = Array.isArray(result?.data)
        ? result.data
        : [];

      const requestedIds = new Set(uniqueIds);

      // Return only the requested fields, preserving the API response.
      return fields.filter((field) =>
        requestedIds.has(field.id),
      );
    },
    [],
  );

  return (
    <AsyncMultiSelect<BaseField, string>
      value={value ? [value] : []}
      onChange={(values, items) => {
        onChange(values[0] ?? null, items[0] ?? null);
      }}
      fetchData={fetchBaseFields}
      fetchItemsByIds={fetchBaseFieldsByIds}
      renderLabel={(item) =>
        `${item.name} (${item.unit_code ?? "-"})`
      }
      valueField="id"
      placeholder="Select Base Field"
      pageSize={20}
      disabled={disabled}
      multiple={false}
    />
  );
};