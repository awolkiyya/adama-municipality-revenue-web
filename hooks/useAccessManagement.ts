"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { accessManagementService } from "@/services/accessManagement.service";

// =====================================================
// PERMISSIONS
// =====================================================

export function usePermissions(params?: {
  search?: string;
  page?: number;
  per_page?: number;
  guard_name?: string;
}) {
  return useQuery({
    queryKey: ["permissions", params],
    queryFn: () => accessManagementService.getPermissions(params),
    staleTime: 1000 * 60 * 5,
  });
}

// =====================================================
// SINGLE PERMISSION
// =====================================================

export function usePermission(id?: string) {
  return useQuery({
    queryKey: ["permission", id],
    queryFn: () => {
      if (!id) throw new Error("Permission ID required");
      return accessManagementService.getPermissionById(id);
    },
    enabled: !!id,
  });
}

// =====================================================
// ROLES
// =====================================================

export function useRoles(params?: {
  search?: string;
  page?: number;
  per_page?: number;
  guard_name?: string;
}) {
  return useQuery({
    queryKey: ["roles", params],
    queryFn: () => accessManagementService.getRoles(params),
    staleTime: 1000 * 60 * 5,
  });
}

// =====================================================
// SINGLE ROLE
// =====================================================

export function useRole(id?: string) {
  return useQuery({
    queryKey: ["role", id],
    queryFn: () => {
      if (!id) throw new Error("Role ID required");
      return accessManagementService.getRoleById(id);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// =====================================================
// CREATE ROLE
// =====================================================

export function useCreateRole() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: accessManagementService.createRole,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role created successfully");
    },
  });
}

// =====================================================
// UPDATE ROLE
// =====================================================

export function useUpdateRole() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      accessManagementService.updateRole(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["role", vars.id] });
      toast.success("Role updated successfully");
    },
  });
}

// =====================================================
// DELETE ROLE
// =====================================================

export function useDeleteRole() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: accessManagementService.deleteRole,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role deleted successfully");
    },
  });
}

// =====================================================
// ROLE PERMISSIONS
// =====================================================

export function useRolePermissions(roleId?: string) {
  return useQuery({
    queryKey: ["role-permissions", roleId],
    queryFn: () => {
      if (!roleId) throw new Error("Role ID required");
      return accessManagementService.getRolePermissions(roleId);
    },
    enabled: !!roleId,
  });
}

// =====================================================
// ASSIGN PERMISSIONS TO ROLE
// =====================================================

export function useAssignRolePermissions() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      roleId,
      data,
    }: {
      roleId: string;
      data: { permissions: string[] };
    }) => accessManagementService.assignRolePermissions(roleId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["role-permissions", vars.roleId] });
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Permissions assigned successfully");
    },
  });
}

// =====================================================
// USER ROLES
// =====================================================

export function useUserRoles(userId?: string) {
  return useQuery({
    queryKey: ["user-roles", userId],
    queryFn: () => {
      if (!userId) throw new Error("User ID required");
      return accessManagementService.getUserRoles(userId);
    },
    enabled: !!userId,
  });
}

// =====================================================
// ASSIGN ROLE TO USER
// =====================================================

export function useAssignUserRole() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: { role_id: string };
    }) => accessManagementService.assignUserRole(userId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["user-roles", vars.userId] });
      toast.success("Role assigned successfully");
    },
  });
}

// =====================================================
// REMOVE USER ROLE
// =====================================================

export function useRemoveUserRole() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      accessManagementService.removeUserRole(userId, roleId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["user-roles", vars.userId] });
      toast.success("Role removed successfully");
    },
  });
}