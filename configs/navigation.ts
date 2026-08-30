// import {
//     PieChart,
//     Users,
//     Building2,
//     ClipboardList,
//     Landmark,
//     Settings,
//     ShieldCheck,
//     FileText,
//     Target,
//     Inbox,
//     CheckCircle2,
//     Calculator,
//     Receipt,
//     Wallet,
//     Database,
//     UserRound,
//   } from "lucide-react";
  
//   import { NavItem } from "@/types/commen";
//   import { UserRole } from "@/types/user";
  
//   /**
//    * =====================================================
//    * APPLICATION NAVIGATION + FRONTEND AUTHORIZATION
//    * =====================================================
//    *
//    * This file has TWO responsibilities:
//    *
//    * 1. NAVIGATION
//    *    Controls what authenticated employees see.
//    *
//    * 2. FRONTEND ROUTE AUTHORIZATION
//    *    Controls whether an employee can access a
//    *    protected frontend route.
//    *
//    *
//    * BACKEND SECURITY
//    * =====================================================
//    *
//    * Laravel remains the FINAL authorization authority.
//    *
//    * Laravel MUST independently enforce:
//    *
//    * - Authentication
//    * - RBAC
//    * - Permissions
//    * - Resource ownership
//    * - Organizational scope
//    * - Sector scope
//    * - IDOR protection
//    * - Approval permissions
//    * - Financial permissions
//    *
//    * Never trust frontend navigation or frontend route
//    * protection as the final security boundary.
//    *
//    *
//    * CITIZENS
//    * =====================================================
//    *
//    * Citizens do NOT use UserRole.
//    *
//    * They are identified using:
//    *
//    *     user.user_type === "citizen"
//    *
//    * Therefore citizens are not included in:
//    *
//    * - ROLE_PERMISSIONS
//    * - NAV_BY_ROLE
//    *
//    * Citizen navigation is handled separately.
//    */
  
  
//   /**
//    * =====================================================
//    * 1. APPLICATION PERMISSIONS
//    * =====================================================
//    */
  
//   export const APP_PERMISSIONS = {
//     /**
//      * ===================================================
//      * DASHBOARD
//      * ===================================================
//      */
  
//     DASHBOARD_VIEW: "dashboard.view",
  
//     /**
//      * ===================================================
//      * ADMINISTRATIVE STRUCTURE
//      * ===================================================
//      */
  
//     ADMINISTRATIVE_UNITS_VIEW: "administrative.units.view",
//     ADMINISTRATIVE_UNITS_MANAGE: "administrative.units.manage",
  
//     SECTORS_VIEW: "sectors.view",
//     SECTORS_MANAGE: "sectors.manage",
  
//     /**
//      * ===================================================
//      * USERS / ACCESS
//      * ===================================================
//      */
  
//     USERS_VIEW: "users.view",
//     USERS_MANAGE: "users.manage",
  
//     ACCESS_MANAGEMENT_VIEW: "access.management.view",
//     ACCESS_MANAGEMENT_MANAGE: "access.management.manage",
  
//     /**
//      * ===================================================
//      * TAXPAYERS
//      * ===================================================
//      */
  
//     TAXPAYER_VIEW: "taxpayer.view",
//     TAXPAYER_MANAGE: "taxpayer.manage",
  
//     /**
//      * ===================================================
//      * CALCULATION SETUP
//      * ===================================================
//      */
  
//     MEASUREMENT_UNIT_VIEW: "measurement.unit.view",
//     MEASUREMENT_UNIT_MANAGE: "measurement.unit.manage",
  
//     BASE_FIELD_VIEW: "base.field.view",
//     BASE_FIELD_MANAGE: "base.field.manage",
  
//     /**
//      * ===================================================
//      * REVENUE CONFIGURATION
//      * ===================================================
//      */
  
//     REVENUE_CATEGORY_VIEW: "revenue.category.view",
//     REVENUE_CATEGORY_MANAGE: "revenue.category.manage",
  
