"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { toast } from "sonner";

import { UserService } from "@/services/user.service";
import { UserQueryParams } from "@/types/user";
import { useRouter } from "next/navigation";

// =====================================================
// LIST USERS
// =====================================================
export function useUsers(params: UserQueryParams) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => UserService.getUsers(params),
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });
}

// =====================================================
// SINGLE USER
// =====================================================
export function useUser(id: string | number | undefined) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => {
      if (!id) throw new Error("User ID is required");
      return UserService.getUser(id);
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  });
}

// =====================================================
// CREATE USER
// =====================================================
export function useCreateUser() {
  const router = useRouter();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: UserService.createUser,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
      router.push("/office/dashboard/users");

    }
  });
}

// =====================================================
// UPDATE USER
// =====================================================
export function useUpdateUser() {
  const router = useRouter();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string | number;
      data: any;
    }) => UserService.updateUser(id, data),

    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["user", vars.id] });

      toast.success("User updated successfully");
      router.push("/office/dashboard/users");

    },
  });
}

// =====================================================
// UPDATE PASSWORD
// =====================================================
export function useUpdateUserPassword() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string | number;
      data: { password: string; password_confirmation?: string };
    }) => UserService.updatePassword(id, data),

    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["user", vars.id] });

      toast.success("Password updated successfully");
    },
  });
}

// =====================================================
// TOGGLE USER STATUS
// =====================================================
export function useToggleUserStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) =>
      UserService.toggleStatus(id),

    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["user", id] });

      toast.success("User status updated");
    },
  });
}