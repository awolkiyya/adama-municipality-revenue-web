"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Download,
  FileBarChart,
  Filter,
  Landmark,
  Search,
  Smartphone,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/*
|--------------------------------------------------------------------------
| Revenue Collection Report — Demonstration Data
|--------------------------------------------------------------------------
|
| This mock structure follows the current Laravel domain:
|
| administrative_units:
|   CITY | SUBCITY | WEREDA
|
| revenue_categories:
|   TAX | RENT | INVESTMENT | SERVICE | SALE | CAPITAL
|
| revenue_services:
|   revenue_code_id, name, service_type, collection_mode
|
| Collection/payment records below are mock records only.
| Replace MOCK_COLLECTIONS with API data when the backend endpoint is ready.
|
*/

type RevenueDomain =
  | "TAX"
  | "RENT"
  | "INVESTMENT"
  | "SERVICE"
  | "SALE"
  | "CAPITAL";

type AdministrativeLevel = "CITY" | "SUBCITY" | "WEREDA";

type CollectionMode =
  | "ASSESSMENT_ONLY"
  | "FIELD_COLLECTION"
  | "BOTH";

type CollectionMethod =
  | "Cash"
  | "Bank Transfer"
  | "Telebirr"
  | "CBE Birr";

type PaymentStatus = "Completed" | "Pending" | "Failed";

type AdministrativeUnit = {
  id: string;
  name: string;
  code: string;
  level: AdministrativeLevel;
  parentId: string | null;
};

type RevenueCategory = {
  id: string;
  name: string;
  domain: RevenueDomain;
  startCode: number;
  endCode: number;
};

type RevenueService = {
  id: string;
  name: string;
  categoryId: string;
  serviceType:
    | "REGISTRATION"
    | "ASSESSMENT"
    | "PERMIT"
    | "RENEWAL"
    | "COLLECTION"
    | "PENALTY";
  collectionMode: CollectionMode;
};

type CollectionRecord = {
  id: string;
  receiptNumber: string;
  taxpayer: string;
  revenueDomain: RevenueDomain;
  categoryId: string;
  serviceId: string;
  administrativeUnitId: string;
  method: CollectionMethod;
  amount: number;
  date: string;
  status: PaymentStatus;
};

type ReportFilters = {
  search: string;
  method: string;
  status: string;
  domain: string;
  categoryId: string;
  administrativeUnitId: string;
  startDate: string;
  endDate: string;
};

const ADMINISTRATIVE_UNITS: AdministrativeUnit[] = [
  {
    id: "city-adama",
    name: "Adama City Administration",
    code: "ADA-CITY",
    level: "CITY",
    parentId: null,
  },
  {
    id: "subcity-bole",
    name: "Bole Subcity",
    code: "ADA-SC-01",
    level: "SUBCITY",
    parentId: "city-adama",
  },
  {
    id: "subcity-lugo",
    name: "Lugo Subcity",
    code: "ADA-SC-02",
    level: "SUBCITY",
    parentId: "city-adama",
  },
  {
    id: "subcity-geda",
    name: "Geda Subcity",
    code: "ADA-SC-03",
    level: "SUBCITY",
    parentId: "city-adama",
  },
  {
    id: "wereda-01",
    name: "Bole Wereda 01",
    code: "ADA-W-001",
    level: "WEREDA",
    parentId: "subcity-bole",
  },
  {
    id: "wereda-02",
    name: "Bole Wereda 02",
    code: "ADA-W-002",
    level: "WEREDA",
    parentId: "subcity-bole",
  },
  {
    id: "wereda-03",
    name: "Lugo Wereda 01",
    code: "ADA-W-003",
    level: "WEREDA",
    parentId: "subcity-lugo",
  },
  {
    id: "wereda-04",
    name: "Geda Wereda 01",
    code: "ADA-W-004",
    level: "WEREDA",
    parentId: "subcity-geda",
  },
];

const REVENUE_CATEGORIES: RevenueCategory[] = [
  {
    id: "cat-property-tax",
    name: "Property Tax",
    domain: "TAX",
    startCode: 1100,
    endCode: 1199,
  },
  {
    id: "cat-business-tax",
    name: "Business Tax",
    domain: "TAX",
    startCode: 1200,
    endCode: 1299,
  },
  {
    id: "cat-land-lease",
    name: "Land Lease",
    domain: "RENT",
    startCode: 1700,
    endCode: 1799,
  },
  {
    id: "cat-market-rent",
    name: "Market Rent",
    domain: "RENT",
    startCode: 1800,
    endCode: 1899,
  },
  {
    id: "cat-investment",
    name: "Investment Income",
    domain: "INVESTMENT",
    startCode: 2100,
    endCode: 2199,
  },
  {
    id: "cat-construction",
    name: "Construction Permit",
    domain: "SERVICE",
    startCode: 3100,
    endCode: 3199,
  },
  {
    id: "cat-business-license",
    name: "Business License",
    domain: "SERVICE",
    startCode: 3200,
    endCode: 3299,
  },
  {
    id: "cat-property-sale",
    name: "Municipal Property Sale",
    domain: "SALE",
    startCode: 4100,
    endCode: 4199,
  },
  {
    id: "cat-capital-asset",
    name: "Capital Asset Disposal",
    domain: "CAPITAL",
    startCode: 5100,
    endCode: 5199,
  },
];

