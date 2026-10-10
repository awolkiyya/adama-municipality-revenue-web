"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
ArrowDownToLine,
ArrowRight,
CalendarDays,
CheckCircle2,
ChevronLeft,
ChevronRight,
ClipboardCheck,
Clock3,
Eye,
FileText,
Filter,
Search,
X,
XCircle,
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

type AssessmentStatus =
| "DRAFT"
| "PENDING_APPROVAL"
| "APPROVED"
| "REJECTED"
| "INVOICED";

type RevenueDomain =
| "TAX"
| "RENT"
| "INVESTMENT"
| "SERVICE"
| "SALE"
| "CAPITAL";

type Assessment = {
id: string;
assessmentNumber: string;
taxpayerName: string;
taxpayerCode: string;
revenueDomain: RevenueDomain;
revenueCategory: string;
revenueService: string;
administrativeUnit: string;
assessmentDate: string;
assessedAmount: number;
status: AssessmentStatus;
assessedBy: string;
reviewedBy?: string;
reviewedAt?: string;
invoiceNumber?: string;
notes?: string;
};

const mockAssessments: Assessment[] = [
{
id: "asmt-001",
assessmentNumber: "ASM-2026-00101",
taxpayerName: "Abebe Bekele",
taxpayerCode: "TP-10021",
revenueDomain: "TAX",
revenueCategory: "Property Tax",
revenueService: "Annual Property Tax",
administrativeUnit: "Bole Subcity",
assessmentDate: "2026-10-01",
assessedAmount: 24500,
status: "INVOICED",
assessedBy: "Mekdes Tadesse",
reviewedBy: "Kebede Girma",
reviewedAt: "2026-10-02",
invoiceNumber: "INV-2026-01001",
},
{
id: "asmt-002",
assessmentNumber: "ASM-2026-00102",
taxpayerName: "Hana Mohammed",
taxpayerCode: "TP-10022",
revenueDomain: "RENT",
revenueCategory: "Land Lease",
revenueService: "Lease Payment",
administrativeUnit: "Wereda 01",
assessmentDate: "2026-10-02",
assessedAmount: 75000,
status: "APPROVED",
assessedBy: "Dawit Kebede",
reviewedBy: "Mekdes Tadesse",
reviewedAt: "2026-10-04",
},
{
id: "asmt-003",
assessmentNumber: "ASM-2026-00103",
taxpayerName: "Adama General Trading",
taxpayerCode: "TP-10023",
revenueDomain: "TAX",
revenueCategory: "Business Tax",
revenueService: "Business Tax Assessment",
administrativeUnit: "Geda Subcity",
assessmentDate: "2026-10-02",
assessedAmount: 120000,
status: "PENDING_APPROVAL",
assessedBy: "Kebede Girma",
notes: "Awaiting review by the revenue decision officer.",
},
{
id: "asmt-004",
assessmentNumber: "ASM-2026-00104",
taxpayerName: "Selamawit Tesfaye",
taxpayerCode: "TP-10024",
revenueDomain: "SERVICE",
revenueCategory: "Municipal Services",
revenueService: "Construction Permit",
administrativeUnit: "Wereda 02",
assessmentDate: "2026-10-03",
assessedAmount: 18500,
status: "DRAFT",
assessedBy: "Meron Fikru",
notes: "Assessment has not yet been submitted for approval.",
},
{
id: "asmt-005",
assessmentNumber: "ASM-2026-00105",
taxpayerName: "Oromia Manufacturing PLC",
taxpayerCode: "TP-10025",
revenueDomain: "TAX",
revenueCategory: "Business Tax",
revenueService: "Annual Business Tax",
administrativeUnit: "Bole Subcity",
assessmentDate: "2026-10-03",
assessedAmount: 250000,
status: "PENDING_APPROVAL",
assessedBy: "Dawit Kebede",
notes: "Pending assessment approval.",
},
{
id: "asmt-006",
assessmentNumber: "ASM-2026-00106",
taxpayerName: "Abdi Ahmed",
taxpayerCode: "TP-10026",
revenueDomain: "RENT",
revenueCategory: "Municipal Property Rent",
revenueService: "Monthly Property Rent",
administrativeUnit: "Wereda 03",
assessmentDate: "2026-10-04",
assessedAmount: 12500,
status: "INVOICED",
assessedBy: "Mekdes Tadesse",
reviewedBy: "Kebede Girma",
reviewedAt: "2026-10-05",
invoiceNumber: "INV-2026-01006",
},
{
id: "asmt-007",
assessmentNumber: "ASM-2026-00107",
taxpayerName: "Biftu Construction",
taxpayerCode: "TP-10027",
revenueDomain: "SERVICE",
revenueCategory: "Municipal Services",
revenueService: "Building Permit",
administrativeUnit: "Geda Subcity",
assessmentDate: "2026-10-04",
assessedAmount: 68000,
status: "REJECTED",
assessedBy: "Meron Fikru",
reviewedBy: "Mekdes Tadesse",
reviewedAt: "2026-10-06",
notes: "Supporting assessment information needs correction.",
},
{
id: "asmt-008",
assessmentNumber: "ASM-2026-00108",
taxpayerName: "Kedir Hassan",
taxpayerCode: "TP-10028",
revenueDomain: "TAX",
revenueCategory: "Property Tax",
revenueService: "Annual Property Tax",
administrativeUnit: "Wereda 01",
assessmentDate: "2026-10-05",
assessedAmount: 32000,
status: "APPROVED",
assessedBy: "Kebede Girma",
reviewedBy: "Mekdes Tadesse",
reviewedAt: "2026-10-06",
},
{
id: "asmt-009",
assessmentNumber: "ASM-2026-00109",
taxpayerName: "Adama Agro Processing",
taxpayerCode: "TP-10029",
revenueDomain: "INVESTMENT",
revenueCategory: "Investment Revenue",
revenueService: "Investment Service Fee",
administrativeUnit: "Bole Subcity",
assessmentDate: "2026-10-05",
assessedAmount: 180000,
status: "INVOICED",
assessedBy: "Dawit Kebede",
reviewedBy: "Kebede Girma",
reviewedAt: "2026-10-06",
invoiceNumber: "INV-2026-01009",
},
{
id: "asmt-010",
assessmentNumber: "ASM-2026-00110",
taxpayerName: "Fatuma Ali",
taxpayerCode: "TP-10030",
revenueDomain: "SALE",
revenueCategory: "Municipal Sales",
revenueService: "Municipal Asset Sale",
administrativeUnit: "Wereda 02",
assessmentDate: "2026-10-06",
assessedAmount: 45000,
status: "PENDING_APPROVAL",
assessedBy: "Meron Fikru",
},
{
id: "asmt-011",
assessmentNumber: "ASM-2026-00111",
taxpayerName: "Tadesse Furniture",
taxpayerCode: "TP-10031",
revenueDomain: "TAX",
revenueCategory: "Business Tax",
revenueService: "Business Tax Assessment",
administrativeUnit: "Geda Subcity",
assessmentDate: "2026-10-06",
assessedAmount: 38500,
status: "APPROVED",
assessedBy: "Kebede Girma",
reviewedBy: "Mekdes Tadesse",
reviewedAt: "2026-10-07",
},
{
id: "asmt-012",
assessmentNumber: "ASM-2026-00112",
taxpayerName: "Netsanet Bekele",
taxpayerCode: "TP-10032",
revenueDomain: "CAPITAL",
revenueCategory: "Capital Revenue",
revenueService: "Capital Fee",
administrativeUnit: "Wereda 03",
assessmentDate: "2026-10-07",
assessedAmount: 22000,
status: "DRAFT",
assessedBy: "Mekdes Tadesse",
},
{
id: "asmt-013",
assessmentNumber: "ASM-2026-00113",
taxpayerName: "Abdi Construction PLC",
taxpayerCode: "TP-10033",
revenueDomain: "SERVICE",
revenueCategory: "Municipal Services",
revenueService: "Construction Permit",
administrativeUnit: "Bole Subcity",
assessmentDate: "2026-10-07",
assessedAmount: 95000,
status: "INVOICED",
assessedBy: "Dawit Kebede",
reviewedBy: "Kebede Girma",
reviewedAt: "2026-10-08",
invoiceNumber: "INV-2026-01013",
},
{
id: "asmt-014",
assessmentNumber: "ASM-2026-00114",
taxpayerName: "Mulugeta Trading",
taxpayerCode: "TP-10034",
revenueDomain: "TAX",
revenueCategory: "Business Tax",
revenueService: "Annual Business Tax",
administrativeUnit: "Wereda 01",
assessmentDate: "2026-10-08",
assessedAmount: 145000,
status: "PENDING_APPROVAL",
assessedBy: "Kebede Girma",
},
{
id: "asmt-015",
assessmentNumber: "ASM-2026-00115",
taxpayerName: "Hirut Gemechu",
taxpayerCode: "TP-10035",
revenueDomain: "RENT",
revenueCategory: "Land Lease",
revenueService: "Lease Payment",
administrativeUnit: "Geda Subcity",
assessmentDate: "2026-10-09",
assessedAmount: 56000,
status: "APPROVED",
assessedBy: "Mekdes Tadesse",
reviewedBy: "Dawit Kebede",
reviewedAt: "2026-10-10",
},
{
id: "asmt-016",
assessmentNumber: "ASM-2026-00116",
taxpayerName: "Abebe and Sons",
taxpayerCode: "TP-10036",
revenueDomain: "TAX",
revenueCategory: "Property Tax",
revenueService: "Annual Property Tax",
administrativeUnit: "Wereda 02",
assessmentDate: "2026-10-09",
assessedAmount: 28500,
status: "REJECTED",
assessedBy: "Meron Fikru",
reviewedBy: "Kebede Girma",
reviewedAt: "2026-10-10",
notes: "Assessment was returned for correction.",
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

function formatDate(value?: string) {
if (!value) return "—";

return new Intl.DateTimeFormat("en-GB", {
day: "2-digit",
month: "short",
year: "numeric",
}).format(new Date(`${value}T00:00:00`));
}

function getStatusBadge(status: AssessmentStatus) {
switch (status) {
case "DRAFT":
return ( <Badge variant="outline">
Draft </Badge>
);

case "PENDING_APPROVAL":
  return (
    <Badge className="border-0 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300">
      Pending approval
    </Badge>
  );

case "APPROVED":
  return (
    <Badge className="border-0 bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300">
      Approved
    </Badge>
  );

case "REJECTED":
  return (
    <Badge variant="destructive">
      Rejected
    </Badge>
  );

case "INVOICED":
  return (
    <Badge className="border-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
      Invoiced
    </Badge>
  );

default:
  return <Badge variant="outline">{status}</Badge>;

}
}

function downloadCSV(rows: Assessment[]) {
const headers = [
"Assessment Number",
"Taxpayer Name",
"Taxpayer Code",
"Revenue Domain",
"Revenue Category",
"Revenue Service",
"Administrative Unit",
"Assessment Date",
"Assessed Amount",
"Status",
"Assessed By",
"Reviewed By",
"Reviewed At",
"Invoice Number",
];

const escapeCSV = (value: string | number | undefined) =>
`"${String(value ?? "").replace(/"/g, '""')}"`;

const csvRows = rows.map((item) => [
item.assessmentNumber,
item.taxpayerName,
item.taxpayerCode,
item.revenueDomain,
item.revenueCategory,
item.revenueService,
item.administrativeUnit,
item.assessmentDate,
item.assessedAmount,
item.status,
item.assessedBy,
item.reviewedBy,
item.reviewedAt,
item.invoiceNumber,
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
link.download = `assessments-report-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

document.body.appendChild(link);
link.click();
link.remove();
URL.revokeObjectURL(url);
}

export default function AssessmentsReportPage() {
const locale = useLocale();

const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("ALL");
const [domainFilter, setDomainFilter] = useState("ALL");
const [unitFilter, setUnitFilter] = useState("ALL");
const [dateFrom, setDateFrom] = useState("");
const [dateTo, setDateTo] = useState("");
const [page, setPage] = useState(1);
const [selectedAssessment, setSelectedAssessment] =
useState<Assessment | null>(null);

const filteredAssessments = useMemo(() => {
const query = search.trim().toLowerCase();

return mockAssessments.filter((assessment) => {
  const matchesSearch =
    !query ||
    assessment.assessmentNumber.toLowerCase().includes(query) ||
    assessment.taxpayerName.toLowerCase().includes(query) ||
    assessment.taxpayerCode.toLowerCase().includes(query) ||
    assessment.revenueCategory.toLowerCase().includes(query) ||
    assessment.revenueService.toLowerCase().includes(query) ||
    assessment.assessedBy.toLowerCase().includes(query) ||
    (assessment.invoiceNumber ?? "").toLowerCase().includes(query);

  const matchesStatus =
    statusFilter === "ALL" || assessment.status === statusFilter;

  const matchesDomain =
    domainFilter === "ALL" ||
    assessment.revenueDomain === domainFilter;

  const matchesUnit =
    unitFilter === "ALL" ||
    assessment.administrativeUnit === unitFilter;

  const matchesDateFrom =
    !dateFrom || assessment.assessmentDate >= dateFrom;

  const matchesDateTo =
    !dateTo || assessment.assessmentDate <= dateTo;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesDomain &&
    matchesUnit &&
    matchesDateFrom &&
    matchesDateTo
  );
});

}, [
search,
statusFilter,
domainFilter,
unitFilter,
dateFrom,
dateTo,
]);

const summary = useMemo(() => {
const totalAssessed = filteredAssessments.reduce(
(sum, assessment) => sum + assessment.assessedAmount,
0,
);

const pending = filteredAssessments.filter(
  (assessment) => assessment.status === "PENDING_APPROVAL",
);

const approved = filteredAssessments.filter(
  (assessment) => assessment.status === "APPROVED",
);

const invoiced = filteredAssessments.filter(
  (assessment) => assessment.status === "INVOICED",
);

const rejected = filteredAssessments.filter(
  (assessment) => assessment.status === "REJECTED",
);

const drafts = filteredAssessments.filter(
  (assessment) => assessment.status === "DRAFT",
);

return {
  totalAssessed,
  totalCount: filteredAssessments.length,
  pendingCount: pending.length,
  pendingAmount: pending.reduce(
    (sum, assessment) => sum + assessment.assessedAmount,
    0,
  ),
  approvedCount: approved.length,
  approvedAmount: approved.reduce(
    (sum, assessment) => sum + assessment.assessedAmount,
    0,
  ),
  invoicedCount: invoiced.length,
  invoicedAmount: invoiced.reduce(
    (sum, assessment) => sum + assessment.assessedAmount,
    0,
  ),
  rejectedCount: rejected.length,
  draftCount: drafts.length,
};

}, [filteredAssessments]);

const totalPages = Math.max(
1,
Math.ceil(filteredAssessments.length / PAGE_SIZE),
);

const paginatedAssessments = filteredAssessments.slice(
(page - 1) * PAGE_SIZE,
page * PAGE_SIZE,
);

const hasActiveFilters =
search !== "" ||
statusFilter !== "ALL" ||
domainFilter !== "ALL" ||
unitFilter !== "ALL" ||
dateFrom !== "" ||
dateTo !== "";

function resetFilters() {
setSearch("");
setStatusFilter("ALL");
setDomainFilter("ALL");
setUnitFilter("ALL");
setDateFrom("");
setDateTo("");
setPage(1);
}

function updateSearch(value: string) {
setSearch(value);
setPage(1);
}

return ( <div className="space-y-6 p-4 md:p-6 lg:p-8">
{/* Header */} <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"> <div className="space-y-2"> <div className="flex items-center gap-2 text-sm text-muted-foreground">
<Link
href={`/${locale}/office/dashboard/reports`}
className="transition-colors hover:text-foreground"
>
Reports </Link> <ChevronRight className="h-4 w-4" /> <span className="font-medium text-foreground">
Assessments </span> </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Assessments Report
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground md:text-base">
          Review assessed revenue, approval progress, rejected assessments,
          and invoice issuance across municipal revenue services.
        </p>
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={resetFilters}
        disabled={!hasActiveFilters}
      >
        Reset filters
      </Button>

      <Button onClick={() => downloadCSV(filteredAssessments)}>
        <ArrowDownToLine className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
    </div>
  </div>

  {/* Demo notice */}
  <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
    <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0" />
    <div>
      <p className="text-sm font-semibold">Demonstration data</p>
      <p className="mt-1 text-sm">
        This report uses mock assessments. Connect it to the Laravel
        assessment API for actual amounts, approval history, and invoice
        references.
      </p>
    </div>
  </div>

  {/* KPI cards */}
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Total assessments
            </p>
            <p className="mt-2 text-2xl font-bold">
              {summary.totalCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Matching records
            </p>
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <FileText className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Total assessed
            </p>
            <p className="mt-2 text-xl font-bold tracking-tight">
              {formatETB(summary.totalAssessed)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Value across filtered records
            </p>
          </div>
          <div className="rounded-lg bg-blue-100 p-2.5 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <ClipboardCheck className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Pending approval
            </p>
            <p className="mt-2 text-2xl font-bold">
              {summary.pendingCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatETB(summary.pendingAmount)} awaiting review
            </p>
          </div>
          <div className="rounded-lg bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Clock3 className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Invoiced assessments
            </p>
            <p className="mt-2 text-2xl font-bold">
              {summary.invoicedCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatETB(summary.invoicedAmount)} assessed value
            </p>
          </div>
          <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>

  {/* Workflow overview */}
  <div className="grid gap-4 md:grid-cols-3">
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Approval progress</CardTitle>
        <CardDescription>
          Assessments awaiting a decision
        </CardDescription>
      </CardHeader>
      <CardContent>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
          onClick={() => {
            setStatusFilter("PENDING_APPROVAL");
            setPage(1);
          }}
        >
          <div>
            <p className="text-sm font-medium">Pending approval</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatETB(summary.pendingAmount)}
            </p>
          </div>
          <Badge className="border-0 bg-amber-100 text-amber-800 hover:bg-amber-100">
            {summary.pendingCount}
          </Badge>
        </button>
        <button
          type="button"
          className="mt-2 flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
          onClick={() => {
            setStatusFilter("APPROVED");
            setPage(1);
          }}
        >
          <div>
            <p className="text-sm font-medium">Approved</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatETB(summary.approvedAmount)}
            </p>
          </div>
          <Badge variant="secondary">{summary.approvedCount}</Badge>
        </button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Invoice issuance</CardTitle>
        <CardDescription>
          Approved assessments converted to invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
          onClick={() => {
            setStatusFilter("INVOICED");
            setPage(1);
          }}
        >
          <div>
            <p className="text-sm font-medium">Invoiced</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatETB(summary.invoicedAmount)}
            </p>
          </div>
          <Badge className="border-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            {summary.invoicedCount}
          </Badge>
        </button>

        <p className="mt-3 text-xs text-muted-foreground">
          Only assessments with an issued invoice should be treated as
          invoiced in the production report.
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Items requiring attention</CardTitle>
        <CardDescription>
          Drafts and rejected assessments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
          onClick={() => {
            setStatusFilter("DRAFT");
            setPage(1);
          }}
        >
          <span className="text-sm font-medium">Draft assessments</span>
          <Badge variant="outline">{summary.draftCount}</Badge>
        </button>

        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
          onClick={() => {
            setStatusFilter("REJECTED");
            setPage(1);
          }}
        >
          <span className="text-sm font-medium">Rejected assessments</span>
          <Badge variant="destructive">{summary.rejectedCount}</Badge>
        </button>
      </CardContent>
    </Card>
  </div>

  {/* Filters */}
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <Filter className="h-5 w-5" />
        Filter assessments
      </CardTitle>
      <CardDescription>
        Search by assessment, taxpayer, revenue service, or invoice number.
      </CardDescription>
    </CardHeader>

    <CardContent className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search assessments..."
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
            <SelectValue placeholder="Assessment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PENDING_APPROVAL">
              Pending approval
            </SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="INVOICED">Invoiced</SelectItem>
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
            aria-label="Assessment date from"
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
            aria-label="Assessment date to"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {filteredAssessments.length}
          </span>{" "}
          matching assessments
        </p>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
          >
            Clear all filters
            <X className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </CardContent>
  </Card>

  {/* Assessments table */}
  <Card>
    <CardHeader>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Assessment records</CardTitle>
          <CardDescription className="mt-1">
            Assessed amounts and workflow status for each taxpayer.
          </CardDescription>
        </div>
        <Badge variant="outline">
          {filteredAssessments.length} records
        </Badge>
      </div>
    </CardHeader>

    <CardContent>
      {paginatedAssessments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-semibold">
            No assessments found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Change your filters or clear them to see more records.
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
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">
                    Assessment / Taxpayer
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Revenue service
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Administrative unit
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Assessment date
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Assessed amount
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Assessed by
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedAssessments.map((assessment) => (
                  <tr
                    key={assessment.id}
                    className="border-b last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold">
                        {assessment.assessmentNumber}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {assessment.taxpayerName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {assessment.taxpayerCode}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium">
                        {assessment.revenueCategory}
                      </p>
                      <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
                        {assessment.revenueService}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {assessment.revenueDomain}
                      </Badge>
                    </td>

                    <td className="px-4 py-4">
                      {assessment.administrativeUnit}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      {formatDate(assessment.assessmentDate)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-right font-semibold">
                      {formatETB(assessment.assessedAmount)}
                    </td>

                    <td className="px-4 py-4">
                      {assessment.assessedBy}
                    </td>

                    <td className="px-4 py-4">
                      {getStatusBadge(assessment.status)}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAssessment(assessment)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(page * PAGE_SIZE, filteredAssessments.length)} of{" "}
              {filteredAssessments.length} assessments
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
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
                  setPage((current) =>
                    Math.min(totalPages, current + 1),
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

  {/* Assessment details */}
  <Dialog
    open={selectedAssessment !== null}
    onOpenChange={(open) => {
      if (!open) setSelectedAssessment(null);
    }}
  >
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      {selectedAssessment && (
        <>
          <DialogHeader>
            <DialogTitle>Assessment details</DialogTitle>
            <DialogDescription>
              {selectedAssessment.assessmentNumber} ·{" "}
              {selectedAssessment.taxpayerName}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            {getStatusBadge(selectedAssessment.status)}
            <Badge variant="outline">
              {selectedAssessment.revenueDomain}
            </Badge>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">
                Assessment number
              </p>
              <p className="mt-1 font-semibold">
                {selectedAssessment.assessmentNumber}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Assessment date
              </p>
              <p className="mt-1 font-semibold">
                {formatDate(selectedAssessment.assessmentDate)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Taxpayer
              </p>
              <p className="mt-1 font-semibold">
                {selectedAssessment.taxpayerName}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedAssessment.taxpayerCode}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Administrative unit
              </p>
              <p className="mt-1 font-semibold">
                {selectedAssessment.administrativeUnit}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Revenue category
              </p>
              <p className="mt-1 font-semibold">
                {selectedAssessment.revenueCategory}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Revenue service
              </p>
              <p className="mt-1 font-semibold">
                {selectedAssessment.revenueService}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Assessed by
              </p>
              <p className="mt-1 font-semibold">
                {selectedAssessment.assessedBy}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Reviewed by
              </p>
              <p className="mt-1 font-semibold">
                {selectedAssessment.reviewedBy ?? "Not reviewed"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Review date
              </p>
              <p className="mt-1 font-semibold">
                {formatDate(selectedAssessment.reviewedAt)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Invoice reference
              </p>
              {selectedAssessment.invoiceNumber ? (
                <Link
                  href={`/${locale}/office/dashboard/invoices`}
                  className="mt-1 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  {selectedAssessment.invoiceNumber}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <p className="mt-1 font-semibold text-muted-foreground">
                  No invoice linked
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              Assessed amount
            </p>
            <p className="mt-1 text-2xl font-bold">
              {formatETB(selectedAssessment.assessedAmount)}
            </p>
          </div>

          {selectedAssessment.notes && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-semibold">
                Assessment notes
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedAssessment.notes}
              </p>
            </div>
          )}

          {selectedAssessment.status === "REJECTED" && (
            <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <XCircle className="h-4 w-4 shrink-0 text-destructive" />
              <p>
                This assessment was rejected. Review the recorded reason
                and supporting information before any resubmission.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setSelectedAssessment(null)}
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
    <div>
      <p className="text-sm font-medium">Assessment workflow</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Assessment amounts become collectible through the invoice issuance
        process defined by your backend workflow.
      </p>
    </div>

    <Button variant="outline" asChild>
      <Link href={`/${locale}/office/dashboard/invoices`}>
        View invoices
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  </div>
</div>

);
}
