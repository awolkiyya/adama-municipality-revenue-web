"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
ArrowDownToLine,
ArrowLeft,
ArrowRight,
CalendarDays,
CheckCircle2,
ChevronLeft,
ChevronRight,
CircleDollarSign,
Clock3,
Eye,
FileText,
Filter,
Receipt,
RefreshCcw,
Search,
ShieldAlert,
Wallet,
X,
XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
Card,
CardContent,
CardDescription,
CardHeader,
CardTitle,
} from "@/components/ui/card";
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

type InvoiceStatus =
| "DRAFT"
| "ISSUED"
| "PARTIALLY_PAID"
| "PAID"
| "OVERDUE"
| "CANCELLED"
| "VOID";

type InvoiceSource = "ASSESSMENT" | "DIRECT_COLLECTION";

type InvoiceRecord = {
id: string;
invoiceNumber: string;
taxpayerName: string;
taxpayerTin: string;
revenueDomain: "TAX" | "RENT" | "INVESTMENT" | "SERVICE" | "SALE" | "CAPITAL";
revenueCategory: string;
revenueService: string;
administrativeUnit: string;
source: InvoiceSource;
issuedDate: string | null;
dueDate: string | null;
amount: number;
paidAmount: number;
status: InvoiceStatus;
description: string;
createdBy: string;
};

type InvoiceStatusFilter = "ALL" | InvoiceStatus;
type InvoiceSourceFilter = "ALL" | InvoiceSource;

