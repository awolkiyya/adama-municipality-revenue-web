
import { api } from "@/lib/api";
import type {
  AppNotification,
  NotificationActionResponse,
  NotificationApiResponse,
  NotificationBulkActionResponse,
  NotificationFilters,
  PaginatedNotifications,
  UnreadNotificationCountResponse,
} from "@/types/notification";

const BASE_URL = "/notifications";

export const notificationService = {
  /**
   * Get paginated notifications.
   */
  async getAll(
    filters: NotificationFilters = {},
  ): Promise<PaginatedNotifications> {
    const response = await api.get<PaginatedNotifications>(
      BASE_URL,
      {
        params: {
          filter: filters.filter ?? "all",
          per_page: filters.per_page ?? 20,
          page: filters.page ?? 1,
        },
      },
    );

    return response.data;
  },

  /**
   * Get a notification by ID.
   */
  async getById(id: string): Promise<AppNotification> {
    const response = await api.get<{
      data: AppNotification;
    }>(`${BASE_URL}/${encodeURIComponent(id)}`);

    return response.data.data;
  },

  /**
   * Get unread notification count.
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get<UnreadNotificationCountResponse>(
      `${BASE_URL}/unread-count`,
    );

    return response.data.data.unread_count;
  },

  /**
   * Mark one notification as read.
   */
  async markAsRead(id: string): Promise<AppNotification> {
    const response = await api.patch<NotificationApiResponse>(
      `${BASE_URL}/${encodeURIComponent(id)}/read`,
    );

    return response.data.data;
  },

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead(): Promise<number> {
    const response = await api.patch<NotificationBulkActionResponse>(
      `${BASE_URL}/read-all`,
    );

    return response.data.data.updated_count ?? 0;
  },

  /**
   * Delete one notification.
   */
  async delete(id: string): Promise<void> {
    await api.delete<NotificationActionResponse>(
      `${BASE_URL}/${encodeURIComponent(id)}`,
    );
  },

  /**
   * Delete all notifications.
   */
  async deleteAll(): Promise<number> {
    const response = await api.delete<NotificationBulkActionResponse>(
      BASE_URL,
    );

    return response.data.data.deleted_count ?? 0;
  },
};
