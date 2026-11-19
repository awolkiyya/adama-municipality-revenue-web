"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { notificationService } from "@/services/notification.service";

import type {
  NotificationFilters,
} from "@/types/notification";

/* -------------------------------------------------------------------------- */
/* Query Keys                                                                 */
/* -------------------------------------------------------------------------- */

export const notificationKeys = {
  all: ["notifications"] as const,

  lists: () => [...notificationKeys.all, "list"] as const,

  list: (filters: NotificationFilters) =>
    [...notificationKeys.lists(), filters] as const,

  details: () => [...notificationKeys.all, "detail"] as const,

  detail: (id: string) =>
    [...notificationKeys.details(), id] as const,

  unreadCount: () =>
    [...notificationKeys.all, "unread-count"] as const,
};

/* -------------------------------------------------------------------------- */
/* Queries                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Get paginated notifications.
 */
export function useNotifications(
  filters: NotificationFilters = {},
) {
  return useQuery({
    queryKey: notificationKeys.list(filters),

    queryFn: () => notificationService.getAll(filters),

    staleTime: 30 * 1000,
  });
}

/**
 * Get a notification by ID.
 */
export function useNotification(id: string) {
  return useQuery({
    queryKey: notificationKeys.detail(id),

    queryFn: () => notificationService.getById(id),

    enabled: Boolean(id),

    staleTime: 30 * 1000,
  });
}

/**
 * Get unread notification count.
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),

    queryFn: () => notificationService.getUnreadCount(),

    staleTime: 30 * 1000,

    refetchInterval: 60 * 1000,

    refetchOnWindowFocus: true,
  });
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Mark one notification as read.
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      notificationService.markAsRead(id),

    onSuccess: async (notification) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: notificationKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: notificationKeys.unreadCount(),
        }),

        queryClient.invalidateQueries({
          queryKey: notificationKeys.detail(notification.id),
        }),
      ]);
    },
  });
}

/**
 * Mark all notifications as read.
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      notificationService.markAllAsRead(),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: notificationKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: notificationKeys.unreadCount(),
        }),
      ]);
    },
  });
}

/**
 * Delete one notification.
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      notificationService.delete(id),

    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: notificationKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: notificationKeys.unreadCount(),
        }),

        queryClient.removeQueries({
          queryKey: notificationKeys.detail(id),
        }),
      ]);
    },
  });
}

/**
 * Delete all notifications.
 */
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      notificationService.deleteAll(),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: notificationKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: notificationKeys.unreadCount(),
        }),

        queryClient.removeQueries({
          queryKey: notificationKeys.details(),
        }),
      ]);
    },
  });
}
