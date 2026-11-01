
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authService } from "@/services/auth.service";

type UpdatePasswordPayload = {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
};

type UpdatePasswordResponse = {
  success: boolean;
  message: string;
};

export const useUpdatePassword = () => {
  const router = useRouter();

  return useMutation<
    UpdatePasswordResponse,
    unknown,
    UpdatePasswordPayload
  >({
    mutationFn: authService.updatePassword,

    onSuccess: async () => {
      try {
        await authService.logout();
      } finally {
        router.push("/auth/login");
      }
    },
  });
};
