
import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import type {
  Permission,
  Role,
  RolePermissionPayload,
  UserRolePayload,
} from "@/types/access-management";

import type {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import type { PermissionGroup } from "@/types/permission.types";

type AccessManagementQueryParams = {
  search?: string;
  page?: number;
  per_page?: number;
  guard_name?: string;
};

/**
 * Access Management API Service
 *
 * Handles:
 * - Roles
 * - Permissions
 * - Role permissions
 * - User roles
 */
export const accessManagementService = {
  /* =====================================================
     PERMISSIONS
  ====================================================== */

  /**
   * GET PERMISSIONS GROUPED BY MODULE
   *
   * GET /system/access-management/permissions/grouped
   */
  getPermissions: async (
    params?: AccessManagementQueryParams
  ): Promise<ListResponse<PermissionGroup>> => {
    try {
      const cleanParams = Object.entries(params ?? {}).reduce<
        Record<string, unknown>
      >((acc, [key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          acc[key] = value;
        }

        return acc;
      }, {});

      const res = await api.get<ListResponse<PermissionGroup>>(
        "/system/access-management/permissions/grouped",
        {
          params: cleanParams,
        }
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * GET SINGLE PERMISSION
   */
  getPermissionById: async (
    id: string
  ): Promise<ApiResponse<Permission>> => {
    try {
      const res = await api.get<ApiResponse<Permission>>(
        `/system/access-management/permissions/${id}`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* =====================================================
     ROLES
  ====================================================== */

  /**
   * GET ALL ROLES
   *
   * GET /system/access-management/roles
   */
  getRoles: async (
    params?: AccessManagementQueryParams
  ): Promise<ListResponse<Role>> => {
    try {
      const cleanParams = Object.entries(params ?? {}).reduce<
        Record<string, unknown>
      >((acc, [key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          acc[key] = value;
        }

        return acc;
      }, {});

      const res = await api.get<ListResponse<Role>>(
        "/system/access-management/roles",
        {
          params: cleanParams,
        }
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * GET SINGLE ROLE
   *
   * GET /system/access-management/roles/{id}
   */
  getRoleById: async (
    id: string
  ): Promise<ApiResponse<Role>> => {
    try {
      const res = await api.get<ApiResponse<Role>>(
        `/system/access-management/roles/${id}`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * CREATE ROLE
   *
   * POST /system/access-management/roles
   */
  createRole: async (data: {
    name: string;
    description?: string;
    permissions?: string[];
  }): Promise<ApiResponse<Role>> => {
    try {
      const res = await api.post<ApiResponse<Role>>(
        "/system/access-management/roles",
        data
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * UPDATE ROLE
   *
   * PATCH /system/access-management/roles/{id}
   */
  updateRole: async (
    id: string,
    data: Partial<{
      name: string;
      description: string;
    }>
  ): Promise<ApiResponse<Role>> => {
    try {
      const res = await api.patch<ApiResponse<Role>>(
        `/system/access-management/roles/${id}`,
        data
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * DELETE ROLE
   *
   * DELETE /system/access-management/roles/{id}
   */
  deleteRole: async (
    id: string
  ): Promise<ApiResponse<null>> => {
    try {
      const res = await api.delete<ApiResponse<null>>(
        `/system/access-management/roles/${id}`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* =====================================================
     ROLE PERMISSIONS
  ====================================================== */

  /**
   * GET ROLE PERMISSIONS
   *
   * GET /system/access-management/roles/{role}/grouped
   */
  getRolePermissions: async (
    roleId: string
  ): Promise<ApiResponse<Permission[]>> => {
    try {
      const res = await api.get<ApiResponse<Permission[]>>(
        `/system/access-management/roles/${roleId}/grouped`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * ASSIGN PERMISSIONS TO ROLE
   *
   * POST /system/access-management/roles/{role}/permissions
   */
  assignRolePermissions: async (
    roleId: string,
    data: RolePermissionPayload
  ): Promise<ApiResponse<Role>> => {
    try {
      const res = await api.post<ApiResponse<Role>>(
        `/system/access-management/roles/${roleId}/permissions`,
        data
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * REVOKE PERMISSIONS FROM ROLE
   *
   * DELETE /system/access-management/roles/{role}/permissions
   */
  revokeRolePermissions: async (
    roleId: string,
    data: RolePermissionPayload
  ): Promise<ApiResponse<Role>> => {
    try {
      const res = await api.delete<ApiResponse<Role>>(
        `/system/access-management/roles/${roleId}/permissions`,
        {
          data,
        }
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* =====================================================
     ROLE HISTORY
  ====================================================== */

  /**
   * GET ROLE HISTORY
   *
   * GET /system/access-management/roles/{role}/history
   *
   * Uses unknown until the backend history response
   * structure is explicitly defined.
   */
  getRoleHistory: async (
    roleId: string
  ): Promise<ApiResponse<unknown>> => {
    try {
      const res = await api.get<ApiResponse<unknown>>(
        `/system/access-management/roles/${roleId}/history`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* =====================================================
     USER ROLE MANAGEMENT
  ====================================================== */

  /**
   * GET USER ROLES
   */
  getUserRoles: async (
    userId: string
  ): Promise<ApiResponse<Role[]>> => {
    try {
      const res = await api.get<ApiResponse<Role[]>>(
        `/system/access-management/users/${userId}/roles`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * ASSIGN ROLE TO USER
   *
   * Uses unknown until the backend assignment response
   * structure is explicitly defined.
   */
  assignUserRole: async (
    userId: string,
    data: UserRolePayload
  ): Promise<ApiResponse<unknown>> => {
    try {
      const res = await api.post<ApiResponse<unknown>>(
        `/system/access-management/users/${userId}/roles`,
        data
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * REMOVE USER ROLE
   */
  removeUserRole: async (
    userId: string,
    roleId: string
  ): Promise<ApiResponse<null>> => {
    try {
      const res = await api.delete<ApiResponse<null>>(
        `/system/access-management/users/${userId}/roles/${roleId}`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};
