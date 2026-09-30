"use client";

import { Bell, Menu } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TAXPAYER_NAV_ITEMS } from "@/configs/taxpayerNavConfig";
import { useActiveNavItem } from "@/hooks/useActiveNavItem";
import { TaxpayerAccountMenu, TaxpayerQuickActions } from "./taxpayer-account-menu";



interface TaxpayerTopBarProps {
  taxpayerName?: string;
  unreadNotifications?: number;
  /** Unpaid invoices (summary.outstanding_invoices). Enables the "Pay" quick action. */
  outstandingInvoices?: number;
  onMenuClick?: () => void;
  /**
   * Optional override for pages that are not in the nav
   * (invoice details, profile, notifications...).
   */
  title?: string;
}

export function TaxpayerTopBar({
  taxpayerName = "Taxpayer",
  unreadNotifications = 0,
  outstandingInvoices = 0,
  onMenuClick,
  title,
}: TaxpayerTopBarProps) {
  const t = useTranslations();
  const { active } = useActiveNavItem(TAXPAYER_NAV_ITEMS);

  // No match means "unknown page". Do not pretend it is the dashboard.
  const portalName = t("navigation.taxpayerPortal");
  const pageTitle = title ?? (active ? t(active.labelKey) : portalName);
  const showPortalName = pageTitle !== portalName;
  const notificationsHref =
    TAXPAYER_NAV_ITEMS.find((i) => i.key === "notifications")?.href ?? "#";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:h-20 md:px-6">
      {/* Mobile menu */}
      <div className="flex items-center md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>

        <Separator orientation="vertical" className="mx-3 h-6" />
      </div>

      {/* Page information */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold md:text-base">
          {pageTitle}
        </p>

        {showPortalName && (
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {portalName}
          </p>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 md:gap-2">
        <TaxpayerQuickActions outstandingInvoices={outstandingInvoices} />

        <Button
          asChild
          variant="ghost"
          size="icon"
          className="relative rounded-xl"
        >
          <Link
            href={notificationsHref}
            aria-label={
              unreadNotifications > 0
                ? `${unreadNotifications} unread notifications`
                : "Notifications"
            }
          >
            <Bell className="size-5" />

            {unreadNotifications > 0 && (
              <span className="absolute right-1.5 top-1.5 flex min-w-2 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-4 text-destructive-foreground">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </Link>
        </Button>

        <Separator
          orientation="vertical"
          className="mx-1 hidden h-7 sm:block"
        />

        <TaxpayerAccountMenu
          fallbackName={taxpayerName}
          unreadNotifications={unreadNotifications}
        />
      </div>
    </header>
  );
}