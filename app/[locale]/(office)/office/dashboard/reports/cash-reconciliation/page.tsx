"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
ArrowDownToLine,
ArrowLeft,
ArrowRight,
Banknote,
CalendarDays,
CheckCircle2,
ChevronLeft,
ChevronRight,
CircleAlert,
ClipboardCheck,
Clock3,
Eye,
FileCheck2,
Filter,
RefreshCcw,
Search,
ShieldCheck,
Wallet,
X,
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

type ReconciliationStatus =
| "RECONCILED"
| "PENDING"
| "SHORTAGE"
| "OVERAGE"
| "REJECTED";

type CashSession = {
id: string;
reconciliationNumber: string;
sessionDate: string;
collectorName: string;
collectorCode: string;
administrativeUnit: string;
openingCash: number;
expectedCash: number;
countedCash: number;
cashSubmitted: number;
transactionCount: number;
status: ReconciliationStatus;
submittedAt: string | null;
reviewedBy: string | null;
reviewedAt: string | null;
notes: string;
};

const DEMO_RECONCILIATIONS: CashSession[] = [
{
id: "cash-rec-001",
reconciliationNumber: "CR-2026-00101",
sessionDate: "2026-10-10",
collectorName: "Dawit Girma",
collectorCode: "COL-001",
administrativeUnit: "Bole Subcity",
openingCash: 500,
expectedCash: 28450,
countedCash: 28450,
cashSubmitted: 28450,
transactionCount: 32,
status: "RECONCILED",
submittedAt: "2026-10-10T16:25:00",
reviewedBy: "Finance Officer",
reviewedAt: "2026-10-10T16:50:00",
notes: "Daily cash collection reconciled with the receipt records.",
},
{
id: "cash-rec-002",
reconciliationNumber: "CR-2026-00102",
sessionDate: "2026-10-10",
collectorName: "Hana Mohammed",
collectorCode: "COL-002",
administrativeUnit: "Geda Subcity",
openingCash: 300,
expectedCash: 36200,
countedCash: 35700,
cashSubmitted: 35700,
transactionCount: 41,
status: "SHORTAGE",
submittedAt: "2026-10-10T16:10:00",
reviewedBy: null,
reviewedAt: null,
notes: "A 500 ETB discrepancy requires investigation before approval.",
},
{
id: "cash-rec-003",
reconciliationNumber: "CR-2026-00103",
sessionDate: "2026-10-10",
collectorName: "Abdi Nuru",
collectorCode: "COL-003",
administrativeUnit: "Wereda 01",
openingCash: 200,
expectedCash: 19200,
countedCash: 19200,
cashSubmitted: 0,
transactionCount: 24,
status: "PENDING",
submittedAt: "2026-10-10T16:40:00",
reviewedBy: null,
reviewedAt: null,
notes: "Submitted for finance verification.",
},
{
id: "cash-rec-004",
reconciliationNumber: "CR-2026-00104",
sessionDate: "2026-10-09",
collectorName: "Selamawit Bekele",
collectorCode: "COL-004",
administrativeUnit: "Wereda 02",
openingCash: 400,
expectedCash: 24750,
countedCash: 25000,
cashSubmitted: 25000,
transactionCount: 29,
status: "OVERAGE",
submittedAt: "2026-10-09T16:05:00",
reviewedBy: null,
reviewedAt: null,
notes: "An excess of 250 ETB was recorded during the cash count.",
},
{
id: "cash-rec-005",
reconciliationNumber: "CR-2026-00105",
sessionDate: "2026-10-09",
collectorName: "Mekonnen Tadesse",
collectorCode: "COL-005",
administrativeUnit: "Bole Subcity",
openingCash: 250,
expectedCash: 31800,
countedCash: 31800,
cashSubmitted: 31800,
transactionCount: 37,
status: "RECONCILED",
submittedAt: "2026-10-09T16:15:00",
reviewedBy: "Senior Finance Officer",
reviewedAt: "2026-10-09T16:35:00",
notes: "Receipt totals and physical cash count match.",
},
{
id: "cash-rec-006",
reconciliationNumber: "CR-2026-00106",
sessionDate: "2026-10-08",
collectorName: "Rahel Worku",
collectorCode: "COL-006",
administrativeUnit: "Geda Subcity",
openingCash: 150,
expectedCash: 15600,
countedCash: 15600,
cashSubmitted: 15600,
transactionCount: 21,
status: "RECONCILED",
submittedAt: "2026-10-08T15:55:00",
reviewedBy: "Finance Officer",
reviewedAt: "2026-10-08T16:20:00",
notes: "All collection receipts verified.",
},
{
id: "cash-rec-007",
reconciliationNumber: "CR-2026-00107",
sessionDate: "2026-10-08",
collectorName: "Gemechu Bekele",
collectorCode: "COL-007",
administrativeUnit: "Wereda 03",
openingCash: 300,
expectedCash: 22400,
countedCash: 22400,
cashSubmitted: 0,
transactionCount: 28,
status: "PENDING",
submittedAt: "2026-10-08T16:30:00",
reviewedBy: null,
reviewedAt: null,
notes: "Awaiting finance verification and cash handover.",
},
{
id: "cash-rec-008",
reconciliationNumber: "CR-2026-00108",
sessionDate: "2026-10-07",
collectorName: "Fatuma Ali",
collectorCode: "COL-008",
administrativeUnit: "Wereda 01",
openingCash: 200,
expectedCash: 18750,
countedCash: 18250,
cashSubmitted: 18250,
transactionCount: 23,
status: "SHORTAGE",
submittedAt: "2026-10-07T16:05:00",
reviewedBy: null,
reviewedAt: null,
notes: "A 500 ETB shortage is awaiting investigation.",
},
{
id: "cash-rec-009",
reconciliationNumber: "CR-2026-00109",
sessionDate: "2026-10-06",
collectorName: "Tigist Fikru",
collectorCode: "COL-009",
administrativeUnit: "Bole Subcity",
openingCash: 350,
expectedCash: 42600,
countedCash: 42600,
cashSubmitted: 42600,
transactionCount: 46,
status: "RECONCILED",
submittedAt: "2026-10-06T16:10:00",
reviewedBy: "Finance Officer",
reviewedAt: "2026-10-06T16:30:00",
notes: "Cash count and submitted amount match the expected balance.",
},
{
id: "cash-rec-010",
reconciliationNumber: "CR-2026-00110",
sessionDate: "2026-10-05",
collectorName: "Omar Hassan",
collectorCode: "COL-010",
administrativeUnit: "Wereda 02",
openingCash: 150,
expectedCash: 12900,
countedCash: 12900,
cashSubmitted: 12900,
transactionCount: 18,
status: "RECONCILED",
submittedAt: "2026-10-05T15:45:00",
reviewedBy: "Finance Officer",
reviewedAt: "2026-10-05T16:00:00",
notes: "Daily reconciliation completed.",
},
{
id: "cash-rec-011",
reconciliationNumber: "CR-2026-00111",
sessionDate: "2026-10-04",
collectorName: "Abebe Kebede",
collectorCode: "COL-011",
administrativeUnit: "Geda Subcity",
openingCash: 200,
expectedCash: 29400,
countedCash: 29400,
cashSubmitted: 29400,
transactionCount: 34,
status: "RECONCILED",
submittedAt: "2026-10-04T15:30:00",
reviewedBy: "Senior Finance Officer",
reviewedAt: "2026-10-04T16:00:00",
notes: "Verified against daily cash collection receipts.",
},
{
id: "cash-rec-012",
reconciliationNumber: "CR-2026-00112",
sessionDate: "2026-10-03",
collectorName: "Biruk Workneh",
collectorCode: "COL-012",
administrativeUnit: "Wereda 03",
openingCash: 100,
expectedCash: 16200,
countedCash: 16350,
cashSubmitted: 16350,
transactionCount: 20,
status: "OVERAGE",
submittedAt: "2026-10-03T15:40:00",
reviewedBy: null,
reviewedAt: null,
notes: "An unexplained excess of 150 ETB requires review.",
},
{
id: "cash-rec-013",
reconciliationNumber: "CR-2026-00113",
sessionDate: "2026-09-30",
collectorName: "Dawit Girma",
collectorCode: "COL-001",
administrativeUnit: "Bole Subcity",
openingCash: 500,
expectedCash: 31500,
countedCash: 31500,
cashSubmitted: 31500,
transactionCount: 39,
status: "RECONCILED",
submittedAt: "2026-09-30T16:15:00",
reviewedBy: "Finance Officer",
reviewedAt: "2026-09-30T16:45:00",
notes: "Month-end cash reconciliation completed.",
},
{
id: "cash-rec-014",
reconciliationNumber: "CR-2026-00114",
sessionDate: "2026-09-29",
collectorName: "Hana Mohammed",
collectorCode: "COL-002",
administrativeUnit: "Geda Subcity",
openingCash: 300,
expectedCash: 27100,
countedCash: 27100,
cashSubmitted: 27100,
transactionCount: 31,
status: "RECONCILED",
submittedAt: "2026-09-29T16:10:00",
reviewedBy: "Finance Officer",
reviewedAt: "2026-09-29T16:35:00",
notes: "Cash records successfully verified.",
},
{
id: "cash-rec-015",
reconciliationNumber: "CR-2026-00115",
sessionDate: "2026-09-28",
collectorName: "Abdi Nuru",
collectorCode: "COL-003",
administrativeUnit: "Wereda 01",
openingCash: 200,
expectedCash: 19800,
countedCash: 19800,
cashSubmitted: 0,
transactionCount: 25,
status: "REJECTED",
submittedAt: "2026-09-28T16:00:00",
reviewedBy: "Senior Finance Officer",
reviewedAt: "2026-09-28T16:30:00",
notes: "Rejected because supporting receipt documentation was incomplete.",
},
{
id: "cash-rec-016",
reconciliationNumber: "CR-2026-00116",
sessionDate: "2026-09-25",
collectorName: "Selamawit Bekele",
collectorCode: "COL-004",
administrativeUnit: "Wereda 02",
openingCash: 400,
expectedCash: 22100,
countedCash: 22100,
cashSubmitted: 22100,
transactionCount: 27,
status: "RECONCILED",
submittedAt: "2026-09-25T16:05:00",
reviewedBy: "Finance Officer",
reviewedAt: "2026-09-25T16:25:00",
notes: "Collection session approved.",
},
];

