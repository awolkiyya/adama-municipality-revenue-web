"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle, Banknote, Building2, CalendarDays, Check, ExternalLink,
  FileBarChart, FileSpreadsheet, Filter, Inbox, Landmark, RefreshCw,
  RotateCcw, Smartphone, X,
} from "lucide-react";
import {
  Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { EthiopianDatePicker } from "@/components/input/EthiopianDatePicker";
import { gregorianToEth } from "@/utils/ethiopianCalendar";
import { formatEthiopianDate } from "@/lib/utils";
import { useRevenueCollectionReport } from "@/hooks/report/use-revenue-collection-report";
import { useRevenueCategories } from "@/hooks/revenue/revenueCategory.hook";
import { useRevenueServices } from "@/hooks/revenue/revenueService.hook";
import type {
  RevenueCollectionReportFilters, RevenuePaymentMethod, RevenuePaymentProvider,
  RevenuePaymentSource, RevenuePaymentStatus,
} from "@/types/report/revenue-report";

/* ------------------------------ Types & config ----------------------------- */

type ReportFilters = {
  startDate: string; endDate: string; method: string; provider: string;
  source: string; status: string; domain: string; revenueCategoryId: string;
  serviceId: string; administrativeUnitId: string;
};
type Option = { id: string; name: string };
type Choice = { value: string; label: string };
type Num = number | string | null | undefined;

const C = {
  recognized: "var(--chart-2)",
  cash: "var(--chart-1)",
  held: "var(--chart-4)",
  discrepancy: "var(--destructive)",
  processing: "var(--info, var(--chart-3))",
  reversed: "var(--chart-5)",
  neutral: "var(--muted-foreground)",
};
const tint = (c: string, p = 12) => `color-mix(in oklab, ${c} ${p}%, transparent)`;
const AXIS = { fontSize: 12, fill: "var(--muted-foreground)" };
const TOOLTIP = {
  borderRadius: 8, border: "1px solid var(--border)", fontSize: 12,
  background: "var(--popover, var(--background))",
  color: "var(--popover-foreground, var(--foreground))",
};

const METHODS = [
  { value: "CASH", label: "Cash", color: "var(--chart-4)" },
  { value: "BANK_TRANSFER", label: "Bank transfer", color: "var(--chart-2)" },
  { value: "ONLINE", label: "Online", color: "var(--chart-3)" },
] as const;
const PROVIDERS: Choice[] = [
  { value: "CASH", label: "Cash" }, { value: "BANK", label: "Bank" },
  { value: "CHAPA", label: "Chapa" }, { value: "TELEBIRR", label: "Telebirr" },
];
const SOURCES: Choice[] = [
  { value: "ONLINE", label: "Online" }, { value: "AGENT_ASSISTED", label: "Agent assisted" },
  { value: "OFFICE_RECORDED", label: "Office recorded" },
  { value: "FIELD_COLLECTION", label: "Field collection" }, { value: "SYSTEM", label: "System" },
];
const STATUSES: Choice[] = [
  { value: "COMPLETED", label: "Completed" }, { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" }, { value: "FAILED", label: "Failed" },
  { value: "REVERSED", label: "Reversed" }, { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
];
const DOMAINS: Choice[] = [
  { value: "TAX", label: "Tax" }, { value: "RENT", label: "Rent" },
  { value: "INVESTMENT", label: "Investment" }, { value: "SERVICE", label: "Service" },
  { value: "SALE", label: "Sale" }, { value: "CAPITAL", label: "Capital" },
];
const DOMAIN_COLORS: Record<string, string> = {
  TAX: "var(--chart-2)", RENT: "var(--chart-1)", INVESTMENT: "var(--chart-5)",
  SERVICE: "var(--chart-4)", SALE: "var(--chart-3)", CAPITAL: "var(--muted-foreground)",
};

/* --------------------------------- Helpers --------------------------------- */

const toIso = (d: Date) =>
  [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");

const isoToDate = (iso: string) => {
  if (!iso) return undefined;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const getDefaultFilters = (): ReportFilters => ({
  startDate: `${new Date().getFullYear()}-01-01`, endDate: toIso(new Date()),
  method: "all", provider: "all", source: "all", status: "all", domain: "all",
  revenueCategoryId: "all", serviceId: "all", administrativeUnitId: "all",
});

const PRESETS: { key: string; label: string; range: () => [string, string] }[] = [
  { key: "month", label: "This month", range: () => { const n = new Date(); return [toIso(new Date(n.getFullYear(), n.getMonth(), 1)), toIso(n)]; } },
  { key: "30d", label: "30 days", range: () => { const n = new Date(); const s = new Date(n); s.setDate(s.getDate() - 29); return [toIso(s), toIso(n)]; } },
  { key: "quarter", label: "Quarter", range: () => { const n = new Date(); return [toIso(new Date(n.getFullYear(), Math.floor(n.getMonth() / 3) * 3, 1)), toIso(n)]; } },
  { key: "ytd", label: "Year to date", range: () => { const n = new Date(); return [toIso(new Date(n.getFullYear(), 0, 1)), toIso(n)]; } },
];

const num = (v: Num) => { const p = Number(v ?? 0); return Number.isFinite(p) ? p : 0; };
const money = (v: Num, loc: string) =>
  new Intl.NumberFormat(loc, { style: "currency", currency: "ETB", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num(v));
const int = (v: Num, loc: string) => new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(num(v));
const compact = (v: Num) => {
  const a = num(v);
  if (Math.abs(a) >= 1e9) return `${(a / 1e9).toFixed(1)}B`;
  if (Math.abs(a) >= 1e6) return `${(a / 1e6).toFixed(1)}M`;
  if (Math.abs(a) >= 1e3) return `${(a / 1e3).toFixed(0)}K`;
  return a.toLocaleString();
};
const pct = (v: number, d = 1) => (Number.isFinite(v) ? `${v.toFixed(d).replace(/\.0$/, "")}%` : "0%");
const share = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0);
const label = (v: string) => { const t = v.toLowerCase().replace(/_/g, " "); return t.charAt(0).toUpperCase() + t.slice(1); };
const ethDate = (iso: string) => { const d = isoToDate(iso); return d ? formatEthiopianDate(d.toDateString()) : "Any date"; };

function formatPeriod(period: string, loc: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(period))
    return new Intl.DateTimeFormat(loc, { month: "short", day: "numeric" }).format(new Date(`${period}T00:00:00`));
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [y, m] = period.split("-").map(Number);
    return new Intl.DateTimeFormat(loc, { year: "numeric", month: "short" }).format(new Date(y, m - 1, 1));
  }
  return period;
}

const csvCell = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
function downloadCsv(name: string, rows: (string | number | null | undefined)[][]) {
  const blob = new Blob(["\uFEFF", rows.map((r) => r.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------ Building blocks ---------------------------- */

function Panel({ title, description, action, children, className = "" }: {
  title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-xl border bg-card print:break-inside-avoid ${className}`}>
      <header className="flex items-start justify-between gap-4 px-5 pt-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0 print:hidden">{action}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

const Empty = ({ message, height = 220 }: { message: string; height?: number }) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground" style={{ height }}>
    <Inbox className="size-5 opacity-60" /> {message}
  </div>
);

function Segmented({ options, value, onChange, name }: {
  options: Choice[]; value: string; onChange: (v: string) => void; name: string;
}) {
  return (
    <div role="group" aria-label={name} className="inline-flex rounded-lg border bg-muted/40 p-0.5">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            value === o.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PillGroup({ name, value, onChange, options, allLabel = "All" }: {
  name: string; value: string; onChange: (v: string) => void; options: Choice[]; allLabel?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{name}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={name}>
        {[{ value: "all", label: allLabel }, ...options].map((o) => {
          const on = value === o.value;
          return (
            <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}>
              {on && <Check className="size-3" />}{o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectField({ id, name, value, onChange, options, placeholder, disabled }: {
  id: string; name: string; value: string; onChange: (v: string) => void;
  options: Choice[]; placeholder: string; disabled?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <label className="text-sm font-medium" htmlFor={id}>{name}</label>
      <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
        <option value="all">{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/** Horizontal stacked bar with legend. Segments with zero value are hidden. */
function StackedBar({ segments, total, loc, name }: {
  segments: { key: string; label: string; amount: number; count?: number; color: string; hint?: string }[];
  total: number; loc: string; name: string;
}) {
  return (
    <div>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-muted" role="img"
        aria-label={`${name}: ${segments.map((s) => `${s.label} ${pct(share(s.amount, total))}`).join(", ")}`}>
        {segments.map((s) => {
          const w = share(s.amount, total);
          return w > 0 ? <div key={s.key} title={`${s.label}: ${money(s.amount, loc)}`} style={{ width: `${w}%`, background: s.color }} /> : null;
        })}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {segments.map((s) => (
          <div key={s.key} className="min-w-0">
            <dt className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />{s.label}
            </dt>
            <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums">{compact(s.amount)} ETB</dd>
            <dd className="text-xs text-muted-foreground tabular-nums">
              {s.count !== undefined ? `${int(s.count, loc)} payments` : s.hint}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DataTable({ head, rows }: { head: { text: string; right?: boolean; w?: string }[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            {head.map((h) => (
              <th key={h.text} scope="col" className={`pb-2 font-medium ${h.right ? "text-right" : "text-left"} ${h.w ?? ""}`}>{h.text}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0">
              {r.map((cell, j) => (
                <td key={j} className={`py-2.5 tabular-nums ${head[j]?.right ? "text-right" : ""} ${j === r.length - 1 || !head[j]?.right ? "" : "text-muted-foreground"}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Skeleton = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading report">
    <div className="h-72 animate-pulse rounded-xl border bg-muted/40" />
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="h-80 animate-pulse rounded-xl border bg-muted/40 xl:col-span-2" />
      <div className="h-80 animate-pulse rounded-xl border bg-muted/40" />
    </div>
  </div>
);

/* ----------------------------------- Page ---------------------------------- */

export default function RevenueCollectionPage() {
  const t = useTranslations("revenueCollectionReport");
  const loc = useLocale();

  const [filters, setFilters] = useState<ReportFilters>(getDefaultFilters);
  const [draft, setDraft] = useState<ReportFilters>(getDefaultFilters);
  const [open, setOpen] = useState(false);
  const [trendView, setTrendView] = useState<"daily" | "cumulative">("daily");
  const [showAllUnits, setShowAllUnits] = useState(false);
  const defaults = useMemo(() => getDefaultFilters(), []);

  const { data: catRes, isPending: catPending } = useRevenueCategories();
  const { data: svcRes, isPending: svcPending } = useRevenueServices();

  const toOptions = (items?: { id: unknown; name?: unknown }[] | null): Option[] =>
    (items ?? []).map((i) => ({ id: String(i.id), name: String(i.name ?? "") }))
      .filter((i) => i.id && i.name).sort((a, b) => a.name.localeCompare(b.name));
  const categories = useMemo(() => toOptions(catRes?.data), [catRes]);
  const services = useMemo(() => toOptions(svcRes?.data), [svcRes]);

  const apiFilters = useMemo<RevenueCollectionReportFilters>(() => {
    const p: RevenueCollectionReportFilters = {};
    if (filters.startDate) p.start_date = filters.startDate;
    if (filters.endDate) p.end_date = filters.endDate;
    if (filters.method !== "all") p.payment_method = filters.method as RevenuePaymentMethod;
    if (filters.provider !== "all") p.payment_provider = filters.provider as RevenuePaymentProvider;
    if (filters.source !== "all") p.payment_source = filters.source as RevenuePaymentSource;
    if (filters.status !== "all") p.status = filters.status as RevenuePaymentStatus;
    if (filters.domain !== "all") p.revenue_domain = filters.domain as RevenueCollectionReportFilters["revenue_domain"];
    if (filters.revenueCategoryId !== "all") p.revenue_category_id = filters.revenueCategoryId;
    if (filters.serviceId !== "all") p.service_id = filters.serviceId;
    if (filters.administrativeUnitId !== "all") p.administrative_unit_id = filters.administrativeUnitId;
    return p;
  }, [filters]);

  const { data: report, isPending, isFetching, isError, error, refetch } = useRevenueCollectionReport(apiFilters);
  const s = report?.summary;

  const daily = useMemo(() => report?.daily_collections ?? [], [report?.daily_collections]);
  const methods = useMemo(() => report?.payment_methods ?? [], [report?.payment_methods]);
  const sources = useMemo(() => report?.payment_sources ?? [], [report?.payment_sources]);
  const domains = useMemo(() => report?.revenue_domains ?? [], [report?.revenue_domains]);
  const units = useMemo(() => report?.administrative_units ?? [], [report?.administrative_units]);

  /* ---- filter state ---- */
  const countActive = (v: ReportFilters) =>
    (Object.keys(v) as (keyof ReportFilters)[]).filter((k) => v[k] !== defaults[k]).length;
  const activeCount = countActive(filters);
  const draftCount = countActive(draft);
  const dirty = JSON.stringify(filters) !== JSON.stringify(draft);
  const rangeInvalid = Boolean(draft.startDate && draft.endDate && draft.startDate > draft.endDate);

  const unitOptions = useMemo(() => {
    const o = [...units];
    if (filters.administrativeUnitId !== "all" && !o.some((u) => u.administrative_unit_id === filters.administrativeUnitId))
      o.push({ administrative_unit_id: filters.administrativeUnitId, administrative_unit_name: "Selected administrative unit", completed_amount: 0, completed_count: 0 });
    return o;
  }, [units, filters.administrativeUnitId]);

  const activePreset = PRESETS.find((p) => { const [a, b] = p.range(); return a === filters.startDate && b === filters.endDate; });

  const chips = useMemo(() => {
    const pick = (list: Choice[], v: string) => list.find((i) => i.value === v)?.label ?? label(v);
    const byId = (list: Option[], id: string) => list.find((i) => i.id === id)?.name ?? "Selected";
    const out: { key: keyof ReportFilters; text: string }[] = [];
    if (filters.domain !== "all") out.push({ key: "domain", text: `Domain: ${pick(DOMAINS, filters.domain)}` });
    if (filters.revenueCategoryId !== "all") out.push({ key: "revenueCategoryId", text: `Category: ${byId(categories, filters.revenueCategoryId)}` });
    if (filters.serviceId !== "all") out.push({ key: "serviceId", text: `Service: ${byId(services, filters.serviceId)}` });
    if (filters.method !== "all") out.push({ key: "method", text: `Method: ${pick(METHODS as unknown as Choice[], filters.method)}` });
    if (filters.provider !== "all") out.push({ key: "provider", text: `Provider: ${pick(PROVIDERS, filters.provider)}` });
    if (filters.source !== "all") out.push({ key: "source", text: `Source: ${pick(SOURCES, filters.source)}` });
    if (filters.status !== "all") out.push({ key: "status", text: `Status: ${pick(STATUSES, filters.status)}` });
    if (filters.administrativeUnitId !== "all") {
      const u = unitOptions.find((i) => i.administrative_unit_id === filters.administrativeUnitId);
      out.push({ key: "administrativeUnitId", text: `Unit: ${u?.administrative_unit_name ?? "Selected"}` });
    }
    return out;
  }, [filters, categories, services, unitOptions]);

  const setD = <K extends keyof ReportFilters>(k: K, v: ReportFilters[K]) => setDraft((c) => ({ ...c, [k]: v }));
  const ethYear = useMemo(() => gregorianToEth(new Date()).year, []);
  const startValue = useMemo(() => isoToDate(draft.startDate), [draft.startDate]);
  const endValue = useMemo(() => isoToDate(draft.endDate), [draft.endDate]);

  const onSheet = (o: boolean) => { if (o) setDraft({ ...filters }); setOpen(o); };
  const apply = () => { if (!rangeInvalid) { setFilters({ ...draft }); setOpen(false); } };
  const resetApplied = () => { const d = getDefaultFilters(); setFilters(d); setDraft(d); setOpen(false); };

  /* ---- derived figures ---- */
  const recognized = num(s?.total_collected);
  const recognizedCount = num(s?.collected_count ?? s?.completed_count);
  const nonCash = num(s?.non_cash_collected);
  const reconCash = num(s?.reconciled_cash);
  const unreconCash = num(s?.unreconciled_cash);
  const discCash = num(s?.discrepancy_cash);
  const completedValue = nonCash + reconCash + unreconCash + discCash;
  const heldValue = unreconCash + discCash;
  const totalTx = num(s?.total_transactions);

  const pipeline = [
    { key: "pending", label: "Pending", amount: num(s?.pending_amount), count: num(s?.pending_count), color: C.held },
    { key: "processing", label: "Processing", amount: num(s?.processing_amount), count: num(s?.processing_count), color: C.processing },
    { key: "failed", label: "Failed", amount: num(s?.failed_amount), count: num(s?.failed_count), color: C.discrepancy },
    { key: "reversed", label: "Reversed", amount: num(s?.reversed_amount), count: num(s?.reversed_count), color: C.reversed },
  ];

  const trend = useMemo(() => daily.reduce<{ period: string; label: string; collected: number; cumulative: number; count: number }[]>(
    (r, i) => {
      const c = num(i.completed_amount);
      r.push({ period: i.period, label: formatPeriod(i.period, loc), collected: c, cumulative: (r.at(-1)?.cumulative ?? 0) + c, count: num(i.completed_count) });
      return r;
    }, []), [daily, loc]);

  const methodData = useMemo(() => methods.map((i) => {
    const m = METHODS.find((o) => o.value === i.label);
    return { name: m?.label ?? label(i.label), value: num(i.completed_amount), count: num(i.completed_count), color: m?.color ?? C.neutral };
  }).filter((i) => i.value > 0), [methods]);
  const methodTotal = methodData.reduce((a, i) => a + i.value, 0);
  const onlineAmount = methodData.find((i) => i.name === "Online")?.value ?? 0;
  const digitalShare = share(onlineAmount, methodTotal);
  const cashAmount = methodData.find((i) => i.name === "Cash")?.value ?? 0;
  const bankAmount = methodData.find((i) => i.name === "Bank transfer")?.value ?? 0;
  const followUpAmount = num(s?.pending_amount) + num(s?.failed_amount);
  const followUpCount = num(s?.pending_count) + num(s?.failed_count);

  const domainData = useMemo(() => domains.map((i) => ({
    domain: i.revenue_domain, name: label(i.revenue_domain), value: num(i.completed_amount),
    count: num(i.completed_count), color: DOMAIN_COLORS[i.revenue_domain] ?? C.neutral,
  })).filter((i) => i.value > 0).sort((a, b) => b.value - a.value), [domains]);

  const rankedUnits = useMemo(() => units.slice().sort((a, b) => num(b.completed_amount) - num(a.completed_amount)), [units]);
  const unitsTotal = rankedUnits.reduce((a, i) => a + num(i.completed_amount), 0);
  const maxUnit = Math.max(1, ...rankedUnits.map((i) => num(i.completed_amount)));
  const visibleUnits = showAllUnits ? rankedUnits : rankedUnits.slice(0, 8);

  /* ---- attention queue: things a finance officer must act on ---- */
  const attention = [
    { key: "unrec", title: "Cash awaiting reconciliation", amount: unreconCash, count: num(s?.unreconciled_cash_count), color: C.held, status: "COMPLETED", method: "CASH" },
    { key: "disc", title: "Cash with discrepancies", amount: discCash, count: num(s?.discrepancy_cash_count), color: C.discrepancy, status: "COMPLETED", method: "CASH" },
    { key: "pend", title: "Pending payments", amount: num(s?.pending_amount), count: num(s?.pending_count), color: C.held, status: "PENDING" },
    { key: "fail", title: "Failed payments", amount: num(s?.failed_amount), count: num(s?.failed_count), color: C.discrepancy, status: "FAILED" },
  ].filter((a) => a.count > 0 || a.amount > 0);

  /* ---- headline sentence (plain-language summary) ---- */
  const topDomain = domainData[0];
  const topUnit = rankedUnits[0];
  const topMethod = [...methodData].sort((a, b) => b.value - a.value)[0];
  const peak = [...trend].sort((a, b) => b.collected - a.collected)[0];
  const insights = [
    topDomain && `${topDomain.name} leads with ${pct(share(topDomain.value, domainData.reduce((a, i) => a + i.value, 0)))} of domain collections.`,
    topMethod && `${topMethod.name} is the main channel at ${pct(share(topMethod.value, methodTotal))} of value.`,
    topUnit && num(topUnit.completed_amount) > 0 && `${topUnit.administrative_unit_name} is the top unit with ${pct(share(num(topUnit.completed_amount), unitsTotal))}.`,
    peak && peak.collected > 0 && `Strongest period: ${peak.label} (${compact(peak.collected)} ETB).`,
  ].filter(Boolean) as string[];

  /* ---- actions ---- */
  const reportHref = (over: Record<string, string> = {}) => {
    const p = new URLSearchParams();
    const map: [string, string][] = [
      ["start_date", filters.startDate], ["end_date", filters.endDate],
      ["payment_method", filters.method], ["payment_provider", filters.provider],
      ["payment_source", filters.source], ["status", filters.status],
      ["revenue_domain", filters.domain], ["revenue_category_id", filters.revenueCategoryId],
      ["service_id", filters.serviceId], ["administrative_unit_id", filters.administrativeUnitId],
    ];
    map.forEach(([k, v]) => { if (v && v !== "all") p.set(k, v); });
    Object.entries(over).forEach(([k, v]) => p.set(k, v));
    const q = p.toString();
    return `/${loc}/office/dashboard/payment-reports${q ? `?${q}` : ""}`;
  };

  const exportReport = () => {
    if (!report) return;
    const sel = (list: Option[], id: string) => list.find((i) => i.id === id)?.name ?? "All";
    const all = (v: string) => (v === "all" ? "All" : v);
    const block = (title: string, head: string[], rows: (string | number | null | undefined)[][]) => [[], [title], head, ...rows];
    const rows: (string | number | null | undefined)[][] = [
      ["Revenue Collection Report"], ["Generated at", new Date().toISOString()],
      ["Start date", filters.startDate || "All"], ["End date", filters.endDate || "All"],
      ["Administrative unit", units.find((u) => u.administrative_unit_id === filters.administrativeUnitId)?.administrative_unit_name ?? "All"],
      ["Revenue domain", all(filters.domain)], ["Revenue category", sel(categories, filters.revenueCategoryId)],
      ["Service", sel(services, filters.serviceId)], ["Payment method", all(filters.method)],
      ["Payment provider", all(filters.provider)], ["Payment source", all(filters.source)], ["Payment status", all(filters.status)],
      ...block("Summary", ["Metric", "Value"], [
        ["Recognized collections (ETB)", s?.total_collected ?? 0], ["Recognized payments", s?.collected_count ?? 0],
        ["Total transactions", s?.total_transactions ?? 0], ["Completed payments", s?.completed_count ?? 0],
        ["Average payment (ETB)", s?.average_payment ?? 0],
        ["Non-cash collected (ETB)", s?.non_cash_collected ?? 0], ["Reconciled cash (ETB)", s?.reconciled_cash ?? 0],
        ["Unreconciled cash (ETB)", s?.unreconciled_cash ?? 0], ["Unreconciled cash count", s?.unreconciled_cash_count ?? 0],
        ["Discrepancy cash (ETB)", s?.discrepancy_cash ?? 0], ["Discrepancy cash count", s?.discrepancy_cash_count ?? 0],
        ["Pending (ETB)", s?.pending_amount ?? 0], ["Pending count", s?.pending_count ?? 0],
        ["Processing (ETB)", s?.processing_amount ?? 0], ["Processing count", s?.processing_count ?? 0],
        ["Failed (ETB)", s?.failed_amount ?? 0], ["Failed count", s?.failed_count ?? 0],
        ["Reversed (ETB)", s?.reversed_amount ?? 0], ["Reversed count", s?.reversed_count ?? 0],
        ["Cancelled count", s?.cancelled_count ?? 0], ["Expired count", s?.expired_count ?? 0],
      ]),
      ...block("Collection Trend", ["Period", "Amount (ETB)", "Count"], daily.map((i) => [i.period, i.completed_amount, i.completed_count])),
      ...block("By Payment Method", ["Method", "Amount (ETB)", "Count"], methods.map((i) => [i.label, i.completed_amount, i.completed_count])),
      ...block("By Payment Source", ["Source", "Amount (ETB)", "Count"], sources.map((i) => [i.label, i.completed_amount, i.completed_count])),
      ...block("By Revenue Domain", ["Domain", "Amount (ETB)", "Count"], domains.map((i) => [i.revenue_domain, i.completed_amount, i.completed_count])),
      ...block("By Administrative Unit", ["Unit", "Amount (ETB)", "Count"], units.map((i) => [i.administrative_unit_name, i.completed_amount, i.completed_count])),
    ];
    downloadCsv(`revenue-collection-report-${filters.startDate || "all"}-to-${filters.endDate || "all"}.csv`, rows);
  };

  /* ---------------------------------- Render --------------------------------- */

  return (
    <main className="min-h-screen bg-muted/30 text-foreground print:bg-white">
      {/* Sticky command bar: identity, period, filters, actions */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur print:static">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground print:hidden">
                <FileBarChart className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">Adama City Administration · Revenue Authority</p>
                <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">{t("title")}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh report">
                <RefreshCw className={`size-4 sm:mr-2 ${isFetching ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button size="sm" onClick={exportReport} disabled={!report}>
                <FileSpreadsheet className="mr-2 size-4" />{t("export_csv")}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t py-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-medium tabular-nums"
                title={`${filters.startDate || "Any"} – ${filters.endDate || "Any"}`}>
                <CalendarDays className="size-4 text-muted-foreground" />
                {ethDate(filters.startDate)} – {ethDate(filters.endDate)}
              </span>
              <div className="print:hidden">
                <Segmented name="Reporting period" value={activePreset?.key ?? ""}
                  onChange={(k) => { const p = PRESETS.find((i) => i.key === k); if (p) { const [startDate, endDate] = p.range(); setFilters((c) => ({ ...c, startDate, endDate })); } }}
                  options={PRESETS.map((p) => ({ value: p.key, label: p.label }))} />
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              {activeCount > 0 && (
                <Button variant="ghost" size="sm" onClick={resetApplied} className="text-muted-foreground">
                  <X className="mr-1.5 size-4" />Reset
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => { setDraft({ ...filters }); setOpen(true); }}>
                <Filter className="mr-2 size-4" />Filters
                {activeCount > 0 && (
                  <span className="ml-2 flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{activeCount}</span>
                )}
              </Button>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pb-3" aria-label="Applied filters">
              {chips.map((c) => (
                <span key={c.key} className="inline-flex items-center gap-1 rounded-full border bg-muted/50 py-1 pl-3 pr-1.5 text-xs font-medium">
                  {c.text}
                  <button type="button" aria-label={`Remove filter ${c.text}`} onClick={() => setFilters((f) => ({ ...f, [c.key]: "all" }))}
                    className="rounded-full p-0.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Filter sheet */}
      <Sheet open={open} onOpenChange={onSheet}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
          <SheetHeader className="border-b px-5 py-5 text-left sm:px-6">
            <SheetTitle className="pr-8 text-lg">Report filters</SheetTitle>
            <SheetDescription>Nothing changes until you apply.</SheetDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full border px-2.5 py-1 text-xs font-medium">{draftCount} selected</span>
              {dirty && <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: tint(C.held, 15), color: C.held }}>Not applied yet</span>}
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-6">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">Period</h3>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => {
                  const [a, b] = p.range();
                  const on = draft.startDate === a && draft.endDate === b;
                  return (
                    <button key={p.key} type="button" aria-pressed={on} onClick={() => setDraft((c) => ({ ...c, startDate: a, endDate: b }))}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}>
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {([["startDate", t("start_date"), startValue, "Start date"], ["endDate", t("end_date"), endValue, "End date"]] as const).map(([k, l, v, ph]) => (
                  <div key={k} className="min-w-0 space-y-2">
                    <p className="text-sm font-medium">{l}</p>
                    <EthiopianDatePicker value={v} onChange={(d: Date) => setD(k, toIso(d))} placeholder={ph}
                      minYear={ethYear - 10} maxYear={ethYear} error={rangeInvalid ? " " : undefined} />
                  </div>
                ))}
              </div>
              {rangeInvalid && <p className="text-xs text-destructive" role="alert">The start date must be on or before the end date.</p>}
            </section>

            <section className="space-y-4 border-t pt-6">
              <h3 className="text-sm font-semibold">Revenue</h3>
              <PillGroup name="Domain" value={draft.domain} onChange={(v) => setD("domain", v)} options={DOMAINS} />
              <SelectField id="cat" name="Category" value={draft.revenueCategoryId} onChange={(v) => setD("revenueCategoryId", v)}
                placeholder={catPending ? "Loading categories…" : "All categories"} disabled={catPending}
                options={categories.map((i) => ({ value: i.id, label: i.name }))} />
              <SelectField id="svc" name="Service" value={draft.serviceId} onChange={(v) => setD("serviceId", v)}
                placeholder={svcPending ? "Loading services…" : "All services"} disabled={svcPending}
                options={services.map((i) => ({ value: i.id, label: i.name }))} />
            </section>

            <section className="space-y-4 border-t pt-6">
              <h3 className="text-sm font-semibold">Payment</h3>
              <PillGroup name={t("payment_method")} value={draft.method} onChange={(v) => setD("method", v)}
                options={METHODS.map((m) => ({ value: m.value, label: m.label }))} allLabel={t("all_methods")} />
              <PillGroup name="Provider" value={draft.provider} onChange={(v) => setD("provider", v)} options={PROVIDERS} />
              <PillGroup name="Source" value={draft.source} onChange={(v) => setD("source", v)} options={SOURCES} />
              <PillGroup name={t("status")} value={draft.status} onChange={(v) => setD("status", v)} options={STATUSES} allLabel={t("all_statuses")} />
            </section>

            <section className="space-y-4 border-t pt-6">
              <h3 className="text-sm font-semibold">Administrative scope</h3>
              <SelectField id="unit" name="Administrative unit" value={draft.administrativeUnitId}
                onChange={(v) => setD("administrativeUnitId", v)} placeholder="All administrative units"
                options={unitOptions.filter((u) => u.administrative_unit_id).map((u) => ({ value: u.administrative_unit_id!, label: u.administrative_unit_name }))} />
            </section>
          </div>

          <SheetFooter className="border-t bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <Button type="button" variant="outline" className="sm:mr-auto" onClick={() => setDraft(getDefaultFilters())}>
              <RotateCcw className="mr-2 size-4" />Reset all
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" onClick={apply} disabled={rangeInvalid}><Check className="mr-2 size-4" />Apply filters</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Content */}
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {isError && (
          <div role="alert" className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">The report could not be loaded</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : "Check your connection and try again."}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => refetch()}>Try again</Button>
          </div>
        )}

        {isPending && <Skeleton />}

        {report && (
          <>
            {isFetching && <p className="text-xs text-muted-foreground" aria-live="polite">Updating report…</p>}

            {totalTx === 0 && (
              <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between print:hidden"
                style={{ borderColor: tint(C.held, 45), background: tint(C.held, 8) }}>
                <p className="text-sm">No payments match these filters. Widen the period or reset the filters.</p>
                <Button variant="outline" size="sm" onClick={resetApplied}>Reset filters</Button>
              </div>
            )}

            {/* 1. The answer: recognized revenue, and how it was reached */}
            <section className="grid overflow-hidden rounded-xl border bg-card xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] print:break-inside-avoid">
              <div className="space-y-8 p-6 sm:p-8">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("total_collected")}</p>
                  <p className="mt-2 break-words text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">{money(recognized, loc)}</p>
                  <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                    {int(recognizedCount, loc)} payments counted as revenue: all completed non-cash payments plus cash that has been reconciled.
                  </p>
                </div>

                <div>
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h2 className="text-sm font-semibold">Completed payments: counted vs held</h2>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold tabular-nums text-foreground">{pct(share(recognized, completedValue))}</span> counted
                    </p>
                  </div>
                  <StackedBar loc={loc} name="Completed payments by reconciliation" total={completedValue}
                    segments={[
                      { key: "nc", label: "Non-cash", amount: nonCash, count: num(s?.non_cash_collected_count), color: C.recognized },
                      { key: "rc", label: "Reconciled cash", amount: reconCash, count: num(s?.reconciled_cash_count), color: C.cash },
                      { key: "uc", label: "Awaiting reconciliation", amount: unreconCash, count: num(s?.unreconciled_cash_count), color: C.held },
                      { key: "dc", label: "Discrepancy", amount: discCash, count: num(s?.discrepancy_cash_count), color: C.discrepancy },
                    ]} />
                  {heldValue > 0 && (
                    <p className="mt-4 text-xs text-muted-foreground">
                      {money(heldValue, loc)} of completed cash is not yet counted as revenue.
                    </p>
                  )}
                </div>

                <div>
                  <h2 className="mb-3 text-sm font-semibold">Payments not completed</h2>
                  <StackedBar loc={loc} name="Payments not completed" total={pipeline.reduce((a, i) => a + i.amount, 0)} segments={pipeline} />
                </div>
              </div>

              {/* 2. Side rail: supporting numbers + attention queue */}
              <aside className="border-t bg-muted/20 xl:border-l xl:border-t-0">
                <dl className="grid grid-cols-3 divide-x border-b">
                  {[
                    { l: "Payments", v: int(totalTx, loc), n: "all statuses" },
                    { l: "Average", v: compact(s?.average_payment), n: "ETB, counted" },
                    { l: "Digital", v: pct(digitalShare, 0), n: "online by value" },
                  ].map((k) => (
                    <div key={k.l} className="px-4 py-4">
                      <dt className="text-xs text-muted-foreground">{k.l}</dt>
                      <dd className="mt-1 text-xl font-semibold tabular-nums">{k.v}</dd>
                      <dd className="text-xs text-muted-foreground">{k.n}</dd>
                    </div>
                  ))}
                </dl>

                <div className="p-5">
                  <h2 className="text-sm font-semibold">Needs attention</h2>
                  {attention.length === 0 ? (
                    <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="size-4" style={{ color: C.recognized }} /> Everything in this view is settled.
                    </p>
                  ) : (
                    <ul className="mt-3 divide-y">
                      {attention.map((a) => (
                        <li key={a.key}>
                          <a href={reportHref({ status: a.status, ...(a.method ? { payment_method: a.method } : {}) })}
                            className="group flex items-center justify-between gap-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <span className="flex min-w-0 items-center gap-3">
                              <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: a.color }} />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium group-hover:underline">{a.title}</span>
                                <span className="text-xs text-muted-foreground tabular-nums">{int(a.count, loc)} payments</span>
                              </span>
                            </span>
                            <span className="text-sm font-semibold tabular-nums">{compact(a.amount)} ETB</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </aside>
            </section>

            {/* Channel strip: where money came in, and what is still open */}
            <section aria-label="Collection by channel"
              className="grid divide-y overflow-hidden rounded-xl border bg-card sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x print:break-inside-avoid">
              {[
                { icon: <Banknote className="size-5" />, label: "Cash", amount: cashAmount, color: "var(--chart-4)",
                  note: heldValue > 0 ? `${compact(heldValue)} ETB not yet reconciled` : "Fully reconciled" },
                { icon: <Landmark className="size-5" />, label: "Bank transfer", amount: bankAmount, color: "var(--chart-2)" },
                { icon: <Smartphone className="size-5" />, label: "Online", amount: onlineAmount, color: "var(--chart-3)" },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-4 p-5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: tint(c.color, 14), color: c.color }}>{c.icon}</div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{c.label}</p>
                    <p className="break-words text-lg font-semibold tabular-nums">{money(c.amount, loc)}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {pct(share(c.amount, methodTotal))} of completed{c.note ? ` · ${c.note}` : ""}
                    </p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Needs follow-up</p>
                  <p className="break-words text-lg font-semibold tabular-nums">{money(followUpAmount, loc)}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{int(followUpCount, loc)} pending or failed</p>
                </div>
              </div>
            </section>

            {/* 3. Plain-language insights */}
            {insights.length > 0 && (
              <ul className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 xl:grid-cols-4 print:break-inside-avoid" aria-label="Key findings">
                {insights.map((i) => <li key={i} className="bg-card p-4 text-sm leading-relaxed">{i}</li>)}
              </ul>
            )}

            {/* 4. Trend + channel */}
            <div className="grid gap-6 xl:grid-cols-3">
              <Panel className="xl:col-span-2" title={t("collection_trend")}
                description="Completed collections per day or month, depending on the range."
                action={<Segmented name="Trend view" value={trendView} onChange={(v) => setTrendView(v as "daily" | "cumulative")}
                  options={[{ value: "daily", label: "Per period" }, { value: "cumulative", label: "Running total" }]} />}>
                {trend.length === 0 ? <Empty message={t("no_chart_data")} height={300} /> : (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={trend} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="runFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" style={{ stopColor: C.recognized, stopOpacity: 0.28 }} />
                            <stop offset="100%" style={{ stopColor: C.recognized, stopOpacity: 0.02 }} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} minTickGap={24} />
                        <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={55} tick={AXIS} />
                        <Tooltip formatter={(v) => money(Number(v ?? 0), loc)} labelFormatter={(_, p) => p?.[0]?.payload?.period ?? ""} contentStyle={TOOLTIP} />
                        {trendView === "daily"
                          ? <Bar dataKey="collected" name="Collected" fill={C.recognized} radius={[4, 4, 0, 0]} maxBarSize={40} />
                          : <Area type="monotone" dataKey="cumulative" name="Running total" stroke={C.recognized} strokeWidth={2} fill="url(#runFill)" />}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Panel>

              <Panel title={t("collection_by_method")} description="Completed value by payment method.">
                {methodData.length === 0 ? <Empty message={t("no_chart_data")} height={300} /> : (
                  <>
                    <div className="relative h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={methodData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={88} paddingAngle={2} stroke="none">
                            {methodData.map((i) => <Cell key={i.name} fill={i.color} />)}
                          </Pie>
                          <Tooltip formatter={(v) => money(Number(v ?? 0), loc)} contentStyle={TOOLTIP} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs text-muted-foreground">Completed</span>
                        <span className="text-lg font-bold tabular-nums">{compact(methodTotal)}</span>
                      </div>
                    </div>
                    <ul className="mt-4 divide-y">
                      {methodData.map((i) => (
                        <li key={i.name} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: i.color }} />
                            <span className="truncate">{i.name}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">{pct(share(i.value, methodTotal))}</span>
                          </span>
                          <span className="text-right">
                            <span className="block font-semibold tabular-nums">{money(i.value, loc)}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">{int(i.count, loc)} payments</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Panel>
            </div>

            {/* 5. Where it came from */}
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Collection by revenue domain" description="Completed collections grouped by domain.">
                {domainData.length === 0 ? <Empty message={t("no_chart_data")} height={260} /> : (
                  <div style={{ height: Math.max(220, domainData.length * 48) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={domainData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                        <XAxis type="number" tickFormatter={compact} tickLine={false} axisLine={false} tick={AXIS} />
                        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={90} tick={AXIS} />
                        <Tooltip formatter={(v) => money(Number(v ?? 0), loc)} contentStyle={TOOLTIP} />
                        <Bar dataKey="value" name="Collected" radius={[0, 4, 4, 0]} maxBarSize={28}>
                          {domainData.map((i) => <Cell key={i.domain} fill={i.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  Invoices spanning several domains may be left out when a payment cannot be split safely.
                </p>
              </Panel>

              <Panel title="Administrative unit collections" description="Actual completed collections, ranked. No targets or estimates."
                action={rankedUnits.length > 8 ? (
                  <Button variant="ghost" size="sm" onClick={() => setShowAllUnits((v) => !v)}>
                    {showAllUnits ? "Show top 8" : `Show all ${rankedUnits.length}`}
                  </Button>
                ) : undefined}>
                {rankedUnits.length === 0 ? <Empty message="No administrative-unit data for these filters." height={260} /> : (
                  <DataTable
                    head={[{ text: "#", w: "w-8" }, { text: "Unit" }, { text: "Payments", right: true }, { text: "Collected", right: true }, { text: "Share", right: true, w: "w-16" }]}
                    rows={visibleUnits.map((u, idx) => {
                      const v = num(u.completed_amount);
                      return [
                        <span key="i" className="text-xs text-muted-foreground">{idx + 1}</span>,
                        <div key="n" className="pr-4">
                          <p className="truncate font-medium">{u.administrative_unit_name}</p>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar"
                            aria-label={`${u.administrative_unit_name} relative to top unit`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((v / maxUnit) * 100)}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, (v / maxUnit) * 100))}%`, background: C.recognized }} />
                          </div>
                        </div>,
                        int(u.completed_count, loc),
                        <span key="c" className="font-semibold text-foreground">{money(v, loc)}</span>,
                        pct(share(v, unitsTotal)),
                      ];
                    })} />
                )}
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Collection by payment source" description="How completed payments entered the system.">
                {sources.length === 0 ? <Empty message="No payment-source data for these filters." height={200} /> : (
                  <DataTable
                    head={[{ text: "Source" }, { text: "Payments", right: true }, { text: "Collected", right: true }, { text: "Share", right: true, w: "w-16" }]}
                    rows={sources.map((i) => [
                      <span key="l" className="font-medium">{label(i.label)}</span>,
                      int(i.completed_count, loc),
                      <span key="c" className="font-semibold text-foreground">{money(i.completed_amount, loc)}</span>,
                      pct(share(num(i.completed_amount), completedValue)),
                    ])} />
                )}
              </Panel>

              <Panel title="Payment status reconciliation" description="Everything not counted as revenue, kept apart from collections.">
                <DataTable
                  head={[{ text: "Status" }, { text: "Payments", right: true }, { text: "Amount", right: true }]}
                  rows={[
                    [<Dot key="a" color={C.recognized} text="Counted as revenue" />, int(recognizedCount, loc), <b key="v">{money(recognized, loc)}</b>],
                    [<Dot key="b" color={C.held} text="Cash awaiting reconciliation" />, int(s?.unreconciled_cash_count, loc), <b key="v">{money(unreconCash, loc)}</b>],
                    [<Dot key="c" color={C.discrepancy} text="Cash with discrepancy" />, int(s?.discrepancy_cash_count, loc), <b key="v">{money(discCash, loc)}</b>],
                    ...pipeline.map((p) => [<Dot key={p.key} color={p.color} text={p.label} />, int(p.count, loc), <b key="v">{money(p.amount, loc)}</b>]),
                    [<span key="x" className="text-muted-foreground">Cancelled</span>, int(s?.cancelled_count, loc), "—"],
                    [<span key="y" className="text-muted-foreground">Expired</span>, int(s?.expired_count, loc), "—"],
                  ]} />
              </Panel>
            </div>

            <footer className="flex flex-col gap-3 border-t pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl leading-relaxed">
                Summary figures from the revenue system; individual transactions are not listed here. Generated{" "}
                {new Intl.DateTimeFormat(loc, { dateStyle: "medium", timeStyle: "short" }).format(new Date())}.
              </p>
              <a href={reportHref()} className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline print:hidden">
                Open payment report <ExternalLink className="size-3.5" />
              </a>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}

function Dot({ color, text }: { color: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-medium">
      <span className="size-2.5 rounded-sm" style={{ background: color }} />{text}
    </span>
  );
}