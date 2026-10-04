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

import {
  Bell,
  BellRing,
} from "lucide-react";

import { RootState } from "@/lib/store/store";
import { usePermission } from "@/hooks/usePermission";
import { AGENT_NAV_ITEMS } from "@/configs/agentNavConfig";

/* =====================================================
   AGENT PORTAL LAYOUT
===================================================== */

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AgentContent>
        {children}
      </AgentContent>
    </AuthProvider>
  );
}

/* =====================================================
   AGENT PORTAL CONTENT
===================================================== */

function AgentContent({
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

  const canAccessAgent =
    can("agent", "portal_access");

  const canAccessOffice =
    can("office", "portal_access");

  /* ===================================================
     AGENT PORTAL GUARD
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
     * Authenticated user without Agent portal access.
     *
     * If the user has Office portal access, redirect there.
     * Otherwise send the user to the unauthorized page.
     */
    if (!canAccessAgent) {
      if (canAccessOffice) {
        router.replace("/office/dashboard");
      } else {
        router.replace("/unauthorized");
      }
    }
  }, [
    isLoading,
    user,
    canAccessAgent,
    canAccessOffice,
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
     NO AGENT PORTAL ACCESS
  =================================================== */

  if (!canAccessAgent) {
    return null;
  }

  /* ===================================================
     AGENT PORTAL
  =================================================== */

  return (
    <SidebarProvider>

      {/* =================================================
          AGENT SIDEBAR
      ================================================= */}

      <AppSidebar navItems={AGENT_NAV_ITEMS} />

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
  const unreadCount = 0;

  return (
    <Popover>

      <PopoverTrigger asChild>
        <button
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
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[420px] overflow-hidden p-0"
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="border-b px-5 py-4">
          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-primary/10 p-2">
              <BellRing className="h-4 w-4 text-primary" />
            </div>

            <div>
              <h3 className="font-semibold">
                Notifications
              </h3>

              <p className="text-xs text-muted-foreground">
                Stay updated with plans, KPIs, reports,
                and document generation activities.
              </p>
            </div>

          </div>
        </div>

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        <div className="flex flex-col items-center px-6 py-10 text-center">

          <div className="rounded-2xl bg-muted p-4">
            <Bell className="h-10 w-10 text-muted-foreground" />
          </div>

          <h4 className="mt-4 font-semibold">
            No notifications yet
          </h4>

          <p className="mt-2 max-w-[300px] text-sm text-muted-foreground">
            You're all caught up. New activity from your
            planning, KPI, reporting, and document workflows
            will appear here automatically.
          </p>

        </div>

      </PopoverContent>

    </Popover>
  );
}