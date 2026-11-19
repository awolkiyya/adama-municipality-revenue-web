/**
 * Notification types
 *
 * These types represent the notification API contracts
 * returned by Laravel's NotificationResource.
 */

export type NotificationType =
  | "payment.received"
  | "invoice.generated"
  | "assessment.approved"
  | "lease.expiring";

export type NotificationPriority =
  | "low"
  | "normal"
  | "high"
  | "urgent";

export type NotificationFilter =
  | "all"
  | "read"
  | "unread";

/* -------------------------------------------------------------------------- */
/* Notification                                                               */
/* -------------------------------------------------------------------------- */

export interface AppNotification {
  id: string;
  type: NotificationType | string;
  module: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  data: Record<string, unknown>;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/* -------------------------------------------------------------------------- */
/* Notification Filters                                                       */
/* -------------------------------------------------------------------------- */

export interface NotificationFilters {
  filter?: NotificationFilter;
  per_page?: number;
  page?: number;
}

/* -------------------------------------------------------------------------- */
/* Laravel Pagination                                                         */
/* -------------------------------------------------------------------------- */

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  links: PaginationLink[];
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginatedNotifications {
  data: AppNotification[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: PaginationMeta;
}

/* -------------------------------------------------------------------------- */
/* API Responses                                                              */
/* -------------------------------------------------------------------------- */

export interface NotificationApiResponse {
  success: boolean;
  message: string;
  data: AppNotification;
}

export interface UnreadNotificationCountResponse {
  success: boolean;
  message: string;
  data: {
    unread_count: number;
  };
}

export interface NotificationActionResponse {
  success: boolean;
  message: string;
}

export interface NotificationBulkActionResponse {
  success: boolean;
  message: string;
  data: {
    updated_count?: number;
    deleted_count?: number;
  };
}
