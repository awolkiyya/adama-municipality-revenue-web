
"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell } from "lucide-react";
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
  title,
}: TaxpayerTopBarProps) {
  const t = useTranslations();

  const { active } = useActiveNavItem(TAXPAYER_NAV_ITEMS);

  /* ------------------------------------------------------------------------ */
  /* Page Information                                                         */
  /* ------------------------------------------------------------------------ */

  const portalName = t("navigation.taxpayerPortal");

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
      {/* Municipal Logo                                                     */}
      {/* ------------------------------------------------------------------ */}

      <Link
        href="/citizen/dashboard"
        aria-label="Municipal Portal Dashboard"
        className="
          flex shrink-0 items-center justify-center
          rounded-lg
          outline-none
          transition-opacity
          hover:opacity-80
          focus-visible:ring-2
          focus-visible:ring-ring
          focus-visible:ring-offset-2
        "
      >
        <Image
          src="/images/logo.png"
          alt="Adama Municipality"
          width={120}
          height={48}
          priority
          className="h-9 w-auto max-w-[100px] object-contain md:h-11 md:max-w-[120px]"
        />
      </Link>

      {/* Separator */}
      <Separator
        orientation="vertical"
        className="mx-3 h-7 sm:mx-4"
      />

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
