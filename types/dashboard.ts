import { ComponentType } from "react";
import {
    Activity,
    Banknote,
    Building2,
    Calculator,
    CalendarClock,
    CheckCircle2,
    ClipboardCheck,
    ClipboardList,
    CreditCard,
    FileCheck2,
    FileText,
    Landmark,
    MapPinned,
    PieChart,
    Receipt,
    Settings,
    Settings2,
    ShieldCheck,
    Smartphone,
    Target,
    Users,
    Wallet,
  } from "lucide-react";
import { PermissionAction } from "./user";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ChartType = "bar" | "line";
export type Period = "7d" | "30d" | "90d";
export type RevenueSource = "ASSESSMENT" | "DIRECT_COLLECTION";
export type ModuleCategory = "Revenue" | "Operations" | "Administration";
export type IconType = ComponentType<{ className?: string }>;

export type RevenuePoint = {
  date: string;
  assessment: number;
  direct: number;
};

export type ModuleItem = {
  title: string;
  description: string;
  href: string;
  resource: string;
  action: PermissionAction;
  category: ModuleCategory;
  icon: IconType;
  keywords?: string[];
};
 
export type WorkItem = {
  title: string;
  description: string;
  count: number;
  href: string;
  resource: string;
  action: string;
  icon: IconType;
  priority: "High" | "Medium";
};
 
export type ActivityStatus = "Completed" | "Pending" | "Processing";


export type SystemStatistics = {
  totalUsers: number;
  totalTaxpayers: number;
  totalAgents: number;
  totalAssessments: number;
  totalAssessmentInvoices: number;
  totalDirectCollectionInvoices: number;
};


export  const systemStatistics: SystemStatistics = {
    totalUsers: 0,
    totalTaxpayers: 0,
    totalAgents: 0,
    totalAssessments: 0,
    totalAssessmentInvoices: 0,
    totalDirectCollectionInvoices:0
  };

export const PERIODS: { key: Period; label: string }[] = [
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
    { key: "90d", label: "90 days" },
  ];

export type DashboardSummaryParams = {
    from?: string
    to?: string
  }



  export type DashboardPeriod = {
    from: string
    to: string
  }
  
  export type RevenueTrend = number | null
  
  export type RevenueTrendStatus =
    | "NEW_REVENUE"
    | "INCREASED"
    | "DECREASED"
    | "UNCHANGED"
    | "NO_REVENUE"
  
  export type RevenueTotals = {
    combined: number
    assessment: number
    direct: number
  
    combinedTrend: RevenueTrend
    assessmentTrend: RevenueTrend
    directTrend: RevenueTrend
  
    combinedTrendStatus: RevenueTrendStatus | null
    assessmentTrendStatus: RevenueTrendStatus | null
    directTrendStatus: RevenueTrendStatus | null
  }
  
  export type RevenueChartInterval = "day"
  
  export type RevenueChartPoint = {
    date: string
    assessment: number
    direct: number
    combined: number
  }
  
  export type RevenueChart = {
    period: DashboardPeriod
    currency: "ETB"
    interval: RevenueChartInterval
    series: RevenueChartPoint[]
  }
  
  export type OutstandingRevenue = {
    amount: number
  }
  
  export type RevenueSummary = {
    period: DashboardPeriod
    totals: RevenueTotals
    chart: RevenueChart
    outstanding: OutstandingRevenue
  }
  
  export type DashboardSystemStatistics = {
    totalUsers: number
    totalTaxpayers: number
    totalAssessments: number
    totalAgents: number
    totalAssessmentInvoices: number
    totalDirectCollectionInvoices: number
  }
  
  export type DashboardWorkQueueItem = {
    key: string
    title: string
    description: string
    count: number
    href: string
  }
  
  export type DashboardWorkQueue = {
    total: number
    items: DashboardWorkQueueItem[]
  }

  export type DashboardActivityStatus =
  | "INITIATED"
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REVERSED"
  | "CANCELLED";

export type DashboardActivitySource =
  | "ASSESSMENT"
  | "DIRECT";

export type DashboardActivity = {
  reference: string;
  title: string;
  description: string;
  status: DashboardActivityStatus;
  source: DashboardActivitySource;
  occurredAt: string;
};

export type DashboardRecentActivity = {
  items: DashboardActivity[];
};
  
  export type DashboardSummary = {
    revenue: RevenueSummary
    systemStatistics: DashboardSystemStatistics
    workQueue: DashboardWorkQueue
    recentActivity: DashboardRecentActivity;

  }
  

/**
 * Searchable application modules.
 *
 * Permission-driven navigation:
 * - Uses the same URLs as NAV_ITEMS.
 * - Maps modules to the resources/actions expected by Can.
 * - Does not use role names.
 *
 * IMPORTANT:
 * Keep resource/action values aligned with the actual permissions
 * returned by your backend and consumed by the Can component.
 */
