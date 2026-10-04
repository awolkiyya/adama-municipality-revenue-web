"use client";

import * as React from "react";
import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import { NavItem } from "@/types/commen";
import { RootState } from "@/lib/store/store";
import { PermissionAction } from "@/types/user";

import { usePermission } from "@/hooks/usePermission";

/* =====================================================
   SIDEBAR SKELETON
===================================================== */

function SidebarSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-10 w-10 rounded-xl bg-sidebar-accent/60 border border-sidebar-border" />

      <div className="h-4 w-32 rounded-md bg-sidebar-accent/50" />

      <div className="h-3 w-24 rounded-md bg-sidebar-accent/40" />

      <div className="space-y-2 mt-6">
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
 * Builds navigation based ONLY on permissions.
 *
 * Roles are intentionally NOT used here.
 *
 * The selected portal navigation configuration is
 * provided by the parent layout.
 *
 * Office Layout:
 *
 *   <AppSidebar navItems={NAV_ITEMS} />
 *
 * Agent Layout:
 *
 *   <AppSidebar navItems={AGENT_NAV_ITEMS} />
 *
 * AppSidebar does NOT determine which portal is active.
 *
 * Its responsibility is only to:
 *
 *   1. Receive navigation configuration
 *   2. Filter items by permissions
 *   3. Translate navigation labels
 *   4. Render the sidebar
 *
 * Backend authorization remains the real security
 * boundary.
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
      /* =================================================
         PROCESS CHILDREN FIRST
      ================================================= */

      const children = item.items
        ? buildNav(
            item.items,
            can,
            tNav,
          )
        : undefined;

      /* =================================================
         CHECK ITEM PERMISSION
      ================================================= */

      const hasPermission =
        !item.permission ||
        can(
          item.permission.resource,
          item.permission.action,
        );

      /* =================================================
         DETERMINE VISIBILITY
      ================================================= */

      if (item.items) {
        /*
         * Parent/group with visible children.
         */
        if (children && children.length > 0) {
          return {
            ...item,
            title: tNav(item.title),
            items: children,
          };
        }

        /*
         * No visible children.
         *
         * Keep the parent only if it is itself a
         * permitted direct navigation item.
         */
        if (
          hasPermission &&
          item.url !== "#"
        ) {
          return {
            ...item,
            title: tNav(item.title),
            items: [],
          };
        }

        return null;
      }

      /* =================================================
         NORMAL MENU ITEM
      ================================================= */

      if (!hasPermission) {
        return null;
      }

      return {
        ...item,
        title: tNav(item.title),
      };
    })

    /* ===================================================
       REMOVE NULL ITEMS
    =================================================== */

    .filter(
      (item): item is NavItem =>
        item !== null,
    );
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
  /* ===================================================
     AUTHENTICATED USER
  =================================================== */

  const {
    user,
    isLoading,
  } = useSelector(
    (state: RootState) => state.auth,
  );

  /* ===================================================
     PERMISSION ENGINE
  =================================================== */

  const { can } = usePermission();

  /* ===================================================
     TRANSLATIONS
  =================================================== */

  const tSystem =
    useTranslations("system");

  const tNav =
    useTranslations("navigation");

  /* ===================================================
     LOADING
  =================================================== */

  if (isLoading) {
    return (
      <Sidebar
        collapsible="icon"
        {...props}
      >
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
     BUILD AUTHORIZED NAVIGATION
  =================================================== */

  const authorizedNav = buildNav(
    navItems,
    can,
    tNav,
  );

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-primary"
      {...props}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <SidebarHeader
        className="
          flex
          flex-row
          p-2
          pb-4
          items-center
          gap-2
          bg-background
          text-sidebar-foreground
          border-b
        "
      >
        <img
          src="/images/logo.png"
          alt="Logo"
          className="object-contain size-8"
        />

        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold tracking-tight">
            {tSystem("title")}
          </span>

          <span className="truncate text-xs text-sidebar-foreground/70">
            {user.label?.toLocaleUpperCase()}
          </span>
        </div>
      </SidebarHeader>

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <SidebarContent className="bg-primary">
        <NavMain
          items={authorizedNav}
        />
      </SidebarContent>

      {/* =================================================
          USER
      ================================================= */}

      <SidebarFooter
        className="
          border-t
          border-sidebar-border
          text-sidebar-foreground
          bg-background
        "
      >
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