const DEMO_INVOICES: InvoiceRecord[] = [
{
id: "inv-1001",
invoiceNumber: "INV-2026-00321",
taxpayerName: "Abebe Kebede",
taxpayerTin: "TIN-100245781",
revenueDomain: "TAX",
revenueCategory: "Property Tax",
revenueService: "Property Tax Assessment",
administrativeUnit: "Bole Subcity",
source: "ASSESSMENT",
issuedDate: "2026-10-01",
dueDate: "2026-10-31",
amount: 48500,
paidAmount: 48500,
status: "PAID",
description: "Property tax assessment invoice for the current billing period.",
createdBy: "Revenue Assessment Officer",
},
{
id: "inv-1002",
invoiceNumber: "INV-2026-00322",
taxpayerName: "Hana Mohammed",
taxpayerTin: "TIN-100245782",
revenueDomain: "RENT",
revenueCategory: "Land Lease",
revenueService: "Land Lease Installment",
administrativeUnit: "Wereda 02",
source: "ASSESSMENT",
issuedDate: "2026-10-02",
dueDate: "2026-10-30",
amount: 185000,
paidAmount: 0,
status: "ISSUED",
description: "Land lease installment awaiting payment.",
createdBy: "Revenue Assessment Officer",
},
{
id: "inv-1003",
invoiceNumber: "INV-2026-00323",
taxpayerName: "Abdi Nuru",
taxpayerTin: "TIN-100245783",
revenueDomain: "TAX",
revenueCategory: "Business Tax",
revenueService: "Business License Renewal",
administrativeUnit: "Geda Subcity",
source: "ASSESSMENT",
issuedDate: "2026-09-15",
dueDate: "2026-10-15",
amount: 25000,
paidAmount: 12500,
status: "PARTIALLY_PAID",
description: "Business license renewal with an outstanding balance.",
createdBy: "Revenue Assessment Officer",
},
{
id: "inv-1004",
invoiceNumber: "INV-2026-00324",
taxpayerName: "Selamawit Bekele",
taxpayerTin: "TIN-100245784",
revenueDomain: "SERVICE",
revenueCategory: "Municipal Services",
revenueService: "Construction Permit Fee",
administrativeUnit: "Wereda 01",
source: "ASSESSMENT",
issuedDate: "2026-09-01",
dueDate: "2026-09-30",
amount: 32000,
paidAmount: 0,
status: "OVERDUE",
description: "Construction permit fee past its payment due date.",
createdBy: "Permit Revenue Officer",
},
{
id: "inv-1005",
invoiceNumber: "INV-2026-00325",
taxpayerName: "Dawit Girma",
taxpayerTin: "TIN-100245785",
revenueDomain: "RENT",
revenueCategory: "Market Rent",
revenueService: "Market Stall Collection",
administrativeUnit: "Wereda 03",
source: "DIRECT_COLLECTION",
issuedDate: "2026-10-09",
dueDate: "2026-10-09",
amount: 4500,
paidAmount: 4500,
status: "PAID",
description: "Market stall charge recorded through direct collection.",
createdBy: "Revenue Collector",
},
{
id: "inv-1006",
invoiceNumber: "INV-2026-00326",
taxpayerName: "Fatuma Ali",
taxpayerTin: "TIN-100245786",
revenueDomain: "RENT",
revenueCategory: "Land Lease",
revenueService: "Land Lease Installment",
administrativeUnit: "Bole Subcity",
source: "ASSESSMENT",
issuedDate: "2026-10-03",
dueDate: "2026-11-02",
amount: 275000,
paidAmount: 0,
status: "ISSUED",
description: "Land lease installment invoice awaiting payment.",
createdBy: "Revenue Assessment Officer",
},
{
id: "inv-1007",
invoiceNumber: "INV-2026-00327",
taxpayerName: "Mekonnen Tadesse",
taxpayerTin: "TIN-100245787",
revenueDomain: "TAX",
revenueCategory: "Property Tax",
revenueService: "Property Tax Assessment",
administrativeUnit: "Wereda 01",
source: "ASSESSMENT",
issuedDate: "2026-08-15",
dueDate: "2026-09-15",
amount: 27500,
paidAmount: 0,
status: "OVERDUE",
description: "Unpaid property tax assessment invoice.",
createdBy: "Revenue Assessment Officer",
},
{
id: "inv-1008",
invoiceNumber: "INV-2026-00328",
taxpayerName: "Rahel Worku",
taxpayerTin: "TIN-100245788",
revenueDomain: "TAX",
revenueCategory: "Business Tax",
revenueService: "Business License Renewal",
administrativeUnit: "Geda Subcity",
source: "ASSESSMENT",
issuedDate: "2026-10-01",
dueDate: "2026-10-30",
amount: 18000,
paidAmount: 18000,
status: "PAID",
description: "Business license renewal invoice paid in full.",
createdBy: "Revenue Assessment Officer",
},
{
id: "inv-1009",
invoiceNumber: "INV-2026-00329",
taxpayerName: "Omar Hassan",
taxpayerTin: "TIN-100245789",
revenueDomain: "SERVICE",
revenueCategory: "Municipal Services",
revenueService: "Construction Permit Fee",
administrativeUnit: "Bole Subcity",
source: "ASSESSMENT",
issuedDate: "2026-10-04",
dueDate: "2026-11-03",
amount: 42000,
paidAmount: 42000,
status: "PAID",
description: "Construction permit fee settled in full.",
createdBy: "Permit Revenue Officer",
},
{
id: "inv-1010",
invoiceNumber: "INV-2026-00330",
taxpayerName: "Tigist Fikru",
taxpayerTin: "TIN-100245790",
revenueDomain: "RENT",
revenueCategory: "Land Lease",
revenueService: "Land Lease Installment",
administrativeUnit: "Wereda 02",
source: "ASSESSMENT",
issuedDate: "2026-10-05",
dueDate: "2026-11-04",
amount: 210000,
paidAmount: 0,
status: "ISSUED",
description: "New land lease installment invoice.",
createdBy: "Revenue Assessment Officer",
},
{
id: "inv-1011",
invoiceNumber: "INV-2026-00331",
taxpayerName: "Gemechu Bekele",
taxpayerTin: "TIN-100245791",
revenueDomain: "RENT",
revenueCategory: "Market Rent",
revenueService: "Market Stall Collection",
administrativeUnit: "Wereda 03",
source: "DIRECT_COLLECTION",
issuedDate: "2026-10-06",
dueDate: "2026-10-06",
amount: 6500,
paidAmount: 6500,
status: "PAID",
description: "Market rent collected directly by the revenue collector.",
createdBy: "Revenue Collector",
},
{
id: "inv-1012",
invoiceNumber: "INV-2026-00332",
taxpayerName: "Mimi Tesfaye",
taxpayerTin: "TIN-100245792",
revenueDomain: "TAX",
revenueCategory: "Property Tax",
revenueService: "Property Tax Assessment",
administrativeUnit: "Geda Subcity",
source: "ASSESSMENT",
issuedDate: null,
dueDate: null,
amount: 15500,
paidAmount: 0,
status: "DRAFT",
description: "Draft invoice awaiting issuance.",
createdBy: "Revenue Assessment Officer",
},
{
id: "inv-1013",
invoiceNumber: "INV-2026-00333",
taxpayerName: "Biruk Workneh",
taxpayerTin: "TIN-100245793",
revenueDomain: "TAX",
revenueCategory: "Business Tax",
revenueService: "Business License Renewal",
administrativeUnit: "Wereda 01",
source: "ASSESSMENT",
issuedDate: "2026-09-01",
dueDate: "2026-09-30",
amount: 36500,
paidAmount: 36500,
status: "PAID",
description: "Business license renewal paid in full.",
createdBy: "Revenue Assessment Officer",
},
{
id: "inv-1014",
invoiceNumber: "INV-2026-00334",
taxpayerName: "Hirut Alemu",
taxpayerTin: "TIN-100245794",
revenueDomain: "RENT",
revenueCategory: "Land Lease",
revenueService: "Land Lease Installment",
administrativeUnit: "Bole Subcity",
source: "ASSESSMENT",
issuedDate: "2026-09-01",
dueDate: "2026-09-30",
amount: 320000,
paidAmount: 320000,
status: "PAID",
description: "Land lease installment settled.",
createdBy: "Revenue Assessment Officer",
},
{
id: "inv-1015",
invoiceNumber: "INV-2026-00335",
taxpayerName: "Netsanet Abebe",
taxpayerTin: "TIN-100245795",
revenueDomain: "TAX",
revenueCategory: "Property Tax",
revenueService: "Property Tax Assessment",
administrativeUnit: "Wereda 02",
source: "ASSESSMENT",
issuedDate: "2026-09-10",
dueDate: "2026-10-10",
amount: 28500,
paidAmount: 0,
status: "ISSUED",
description: "Property tax invoice due for payment.",
createdBy: "Revenue Assessment Officer",
},
{
id: "inv-1016",
invoiceNumber: "INV-2026-00336",
taxpayerName: "Abdisa Jibril",
taxpayerTin: "TIN-100245796",
revenueDomain: "SERVICE",
revenueCategory: "Municipal Services",
revenueService: "Construction Permit Fee",
administrativeUnit: "Geda Subcity",
source: "ASSESSMENT",
issuedDate: "2026-08-01",
dueDate: "2026-08-31",
amount: 24000,
paidAmount: 24000,
status: "PAID",
description: "Construction permit fee paid.",
createdBy: "Permit Revenue Officer",
},
{
id: "inv-1017",
invoiceNumber: "INV-2026-00337",
taxpayerName: "Saron Bekele",
taxpayerTin: "TIN-100245797",
revenueDomain: "RENT",
revenueCategory: "Land Lease",
revenueService: "Land Lease Installment",
administrativeUnit: "Bole Subcity",
source: "ASSESSMENT",
issuedDate: "2026-07-01",
dueDate: "2026-07-31",
amount: 240000,
paidAmount: 240000,
status: "PAID",
description: "Land lease installment paid in full.",
createdBy: "Revenue Assessment Officer",
},
{
id: "inv-1018",
invoiceNumber: "INV-2026-00338",
taxpayerName: "Tadesse Girma",
taxpayerTin: "TIN-100245798",
revenueDomain: "TAX",
revenueCategory: "Business Tax",
revenueService: "Business License Renewal",
administrativeUnit: "Wereda 01",
source: "ASSESSMENT",
issuedDate: "2026-06-01",
dueDate: "2026-06-30",
amount: 14200,
paidAmount: 14200,
status: "PAID",
description: "Business license renewal settled.",
createdBy: "Revenue Assessment Officer",
},
{
id: "inv-1019",
invoiceNumber: "INV-2026-00339",
taxpayerName: "Fikre Lemma",
taxpayerTin: "TIN-100245799",
revenueDomain: "RENT",
revenueCategory: "Market Rent",
revenueService: "Market Stall Collection",
administrativeUnit: "Wereda 03",
source: "DIRECT_COLLECTION",
issuedDate: "2026-05-12",
dueDate: "2026-05-12",
amount: 5200,
paidAmount: 5200,
status: "PAID",
description: "Direct market rent collection completed.",
createdBy: "Revenue Collector",
},
{
id: "inv-1020",
invoiceNumber: "INV-2026-00340",
taxpayerName: "Mulugeta Tola",
taxpayerTin: "TIN-100245800",
revenueDomain: "TAX",
revenueCategory: "Property Tax",
revenueService: "Property Tax Assessment",
administrativeUnit: "Geda Subcity",
source: "ASSESSMENT",
issuedDate: "2026-05-01",
dueDate: "2026-05-31",
amount: 21500,
paidAmount: 0,
status: "CANCELLED",
description: "Invoice cancelled after review.",
createdBy: "Revenue Assessment Officer",
},
{
id: "inv-1021",
invoiceNumber: "INV-2026-00341",
taxpayerName: "Eden Mekonnen",
taxpayerTin: "TIN-100245801",
revenueDomain: "INVESTMENT",
revenueCategory: "Investment Revenue",
revenueService: "Dividend Collection",
administrativeUnit: "Adama City",
source: "ASSESSMENT",
issuedDate: "2026-10-07",
dueDate: "2026-11-06",
amount: 95000,
paidAmount: 25000,
status: "PARTIALLY_PAID",
description: "Investment-related revenue invoice with a remaining balance.",
createdBy: "Investment Revenue Officer",
},
{
id: "inv-1022",
invoiceNumber: "INV-2026-00342",
taxpayerName: "Adama Municipal Assets",
taxpayerTin: "TIN-100245802",
revenueDomain: "SALE",
revenueCategory: "Municipal Asset Sale",
revenueService: "Municipal Property Sale",
administrativeUnit: "Adama City",
source: "ASSESSMENT",
issuedDate: null,
dueDate: null,
amount: 450000,
paidAmount: 0,
status: "VOID",
description: "Voided invoice retained for audit history.",
createdBy: "Revenue Decision Officer",
},
];

