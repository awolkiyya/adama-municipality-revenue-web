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
CircleDollarSign,
Clock3,
CreditCard,
Eye,
FileText,
Filter,
Landmark,
Loader2,
RefreshCcw,
Search,
ShieldAlert,
Smartphone,
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

type PaymentStatus =
| "PENDING"
| "PROCESSING"
| "COMPLETED"
| "FAILED"
| "CANCELLED"
| "EXPIRED";

type PaymentMethod = "CASH" | "BANK_TRANSFER" | "ONLINE";

type PaymentProvider = "CASH" | "CBE" | "TELEBIRR" | "CHAPA";

type PaymentSource = "ASSESSMENT" | "DIRECT_COLLECTION";

type PaymentRecord = {
id: string;
paymentNumber: string;
receiptNumber: string | null;
invoiceNumber: string;
taxpayerName: string;
taxpayerTin: string;
revenueCategory: string;
revenueService: string;
administrativeUnit: string;
source: PaymentSource;
method: PaymentMethod;
provider: PaymentProvider;
amount: number;
currency: "ETB";
status: PaymentStatus;
transactionReference: string | null;
bankReference: string | null;
createdAt: string;
completedAt: string | null;
receivedBy: string | null;
description: string;
};

type StatusFilter = "ALL" | PaymentStatus;
type MethodFilter = "ALL" | PaymentMethod;

