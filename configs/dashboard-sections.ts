// ============================================================
// Dashboard / Navigation Authorization Configuration
// ============================================================
//
// IMPORTANT:
// This file does NOT define what permissions a user has.
//
// Backend is the source of truth:
//
// GET /api/v1/auth/me
//
// Example:
//
// permissions: {
//   dashboard: ["view"],
//   users: ["view", "create", "update"],
//   taxpayer: ["view", "create"],
//   ...
// }
//
// This file only defines:
//   1. Which UI sections exist
//   2. Which permission is required to see each section
//
// Authorization must always be enforced by the backend as well.
// ============================================================

export const DASHBOARD_SECTIONS = {
  // ==========================================================
  // SYSTEM ADMINISTRATION
  // ==========================================================

  SYSTEM_ADMIN: {
    label: "System Administration",

    sections: [
      {
        key: "dashboard",
        label: "Dashboard",
        permission: "dashboard.view",
      },

      {
        key: "analytics",
        label: "Analytics",
        permission: "analytics.view",
      },

      {
        key: "users",
        label: "Users",
        permission: "users.view",
      },

      {
        key: "roles",
        label: "Roles",
        permission: "roles.view",
      },

      {
        key: "permissions",
        label: "Permissions",
        permission: "permissions.view",
      },

      {
        key: "administrative_units",
        label: "Administrative Units",
        permission: "administrative_units.view",
      },

      {
        key: "sectors",
        label: "Sectors",
        permission: "sectors.view",
      },

      {
        key: "audit",
        label: "Audit Logs",
        permission: "audit.view",
      },
    ],
  },

  // ==========================================================
  // DATA MANAGEMENT
  // ==========================================================

  DATA_MANAGER: {
    label: "Data Management",

    sections: [
      {
        key: "citizens",
        label: "Citizens",
        permission: "citizens.view",
      },

      {
        key: "citizen_import",
        label: "Citizen Import",
        permission: "citizens.import",
      },

      {
        key: "taxpayers",
        label: "Taxpayers",
        permission: "taxpayer.view",
      },

      {
        key: "revenue_services",
        label: "Revenue Services",
        permission: "revenue_services.view",
      },
    ],
  },

  // ==========================================================
  // TOP MANAGEMENT
  // ==========================================================

  EXECUTIVE_VIEWER: {
    label: "Executive Management",

    sections: [
      {
        key: "dashboard",
        label: "Dashboard",
        permission: "dashboard.view",
      },

      {
        key: "analytics",
        label: "Analytics",
        permission: "analytics.view",
      },

      {
        key: "revenue_reports",
        label: "Revenue Reports",
        permission: "revenue_reports.view",
      },

      {
        key: "plans",
        label: "Plans",
        permission: "plans.view",
      },

      {
        key: "reports",
        label: "Reports",
        permission: "reports.view",
      },

      {
        key: "kpi",
        label: "KPIs",
        permission: "kpi.view",
      },

      {
        key: "evidence",
        label: "Evidence",
        permission: "evidence.view",
      },
    ],
  },

  // ==========================================================
  // SECTOR / DATA PROVIDERS
  // ==========================================================

  SECTOR_OFFICER: {
    label: "Sector Operations",

    sections: [
      {
        key: "dashboard",
        label: "Dashboard",
        permission: "dashboard.view",
      },

      {
        key: "plans",
        label: "Plans",
        permission: "plans.view",
      },

      {
        key: "reports",
        label: "Reports",
        permission: "reports.view",
      },

      {
        key: "kpi",
        label: "KPIs",
        permission: "kpi.view",
      },

      {
        key: "evidence",
        label: "Evidence",
        permission: "evidence.view",
      },
    ],
  },

  // ==========================================================
  // REVENUE DECISION / APPROVAL
  // ==========================================================

  REVENUE_DECISION_OFFICER: {
    label: "Revenue Decision",

    sections: [
      {
        key: "taxpayers",
        label: "Taxpayers",
        permission: "taxpayer.view",
      },

      {
        key: "revenue",
        label: "Revenue",
        permission: "revenue.view",
      },

      {
        key: "assessments",
        label: "Assessments",
        permission: "assessment.view",
      },

      {
        key: "tariffs",
        label: "Tariffs",
        permission: "tariff.view",
      },

      {
        key: "invoices",
        label: "Invoices",
        permission: "invoice.view",
      },

      {
        key: "penalties",
        label: "Penalties",
        permission: "penalty.view",
      },

      {
        key: "discounts",
        label: "Discounts",
        permission: "discount.view",
      },

      {
        key: "adjustments",
        label: "Revenue Adjustments",
        permission: "revenue_adjustments.view",
      },

      {
        key: "complaints",
        label: "Revenue Complaints",
        permission: "revenue_complaints.view",
      },

      {
        key: "revenue_reports",
        label: "Revenue Reports",
        permission: "revenue_reports.view",
      },
    ],
  },

  // ==========================================================
  // REVENUE COLLECTION
  // ==========================================================

  REVENUE_COLLECTOR: {
    label: "Revenue Collection",

    sections: [
      {
        key: "taxpayers",
        label: "Taxpayers",
        permission: "taxpayer.view",
      },

      {
        key: "invoices",
        label: "Invoices",
        permission: "invoice.view",
      },

      {
        key: "payments",
        label: "Payments",
        permission: "payment.view",
      },

      {
        key: "receipts",
        label: "Receipts",
        permission: "receipt.view",
      },

      {
        key: "revenue_reports",
        label: "Revenue Reports",
        permission: "revenue_reports.view",
      },
    ],
  },

  // ==========================================================
  // REGISTRATION
  // ==========================================================

  REGISTRATION_OFFICER: {
    label: "Registration",

    sections: [
      {
        key: "citizens",
        label: "Citizens",
        permission: "citizens.view",
      },

      {
        key: "taxpayers",
        label: "Taxpayers",
        permission: "taxpayer.view",
      },

      {
        key: "revenue_services",
        label: "Revenue Services",
        permission: "revenue_services.view",
      },
    ],
  },
} as const;