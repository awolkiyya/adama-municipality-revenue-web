"use client";

import {
  Bell,
  CalendarDays,
  ChevronDown,
  CreditCard,
  FileText,
  Languages,
  LogOut,
  Monitor,
  Moon,
  Sun,
  SunMoon,
  UserRound,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSelector } from "react-redux";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TAXPAYER_NAV_ITEMS } from "@/configs/taxpayerNavConfig";
import { useLogout } from "@/hooks/auth/useLogout";
import { useLocaleSwitcher } from "@/hooks/useLocaleSwitcher";
import type { RootState } from "@/lib/store/store";

type NavKey = (typeof TAXPAYER_NAV_ITEMS)[number]["key"];

/** Routes and labels come from the nav config: one source of truth. */
function useNavItem() {
  const t = useTranslations();
  return (key: NavKey) => {
    const item = TAXPAYER_NAV_ITEMS.find((i) => i.key === key)!;
    return { href: item.href, label: t(item.labelKey) };
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (
    parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")
  ).toUpperCase();
}

/* ---------------------------------------------------------------
   ACCOUNT MENU
--------------------------------------------------------------- */

export function TaxpayerAccountMenu({
  fallbackName = "Taxpayer",
  unreadNotifications = 0,
}: {
  fallbackName?: string;
  unreadNotifications?: number;
}) {
  const nav = useNavItem();
  const user = useSelector((state: RootState) => state.auth.user);
  const logout = useLogout();
  const { theme, setTheme } = useTheme();
  const { locale, change, pending, languages } = useLocaleSwitcher();

  const name = user?.citizen?.full_name || user?.name || fallbackName;
  const contact = user?.email || user?.phone || null;
  const profile = nav("profile");
  const notifications = nav("notifications");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label="Account menu"
          className="group h-10 gap-2 rounded-xl px-2 data-[state=open]:bg-muted sm:px-3"
        >
          <Avatar className="size-8">
            {user?.avatar && <AvatarImage src={user.avatar} alt="" />}
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {name === fallbackName ? (
                <UserRound className="size-4" />
              ) : (
                getInitials(name)
              )}
            </AvatarFallback>
          </Avatar>

          <span className="hidden max-w-32 truncate text-sm font-medium lg:block">
            {name}
          </span>

          <ChevronDown className="hidden size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 sm:block" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* Who is signed in */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              {user?.avatar && <AvatarImage src={user.avatar} alt="" />}
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              {contact && (
                <p className="truncate text-xs text-muted-foreground">
                  {contact}
                </p>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Account */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={profile.href}>
              <UserRound className="mr-2 size-4" />
              {profile.label}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={notifications.href}>
              <Bell className="mr-2 size-4" />
              <span className="flex-1">{notifications.label}</span>
              {unreadNotifications > 0 && (
                <span className="rounded-full bg-destructive px-1.5 text-[10px] font-bold leading-4 text-destructive-foreground">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Preferences */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <SunMoon className="mr-2 size-4" />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={theme ?? "system"}
                onValueChange={setTheme}
              >
                <DropdownMenuRadioItem value="light">
                  <Sun className="mr-2 size-4" />
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <Moon className="mr-2 size-4" />
                  Dark
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <Monitor className="mr-2 size-4" />
                  System
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={pending}>
              <Languages className="mr-2 size-4" />
              Language
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={locale} onValueChange={change}>
                {languages.map((l) => (
                  <DropdownMenuRadioItem key={l.value} value={l.value}>
                    {l.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Keep the menu open while signing out so the user sees progress */}
        <DropdownMenuItem
          disabled={logout.isPending}
          onSelect={(e) => {
            e.preventDefault();
            if (!logout.isPending) logout.mutate();
          }}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="mr-2 size-4" />
          {logout.isPending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------------------------------------------------------------
   QUICK ACTIONS
--------------------------------------------------------------- */

export function TaxpayerQuickActions({
  outstandingInvoices = 0,
}: {
  /** Number of unpaid invoices. Use summary.outstanding_invoices. */
  outstandingInvoices?: number;
}) {
  const nav = useNavItem();
  const invoices = nav("invoices");
  const payments = nav("payments");

  return (
    <DropdownMenu>


      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Quick actions
        </DropdownMenuLabel>

        {/* Only offered when there is something to pay */}
        {outstandingInvoices > 0 && (
          <DropdownMenuItem asChild className="font-medium">
            <Link href={invoices.href}>
              <CreditCard className="mr-2 size-4" />
              <span className="flex-1">Pay outstanding invoices</span>
              <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold leading-4 text-primary-foreground">
                {outstandingInvoices}
              </span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild>
          <Link href={invoices.href}>
            <FileText className="mr-2 size-4" />
            {invoices.label}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={payments.href}>
            <CreditCard className="mr-2 size-4" />
            {payments.label}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}