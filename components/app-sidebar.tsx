"use client";

import * as React from "react";
import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import ModuleSearchDialog from "@/components/dashboard/ModuleSearchDialog";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button";

import type { NavItem } from "@/types/commen";
import type { PermissionAction } from "@/types/user";

import { RootState } from "@/lib/store/store";
import { usePermission } from "@/hooks/usePermission";

/* =====================================================
   SIDEBAR SKELETON
===================================================== */

function SidebarSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      <div className="size-10 rounded-xl border border-sidebar-border bg-sidebar-accent/60" />

      <div className="h-4 w-32 rounded-md bg-sidebar-accent/50" />

      <div className="h-3 w-24 rounded-md bg-sidebar-accent/40" />

      <div className="mt-6 space-y-2">
        <div className="h-4 w-full rounded-md bg-sidebar-accent/40" />
        <div className="h-4 w-3/4 rounded-md bg-sidebar-accent/40" />
        <div className="h-4 w-1/2 rounded-md bg-sidebar-accent/40" />
      </div>
    </div>
  );
}

/* =====================================================
   FILTER + TRANSLATE NAVIGATION
===================================================== */

/**
 * Builds navigation based only on permissions.
 *
 * The parent layout supplies the navigation configuration
 * for the active portal.
 *
 * Responsibilities:
 * 1. Filter navigation using permissions.
 * 2. Translate visible navigation labels.
 * 3. Preserve visible children under their parent groups.
 *
 * Backend authorization remains the security boundary.
 */
function buildNav(
  items: NavItem[],
  can: (
    resource: string,
    action: PermissionAction,
  ) => boolean,
  tNav: (key: string) => string,
): NavItem[] {
  return items
    .map((item): NavItem | null => {
      const children = item.items
        ? buildNav(item.items, can, tNav)
        : undefined;

      const hasPermission =
        !item.permission ||
        can(
          item.permission.resource,
          item.permission.action,
        );

      if (item.items) {
        // Keep groups that contain authorized children.
        if (children && children.length > 0) {
          return {
            ...item,
            title: tNav(item.title),
            items: children,
          };
        }

        // A parent can also be a directly accessible link.
        if (hasPermission && item.url !== "#") {
          return {
            ...item,
            title: tNav(item.title),
            items: [],
          };
        }

        return null;
      }

      if (!hasPermission) {
        return null;
      }

      return {
        ...item,
        title: tNav(item.title),
      };
    })
    .filter((item): item is NavItem => item !== null);
}

/* =====================================================
   APP SIDEBAR
===================================================== */

interface AppSidebarProps
  extends React.ComponentProps<typeof Sidebar> {
  navItems: NavItem[];
}

export function AppSidebar({
  navItems,
  ...props
}: AppSidebarProps) {
  const [searchOpen, setSearchOpen] = React.useState(false);

  const { user, isLoading } = useSelector(
    (state: RootState) => state.auth,
  );

  const { can } = usePermission();

  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const tSystem = useTranslations("system");
  const tNav = useTranslations("navigation");

  /*
   * Keep hooks above conditional returns.
   * Build the authorized navigation for the sidebar and search dialog.
   */
  const authorizedNav = React.useMemo(
    () => buildNav(navItems, can, tNav),
    [navItems, can, tNav],
  );

  /* ===================================================
     LOADING
  =================================================== */

  if (isLoading) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarSkeleton />
        </SidebarHeader>
      </Sidebar>
    );
  }

  /* ===================================================
     NO AUTHENTICATED USER
  =================================================== */

  if (!user) {
    return null;
  }

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-primary"
      {...props}
    >
      {/* MODULE SEARCH DIALOG */}

      <ModuleSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        navItems={authorizedNav}
      />

      {/* HEADER */}

      <SidebarHeader
        className="
          flex flex-row items-center gap-2
          border-b bg-background p-2 pb-4
          text-sidebar-foreground
        "
      >
        <img
          src="/images/logo.png"
          alt="Logo"
          className="size-8 shrink-0 object-contain"
        />

        <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
          <span className="truncate font-semibold tracking-tight">
            {tSystem("title")}
          </span>

          <span className="truncate text-xs text-sidebar-foreground/70">
            {user.label?.toLocaleUpperCase()}
          </span>
        </div>
      </SidebarHeader>

      {/* MODULE SEARCH BUTTON */}

      <div
        className={
          isCollapsed
            ? "flex justify-center px-1 py-2"
            : "px-2 py-2"
        }
      >
        <Button
          type="button"
          variant={isCollapsed ? "ghost" : "outline"}
          size={isCollapsed ? "icon" : "default"}
          onClick={() => setSearchOpen(true)}
          aria-label="Search modules"
          title={isCollapsed ? "Search modules" : undefined}
          className={
            isCollapsed
              ? "size-8 shrink-0"
              : "w-full justify-start"
          }
        >
          <Search
            className="size-4 shrink-0"
            aria-hidden="true"
          />

          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">
                Search modules
              </span>

              <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
                Ctrl K
              </kbd>
            </>
          )}
        </Button>
      </div>

      {/* NAVIGATION */}

      <SidebarContent className="bg-primary">
        <NavMain items={authorizedNav} />
      </SidebarContent>

      {/* USER */}

      <SidebarFooter
        className="
          border-t border-sidebar-border
          bg-background text-sidebar-foreground
        "
      >
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
