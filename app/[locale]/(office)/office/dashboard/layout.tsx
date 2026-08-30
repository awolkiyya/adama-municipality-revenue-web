"use client";

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

import { Bell, BellRing, ClipboardCheck, FileText, ShieldCheck, Target, UserCircle } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {


  const user = useSelector((state: RootState) => state.auth.user);

  const role = user?.role;
  return (
    <AuthProvider>
      <SidebarProvider>

        {/* SIDEBAR */}
        <AppSidebar />

        {/* MAIN CONTENT AREA */}
        <SidebarInset className="flex flex-col min-h-screen">

          {/* TOP BAR */}
          <header className="flex h-14 items-center border-b px-4 bg-background/80 backdrop-blur-md">
        <SidebarTrigger />

        <div className="ml-auto">
          <NotificationBell />
        </div>
      </header>

          {/* PAGE CONTENT */}
          <main className="flex-1 p-4 md:p-6 bg-muted/20">
            {children}
          </main>



        </SidebarInset>

      </SidebarProvider>
    </AuthProvider>
  );
}

export function NotificationBell() {
  const unreadCount = 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="
            relative rounded-lg p-2.5
            hover:bg-muted
            transition-colors
          "
        >
          <Bell className="h-5 w-5" />

          {unreadCount > 0 && (
            <span
              className="
                absolute -right-1 -top-1
                flex h-5 min-w-5 items-center justify-center
                rounded-full bg-primary px-1
                text-[10px] font-semibold text-primary-foreground
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
        {/* Header */}
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
                Stay updated with plans, KPIs, reports, and
                document generation activities.
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
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