const STATUS_OPTIONS: { value: ReconciliationStatus | "ALL"; label: string }[] = [
{ value: "ALL", label: "All statuses" },
{ value: "RECONCILED", label: "Reconciled" },
{ value: "PENDING", label: "Pending review" },
{ value: "SHORTAGE", label: "Shortage" },
{ value: "OVERAGE", label: "Overage" },
{ value: "REJECTED", label: "Rejected" },
];

const ADMINISTRATIVE_UNITS = [
"ALL",
"Bole Subcity",
"Geda Subcity",
"Wereda 01",
"Wereda 02",
"Wereda 03",
];

function formatCurrency(amount: number, locale: string) {
return new Intl.NumberFormat(locale, {
style: "currency",
currency: "ETB",
maximumFractionDigits: 2,
}).format(amount);
}

function formatDate(value: string, locale: string) {
const date = new Date(`${value}T00:00:00`);

if (Number.isNaN(date.getTime())) return value;

return new Intl.DateTimeFormat(locale, {
year: "numeric",
month: "short",
day: "2-digit",
}).format(date);
}

function formatDateTime(value: string | null, locale: string) {
if (!value) return "—";

const date = new Date(value);

if (Number.isNaN(date.getTime())) return value;

return new Intl.DateTimeFormat(locale, {
year: "numeric",
month: "short",
day: "2-digit",
hour: "2-digit",
minute: "2-digit",
}).format(date);
}