const REVENUE_SERVICES: RevenueService[] = [
  {
    id: "service-property-tax",
    name: "Property Tax Collection",
    categoryId: "cat-property-tax",
    serviceType: "ASSESSMENT",
    collectionMode: "ASSESSMENT_ONLY",
  },
  {
    id: "service-business-tax",
    name: "Business Tax Collection",
    categoryId: "cat-business-tax",
    serviceType: "ASSESSMENT",
    collectionMode: "BOTH",
  },
  {
    id: "service-land-lease",
    name: "Land Lease Payment",
    categoryId: "cat-land-lease",
    serviceType: "ASSESSMENT",
    collectionMode: "ASSESSMENT_ONLY",
  },
  {
    id: "service-market-rent",
    name: "Market Stall Rent",
    categoryId: "cat-market-rent",
    serviceType: "COLLECTION",
    collectionMode: "FIELD_COLLECTION",
  },
  {
    id: "service-investment",
    name: "Investment Income Collection",
    categoryId: "cat-investment",
    serviceType: "COLLECTION",
    collectionMode: "BOTH",
  },
  {
    id: "service-construction",
    name: "Construction Permit Fee",
    categoryId: "cat-construction",
    serviceType: "PERMIT",
    collectionMode: "ASSESSMENT_ONLY",
  },
  {
    id: "service-business-license",
    name: "Business License Renewal",
    categoryId: "cat-business-license",
    serviceType: "RENEWAL",
    collectionMode: "BOTH",
  },
  {
    id: "service-property-sale",
    name: "Municipal Property Sale",
    categoryId: "cat-property-sale",
    serviceType: "COLLECTION",
    collectionMode: "ASSESSMENT_ONLY",
  },
  {
    id: "service-capital-asset",
    name: "Capital Asset Disposal",
    categoryId: "cat-capital-asset",
    serviceType: "COLLECTION",
    collectionMode: "ASSESSMENT_ONLY",
  },
];