//     REVENUE_SERVICE_VIEW: "revenue.service.view",
//     REVENUE_SERVICE_MANAGE: "revenue.service.manage",
  
//     TARIFF_VERSION_VIEW: "tariff.version.view",
//     TARIFF_VERSION_MANAGE: "tariff.version.manage",
  
//     /**
//      * ===================================================
//      * REVENUE
//      * ===================================================
//      */
  
//     REVENUE_VIEW: "revenue.view",
//     REVENUE_CREATE: "revenue.create",
//     REVENUE_ASSESS: "revenue.assess",
//     REVENUE_DECISION: "revenue.decision",
//     REVENUE_COLLECT: "revenue.collect",
//     REVENUE_VERIFY: "revenue.verify",
//     REVENUE_CANCEL: "revenue.cancel",
//     REVENUE_VOID: "revenue.void",
  
//     /**
//      * ===================================================
//      * ASSESSMENTS
//      * ===================================================
//      */
  
//     ASSESSMENT_VIEW: "assessment.view",
//     ASSESSMENT_CREATE: "assessment.create",
//     ASSESSMENT_REVIEW: "assessment.review",
//     ASSESSMENT_DECISION: "assessment.decision",
  
//     /**
//      * ===================================================
//      * INVOICES
//      * ===================================================
//      */
  
//     INVOICE_VIEW: "invoice.view",
//     INVOICE_CREATE: "invoice.create",
//     INVOICE_CANCEL: "invoice.cancel",
//     INVOICE_VOID: "invoice.void",
  
//     /**
//      * ===================================================
//      * COLLECTIONS
//      * ===================================================
//      */
  
//     COLLECTION_VIEW: "collection.view",
//     COLLECTION_MANAGE: "collection.manage",
  
//     /**
//      * ===================================================
//      * PAYMENTS
//      * ===================================================
//      */
  
//     PAYMENT_VIEW: "payment.view",
//     PAYMENT_COLLECT: "payment.collect",
//     PAYMENT_VERIFY: "payment.verify",
  
//     /**
//      * ===================================================
//      * RECEIPTS
//      * ===================================================
//      */
  
//     RECEIPT_VIEW: "receipt.view",
//     RECEIPT_CREATE: "receipt.create",
  
//     /**
//      * ===================================================
//      * REPORTS
//      * ===================================================
//      */
  
//     REPORT_VIEW: "report.view",
//     REPORT_CREATE: "report.create",
//     REPORT_EXPORT: "report.export",
  
//     REVENUE_REPORT_VIEW: "revenue.report.view",
//     PERFORMANCE_REPORT_VIEW: "performance.report.view",
//     DECISION_REPORT_VIEW: "decision.report.view",
//     COLLECTION_REPORT_VIEW: "collection.report.view",
  
//     /**
//      * ===================================================
//      * DATA VALIDATION
//      * ===================================================
//      */
  
//     DATA_VALIDATION_VIEW: "data.validation.view",
//     DATA_VALIDATION_MANAGE: "data.validation.manage",
  
//     /**
//      * ===================================================
//      * SYSTEM
//      * ===================================================
//      */
  
//     SYSTEM_SETTINGS_VIEW: "system.settings.view",
//     SYSTEM_SETTINGS_MANAGE: "system.settings.manage",
  
//     AUDIT_LOG_VIEW: "audit.log.view",
  
//     /**
//      * ===================================================
//      * NOTIFICATIONS
//      * ===================================================
//      */
  
//     NOTIFICATION_VIEW: "notification.view",
//     NOTIFICATION_MANAGE: "notification.manage",
  
//     /**
//      * ===================================================
//      * CITIZEN / REGISTRATION
//      * ===================================================
//      */
  
//     CITIZEN_VIEW: "citizen.view",
//     CITIZEN_CREATE: "citizen.create",
//     CITIZEN_EDIT: "citizen.edit",
//     CITIZEN_VERIFY: "citizen.verify",
  
