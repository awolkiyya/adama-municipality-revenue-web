import { api } from "@/lib/api"
import type {
  ApiSuccessResponse,
  PaginatedResponse,
} from "@/types/api"
import type {
  Role,
  RoleQueryParams,
  CreateRoleRequest,
  UpdateRoleRequest,
} from "@/types/role"

export const roleService = {
  /**
   * Get paginated roles.
   *
   * GET /system/access-management/roles
   */
  list: async (
    params?: RoleQueryParams,
  ): Promise<PaginatedResponse<Role>> => {
    const response =
      await api.get<PaginatedResponse<Role>>(
        "/system/access-management/roles",
        { params },
      )

    return response.data
  },

  /**
   * Get a single role.
   *
   * GET /system/access-management/roles/{role}
   *
   * Returns the role itself, not the API response envelope.
   */
  get: async (roleId: string): Promise<Role> => {
    const response =
      await api.get<ApiSuccessResponse<Role>>(
        `/system/access-management/roles/${roleId}`,
      )

    return response.data.data
  },

  /**
   * Create a role with its permissions.
   *
   * POST /system/access-management/roles
   */
  create: async (
    data: CreateRoleRequest,
  ): Promise<Role> => {
    const response =
      await api.post<ApiSuccessResponse<Role>>(
        "/system/access-management/roles",
        data,
      )

    return response.data.data
  },

  /**
   * Replace the complete role configuration.
   *
   * PUT /system/access-management/roles/{role}
   */
  update: async (
    roleId: string,
    data: UpdateRoleRequest,
  ): Promise<Role> => {
    const response =
      await api.put<ApiSuccessResponse<Role>>(
        `/system/access-management/roles/${roleId}`,
        data,
      )

    return response.data.data
  },

  /**
   * Delete a role.
   *
   * DELETE /system/access-management/roles/{role}
   */
  delete: async (roleId: string): Promise<void> => {
    await api.delete(
      `/system/access-management/roles/${roleId}`,
    )
  },
}