const MOCK_COLLECTIONS: CollectionRecord[] = [
  // May 2026
  {
    id: "col-001",
    receiptNumber: "RC-2026-0001",
    taxpayer: "Abebe Trading PLC",
    revenueDomain: "TAX",
    categoryId: "cat-property-tax",
    serviceId: "service-property-tax",
    administrativeUnitId: "wereda-01",
    method: "Cash",
    amount: 485000,
    date: "2026-05-06",
    status: "Completed",
  },
  {
    id: "col-002",
    receiptNumber: "RC-2026-0002",
    taxpayer: "Hana Construction",
    revenueDomain: "SERVICE",
    categoryId: "cat-construction",
    serviceId: "service-construction",
    administrativeUnitId: "wereda-02",
    method: "Bank Transfer",
    amount: 265000,
    date: "2026-05-14",
    status: "Completed",
  },
  {
    id: "col-003",
    receiptNumber: "RC-2026-0003",
    taxpayer: "Gemechu Bekele",
    revenueDomain: "RENT",
    categoryId: "cat-land-lease",
    serviceId: "service-land-lease",
    administrativeUnitId: "wereda-03",
    method: "CBE Birr",
    amount: 735000,
    date: "2026-05-23",
    status: "Completed",
  },

  // June 2026
  {
    id: "col-004",
    receiptNumber: "RC-2026-0004",
    taxpayer: "Mulugeta Business Group",
    revenueDomain: "TAX",
    categoryId: "cat-business-tax",
    serviceId: "service-business-tax",
    administrativeUnitId: "wereda-01",
    method: "Bank Transfer",
    amount: 895000,
    date: "2026-06-04",
    status: "Completed",
  },
  {
    id: "col-005",
    receiptNumber: "RC-2026-0005",
    taxpayer: "Adama Market Association",
    revenueDomain: "RENT",
    categoryId: "cat-market-rent",
    serviceId: "service-market-rent",
    administrativeUnitId: "wereda-03",
    method: "Cash",
    amount: 345000,
    date: "2026-06-12",
    status: "Completed",
  },
  {
    id: "col-006",
    receiptNumber: "RC-2026-0006",
    taxpayer: "Desta Properties",
    revenueDomain: "TAX",
    categoryId: "cat-property-tax",
    serviceId: "service-property-tax",
    administrativeUnitId: "wereda-02",
    method: "Telebirr",
    amount: 180000,
    date: "2026-06-26",
    status: "Pending",
  },

  // July 2026
  {
    id: "col-007",
    receiptNumber: "RC-2026-0007",
    taxpayer: "Abdi Commercial Center",
    revenueDomain: "SERVICE",
    categoryId: "cat-business-license",
    serviceId: "service-business-license",
    administrativeUnitId: "wereda-04",
    method: "Bank Transfer",
    amount: 420000,
    date: "2026-07-05",
    status: "Completed",
  },
  {
    id: "col-008",
    receiptNumber: "RC-2026-0008",
    taxpayer: "Gemechu Bekele",
    revenueDomain: "RENT",
    categoryId: "cat-land-lease",
    serviceId: "service-land-lease",
    administrativeUnitId: "wereda-03",
    method: "CBE Birr",
    amount: 965000,
    date: "2026-07-17",
    status: "Completed",
  },
  {
    id: "col-009",
    receiptNumber: "RC-2026-0009",
    taxpayer: "Oromia Investment Partners",
    revenueDomain: "INVESTMENT",
    categoryId: "cat-investment",
    serviceId: "service-investment",
    administrativeUnitId: "subcity-bole",
    method: "Bank Transfer",
    amount: 1280000,
    date: "2026-07-27",
    status: "Completed",
  },

  // August 2026
  {
    id: "col-010",
    receiptNumber: "RC-2026-0010",
    taxpayer: "Abebe Trading PLC",
    revenueDomain: "TAX",
    categoryId: "cat-property-tax",
    serviceId: "service-property-tax",
    administrativeUnitId: "wereda-01",
    method: "Cash",
    amount: 645000,
    date: "2026-08-03",
    status: "Completed",
  },
  {
    id: "col-011",
    receiptNumber: "RC-2026-0011",
    taxpayer: "Hana Construction",
    revenueDomain: "SERVICE",
    categoryId: "cat-construction",
    serviceId: "service-construction",
    administrativeUnitId: "wereda-02",
    method: "Telebirr",
    amount: 375000,
    date: "2026-08-11",
    status: "Completed",
  },
  {
    id: "col-012",
    receiptNumber: "RC-2026-0012",
    taxpayer: "Adama Market Association",
    revenueDomain: "RENT",
    categoryId: "cat-market-rent",
    serviceId: "service-market-rent",
    administrativeUnitId: "wereda-03",
    method: "Cash",
    amount: 225000,
    date: "2026-08-19",
    status: "Failed",
  },
  {
    id: "col-013",
    receiptNumber: "RC-2026-0013",
    taxpayer: "Desta Properties",
    revenueDomain: "TAX",
    categoryId: "cat-business-tax",
    serviceId: "service-business-tax",
    administrativeUnitId: "wereda-04",
    method: "Bank Transfer",
    amount: 795000,
    date: "2026-08-25",
    status: "Completed",
  },

  // September 2026
  {
    id: "col-014",
    receiptNumber: "RC-2026-0014",
    taxpayer: "Gemechu Bekele",
    revenueDomain: "RENT",
    categoryId: "cat-land-lease",
    serviceId: "service-land-lease",
    administrativeUnitId: "wereda-03",
    method: "Bank Transfer",
    amount: 1125000,
    date: "2026-09-02",
    status: "Completed",
  },
  {
    id: "col-015",
    receiptNumber: "RC-2026-0015",
    taxpayer: "Abdi Commercial Center",
    revenueDomain: "SERVICE",
    categoryId: "cat-business-license",
    serviceId: "service-business-license",
    administrativeUnitId: "wereda-04",
    method: "CBE Birr",
    amount: 535000,
    date: "2026-09-10",
    status: "Completed",
  },
  {
    id: "col-016",
    receiptNumber: "RC-2026-0016",
    taxpayer: "Adama Investment Group",
    revenueDomain: "INVESTMENT",
    categoryId: "cat-investment",
    serviceId: "service-investment",
    administrativeUnitId: "subcity-bole",
    method: "Bank Transfer",
    amount: 1450000,
    date: "2026-09-18",
    status: "Completed",
  },
  {
    id: "col-017",
    receiptNumber: "RC-2026-0017",
    taxpayer: "Municipal Property Office",
    revenueDomain: "SALE",
    categoryId: "cat-property-sale",
    serviceId: "service-property-sale",
    administrativeUnitId: "subcity-lugo",
    method: "Bank Transfer",
    amount: 620000,
    date: "2026-09-24",
    status: "Pending",
  },

  // October 2026
  {
    id: "col-018",
    receiptNumber: "RC-2026-0018",
    taxpayer: "Abebe Trading PLC",
    revenueDomain: "TAX",
    categoryId: "cat-property-tax",
    serviceId: "service-property-tax",
    administrativeUnitId: "wereda-01",
    method: "Cash",
    amount: 715000,
    date: "2026-10-02",
    status: "Completed",
  },
  {
    id: "col-019",
    receiptNumber: "RC-2026-0019",
    taxpayer: "Hana Construction",
    revenueDomain: "SERVICE",
    categoryId: "cat-construction",
    serviceId: "service-construction",
    administrativeUnitId: "wereda-02",
    method: "Bank Transfer",
    amount: 465000,
    date: "2026-10-03",
    status: "Completed",
  },
  {
    id: "col-020",
    receiptNumber: "RC-2026-0020",
    taxpayer: "Gemechu Bekele",
    revenueDomain: "RENT",
    categoryId: "cat-land-lease",
    serviceId: "service-land-lease",
    administrativeUnitId: "wereda-03",
    method: "CBE Birr",
    amount: 985000,
    date: "2026-10-05",
    status: "Completed",
  },
  {
    id: "col-021",
    receiptNumber: "RC-2026-0021",
    taxpayer: "Oromia Investment Partners",
    revenueDomain: "INVESTMENT",
    categoryId: "cat-investment",
    serviceId: "service-investment",
    administrativeUnitId: "subcity-bole",
    method: "Bank Transfer",
    amount: 1325000,
    date: "2026-10-06",
    status: "Completed",
  },
  {
    id: "col-022",
    receiptNumber: "RC-2026-0022",
    taxpayer: "Desta Properties",
    revenueDomain: "TAX",
    categoryId: "cat-business-tax",
    serviceId: "service-business-tax",
    administrativeUnitId: "wereda-04",
    method: "Telebirr",
    amount: 245000,
    date: "2026-10-07",
    status: "Pending",
  },
  {
    id: "col-023",
    receiptNumber: "RC-2026-0023",
    taxpayer: "Adama Market Association",
    revenueDomain: "RENT",
    categoryId: "cat-market-rent",
    serviceId: "service-market-rent",
    administrativeUnitId: "wereda-03",
    method: "Cash",
    amount: 195000,
    date: "2026-10-08",
    status: "Failed",
  },
  {
    id: "col-024",
    receiptNumber: "RC-2026-0024",
    taxpayer: "Municipal Property Office",
    revenueDomain: "CAPITAL",
    categoryId: "cat-capital-asset",
    serviceId: "service-capital-asset",
    administrativeUnitId: "subcity-lugo",
    method: "Bank Transfer",
    amount: 580000,
    date: "2026-10-09",
    status: "Completed",
  },
];

