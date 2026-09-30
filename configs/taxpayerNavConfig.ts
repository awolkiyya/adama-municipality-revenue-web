import { NavItem } from "@/lib/navigation";
import {
    Bell,
    CalendarDays,
    CreditCard,
    FileText,
    Home,
    UserRound,
  } from "lucide-react";
  
  export const TAXPAYER_NAV_ITEMS = [
    {
      key: "dashboard",
      href: "/citizen/dashboard",
      labelKey: "navigation.dashboard",
      icon: Home,
      exact: true, // only active on /citizen/dashboard itself
    },
    { key: "invoices", href: "/citizen/dashboard/invoices", labelKey: "navigation.invoices", icon: FileText },
    { key: "payments", href: "/citizen/dashboard/payments", labelKey: "navigation.payments", icon: CreditCard },
    { key: "notifications", href: "/citizen/dashboard/notifications", labelKey: "navigation.notifications", icon: Bell },
    { key: "profile", href: "/citizen/dashboard/profile", labelKey: "navigation.profile", icon: UserRound },
  ] as const satisfies readonly NavItem[];