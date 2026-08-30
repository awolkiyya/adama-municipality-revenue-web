import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";
import {
  Permission,
  Role,
  RolePermissionPayload,
  UserRolePayload,
} from "@/types/access-management";
import { ApiResponse, ListResponse } from "@/types/api";
import { PermissionGroup } from "@/types/permission.types";

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
  getPermissions: async (params?: {
    search?: string;
    page?: number;
    per_page?: number;
    guard_name?: string;
  }): Promise<ListResponse<PermissionGroup>> => {
    try {
      const cleanParams = Object.entries(params || {}).reduce(
        (acc, [key, value]) => {
          if (
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {
            acc[key] = value;
          }

          return acc;
        },
        {} as Record<string, any>
      );

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
   *
   * NOTE:
   * This endpoint must exist in Laravel before using it.
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
  getRoles: async (params?: {
    search?: string;
    page?: number;
    per_page?: number;
    guard_name?: string;
  }): Promise<ListResponse<Role>> => {
    try {
      const cleanParams = Object.entries(params || {}).reduce(
        (acc, [key, value]) => {
          if (
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {
            acc[key] = value;
          }

          return acc;
        },
        {} as Record<string, any>
      );

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
   *
   * Only role metadata:
   * - name
   * - description
   *
   * Permission assignment/revocation is handled separately.
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
   * IMPORTANT:
   * Your current Laravel routes do NOT define this endpoint.
   *
   * Add:
   *
   * GET /system/access-management/roles/{role}/permissions
   *
   * if you need this method.
   */
  getRolePermissions: async (
    roleId: string
  ): Promise<ApiResponse<Permission[]>> => {
    try {
      const res = await api.get<ApiResponse<Permission[]>>(
        `/system/access-management/roles/${roleId}/permissions`
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
   */
  getRoleHistory: async (
    roleId: string
  ): Promise<ApiResponse<any>> => {
    try {
      const res = await api.get<ApiResponse<any>>(
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
   * IMPORTANT:
   *
   * These endpoints are NOT defined in the Role routes you
   * showed earlier.
   *
   * Keep these URLs only if your UserController routes
   * actually define them.
   */

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
   */
  assignUserRole: async (
    userId: string,
    data: UserRolePayload
  ): Promise<ApiResponse<any>> => {
    try {
      const res = await api.post<ApiResponse<any>>(
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