import {
  PieChart,
  CreditCard,
} from "lucide-react";

import { NavItem } from "@/types/commen";
import { APP_PERMISSIONS } from "@/lib/authorization";

export const AGENT_NAV_ITEMS: NavItem[] = [
  {
    title: "dashboard",
    url: "/agent/dashboard",
    icon: PieChart,
    permission: APP_PERMISSIONS.DASHBOARD_VIEW,
  },

  {
    title: "payments",
    url: "/agent/dashboard/payments",
    icon: CreditCard,
    permission: APP_PERMISSIONS.PAYMENTS_VIEW,
  },
];