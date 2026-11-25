"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  Bell,
  BellRing,
  ExternalLink,
} from "lucide-react";

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

import { Skeleton } from "@/components/ui/skeleton";

import { RootState } from "@/lib/store/store";
import { usePermission } from "@/hooks/usePermission";
import { NAV_ITEMS } from "@/configs/navConfig";
import { cn } from "@/lib/utils";

import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
} from "@/hooks/use-notifications";

import type { AppNotification } from "@/types/notification";

/* =====================================================
   THEME-AWARE LOADER
   Uses only design tokens (primary, muted, background),
   so it follows light/dark mode and any brand theme
   automatically. Motion is disabled for users who
   prefer reduced motion.
===================================================== */

const LOADER_CSS = `
@keyframes office-bar {
  0%, 100% { transform: scaleY(0.35); }
  50%      { transform: scaleY(1); }
}
@keyframes office-line {
  0%   { stroke-dashoffset: 140; opacity: 0; }
  15%  { opacity: 1; }
  70%  { stroke-dashoffset: 0; opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 0; }
}
@keyframes office-dot {
  0%, 60% { opacity: 0; transform: scale(0.4); }
  75%, 90% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.4); }
}
.office-bar {
  transform-box: fill-box;
  transform-origin: bottom;
  animation: office-bar 1.6s ease-in-out infinite;
}
.office-line {
  stroke-dasharray: 140;
  animation: office-line 2.4s ease-in-out infinite;
}
.office-dot {
  transform-box: fill-box;
  transform-origin: center;
  animation: office-dot 2.4s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .office-bar, .office-line, .office-dot {
    animation: none;
  }
  .office-bar { transform: scaleY(0.8); }
  .office-line { stroke-dashoffset: 0; opacity: 1; }
  .office-dot { opacity: 1; }
}
`;

const BARS = [
  { x: 10, h: 24, delay: "0s" },
  { x: 32, h: 38, delay: "0.15s" },
  { x: 54, h: 30, delay: "0.3s" },
  { x: 76, h: 48, delay: "0.45s" },
  { x: 98, h: 58, delay: "0.6s" },
];

/** Small animated revenue chart. Colors come from theme tokens. */
function ChartGraphic({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={cn("h-20 w-32", className)}
      role="img"
      aria-hidden="true"
    >
      {/* baseline */}
      <line
        x1="4"
        y1="70"
        x2="116"
        y2="70"
        className="stroke-border"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* bars */}
      {BARS.map((bar) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={70 - bar.h}
          width="12"
          height={bar.h}
          rx="3"
          className="office-bar fill-primary/25"
          style={{ animationDelay: bar.delay }}
        />
      ))}

      {/* trend line */}
      <polyline
        points="16,52 38,38 60,44 82,24 104,12"
        fill="none"
        className="office-line stroke-primary"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* end point */}
      <circle
        cx="104"
        cy="12"
        r="4.5"
        className="office-dot fill-primary"
      />
    </svg>
  );
}

function OfficeLoader({
  message = "Loading your workspace",
}: {
  message?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6"
    >
      <style>{LOADER_CSS}</style>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <ChartGraphic />
      </div>

      <div className="text-center">
        <p className="text-sm font-medium">{message}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          This only takes a moment.
        </p>
      </div>
    </div>
  );
}

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
      <OfficeContent>{children}</OfficeContent>
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

  const { user, isLoading } = useSelector(
    (state: RootState) => state.auth,
  );

  const { can } = usePermission();

  const canAccessOffice = can("office", "portal_access");
  const canAccessAgent = can("agent", "portal_access");

  /*
   * Portal guard.
   * - Auth still initializing: wait.
   * - No user: AuthProvider / API interceptor handles it.
   * - No Office access: go to Agent portal if allowed,
   *   otherwise to the unauthorized page.
   */
  useEffect(() => {
    if (isLoading || !user) {
      return;
    }

    if (!canAccessOffice) {
      router.replace(
        canAccessAgent ? "/agent/dashboard" : "/unauthorized",
      );
    }
  }, [isLoading, user, canAccessOffice, canAccessAgent, router]);

  /* Checking the session */
  if (isLoading) {
    return <OfficeLoader message="Checking your session" />;
  }

  /* Waiting for AuthProvider to redirect */
  if (!user) {
    return <OfficeLoader message="Taking you to sign in" />;
  }

  /* Redirecting away from the Office portal */
  if (!canAccessOffice) {
    return <OfficeLoader message="Taking you to the right place" />;
  }

  return (
    <SidebarProvider>
      <AppSidebar navItems={NAV_ITEMS} />

      <SidebarInset className="flex min-h-screen flex-col">
        <header className="flex h-14 items-center border-b bg-background/80 px-4 backdrop-blur-md">
          <SidebarTrigger />

          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 bg-muted/20 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

/* =====================================================
   NOTIFICATION LOADING SKELETON
   Mirrors the real row layout so nothing jumps
   when the data arrives.
===================================================== */

function NotificationSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading notifications">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="flex items-start gap-3 border-b px-5 py-4 last:border-0"
        >
          <Skeleton className="mt-1.5 size-2 shrink-0 rounded-full" />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-16" />
            </div>

            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
        </div>
      ))}
    </div>
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

  const { data, isLoading, isError, refetch } = useNotifications({
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
          className="relative rounded-lg p-2.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="h-5 w-5" />

          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
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
        className="w-[min(420px,calc(100vw-2rem))] overflow-hidden p-0"
      >
        {/* HEADER */}
        <div className="border-b px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <BellRing className="h-4 w-4 text-primary" />
              </div>

              <div>
                <h3 className="font-semibold">Notifications</h3>

                <p className="text-xs text-muted-foreground">
                  Your latest activity.
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

        {/* LIST */}
        <div className="max-h-[420px] overflow-y-auto">
          {isLoading ? (
            <NotificationSkeleton />
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <p className="text-sm text-destructive">
                Could not load notifications.
              </p>

              <button
                type="button"
                onClick={() => void refetch()}
                className="text-xs font-medium text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <div className="rounded-2xl bg-muted p-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>

              <h4 className="mt-4 font-semibold">
                You&apos;re all caught up
              </h4>

              <p className="mt-2 max-w-[300px] text-sm text-muted-foreground">
                New activity will appear here automatically.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "border-b transition-colors last:border-0 hover:bg-muted/50",
                  !notification.is_read && "bg-primary/[0.03]",
                )}
              >
                <div className="flex items-start gap-3 px-5 py-4">
                  <div className="mt-1.5 size-2 shrink-0">
                    {!notification.is_read && (
                      <span className="block size-2 rounded-full bg-primary" />
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