const STATUS_OPTIONS: { value: InvoiceStatusFilter; label: string }[] = [
{ value: "ALL", label: "All statuses" },
{ value: "DRAFT", label: "Draft" },
{ value: "ISSUED", label: "Issued" },
{ value: "PARTIALLY_PAID", label: "Partially paid" },
{ value: "PAID", label: "Paid" },
{ value: "OVERDUE", label: "Overdue" },
{ value: "CANCELLED", label: "Cancelled" },
{ value: "VOID", label: "Void" },
];

const SOURCE_OPTIONS: { value: InvoiceSourceFilter; label: string }[] = [
{ value: "ALL", label: "All sources" },
{ value: "ASSESSMENT", label: "Assessment" },
{ value: "DIRECT_COLLECTION", label: "Direct collection" },
];

function formatCurrency(amount: number, locale: string) {
return new Intl.NumberFormat(locale, {
style: "currency",
currency: "ETB",
maximumFractionDigits: 2,
}).format(amount);
}

function formatDate(value: string | null, locale: string) {
if (!value) return "—";

const date = new Date(`${value}T00:00:00`);

if (Number.isNaN(date.getTime())) return value;

return new Intl.DateTimeFormat(locale, {
year: "numeric",
month: "short",
day: "2-digit",
}).format(date);
}

