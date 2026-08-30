"use client";

import React, { useCallback } from "react";

import { AsyncDropdown } from "./AsyncDropdown";
import { RevenueCode } from "@/types/revenue/revenue-code";
import { revenueCodeService } from "@/services/revenue/revenueCode.service";

interface RevenueCodeDropdownProps {
  value: string | null;

  onChange: (
    value: string,
    item: RevenueCode
  ) => void;

  disabled?: boolean;
}

export const RevenueCodeDropdown: React.FC<
  RevenueCodeDropdownProps
> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const fetchRevenueCodes = useCallback(
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
        await revenueCodeService.getCodes({
          search,
          page,
          per_page: pageSize,
          is_active: true,
        });

      return {
        data: Array.isArray(result?.data)
          ? result.data
          : [],

        total: result?.meta?.total ?? 0,
      };
    },
    []
  );

  return (
    <AsyncDropdown<RevenueCode, string>
      value={value}
      onChange={onChange}
      fetchData={fetchRevenueCodes}
      displayField="name"
      valueField="id"
      renderLabel={(item) =>
        `${item.code} - ${item.name}`
      }
      placeholder="Select Revenue Code"
      pageSize={20}
      disabled={disabled}
    />
  );
};