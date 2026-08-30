"use client";

import React, { useCallback } from "react";

import { AsyncDropdown } from "./AsyncDropdown";
import { Sector } from "@/types/admin-unit";
import { adminUnitService } from "@/services/adminUnit.service";

interface SectorDropdownProps {
  value: string | null;

  onChange: (
    value: string,
    item: Sector
  ) => void;

  disabled?: boolean;

  clusterId?: string;
}

export const SectorDropdown: React.FC<SectorDropdownProps> = ({
  value,
  onChange,
  disabled = false,
  clusterId,
}) => {
  const fetchSectors = useCallback(
    async ({
      search,
      page,
      pageSize,
    }: {
      search: string;
      page: number;
      pageSize: number;
    }) => {
      const result = await adminUnitService.getSectors({
        cluster_id: clusterId,
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
    [clusterId]
  );

  return (
    <AsyncDropdown<Sector, string>
      value={value}
      onChange={onChange}
      fetchData={fetchSectors}
      displayField="name"
      valueField="id"
      renderLabel={(item) => ` ${item.name}`}
      placeholder="Select Sector"
      pageSize={20}
      disabled={disabled}
    />
  );
};