function getStatusClasses(status: InvoiceStatus) {
switch (status) {
case "DRAFT":
return "border-slate-200 bg-slate-100 text-slate-700";
case "ISSUED":
return "border-blue-200 bg-blue-50 text-blue-700";
case "PARTIALLY_PAID":
return "border-violet-200 bg-violet-50 text-violet-700";
case "PAID":
return "border-emerald-200 bg-emerald-50 text-emerald-700";
case "OVERDUE":
return "border-red-200 bg-red-50 text-red-700";
case "CANCELLED":
return "border-orange-200 bg-orange-50 text-orange-700";
case "VOID":
return "border-slate-300 bg-slate-100 text-slate-600";
}
}

function getStatusLabel(status: InvoiceStatus) {
switch (status) {
case "DRAFT":
return "Draft";
case "ISSUED":
return "Issued";
case "PARTIALLY_PAID":
return "Partially paid";
case "PAID":
return "Paid";
case "OVERDUE":
return "Overdue";
case "CANCELLED":
return "Cancelled";
case "VOID":
return "Void";
}
}

function InvoiceStatusIcon({ status }: { status: InvoiceStatus }) {
switch (status) {
case "DRAFT":
return <FileText className="h-3.5 w-3.5" />;
case "ISSUED":
return <Receipt className="h-3.5 w-3.5" />;
case "PARTIALLY_PAID":
return <Clock3 className="h-3.5 w-3.5" />;
case "PAID":
return <CheckCircle2 className="h-3.5 w-3.5" />;
case "OVERDUE":
return <XCircle className="h-3.5 w-3.5" />;
case "CANCELLED":
case "VOID":
return <X className="h-3.5 w-3.5" />;
}
}

