import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"


import type { PaginatedResponse } from "@/types/api"

import type {
  Role,
  RoleQueryParams,
  CreateRoleRequest,
  UpdateRoleRequest,
} from "@/types/role"
import { ApiError } from "@/lib/ApiError"
import { roleService } from "@/services/role.service"

/* -------------------------------------------------------------------------- */
/* Query Keys                                                                 */
/* -------------------------------------------------------------------------- */

export const roleQueryKeys = {
  all: ["roles"] as const,

  lists: () =>
    [...roleQueryKeys.all, "list"] as const,

  list: (params?: RoleQueryParams) =>
    [
      ...roleQueryKeys.lists(),
      params ?? {},
    ] as const,

  details: () =>
    [...roleQueryKeys.all, "detail"] as const,

  detail: (roleId: string) =>
    [
      ...roleQueryKeys.details(),
      roleId,
    ] as const,
}

/* -------------------------------------------------------------------------- */
/* Queries                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Get paginated roles.
 *
 * GET /system/access-management/roles
 */
export function useRoles(
  params?: RoleQueryParams,
) {
  return useQuery<
    PaginatedResponse<Role>,
    ApiError
  >({
    queryKey: roleQueryKeys.list(params),
    queryFn: () => roleService.list(params),
    placeholderData: (previousData) =>
      previousData,
  })
}

/**
 * Get a single role by ID.
 *
 * GET /system/access-management/roles/{role}
 *
 * Loads the role details and assigned permissions
 * for the role edit form.
 */
export function useRole(roleId?: string) {
  return useQuery<Role, ApiError>({
    queryKey: roleQueryKeys.detail(roleId ?? ""),
    queryFn: () => {
      if (!roleId) {
        throw new Error(
          "A role ID is required to retrieve a role.",
        )
      }

      return roleService.get(roleId)
    },
    enabled: Boolean(roleId),
  })
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Create a role with its assigned permissions.
 *
 * POST /system/access-management/roles
 */
export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation<
    Role,
    ApiError,
    CreateRoleRequest
  >({
    mutationFn: (data) =>
      roleService.create(data),

    onSuccess: (role) => {
      queryClient.setQueryData(
        roleQueryKeys.detail(role.id),
        role,
      )

      void queryClient.invalidateQueries({
        queryKey: roleQueryKeys.lists(),
      })

      toast.success(
        "Role created successfully.",
      )
    },

    onError: (error) => {
      toast.error(
        error.message ||
          "Failed to create role.",
      )
    },
  })
}

/**
 * Update a role and synchronize its permissions.
 *
 * PUT /system/access-management/roles/{role}
 */
export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation<
    Role,
    ApiError,
    {
      roleId: string
      data: UpdateRoleRequest
    }
  >({
    mutationFn: ({
      roleId,
      data,
    }) =>
      roleService.update(
        roleId,
        data,
      ),

    onSuccess: (role, variables) => {
      // Update the canonical role detail cache.
      queryClient.setQueryData(
        roleQueryKeys.detail(role.id),
        role,
      )

      // Also update the requested ID in case the API
      // returns a differently formatted ID.
      if (variables.roleId !== role.id) {
        queryClient.setQueryData(
          roleQueryKeys.detail(variables.roleId),
          role,
        )
      }

      // Refresh role lists so counts and displayed data
      // reflect the latest server state.
      void queryClient.invalidateQueries({
        queryKey: roleQueryKeys.lists(),
      })

      toast.success(
        "Role updated successfully.",
      )
    },

    onError: (error) => {
      toast.error(
        error.message ||
          "Failed to update role.",
      )
    },
  })
}

/**
 * Delete a role.
 *
 * DELETE /system/access-management/roles/{role}
 */
export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    ApiError,
    string
  >({
    mutationFn: (roleId) =>
      roleService.delete(roleId),

    onSuccess: (_, roleId) => {
      // Remove the deleted role's detail cache.
      queryClient.removeQueries({
        queryKey: roleQueryKeys.detail(roleId),
        exact: true,
      })

      // Refresh all role lists.
      void queryClient.invalidateQueries({
        queryKey: roleQueryKeys.lists(),
      })

      toast.success(
        "Role deleted successfully.",
      )
    },

    onError: (error) => {
      toast.error(
        error.message ||
          "Failed to delete role.",
      )
    },
  })
}
