
import { api } from "@/lib/api"
import type { ApiSuccessResponse } from "@/types/api"
import type { PermissionGroupResponse } from "@/types/permission"

class PermissionService {
  private readonly baseUrl =
    "/system/access-management/permissions/grouped"

  /**
   * Get permissions grouped by module for the API guard.
   */
  async list(): Promise<PermissionGroupResponse[]> {
    const response =
      await api.get<
        ApiSuccessResponse<PermissionGroupResponse[]>
      >(this.baseUrl)

    return response.data.data
  }
}

export const permissionService = new PermissionService()