export const MODULES: ModuleItem[] = [
  // =========================================================
  // DASHBOARD
  // =========================================================
  {
    title: "Dashboard",
    description: "Overview of municipal revenue and operations",
    href: "/office/dashboard",
    resource: "dashboard",
    action: "read",
    category: "Administration",
    icon: PieChart,
    keywords: ["home", "overview", "summary", "analytics"],
  },

  // =========================================================
  // REVENUE OPERATIONS
  // =========================================================
  {
    title: "Assessments",
    description: "Review, manage and issue revenue assessments",
    href: "/office/dashboard/assessments",
    resource: "assessments",
    action: "read",
    category: "Revenue",
    icon: ClipboardList,
    keywords: ["assessment", "tax", "revenue", "approval"],
  },
  {
    title: "Pending Assessments",
    description: "Review assessments awaiting a decision",
    href: "/office/dashboard/assessments/pendings",
    resource: "assessments",
    action: "read",
    category: "Revenue",
    icon: CheckCircle2,
    keywords: ["pending", "approval", "decision", "review"],
  },
  {
    title: "Assessment Decision History",
    description: "Review previously processed assessment decisions",
    href: "/office/dashboard/assessments/history",
    resource: "assessments",
    action: "read",
    category: "Revenue",
    icon: Activity,
    keywords: ["history", "approved", "rejected", "decisions"],
  },
  {
    title: "Lease Amendments",
    description: "Manage lease-related assessment amendments",
    href: "/office/dashboard/lease-amendments",
    resource: "lease-amendments",
    action: "read",
    category: "Revenue",
    icon: FileCheck2,
    keywords: ["lease", "land", "ownership", "transfer", "amendment"],
  },
  {
    title: "Invoices",
    description: "Review issued, partially paid and overdue invoices",
    href: "/office/dashboard/invoices",
    resource: "invoices",
    action: "read",
    category: "Revenue",
    icon: Receipt,
    keywords: ["billing", "unpaid", "outstanding", "balance"],
  },
  {
    title: "Payments",
    description: "View payment transactions and payment history",
    href: "/office/dashboard/payments",
    resource: "payments",
    action: "read",
    category: "Revenue",
    icon: CreditCard,
    keywords: ["transactions", "receipts", "collection", "payment history"],
  },
  {
    title: "Field Collections",
    description: "Manage revenue collection activities in the field",
    href: "/office/dashboard/field-collections",
    resource: "field-collection",
    action: "read",
    category: "Operations",
    icon: MapPinned,
    keywords: ["field", "mobile", "collector", "collection"],
  },
  {
    title: "Penalties",
    description: "Review and manage revenue penalties",
    href: "/office/dashboard/penalties",
    resource: "penalties",
    action: "read",
    category: "Revenue",
    icon: Banknote,
    keywords: ["penalty", "late payment", "fine", "arrears"],
  },
  {
    title: "Penalty Discount Requests",
    description: "Review requests for penalty discounts",
    href: "/office/dashboard/penalty-discount-requests",
    resource: "penalty-discount-requests",
    action: "read",
    category: "Revenue",
    icon: FileCheck2,
    keywords: ["discount", "penalty", "waiver", "request"],
  },
  {
    title: "Revenue Adjustments",
    description: "Review and manage revenue adjustments",
    href: "/office/dashboard/revenue-adjustments",
    resource: "revenue-adjustments",
    action: "read",
    category: "Revenue",
    icon: Calculator,
    keywords: ["adjustment", "correction", "reassessment"],
  },
  {
    title: "Revenue Complaints",
    description: "Review and manage revenue-related complaints",
    href: "/office/dashboard/revenue-complaints",
    resource: "revenue-complaints",
    action: "read",
    category: "Operations",
    icon: FileText,
    keywords: ["complaint", "dispute", "citizen", "appeal"],
  },
  {
    title: "Cash Reconciliation",
    description: "Review collection reconciliation and discrepancies",
    href: "/office/dashboard/cash-reconciliations",
    resource: "cash-reconciliations",
    action: "read",
    category: "Revenue",
    icon: ClipboardCheck,
    keywords: ["cash", "reconciliation", "discrepancy", "finance"],
  },

  // =========================================================
  // ADMINISTRATIVE STRUCTURE
  // =========================================================
  {
    title: "Administrative Units",
    description: "Manage municipal administrative units",
    href: "/office/dashboard/administrative",
    resource: "administrative-units",
    action: "read",
    category: "Administration",
    icon: Building2,
    keywords: ["administration", "structure", "units", "organization"],
  },
  {
    title: "Sectors",
    description: "View and manage municipal sectors",
    href: "/office/dashboard/sectors",
    resource: "sectors",
    action: "read",
    category: "Administration",
    icon: Building2,
    keywords: ["sector", "department", "organization"],
  },

  // =========================================================
  // CITIZENS AND USER ACCESS
  // =========================================================
  {
    title: "Users",
    description: "Manage user accounts and system access",
    href: "/office/dashboard/users",
    resource: "users",
    action: "read",
    category: "Administration",
    icon: Users,
    keywords: ["users", "accounts", "staff", "permissions"],
  },
  {
    title: "Taxpayers",
    description: "View and manage citizen and taxpayer records",
    href: "/office/dashboard/taxpayers",
    resource: "citizens",
    action: "read",
    category: "Operations",
    icon: Users,
    keywords: ["citizens", "taxpayers", "people", "identity"],
  },
  {
    title: "Roles and Access Management",
    description: "Manage roles and permission assignments",
    href: "/office/dashboard/access-managements",
    resource: "roles",
    action: "read",
    category: "Administration",
    icon: ShieldCheck,
    keywords: ["roles", "access", "authorization", "permissions"],
  },

  // =========================================================
  // CALCULATION SETUP
  // =========================================================
  {
    title: "Measurement Units",
    description: "Configure units used in revenue calculations",
    href: "/office/dashboard/revenue-managements/measurement-units",
    resource: "measurement-units",
    action: "read",
    category: "Administration",
    icon: Settings2,
    keywords: ["units", "measurement", "area", "quantity"],
  },
  {
    title: "Base Fields",
    description: "Configure fields used in assessment calculations",
    href: "/office/dashboard/revenue-managements/base-fields",
    resource: "base-fields",
    action: "read",
    category: "Administration",
    icon: Calculator,
    keywords: ["base fields", "calculation", "assessment", "formula"],
  },

  // =========================================================
  // REVENUE CONFIGURATION
  // =========================================================
  {
    title: "Revenue Categories",
    description: "Manage municipal revenue categories",
    href: "/office/dashboard/revenue-managements/categories",
    resource: "revenue-categories",
    action: "read",
    category: "Administration",
    icon: ClipboardList,
    keywords: ["categories", "revenue", "classification"],
  },
  {
    title: "Revenue Services",
    description: "Configure revenue-generating municipal services",
    href: "/office/dashboard/revenue-managements/services",
    resource: "revenue-services",
    action: "read",
    category: "Administration",
    icon: Settings,
    keywords: ["services", "revenue", "service configuration"],
  },
  {
    title: "Tariff Management",
    description: "Manage tariff versions and revenue rates",
    href: "/office/dashboard/revenue-managements/tariff-versions",
    resource: "tariffs",
    action: "read",
    category: "Administration",
    icon: Calculator,
    keywords: ["tariffs", "rates", "pricing", "calculation"],
  },
  {
    title: "Penalty Rules",
    description: "Configure penalty calculation rules",
    href: "/office/dashboard/revenue-managements/penalty-rules",
    resource: "penalty-rules",
    action: "read",
    category: "Administration",
    icon: ShieldCheck,
    keywords: ["penalties", "rules", "late fees"],
  },
  {
    title: "Interest Rates",
    description: "Configure interest rules for outstanding revenue",
    href: "/office/dashboard/revenue-managements/interest-rules",
    resource: "interest-rules",
    action: "read",
    category: "Administration",
    icon: Landmark,
    keywords: ["interest", "rates", "arrears"],
  },
  {
    title: "Payment Schedule Rules",
    description: "Configure revenue payment schedule rules",
    href: "/office/dashboard/revenue-managements/payment-schedule-rules",
    resource: "payment-schedule-rules",
    action: "read",
    category: "Administration",
    icon: CalendarClock,
    keywords: ["schedule", "installments", "payment terms"],
  },
  {
    title: "Bank Accounts",
    description: "Manage configured municipal bank accounts",
    href: "/office/dashboard/revenue-managements/bank-accounts",
    resource: "bank-accounts",
    action: "read",
    category: "Administration",
    icon: Landmark,
    keywords: ["bank", "accounts", "deposits"],
  },
  {
    title: "Payment Providers",
    description: "Configure electronic payment providers",
    href: "/office/dashboard/revenue-managements/payment-providers",
    resource: "payment-providers",
    action: "read",
    category: "Administration",
    icon: Smartphone,
    keywords: ["Chapa", "Telebirr", "online", "digital payments"],
  },

  // =========================================================
  // SYSTEM AND AUDIT
  // =========================================================
  {
    title: "System Settings",
    description: "Manage application-wide system settings",
    href: "/office/dashboard/system-settings",
    resource: "system-settings",
    action: "read",
    category: "Administration",
    icon: Settings,
    keywords: ["configuration", "system", "settings"],
  },
  {
    title: "Audit Logs",
    description: "Review system activity and audit records",
    href: "/office/dashboard/audits",
    resource: "audit",
    action: "read",
    category: "Administration",
    icon: ShieldCheck,
    keywords: ["audit", "logs", "security", "activity history"],
  },

  // =========================================================
  // MOBILE APP MANAGEMENT
  // =========================================================
  {
    title: "Mobile App Releases",
    description: "Manage mobile application releases",
    href: "/office/dashboard/mobile-app-releases",
    resource: "mobile-app-releases",
    action: "read",
    category: "Operations",
    icon: Smartphone,
    keywords: ["mobile", "app", "version", "release"],
  },

  // =========================================================
  // REPORTS
  // =========================================================
  {
    title: "Reports",
    description: "Access municipal revenue and operational reports",
    href: "/office/dashboard/reports",
    resource: "reports",
    action: "read",
    category: "Operations",
    icon: Target,
    keywords: ["reports", "analytics", "revenue summary", "statistics"],
  },
];

