"use client";

import { useRef, useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Download,
  FileText,
  Loader2,
  MapPin,
  Menu,
  Receipt,
  Search,
  ShieldCheck,
  Smartphone,
  Stamp,
  UserCheck,
  Users2,
  WifiOff,
  XCircle,
  type LucideIcon,
} from "lucide-react";


import TaxpayerAppDownload from "@/components/TaxpayerAppDownload";
import MagnetLines from "@/components/MagnetLines";
import DotGrid from "@/components/DotGrid";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/* -------------------------------------------------------------------------- */
/* Theme                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Every colour on this page comes from your theme tokens. --success and
 * --warning are optional and fall back to the shadcn chart colours (see
 * theme-tokens.css). Nothing is hardcoded, so light/dark mode and any
 * rebranding happen in globals.css.
 */
const SUCCESS = "var(--success, var(--chart-1))";
const ACCENT = "var(--warning, var(--chart-4))";

/** Transparent tint of a theme colour. */
const tint = (color: string, percent = 12) =>
  `color-mix(in oklab, ${color} ${percent}%, transparent)`;

/** Accent darkened toward the foreground so it stays readable as text. */
const ACCENT_TEXT = `color-mix(in oklab, ${ACCENT} 55%, var(--foreground))`;

const accentText: CSSProperties = { color: ACCENT_TEXT };

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Portal = "citizen" | "office";

type Item = {
  title: string;
  text: string;
  icon: LucideIcon;
};

type PublicReceipt = {
  verified: boolean;
  message?: string;
  receipt: {
    receipt_number: string;
    issued_at: string | null;
    status: string;
  };
  payment: {
    payment_number: string;
    payment_date: string | null;
    payment_method: string;
    amount: string;
    currency: string;
  };
  invoice: { invoice_number: string } | null;
  municipality: {
    name: string;
    department: string;
  };
};

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

const CONTENT: Record<
  Portal,
  {
    badge: string;
    headline: [string, string];
    intro: string;
    loginHref: string;
    loginLabel: string;
    chips: Item[];
    flowTitle: string;
    flowIntro: string;
    flow: Item[];
    servicesTitle: string;
    servicesIntro: string;
    services: Item[];
    nav: { href: string; label: string }[];
  }
