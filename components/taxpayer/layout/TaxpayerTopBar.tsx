
"use client";

import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { TAXPAYER_NAV_ITEMS } from "@/configs/taxpayerNavConfig";
import { useActiveNavItem } from "@/hooks/useActiveNavItem";

import {
  TaxpayerAccountMenu,
  TaxpayerQuickActions,
} from "./taxpayer-account-menu";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface TaxpayerTopBarProps {
  taxpayerName?: string;
  unreadNotifications?: number;

  /** Unpaid invoices (summary.outstanding_invoices). */
  outstandingInvoices?: number;

  /** Opens the mobile navigation drawer. */
  onMenuClick?: () => void;

  /**
   * Optional page title override for pages outside
   * the taxpayer navigation configuration.
   */
  title?: string;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function TaxpayerTopBar({
  taxpayerName = "Taxpayer",
  unreadNotifications = 0,
  outstandingInvoices = 0,
  onMenuClick,
  title,
}: TaxpayerTopBarProps) {
  const t = useTranslations();

  const { active } = useActiveNavItem(TAXPAYER_NAV_ITEMS);

  /* ------------------------------------------------------------------------ */
  /* Page information                                                         */
  /* ------------------------------------------------------------------------ */

  const portalName = t("navigation.taxpayerPortal");

  // Do not assume the dashboard when the current page has no navigation match.
  const pageTitle =
    title ?? (active ? t(active.labelKey) : portalName);

  const showPortalName = pageTitle !== portalName;

  /* ------------------------------------------------------------------------ */
  /* Navigation                                                               */
  /* ------------------------------------------------------------------------ */

  const notificationsHref =
    TAXPAYER_NAV_ITEMS.find(
      (item) => item.key === "notifications",
    )?.href ?? "#";

  const hasUnreadNotifications = unreadNotifications > 0;

  const notificationCount =
    unreadNotifications > 99 ? "99+" : unreadNotifications;

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <header
      className="
        sticky top-0 z-30
        flex h-16 shrink-0 items-center
        border-b border-border
        bg-background/95
        px-3 backdrop-blur
        supports-[backdrop-filter]:bg-background/80
        sm:px-4
        md:h-20 md:px-6
      "
    >
      {/* ------------------------------------------------------------------ */}
      {/* Mobile Navigation                                                  */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex shrink-0 items-center md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          disabled={!onMenuClick}
          aria-label="Open navigation menu"
          className="size-9 rounded-xl"
        >
          <Menu
            className="size-5"
            aria-hidden="true"
          />
        </Button>

        <Separator
          orientation="vertical"
          className="mx-2 h-6 sm:mx-3"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Page Information                                                   */}
      {/* ------------------------------------------------------------------ */}

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold tracking-tight text-foreground md:text-base">
          {pageTitle}
        </h1>

        {showPortalName && (
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {portalName}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right Actions                                                      */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">

        {/* Quick Actions */}
        <TaxpayerQuickActions
          outstandingInvoices={outstandingInvoices}
        />

        {/* Notifications */}
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="relative size-9 rounded-xl"
        >
          <Link
            href={notificationsHref}
            aria-label={
              hasUnreadNotifications
                ? `${unreadNotifications} unread notifications`
                : "Notifications"
            }
          >
            <Bell
              className="size-5"
              aria-hidden="true"
            />

            {hasUnreadNotifications && (
              <span
                aria-hidden="true"
                className="
                  absolute right-1 top-1
                  flex min-w-4 items-center justify-center
                  rounded-full
                  bg-destructive
                  px-1 py-0.5
                  text-[9px] font-bold leading-none
                  text-destructive-foreground
                  ring-2 ring-background
                "
              >
                {notificationCount}
              </span>
            )}
          </Link>
        </Button>

        {/* Account Separator */}
        <Separator
          orientation="vertical"
          className="mx-1 hidden h-7 sm:block"
        />

        {/* Taxpayer Account */}
        <TaxpayerAccountMenu
          fallbackName={taxpayerName}
          unreadNotifications={unreadNotifications}
        />
      </div>
    </header>
  );
}
