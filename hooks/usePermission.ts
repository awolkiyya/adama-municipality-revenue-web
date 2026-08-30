"use client";

import { useSelector } from "react-redux";

import { RootState } from "@/lib/store/store";
import {
  PermissionAction,
  UserPermission,
} from "@/types/user";

export function usePermission() {
  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  /**
   * -----------------------------------------------------
   * NORMALIZE PERMISSIONS
   * -----------------------------------------------------
   *
   * Protect against:
   * - undefined
   * - null
   * - object
   * - malformed Redux state
   */
  const permissions: UserPermission[] =
    Array.isArray(user?.permissions)
      ? user.permissions
      : [];

  /**
   * -----------------------------------------------------
   * NORMALIZE ROLES
   * -----------------------------------------------------
   */
  const roles: string[] =
    Array.isArray(user?.roles)
      ? user.roles
      : [];

  /**
   * -----------------------------------------------------
   * CHECK PERMISSION
   * -----------------------------------------------------
   */
  const can = (
    resource: string,
    action: PermissionAction,
  ): boolean => {
    return permissions.some(
      (permission) =>
        permission.resource === resource &&
        permission.actions.includes(action)
    );
  };

  /**
   * -----------------------------------------------------
   * CHECK ONE ROLE
   * -----------------------------------------------------
   */
  const hasRole = (
    role: string,
  ): boolean => {
    return roles.includes(role);
  };

  /**
   * -----------------------------------------------------
   * CHECK MULTIPLE ROLES
   * -----------------------------------------------------
   */
  const hasAnyRole = (
    roleList: string[],
  ): boolean => {
    return roleList.some((role) =>
      roles.includes(role)
    );
  };

  return {
    permissions,
    roles,
    can,
    hasRole,
    hasAnyRole,
  };
}