"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { TAXPAYER_NAV_ITEMS } from "@/configs/taxpayerNavConfig";
import { useActiveNavItem } from "@/hooks/useActiveNavItem";

interface TaxpayerSidebarProps {
  unreadNotifications?: number;
}

export function TaxpayerSidebar({
  unreadNotifications = 0,
}: TaxpayerSidebarProps) {
  const t = useTranslations();

  // Single source of truth: exactly one item can be active.
  const { isActive } = useActiveNavItem(TAXPAYER_NAV_ITEMS);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card md:flex">
      {/* Branding */}
      <div className="flex h-20 shrink-0 items-center border-b px-5">
        <Link
          href="/citizen/dashboard"
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <span className="text-sm font-bold">M</span>
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Municipal Portal</p>
            <p className="truncate text-xs text-muted-foreground">Taxpayer</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-1">
          {TAXPAYER_NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            const label = t(item.labelKey);

            const showNotificationBadge =
              item.key === "notifications" && unreadNotifications > 0;

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-5 shrink-0",
                    active
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                  aria-hidden="true"
                />

                <span className="min-w-0 flex-1 truncate">{label}</span>

                {showNotificationBadge && (
                  <span
                    className={cn(
                      "flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                      active
                        ? "bg-primary-foreground text-primary"
                        : "bg-destructive text-destructive-foreground"
                    )}
                    aria-label={`${unreadNotifications} unread notifications`}
                  >
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t p-3">
        <div className="rounded-xl bg-muted/50 px-3 py-3">
          <p className="text-xs font-medium text-foreground">Taxpayer Portal</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Manage your invoices, payments, and municipal services.
          </p>
        </div>
      </div>
    </aside>
  );
}