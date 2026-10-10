"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  CreditCard,
  FileBarChart,
  Landmark,
  Receipt,
  Search,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { APP_PERMISSIONS } from "@/lib/authorization";
import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";

// Connect your existing permission hook before production.

type ReportCategory =
  | "revenue"
  | "transactions"
  | "assessment"
  | "control";

type CategoryFilter = "all" | ReportCategory;

type ReportItem = {
  title: string;
  description: string;
  url: string;
  permission: string;
  category: ReportCategory;
  icon: typeof BarChart3;
};

const REPORTS: ReportItem[] = [
  {
    title: "revenue_collection_report",
    description: "revenue_collection_report_description",
    url: "/office/dashboard/reports/revenue-collection",
    permission:
      APP_PERMISSIONS.REPORTS_REVENUE_COLLECTION_VIEW,
    category: "revenue",
    icon: BarChart3,
  },
  {
    title: "payment_report",
    description: "payment_report_description",
    url: "/office/dashboard/reports/payments",
    permission: APP_PERMISSIONS.REPORTS_PAYMENTS_VIEW,
    category: "transactions",
    icon: CreditCard,
  },
  {
    title: "invoice_report",
    description: "invoice_report_description",
    url: "/office/dashboard/reports/invoices",
    permission: APP_PERMISSIONS.REPORTS_INVOICES_VIEW,
    category: "transactions",
    icon: Receipt,
  },
  {
    title: "assessment_report",
    description: "assessment_report_description",
    url: "/office/dashboard/reports/assessments",
    permission: APP_PERMISSIONS.REPORTS_ASSESSMENTS_VIEW,
    category: "assessment",
    icon: ClipboardCheck,
  },
  {
    title: "outstanding_revenue",
    description: "outstanding_revenue_description",
    url: "/office/dashboard/reports/outstanding-revenue",
    permission:
      APP_PERMISSIONS.REPORTS_OUTSTANDING_REVENUE_VIEW,
    category: "revenue",
    icon: AlertCircle,
  },
  {
    title: "cash_reconciliation",
    description: "cash_reconciliation_description",
    url: "/office/dashboard/reports/cash-reconciliation",
    permission:
      APP_PERMISSIONS.REPORTS_CASH_RECONCILIATION_VIEW,
    category: "control",
    icon: Landmark,
  },
];

const CATEGORIES: {
  value: CategoryFilter;
  label: string;
}[] = [
  { value: "all", label: "all_reports" },
  { value: "revenue", label: "revenue" },
  { value: "transactions", label: "transactions" },
  { value: "assessment", label: "assessment" },
  { value: "control", label: "financial_control" },
];

function ReportsPage() {
  const t = useTranslations("reports");
  const locale = useLocale();

  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState<CategoryFilter>("all");

  /*
   * Replace this with your existing permission utility.
   * The current implementation is for UI preview only.
   */
  const hasPermission = (_permission: string): boolean => true;

  const permittedReports = useMemo(
    () =>
      REPORTS.filter((report) =>
        hasPermission(report.permission),
      ),
    [],
  );

  const filteredReports = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);

    return permittedReports.filter((report) => {
      const matchesCategory =
        category === "all" ||
        report.category === category;

      const title = t(report.title).toLocaleLowerCase(locale);
      const description = t(report.description).toLocaleLowerCase(locale);

      const matchesSearch =
        !query ||
        title.includes(query) ||
        description.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [permittedReports, category, search, t, locale]);

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
  };

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-[1600px] flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Page banner */}
      <Banner
        title={t("title")}
        description={t("description")}
        icon={<FileBarChart className="h-4 w-4" />}
        background={
          <FloatingParticles
            color="#0B3784"
            count={35}
            speed={0.2}
            connectDistance={100}
            position="bottom-right"
          />
        }
        overlayClassName="bg-transparent"
      />

      {/* Search and category filters */}
      <section
        aria-label={t("report_directory")}
        className="flex flex-col gap-3"
      >
        <div className="relative w-full ">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder={t("search_reports")}
            aria-label={t("search_reports")}
            className="h-10 bg-background pl-9 pr-9 w-full"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label={t("clear_filters")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((item) => {
            const active = category === item.value;

            return (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => setCategory(item.value)}
                aria-pressed={active}
                className="h-8"
              >
                {t(item.label)}
              </Button>
            );
          })}

          {(search || category !== "all") && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clearFilters}
              className="h-8 gap-1.5 text-muted-foreground"
            >
              <X className="size-3.5" />
              {t("clear_filters")}
            </Button>
          )}
        </div>
      </section>

      {/* Report directory heading */}
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-sm font-semibold tracking-tight">
          {t("report_directory")}
        </h2>

        <span className="text-sm tabular-nums text-muted-foreground">
          {filteredReports.length} / {permittedReports.length}
        </span>
      </div>

      {/* Report cards */}
      {filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredReports.map((report) => {
            const Icon = report.icon;

            return (
              <Link
                key={report.url}
                href={`/${locale}${report.url}`}
                className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card className="h-full border-border/80 transition-all duration-200 hover:border-primary/40 hover:shadow-sm">
                  <CardContent className="flex items-start gap-3 p-4 sm:p-5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10">
                      <Icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold leading-5">
                        {t(report.title)}
                      </h3>

                      <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                        {t(report.description)}
                      </p>

                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                        {t("view_report")}
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed px-5 py-10 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Search className="size-5 text-muted-foreground" />
          </div>

          <h3 className="mt-3 text-sm font-semibold">
            {t("no_reports_found")}
          </h3>

          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {t("no_reports_found_description")}
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="mt-4"
          >
            {t("clear_filters")}
          </Button>
        </div>
      )}
    </main>
  );
}

export default ReportsPage;

