import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";

export const useUpdatePassword = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  return useMutation<
    any,
    any,
    {
      current_password: string;
      new_password: string;
      new_password_confirmation: string;
    }
  >({
    mutationFn: authService.updatePassword,

    onSuccess: () => {
      // optional: security improvement → force logout after password change
      authService.logout();

      // optional redirect
      router.push("/auth/login");
    },
  });
};