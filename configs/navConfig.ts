
import {
  PieChart,
  Users,
  Building2,
  ClipboardList,
  Landmark,
  Settings,
  ShieldCheck,
  FileText,
  Target,
  Inbox,
  CheckCircle2,
  Calculator,
  Wallet,
} from "lucide-react";

import { NavItem } from "@/types/commen";
import { APP_PERMISSIONS } from "@/lib/authorization";

/**
 * =========================================================
 * APPLICATION NAVIGATION
 * =========================================================
 *
 * Navigation is PERMISSION-DRIVEN, NOT ROLE-DRIVEN.
 *
 * Backend authorization:
 *
 *     User
 *       ↓
 *     Roles
 *       ↓
 *     Permissions
 *
 * Frontend:
 *
 *     User Permissions
 *       ↓
 *     NAV_ITEMS
 *       ↓
 *     Sidebar
 *
 * A role does NOT appear anywhere in this file.
 *
 * Example:
 *
 *     REVENUE_COLLECTOR
 *          ↓
 *     payment.view
 *     payment.create
 *     receipt.view
 *          ↓
 *     Payments
 *     Receipts
 *
 * If another role is created in the backend and receives
 * the same permissions, the frontend automatically shows
 * the same navigation.
 *
 * IMPORTANT:
 * ---------------------------------------------------------
 * Frontend navigation is ONLY a UX layer.
 *
 * Backend authorization remains the real security boundary.
 * Every API endpoint/action must be authorized by the backend.
 * =========================================================
 */

