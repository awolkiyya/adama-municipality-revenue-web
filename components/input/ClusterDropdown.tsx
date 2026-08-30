"use client";

import React, { useState, useCallback } from "react";
import { AsyncDropdown } from "./AsyncDropdown";
import { adminUnitService } from "@/services/adminUnit.service";
import { Cluster } from "@/types/admin-unit";

interface ClusterDropdownProps {
  value: string | null;
  onChange: (value: string, item: Cluster) => void;
  disabled?: boolean;
}

export const ClusterDropdown: React.FC<ClusterDropdownProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [pageSize] = useState(20);

  const fetchObjectives = useCallback(
    async ({
      search,
      page,
      pageSize,
    }: {
      search: string;
      page: number;
      pageSize: number;
    }) => {
      const result = await adminUnitService.getClusters({
        search,
        page,
        per_page:pageSize,
        is_active: true,
      });

      return {
        data: Array.isArray(result?.data) ? result.data : [],
        total: result?.meta?.total ?? 0,
      };
    },
    []
  );

  return (
    <AsyncDropdown<Cluster, string>
      value={value}
      onChange={onChange}
      fetchData={fetchObjectives}
      displayField="name"
      valueField="id"
      placeholder="Select Active Cluster"
      pageSize={pageSize}
      disabled={disabled}
    />
  );
};