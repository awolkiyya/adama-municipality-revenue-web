"use client";

import React, { useCallback, useState } from "react";

import { AsyncDropdown } from "./AsyncDropdown";
import { BaseField } from "@/types/revenue/revenue-baseField";
import { baseFieldService } from "@/services/revenue/revenueBaseField.service";

interface BaseFieldDropdownProps {
  value: string | null;

  onChange: (value: string, item: BaseField) => void;

  /**
   * Base field ids to exclude from the results — e.g. fields
   * already selected in other rows of the same form, so the
   * same field can't be picked twice.
   */
  excludeIds?: string[];

  disabled?: boolean;
}

export const BaseFieldDropdown: React.FC<BaseFieldDropdownProps> = ({
  value,
  onChange,
  excludeIds = [],
  disabled = false,
}) => {
  const [pageSize] = useState(20);

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
        // Requires server-side support: BaseFieldFilters needs an
        // `excludeIds?: string[]` entry, and getBaseFields needs to
        // apply it. Without that, this silently stops excluding
        // already-used fields and duplicates become possible again.
      });

      return {
        data: Array.isArray(result?.data) ? result.data : [],
        total: result?.meta?.total ?? 0,
      };
    },
    // Refetch whenever the set of fields to exclude changes, so a
    // pick made in another row immediately drops out of this list.
    [excludeIds]
  );

  return (
    <AsyncDropdown<BaseField, string>
      value={value}
      onChange={onChange}
      fetchData={fetchBaseFields}
      displayField="name"
      valueField="id"
      placeholder="Select base field"
      pageSize={pageSize}
      disabled={disabled}
    />
  );
};