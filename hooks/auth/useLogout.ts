"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

import { authService } from "@/services/auth.service";
import { logout } from "@/lib/store/slices/user.slice";

export const useLogout = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();
  const locale = useLocale();

  const handleLogout = () => {
    dispatch(logout());
    queryClient.clear();

    // Redirect to the localized citizen login page.
    router.replace(`/${locale}/citizen/auth/login`);
  };

  return useMutation({
    mutationFn: authService.logout,

    onSuccess: () => {
      handleLogout();
    },

    onError: () => {
      // Clear local authentication even if the
      // Laravel session has already expired.
      handleLogout();
    },
  });
};
