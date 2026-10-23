
import { useQuery } from "@tanstack/react-query"

import { permissionService } from "@/services/permission.service"
import { ApiError } from "@/lib/ApiError"

import type { PermissionGroupResponse } from "@/types/permission"

export const permissionQueryKeys = {
  all: ["permissions"] as const,

  lists: () =>
    [...permissionQueryKeys.all, "list"] as const,

  list: () =>
    [...permissionQueryKeys.lists()] as const,
}

export function usePermissions() {
  return useQuery<PermissionGroupResponse[], ApiError>({
    queryKey: permissionQueryKeys.list(),
    queryFn: () => permissionService.list(),
    staleTime: 5 * 60 * 1000,
  })
}