function DetailItem({
label,
value,
}: {
label: string;
value: string;
}) {
return ( <div className="min-w-0"> <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
{label} </p> <p className="mt-1 break-words text-sm font-medium text-slate-900">
{value} </p> </div>
);
}

export default function InvoicesPage() {
const locale = useLocale();

const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] =
useState<InvoiceStatusFilter>("ALL");
const [sourceFilter, setSourceFilter] =
useState<InvoiceSourceFilter>("ALL");
const [startDate, setStartDate] = useState("2026-05-01");
const [endDate, setEndDate] = useState("2026-10-10");
const [page, setPage] = useState(1);
const [selectedInvoice, setSelectedInvoice] =
useState<InvoiceRecord | null>(null);

const pageSize = 8;

const filteredInvoices = useMemo(() => {
const query = search.trim().toLowerCase();

return DEMO_INVOICES.filter((invoice) => {
  const matchesSearch =
    !query ||
    [
      invoice.invoiceNumber,
      invoice.taxpayerName,
      invoice.taxpayerTin,
      invoice.revenueDomain,
      invoice.revenueCategory,
      invoice.revenueService,
      invoice.administrativeUnit,
      invoice.description,
    ].some((value) => value.toLowerCase().includes(query));

  const matchesStatus =
    statusFilter === "ALL" || invoice.status === statusFilter;

  const matchesSource =
    sourceFilter === "ALL" || invoice.source === sourceFilter;

  // Draft invoices have no issue date, so they are not excluded by
  // the issue-date filter.
  const matchesStart =
    !startDate ||
    !invoice.issuedDate ||
    invoice.issuedDate >= startDate;

  const matchesEnd =
    !endDate ||
    !invoice.issuedDate ||
    invoice.issuedDate <= endDate;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesSource &&
    matchesStart &&
    matchesEnd
  );
}).sort((a, b) => {
  const dateA = a.issuedDate ?? "";
  const dateB = b.issuedDate ?? "";
  return dateB.localeCompare(dateA);
});

}, [search, statusFilter, sourceFilter, startDate, endDate]);

const summary = useMemo(() => {
const activeInvoices = filteredInvoices.filter(
(invoice) => !["CANCELLED", "VOID"].includes(invoice.status),
);

const totalInvoiced = activeInvoices.reduce(
  (sum, invoice) => sum + invoice.amount,
  0,
);

const totalPaid = activeInvoices.reduce(
  (sum, invoice) => sum + invoice.paidAmount,
  0,
);

const totalOutstanding = activeInvoices.reduce(
  (sum, invoice) =>
    sum + Math.max(0, invoice.amount - invoice.paidAmount),
  0,
);

const overdueInvoices = activeInvoices.filter(
  (invoice) => invoice.status === "OVERDUE",
);

return {
  invoiceCount: filteredInvoices.length,
  activeCount: activeInvoices.length,
  draftCount: filteredInvoices.filter(
    (invoice) => invoice.status === "DRAFT",
  ).length,
  issuedCount: filteredInvoices.filter(
    (invoice) => invoice.status === "ISSUED",
  ).length,
  partiallyPaidCount: filteredInvoices.filter(
    (invoice) => invoice.status === "PARTIALLY_PAID",
  ).length,
  paidCount: filteredInvoices.filter(
    (invoice) => invoice.status === "PAID",
  ).length,
  overdueCount: overdueInvoices.length,
  overdueAmount: overdueInvoices.reduce(
    (sum, invoice) =>
      sum + Math.max(0, invoice.amount - invoice.paidAmount),
    0,
  ),
  totalInvoiced,
  totalPaid,
  totalOutstanding,
};

}, [filteredInvoices]);

const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
const currentPage = Math.min(page, totalPages);

