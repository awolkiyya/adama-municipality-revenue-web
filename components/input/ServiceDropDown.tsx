"use client";

import React, { useCallback } from "react";

import { AsyncDropdown } from "./AsyncDropdown";


import {
  RevenueService,
  RevenueServiceFilters,
} from "@/types/revenue/revenu-service";
import { revenueServiceService } from "@/services/revenue/revenueService.service";

interface ServiceDropdownProps {
  value: string | null;

  onChange: (
    value: string,
    item: RevenueService
  ) => void;

  disabled?: boolean;

  placeholder?: string;

  pageSize?: number;

  filters?: Omit<
    RevenueServiceFilters,
    "search" | "page" | "per_page"
  >;
}

export function ServiceDropdown({
  value,
  onChange,
  disabled = false,
  placeholder = "Select Revenue Service",
  pageSize = 20,
  filters,
}: ServiceDropdownProps) {
  const fetchServices = useCallback(
    async ({
      search,
      page,
      pageSize,
    }: {
      search: string;
      page: number;
      pageSize: number;
    }) => {
      const result = await revenueServiceService.getServices({
        ...filters,
        search,
        page,
        per_page: pageSize,
        is_active: true,
      });

      return {
        data: result.data ?? [],
        total: result.meta?.total ?? 0,
      };
    },
    [filters]
  );

  return (
    <AsyncDropdown<RevenueService, string>
      value={value}
      onChange={onChange}
      fetchData={fetchServices}
      displayField="name"
      valueField="id"
      placeholder={placeholder}
      disabled={disabled}
      pageSize={pageSize}
      renderLabel={(service) =>
        `${service.revenueCode?.code ?? ""} ${service.name}`.trim()
      }
    />
  );
}

export default ServiceDropdown;