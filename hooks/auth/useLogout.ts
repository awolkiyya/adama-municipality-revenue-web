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

  return useMutation({
    mutationFn: authService.logout,

    onSuccess: () => {
      // Laravel successfully invalidated the session.
      dispatch(logout());

      // Remove all authenticated/user-specific cached data.
      queryClient.clear();

      // Preserve the current language.
      router.replace(`/${locale}`);
    },

    onError: () => {
      // Even if the Laravel session is already expired,
      // the frontend must immediately consider the user logged out.
      dispatch(logout());

      queryClient.clear();

      // Preserve the current language.
      router.replace(`/${locale}`);
    },
  });
};