//   } as const;
  
//   export type AppPermission =
//     (typeof APP_PERMISSIONS)[keyof typeof APP_PERMISSIONS];
  
  

  
//   /**
//    * =====================================================
//    * 3. ROUTE PERMISSIONS
//    * =====================================================
//    *
//    * Every protected employee route must be registered.
//    *
//    * SECURITY DEFAULT:
//    *
//    * Unknown protected route = DENY.
//    *
//    * More specific routes MUST appear before generic
//    * parent routes.
//    */
  
//   export const ROUTE_PERMISSIONS: Array<{
//     pattern: RegExp;
//     permission: AppPermission;
//   }> = [
  
//     /**
//      * ===================================================
//      * SYSTEM / OFFICE DASHBOARD
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/office\/dashboard$/,
//       permission: APP_PERMISSIONS.DASHBOARD_VIEW,
//     },
  
//     /**
//      * ===================================================
//      * SECTOR DASHBOARD
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/sector\/dashboard$/,
//       permission: APP_PERMISSIONS.DASHBOARD_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * ADMINISTRATIVE STRUCTURE
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/office\/dashboard\/administrative(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.ADMINISTRATIVE_UNITS_VIEW,
//     },
  
//     {
//       pattern: /^\/office\/dashboard\/sectors(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.SECTORS_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * USER ACCESS
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/office\/dashboard\/users(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.USERS_VIEW,
//     },
  
//     {
//       pattern: /^\/office\/dashboard\/taxpayers(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.TAXPAYER_VIEW,
//     },
  
//     {
//       pattern: /^\/office\/dashboard\/access-managements(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.ACCESS_MANAGEMENT_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * SYSTEM SETTINGS
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/office\/dashboard\/system-settings(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.SYSTEM_SETTINGS_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * AUDIT LOGS
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/office\/dashboard\/audits(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.AUDIT_LOG_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * CALCULATION SETUP
//      * ===================================================
//      */
  
//     {
//       pattern:
//         /^\/office\/dashboard\/revenue-managements\/measurement-units(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.MEASUREMENT_UNIT_VIEW,
//     },
  
//     {
//       pattern:
//         /^\/office\/dashboard\/revenue-managements\/base-fields(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.BASE_FIELD_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * REVENUE CONFIGURATION
//      * ===================================================
//      */
  
//     {
//       pattern:
//         /^\/office\/dashboard\/revenue-managements\/categories(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.REVENUE_CATEGORY_VIEW,
//     },
  
//     {
//       pattern:
//         /^\/office\/dashboard\/revenue-managements\/services(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.REVENUE_SERVICE_VIEW,
//     },
  
//     {
//       pattern:
//         /^\/office\/dashboard\/revenue-managements\/tariff-versions(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.TARIFF_VERSION_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * DATA VALIDATION
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/data\/validation(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.DATA_VALIDATION_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * DATA REPORTS
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/data\/reports(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.REPORT_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * REVENUE OVERVIEW
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/dashboard\/revenue(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.REVENUE_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * PERFORMANCE REPORTS
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/dashboard\/reports(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.REPORT_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * SECTOR ASSESSMENTS
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/office\/dashboard\/assessments$/,
//       permission: APP_PERMISSIONS.ASSESSMENT_VIEW,
//     },
  
//     {
//       pattern: /^\/office\/dashboard\/assessments\/(?:.*)$/,
//       permission: APP_PERMISSIONS.ASSESSMENT_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * SECTOR INVOICES
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/office\/dashboard\/invoices(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.INVOICE_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * REVENUE REPORTS
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/office\/dashboard\/reports\/revenue(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.REVENUE_REPORT_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * PERFORMANCE REPORTS
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/office\/dashboard\/reports\/performance(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.PERFORMANCE_REPORT_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * DECISION OFFICER - PENDING
//      * ===================================================
//      *
//      * Specific route MUST come before generic
//      * assessment route.
//      */
  
//     {
//       pattern: /^\/office\/dashboard\/assessments\/pendings(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.ASSESSMENT_REVIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * DECISION OFFICER - HISTORY
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/office\/dashboard\/assessments\/history(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.ASSESSMENT_REVIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * DECISION REPORTS
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/office\/dashboard\/reports\/decisions(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.DECISION_REPORT_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * REVENUE COLLECTIONS
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/revenue\/collections\/pending(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.COLLECTION_VIEW,
//     },
  
//     {
//       pattern: /^\/revenue\/collections\/completed(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.COLLECTION_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * PAYMENTS
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/revenue\/payments\/create(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.PAYMENT_COLLECT,
//     },
  
//     {
//       pattern: /^\/revenue\/payments\/history(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.PAYMENT_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * RECEIPTS
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/revenue\/receipts(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.RECEIPT_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * COLLECTION REPORTS
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/revenue\/reports(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.COLLECTION_REPORT_VIEW,
//     },
  
  
//     /**
//      * ===================================================
//      * REGISTRATION
//      * ===================================================
//      */
  
//     {
//       pattern: /^\/registration\/taxpayers(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.TAXPAYER_VIEW,
//     },
  
//     {
//       pattern: /^\/registration\/reports(?:\/.*)?$/,
//       permission: APP_PERMISSIONS.REPORT_VIEW,
//     },
//   ];
  
  
//   /**
//    * =====================================================
//    * 4. PERMISSION HELPERS
//    * =====================================================
//    */
  
//   // export function hasPermission(
//   //   role: UserRole,
//   //   permission: AppPermission,
//   // ): boolean {
//   //   const permissions = ROLE_PERMISSIONS[role];
  
//   //   if (!permissions) {
//   //     return false;
//   //   }
  
//   //   return permissions.includes(permission);
//   // }
  
  
//   /**
//    * =====================================================
//    * 5. ROUTE ACCESS CHECK
//    * =====================================================
//    */
  
//   export function canAccessRoute(
//     role: UserRole,
//     pathname: string,
//   ): boolean {
  
//     const route = ROUTE_PERMISSIONS.find(({ pattern }) =>
//       pattern.test(pathname),
//     );
  
//     /**
//      * SECURITY DEFAULT:
//      *
//      * Unknown route = DENY.
//      */
  
//     if (!route) {
//       return false;
//     }
  
//     return hasPermission(
//       role,
//       route.permission,
//     );
//   }
  
  
//   /**
//    * =====================================================
//    * 6. GET REQUIRED ROUTE PERMISSION
//    * =====================================================
//    */
  
//   export function getRoutePermission(
//     pathname: string,
//   ): AppPermission | null {
  
//     const route = ROUTE_PERMISSIONS.find(({ pattern }) =>
//       pattern.test(pathname),
//     );
  
//     return route?.permission ?? null;
//   }
  
  
//   /**
//    * =====================================================
//    * 7. ROLE PERMISSION CHECK
//    * =====================================================
//    */
  
//   export function canUser(
//     role: UserRole,
//     permission: AppPermission,
//   ): boolean {
//     return hasPermission(
//       role,
//       permission,
//     );
//   }
  
  
//   /**
//    * =====================================================
//    * 8. SYSTEM ADMIN NAVIGATION
//    * =====================================================
//    */
  
//   const SYSTEM_ADMIN_NAV: NavItem[] = [
  
//     {
//       title: "dashboard",
//       url: "/office/dashboard",
//       icon: PieChart,
//     },
  
//     {
//       title: "administrative_structure",
//       url: "#",
//       icon: Building2,
//       items: [
  
//         {
//           title: "administrative_units",
//           url: "/office/dashboard/administrative",
//         },
  
//         {
//           title: "sectors",
//           url: "/office/dashboard/sectors",
//         },
  
//       ],
//     },
  
//     {
//       title: "user_access",
//       url: "#",
//       icon: Users,
//       items: [
  
//         {
//           title: "users",
//           url: "/office/dashboard/users",
//         },
  
//         {
//           title: "taxpayers",
//           url: "/office/dashboard/taxpayers",
//         },
  
//         {
//           title: "access_managements",
//           url: "/office/dashboard/access-managements",
//         },
  
//       ],
//     },
  
//     {
//       title: "system_settings",
//       url: "/office/dashboard/system-settings",
//       icon: Settings,
//     },
  
//     {
//       title: "audit_logs",
//       url: "/office/dashboard/audits",
//       icon: ShieldCheck,
//     },
//   ];
  
  
//   /**
//    * =====================================================
//    * 9. DATA MANAGER NAVIGATION
//    * =====================================================
//    */
  
//   const DATA_MANAGER_NAV: NavItem[] = [
  
//     {
//       title: "dashboard",
//       url: "/office/dashboard",
//       icon: PieChart,
//     },
  
//     {
//       title: "calculation_setup",
//       url: "#",
//       icon: Calculator,
//       items: [
  
//         {
//           title: "measurement_units",
//           url:
//             "/office/dashboard/revenue-managements/measurement-units",
//         },
  
//         {
//           title: "base_fields",
//           url:
//             "/office/dashboard/revenue-managements/base-fields",
//         },
  
//       ],
//     },
  
//     {
//       title: "revenue_configuration",
//       url: "#",
//       icon: ClipboardList,
//       items: [
  
//         {
//           title: "revenue_categories",
//           url:
//             "/office/dashboard/revenue-managements/categories",
//         },
  
//         {
//           title: "revenue_services",
//           url:
//             "/office/dashboard/revenue-managements/services",
//         },
  
//         {
//           title: "tariff_versions",
//           url:
//             "/office/dashboard/revenue-managements/tariff-versions",
//         },
  
//       ],
//     },
  
//     {
//       title: "data_validation",
//       url: "/data/validation",
//       icon: CheckCircle2,
//     },
  
//     {
//       title: "data_reports",
//       url: "/data/reports",
//       icon: FileText,
//     },
//   ];
  
  
//   /**
//    * =====================================================
//    * 10. EXECUTIVE VIEWER NAVIGATION
//    * =====================================================
//    */
  
//   const EXECUTIVE_VIEWER_NAV: NavItem[] = [
  
//     {
//       title: "executive_dashboard",
//       url: "/office/dashboard",
//       icon: Landmark,
//     },
  
//     {
//       title: "revenue_overview",
//       url: "/dashboard/revenue",
//       icon: Target,
//     },
  
//     {
//       title: "performance_reports",
//       url: "/dashboard/reports",
//       icon: FileText,
//     },
//   ];
  
  
//   /**
//    * =====================================================
//    * 11. SECTOR OFFICER NAVIGATION
//    * =====================================================
//    */
  
//   const SECTOR_OFFICER_NAV: NavItem[] = [
  
//     {
//       title: "sector_dashboard",
//       url: "/sector/dashboard",
//       icon: Building2,
//     },
  
//     {
//       title: "revenue_operations",
//       url: "#",
//       icon: ClipboardList,
//       items: [
  
//         {
//           title: "assessments",
//           url: "/office/dashboard/assessments",
//         },
  
//         {
//           title: "invoices",
//           url: "/office/dashboard/invoices",
//         },
  
//       ],
//     },
  
//     {
//       title: "reports",
//       url: "#",
//       icon: FileText,
//       items: [
  
//         {
//           title: "revenue_reports",
//           url: "/office/dashboard/reports/revenue",
//         },
  
//         {
//           title: "performance_reports",
//           url: "/office/dashboard/reports/performance",
//         },
  
//       ],
//     },
//   ];
  
  
//   /**
//    * =====================================================
//    * 12. REVENUE DECISION OFFICER NAVIGATION
//    * =====================================================
//    */
  
//   const REVENUE_DECISION_OFFICER_NAV: NavItem[] = [
  
//     {
//       title: "decision_dashboard",
//       url: "/office/dashboard",
//       icon: CheckCircle2,
//     },
  
//     {
//       title: "assessment_decisions",
//       url: "#",
//       icon: ClipboardList,
//       items: [
  
//         {
//           title: "pending_assessments",
//           url:
//             "/office/dashboard/assessments/pendings",
//         },
  
//         {
//           title: "decision_history",
//           url:
//             "/office/dashboard/assessments/history",
//         },
  
//       ],
//     },
  
//     {
//       title: "reports",
//       url: "#",
//       icon: FileText,
//       items: [
  
//         {
//           title: "decision_reports",
//           url:
//             "/office/dashboard/reports/decisions",
//         },
  
//         {
//           title: "revenue_reports",
//           url:
//             "/office/dashboard/reports/revenue",
//         },
  
//       ],
//     },
//   ];
  
  
//   /**
//    * =====================================================
//    * 13. REVENUE COLLECTOR NAVIGATION
//    * =====================================================
//    */
  
//   const REVENUE_COLLECTOR_NAV: NavItem[] = [
  
//     {
//       title: "dashboard",
//       url: "/office/dashboard",
//       icon: Target,
//     },
  
//     {
//       title: "collections",
//       url: "#",
//       icon: Inbox,
//       items: [
  
//         {
//           title: "pending_collections",
//           url: "/revenue/collections/pending",
//         },
  
//         {
//           title: "completed_collections",
//           url: "/revenue/collections/completed",
//         },
  
//       ],
//     },
  
//     {
//       title: "payments",
//       url: "#",
//       icon: Wallet,
//       items: [
  
//         {
//           title: "create_payment",
//           url: "/revenue/payments/create",
//         },
  
//         {
//           title: "payment_history",
//           url: "/revenue/payments/history",
//         },
  
//       ],
//     },
  
//     {
//       title: "reports",
//       url: "#",
//       icon: ClipboardList,
//       items: [
  
//         {
//           title: "receipts",
//           url: "/revenue/receipts",
//         },
  
//         {
//           title: "collection_reports",
//           url: "/revenue/reports",
//         },
  
//       ],
//     },
//   ];
  
  
//   /**
//    * =====================================================
//    * 14. REGISTRATION OFFICER NAVIGATION
//    * =====================================================
//    */
  
//   const REGISTRATION_OFFICER_NAV: NavItem[] = [
  
//     {
//       title: "registration_dashboard",
//       url: "/office/dashboard",
//       icon: Users,
//     },
  
//     {
//       title: "taxpayer_registration",
//       url: "/registration/taxpayers",
//       icon: ClipboardList,
//     },
  
//     {
//       title: "registration_reports",
//       url: "/registration/reports",
//       icon: FileText,
//     },
//   ];
  

  
  
//   /**
//    * =====================================================
//    * 16. CITIZEN NAVIGATION
//    * =====================================================
//    *
//    * Citizens are NOT employees and therefore do not use
//    * UserRole.
//    */
  
//   export const CITIZEN_NAV: NavItem[] = [
  
//     {
//       title: "Citizen Dashboard",
//       url: "/citizen/dashboard",
//       icon: PieChart,
//     },
  
//     {
//       title: "My Profile",
//       url: "/citizen/profile",
//       icon: UserRound,
//     },
  
//     {
//       title: "My Applications",
//       url: "/citizen/applications",
//       icon: FileText,
//     },
  
//     {
//       title: "My Payments",
//       url: "/citizen/payments",
//       icon: Wallet,
//     },
  
//     {
//       title: "My Notifications",
//       url: "/citizen/notifications",
//       icon: Inbox,
//     },
//   ];