const MONTHLY_TARGETS: Record<string, number> = {
  "2026-05": 1800000,
  "2026-06": 2200000,
  "2026-07": 2700000,
  "2026-08": 2900000,
  "2026-09": 3500000,
  "2026-10": 4200000,
};

const DOMAIN_LABELS: Record<RevenueDomain, string> = {
  TAX: "Tax",
  RENT: "Rent",
  INVESTMENT: "Investment",
  SERVICE: "Service",
  SALE: "Sale",
  CAPITAL: "Capital",
};

const METHOD_COLORS: Record<CollectionMethod, string> = {
  Cash: "#16a34a",
  "Bank Transfer": "#2563eb",
  Telebirr: "#9333ea",
  "CBE Birr": "#ea580c",
};

const DOMAIN_COLORS: Record<RevenueDomain, string> = {
  TAX: "#2563eb",
  RENT: "#16a34a",
  INVESTMENT: "#9333ea",
  SERVICE: "#ea580c",
  SALE: "#0891b2",
  CAPITAL: "#64748b",
};

const DEFAULT_FILTERS: ReportFilters = {
  search: "",
  method: "all",
  status: "all",
  domain: "all",
  categoryId: "all",
  administrativeUnitId: "all",
  startDate: "2026-05-01",
  endDate: "2026-10-10",
};

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }

  return `${value}`;
}

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function getMonthLabel(monthKey: string, locale: string) {
  const [year, month] = monthKey.split("-").map(Number);

  return new Intl.DateTimeFormat(locale, {
    month: "short",
  }).format(new Date(year, month - 1, 1));
}

function getCategory(categoryId: string) {
  return REVENUE_CATEGORIES.find((category) => category.id === categoryId);
}

function getService(serviceId: string) {
  return REVENUE_SERVICES.find((service) => service.id === serviceId);
}

function getAdministrativeUnit(unitId: string) {
  return ADMINISTRATIVE_UNITS.find((unit) => unit.id === unitId);
}

