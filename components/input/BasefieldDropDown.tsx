"use client";

import React, { useCallback } from "react";

import { AsyncMultiSelect } from "./AsyncMultiSelect";
import { BaseField } from "@/types/revenue/revenue-baseField";
import { baseFieldService } from "@/services/revenue/revenueBaseField.service";

interface BaseFieldDropdownProps {
  value: string | null;

  onChange: (
    value: string | null,
    item: BaseField | null
  ) => void;

  disabled?: boolean;
}

export const BaseFieldDropdown: React.FC<
  BaseFieldDropdownProps
> = ({
  value,
  onChange,
  disabled = false,
}) => {
  /* ============================================================
     FETCH BASE FIELDS
  ============================================================ */

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
      const result =
        await baseFieldService.getBaseFields({
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
    []
  );

  /* ============================================================
     FETCH SELECTED ITEMS BY IDS
  ============================================================ */

  const fetchBaseFieldsByIds = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) {
        return [];
      }

      const result =
        await baseFieldService.getBaseFields({
          ids,
        });

      return Array.isArray(result?.data)
        ? result.data
        : [];
    },
    []
  );

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <AsyncMultiSelect<BaseField, string>
      value={value ? [value] : []}

      onChange={(values, items) => {
        onChange(
          values[0] ?? null,
          items[0] ?? null
        );
      }}

      fetchData={fetchBaseFields}

      fetchItemsByIds={
        fetchBaseFieldsByIds
      }

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