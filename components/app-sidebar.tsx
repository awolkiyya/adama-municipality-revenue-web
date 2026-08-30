"use client";

import * as React from "react";
import { useSelector } from "react-redux";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import {
  NavItem,
} from "@/types/commen";

import {
  RootState,
} from "@/lib/store/store";

import {
  useTranslations,
} from "next-intl";

import {
  usePermission,
} from "@/hooks/usePermission";
import { NAV_ITEMS } from "@/configs/navConfig";
import { PermissionAction } from "@/types/user";

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
 * Builds the navigation based ONLY on permissions.
 *
 * Roles are intentionally NOT used here.
 *
 * Database:
 *
 *   Role
 *      ↓
 *   Permissions
 *      ↓
 *   Authenticated User
 *      ↓
 *   Frontend
 *      ↓
 *   buildNav()
 *
 * This means a newly-created role in the database
 * automatically gets the correct navigation according
 * to its assigned permissions.
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
      =================================================
      
      A normal menu item:
      
        permission ✓
            ↓
        visible
      
      A group:
      
        group
          ├── child ✓
          └── child ✗
      
        → group remains with child ✓
      
      A completely empty group:
      
        group
          ├── child ✗
          └── child ✗
      
        → group disappears
      ================================================= */

      if (item.items) {
        /*
         * Parent/group with visible children.
         *
         * The parent's own permission is optional.
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
         * If the parent itself has a permission and
         * the user has it, we can keep it as a direct
         * navigation item.
         *
         * Otherwise remove it.
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

export function AppSidebar(
  props: React.ComponentProps<typeof Sidebar>,
) {
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
     NAVIGATION CONFIGURATION
  =================================================== */

  /**
   * IMPORTANT:
   *
   * We intentionally DO NOT do:
   *
   *   user.role
   *   userRole
   *   NAV_BY_ROLE[userRole]
   *
   * Roles are dynamic database records.
   *
   * Navigation is determined entirely by permissions.
   */

  const navConfig =
    NAV_ITEMS;

  /* ===================================================
     BUILD AUTHORIZED NAVIGATION
  =================================================== */

  const navMain = buildNav(
    navConfig,
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
          items={navMain}

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
