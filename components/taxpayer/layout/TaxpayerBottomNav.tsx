"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { TAXPAYER_NAV_ITEMS } from "@/configs/taxpayerNavConfig";
import { useActiveNavItem } from "@/hooks/useActiveNavItem";

interface TaxpayerBottomNavProps {
  unreadNotifications?: number;
}

export function TaxpayerBottomNav({
  unreadNotifications = 0,
}: TaxpayerBottomNavProps) {
  const t = useTranslations();

  // Same hook as the sidebar and top bar: exactly one active item.
  const { isActive } = useActiveNavItem(TAXPAYER_NAV_ITEMS);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      aria-label="Taxpayer navigation"
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around">
        {TAXPAYER_NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          const showNotificationBadge =
            item.key === "notifications" && unreadNotifications > 0;

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "relative flex size-8 items-center justify-center rounded-xl transition-colors",
                  active && "bg-primary/10"
                )}
              >
                <Icon
                  className={cn(
                    "size-5",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                  aria-hidden="true"
                />

                {showNotificationBadge && (
                  <span
                    className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-4 text-destructive-foreground"
                    aria-label={`${unreadNotifications} unread notifications`}
                  >
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </span>

              <span className="max-w-full truncate px-1">
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}