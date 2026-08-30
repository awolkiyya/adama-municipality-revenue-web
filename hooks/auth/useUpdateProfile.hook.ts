import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authService } from "@/services/auth.service";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
    }) => authService.updateProfile(data),

    onSuccess: (response) => {
      toast.success("Profile updated successfully");

      // ✅ refresh current user cache
      queryClient.invalidateQueries({ queryKey: ["me"] });

    },
  });
};