function getStatusClass(status: PaymentStatus) {
  switch (status) {
    case "Completed":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400";
    case "Pending":
      return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400";
    case "Failed":
      return "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getCollectionModeLabel(mode: CollectionMode) {
  switch (mode) {
    case "ASSESSMENT_ONLY":
      return "Assessment only";
    case "FIELD_COLLECTION":
      return "Field collection";
    case "BOTH":
      return "Assessment + field";
    default:
      return mode;
  }
}

function escapeCsv(value: string | number) {
  const stringValue = String(value);

  return `"${stringValue.replace(/"/g, '""')}"`;
}

export default function RevenueCollectionPage() {
  const t = useTranslations("revenueCollectionReport");
  const locale = useLocale();

  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(true);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return MOCK_COLLECTIONS.filter((record) => {
      const category = getCategory(record.categoryId);
      const service = getService(record.serviceId);
      const unit = getAdministrativeUnit(record.administrativeUnitId);

      const matchesSearch =
        !normalizedSearch ||
        record.receiptNumber.toLowerCase().includes(normalizedSearch) ||
        record.taxpayer.toLowerCase().includes(normalizedSearch) ||
        category?.name.toLowerCase().includes(normalizedSearch) ||
        service?.name.toLowerCase().includes(normalizedSearch) ||
        unit?.name.toLowerCase().includes(normalizedSearch);

      const matchesMethod =
        filters.method === "all" || record.method === filters.method;

      const matchesStatus =
        filters.status === "all" || record.status === filters.status;

      const matchesDomain =
        filters.domain === "all" || record.revenueDomain === filters.domain;

      const matchesCategory =
        filters.categoryId === "all" ||
        record.categoryId === filters.categoryId;

      const matchesAdministrativeUnit =
        filters.administrativeUnitId === "all" ||
        record.administrativeUnitId === filters.administrativeUnitId;

      const matchesStartDate =
        !filters.startDate || record.date >= filters.startDate;

      const matchesEndDate =
        !filters.endDate || record.date <= filters.endDate;

      return (
        matchesSearch &&
        matchesMethod &&
        matchesStatus &&
        matchesDomain &&
        matchesCategory &&
        matchesAdministrativeUnit &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [filters]);

  const completedRecords = useMemo(
    () => filteredRecords.filter((record) => record.status === "Completed"),
    [filteredRecords],
  );

  const pendingRecords = useMemo(
    () => filteredRecords.filter((record) => record.status === "Pending"),
    [filteredRecords],
  );

  const failedRecords = useMemo(
    () => filteredRecords.filter((record) => record.status === "Failed"),
    [filteredRecords],
  );

  const totalCollected = useMemo(
    () => completedRecords.reduce((total, record) => total + record.amount, 0),
    [completedRecords],
  );

  const pendingAmount = useMemo(
    () => pendingRecords.reduce((total, record) => total + record.amount, 0),
    [pendingRecords],
  );

  const failedAmount = useMemo(
    () => failedRecords.reduce((total, record) => total + record.amount, 0),
    [failedRecords],
  );

  const averageCollection =
    completedRecords.length > 0
      ? totalCollected / completedRecords.length
      : 0;

  const completionRate =
    filteredRecords.length > 0
      ? (completedRecords.length / filteredRecords.length) * 100
      : 0;

  const activeFilterCount = [
    filters.search,
    filters.method !== "all",
    filters.status !== "all",
    filters.domain !== "all",
    filters.categoryId !== "all",
    filters.administrativeUnitId !== "all",
    filters.startDate !== DEFAULT_FILTERS.startDate,
    filters.endDate !== DEFAULT_FILTERS.endDate,
  ].filter(Boolean).length;

  const monthlyCollectionData = useMemo(() => {
    const monthlyMap = new Map<
      string,
      { month: string; collected: number; target: number }
    >();

    for (const record of filteredRecords) {
      const monthKey = getMonthKey(record.date);

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: getMonthLabel(monthKey, locale),
          collected: 0,
          target: MONTHLY_TARGETS[monthKey] ?? 0,
        });
      }

      if (record.status === "Completed") {
        const item = monthlyMap.get(monthKey)!;
        item.collected += record.amount;
      }
    }

    return [...monthlyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);
  }, [filteredRecords, locale]);

  const collectionByMethod = useMemo(() => {
    const methods: CollectionMethod[] = [
      "Cash",
      "Bank Transfer",
      "Telebirr",
      "CBE Birr",
    ];

    return methods.map((method) => {
      const records = completedRecords.filter(
        (record) => record.method === method,
      );

      return {
        name: method,
        value: records.reduce((total, record) => total + record.amount, 0),
        count: records.length,
        color: METHOD_COLORS[method],
      };
    });
  }, [completedRecords]);

  const collectionByDomain = useMemo(() => {
    const domains: RevenueDomain[] = [
      "TAX",
      "RENT",
      "INVESTMENT",
      "SERVICE",
      "SALE",
      "CAPITAL",
    ];

    return domains
      .map((domain) => {
        const records = completedRecords.filter(
          (record) => record.revenueDomain === domain,
        );

        return {
          domain,
          name: DOMAIN_LABELS[domain],
          value: records.reduce((total, record) => total + record.amount, 0),
          count: records.length,
          color: DOMAIN_COLORS[domain],
        };
      })
      .filter((item) => item.value > 0);
  }, [completedRecords]);

  const categorySummary = useMemo(() => {
    const summaryMap = new Map<
      string,
      {
        categoryId: string;
        domain: RevenueDomain;
        totalTransactions: number;
        completedCount: number;
        pendingCount: number;
        failedCount: number;
        collected: number;
        pending: number;
        failed: number;
        services: Set<string>;
      }
    >();

    for (const record of filteredRecords) {
      const category = getCategory(record.categoryId);
      if (!category) continue;

      if (!summaryMap.has(category.id)) {
        summaryMap.set(category.id, {
          categoryId: category.id,
          domain: category.domain,
          totalTransactions: 0,
          completedCount: 0,
          pendingCount: 0,
          failedCount: 0,
          collected: 0,
          pending: 0,
          failed: 0,
          services: new Set<string>(),
        });
      }

      const item = summaryMap.get(category.id)!;
      const service = getService(record.serviceId);

      item.totalTransactions += 1;

      if (service) {
        item.services.add(service.name);
      }

      if (record.status === "Completed") {
        item.completedCount += 1;
        item.collected += record.amount;
      } else if (record.status === "Pending") {
        item.pendingCount += 1;
        item.pending += record.amount;
      } else {
        item.failedCount += 1;
        item.failed += record.amount;
      }
    }

    return [...summaryMap.values()].sort(
      (a, b) => b.collected - a.collected,
    );
  }, [filteredRecords]);

  const administrativeUnitSummary = useMemo(() => {
    const summaryMap = new Map<
      string,
      {
        unitId: string;
        level: AdministrativeLevel;
        collected: number;
        pending: number;
        failed: number;
        transactions: number;
      }
    >();

    for (const record of filteredRecords) {
      const unit = getAdministrativeUnit(record.administrativeUnitId);
      if (!unit) continue;

      if (!summaryMap.has(unit.id)) {
        summaryMap.set(unit.id, {
          unitId: unit.id,
          level: unit.level,
          collected: 0,
          pending: 0,
          failed: 0,
          transactions: 0,
        });
      }

      const item = summaryMap.get(unit.id)!;
      item.transactions += 1;

      if (record.status === "Completed") {
        item.collected += record.amount;
      } else if (record.status === "Pending") {
        item.pending += record.amount;
      } else {
        item.failed += record.amount;
      }
    }

    return [...summaryMap.values()].sort(
      (a, b) => b.collected - a.collected,
    );
  }, [filteredRecords]);

  const paymentReportHref = (categoryId?: string) => {
    const params = new URLSearchParams();

    if (filters.startDate) params.set("start_date", filters.startDate);
    if (filters.endDate) params.set("end_date", filters.endDate);

    if (filters.method !== "all") {
      params.set("payment_method", filters.method);
    }

    if (filters.status !== "all") {
      params.set("status", filters.status);
    }

    if (filters.domain !== "all") {
      params.set("revenue_domain", filters.domain);
    }

    const selectedCategory = categoryId ?? filters.categoryId;

    if (selectedCategory !== "all") {
      params.set("revenue_category_id", selectedCategory);
    }

    if (filters.administrativeUnitId !== "all") {
      params.set("administrative_unit_id", filters.administrativeUnitId);
    }

    const query = params.toString();

    return `/${locale}/office/dashboard/payment-reports${query ? `?${query}` : ""}`;
  };

  const updateFilter = <K extends keyof ReportFilters>(
    key: K,
    value: ReportFilters[K],
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleExportCsv = () => {
    const headers = [
      "Receipt Number",
      "Taxpayer",
      "Revenue Domain",
      "Revenue Category",
      "Revenue Service",
      "Collection Mode",
      "Administrative Unit",
      "Administrative Level",
      "Payment Method",
      "Amount ETB",
      "Date",
      "Status",
    ];

    const rows = filteredRecords.map((record) => {
      const category = getCategory(record.categoryId);
      const service = getService(record.serviceId);
      const unit = getAdministrativeUnit(record.administrativeUnitId);

      return [
        record.receiptNumber,
        record.taxpayer,
        record.revenueDomain,
        category?.name ?? "",
        service?.name ?? "",
        service ? getCollectionModeLabel(service.collectionMode) : "",
        unit?.name ?? "",
        unit?.level ?? "",
        record.method,
        record.amount,
        record.date,
        record.status,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `revenue-collection-report-${filters.startDate}-to-${filters.endDate}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDateChange =
    (key: "startDate" | "endDate") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      updateFilter(key, event.target.value);
    };

  const noCollectionData = filteredRecords.length === 0;

  return (
    <main className="min-h-screen space-y-6 bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      {/* Page heading */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileBarChart className="size-5" />
            </div>

            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
              Demonstration Data
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>

          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            {t("description")}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-3.5" />
              Adama City Administration
            </span>

            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {filters.startDate} — {filters.endDate}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Activity className="size-3.5" />
              {filteredRecords.length} matching records
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <Download className="mr-2 size-4" />
            {t("print_report")}
          </Button>

          <Button onClick={handleExportCsv}>
            <Download className="mr-2 size-4" />
            {t("export_csv")}
          </Button>
        </div>
      </div>

      {/* Demonstration disclaimer */}
      <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="mt-0.5 text-amber-600 dark:text-amber-400">
          <Activity className="size-5" />
        </div>

        <div>
          <p className="text-sm font-semibold">
            Sample collection performance
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            This page currently uses simulated collection records based on your
            revenue domains, categories, services, collection modes, and
            administrative-unit hierarchy. These amounts are not actual
            municipal financial records.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-start justify-between gap-4 p-5">
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t("total_collected")}
              </p>

              <p className="break-words text-2xl font-bold tracking-tight">
                {formatCurrency(totalCollected, locale)}
              </p>

              <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="size-3.5" />
                Completed payments only
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CircleDollarSign className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between gap-4 p-5">
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t("completed_transactions")}
              </p>

              <p className="text-2xl font-bold tracking-tight">
                {completedRecords.length.toLocaleString(locale)}
              </p>

              <p className="text-xs text-muted-foreground">
                {completionRate.toFixed(1)}% of matching records completed
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between gap-4 p-5">
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t("average_collection")}
              </p>

              <p className="break-words text-2xl font-bold tracking-tight">
                {formatCurrency(averageCollection, locale)}
              </p>

              <p className="text-xs text-muted-foreground">
                Average per completed record
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Wallet className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start justify-between gap-4 p-5">
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {t("pending_collection")}
              </p>

              <p className="break-words text-2xl font-bold tracking-tight">
                {formatCurrency(pendingAmount, locale)}
              </p>

              <p className="text-xs text-muted-foreground">
                {pendingRecords.length} awaiting confirmation
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ArrowDownRight className="size-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="size-4" />
              {t("filters")}
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {activeFilterCount} active
                </span>
              )}
            </CardTitle>

            <CardDescription>
              Filter collection performance by period, revenue source, payment
              method, status, and administrative unit.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
              >
                <X className="mr-1.5 size-4" />
                {t("clear_filters")}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle report filters"
              onClick={() => setShowFilters((current) => !current)}
            >
              <ChevronDown
                className={`size-4 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="grid gap-4 border-t pt-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="collection-search">
                {t("search")}
              </label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="collection-search"
                  className="pl-9"
                  placeholder={t("search_placeholder")}
                  value={filters.search}
                  onChange={(event) =>
                    updateFilter("search", event.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="start-date">
                {t("start_date")}
              </label>

              <Input
                id="start-date"
                type="date"
                value={filters.startDate}
                max={filters.endDate || undefined}
                onChange={handleDateChange("startDate")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="end-date">
                {t("end_date")}
              </label>

              <Input
                id="end-date"
                type="date"
                value={filters.endDate}
                min={filters.startDate || undefined}
                onChange={handleDateChange("endDate")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="revenue-domain">
                Revenue Domain
              </label>

              <select
                id="revenue-domain"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={filters.domain}
                onChange={(event) => {
                  updateFilter("domain", event.target.value);
                  updateFilter("categoryId", "all");
                }}
              >
                <option value="all">All Revenue Domains</option>
                <option value="TAX">Tax</option>
                <option value="RENT">Rent</option>
                <option value="INVESTMENT">Investment</option>
                <option value="SERVICE">Service</option>
                <option value="SALE">Sale</option>
                <option value="CAPITAL">Capital</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                htmlFor="revenue-category"
              >
                {t("revenue_category")}
              </label>

              <select
                id="revenue-category"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={filters.categoryId}
                onChange={(event) =>
                  updateFilter("categoryId", event.target.value)
                }
              >
                <option value="all">{t("all_categories")}</option>

                {REVENUE_CATEGORIES.filter(
                  (category) =>
                    filters.domain === "all" ||
                    category.domain === filters.domain,
                ).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                htmlFor="administrative-unit"
              >
                Administrative Unit
              </label>

              <select
                id="administrative-unit"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={filters.administrativeUnitId}
                onChange={(event) =>
                  updateFilter("administrativeUnitId", event.target.value)
                }
              >
                <option value="all">All Administrative Units</option>

                {ADMINISTRATIVE_UNITS.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.level})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="payment-method">
                {t("payment_method")}
              </label>

              <select
                id="payment-method"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={filters.method}
                onChange={(event) =>
                  updateFilter("method", event.target.value)
                }
              >
                <option value="all">{t("all_methods")}</option>
                <option value="Cash">{t("cash")}</option>
                <option value="Bank Transfer">{t("bank_transfer")}</option>
                <option value="Telebirr">Telebirr</option>
                <option value="CBE Birr">CBE Birr</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="payment-status">
                {t("status")}
              </label>

              <select
                id="payment-status"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={filters.status}
                onChange={(event) =>
                  updateFilter("status", event.target.value)
                }
              >
                <option value="all">{t("all_statuses")}</option>
                <option value="Completed">{t("completed")}</option>
                <option value="Pending">{t("pending")}</option>
                <option value="Failed">{t("failed")}</option>
              </select>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Collection trend and payment method distribution */}
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t("collection_trend")}</CardTitle>
            <CardDescription>
              Completed collections compared with the monthly collection target.
              The chart responds to your current report filters.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {monthlyCollectionData.length === 0 ? (
              <div className="flex h-[300px] flex-col items-center justify-center text-center">
                <FileBarChart className="mb-3 size-10 text-muted-foreground/50" />
                <p className="font-medium">{t("no_chart_data")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("adjust_filters_for_chart")}
                </p>
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyCollectionData}
                    margin={{ top: 10, right: 8, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-border"
                    />

                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      tickFormatter={formatCompactCurrency}
                      tickLine={false}
                      axisLine={false}
                      width={55}
                      tick={{ fontSize: 12 }}
                    />

                    <Tooltip
                      formatter={(value, name) => [
                        formatCurrency(Number(value ?? 0), locale),
                        String(name),
                      ]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--background)",
                      }}
                    />

                    <Legend />

                    <Bar
                      dataKey="collected"
                      name={t("collected")}
                      fill="#16a34a"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={42}
                    />

                    <Bar
                      dataKey="target"
                      name={t("target")}
                      fill="#94a3b8"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={42}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("collection_by_method")}</CardTitle>
            <CardDescription>
              Completed revenue by payment channel.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {collectionByMethod.every((item) => item.value === 0) ? (
              <div className="flex h-[260px] items-center justify-center text-center text-sm text-muted-foreground">
                {t("no_chart_data")}
              </div>
            ) : (
              <>
                <div className="h-[235px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={collectionByMethod.filter(
                          (item) => item.value > 0,
                        )}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={88}
                        paddingAngle={3}
                      >
                        {collectionByMethod
                          .filter((item) => item.value > 0)
                          .map((item) => (
                            <Cell key={item.name} fill={item.color} />
                          ))}
                      </Pie>

                      <Tooltip
                        formatter={(value) =>
                          formatCurrency(Number(value ?? 0), locale)
                        }
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid var(--border)",
                          background: "var(--background)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 space-y-3">
                  {collectionByMethod
                    .filter((item) => item.value > 0)
                    .map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />

                          <span className="truncate">{item.name}</span>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(item.value, locale)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.count} completed
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Revenue domain and administrative unit */}
      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Collection by Revenue Domain</CardTitle>
            <CardDescription>
              Compare performance across the revenue domains configured in your
              system.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {collectionByDomain.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                {t("no_chart_data")}
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={collectionByDomain}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      className="stroke-border"
                    />

                    <XAxis
                      type="number"
                      tickFormatter={formatCompactCurrency}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      width={95}
                      tick={{ fontSize: 12 }}
                    />

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(Number(value ?? 0), locale)
                      }
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--background)",
                      }}
                    />

                    <Bar
                      dataKey="value"
                      name={t("collected")}
                      radius={[0, 5, 5, 0]}
                      maxBarSize={30}
                    >
                      {collectionByDomain.map((item) => (
                        <Cell key={item.domain} fill={item.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Administrative Unit Performance</CardTitle>
            <CardDescription>
              Aggregated collections by city, subcity, or wereda unit.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {administrativeUnitSummary.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                No administrative-unit data for these filters.
              </div>
            ) : (
              <div className="space-y-4">
                {administrativeUnitSummary.slice(0, 5).map((item) => {
                  const unit = getAdministrativeUnit(item.unitId);

                  const maximum = Math.max(
                    ...administrativeUnitSummary.map(
                      (summary) => summary.collected,
                    ),
                    1,
                  );

                  const percentage = (item.collected / maximum) * 100;

                  return (
                    <div key={item.unitId} className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {unit?.name ?? item.unitId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.level} · {item.transactions} records
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-semibold">
                          {formatCurrency(item.collected, locale)}
                        </p>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Pending: {formatCurrency(item.pending, locale)}
                        </span>
                        <span>
                          Failed: {formatCurrency(item.failed, locale)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Collection channel summary */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Banknote className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Cash Collections</p>
              <p className="mt-1 break-words text-lg font-bold">
                {formatCurrency(
                  collectionByMethod.find((item) => item.name === "Cash")
                    ?.value ?? 0,
                  locale,
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Landmark className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Bank Transfer Collections
              </p>
              <p className="mt-1 break-words text-lg font-bold">
                {formatCurrency(
                  collectionByMethod.find(
                    (item) => item.name === "Bank Transfer",
                  )?.value ?? 0,
                  locale,
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Smartphone className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Digital Collections
              </p>
              <p className="mt-1 break-words text-lg font-bold">
                {formatCurrency(
                  (collectionByMethod.find((item) => item.name === "Telebirr")
                    ?.value ?? 0) +
                    (collectionByMethod.find((item) => item.name === "CBE Birr")
                      ?.value ?? 0),
                  locale,
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
              <CreditCard className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Failed Collection</p>
              <p className="mt-1 break-words text-lg font-bold">
                {formatCurrency(failedAmount, locale)}
              </p>
              <p className="text-xs text-muted-foreground">
                {failedRecords.length} failed records
              </p>
            </div>
          </CardContent>
        </Card>
      </section>


      <p className="pb-2 text-center text-xs text-muted-foreground">
        Demonstration report only. Connect the report to verified backend
        payment and invoice data before using it for financial decisions.
      </p>
    </main>
  );
}
