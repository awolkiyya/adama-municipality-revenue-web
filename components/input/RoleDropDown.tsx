"use client";

import React, { useCallback } from "react";

import { AsyncDropdown } from "./AsyncDropdown";
import { Role } from "@/types/access-management";
import { accessManagementService } from "@/services/accessManagement.service";

interface RoleDropdownProps {
  value: number | null;

  onChange: (
    value: number,
    item: Role
  ) => void;

  disabled?: boolean;
}

export const RoleDropdown: React.FC<RoleDropdownProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const fetchRoles = useCallback(
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
        await accessManagementService.getRoles({
          search,
          page,
          per_page: pageSize,
        });

      return {
        data: Array.isArray(result?.data)
          ? result.data
          : [],

        total:
          result?.meta?.total ?? 0,
      };
    },
    []
  );

  return (
    <AsyncDropdown<Role, number>
      value={value}
      onChange={onChange}
      fetchData={fetchRoles}
      displayField="name"
      valueField="id"
      renderLabel={(item) => item.name}
      placeholder="Select Role"
      pageSize={20}
      disabled={disabled}
    />
  );
};