const paginatedInvoices = filteredInvoices.slice(
(currentPage - 1) * pageSize,
currentPage * pageSize,
);

const resetFilters = () => {
setSearch("");
setStatusFilter("ALL");
setSourceFilter("ALL");
setStartDate("2026-05-01");
setEndDate("2026-10-10");
setPage(1);
};

const exportCsv = () => {
const headers = [
"Invoice Number",
"Taxpayer",
"Taxpayer TIN",
"Revenue Domain",
"Revenue Category",
"Revenue Service",
"Administrative Unit",
"Source",
"Issued Date",
"Due Date",
"Invoice Amount ETB",
"Paid Amount ETB",
"Outstanding Amount ETB",
"Status",
"Description",
"Created By",
];

const escapeCsv = (value: unknown) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const rows = filteredInvoices.map((invoice) => [
  invoice.invoiceNumber,
  invoice.taxpayerName,
  invoice.taxpayerTin,
  invoice.revenueDomain,
  invoice.revenueCategory,
  invoice.revenueService,
  invoice.administrativeUnit,
  invoice.source,
  invoice.issuedDate,
  invoice.dueDate,
  invoice.amount,
  invoice.paidAmount,
  Math.max(0, invoice.amount - invoice.paidAmount),
  invoice.status,
  invoice.description,
  invoice.createdBy,
]);

const csv = [headers, ...rows]
  .map((row) => row.map(escapeCsv).join(","))
  .join("\r\n");

const blob = new Blob(["\uFEFF", csv], {
  type: "text/csv;charset=utf-8;",
});

const url = URL.createObjectURL(blob);
const anchor = document.createElement("a");

anchor.href = url;
anchor.download = `municipal-invoices-${startDate || "all"}-to-${endDate || "all"}.csv`;
document.body.appendChild(anchor);
anchor.click();
anchor.remove();
URL.revokeObjectURL(url);

};