const DEMO_PAYMENTS: PaymentRecord[] = [
{
id: "pay-1001",
paymentNumber: "PAY-2026-00101",
receiptNumber: "RCT-2026-00081",
invoiceNumber: "INV-2026-00321",
taxpayerName: "Abebe Kebede",
taxpayerTin: "TIN-100245781",
revenueCategory: "Property Tax",
revenueService: "Property Tax Assessment",
administrativeUnit: "Bole Subcity",
source: "ASSESSMENT",
method: "CASH",
provider: "CASH",
amount: 48500,
currency: "ETB",
status: "COMPLETED",
transactionReference: null,
bankReference: null,
createdAt: "2026-10-10T09:15:00",
completedAt: "2026-10-10T09:18:00",
receivedBy: "Meron Tesfaye",
description: "Payment against an issued property tax invoice.",
},
{
id: "pay-1002",
paymentNumber: "PAY-2026-00102",
receiptNumber: null,
invoiceNumber: "INV-2026-00322",
taxpayerName: "Hana Mohammed",
taxpayerTin: "TIN-100245782",
revenueCategory: "Land Lease",
revenueService: "Land Lease Installment",
administrativeUnit: "Wereda 02",
source: "ASSESSMENT",
method: "BANK_TRANSFER",
provider: "CBE",
amount: 185000,
currency: "ETB",
status: "PENDING",
transactionReference: null,
bankReference: "CBE-TR-883120",
createdAt: "2026-10-10T10:30:00",
completedAt: null,
receivedBy: null,
description: "Bank transfer awaiting finance verification.",
},
{
id: "pay-1003",
paymentNumber: "PAY-2026-00103",
receiptNumber: "RCT-2026-00082",
invoiceNumber: "INV-2026-00323",
taxpayerName: "Abdi Nuru",
taxpayerTin: "TIN-100245783",
revenueCategory: "Business Tax",
revenueService: "Business License Renewal",
administrativeUnit: "Geda Subcity",
source: "ASSESSMENT",
method: "ONLINE",
provider: "TELEBIRR",
amount: 12500,
currency: "ETB",
status: "COMPLETED",
transactionReference: "TB-20261010-78001",
bankReference: null,
createdAt: "2026-10-10T11:05:00",
completedAt: "2026-10-10T11:06:00",
receivedBy: null,
description: "Digital payment confirmed by the payment provider.",
},
{
id: "pay-1004",
paymentNumber: "PAY-2026-00104",
receiptNumber: null,
invoiceNumber: "INV-2026-00324",
taxpayerName: "Selamawit Bekele",
taxpayerTin: "TIN-100245784",
revenueCategory: "Municipal Services",
revenueService: "Construction Permit Fee",
administrativeUnit: "Wereda 01",
source: "ASSESSMENT",
method: "ONLINE",
provider: "CHAPA",
amount: 32000,
currency: "ETB",
status: "PROCESSING",
transactionReference: "CHAPA-TX-410201",
bankReference: null,
createdAt: "2026-10-10T12:10:00",
completedAt: null,
receivedBy: null,
description: "Online payment initialized; awaiting provider confirmation.",
},
{
id: "pay-1005",
paymentNumber: "PAY-2026-00105",
receiptNumber: "RCT-2026-00083",
invoiceNumber: "INV-2026-00325",
taxpayerName: "Dawit Girma",
taxpayerTin: "TIN-100245785",
revenueCategory: "Market Rent",
revenueService: "Market Stall Collection",
administrativeUnit: "Wereda 03",
source: "DIRECT_COLLECTION",
method: "CASH",
provider: "CASH",
amount: 4500,
currency: "ETB",
status: "COMPLETED",
transactionReference: null,
bankReference: null,
createdAt: "2026-10-09T08:40:00",
completedAt: "2026-10-09T08:42:00",
receivedBy: "Kebede Alemu",
description: "Direct collection for a municipal market stall.",
},
{
id: "pay-1006",
paymentNumber: "PAY-2026-00106",
receiptNumber: null,
invoiceNumber: "INV-2026-00326",
taxpayerName: "Fatuma Ali",
taxpayerTin: "TIN-100245786",
revenueCategory: "Land Lease",
revenueService: "Land Lease Installment",
administrativeUnit: "Bole Subcity",
source: "ASSESSMENT",
method: "BANK_TRANSFER",
provider: "CBE",
amount: 275000,
currency: "ETB",
status: "PENDING",
transactionReference: null,
bankReference: "CBE-TR-883121",
createdAt: "2026-10-09T09:20:00",
completedAt: null,
receivedBy: null,
description: "Transfer evidence submitted for verification.",
},
{
id: "pay-1007",
paymentNumber: "PAY-2026-00107",
receiptNumber: null,
invoiceNumber: "INV-2026-00327",
taxpayerName: "Mekonnen Tadesse",
taxpayerTin: "TIN-100245787",
revenueCategory: "Property Tax",
revenueService: "Property Tax Assessment",
administrativeUnit: "Wereda 01",
source: "ASSESSMENT",
method: "ONLINE",
provider: "TELEBIRR",
amount: 27500,
currency: "ETB",
status: "FAILED",
transactionReference: "TB-20261009-78002",
bankReference: null,
createdAt: "2026-10-09T13:15:00",
completedAt: null,
receivedBy: null,
description: "The payment provider returned an unsuccessful result.",
},
{
id: "pay-1008",
paymentNumber: "PAY-2026-00108",
receiptNumber: "RCT-2026-00084",
invoiceNumber: "INV-2026-00328",
taxpayerName: "Rahel Worku",
taxpayerTin: "TIN-100245788",
revenueCategory: "Business Tax",
revenueService: "Business License Renewal",
administrativeUnit: "Geda Subcity",
source: "ASSESSMENT",
method: "CASH",
provider: "CASH",
amount: 18000,
currency: "ETB",
status: "COMPLETED",
transactionReference: null,
bankReference: null,
createdAt: "2026-10-08T10:10:00",
completedAt: "2026-10-08T10:12:00",
receivedBy: "Meron Tesfaye",
description: "Cash payment against an issued business tax invoice.",
},
{
id: "pay-1009",
paymentNumber: "PAY-2026-00109",
receiptNumber: "RCT-2026-00085",
invoiceNumber: "INV-2026-00329",
taxpayerName: "Omar Hassan",
taxpayerTin: "TIN-100245789",
revenueCategory: "Municipal Services",
revenueService: "Construction Permit Fee",
administrativeUnit: "Bole Subcity",
source: "ASSESSMENT",
method: "ONLINE",
provider: "CHAPA",
amount: 42000,
currency: "ETB",
status: "COMPLETED",
transactionReference: "CHAPA-TX-410202",
bankReference: null,
createdAt: "2026-10-08T14:20:00",
completedAt: "2026-10-08T14:21:00",
receivedBy: null,
description: "Online payment confirmed by the payment provider.",
},
{
id: "pay-1010",
paymentNumber: "PAY-2026-00110",
receiptNumber: null,
invoiceNumber: "INV-2026-00330",
taxpayerName: "Tigist Fikru",
taxpayerTin: "TIN-100245790",
revenueCategory: "Land Lease",
revenueService: "Land Lease Installment",
administrativeUnit: "Wereda 02",
source: "ASSESSMENT",
method: "BANK_TRANSFER",
provider: "CBE",
amount: 210000,
currency: "ETB",
status: "PROCESSING",
transactionReference: null,
bankReference: "CBE-TR-883122",
createdAt: "2026-10-07T11:45:00",
completedAt: null,
receivedBy: null,
description: "Transfer received and awaiting verification.",
},
{
id: "pay-1011",
paymentNumber: "PAY-2026-00111",
receiptNumber: "RCT-2026-00086",
invoiceNumber: "INV-2026-00331",
taxpayerName: "Gemechu Bekele",
taxpayerTin: "TIN-100245791",
revenueCategory: "Market Rent",
revenueService: "Market Stall Collection",
administrativeUnit: "Wereda 03",
source: "DIRECT_COLLECTION",
method: "CASH",
provider: "CASH",
amount: 6500,
currency: "ETB",
status: "COMPLETED",
transactionReference: null,
bankReference: null,
createdAt: "2026-10-06T08:35:00",
completedAt: "2026-10-06T08:37:00",
receivedBy: "Kebede Alemu",
description: "Direct collection for municipal market rent.",
},
{
id: "pay-1012",
paymentNumber: "PAY-2026-00112",
receiptNumber: null,
invoiceNumber: "INV-2026-00332",
taxpayerName: "Mimi Tesfaye",
taxpayerTin: "TIN-100245792",
revenueCategory: "Property Tax",
revenueService: "Property Tax Assessment",
administrativeUnit: "Geda Subcity",
source: "ASSESSMENT",
method: "ONLINE",
provider: "TELEBIRR",
amount: 15500,
currency: "ETB",
status: "CANCELLED",
transactionReference: "TB-20261006-78003",
bankReference: null,
createdAt: "2026-10-06T15:05:00",
completedAt: null,
receivedBy: null,
description: "Payment attempt cancelled before completion.",
},
{
id: "pay-1013",
paymentNumber: "PAY-2026-00113",
receiptNumber: "RCT-2026-00087",
invoiceNumber: "INV-2026-00333",
taxpayerName: "Biruk Workneh",
taxpayerTin: "TIN-100245793",
revenueCategory: "Business Tax",
revenueService: "Business License Renewal",
administrativeUnit: "Wereda 01",
source: "ASSESSMENT",
method: "BANK_TRANSFER",
provider: "CBE",
amount: 36500,
currency: "ETB",
status: "COMPLETED",
transactionReference: null,
bankReference: "CBE-TR-883100",
createdAt: "2026-09-28T09:40:00",
completedAt: "2026-09-28T14:30:00",
receivedBy: "Finance Verification",
description: "Bank transfer verified and posted.",
},
{
id: "pay-1014",
paymentNumber: "PAY-2026-00114",
receiptNumber: "RCT-2026-00088",
invoiceNumber: "INV-2026-00334",
taxpayerName: "Hirut Alemu",
taxpayerTin: "TIN-100245794",
revenueCategory: "Land Lease",
revenueService: "Land Lease Installment",
administrativeUnit: "Bole Subcity",
source: "ASSESSMENT",
method: "ONLINE",
provider: "CHAPA",
amount: 320000,
currency: "ETB",
status: "COMPLETED",
transactionReference: "CHAPA-TX-409910",
bankReference: null,
createdAt: "2026-09-25T10:00:00",
completedAt: "2026-09-25T10:01:00",
receivedBy: null,
description: "Lease installment payment confirmed online.",
},
{
id: "pay-1015",
paymentNumber: "PAY-2026-00115",
receiptNumber: null,
invoiceNumber: "INV-2026-00335",
taxpayerName: "Netsanet Abebe",
taxpayerTin: "TIN-100245795",
revenueCategory: "Property Tax",
revenueService: "Property Tax Assessment",
administrativeUnit: "Wereda 02",
source: "ASSESSMENT",
method: "BANK_TRANSFER",
provider: "CBE",
amount: 28500,
currency: "ETB",
status: "PENDING",
transactionReference: null,
bankReference: "CBE-TR-882990",
createdAt: "2026-09-22T13:30:00",
completedAt: null,
receivedBy: null,
description: "Bank transfer awaiting verification.",
},
{
id: "pay-1016",
paymentNumber: "PAY-2026-00116",
receiptNumber: "RCT-2026-00089",
invoiceNumber: "INV-2026-00336",
taxpayerName: "Abdisa Jibril",
taxpayerTin: "TIN-100245796",
revenueCategory: "Municipal Services",
revenueService: "Construction Permit Fee",
administrativeUnit: "Geda Subcity",
source: "ASSESSMENT",
method: "CASH",
provider: "CASH",
amount: 24000,
currency: "ETB",
status: "COMPLETED",
transactionReference: null,
bankReference: null,
createdAt: "2026-08-18T09:10:00",
completedAt: "2026-08-18T09:12:00",
receivedBy: "Meron Tesfaye",
description: "Cash payment for a construction permit.",
},
{
id: "pay-1017",
paymentNumber: "PAY-2026-00117",
receiptNumber: "RCT-2026-00090",
invoiceNumber: "INV-2026-00337",
taxpayerName: "Saron Bekele",
taxpayerTin: "TIN-100245797",
revenueCategory: "Land Lease",
revenueService: "Land Lease Installment",
administrativeUnit: "Bole Subcity",
source: "ASSESSMENT",
method: "BANK_TRANSFER",
provider: "CBE",
amount: 240000,
currency: "ETB",
status: "COMPLETED",
transactionReference: null,
bankReference: "CBE-TR-882700",
createdAt: "2026-07-15T10:15:00",
completedAt: "2026-07-15T15:30:00",
receivedBy: "Finance Verification",
description: "Verified land lease installment transfer.",
},
{
id: "pay-1018",
paymentNumber: "PAY-2026-00118",
receiptNumber: "RCT-2026-00091",
invoiceNumber: "INV-2026-00338",
taxpayerName: "Tadesse Girma",
taxpayerTin: "TIN-100245798",
revenueCategory: "Business Tax",
revenueService: "Business License Renewal",
administrativeUnit: "Wereda 01",
source: "ASSESSMENT",
method: "ONLINE",
provider: "TELEBIRR",
amount: 14200,
currency: "ETB",
status: "COMPLETED",
transactionReference: "TB-20260620-77001",
bankReference: null,
createdAt: "2026-06-20T11:00:00",
completedAt: "2026-06-20T11:01:00",
receivedBy: null,
description: "Business license renewal payment.",
},
{
id: "pay-1019",
paymentNumber: "PAY-2026-00119",
receiptNumber: "RCT-2026-00092",
invoiceNumber: "INV-2026-00339",
taxpayerName: "Fikre Lemma",
taxpayerTin: "TIN-100245799",
revenueCategory: "Market Rent",
revenueService: "Market Stall Collection",
administrativeUnit: "Wereda 03",
source: "DIRECT_COLLECTION",
method: "CASH",
provider: "CASH",
amount: 5200,
currency: "ETB",
status: "COMPLETED",
transactionReference: null,
bankReference: null,
createdAt: "2026-05-12T08:25:00",
completedAt: "2026-05-12T08:28:00",
receivedBy: "Kebede Alemu",
description: "Direct market rent collection.",
},
{
id: "pay-1020",
paymentNumber: "PAY-2026-00120",
receiptNumber: null,
invoiceNumber: "INV-2026-00340",
taxpayerName: "Mulugeta Tola",
taxpayerTin: "TIN-100245800",
revenueCategory: "Property Tax",
revenueService: "Property Tax Assessment",
administrativeUnit: "Geda Subcity",
source: "ASSESSMENT",
method: "ONLINE",
provider: "CHAPA",
amount: 21500,
currency: "ETB",
status: "EXPIRED",
transactionReference: "CHAPA-TX-409001",
bankReference: null,
createdAt: "2026-05-08T14:10:00",
completedAt: null,
receivedBy: null,
description: "Online payment session expired before payment.",
},
];

