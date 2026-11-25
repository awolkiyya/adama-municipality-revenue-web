
import { ComponentType } from "react";
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

/* -------------------------------------------------------------------------- */
/* System Statistics                                                          */
/* -------------------------------------------------------------------------- */

export type SystemStatistics = {
  totalUsers: number;
  totalTaxpayers: number;
  totalAgents: number;
  totalAssessments: number;
  totalAssessmentInvoices: number;
  totalDirectCollectionInvoices: number;

  totalActiveRevenueCategories: number;
  totalRevenueCodes: number;
  totalActiveRevenueServices: number;
};

export const systemStatistics: SystemStatistics = {
  totalUsers: 0,
  totalTaxpayers: 0,
  totalAgents: 0,
  totalAssessments: 0,
  totalAssessmentInvoices: 0,
  totalDirectCollectionInvoices: 0,

  totalActiveRevenueCategories: 0,
  totalRevenueCodes: 0,
  totalActiveRevenueServices: 0,
};

/* -------------------------------------------------------------------------- */
/* Dashboard Periods                                                           */
/* -------------------------------------------------------------------------- */

export const PERIODS: { key: Period; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
];

export type DashboardSummaryParams = {
  from?: string;
  to?: string;
};

export type DashboardPeriod = {
  from: string;
  to: string;
};

/* -------------------------------------------------------------------------- */
/* Revenue Summary                                                            */
/* -------------------------------------------------------------------------- */

export type RevenueTrend = number | null;

export type RevenueTrendStatus =
  | "NEW_REVENUE"
  | "INCREASED"
  | "DECREASED"
  | "UNCHANGED"
  | "NO_REVENUE";

export type RevenueTotals = {
  combined: number;
  assessment: number;
  direct: number;

  combinedTrend: RevenueTrend;
  assessmentTrend: RevenueTrend;
  directTrend: RevenueTrend;

  combinedTrendStatus: RevenueTrendStatus | null;
  assessmentTrendStatus: RevenueTrendStatus | null;
  directTrendStatus: RevenueTrendStatus | null;
};

export type RevenueChartInterval = "day";

export type RevenueChartPoint = {
  date: string;
  assessment: number;
  direct: number;
  combined: number;
};

export type RevenueChart = {
  period: DashboardPeriod;
  currency: "ETB";
  interval: RevenueChartInterval;
  series: RevenueChartPoint[];
};

export type OutstandingRevenue = {
  amount: number;
};

export type RevenueSummary = {
  period: DashboardPeriod;
  totals: RevenueTotals;
  chart: RevenueChart;
  outstanding: OutstandingRevenue;
};

/* -------------------------------------------------------------------------- */
/* Dashboard System Statistics                                                */
/* -------------------------------------------------------------------------- */

export type DashboardSystemStatistics = {
  totalUsers: number;
  totalTaxpayers: number;
  totalAssessments: number;
  totalAgents: number;
  totalAssessmentInvoices: number;
  totalDirectCollectionInvoices: number;

  totalActiveRevenueCategories: number;
  totalRevenueCodes: number;
  totalActiveRevenueServices: number;
};

/* -------------------------------------------------------------------------- */
/* Dashboard Work Queue                                                       */
/* -------------------------------------------------------------------------- */

export type DashboardWorkQueueItem = {
  key: string;
  title: string;
  description: string;
  count: number;
  href: string;
};

export type DashboardWorkQueue = {
  total: number;
  items: DashboardWorkQueueItem[];
};

/* -------------------------------------------------------------------------- */
/* Dashboard Recent Activity                                                  */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Dashboard Summary                                                          */
/* -------------------------------------------------------------------------- */

export type DashboardSummary = {
  revenue: RevenueSummary;
  systemStatistics: DashboardSystemStatistics;
  workQueue: DashboardWorkQueue;
  recentActivity: DashboardRecentActivity;
};