return ( <div className="min-h-screen space-y-6 bg-slate-50/70 p-4 md:p-6 lg:p-8">
{/* Page header */} <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"> <div className="space-y-2"> <div className="flex items-center gap-2 text-sm text-muted-foreground">
<Link
href={`/${locale}/office/dashboard/reports`}
className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
> <ArrowLeft className="h-4 w-4" />
Reports </Link> <span>/</span> <span className="text-foreground">Invoices</span> </div>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          Invoice Management
        </h1>
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-amber-700"
        >
          Demonstration Data
        </Badge>
      </div>

      <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
        Monitor municipal revenue invoices, payment progress, outstanding
        balances, due dates, and invoice lifecycle status.
      </p>
    </div>

    <div className="flex flex-wrap gap-2 print:hidden">
      <Button variant="outline" onClick={exportCsv}>
        <ArrowDownToLine className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
      <Button
        onClick={() => window.print()}
        className="bg-slate-900 text-white hover:bg-slate-800"
      >
        <FileText className="mr-2 h-4 w-4" />
        Print Report
      </Button>
    </div>
  </div>

  {/* Demo disclaimer */}
  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
    <div>
      <p className="font-semibold">Sample invoice records</p>
      <p className="mt-1 text-amber-800">
        All amounts and invoice records are simulated for development. This
        page is not connected to your Laravel backend.
      </p>
    </div>
  </div>

  {/* Summary cards */}
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Total Invoiced
          </p>
          <p className="text-xl font-bold tracking-tight text-slate-900">
            {formatCurrency(summary.totalInvoiced, locale)}
          </p>
          <p className="text-xs text-muted-foreground">
            {summary.activeCount} active invoices
          </p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
          <Receipt className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>

    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Amount Paid
          </p>
          <p className="text-xl font-bold tracking-tight text-slate-900">
            {formatCurrency(summary.totalPaid, locale)}
          </p>
          <p className="text-xs text-muted-foreground">
            Recorded payments on active invoices
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>

    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Outstanding Balance
          </p>
          <p className="text-xl font-bold tracking-tight text-slate-900">
            {formatCurrency(summary.totalOutstanding, locale)}
          </p>
          <p className="text-xs text-muted-foreground">
            Unpaid balances on active invoices
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
          <Wallet className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>

    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Overdue Invoices
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {summary.overdueCount.toLocaleString(locale)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(summary.overdueAmount, locale)} overdue balance
          </p>
        </div>
        <div className="rounded-xl bg-red-50 p-3 text-red-700">
          <Clock3 className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  </div>

  {/* Status overview */}
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-muted-foreground">Draft</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">
        {summary.draftCount}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Awaiting issuance
      </p>
    </div>
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-muted-foreground">Issued</p>
      <p className="mt-1 text-xl font-semibold text-blue-700">
        {summary.issuedCount}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Awaiting payment
      </p>
    </div>
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-muted-foreground">Partially Paid</p>
      <p className="mt-1 text-xl font-semibold text-violet-700">
        {summary.partiallyPaidCount}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Payment balance remains
      </p>
    </div>
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-muted-foreground">Paid</p>
      <p className="mt-1 text-xl font-semibold text-emerald-700">
        {summary.paidCount}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Fully settled invoices
      </p>
    </div>
  </div>

  {/* Filters */}
  <Card className="border-slate-200 shadow-sm print:hidden">
    <CardHeader className="pb-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-slate-100 p-2">
            <Filter className="h-4 w-4 text-slate-700" />
          </div>
          <div>
            <CardTitle className="text-base">Filter Invoices</CardTitle>
            <CardDescription className="mt-1">
              Search by invoice, taxpayer, category, or service.
            </CardDescription>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="w-fit text-muted-foreground"
        >
          <RefreshCcw className="mr-2 h-3.5 w-3.5" />
          Reset filters
        </Button>
      </div>
    </CardHeader>

    <CardContent>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm font-medium">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Invoice, taxpayer, TIN, service..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Invoice Status</label>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as InvoiceStatusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Invoice Source</label>
          <Select
            value={sourceFilter}
            onValueChange={(value) => {
              setSourceFilter(value as InvoiceSourceFilter);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date</label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => {
                setStartDate(event.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">End Date</label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => {
                setEndDate(event.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Invoice table */}
  <Card className="overflow-hidden border-slate-200 shadow-sm">
    <CardHeader className="border-b border-slate-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Invoice Records</CardTitle>
          <CardDescription className="mt-1">
            View invoice amounts, payments, balances, and lifecycle status.
          </CardDescription>
        </div>
        <Badge variant="outline" className="w-fit">
          {filteredInvoices.length.toLocaleString(locale)} invoices
        </Badge>
      </div>
    </CardHeader>

    <CardContent className="p-0">
      {filteredInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-4 rounded-full bg-slate-100 p-4">
            <Search className="h-6 w-6 text-slate-500" />
          </div>
          <h3 className="font-semibold text-slate-900">
            No invoices found
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            No invoices match the current filters. Try changing your
            search, date range, or status.
          </p>
          <Button
            variant="outline"
            onClick={resetFilters}
            className="mt-4"
          >
            Reset filters
          </Button>
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Invoice</th>
                  <th className="px-5 py-4 font-semibold">Taxpayer</th>
                  <th className="px-5 py-4 font-semibold">
                    Revenue Service
                  </th>
                  <th className="px-5 py-4 font-semibold">Dates</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Invoice Amount
                  </th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Paid
                  </th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Outstanding
                  </th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedInvoices.map((invoice) => {
                  const outstanding = Math.max(
                    0,
                    invoice.amount - invoice.paidAmount,
                  );

                  return (
                    <tr
                      key={invoice.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {invoice.source === "ASSESSMENT"
                            ? "Assessment invoice"
                            : "Direct collection"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {invoice.taxpayerName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {invoice.taxpayerTin}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {invoice.administrativeUnit}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {invoice.revenueService}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {invoice.revenueCategory}
                        </p>
                        <Badge
                          variant="outline"
                          className="mt-2 text-[10px]"
                        >
                          {invoice.revenueDomain}
                        </Badge>
                      </td>

                      <td className="px-5 py-4">
                        <p className="whitespace-nowrap text-slate-800">
                          Issued: {formatDate(invoice.issuedDate, locale)}
                        </p>
                        <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">
                          Due: {formatDate(invoice.dueDate, locale)}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <p className="whitespace-nowrap font-semibold tabular-nums text-slate-900">
                          {formatCurrency(invoice.amount, locale)}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <p className="whitespace-nowrap font-medium tabular-nums text-emerald-700">
                          {formatCurrency(invoice.paidAmount, locale)}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <p
                          className={`whitespace-nowrap font-semibold tabular-nums ${
                            outstanding > 0 ? "text-amber-700" : "text-slate-500"
                          }`}
                        >
                          {formatCurrency(outstanding, locale)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <Badge
                          variant="outline"
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap ${getStatusClasses(invoice.status)}`}
                        >
                          <InvoiceStatusIcon status={invoice.status} />
                          {getStatusLabel(invoice.status)}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <Eye className="mr-2 h-3.5 w-3.5" />
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
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-slate-900">
                {(currentPage - 1) * pageSize + 1}
              </span>
              {"–"}
              <span className="font-medium text-slate-900">
                {Math.min(currentPage * pageSize, filteredInvoices.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-900">
                {filteredInvoices.length}
              </span>{" "}
              invoices
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() =>
                  setPage((previous) => Math.max(1, previous - 1))
                }
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>

              <span className="min-w-20 text-center text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setPage((previous) =>
                    Math.min(totalPages, previous + 1),
                  )
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

  {/* Invoice details dialog */}
  <Dialog
    open={Boolean(selectedInvoice)}
    onOpenChange={(open) => {
      if (!open) setSelectedInvoice(null);
    }}
  >
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      {selectedInvoice && (
        <>
          <DialogHeader>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-3">
                <Receipt className="h-5 w-5 text-slate-700" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="break-all text-lg">
                  {selectedInvoice.invoiceNumber}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Invoice information and payment breakdown
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Invoice amount
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    {formatCurrency(selectedInvoice.amount, locale)}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className={`flex w-fit items-center gap-1.5 ${getStatusClasses(selectedInvoice.status)}`}
                >
                  <InvoiceStatusIcon status={selectedInvoice.status} />
                  {getStatusLabel(selectedInvoice.status)}
                </Badge>
              </div>

              <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Amount paid
                  </p>
                  <p className="mt-1 font-semibold text-emerald-700">
                    {formatCurrency(selectedInvoice.paidAmount, locale)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Outstanding balance
                  </p>
                  <p className="mt-1 font-semibold text-amber-700">
                    {formatCurrency(
                      Math.max(
                        0,
                        selectedInvoice.amount - selectedInvoice.paidAmount,
                      ),
                      locale,
                    )}
                  </p>
                </div>
              </div>
            </div>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Taxpayer Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Taxpayer Name"
                  value={selectedInvoice.taxpayerName}
                />
                <DetailItem
                  label="Taxpayer TIN"
                  value={selectedInvoice.taxpayerTin}
                />
                <DetailItem
                  label="Administrative Unit"
                  value={selectedInvoice.administrativeUnit}
                />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Revenue Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Revenue Domain"
                  value={selectedInvoice.revenueDomain}
                />
                <DetailItem
                  label="Revenue Category"
                  value={selectedInvoice.revenueCategory}
                />
                <DetailItem
                  label="Revenue Service"
                  value={selectedInvoice.revenueService}
                />
                <DetailItem
                  label="Invoice Source"
                  value={
                    selectedInvoice.source === "ASSESSMENT"
                      ? "Assessment"
                      : "Direct collection"
                  }
                />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Invoice Dates
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Issued Date"
                  value={formatDate(selectedInvoice.issuedDate, locale)}
                />
                <DetailItem
                  label="Due Date"
                  value={formatDate(selectedInvoice.dueDate, locale)}
                />
                <DetailItem
                  label="Created By"
                  value={selectedInvoice.createdBy}
                />
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">
                Description
              </h3>
              <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-muted-foreground">
                {selectedInvoice.description}
              </p>
            </section>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </>
      )}
    </DialogContent>
  </Dialog>

  <div className="grid gap-4 md:grid-cols-2 print:hidden">
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <h3 className="font-semibold text-slate-900">
            Payment Management
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Review payment transactions, payment methods, and confirmation
            statuses.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}/office/dashboard/payments`}>
            Open <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>

    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <h3 className="font-semibold text-slate-900">
            Revenue Collection Report
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare collections across municipal revenue categories and
            services.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link
            href={`/${locale}/office/dashboard/reports/revenue-collection`}
          >
            Open <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  </div>

  <p className="pb-2 text-center text-xs text-muted-foreground">
    Demonstration report · Amounts in Ethiopian Birr (ETB) · Sample data only
  </p>
</div>

);
}
