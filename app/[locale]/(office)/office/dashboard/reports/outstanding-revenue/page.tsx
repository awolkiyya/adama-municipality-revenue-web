"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
AlertCircle,
ArrowDownToLine,
ArrowLeft,
ArrowRight,
CalendarDays,
CheckCircle2,
ChevronLeft,
ChevronRight,
Clock3,
Eye,
FileText,
Filter,
HandCoins,
Receipt,
RefreshCw,
Search,
TrendingDown,
Wallet,
X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
Card,
CardContent,
CardDescription,
CardHeader,
CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import {
Dialog,
DialogContent,
DialogDescription,
DialogHeader,
DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

type RevenueDomain =
| "TAX"
| "RENT"
| "INVESTMENT"
| "SERVICE"
| "SALE"
| "CAPITAL";

type InvoiceStatus =
| "ISSUED"
| "PARTIALLY_PAID"
| "OVERDUE";

type AgingBucket =
| "CURRENT"
| "1_30_DAYS"
| "31_60_DAYS"
| "61_90_DAYS"
| "OVER_90_DAYS";

type OutstandingInvoice = {
id: string;
invoiceNumber: string;
taxpayerName: string;
taxpayerCode: string;
revenueDomain: RevenueDomain;
revenueCategory: string;
revenueService: string;
administrativeUnit: string;
invoiceDate: string;
dueDate: string;
invoiceAmount: number;
amountPaid: number;
outstandingAmount: number;
status: InvoiceStatus;
assignedOfficer: string;
lastPaymentDate?: string;
notes?: string;
};

const mockOutstandingInvoices: OutstandingInvoice[] = [
{
id: "inv-001",
invoiceNumber: "INV-2026-01001",
taxpayerName: "Abebe Bekele",
taxpayerCode: "TP-10021",
revenueDomain: "TAX",
revenueCategory: "Property Tax",
revenueService: "Annual Property Tax",
administrativeUnit: "Bole Subcity",
invoiceDate: "2026-09-01",
dueDate: "2026-09-30",
invoiceAmount: 24500,
amountPaid: 10000,
outstandingAmount: 14500,
status: "OVERDUE",
assignedOfficer: "Mekdes Tadesse",
lastPaymentDate: "2026-09-15",
notes: "Partial payment received. Remaining balance requires follow-up.",
},
{
id: "inv-002",
invoiceNumber: "INV-2026-01002",
taxpayerName: "Hana Mohammed",
taxpayerCode: "TP-10022",
revenueDomain: "RENT",
revenueCategory: "Land Lease",
revenueService: "Lease Payment",
administrativeUnit: "Wereda 01",
invoiceDate: "2026-10-01",
dueDate: "2026-10-20",
invoiceAmount: 75000,
amountPaid: 0,
outstandingAmount: 75000,
status: "ISSUED",
assignedOfficer: "Dawit Kebede",
notes: "Invoice issued. Payment has not been recorded.",
},
{
id: "inv-003",
invoiceNumber: "INV-2026-01003",
taxpayerName: "Adama General Trading",
taxpayerCode: "TP-10023",
revenueDomain: "TAX",
revenueCategory: "Business Tax",
revenueService: "Business Tax Assessment",
administrativeUnit: "Geda Subcity",
invoiceDate: "2026-08-01",
dueDate: "2026-08-31",
invoiceAmount: 120000,
amountPaid: 40000,
outstandingAmount: 80000,
status: "OVERDUE",
assignedOfficer: "Kebede Girma",
lastPaymentDate: "2026-08-20",
notes: "Outstanding balance remains after partial payment.",
},
{
id: "inv-004",
invoiceNumber: "INV-2026-01004",
taxpayerName: "Selamawit Tesfaye",
taxpayerCode: "TP-10024",
revenueDomain: "SERVICE",
revenueCategory: "Municipal Services",
revenueService: "Construction Permit",
administrativeUnit: "Wereda 02",
invoiceDate: "2026-10-03",
dueDate: "2026-10-25",
invoiceAmount: 18500,
amountPaid: 0,
outstandingAmount: 18500,
status: "ISSUED",
assignedOfficer: "Meron Fikru",
},
{
id: "inv-005",
invoiceNumber: "INV-2026-01005",
taxpayerName: "Oromia Manufacturing PLC",
taxpayerCode: "TP-10025",
revenueDomain: "TAX",
revenueCategory: "Business Tax",
revenueService: "Annual Business Tax",
administrativeUnit: "Bole Subcity",
invoiceDate: "2026-06-15",
dueDate: "2026-07-15",
invoiceAmount: 250000,
amountPaid: 50000,
outstandingAmount: 200000,
status: "OVERDUE",
assignedOfficer: "Dawit Kebede",
lastPaymentDate: "2026-07-01",
notes: "Requires priority collection follow-up.",
},
{
id: "inv-006",
invoiceNumber: "INV-2026-01006",
taxpayerName: "Abdi Ahmed",
taxpayerCode: "TP-10026",
revenueDomain: "RENT",
revenueCategory: "Municipal Property Rent",
revenueService: "Monthly Property Rent",
administrativeUnit: "Wereda 03",
invoiceDate: "2026-10-05",
dueDate: "2026-10-15",
invoiceAmount: 12500,
amountPaid: 5000,
outstandingAmount: 7500,
status: "PARTIALLY_PAID",
assignedOfficer: "Mekdes Tadesse",
lastPaymentDate: "2026-10-07",
},
{
id: "inv-007",
invoiceNumber: "INV-2026-01007",
taxpayerName: "Biftu Construction",
taxpayerCode: "TP-10027",
revenueDomain: "SERVICE",
revenueCategory: "Municipal Services",
revenueService: "Building Permit",
administrativeUnit: "Geda Subcity",
invoiceDate: "2026-07-01",
dueDate: "2026-07-31",
invoiceAmount: 68000,
amountPaid: 0,
outstandingAmount: 68000,
status: "OVERDUE",
assignedOfficer: "Meron Fikru",
},
{
id: "inv-008",
invoiceNumber: "INV-2026-01008",
taxpayerName: "Kedir Hassan",
taxpayerCode: "TP-10028",
revenueDomain: "TAX",
revenueCategory: "Property Tax",
revenueService: "Annual Property Tax",
administrativeUnit: "Wereda 01",
invoiceDate: "2026-10-06",
dueDate: "2026-10-30",
invoiceAmount: 32000,
amountPaid: 0,
outstandingAmount: 32000,
status: "ISSUED",
assignedOfficer: "Kebede Girma",
},
{
id: "inv-009",
invoiceNumber: "INV-2026-01009",
taxpayerName: "Adama Agro Processing",
taxpayerCode: "TP-10029",
revenueDomain: "INVESTMENT",
revenueCategory: "Investment Revenue",
revenueService: "Investment Service Fee",
administrativeUnit: "Bole Subcity",
invoiceDate: "2026-05-10",
dueDate: "2026-06-10",
invoiceAmount: 180000,
amountPaid: 30000,
outstandingAmount: 150000,
status: "OVERDUE",
assignedOfficer: "Dawit Kebede",
lastPaymentDate: "2026-05-28",
notes: "Long-outstanding balance. Review collection action.",
},
{
id: "inv-010",
invoiceNumber: "INV-2026-01010",
taxpayerName: "Fatuma Ali",
taxpayerCode: "TP-10030",
revenueDomain: "SALE",
revenueCategory: "Municipal Sales",
revenueService: "Municipal Asset Sale",
administrativeUnit: "Wereda 02",
invoiceDate: "2026-09-20",
dueDate: "2026-10-10",
invoiceAmount: 45000,
amountPaid: 15000,
outstandingAmount: 30000,
status: "OVERDUE",
assignedOfficer: "Meron Fikru",
lastPaymentDate: "2026-09-28",
},
{
id: "inv-011",
invoiceNumber: "INV-2026-01011",
taxpayerName: "Tadesse Furniture",
taxpayerCode: "TP-10031",
revenueDomain: "TAX",
revenueCategory: "Business Tax",
revenueService: "Business Tax Assessment",
administrativeUnit: "Geda Subcity",
invoiceDate: "2026-09-25",
dueDate: "2026-10-18",
invoiceAmount: 38500,
amountPaid: 10000,
outstandingAmount: 28500,
status: "PARTIALLY_PAID",
assignedOfficer: "Kebede Girma",
lastPaymentDate: "2026-10-02",
},
{
id: "inv-012",
invoiceNumber: "INV-2026-01012",
taxpayerName: "Netsanet Bekele",
taxpayerCode: "TP-10032",
revenueDomain: "CAPITAL",
revenueCategory: "Capital Revenue",
revenueService: "Capital Fee",
administrativeUnit: "Wereda 03",
invoiceDate: "2026-09-10",
dueDate: "2026-09-25",
invoiceAmount: 22000,
amountPaid: 0,
outstandingAmount: 22000,
status: "OVERDUE",
assignedOfficer: "Mekdes Tadesse",
},
{
id: "inv-013",
invoiceNumber: "INV-2026-01013",
taxpayerName: "Abdi Construction PLC",
taxpayerCode: "TP-10033",
revenueDomain: "SERVICE",
revenueCategory: "Municipal Services",
revenueService: "Construction Permit",
administrativeUnit: "Bole Subcity",
invoiceDate: "2026-10-02",
dueDate: "2026-10-28",
invoiceAmount: 95000,
amountPaid: 25000,
outstandingAmount: 70000,
status: "PARTIALLY_PAID",
assignedOfficer: "Dawit Kebede",
lastPaymentDate: "2026-10-08",
},
{
id: "inv-014",
invoiceNumber: "INV-2026-01014",
taxpayerName: "Mulugeta Trading",
taxpayerCode: "TP-10034",
revenueDomain: "TAX",
revenueCategory: "Business Tax",
revenueService: "Annual Business Tax",
administrativeUnit: "Wereda 01",
invoiceDate: "2026-06-01",
dueDate: "2026-06-30",
invoiceAmount: 145000,
amountPaid: 45000,
outstandingAmount: 100000,
status: "OVERDUE",
assignedOfficer: "Kebede Girma",
lastPaymentDate: "2026-06-18",
},
{
id: "inv-015",
invoiceNumber: "INV-2026-01015",
taxpayerName: "Hirut Gemechu",
taxpayerCode: "TP-10035",
revenueDomain: "RENT",
revenueCategory: "Land Lease",
revenueService: "Lease Payment",
administrativeUnit: "Geda Subcity",
invoiceDate: "2026-10-08",
dueDate: "2026-10-22",
invoiceAmount: 56000,
amountPaid: 0,
outstandingAmount: 56000,
status: "ISSUED",
assignedOfficer: "Mekdes Tadesse",
},
{
id: "inv-016",
invoiceNumber: "INV-2026-01016",
taxpayerName: "Abebe and Sons",
taxpayerCode: "TP-10036",
revenueDomain: "TAX",
revenueCategory: "Property Tax",
revenueService: "Annual Property Tax",
administrativeUnit: "Wereda 02",
invoiceDate: "2026-08-10",
dueDate: "2026-09-10",
invoiceAmount: 28500,
amountPaid: 8500,
outstandingAmount: 20000,
status: "OVERDUE",
assignedOfficer: "Meron Fikru",
lastPaymentDate: "2026-08-29",
},
];

const PAGE_SIZE = 8;

function formatETB(amount: number) {
return new Intl.NumberFormat("en-ET", {
style: "currency",
currency: "ETB",
maximumFractionDigits: 2,
}).format(amount);
}

function formatDate(date: string) {
if (!date) return "—";

return new Intl.DateTimeFormat("en-GB", {
day: "2-digit",
month: "short",
year: "numeric",
}).format(new Date(`${date}T00:00:00`));
}

function getDaysOverdue(dueDate: string) {
const today = new Date();
today.setHours(0, 0, 0, 0);

const due = new Date(`${dueDate}T00:00:00`);
due.setHours(0, 0, 0, 0);

return Math.max(
0,
Math.floor((today.getTime() - due.getTime()) / 86400000),
);
}

function getAgingBucket(dueDate: string): AgingBucket {
const days = getDaysOverdue(dueDate);

if (days === 0) return "CURRENT";
if (days <= 30) return "1_30_DAYS";
if (days <= 60) return "31_60_DAYS";
if (days <= 90) return "61_90_DAYS";
return "OVER_90_DAYS";
}

function getAgingLabel(bucket: AgingBucket) {
const labels: Record<AgingBucket, string> = {
CURRENT: "Current",
"1_30_DAYS": "1–30 days",
"31_60_DAYS": "31–60 days",
"61_90_DAYS": "61–90 days",
OVER_90_DAYS: "Over 90 days",
};

return labels[bucket];
}

function getStatusBadge(status: InvoiceStatus) {
switch (status) {
case "ISSUED":
return ( <Badge variant="outline" className="font-medium">
Issued </Badge>
);
case "PARTIALLY_PAID":
return ( <Badge className="border-0 bg-blue-100 text-blue-800 hover:bg-blue-100">
Partially paid </Badge>
);
case "OVERDUE":
return ( <Badge variant="destructive">
Overdue </Badge>
);
default:
return <Badge variant="outline">{status}</Badge>;
}
}

function downloadCSV(rows: OutstandingInvoice[]) {
const headers = [
"Invoice Number",
"Taxpayer",
"Taxpayer Code",
"Revenue Domain",
"Revenue Category",
"Revenue Service",
"Administrative Unit",
"Invoice Date",
"Due Date",
"Invoice Amount",
"Amount Paid",
"Outstanding Amount",
"Status",
"Days Overdue",
"Assigned Officer",
];

const escapeCSV = (value: string | number) =>
`"${String(value).replace(/"/g, '""')}"`;

const csvRows = rows.map((invoice) => [
invoice.invoiceNumber,
invoice.taxpayerName,
invoice.taxpayerCode,
invoice.revenueDomain,
invoice.revenueCategory,
invoice.revenueService,
invoice.administrativeUnit,
invoice.invoiceDate,
invoice.dueDate,
invoice.invoiceAmount,
invoice.amountPaid,
invoice.outstandingAmount,
invoice.status,
getDaysOverdue(invoice.dueDate),
invoice.assignedOfficer,
]);

const csv = [
headers.map(escapeCSV).join(","),
...csvRows.map((row) => row.map(escapeCSV).join(",")),
].join("\n");

const blob = new Blob(["\uFEFF" + csv], {
type: "text/csv;charset=utf-8;",
});

const url = URL.createObjectURL(blob);
const link = document.createElement("a");

link.href = url;
link.download = `outstanding-revenue-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

document.body.appendChild(link);
link.click();
link.remove();
URL.revokeObjectURL(url);
}

export default function OutstandingRevenuePage() {
const locale = useLocale();

const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("ALL");
const [domainFilter, setDomainFilter] = useState("ALL");
const [agingFilter, setAgingFilter] = useState("ALL");
const [unitFilter, setUnitFilter] = useState("ALL");
const [dateFrom, setDateFrom] = useState("");
const [dateTo, setDateTo] = useState("");
const [page, setPage] = useState(1);
const [selectedInvoice, setSelectedInvoice] =
useState<OutstandingInvoice | null>(null);

const filteredInvoices = useMemo(() => {
const normalizedSearch = search.trim().toLowerCase();


return mockOutstandingInvoices.filter((invoice) => {
  const matchesSearch =
    !normalizedSearch ||
    invoice.invoiceNumber.toLowerCase().includes(normalizedSearch) ||
    invoice.taxpayerName.toLowerCase().includes(normalizedSearch) ||
    invoice.taxpayerCode.toLowerCase().includes(normalizedSearch) ||
    invoice.revenueCategory.toLowerCase().includes(normalizedSearch) ||
    invoice.revenueService.toLowerCase().includes(normalizedSearch) ||
    invoice.assignedOfficer.toLowerCase().includes(normalizedSearch);

  const matchesStatus =
    statusFilter === "ALL" || invoice.status === statusFilter;

  const matchesDomain =
    domainFilter === "ALL" || invoice.revenueDomain === domainFilter;

  const matchesAging =
    agingFilter === "ALL" ||
    getAgingBucket(invoice.dueDate) === agingFilter;

  const matchesUnit =
    unitFilter === "ALL" ||
    invoice.administrativeUnit === unitFilter;

  const matchesDateFrom =
    !dateFrom || invoice.invoiceDate >= dateFrom;

  const matchesDateTo =
    !dateTo || invoice.invoiceDate <= dateTo;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesDomain &&
    matchesAging &&
    matchesUnit &&
    matchesDateFrom &&
    matchesDateTo
  );
});


}, [
search,
statusFilter,
domainFilter,
agingFilter,
unitFilter,
dateFrom,
dateTo,
]);

const summary = useMemo(() => {
const totalOutstanding = filteredInvoices.reduce(
(sum, invoice) => sum + invoice.outstandingAmount,
0,
);


const totalInvoiced = filteredInvoices.reduce(
  (sum, invoice) => sum + invoice.invoiceAmount,
  0,
);

const totalPaid = filteredInvoices.reduce(
  (sum, invoice) => sum + invoice.amountPaid,
  0,
);

const overdueInvoices = filteredInvoices.filter(
  (invoice) => getDaysOverdue(invoice.dueDate) > 0,
);

const overdueAmount = overdueInvoices.reduce(
  (sum, invoice) => sum + invoice.outstandingAmount,
  0,
);

const overdueCount = overdueInvoices.length;

const unpaidInvoices = filteredInvoices.filter(
  (invoice) => invoice.amountPaid === 0,
);

const unpaidAmount = unpaidInvoices.reduce(
  (sum, invoice) => sum + invoice.outstandingAmount,
  0,
);

const agingAmounts: Record<AgingBucket, number> = {
  CURRENT: 0,
  "1_30_DAYS": 0,
  "31_60_DAYS": 0,
  "61_90_DAYS": 0,
  OVER_90_DAYS: 0,
};

filteredInvoices.forEach((invoice) => {
  agingAmounts[getAgingBucket(invoice.dueDate)] +=
    invoice.outstandingAmount;
});

return {
  totalOutstanding,
  totalInvoiced,
  totalPaid,
  overdueAmount,
  overdueCount,
  unpaidAmount,
  unpaidCount: unpaidInvoices.length,
  invoiceCount: filteredInvoices.length,
  agingAmounts,
};


}, [filteredInvoices]);

const totalPages = Math.max(
1,
Math.ceil(filteredInvoices.length / PAGE_SIZE),
);

const paginatedInvoices = filteredInvoices.slice(
(page - 1) * PAGE_SIZE,
page * PAGE_SIZE,
);

const hasActiveFilters =
search !== "" ||
statusFilter !== "ALL" ||
domainFilter !== "ALL" ||
agingFilter !== "ALL" ||
unitFilter !== "ALL" ||
dateFrom !== "" ||
dateTo !== "";

function resetFilters() {
setSearch("");
setStatusFilter("ALL");
setDomainFilter("ALL");
setAgingFilter("ALL");
setUnitFilter("ALL");
setDateFrom("");
setDateTo("");
setPage(1);
}

function updateSearch(value: string) {
setSearch(value);
setPage(1);
}

function clearDates() {
setDateFrom("");
setDateTo("");
setPage(1);
}

const agingRows: {
bucket: AgingBucket;
label: string;
amount: number;
}[] = [
{
bucket: "CURRENT",
label: "Not yet overdue",
amount: summary.agingAmounts.CURRENT,
},
{
bucket: "1_30_DAYS",
label: "1–30 days overdue",
amount: summary.agingAmounts["1_30_DAYS"],
},
{
bucket: "31_60_DAYS",
label: "31–60 days overdue",
amount: summary.agingAmounts["31_60_DAYS"],
},
{
bucket: "61_90_DAYS",
label: "61–90 days overdue",
amount: summary.agingAmounts["61_90_DAYS"],
},
{
bucket: "OVER_90_DAYS",
label: "Over 90 days overdue",
amount: summary.agingAmounts.OVER_90_DAYS,
},
];

return ( <div className="space-y-6 p-4 md:p-6 lg:p-8">
{/* Page header */} <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"> <div className="space-y-2"> <div className="flex items-center gap-2 text-sm text-muted-foreground">
<Link
href={`/${locale}/office/dashboard/reports`}
className="transition-colors hover:text-foreground"
>
Reports </Link> <ChevronRight className="h-4 w-4" /> <span className="font-medium text-foreground">
Outstanding Revenue </span> </div>


      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Outstanding Revenue
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground md:text-base">
          Monitor unpaid invoice balances, overdue revenue, and collection
          aging across municipal revenue services.
        </p>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        onClick={resetFilters}
        disabled={!hasActiveFilters}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Reset filters
      </Button>

      <Button onClick={() => downloadCSV(filteredInvoices)}>
        <ArrowDownToLine className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
    </div>
  </div>

  {/* Demo notice */}
  <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
    <div className="space-y-1">
      <p className="text-sm font-semibold">Demonstration data</p>
      <p className="text-sm">
        This report currently uses mock invoices. Outstanding balances
        should be sourced from issued invoices and their recorded payments
        when the Laravel API is connected.
      </p>
    </div>
  </div>

  {/* KPI cards */}
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Total outstanding
            </p>
            <p className="text-2xl font-bold tracking-tight">
              {formatETB(summary.totalOutstanding)}
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.invoiceCount} outstanding invoices
            </p>
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Overdue revenue
            </p>
            <p className="text-2xl font-bold tracking-tight text-destructive">
              {formatETB(summary.overdueAmount)}
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.overdueCount} invoices past due
            </p>
          </div>
          <div className="rounded-lg bg-destructive/10 p-2.5 text-destructive">
            <Clock3 className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Fully unpaid invoices
            </p>
            <p className="text-2xl font-bold tracking-tight">
              {summary.unpaidCount}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatETB(summary.unpaidAmount)} outstanding
            </p>
          </div>
          <div className="rounded-lg bg-orange-100 p-2.5 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
            <Receipt className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Payments recorded
            </p>
            <p className="text-2xl font-bold tracking-tight">
              {formatETB(summary.totalPaid)}
            </p>
            <p className="text-xs text-muted-foreground">
              Against {formatETB(summary.totalInvoiced)} invoiced
            </p>
          </div>
          <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <HandCoins className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>

  {/* Aging analysis */}
  <Card>
    <CardHeader>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Outstanding revenue aging
          </CardTitle>
          <CardDescription className="mt-1">
            Outstanding balances grouped by days past the invoice due date.
          </CardDescription>
        </div>
        <Badge variant="outline">
          {formatETB(summary.totalOutstanding)} total
        </Badge>
      </div>
    </CardHeader>

    <CardContent>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {agingRows.map((item) => {
          const isSelected = agingFilter === item.bucket;

          return (
            <button
              type="button"
              key={item.bucket}
              onClick={() => {
                setAgingFilter(isSelected ? "ALL" : item.bucket);
                setPage(1);
              }}
              className={`rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 ${
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
                {isSelected && (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
              </div>
              <p className="mt-3 text-lg font-bold">
                {formatETB(item.amount)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary.totalOutstanding > 0
                  ? `${(
                      (item.amount / summary.totalOutstanding) *
                      100
                    ).toFixed(1)}% of outstanding`
                  : "0.0% of outstanding"}
              </p>
            </button>
          );
        })}
      </div>
    </CardContent>
  </Card>

  {/* Filters */}
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <Filter className="h-5 w-5" />
        Filter outstanding invoices
      </CardTitle>
      <CardDescription>
        Search by invoice, taxpayer, revenue service, or assigned officer.
      </CardDescription>
    </CardHeader>

    <CardContent className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search invoice, taxpayer..."
            className="pl-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Invoice status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ISSUED">Issued</SelectItem>
            <SelectItem value="PARTIALLY_PAID">Partially paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={domainFilter}
          onValueChange={(value) => {
            setDomainFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Revenue domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All revenue domains</SelectItem>
            <SelectItem value="TAX">Tax</SelectItem>
            <SelectItem value="RENT">Rent</SelectItem>
            <SelectItem value="INVESTMENT">Investment</SelectItem>
            <SelectItem value="SERVICE">Service</SelectItem>
            <SelectItem value="SALE">Sale</SelectItem>
            <SelectItem value="CAPITAL">Capital</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={unitFilter}
          onValueChange={(value) => {
            setUnitFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Administrative unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All administrative units</SelectItem>
            <SelectItem value="Bole Subcity">Bole Subcity</SelectItem>
            <SelectItem value="Geda Subcity">Geda Subcity</SelectItem>
            <SelectItem value="Wereda 01">Wereda 01</SelectItem>
            <SelectItem value="Wereda 02">Wereda 02</SelectItem>
            <SelectItem value="Wereda 03">Wereda 03</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPage(1);
            }}
            className="pl-9"
            aria-label="Invoice date from"
          />
        </div>

        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(event) => {
              setDateTo(event.target.value);
              setPage(1);
            }}
            className="pl-9"
            aria-label="Invoice date to"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredInvoices.length}
          </span>{" "}
          matching invoices
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {agingFilter !== "ALL" && (
            <Badge variant="secondary" className="gap-1">
              Aging: {getAgingLabel(agingFilter as AgingBucket)}
              <button
                type="button"
                onClick={() => {
                  setAgingFilter("ALL");
                  setPage(1);
                }}
                aria-label="Remove aging filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDates}
            >
              Clear dates
              <X className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
            >
              Clear all filters
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Invoice table */}
  <Card>
    <CardHeader>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Outstanding invoices</CardTitle>
          <CardDescription className="mt-1">
            Invoice-level balances requiring payment or collection follow-up.
          </CardDescription>
        </div>
        <Badge variant="outline">
          {filteredInvoices.length} records
        </Badge>
      </div>
    </CardHeader>

    <CardContent>
      {paginatedInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-semibold">
            No outstanding invoices found
          </h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Try changing your search terms or clearing the filters.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={resetFilters}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1120px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Invoice / Taxpayer</th>
                  <th className="px-4 py-3 font-medium">Revenue service</th>
                  <th className="px-4 py-3 font-medium">Administrative unit</th>
                  <th className="px-4 py-3 font-medium">Due date</th>
                  <th className="px-4 py-3 text-right font-medium">Invoice amount</th>
                  <th className="px-4 py-3 text-right font-medium">Paid</th>
                  <th className="px-4 py-3 text-right font-medium">Outstanding</th>
                  <th className="px-4 py-3 font-medium">Aging / Status</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedInvoices.map((invoice) => {
                  const daysOverdue = getDaysOverdue(invoice.dueDate);
                  const aging = getAgingBucket(invoice.dueDate);

                  return (
                    <tr
                      key={invoice.id}
                      className="border-b last:border-0 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          {invoice.taxpayerName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {invoice.taxpayerCode}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-medium">
                          {invoice.revenueCategory}
                        </p>
                        <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
                          {invoice.revenueService}
                        </p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {invoice.revenueDomain}
                        </Badge>
                      </td>

                      <td className="px-4 py-4">
                        {invoice.administrativeUnit}
                      </td>

                      <td className="px-4 py-4">
                        <p>{formatDate(invoice.dueDate)}</p>
                        {daysOverdue > 0 ? (
                          <p className="mt-1 text-xs font-medium text-destructive">
                            {daysOverdue} days overdue
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Not overdue
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        {formatETB(invoice.invoiceAmount)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right text-emerald-700 dark:text-emerald-400">
                        {formatETB(invoice.amountPaid)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <span className="font-bold text-destructive">
                          {formatETB(invoice.outstandingAmount)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <p className="mb-2 text-xs text-muted-foreground">
                          {getAgingLabel(aging)}
                        </p>
                        {getStatusBadge(invoice.status)}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              {filteredInvoices.length === 0
                ? 0
                : (page - 1) * PAGE_SIZE + 1}{" "}
              to{" "}
              {Math.min(page * PAGE_SIZE, filteredInvoices.length)} of{" "}
              {filteredInvoices.length} invoices
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>

              <span className="min-w-20 text-center text-sm">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </CardContent>
  </Card>

  {/* Invoice detail dialog */}
  <Dialog
    open={selectedInvoice !== null}
    onOpenChange={(open) => {
      if (!open) setSelectedInvoice(null);
    }}
  >
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      {selectedInvoice && (
        <>
          <DialogHeader>
            <DialogTitle>Outstanding invoice details</DialogTitle>
            <DialogDescription>
              {selectedInvoice.invoiceNumber} ·{" "}
              {selectedInvoice.taxpayerName}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2">
            {getStatusBadge(selectedInvoice.status)}
            <Badge variant="outline">
              {selectedInvoice.revenueDomain}
            </Badge>
            <Badge variant="secondary">
              {getAgingLabel(getAgingBucket(selectedInvoice.dueDate))}
            </Badge>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">
                Invoice number
              </p>
              <p className="mt-1 font-semibold">
                {selectedInvoice.invoiceNumber}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Taxpayer code
              </p>
              <p className="mt-1 font-semibold">
                {selectedInvoice.taxpayerCode}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Taxpayer name
              </p>
              <p className="mt-1 font-semibold">
                {selectedInvoice.taxpayerName}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Administrative unit
              </p>
              <p className="mt-1 font-semibold">
                {selectedInvoice.administrativeUnit}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Revenue category
              </p>
              <p className="mt-1 font-semibold">
                {selectedInvoice.revenueCategory}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Revenue service
              </p>
              <p className="mt-1 font-semibold">
                {selectedInvoice.revenueService}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Invoice date
              </p>
              <p className="mt-1 font-semibold">
                {formatDate(selectedInvoice.invoiceDate)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Due date
              </p>
              <p className="mt-1 font-semibold">
                {formatDate(selectedInvoice.dueDate)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Assigned officer
              </p>
              <p className="mt-1 font-semibold">
                {selectedInvoice.assignedOfficer}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Last payment date
              </p>
              <p className="mt-1 font-semibold">
                {selectedInvoice.lastPaymentDate
                  ? formatDate(selectedInvoice.lastPaymentDate)
                  : "No payment recorded"}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                Original invoice amount
              </span>
              <span className="font-medium">
                {formatETB(selectedInvoice.invoiceAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                Total paid
              </span>
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                {formatETB(selectedInvoice.amountPaid)}
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">Outstanding balance</span>
              <span className="text-xl font-bold text-destructive">
                {formatETB(selectedInvoice.outstandingAmount)}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{
                  width: `${
                    selectedInvoice.invoiceAmount > 0
                      ? Math.min(
                          100,
                          (selectedInvoice.amountPaid /
                            selectedInvoice.invoiceAmount) *
                            100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {selectedInvoice.invoiceAmount > 0
                ? (
                    (selectedInvoice.amountPaid /
                      selectedInvoice.invoiceAmount) *
                    100
                  ).toFixed(1)
                : "0.0"}
              % of the invoice amount has been paid.
            </p>
          </div>

          {selectedInvoice.notes && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-semibold">Collection notes</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedInvoice.notes}
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setSelectedInvoice(null)}
            >
              Close
            </Button>
          </div>
        </>
      )}
    </DialogContent>
  </Dialog>

  {/* Footer */}
  <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-muted p-2">
        <AlertCircle className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">Collection follow-up</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Prioritize long-overdue balances and verify partial payments
          against recorded transactions before taking collection action.
        </p>
      </div>
    </div>

    <Button variant="outline" asChild>
      <Link href={`/${locale}/office/dashboard/payments`}>
        View payments
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  </div>
</div>

);
}
