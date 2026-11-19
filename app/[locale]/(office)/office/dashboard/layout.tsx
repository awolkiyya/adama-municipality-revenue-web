"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import { AuthProvider } from "@/providers/AuthProvider";
import { AppSidebar } from "@/components/app-sidebar";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";


import { RootState } from "@/lib/store/store";
import { usePermission } from "@/hooks/usePermission";
import { NAV_ITEMS } from "@/configs/navConfig";
import {
  Bell,
  BellRing,
  CheckCheck,
  ExternalLink,
  Loader2,
} from "lucide-react";

import Link from "next/link";
"@/components/ui/popover";

import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
} from "@/hooks/use-notifications";

import type { AppNotification } from "@/types/notification";

/* =====================================================
   OFFICE PORTAL LAYOUT
===================================================== */

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <OfficeContent>
        {children}
      </OfficeContent>
    </AuthProvider>
  );
}

/* =====================================================
   OFFICE PORTAL CONTENT
===================================================== */

function OfficeContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  /* ===================================================
     AUTH STATE
  =================================================== */

  const {
    user,
    isLoading,
  } = useSelector(
    (state: RootState) => state.auth
  );

  /* ===================================================
     PERMISSION ENGINE
  =================================================== */

  const { can } = usePermission();

  /* ===================================================
     PORTAL ACCESS
  =================================================== */

  const canAccessOffice =
    can("office", "portal_access");

  const canAccessAgent =
    can("agent", "portal_access");

  /* ===================================================
     OFFICE PORTAL GUARD
  =================================================== */

  useEffect(() => {
    /*
     * Authentication initialization has not finished.
     *
     * AuthProvider -> useMe() is still determining
     * whether the current session is authenticated.
     */
    if (isLoading) {
      return;
    }

    /*
     * No authenticated user.
     *
     * Authentication handling belongs to AuthProvider
     * / API interceptor.
     */
    if (!user) {
      return;
    }

    /*
     * Authenticated user without Office portal access.
     *
     * If the user has Agent portal access, redirect there.
     * Otherwise send the user to the unauthorized page.
     */
    if (!canAccessOffice) {
      if (canAccessAgent) {
        router.replace("/agent/dashboard");
      } else {
        router.replace("/unauthorized");
      }
    }
  }, [
    isLoading,
    user,
    canAccessOffice,
    canAccessAgent,
    router,
  ]);

  /* ===================================================
     AUTHENTICATION LOADING
  =================================================== */

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  /* ===================================================
     NO AUTHENTICATED USER
  =================================================== */

  if (!user) {
    return null;
  }

  /* ===================================================
     NO OFFICE PORTAL ACCESS
  =================================================== */

  if (!canAccessOffice) {
    return null;
  }

  /* ===================================================
     OFFICE PORTAL
  =================================================== */

  return (
    <SidebarProvider>

      {/* =================================================
          OFFICE SIDEBAR
      ================================================= */}
      <AppSidebar navItems={NAV_ITEMS} />
      {/* =================================================
          MAIN CONTENT AREA
      ================================================= */}

      <SidebarInset className="flex min-h-screen flex-col">

        {/* =================================================
            TOP BAR
        ================================================= */}

        <header className="flex h-14 items-center border-b bg-background/80 px-4 backdrop-blur-md">

          <SidebarTrigger />

          <div className="ml-auto">
            <NotificationBell />
          </div>

        </header>

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main className="flex-1 bg-muted/20 p-4 md:p-6">
          {children}
        </main>

      </SidebarInset>

    </SidebarProvider>
  );
}





/* =====================================================
   NOTIFICATION BELL
===================================================== */

export function NotificationBell() {
  const {
    data: unreadCount = 0,
    isLoading: isCountLoading,
  } = useUnreadNotificationCount();

  const {
    data,
    isLoading,
    isError,
  } = useNotifications({
    filter: "all",
    per_page: 5,
    page: 1,
  });

  const markAsRead = useMarkNotificationAsRead();

  const notifications = data?.data ?? [];

  const handleNotificationClick = (
    notification: AppNotification,
  ) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          className="
            relative rounded-lg p-2.5
            transition-colors
            hover:bg-muted
          "
        >
          <Bell className="h-5 w-5" />

          {unreadCount > 0 && (
            <span
              className="
                absolute -right-1 -top-1
                flex h-5 min-w-5 items-center justify-center
                rounded-full bg-primary px-1
                text-[10px] font-semibold
                text-primary-foreground
              "
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}

          {isCountLoading && (
            <span className="sr-only">
              Loading unread notification count
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[420px] overflow-hidden p-0"
      >
        {/* HEADER */}
        <div className="border-b px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <BellRing className="h-4 w-4 text-primary" />
              </div>

              <div>
                <h3 className="font-semibold">
                  Notifications
                </h3>

                <p className="text-xs text-muted-foreground">
                  Stay updated with your latest activities.
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>

        {/* NOTIFICATION LIST */}
        <div className="max-h-[420px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading notifications...
            </div>
          ) : isError ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-destructive">
                Failed to load notifications.
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <div className="rounded-2xl bg-muted p-4">
                <Bell className="h-10 w-10 text-muted-foreground" />
              </div>

              <h4 className="mt-4 font-semibold">
                No notifications yet
              </h4>

              <p className="mt-2 max-w-[300px] text-sm text-muted-foreground">
                You&apos;re all caught up. New activity will appear here automatically.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`
                  border-b last:border-0
                  transition-colors hover:bg-muted/50
                  ${!notification.is_read ? "bg-primary/[0.03]" : ""}
                `}
              >
                <div className="flex items-start gap-3 px-5 py-4">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full">
                    {!notification.is_read && (
                      <span className="block h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium">
                        {notification.title}
                      </h4>

                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {notification.created_at
                          ? new Date(notification.created_at).toLocaleString()
                          : ""}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.message}
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      {notification.action_url && (
                        <Link
                          href={notification.action_url}
                          onClick={() => handleNotificationClick(notification)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          View details
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}

                      {!notification.is_read && (
                        <button
                          type="button"
                          onClick={() => markAsRead.mutate(notification.id)}
                          disabled={markAsRead.isPending}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between border-t px-5 py-3">
            <span className="text-xs text-muted-foreground">
              Showing {notifications.length} notifications
            </span>

            <Link
              href="/office/dashboard/notifications"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all notifications
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