const PAYMENT_METHODS: { value: MethodFilter; label: string }[] = [
{ value: "ALL", label: "All methods" },
{ value: "CASH", label: "Cash" },
{ value: "BANK_TRANSFER", label: "Bank transfer" },
{ value: "ONLINE", label: "Online payment" },
];

const PAYMENT_STATUSES: { value: StatusFilter; label: string }[] = [
{ value: "ALL", label: "All statuses" },
{ value: "PENDING", label: "Pending" },
{ value: "PROCESSING", label: "Processing" },
{ value: "COMPLETED", label: "Completed" },
{ value: "FAILED", label: "Failed" },
{ value: "CANCELLED", label: "Cancelled" },
{ value: "EXPIRED", label: "Expired" },
];

const PAYMENT_REPORT_ROUTE = "/office/dashboard/payment-report";

function formatCurrency(amount: number, locale: string) {
return new Intl.NumberFormat(locale, {
style: "currency",
currency: "ETB",
maximumFractionDigits: 2,
}).format(amount);
}

function formatDate(value: string | null, locale: string) {
if (!value) return "—";

const date = new Date(value);

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

function getMethodLabel(method: PaymentMethod) {
switch (method) {
case "CASH":
return "Cash";
case "BANK_TRANSFER":
return "Bank transfer";
case "ONLINE":
return "Online payment";
}
}

function getProviderLabel(provider: PaymentProvider) {
switch (provider) {
case "CASH":
return "Cash";
case "CBE":
return "Commercial Bank of Ethiopia";
case "TELEBIRR":
return "Telebirr";
case "CHAPA":
return "Chapa";
}
}

function getStatusClasses(status: PaymentStatus) {
switch (status) {
case "COMPLETED":
return "border-emerald-200 bg-emerald-50 text-emerald-700";
case "PENDING":
return "border-amber-200 bg-amber-50 text-amber-700";
case "PROCESSING":
return "border-blue-200 bg-blue-50 text-blue-700";
case "FAILED":
return "border-red-200 bg-red-50 text-red-700";
case "CANCELLED":
return "border-slate-200 bg-slate-100 text-slate-700";
case "EXPIRED":
return "border-orange-200 bg-orange-50 text-orange-700";
}
}

function StatusIcon({ status }: { status: PaymentStatus }) {
switch (status) {
case "COMPLETED":
return <CheckCircle2 className="h-3.5 w-3.5" />;
case "PENDING":
return <Clock3 className="h-3.5 w-3.5" />;
case "PROCESSING":
return <Loader2 className="h-3.5 w-3.5" />;
case "FAILED":
return <XCircle className="h-3.5 w-3.5" />;
case "CANCELLED":
return <X className="h-3.5 w-3.5" />;
case "EXPIRED":
return <ShieldAlert className="h-3.5 w-3.5" />;
}
}

function MethodIcon({ method }: { method: PaymentMethod }) {
switch (method) {
case "CASH":
return <Banknote className="h-4 w-4" />;
case "BANK_TRANSFER":
return <Landmark className="h-4 w-4" />;
case "ONLINE":
return <Smartphone className="h-4 w-4" />;
}
}

export default function PaymentsPage() {
const locale = useLocale();

const [search, setSearch] = useState("");
const [methodFilter, setMethodFilter] = useState<MethodFilter>("ALL");
const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
const [startDate, setStartDate] = useState("2026-05-01");
const [endDate, setEndDate] = useState("2026-10-10");
const [page, setPage] = useState(1);
const [selectedPayment, setSelectedPayment] =
useState<PaymentRecord | null>(null);

const pageSize = 8;

const filteredPayments = useMemo(() => {
const normalizedSearch = search.trim().toLowerCase();


return DEMO_PAYMENTS.filter((payment) => {
  const paymentDate = payment.createdAt.slice(0, 10);

  const matchesSearch =
    !normalizedSearch ||
    [
      payment.paymentNumber,
      payment.receiptNumber,
      payment.invoiceNumber,
      payment.taxpayerName,
      payment.taxpayerTin,
      payment.revenueCategory,
      payment.revenueService,
      payment.administrativeUnit,
      payment.transactionReference,
      payment.bankReference,
    ]
      .filter(Boolean)
      .some((value) =>
        String(value).toLowerCase().includes(normalizedSearch),
      );

  const matchesMethod =
    methodFilter === "ALL" || payment.method === methodFilter;

  const matchesStatus =
    statusFilter === "ALL" || payment.status === statusFilter;

  const matchesStartDate = !startDate || paymentDate >= startDate;
  const matchesEndDate = !endDate || paymentDate <= endDate;

  return (
    matchesSearch &&
    matchesMethod &&
    matchesStatus &&
    matchesStartDate &&
    matchesEndDate
  );
}).sort((a, b) => b.createdAt.localeCompare(a.createdAt));


}, [search, methodFilter, statusFilter, startDate, endDate]);

const summary = useMemo(() => {
const completed = filteredPayments.filter(
(payment) => payment.status === "COMPLETED",
);


const pending = filteredPayments.filter(
  (payment) => payment.status === "PENDING",
);

const processing = filteredPayments.filter(
  (payment) => payment.status === "PROCESSING",
);

const unsuccessful = filteredPayments.filter((payment) =>
  ["FAILED", "CANCELLED", "EXPIRED"].includes(payment.status),
);

return {
  totalPayments: filteredPayments.length,
  completedCount: completed.length,
  pendingCount: pending.length,
  processingCount: processing.length,
  unsuccessfulCount: unsuccessful.length,
  completedAmount: completed.reduce(
    (total, payment) => total + payment.amount,
    0,
  ),
  pendingAmount: pending.reduce(
    (total, payment) => total + payment.amount,
    0,
  ),
  processingAmount: processing.reduce(
    (total, payment) => total + payment.amount,
    0,
  ),
};


}, [filteredPayments]);

const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
const currentPage = Math.min(page, totalPages);

const paginatedPayments = filteredPayments.slice(
(currentPage - 1) * pageSize,
currentPage * pageSize,
);

const resetFilters = () => {
setSearch("");
setMethodFilter("ALL");
setStatusFilter("ALL");
setStartDate("2026-05-01");
setEndDate("2026-10-10");
setPage(1);
};

const handleExportCsv = () => {
const headers = [
"Payment Number",
"Receipt Number",
"Invoice Number",
"Taxpayer",
"Taxpayer TIN",
"Revenue Category",
"Revenue Service",
"Administrative Unit",
"Source",
"Payment Method",
"Provider",
"Amount ETB",
"Status",
"Transaction Reference",
"Bank Reference",
"Created At",
"Completed At",
"Received By",
];


const escapeCsv = (value: unknown) => {
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const rows = filteredPayments.map((payment) => [
  payment.paymentNumber,
  payment.receiptNumber,
  payment.invoiceNumber,
  payment.taxpayerName,
  payment.taxpayerTin,
  payment.revenueCategory,
  payment.revenueService,
  payment.administrativeUnit,
  payment.source,
  payment.method,
  payment.provider,
  payment.amount,
  payment.status,
  payment.transactionReference,
  payment.bankReference,
  payment.createdAt,
  payment.completedAt,
  payment.receivedBy,
]);

const csv = [headers, ...rows]
  .map((row) => row.map(escapeCsv).join(","))
  .join("\r\n");

const blob = new Blob(["\uFEFF", csv], {
  type: "text/csv;charset=utf-8;",
});

const url = URL.createObjectURL(blob);
const link = document.createElement("a");

link.href = url;
link.download = `municipal-payments-${startDate || "all"}-to-${endDate || "all"}.csv`;
document.body.appendChild(link);
link.click();
link.remove();

URL.revokeObjectURL(url);


};

const paymentReportHref = `/${locale}${PAYMENT_REPORT_ROUTE}`;

return ( <div className="min-h-screen space-y-6 bg-slate-50/70 p-4 md:p-6 lg:p-8">
{/* Header */} <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"> <div className="space-y-2"> <div className="flex items-center gap-2 text-sm text-muted-foreground">
<Link
href={`/${locale}/office/dashboard/reports`}
className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
> <ArrowLeft className="h-4 w-4" />
Reports </Link> <span>/</span> <span className="text-foreground">Payments</span> </div>


      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Payments Management
          </h1>
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-700"
          >
            Demonstration Data
          </Badge>
        </div>

        <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
          Review payment records, monitor payment status, and track cash,
          bank transfer, and digital payments against municipal invoices.
        </p>
      </div>
    </div>

    <div className="flex flex-wrap gap-2 print:hidden">
      <Button variant="outline" onClick={handleExportCsv}>
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
      <p className="font-semibold">Sample payment records</p>
      <p className="mt-1 text-amber-800">
        These figures are simulated for interface development. They are not
        actual municipal financial records and are not connected to your
        Laravel API.
      </p>
    </div>
  </div>

  {/* KPI cards */}
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Completed Payments
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {summary.completedCount.toLocaleString(locale)}
          </p>
          <p className="text-xs text-muted-foreground">
            Successfully completed records
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
            Amount Collected
          </p>
          <p className="text-xl font-bold tracking-tight text-slate-900">
            {formatCurrency(summary.completedAmount, locale)}
          </p>
          <p className="text-xs text-muted-foreground">
            Completed payments only
          </p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
          <CircleDollarSign className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>

    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Pending Verification
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {summary.pendingCount.toLocaleString(locale)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(summary.pendingAmount, locale)} awaiting
            verification
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
          <Clock3 className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>

    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Processing Payments
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {summary.processingCount.toLocaleString(locale)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(summary.processingAmount, locale)} processing
          </p>
        </div>
        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
          <RefreshCcw className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
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
            <CardTitle className="text-base">Filter Payments</CardTitle>
            <CardDescription className="mt-1">
              Search payment records and narrow the results.
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
              placeholder="Payment, invoice, taxpayer, TIN..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Payment Method</label>
          <Select
            value={methodFilter}
            onValueChange={(value) => {
              setMethodFilter(value as MethodFilter);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All methods" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Payment Status</label>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as StatusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
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

  {/* Payment table */}
  <Card className="overflow-hidden border-slate-200 shadow-sm">
    <CardHeader className="border-b border-slate-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Payment Records</CardTitle>
          <CardDescription className="mt-1">
            Payment transactions linked to municipal invoices and direct
            collection.
          </CardDescription>
        </div>

        <Badge variant="outline" className="w-fit">
          {filteredPayments.length.toLocaleString(locale)} records
        </Badge>
      </div>
    </CardHeader>

    <CardContent className="p-0">
      {filteredPayments.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-4 rounded-full bg-slate-100 p-4">
            <Search className="h-6 w-6 text-slate-500" />
          </div>
          <h3 className="font-semibold text-slate-900">
            No payments found
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            No payment records match your current search and filter
            criteria. Try changing the dates or resetting the filters.
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
                  <th className="px-5 py-4 font-semibold">Payment</th>
                  <th className="px-5 py-4 font-semibold">Taxpayer</th>
                  <th className="px-5 py-4 font-semibold">
                    Revenue Service
                  </th>
                  <th className="px-5 py-4 font-semibold">Method</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Amount
                  </th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {payment.paymentNumber}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Invoice: {payment.invoiceNumber}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {payment.receiptNumber
                          ? `Receipt: ${payment.receiptNumber}`
                          : "Receipt not issued"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {payment.taxpayerName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {payment.taxpayerTin}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {payment.administrativeUnit}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {payment.revenueService}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {payment.revenueCategory}
                      </p>
                      <Badge
                        variant="outline"
                        className="mt-2 text-[10px] font-medium"
                      >
                        {payment.source === "ASSESSMENT"
                          ? "Invoice payment"
                          : "Direct collection"}
                      </Badge>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600">
                          <MethodIcon method={payment.method} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {getMethodLabel(payment.method)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {payment.provider === "CASH"
                              ? "In person"
                              : payment.provider}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <p className="font-semibold tabular-nums text-slate-900">
                        {formatCurrency(payment.amount, locale)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap text-slate-800">
                        {formatDate(payment.createdAt, locale)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(payment.createdAt))}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <Badge
                        variant="outline"
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap ${getStatusClasses(payment.status)}`}
                      >
                        <StatusIcon status={payment.status} />
                        {payment.status.charAt(0) +
                          payment.status.slice(1).toLowerCase()}
                      </Badge>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <Eye className="mr-2 h-3.5 w-3.5" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
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
                {Math.min(currentPage * pageSize, filteredPayments.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-900">
                {filteredPayments.length}
              </span>{" "}
              payments
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((previous) => Math.max(1, previous - 1))}
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
                  setPage((previous) => Math.min(totalPages, previous + 1))
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

  {/* Payment details dialog */}
  <Dialog
    open={Boolean(selectedPayment)}
    onOpenChange={(open) => {
      if (!open) setSelectedPayment(null);
    }}
  >
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      {selectedPayment && (
        <>
          <DialogHeader>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-3">
                <CreditCard className="h-5 w-5 text-slate-700" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="break-all text-lg">
                  {selectedPayment.paymentNumber}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Payment record details
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Payment amount
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    {formatCurrency(selectedPayment.amount, locale)}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className={`flex w-fit items-center gap-1.5 ${getStatusClasses(selectedPayment.status)}`}
                >
                  <StatusIcon status={selectedPayment.status} />
                  {selectedPayment.status}
                </Badge>
              </div>
            </div>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Payment Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Payment Number"
                  value={selectedPayment.paymentNumber}
                />
                <DetailItem
                  label="Receipt Number"
                  value={selectedPayment.receiptNumber ?? "Not issued"}
                />
                <DetailItem
                  label="Invoice Number"
                  value={selectedPayment.invoiceNumber}
                />
                <DetailItem
                  label="Payment Source"
                  value={
                    selectedPayment.source === "ASSESSMENT"
                      ? "Assessment / invoice"
                      : "Direct collection"
                  }
                />
                <DetailItem
                  label="Payment Method"
                  value={getMethodLabel(selectedPayment.method)}
                />
                <DetailItem
                  label="Payment Provider"
                  value={getProviderLabel(selectedPayment.provider)}
                />
                <DetailItem
                  label="Transaction Reference"
                  value={selectedPayment.transactionReference ?? "—"}
                />
                <DetailItem
                  label="Bank Reference"
                  value={selectedPayment.bankReference ?? "—"}
                />
                <DetailItem
                  label="Created At"
                  value={formatDateTime(selectedPayment.createdAt, locale)}
                />
                <DetailItem
                  label="Completed At"
                  value={formatDateTime(selectedPayment.completedAt, locale)}
                />
                <DetailItem
                  label="Received / Verified By"
                  value={selectedPayment.receivedBy ?? "—"}
                />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Taxpayer Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Taxpayer Name"
                  value={selectedPayment.taxpayerName}
                />
                <DetailItem
                  label="Taxpayer TIN"
                  value={selectedPayment.taxpayerTin}
                />
                <DetailItem
                  label="Administrative Unit"
                  value={selectedPayment.administrativeUnit}
                />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Revenue Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Revenue Category"
                  value={selectedPayment.revenueCategory}
                />
                <DetailItem
                  label="Revenue Service"
                  value={selectedPayment.revenueService}
                />
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">
                Description
              </h3>
              <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-muted-foreground">
                {selectedPayment.description}
              </p>
            </section>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedPayment(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </>
      )}
    </DialogContent>
  </Dialog>

  {/* Related reports */}
  <div className="grid gap-4 md:grid-cols-2 print:hidden">
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              Revenue Collection Report
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Review aggregated collections by revenue category and service.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}/office/dashboard/reports/revenue-collection`}>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>

    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              Payment Records
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This page contains individual payment records and their statuses.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" disabled>
          <Link href={paymentReportHref}>
            Current Page
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
