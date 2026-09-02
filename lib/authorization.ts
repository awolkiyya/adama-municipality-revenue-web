import { PermissionAction } from "@/types/user";

export interface AppPermission {
  resource: string;
  action: PermissionAction;
}

/**
 * ============================================================================
 * APPLICATION PERMISSIONS
 * ============================================================================
 *
 * IMPORTANT:
 * ----------------------------------------------------------------------------
 * These values MUST match the backend PermissionSeeder exactly.
 *
 * Backend canonical format:
 *
 *     resource.action
 *
 * Example:
 *
 *     users.view
 *     users.create
 *     revenue_adjustments.approve
 *
 * The frontend uses these definitions for:
 *
 * - navigation visibility
 * - button/action visibility
 * - route guards
 * - permission-aware UI
 *
 * IMPORTANT:
 * ----------------------------------------------------------------------------
 * Frontend permissions are NOT the security boundary.
 *
 * The backend must ALWAYS enforce authorization independently.
 * ============================================================================
 */

export const APP_PERMISSIONS = {
  /*
  |--------------------------------------------------------------------------
  | Dashboard
  |--------------------------------------------------------------------------
  */

  DASHBOARD_VIEW: {
    resource: "dashboard",
    action: "view",
  },

  ANALYTICS_VIEW: {
    resource: "analytics",
    action: "view",
  },

  /*
  |--------------------------------------------------------------------------
  | User Management
  |--------------------------------------------------------------------------
  */

  USERS_VIEW: {
    resource: "users",
    action: "view",
  },

  USERS_CREATE: {
    resource: "users",
    action: "create",
  },

  USERS_UPDATE: {
    resource: "users",
    action: "update",
  },

  USERS_UPDATE_PASSWORD: {
    resource: "users",
    action: "update_password",
  },

  USERS_DELETE: {
    resource: "users",
    action: "delete",
  },

  USERS_ACTIVATE: {
    resource: "users",
    action: "activate",
  },

  USERS_DEACTIVATE: {
    resource: "users",
    action: "deactivate",
  },

  USERS_ASSIGN_ROLES: {
    resource: "users",
    action: "assign_roles",
  },

  USERS_VIEW_HISTORY: {
    resource: "users",
    action: "view_history",
  },

  /*
  |--------------------------------------------------------------------------
  | Role Management
  |--------------------------------------------------------------------------
  */

  ROLES_VIEW: {
    resource: "roles",
    action: "view",
  },

  ROLES_CREATE: {
    resource: "roles",
    action: "create",
  },

  ROLES_UPDATE: {
    resource: "roles",
    action: "update",
  },

  ROLES_DELETE: {
    resource: "roles",
    action: "delete",
  },

  ROLES_ASSIGN_PERMISSIONS: {
    resource: "roles",
    action: "assign_permissions",
  },

  ROLES_REVOKE_PERMISSIONS: {
    resource: "roles",
    action: "revoke_permissions",
  },

  ROLES_VIEW_HISTORY: {
    resource: "roles",
    action: "view_history",
  },

  /*
  |--------------------------------------------------------------------------
  | Permission Catalog
  |--------------------------------------------------------------------------
  */

  PERMISSIONS_VIEW: {
    resource: "permissions",
    action: "view",
  },

  /*
  |--------------------------------------------------------------------------
  | Administrative Units
  |--------------------------------------------------------------------------
  */

  ADMINISTRATIVE_UNITS_VIEW: {
    resource: "administrative_units",
    action: "view",
  },

  ADMINISTRATIVE_UNITS_CREATE: {
    resource: "administrative_units",
    action: "create",
  },

  ADMINISTRATIVE_UNITS_UPDATE: {
    resource: "administrative_units",
    action: "update",
  },

  ADMINISTRATIVE_UNITS_DELETE: {
    resource: "administrative_units",
    action: "delete",
  },

  /*
  |--------------------------------------------------------------------------
  | Sector Management
  |--------------------------------------------------------------------------
  */

  SECTORS_VIEW: {
    resource: "sectors",
    action: "view",
  },

  SECTORS_CREATE: {
    resource: "sectors",
    action: "create",
  },

  SECTORS_UPDATE: {
    resource: "sectors",
    action: "update",
  },

  SECTORS_DELETE: {
    resource: "sectors",
    action: "delete",
  },

  /*
  |--------------------------------------------------------------------------
  | Citizen Management
  |--------------------------------------------------------------------------
  */

  CITIZENS_VIEW: {
    resource: "citizens",
    action: "view",
  },

  CITIZENS_CREATE: {
    resource: "citizens",
    action: "create",
  },

  CITIZENS_UPDATE: {
    resource: "citizens",
    action: "update",
  },

  CITIZENS_VERIFY: {
    resource: "citizens",
    action: "verify",
  },

  CITIZENS_IMPORT: {
    resource: "citizens",
    action: "import",
  },

  CITIZENS_VIEW_HISTORY: {
    resource: "citizens",
    action: "view_history",
  },

  /*
  |--------------------------------------------------------------------------
  | Revenue
  |--------------------------------------------------------------------------
  */

  REVENUE_VIEW: {
    resource: "revenue",
    action: "view",
  },

  REVENUE_VERIFY: {
    resource: "revenue",
    action: "verify",
  },

  REVENUE_APPROVE: {
    resource: "revenue",
    action: "approve",
  },

  REVENUE_COLLECT: {
    resource: "revenue",
    action: "collect",
  },

  REVENUE_VIEW_HISTORY: {
    resource: "revenue",
    action: "view_history",
  },

  /*
  |--------------------------------------------------------------------------
  | Revenue Services
  |--------------------------------------------------------------------------
  */

  REVENUE_SERVICES_VIEW: {
    resource: "revenue_services",
    action: "view",
  },

  REVENUE_SERVICES_CREATE: {
    resource: "revenue_services",
    action: "create",
  },

  REVENUE_SERVICES_UPDATE: {
    resource: "revenue_services",
    action: "update",
  },

  REVENUE_SERVICES_ACTIVATE: {
    resource: "revenue_services",
    action: "activate",
  },

  REVENUE_SERVICES_DEACTIVATE: {
    resource: "revenue_services",
    action: "deactivate",
  },

  REVENUE_SERVICES_VIEW_HISTORY: {
    resource: "revenue_services",
    action: "view_history",
  },

  /*
  |--------------------------------------------------------------------------
  | Assessment
  |--------------------------------------------------------------------------
  */

  ASSESSMENT_VIEW: {
    resource: "assessment",
    action: "view",
  },

  ASSESSMENT_CREATE: {
    resource: "assessment",
    action: "create",
  },

  ASSESSMENT_UPDATE: {
    resource: "assessment",
    action: "update",
  },

  ASSESSMENT_SUBMIT: {
    resource: "assessment",
    action: "submit",
  },

  ASSESSMENT_VERIFY: {
    resource: "assessment",
    action: "verify",
  },

  ASSESSMENT_APPROVE: {
    resource: "assessment",
    action: "approve",
  },

  ASSESSMENT_REJECT: {
    resource: "assessment",
    action: "reject",
  },

  ASSESSMENT_VIEW_HISTORY: {
    resource: "assessment",
    action: "view_history",
  },

  /*
  |--------------------------------------------------------------------------
  | Tariff
  |--------------------------------------------------------------------------
  */

  TARIFF_VIEW: {
    resource: "tariff",
    action: "view",
  },

  TARIFF_CREATE: {
    resource: "tariff",
    action: "create",
  },

  TARIFF_UPDATE: {
    resource: "tariff",
    action: "update",
  },

  TARIFF_SUBMIT: {
    resource: "tariff",
    action: "submit",
  },

  TARIFF_APPROVE: {
    resource: "tariff",
    action: "approve",
  },

  TARIFF_REJECT: {
    resource: "tariff",
    action: "reject",
  },

  TARIFF_VIEW_HISTORY: {
    resource: "tariff",
    action: "view_history",
  },

  /*
  |--------------------------------------------------------------------------
  | Invoice
  |--------------------------------------------------------------------------
  */

  INVOICE_VIEW: {
    resource: "invoice",
    action: "view",
  },

  INVOICE_CREATE: {
    resource: "invoice",
    action: "create",
  },

  INVOICE_UPDATE: {
    resource: "invoice",
    action: "update",
  },

  INVOICE_ISSUE: {
    resource: "invoice",
    action: "issue",
  },

  INVOICE_CANCEL: {
    resource: "invoice",
    action: "cancel",
  },

  INVOICE_RECALCULATE: {
    resource: "invoice",
    action: "recalculate",
  },

  INVOICE_VIEW_HISTORY: {
    resource: "invoice",
    action: "view_history",
  },

  /*
  |--------------------------------------------------------------------------
  | Penalty
  |--------------------------------------------------------------------------
  */

  PENALTY_VIEW: {
    resource: "penalty",
    action: "view",
  },

  PENALTY_CALCULATE: {
    resource: "penalty",
    action: "calculate",
  },

  PENALTY_APPLY: {
    resource: "penalty",
    action: "apply",
  },

  PENALTY_ADJUST: {
    resource: "penalty",
    action: "adjust",
  },

  PENALTY_WAIVE: {
    resource: "penalty",
    action: "waive",
  },

  PENALTY_VIEW_HISTORY: {
    resource: "penalty",
    action: "view_history",
  },

  /*
  |--------------------------------------------------------------------------
  | Discount
  |--------------------------------------------------------------------------
  */

  DISCOUNT_VIEW: {
    resource: "discount",
    action: "view",
  },

  DISCOUNT_CALCULATE: {
    resource: "discount",
    action: "calculate",
  },

  DISCOUNT_APPLY: {
    resource: "discount",
    action: "apply",
  },

  DISCOUNT_REMOVE: {
    resource: "discount",
    action: "remove",
  },

  DISCOUNT_VIEW_HISTORY: {
    resource: "discount",
    action: "view_history",
  },

  /*
  |--------------------------------------------------------------------------
  | Revenue Adjustments
  |--------------------------------------------------------------------------
  */

  REVENUE_ADJUSTMENTS_VIEW: {
    resource: "revenue_adjustments",
    action: "view",
  },

  REVENUE_ADJUSTMENTS_CREATE: {
    resource: "revenue_adjustments",
    action: "create",
  },

  REVENUE_ADJUSTMENTS_REVIEW: {
    resource: "revenue_adjustments",
    action: "review",
  },

  REVENUE_ADJUSTMENTS_APPROVE: {
    resource: "revenue_adjustments",
    action: "approve",
  },

  REVENUE_ADJUSTMENTS_REJECT: {
    resource: "revenue_adjustments",
    action: "reject",
  },

  REVENUE_ADJUSTMENTS_CANCEL: {
    resource: "revenue_adjustments",
    action: "cancel",
  },

  REVENUE_ADJUSTMENTS_VIEW_HISTORY: {
    resource: "revenue_adjustments",
    action: "view_history",
  },

  /*
  |--------------------------------------------------------------------------
  | Revenue Complaints
  |--------------------------------------------------------------------------
  */

  REVENUE_COMPLAINTS_VIEW: {
    resource: "revenue_complaints",
    action: "view",
  },

  REVENUE_COMPLAINTS_CREATE: {
    resource: "revenue_complaints",
    action: "create",
  },

  REVENUE_COMPLAINTS_UPDATE: {
    resource: "revenue_complaints",
    action: "update",
  },

  REVENUE_COMPLAINTS_REVIEW: {
    resource: "revenue_complaints",
    action: "review",
  },

  REVENUE_COMPLAINTS_REQUEST_INFORMATION: {
    resource: "revenue_complaints",
    action: "request_information",
  },

  REVENUE_COMPLAINTS_RECOMMEND: {
    resource: "revenue_complaints",
    action: "recommend",
  },

  REVENUE_COMPLAINTS_REJECT: {
    resource: "revenue_complaints",
    action: "reject",
  },

  REVENUE_COMPLAINTS_ESCALATE: {
    resource: "revenue_complaints",
    action: "escalate",
  },

  REVENUE_COMPLAINTS_CLOSE: {
    resource: "revenue_complaints",
    action: "close",
  },

  REVENUE_COMPLAINTS_VIEW_HISTORY: {
    resource: "revenue_complaints",
    action: "view_history",
  },

  /*
  |--------------------------------------------------------------------------
  | Payment
  |--------------------------------------------------------------------------
  */

  PAYMENT_VIEW: {
    resource: "payment",
    action: "view",
  },

  PAYMENT_CREATE: {
    resource: "payment",
    action: "create",
  },

  PAYMENT_VERIFY: {
    resource: "payment",
    action: "verify",
  },

  PAYMENT_APPROVE: {
    resource: "payment",
    action: "approve",
  },

  PAYMENT_REVERSE: {
    resource: "payment",
    action: "reverse",
  },

  PAYMENT_VIEW_HISTORY: {
    resource: "payment",
    action: "view_history",
  },

  /*
  |--------------------------------------------------------------------------
  | Receipt
  |--------------------------------------------------------------------------
  */

  RECEIPT_VIEW: {
    resource: "receipt",
    action: "view",
  },

  RECEIPT_CREATE: {
    resource: "receipt",
    action: "create",
  },

  RECEIPT_PRINT: {
    resource: "receipt",
    action: "print",
  },

  RECEIPT_REPRINT: {
    resource: "receipt",
    action: "reprint",
  },

  /*
  |--------------------------------------------------------------------------
  | Revenue Reports
  |--------------------------------------------------------------------------
  */

  REVENUE_REPORTS_VIEW: {
    resource: "revenue_reports",
    action: "view",
  },

  REVENUE_REPORTS_GENERATE: {
    resource: "revenue_reports",
    action: "generate",
  },

  REVENUE_REPORTS_EXPORT: {
    resource: "revenue_reports",
    action: "export",
  },

  /*
  |--------------------------------------------------------------------------
  | Plans
  |--------------------------------------------------------------------------
  */

  PLANS_VIEW: {
    resource: "plans",
    action: "view",
  },

  PLANS_CREATE: {
    resource: "plans",
    action: "create",
  },

  PLANS_UPDATE: {
    resource: "plans",
    action: "update",
  },

  PLANS_SUBMIT: {
    resource: "plans",
    action: "submit",
  },

  PLANS_APPROVE: {
    resource: "plans",
    action: "approve",
  },

  PLANS_REJECT: {
    resource: "plans",
    action: "reject",
  },

  PLANS_VIEW_HISTORY: {
    resource: "plans",
    action: "view_history",
  },

  /*
  |--------------------------------------------------------------------------
  | Reports
  |--------------------------------------------------------------------------
  */

  REPORTS_VIEW: {
    resource: "reports",
    action: "view",
  },

  REPORTS_CREATE: {
    resource: "reports",
    action: "create",
  },

  REPORTS_UPDATE: {
    resource: "reports",
    action: "update",
  },

  REPORTS_SUBMIT: {
    resource: "reports",
    action: "submit",
  },

  REPORTS_APPROVE: {
    resource: "reports",
    action: "approve",
  },

  REPORTS_REJECT: {
    resource: "reports",
    action: "reject",
  },

  REPORTS_VIEW_HISTORY: {
    resource: "reports",
    action: "view_history",
  },

  /*
  |--------------------------------------------------------------------------
  | KPI
  |--------------------------------------------------------------------------
  */

  KPI_VIEW: {
    resource: "kpi",
    action: "view",
  },

  KPI_MANAGE: {
    resource: "kpi",
    action: "manage",
  },

  /*
  |--------------------------------------------------------------------------
  | Evidence
  |--------------------------------------------------------------------------
  */

  EVIDENCE_VIEW: {
    resource: "evidence",
    action: "view",
  },

  EVIDENCE_UPLOAD: {
    resource: "evidence",
    action: "upload",
  },

  /*
  |--------------------------------------------------------------------------
  | Audit
  |--------------------------------------------------------------------------
  */

  AUDIT_VIEW: {
    resource: "audit",
    action: "view",
  },


  /*
|--------------------------------------------------------------------------
| Calculation Setup
|--------------------------------------------------------------------------
*/

MEASUREMENT_UNIT_VIEW: {
  resource: "measurement_units",
  action: "view",
},

BASE_FIELD_VIEW: {
  resource: "base_fields",
  action: "view",
},

/*
|--------------------------------------------------------------------------
| Revenue Categories
|--------------------------------------------------------------------------
*/

REVENUE_CATEGORY_VIEW: {
  resource: "revenue_categorys",
  action: "view",
},

/*
|--------------------------------------------------------------------------
| Revenue Services
|--------------------------------------------------------------------------
*/

REVENUE_SERVICE_VIEW: {
  resource: "revenue_services",
  action: "view",
},

/*
|--------------------------------------------------------------------------
| Tariff Versions
|--------------------------------------------------------------------------
*/

TARIFF_VERSION_VIEW: {
  resource: "tariff_versions",
  action: "view",
},

/*
|--------------------------------------------------------------------------
| Data Validation
|--------------------------------------------------------------------------
*/

DATA_VALIDATION_VIEW: {
  resource: "data_validation",
  action: "view",
},

/*
|--------------------------------------------------------------------------
| Performance Reports
|--------------------------------------------------------------------------
*/

PERFORMANCE_REPORT_VIEW: {
  resource: "performance_reports",
  action: "view",
},

/*
|--------------------------------------------------------------------------
| Decision Reports
|--------------------------------------------------------------------------
*/

DECISION_REPORT_VIEW: {
  resource: "decision_reports",
  action: "view",
},

/*
|--------------------------------------------------------------------------
| Collections
|--------------------------------------------------------------------------
*/

COLLECTION_VIEW: {
  resource: "collection",
  action: "view",
},

/*
|--------------------------------------------------------------------------
| Collection Reports
|--------------------------------------------------------------------------
*/

COLLECTION_REPORT_VIEW: {
  resource: "collection_reports",
  action: "view",
},

/*
|--------------------------------------------------------------------------
| Payment Collection
|--------------------------------------------------------------------------
*/

PAYMENT_COLLECT: {
  resource: "payment",
  action: "collect",
},

/*
|--------------------------------------------------------------------------
| System Settings
|--------------------------------------------------------------------------
*/

SYSTEM_SETTINGS_VIEW: {
  resource: "system_settings",
  action: "view",
},

INTEREST_RATES_VIEW: {
  resource: "interest_rates",
  action: "view",
},

INTEREST_RATES_CREATE: {
  resource: "interest_rates",
  action: "create",
},

INTEREST_RATES_UPDATE: {
  resource: "interest_rates",
  action: "update",
},

INTEREST_RATES_ACTIVATE: {
  resource: "interest_rates",
  action: "activate",
},

INTEREST_RATES_DEACTIVATE: {
  resource: "interest_rates",
  action: "deactivate",
},

INTEREST_RATES_VIEW_HISTORY: {
  resource: "interest_rates",
  action: "view_history",
},


/* |-------------------------------------------------------------------------- | Penalty Rule Configuration |-------------------------------------------------------------------------- */ 
PENALTY_RULES_VIEW: { 
  resource: "penalty_rules",
  action: "view", 
},
PENALTY_RULES_CREATE: {
  resource: "penalty_rules",
  action: "create",
},
PENALTY_RULES_UPDATE: {
  resource: "penalty_rules",
  action: "update",
}, 
PENALTY_RULES_ACTIVATE: {
   resource: "penalty_rules",
   action: "activate",
},
PENALTY_RULES_DEACTIVATE: {
   resource: "penalty_rules",
   action: "deactivate",
}, 
PENALTY_RULES_VIEW_HISTORY: {
   resource: "penalty_rules",
   action: "view_history", },

} satisfies Record<string, AppPermission>;