export const NAV_ITEMS: NavItem[] = [

  // =========================================================
  // DASHBOARD
  // =========================================================

  {
    title: "dashboard",
    url: "/office/dashboard",
    icon: PieChart,
    permission: APP_PERMISSIONS.DASHBOARD_VIEW,
  },

  // =========================================================
  // EXECUTIVE / ANALYTICS
  // =========================================================

  // {
  //   title: "analytics",
  //   url: "/office/dashboard/analytics",
  //   icon: Target,
  //   permission: APP_PERMISSIONS.ANALYTICS_VIEW,
  // },

  // {
  //   title: "revenue_overview",
  //   url: "/dashboard/revenue",
  //   icon: Landmark,
  //   permission: APP_PERMISSIONS.REVENUE_VIEW,
  // },

  // =========================================================
  // ADMINISTRATIVE STRUCTURE
  // =========================================================

  {
    title: "administrative_structure",
    url: "#",
    icon: Building2,

    items: [
      {
        title: "administrative_units",
        url: "/office/dashboard/administrative",
        permission: APP_PERMISSIONS.ADMINISTRATIVE_UNITS_VIEW,
      },

      {
        title: "sectors",
        url: "/office/dashboard/sectors",
        permission: APP_PERMISSIONS.SECTORS_VIEW,
      },
    ],
  },

  // =========================================================
  // USER ACCESS
  // =========================================================

  {
    title: "user_access",
    url: "#",
    icon: Users,

    items: [
      {
        title: "users",
        url: "/office/dashboard/users",
        permission: APP_PERMISSIONS.USERS_VIEW,
      },

      {
        title: "taxpayers",
        url: "/office/dashboard/taxpayers",
        permission: APP_PERMISSIONS.CITIZENS_VIEW,
      },

      {
        title: "roles",
        url: "/office/dashboard/access-managements",
        permission: APP_PERMISSIONS.ROLES_VIEW,
      },

      // {
      //   title: "permissions",
      //   url: "/office/dashboard/access-managements/permissions",
      //   permission: APP_PERMISSIONS.PERMISSIONS_VIEW,
      // },
    ],
  },

  // =========================================================
  // SYSTEM SETTINGS
  // =========================================================

  {
    title: "system_settings",
    url: "/office/dashboard/system-settings",
    icon: Settings,
    permission: APP_PERMISSIONS.SYSTEM_SETTINGS_VIEW,
  },

  // =========================================================
  // AUDIT
  // =========================================================

  {
    title: "audit_logs",
    url: "/office/dashboard/audits",
    icon: ShieldCheck,
    permission: APP_PERMISSIONS.AUDIT_VIEW,
  },


  // =========================================================
  // CALCULATION SETUP
  // =========================================================

  {
    title: "calculation_setup",
    url: "#",
    icon: Calculator,

    items: [
      {
        title: "measurement_units",
        url: "/office/dashboard/revenue-managements/measurement-units",
        permission: APP_PERMISSIONS.MEASUREMENT_UNIT_VIEW,
      },

      {
        title: "base_fields",
        url: "/office/dashboard/revenue-managements/base-fields",
        permission: APP_PERMISSIONS.BASE_FIELD_VIEW,
      },
    ],
  },

  // =========================================================
  // REVENUE CONFIGURATION
  // =========================================================

  {
    title: "revenue_configuration",
    url: "#",
    icon: ClipboardList,

    items: [
      {
        title: "revenue_categories",
        url: "/office/dashboard/revenue-managements/categories",
        permission: APP_PERMISSIONS.REVENUE_CATEGORY_VIEW,
      },

      {
        title: "revenue_services",
        url: "/office/dashboard/revenue-managements/services",
        permission: APP_PERMISSIONS.REVENUE_SERVICES_VIEW,
      },

      {
        title: "tariff_management",
        url: "/office/dashboard/revenue-managements/tariff-versions",
        permission: APP_PERMISSIONS.TARIFF_VIEW,
      },

      {
        title: "penalty_rules",
        url: "/office/dashboard/revenue-managements/penalty-rules",
        icon: ShieldCheck,
        permission: APP_PERMISSIONS.PENALTY_RULES_VIEW,
      },

      {
        title: "interest_rates",
        url: "/office/dashboard/revenue-managements/interest-rates",
        icon: Landmark,
        permission: APP_PERMISSIONS.INTEREST_RATES_VIEW,
      },
    ],
  },





  

  // =========================================================
  // DATA VALIDATION
  // =========================================================

  // {
  //   title: "data_validation",
  //   url: "/data/validation",
  //   icon: CheckCircle2,
  //   permission: APP_PERMISSIONS.DATA_VALIDATION_VIEW,
  // },

  // =========================================================
  // DATA REPORTS
  // =========================================================

  // {
  //   title: "data_reports",
  //   url: "/data/reports",
  //   icon: FileText,
  //   permission: APP_PERMISSIONS.REPORTS_VIEW,
  // },

  // =========================================================
  // REVENUE OPERATIONS
  // =========================================================

  // {
  //   title: "revenue_operations",
  //   url: "#",
  //   icon: ClipboardList,

  //   items: [
  //     {
  //       title: "assessments",
  //       url: "/office/dashboard/assessments",
  //       permission: APP_PERMISSIONS.ASSESSMENT_VIEW,
  //     },

  //     {
  //       title: "invoices",
  //       url: "/office/dashboard/invoices",
  //       permission: APP_PERMISSIONS.INVOICE_VIEW,
  //     },

  //     {
  //       title: "penalties",
  //       url: "/office/dashboard/penalties",
  //       permission: APP_PERMISSIONS.PENALTY_VIEW,
  //     },

  //     {
  //       title: "discounts",
  //       url: "/office/dashboard/discounts",
  //       permission: APP_PERMISSIONS.DISCOUNT_VIEW,
  //     },

  //     {
  //       title: "revenue_adjustments",
  //       url: "/office/dashboard/revenue-adjustments",
  //       permission: APP_PERMISSIONS.REVENUE_ADJUSTMENTS_VIEW,
  //     },

  //     {
  //       title: "revenue_complaints",
  //       url: "/office/dashboard/revenue-complaints",
  //       permission: APP_PERMISSIONS.REVENUE_COMPLAINTS_VIEW,
  //     },
  //   ],
  // },

  // =========================================================
  // ASSESSMENT DECISIONS
  // =========================================================

  // {
  //   title: "assessment_decisions",
  //   url: "#",
  //   icon: CheckCircle2,

  //   items: [
  //     {
  //       title: "pending_assessments",
  //       url: "/office/dashboard/assessments/pendings",
  //       permission: APP_PERMISSIONS.ASSESSMENT_VIEW,
  //     },

  //     {
  //       title: "decision_history",
  //       url: "/office/dashboard/assessments/history",
  //       permission: APP_PERMISSIONS.ASSESSMENT_VIEW_HISTORY,
  //     },
  //   ],
  // },

  // =========================================================
  // COLLECTIONS
  // =========================================================

  // {
  //   title: "collections",
  //   url: "#",
  //   icon: Inbox,

  //   items: [
  //     {
  //       title: "pending_collections",
  //       url: "/revenue/collections/pending",
  //       permission: APP_PERMISSIONS.REVENUE_VIEW,
  //     },

  //     {
  //       title: "completed_collections",
  //       url: "/revenue/collections/completed",
  //       permission: APP_PERMISSIONS.REVENUE_VIEW,
  //     },
  //   ],
  // },

  // =========================================================
  // PAYMENTS
  // =========================================================

  // {
  //   title: "payments",
  //   url: "#",
  //   icon: Wallet,

  //   items: [
  //     {
  //       title: "payments",
  //       url: "/revenue/payments",
  //       permission: APP_PERMISSIONS.PAYMENT_VIEW,
  //     },

  //     {
  //       title: "payment_history",
  //       url: "/revenue/payments/history",
  //       permission: APP_PERMISSIONS.PAYMENT_VIEW_HISTORY,
  //     },
  //   ],
  // },

  // =========================================================
  // RECEIPTS
  // =========================================================

  // {
  //   title: "receipts",
  //   url: "/revenue/receipts",
  //   icon: FileText,
  //   permission: APP_PERMISSIONS.RECEIPT_VIEW,
  // },

  // =========================================================
  // REVENUE REPORTS
  // =========================================================

  // {
  //   title: "revenue_reports",
  //   url: "/revenue/reports",
  //   icon: FileText,
  //   permission: APP_PERMISSIONS.REVENUE_REPORTS_VIEW,
  // },

  // =========================================================
  // PLANS
  // =========================================================

  // {
  //   title: "plans",
  //   url: "/office/dashboard/plans",
  //   icon: Target,
  //   permission: APP_PERMISSIONS.PLANS_VIEW,
  // },

  // =========================================================
  // PERFORMANCE REPORTS
  // =========================================================

  // {
  //   title: "performance_reports",
  //   url: "/office/dashboard/reports/performance",
  //   icon: FileText,
  //   permission: APP_PERMISSIONS.REPORTS_VIEW,
  // },

  // =========================================================
  // REPORTS
  // =========================================================

  // {
  //   title: "reports",
  //   url: "/office/dashboard/reports",
  //   icon: FileText,
  //   permission: APP_PERMISSIONS.REPORTS_VIEW,
  // },

  // =========================================================
  // KPI
  // =========================================================

  // {
  //   title: "kpi",
  //   url: "/office/dashboard/kpi",
  //   icon: Target,
  //   permission: APP_PERMISSIONS.KPI_VIEW,
  // },

  // =========================================================
  // EVIDENCE
  // =========================================================

  // {
  //   title: "evidence",
  //   url: "/office/dashboard/evidence",
  //   icon: FileText,
  //   permission: APP_PERMISSIONS.EVIDENCE_VIEW,
  // },

  // =========================================================
  // REGISTRATION
  // =========================================================

  // {
  //   title: "taxpayer_registration",
  //   url: "/registration/taxpayers",
  //   icon: Users,
  //   permission: APP_PERMISSIONS.CITIZENS_VIEW,
  // },

  // {
  //   title: "registration_reports",
  //   url: "/registration/reports",
  //   icon: FileText,
  //   permission: APP_PERMISSIONS.REPORTS_VIEW,
  // },
];