> = {
  citizen: {
    badge: "Citizen / Taxpayer portal",
    headline: ["Your municipal revenue,", "made simple."],
    intro:
      "View the assessments and invoices issued to you, pay approved amounts online, and keep digital receipts. Your taxpayer record is registered by the municipal revenue office.",
    loginHref: "/citizen/auth/login",
    loginLabel: "Open citizen portal",
    chips: [
      { title: "Secure access", text: "", icon: ShieldCheck },
      { title: "Online payment", text: "", icon: CreditCard },
      { title: "Digital receipts", text: "", icon: Receipt },
    ],
    flowTitle: "From assessment to receipt",
    flowIntro: "Here is what happens after the revenue office registers you.",
    flow: [
      { title: "Registered", text: "The revenue office registers and maintains your taxpayer record.", icon: UserCheck },
      { title: "Assessed", text: "Revenue assessments are created for your record.", icon: ClipboardList },
      { title: "Approved", text: "The office reviews and approves the assessment.", icon: ClipboardCheck },
      { title: "Invoiced", text: "An invoice becomes available once approved.", icon: FileText },
      { title: "Paid", text: "Pay the invoice with a supported digital provider.", icon: CreditCard },
      { title: "Receipted", text: "A digital receipt is issued after payment is confirmed.", icon: Receipt },
    ],
    servicesTitle: "What you can do",
    servicesIntro: "Everything tied to your registered taxpayer record.",
    services: [
      { title: "Taxpayer profile", text: "See the details the revenue office registered for you.", icon: Users2 },
      { title: "Assessments", text: "Review assessments issued to you.", icon: ClipboardList },
      { title: "Invoices", text: "See approved invoices and amounts due.", icon: FileText },
      { title: "Online payment", text: "Pay approved invoices through supported channels.", icon: CreditCard },
      { title: "Digital receipts", text: "Access a receipt after every confirmed payment.", icon: Receipt },
      { title: "Mobile app", text: "Use the same account on the Android taxpayer app.", icon: Smartphone },
    ],
    nav: [
      { href: "#workflow", label: "How it works" },
      { href: "#services", label: "Services" },
      { href: "#app", label: "Mobile app" },
    ],
  },

  office: {
    badge: "Revenue office portal",
    headline: ["Municipal revenue,", "managed properly."],
    intro:
      "Register taxpayers, manage assessments and approvals, issue invoices, monitor payments, and keep a complete audit trail in one connected system.",
    loginHref: "/office/auth/login",
    loginLabel: "Open office portal",
    chips: [
      { title: "Controlled workflow", text: "", icon: ShieldCheck },
      { title: "Approval controls", text: "", icon: ClipboardCheck },
      { title: "Revenue monitoring", text: "", icon: BarChart3 },
    ],
    flowTitle: "From registration to audit",
    flowIntro: "Every revenue activity follows a controlled, traceable workflow.",
    flow: [
      { title: "Register", text: "Maintain citizen and taxpayer records in the registry.", icon: UserCheck },
      { title: "Assess", text: "Create assessments from configured revenue services.", icon: ClipboardList },
      { title: "Approve", text: "Authorized officers approve or reject assessments.", icon: ClipboardCheck },
      { title: "Invoice", text: "Generate invoices from approved assessments.", icon: FileText },
      { title: "Payment", text: "Monitor payments from supported providers.", icon: CreditCard },
      { title: "Receipt", text: "Confirm payments and issue verifiable receipts.", icon: Receipt },
      { title: "Audit", text: "Reconcile transactions and keep the audit trail.", icon: ShieldCheck },
    ],
    servicesTitle: "What your team can manage",
    servicesIntro: "The tools available to authorized revenue officers.",
    services: [
      { title: "Taxpayer registry", text: "Register, search, and update taxpayer records.", icon: Users2 },
      { title: "Assessments", text: "Create and manage revenue assessments.", icon: ClipboardList },
      { title: "Approvals", text: "Review, approve, or reject assessments.", icon: ClipboardCheck },
      { title: "Invoices", text: "Generate and manage invoices.", icon: FileText },
      { title: "Payments", text: "Monitor and reconcile digital payments.", icon: CreditCard },
      { title: "Audit & reports", text: "Track activity and keep an auditable record.", icon: BarChart3 },
    ],
    nav: [
      { href: "#workflow", label: "How it works" },
      { href: "#services", label: "Services" },
      { href: "#field-app", label: "Field app" },
      { href: "#verify", label: "Verify receipt" },
    ],
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Field collection app (revenue office). PLACEHOLDER values: replace the url,
 * version, size and requirements with the real release details when the APK
 * is ready. Set `available: false` to show a disabled "Coming soon" button.
 */
const FIELD_APP = {
  available: true,
  name: "Adama Field Collection",
  url: "/downloads/adama-field-collection.apk", // TODO: replace with real download link
  version: "0.0.0 (placeholder)", // TODO
  size: "— MB", // TODO
  platform: "Android 8.0 or later", // TODO
} as const;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatAmount(value: string): string {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString("en", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : value;
}

/* -------------------------------------------------------------------------- */
/* Small components                                                           */
/* -------------------------------------------------------------------------- */

function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-primary text-primary-foreground ${
        size === "md" ? "size-9 rounded-xl" : "size-8 rounded-lg"
      }`}
    >
      <Stamp className="size-4" />
    </span>
  );
}

function PortalToggle({
  portal,
  onChange,
}: {
  portal: Portal;
  onChange: (portal: Portal) => void;
}) {
  const options: { value: Portal; label: string }[] = [
    { value: "citizen", label: "Citizen" },
    { value: "office", label: "Revenue Office" },
  ];

  return (
    <div
      role="group"
      aria-label="Choose portal"
      className="inline-flex rounded-full border bg-card p-1 shadow-sm"
    >
      {options.map((option) => {
        const active = portal === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <p className="text-sm font-semibold" style={accentText}>
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {text && (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

function CheckList({ items, onDark = false }: { items: string[]; onDark?: boolean }) {
  return (
    <ul
      className={`mt-5 space-y-2 text-sm ${
        onDark ? "text-primary-foreground/80" : "text-muted-foreground"
      }`}
    >
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2">
          <CheckCircle2
            className="size-4 shrink-0"
            style={onDark ? undefined : { color: SUCCESS }}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero background: layered animated waves                                    */
/* -------------------------------------------------------------------------- */

const WAVE_PATH =
  "M0,60 C150,10 450,110 600,60 C750,10 1050,110 1200,60 L1200,120 L0,120 Z";

const WAVES = [
  { fill: tint(ACCENT, 26), duration: "22s", reverse: false, height: "h-40 sm:h-52", offset: "bottom-0" },
  { fill: tint("var(--primary)", 8), duration: "30s", reverse: true, height: "h-32 sm:h-44", offset: "bottom-0" },
  { fill: tint("var(--background)", 70), duration: "38s", reverse: false, height: "h-20 sm:h-28", offset: "-bottom-px" },
];

function HeroWaves() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Soft glow */}
      <div
        className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: tint(ACCENT, 18) }}
      />
      <div
        className="absolute -left-24 top-40 size-64 rounded-full blur-3xl"
        style={{ backgroundColor: tint("var(--primary)", 6) }}
      />

      {/* Waves */}
      {WAVES.map((wave, index) => (
        <div
          key={index}
          className={`absolute inset-x-0 overflow-hidden ${wave.height} ${wave.offset}`}
        >
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="hero-wave h-full w-[200%] max-w-none"
            style={{
              animationDuration: wave.duration,
              animationDirection: wave.reverse ? "reverse" : "normal",
            }}
          >
            <path d={WAVE_PATH} style={{ fill: wave.fill }} />
          </svg>
        </div>
      ))}

      <style jsx global>{`
        @keyframes hero-wave-slide {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        .hero-wave {
          animation-name: hero-wave-slide;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-wave {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Field collection app download (office only, placeholder)                   */
/* -------------------------------------------------------------------------- */

function FieldAppDownload() {
  const details = [
    ["Version", FIELD_APP.version],
    ["Size", FIELD_APP.size],
    ["Platform", FIELD_APP.platform],
  ];

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Smartphone className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{FIELD_APP.name}</p>
          <p className="text-xs text-muted-foreground">
            For authorized revenue officers
          </p>
        </div>
      </div>

      <dl className="mt-4 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3">
        {details.map(([label, value]) => (
          <div key={label} className="bg-card px-3 py-2.5">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 break-words text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {FIELD_APP.available ? (
        <a
          href={FIELD_APP.url}
          download
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          <Download className="size-4" />
          Download for Android
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground opacity-60"
        >
          <Download className="size-4" />
          Coming soon
        </button>
      )}

      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Sign in with your office account. If Android blocks the install, allow
        installs from this source in your phone settings.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Receipt verification (office only)                                         */
/* -------------------------------------------------------------------------- */

function ReceiptVerifier() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const receiptNumber = query.trim();

    if (!receiptNumber) {
      setError("Enter a receipt number.");
      setResult(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/public/receipts/verify?receipt_number=${encodeURIComponent(
          receiptNumber,
        )}`,
        {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        },
      );

      const data = (await response.json().catch(() => null)) as PublicReceipt | null;

      if (!response.ok || !data?.verified) {
        throw new Error(data?.message ?? "This receipt could not be verified.");
      }

      setResult(data);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;

      setError(
        e instanceof Error ? e.message : "Unable to verify the receipt right now.",
      );
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 rounded-2xl border bg-card p-2 shadow-sm sm:flex-row"
      >
        <label htmlFor="receiptNumber" className="sr-only">
          Receipt number
        </label>

        <div className="flex min-w-0 flex-1 items-center">
          <Search className="ml-3 size-4 shrink-0 text-muted-foreground" />
          <input
            id="receiptNumber"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setResult(null);
              setError(null);
            }}
            placeholder="Receipt number, e.g. ADR-2026-081934"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Verifying…
            </>
          ) : (
            <>
              Verify
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      <div aria-live="polite">
        {error && (
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">Not verified</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div
            className="mt-3 overflow-hidden rounded-2xl border bg-card shadow-sm"
            style={{ borderColor: tint(SUCCESS, 35) }}
          >
            <div
              className="flex items-center justify-between gap-3 px-4 py-3"
              style={{ backgroundColor: tint(SUCCESS, 10) }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <CheckCircle2 className="size-6 shrink-0" style={{ color: SUCCESS }} />
                <div className="min-w-0">
                  <p className="text-sm font-bold" style={{ color: SUCCESS }}>
                    Receipt verified
                  </p>
                  <p className="truncate text-xs tabular-nums text-muted-foreground">
                    {result.receipt.receipt_number}
                  </p>
                </div>
              </div>
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ backgroundColor: tint(SUCCESS, 15), color: SUCCESS }}
              >
                {result.receipt.status || "Official"}
              </span>
            </div>

            <dl className="grid gap-px bg-border sm:grid-cols-2">
              {[
                ["Payment number", result.payment.payment_number],
                [
                  "Amount paid",
                  `${result.payment.currency} ${formatAmount(result.payment.amount)}`,
                ],
                ["Payment method", result.payment.payment_method],
                ["Payment date", formatDate(result.payment.payment_date)],
                ["Invoice", result.invoice?.invoice_number ?? "—"],
                ["Issued", formatDate(result.receipt.issued_at)],
              ].map(([label, value]) => (
                <div key={label} className="bg-card px-4 py-3">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 break-words text-sm font-semibold">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="flex items-center gap-3 border-t px-4 py-3">
              <BrandMark size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{result.municipality.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {result.municipality.department}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  const [portal, setPortal] = useState<Portal>("citizen");
  const [menuOpen, setMenuOpen] = useState(false);

  const content = CONTENT[portal];
  const isCitizen = portal === "citizen";

  function choosePortal(next: Portal) {
    setPortal(next);
    setMenuOpen(false);
  }

  const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/10 transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const secondaryButton =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl border bg-card px-6 py-3.5 text-sm font-semibold transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto";

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">


{/* Navbar */}
<header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <nav
    aria-label="Main"
    className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
  >
    {/* Brand */}
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <BrandMark />
      <span className="font-serif text-base font-bold">Adama Revenue</span>
    </Link>

    {/* Desktop links */}
    <ul className="hidden items-center gap-1 md:flex">
      {content.nav.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>

    {/* Desktop actions */}
    <div className="hidden items-center gap-3 md:flex">
      <PortalToggle portal={portal} onChange={choosePortal} />
      <div className="h-6 w-px bg-border" aria-hidden />
      <Button asChild>
        <Link href={content.loginHref}>Sign in</Link>
      </Button>
    </div>

    {/* Mobile menu */}
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-[85%] max-w-sm flex-col gap-0 p-0">
        <SheetHeader className="border-b p-4 text-left">
          <SheetTitle className="flex items-center gap-2.5">
            <BrandMark />
            <span className="font-serif text-base font-bold">Adama Revenue</span>
          </SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>

        <ul className="flex-1 space-y-1 overflow-y-auto p-4">
          {content.nav.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="space-y-3 border-t p-4">
          <PortalToggle portal={portal} onChange={choosePortal} />
          <Button asChild size="lg" className="w-full">
            <Link href={content.loginHref} onClick={() => setMenuOpen(false)}>
              Sign in
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  </nav>
</header>
   {/* Hero */}
<section className="relative isolate overflow-hidden px-4 pb-32 pt-16 sm:px-6 sm:pb-44 sm:pt-24">
  {/* Layer 1: interactive pattern */}
  <div
    aria-hidden
    className="absolute inset-0 -z-30 "
  >
    <MagnetLines
      lineColor="#d4d4d8"
      spacing={34}
      lineWidth={2}
      lineHeight={18}
      mode="orbit"
      shape="line"
      radius={200}
      fade={0.65}
      baseAngle={-10}
      stretch={0.4}
      inertia={0.35}
      bounce={0.3}
      ripple={0.3}
      clickPulse
      intro
      idle={false}
    />
  </div>

  {/* Layer 2: brand glow at the top */}
  {/* <div
    aria-hidden
    className="pointer-events-none absolute left-1/2 top-0 -z-20 h-72 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
  /> */}

  {/* Layer 3: soft spotlight behind the text so it stays readable */}
  <div
    aria-hidden
    className="pointer-events-none absolute left-1/2 top-1/2 -z-20 h-[75%] w-[85%] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/80 blur-3xl"
  />

  {/* Layer 4: bottom fade into the next section */}
  <div
    aria-hidden
    className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent"
  />

  {/* Content */}
  <div className="pointer-events-none mx-auto max-w-3xl text-center">
    <p className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur">
      <span className="size-1.5 rounded-full" style={{ backgroundColor: SUCCESS }} />
      {content.badge}
    </p>

    <h1 className="mt-6 text-balance font-serif text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
      {content.headline[0]}{" "}
      <span style={accentText}>{content.headline[1]}</span>
    </h1>

    <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
      {content.intro}
    </p>

    <div className="pointer-events-auto mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Link href={content.loginHref} className={`group w-full sm:w-auto ${primaryButton}`}>
        {content.loginLabel}
        <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
      </Link>

      {isCitizen ? (
        <a href="#app" className={`w-full sm:w-auto ${secondaryButton}`}>
          <Download className="size-4" />
          Get the mobile app
        </a>
      ) : (
        <a href="#verify" className={`w-full sm:w-auto ${secondaryButton}`}>
          <Search className="size-4" />
          Verify a receipt
        </a>
      )}
    </div>

    <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border/60 pt-6 text-sm text-muted-foreground">
      {content.chips.map((chip) => {
        const Icon = chip.icon;
        return (
          <li key={chip.title} className="flex items-center gap-1.5">
            <Icon className="size-4" style={{ color: SUCCESS }} />
            {chip.title}
          </li>
        );
      })}
    </ul>

    {isCitizen && (
      <p className="mt-6 text-xs text-muted-foreground">
        Citizens can&apos;t self-register. Visit the municipal revenue office to be
        registered as a taxpayer.
      </p>
    )}
  </div>
</section>
      {/* How it works */}
      <section id="workflow" className="scroll-mt-20 border-b bg-muted/40 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="How it works"
            title={content.flowTitle}
            text={content.flowIntro}
          />

          <ol
            className={`mt-10 grid gap-4 sm:grid-cols-2 ${
              content.flow.length === 7 ? "lg:grid-cols-4" : "lg:grid-cols-3"
            }`}
          >
            {content.flow.map((step, index) => {
              const Icon = step.icon;

              return (
                <li key={step.title} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <Icon className="size-5" />
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Services"
            title={content.servicesTitle}
            text={content.servicesIntro}
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.services.map((service) => {
              const Icon = service.icon;

              return (
                <div
                  key={service.title}
                  className="rounded-2xl border bg-card p-5 transition hover:shadow-md"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-base font-bold">{service.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{service.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>




{/* Citizen: mobile app */}
{isCitizen && (
  <section id="app" className="scroll-mt-20 px-4 pb-16 sm:px-6">
    <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:p-10">
      {/* Background */}
      <div
        aria-hidden
        className="absolute inset-0 [mask-image:linear-gradient(to_right,black,transparent_85%)]"
      >
        <DotGrid
          baseColor="#ffffff"
          activeColor="#ffffff"
          shape="circle"
          dotSize={4}
          gap={20}
          proximity={140}
          strength={1}
          bounce={0.6}
          tension={0.4}
          returnDuration={0.8}
          shockRadius={320}
          shockStrength={5}
          swell={0.8}
          stretch={0.5}
          glow={0.5}
          fade={0}
          intro
          opacity={0.18}
          mouseInteraction
          clickShock
        />
      </div>

      {/* Content */}
      <div className="relative z-10 grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-primary-foreground/70">
            Taxpayer mobile app
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight">
            Your revenue account, on your phone.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-primary-foreground/70">
            Download the official Android app to view assessments and invoices, pay,
            and open your receipts. It uses the same account as the web portal.
          </p>
          <CheckList
            onDark
            items={["Official application", "Android", "Same account as the web portal"]}
          />
        </div>

        <div className="rounded-2xl bg-card p-4 text-card-foreground">
          <TaxpayerAppDownload />
        </div>
      </div>
    </div>
  </section>
)}


{/* Office: field collection app */}
{!isCitizen && (
  <section id="field-app" className="scroll-mt-20 px-4 pb-16 sm:px-6">
    <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:p-10">
      {/* Background */}
      <div
        aria-hidden
        className="absolute inset-0 [mask-image:linear-gradient(to_right,black,transparent_85%)]"
      >
        <DotGrid
          baseColor="#ffffff"
          activeColor="#ffffff"
          shape="circle"
          dotSize={4}
          gap={20}
          proximity={140}
          strength={1}
          bounce={0.6}
          tension={0.4}
          returnDuration={0.8}
          shockRadius={320}
          shockStrength={5}
          swell={0.8}
          stretch={0.5}
          glow={0.5}
          fade={0}
          intro
          opacity={0.18}
          mouseInteraction
          clickShock
        />
      </div>

      {/* Content */}
      <div className="relative z-10 grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-primary-foreground/70">
            Field collection app
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight">
            Collect revenue directly in the field.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-primary-foreground/70">
            Give your field officers the Android app to look up taxpayers, record
            payments on the spot, and issue receipts. Everything syncs with the
            office portal.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-primary-foreground/80">
            {[
              { icon: MapPin, label: "Collect payments where taxpayers are" },
              { icon: WifiOff, label: "Keeps working with a weak connection" },
              { icon: Receipt, label: "Issue verifiable receipts on the spot" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="size-4 shrink-0" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-card p-4 text-card-foreground">
          <FieldAppDownload />
        </div>
      </div>
    </div>
  </section>
)}


{/* Office: receipt verification */}
{!isCitizen && (
        <section id="verify" className="scroll-mt-20 border-y bg-muted/40 px-4 py-16 sm:px-6">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold" style={accentText}>
                Receipt verification
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                Check that a receipt is genuine.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                Enter a receipt number to confirm it was issued by the Adama City Revenue
                Office, along with the payment it belongs to.
              </p>
              <CheckList
                items={[
                  "Official record lookup",
                  "Payment and invoice details",
                  "No sign-in needed",
                ]}
              />
            </div>

            <ReceiptVerifier />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <BrandMark size="sm" />
            <div>
              <p className="text-sm font-bold">Adama City Revenue</p>
              <p className="text-xs text-muted-foreground">
                Municipal revenue management platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="/feedback" className="font-medium transition hover:text-foreground">
              Send feedback
            </Link>
            <p>© {new Date().getFullYear()} Adama City Administration</p>
          </div>
        </div>
      </footer>


    </main>
  );
}