function getVariance(record: CashSession) {
return record.countedCash - record.expectedCash;
}

function getStatusClasses(status: ReconciliationStatus) {
switch (status) {
case "RECONCILED":
return "border-emerald-200 bg-emerald-50 text-emerald-700";
case "PENDING":
return "border-blue-200 bg-blue-50 text-blue-700";
case "SHORTAGE":
return "border-red-200 bg-red-50 text-red-700";
case "OVERAGE":
return "border-amber-200 bg-amber-50 text-amber-800";
case "REJECTED":
return "border-slate-300 bg-slate-100 text-slate-700";
}
}

function getStatusLabel(status: ReconciliationStatus) {
switch (status) {
case "RECONCILED":
return "Reconciled";
case "PENDING":
return "Pending review";
case "SHORTAGE":
return "Shortage";
case "OVERAGE":
return "Overage";
case "REJECTED":
return "Rejected";
}
}

function getStatusIcon(status: ReconciliationStatus) {
switch (status) {
case "RECONCILED":
return <CheckCircle2 className="h-3.5 w-3.5" />;
case "PENDING":
return <Clock3 className="h-3.5 w-3.5" />;
case "SHORTAGE":
return <CircleAlert className="h-3.5 w-3.5" />;
case "OVERAGE":
return <CircleAlert className="h-3.5 w-3.5" />;
case "REJECTED":
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

export default function CashReconciliationPage() {
const locale = useLocale();

const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState<
ReconciliationStatus | "ALL"> ("ALL");
 const [unitFilter, setUnitFilter] = useState("ALL");
 const [startDate, setStartDate] = useState("2026-09-01");
 const [endDate, setEndDate] = useState("2026-10-10");
 const [page, setPage] = useState(1);
const [selectedRecord, setSelectedRecord] = useState<CashSession | null>( null);

const pageSize = 8;

const filteredRecords = useMemo(() => {
const query = search.trim().toLowerCase();


return DEMO_RECONCILIATIONS.filter((record) => {
  const matchesSearch =
    !query ||
    [
      record.reconciliationNumber,
      record.collectorName,
      record.collectorCode,
      record.administrativeUnit,
      record.notes,
      record.status,
    ].some((value) => value.toLowerCase().includes(query));

  const matchesStatus =
    statusFilter === "ALL" || record.status === statusFilter;

  const matchesUnit =
    unitFilter === "ALL" || record.administrativeUnit === unitFilter;

  const matchesStart = !startDate || record.sessionDate >= startDate;
  const matchesEnd = !endDate || record.sessionDate <= endDate;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesUnit &&
    matchesStart &&
    matchesEnd
  );
}).sort((a, b) => {
  const dateComparison = b.sessionDate.localeCompare(a.sessionDate);
  return dateComparison !== 0
    ? dateComparison
    : b.reconciliationNumber.localeCompare(a.reconciliationNumber);
});


}, [search, statusFilter, unitFilter, startDate, endDate]);

const summary = useMemo(() => {
const expectedCash = filteredRecords.reduce(
(sum, record) => sum + record.expectedCash,
0,
);


const countedCash = filteredRecords.reduce(
  (sum, record) => sum + record.countedCash,
  0,
);

const reconciledRecords = filteredRecords.filter(
  (record) => record.status === "RECONCILED",
);

const pendingRecords = filteredRecords.filter(
  (record) => record.status === "PENDING",
);

const discrepancyRecords = filteredRecords.filter(
  (record) =>
    record.status === "SHORTAGE" || record.status === "OVERAGE",
);

const shortageAmount = filteredRecords.reduce(
  (sum, record) =>
    sum +
    (record.status === "SHORTAGE"
      ? Math.max(0, record.expectedCash - record.countedCash)
      : 0),
  0,
);

const overageAmount = filteredRecords.reduce(
  (sum, record) =>
    sum +
    (record.status === "OVERAGE"
      ? Math.max(0, record.countedCash - record.expectedCash)
      : 0),
  0,
);

const cashSubmitted = filteredRecords.reduce(
  (sum, record) => sum + record.cashSubmitted,
  0,
);

return {
  sessionCount: filteredRecords.length,
  expectedCash,
  countedCash,
  cashSubmitted,
  reconciledCount: reconciledRecords.length,
  pendingCount: pendingRecords.length,
  discrepancyCount: discrepancyRecords.length,
  rejectedCount: filteredRecords.filter(
    (record) => record.status === "REJECTED",
  ).length,
  shortageAmount,
  overageAmount,
  transactionCount: filteredRecords.reduce(
    (sum, record) => sum + record.transactionCount,
    0,
  ),
};


}, [filteredRecords]);

const totalPages = Math.max(
1,
Math.ceil(filteredRecords.length / pageSize),
);
const currentPage = Math.min(page, totalPages);

const paginatedRecords = filteredRecords.slice(
(currentPage - 1) * pageSize,
currentPage * pageSize,
);

const resetFilters = () => {
setSearch("");
setStatusFilter("ALL");
setUnitFilter("ALL");
setStartDate("2026-09-01");
setEndDate("2026-10-10");
setPage(1);
};

const exportCsv = () => {
const headers = [
"Reconciliation Number",
"Session Date",
"Collector",
"Collector Code",
"Administrative Unit",
"Opening Cash ETB",
"Expected Cash ETB",
"Counted Cash ETB",
"Variance ETB",
"Cash Submitted ETB",
"Transaction Count",
"Status",
"Submitted At",
"Reviewed By",
"Reviewed At",
"Notes",
];


const escapeCsv = (value: unknown) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const rows = filteredRecords.map((record) => [
  record.reconciliationNumber,
  record.sessionDate,
  record.collectorName,
  record.collectorCode,
  record.administrativeUnit,
  record.openingCash,
  record.expectedCash,
  record.countedCash,
  getVariance(record),
  record.cashSubmitted,
  record.transactionCount,
  record.status,
  record.submittedAt,
  record.reviewedBy,
  record.reviewedAt,
  record.notes,
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
anchor.download = `cash-reconciliation-${startDate || "all"}-to-${endDate || "all"}.csv`;

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
Reports </Link> <span>/</span> <span className="text-foreground">Cash Reconciliation</span> </div>


      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          Cash Reconciliation
        </h1>
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-amber-700"
        >
          Demonstration Data
        </Badge>
      </div>

      <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
        Review daily cash collection sessions, compare expected cash with
        physical counts, and identify discrepancies before finance approval.
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
        <ClipboardCheck className="mr-2 h-4 w-4" />
        Print Report
      </Button>
    </div>
  </div>

  {/* Demo disclaimer */}
  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
    <div>
      <p className="font-semibold">Sample reconciliation records</p>
      <p className="mt-1 text-amber-800">
        All records and amounts are simulated. In production, expected cash
        should be derived from eligible completed cash payments and the
        applicable opening balance, not from frontend calculations.
      </p>
    </div>
  </div>

  {/* Summary cards */}
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Expected Cash
          </p>
          <p className="text-xl font-bold tracking-tight text-slate-900">
            {formatCurrency(summary.expectedCash, locale)}
          </p>
          <p className="text-xs text-muted-foreground">
            {summary.sessionCount} filtered sessions
          </p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
          <Wallet className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>

    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Counted Cash
          </p>
          <p className="text-xl font-bold tracking-tight text-slate-900">
            {formatCurrency(summary.countedCash, locale)}
          </p>
          <p className="text-xs text-muted-foreground">
            Reported physical cash count
          </p>
        </div>
        <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
          <Banknote className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>

    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Reconciled Sessions
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {summary.reconciledCount.toLocaleString(locale)}
          </p>
          <p className="text-xs text-muted-foreground">
            {summary.sessionCount > 0
              ? `${Math.round(
                  (summary.reconciledCount / summary.sessionCount) * 100,
                )}% of filtered sessions`
              : "No sessions in this filter"}
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
            Discrepancies
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {summary.discrepancyCount.toLocaleString(locale)}
          </p>
          <p className="text-xs text-muted-foreground">
            Shortages: {formatCurrency(summary.shortageAmount, locale)}
          </p>
          <p className="text-xs text-muted-foreground">
            Overages: {formatCurrency(summary.overageAmount, locale)}
          </p>
        </div>
        <div className="rounded-xl bg-red-50 p-3 text-red-700">
          <CircleAlert className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  </div>

  {/* Secondary overview */}
  <div className="grid gap-4 md:grid-cols-3">
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-muted-foreground">Pending Review</p>
      <p className="mt-1 text-xl font-semibold text-blue-700">
        {summary.pendingCount}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Awaiting finance verification
      </p>
    </div>

    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-muted-foreground">Rejected Sessions</p>
      <p className="mt-1 text-xl font-semibold text-slate-800">
        {summary.rejectedCount}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Require correction or resubmission
      </p>
    </div>

    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-muted-foreground">Cash Submitted</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">
        {formatCurrency(summary.cashSubmitted, locale)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Amount recorded as handed over
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
            <CardTitle className="text-base">
              Reconciliation Filters
            </CardTitle>
            <CardDescription className="mt-1">
              Filter by collector, administrative unit, status, and session
              date.
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
              placeholder="Reconciliation no., collector..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as ReconciliationStatus | "ALL");
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
          <label className="text-sm font-medium">
            Administrative Unit
          </label>
          <Select
            value={unitFilter}
            onValueChange={(value) => {
              setUnitFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All units" />
            </SelectTrigger>
            <SelectContent>
              {ADMINISTRATIVE_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit === "ALL" ? "All units" : unit}
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

  {/* Reconciliation table */}
  <Card className="overflow-hidden border-slate-200 shadow-sm">
    <CardHeader className="border-b border-slate-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">
            Cash Reconciliation Sessions
          </CardTitle>
          <CardDescription className="mt-1">
            Compare expected cash with the counted amount and cash handover.
          </CardDescription>
        </div>

        <Badge variant="outline" className="w-fit">
          {filteredRecords.length.toLocaleString(locale)} sessions
        </Badge>
      </div>
    </CardHeader>

    <CardContent className="p-0">
      {filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-4 rounded-full bg-slate-100 p-4">
            <Search className="h-6 w-6 text-slate-500" />
          </div>
          <h3 className="font-semibold text-slate-900">
            No reconciliation sessions found
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            No records match your filters. Try changing the date range,
            collector search, or status.
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
            <table className="w-full min-w-[1150px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Reconciliation
                  </th>
                  <th className="px-5 py-4 font-semibold">Collector</th>
                  <th className="px-5 py-4 font-semibold">Session Date</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Expected
                  </th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Counted
                  </th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Variance
                  </th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Submitted
                  </th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedRecords.map((record) => {
                  const variance = getVariance(record);

                  return (
                    <tr
                      key={record.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {record.reconciliationNumber}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {record.administrativeUnit}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {record.collectorName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {record.collectorCode}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {record.transactionCount} cash transactions
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {formatDate(record.sessionDate, locale)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right font-medium tabular-nums text-slate-800">
                        {formatCurrency(record.expectedCash, locale)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right font-medium tabular-nums text-slate-800">
                        {formatCurrency(record.countedCash, locale)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <span
                          className={`font-semibold tabular-nums ${
                            variance < 0
                              ? "text-red-700"
                              : variance > 0
                                ? "text-amber-700"
                                : "text-emerald-700"
                          }`}
                        >
                          {variance > 0 ? "+" : ""}
                          {formatCurrency(variance, locale)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right font-medium tabular-nums text-slate-800">
                        {formatCurrency(record.cashSubmitted, locale)}
                      </td>

                      <td className="px-5 py-4">
                        <Badge
                          variant="outline"
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap ${getStatusClasses(record.status)}`}
                        >
                          {getStatusIcon(record.status)}
                          {getStatusLabel(record.status)}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRecord(record)}
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
                {Math.min(currentPage * pageSize, filteredRecords.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-900">
                {filteredRecords.length}
              </span>{" "}
              sessions
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

  {/* Reconciliation details dialog */}
  <Dialog
    open={Boolean(selectedRecord)}
    onOpenChange={(open) => {
      if (!open) setSelectedRecord(null);
    }}
  >
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      {selectedRecord && (
        <>
          <DialogHeader>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-3">
                <FileCheck2 className="h-5 w-5 text-slate-700" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="break-all text-lg">
                  {selectedRecord.reconciliationNumber}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Cash session and reconciliation details
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Variance
                  </p>
                  <p
                    className={`mt-1 text-2xl font-bold tracking-tight ${
                      getVariance(selectedRecord) < 0
                        ? "text-red-700"
                        : getVariance(selectedRecord) > 0
                          ? "text-amber-700"
                          : "text-emerald-700"
                    }`}
                  >
                    {getVariance(selectedRecord) > 0 ? "+" : ""}
                    {formatCurrency(getVariance(selectedRecord), locale)}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className={`flex w-fit items-center gap-1.5 ${getStatusClasses(selectedRecord.status)}`}
                >
                  {getStatusIcon(selectedRecord.status)}
                  {getStatusLabel(selectedRecord.status)}
                </Badge>
              </div>

              <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
                <DetailItem
                  label="Expected Cash"
                  value={formatCurrency(
                    selectedRecord.expectedCash,
                    locale,
                  )}
                />
                <DetailItem
                  label="Counted Cash"
                  value={formatCurrency(
                    selectedRecord.countedCash,
                    locale,
                  )}
                />
                <DetailItem
                  label="Cash Submitted"
                  value={formatCurrency(
                    selectedRecord.cashSubmitted,
                    locale,
                  )}
                />
                <DetailItem
                  label="Opening Cash"
                  value={formatCurrency(
                    selectedRecord.openingCash,
                    locale,
                  )}
                />
              </div>
            </div>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Collection Session
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Collector"
                  value={selectedRecord.collectorName}
                />
                <DetailItem
                  label="Collector Code"
                  value={selectedRecord.collectorCode}
                />
                <DetailItem
                  label="Administrative Unit"
                  value={selectedRecord.administrativeUnit}
                />
                <DetailItem
                  label="Session Date"
                  value={formatDate(selectedRecord.sessionDate, locale)}
                />
                <DetailItem
                  label="Cash Transactions"
                  value={selectedRecord.transactionCount.toLocaleString(
                    locale,
                  )}
                />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Review History
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Submitted At"
                  value={formatDateTime(
                    selectedRecord.submittedAt,
                    locale,
                  )}
                />
                <DetailItem
                  label="Reviewed By"
                  value={selectedRecord.reviewedBy ?? "Not reviewed"}
                />
                <DetailItem
                  label="Reviewed At"
                  value={formatDateTime(
                    selectedRecord.reviewedAt,
                    locale,
                  )}
                />
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">
                Notes
              </h3>
              <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-muted-foreground">
                {selectedRecord.notes || "No notes provided."}
              </p>
            </section>

            {selectedRecord.status === "SHORTAGE" ||
            selectedRecord.status === "OVERAGE" ? (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  This session has a cash discrepancy. It should be
                  investigated and documented before reconciliation is
                  approved.
                </p>
              </div>
            ) : null}

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </>
      )}
    </DialogContent>
  </Dialog>

  {/* Related modules */}
  <div className="grid gap-4 md:grid-cols-2 print:hidden">
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <h3 className="font-semibold text-slate-900">
            Payment Management
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Review cash payments and verify payment completion records.
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
            Review collection totals by revenue category and service.
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
