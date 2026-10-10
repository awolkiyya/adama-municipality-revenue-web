"use client";

import { useRef, useState, type FormEvent } from "react";
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
  Menu,
  Receipt,
  Search,
  ShieldCheck,
  Smartphone,
  Stamp,
  UserCheck,
  Users2,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import TaxpayerAppDownload from "@/components/TaxpayerAppDownload";

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
      {
        title: "Registered",
        text: "The revenue office registers and maintains your taxpayer record.",
        icon: UserCheck,
      },
      {
        title: "Assessed",
        text: "Revenue assessments are created for your record.",
        icon: ClipboardList,
      },
      {
        title: "Approved",
        text: "The office reviews and approves the assessment.",
        icon: ClipboardCheck,
      },
      {
        title: "Invoiced",
        text: "An invoice becomes available once approved.",
        icon: FileText,
      },
      {
        title: "Paid",
        text: "Pay the invoice with a supported digital provider.",
        icon: CreditCard,
      },
      {
        title: "Receipted",
        text: "A digital receipt is issued after payment is confirmed.",
        icon: Receipt,
      },
    ],
    servicesTitle: "What you can do",
    servicesIntro: "Everything tied to your registered taxpayer record.",
    services: [
      {
        title: "Taxpayer profile",
        text: "See the details the revenue office registered for you.",
        icon: Users2,
      },
      {
        title: "Assessments",
        text: "Review assessments issued to you.",
        icon: ClipboardList,
      },
      {
        title: "Invoices",
        text: "See approved invoices and amounts due.",
        icon: FileText,
      },
      {
        title: "Online payment",
        text: "Pay approved invoices through supported channels.",
        icon: CreditCard,
      },
      {
        title: "Digital receipts",
        text: "Access a receipt after every confirmed payment.",
        icon: Receipt,
      },
      {
        title: "Mobile app",
        text: "Use the same account on the Android taxpayer app.",
        icon: Smartphone,
      },
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
      {
        title: "Register",
        text: "Maintain citizen and taxpayer records in the registry.",
        icon: UserCheck,
      },
      {
        title: "Assess",
        text: "Create assessments from configured revenue services.",
        icon: ClipboardList,
      },
      {
        title: "Approve",
        text: "Authorized officers approve or reject assessments.",
        icon: ClipboardCheck,
      },
      {
        title: "Invoice",
        text: "Generate invoices from approved assessments.",
        icon: FileText,
      },
      {
        title: "Payment",
        text: "Monitor payments from supported providers.",
        icon: CreditCard,
      },
      {
        title: "Receipt",
        text: "Confirm payments and issue verifiable receipts.",
        icon: Receipt,
      },
      {
        title: "Audit",
        text: "Reconcile transactions and keep the audit trail.",
        icon: ShieldCheck,
      },
    ],
    servicesTitle: "What your team can manage",
    servicesIntro: "The tools available to authorized revenue officers.",
    services: [
      {
        title: "Taxpayer registry",
        text: "Register, search, and update taxpayer records.",
        icon: Users2,
      },
      {
        title: "Assessments",
        text: "Create and manage revenue assessments.",
        icon: ClipboardList,
      },
      {
        title: "Approvals",
        text: "Review, approve, or reject assessments.",
        icon: ClipboardCheck,
      },
      {
        title: "Invoices",
        text: "Generate and manage invoices.",
        icon: FileText,
      },
      {
        title: "Payments",
        text: "Monitor and reconcile digital payments.",
        icon: CreditCard,
      },
      {
        title: "Audit & reports",
        text: "Track activity and keep an auditable record.",
        icon: BarChart3,
      },
    ],
    nav: [
      { href: "#workflow", label: "How it works" },
      { href: "#services", label: "Services" },
      { href: "#verify", label: "Verify receipt" },
    ],
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

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
      className="inline-flex rounded-full border border-black/10 bg-white p-1 shadow-sm"
    >
      {options.map((option) => {
        const active = portal === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F1B2E] focus-visible:ring-offset-2 ${
              active
                ? "bg-[#0F1B2E] text-white"
                : "text-black/60 hover:text-black"
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
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A6410]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {text && <p className="mt-3 text-sm leading-6 text-black/60">{text}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero background: layered animated waves                                    */
/* -------------------------------------------------------------------------- */

const WAVE_PATH =
  "M0,60 C150,10 450,110 600,60 C750,10 1050,110 1200,60 L1200,120 L0,120 Z";

const WAVES = [
  { fill: "rgba(232,196,104,0.28)", duration: "22s", reverse: false, height: "h-40 sm:h-52", offset: "bottom-0" },
  { fill: "rgba(15,27,46,0.07)", duration: "30s", reverse: true, height: "h-32 sm:h-44", offset: "bottom-0" },
  { fill: "rgba(255,255,255,0.6)", duration: "38s", reverse: false, height: "h-20 sm:h-28", offset: "-bottom-px" },
];

function HeroWaves() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Soft glow */}
      <div className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[#E8C468]/20 blur-3xl" />
      <div className="absolute -left-24 top-40 h-64 w-64 rounded-full bg-[#0F1B2E]/5 blur-3xl" />

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
            <path d={WAVE_PATH} fill={wave.fill} />
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

      const data = (await response.json().catch(() => null)) as
        | PublicReceipt
        | null;

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
        className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-white p-2 shadow-sm sm:flex-row"
      >
        <label htmlFor="receiptNumber" className="sr-only">
          Receipt number
        </label>

        <div className="flex min-w-0 flex-1 items-center">
          <Search className="ml-3 h-4 w-4 shrink-0 text-black/30" />
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
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-black/30"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F1B2E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1a2b45] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </>
          ) : (
            <>
              Verify
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div aria-live="polite">
        {error && (
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-800">Not verified</p>
              <p className="mt-0.5 text-sm text-red-700/80">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-[#1F5C43]/20 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 bg-[#1F5C43]/5 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-[#1F5C43]" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1F5C43]">Receipt verified</p>
                  <p className="truncate font-mono text-xs text-black/50">
                    {result.receipt.receipt_number}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-[#1F5C43]/10 px-2.5 py-1 text-xs font-semibold text-[#1F5C43]">
                {result.receipt.status || "Official"}
              </span>
            </div>

            <dl className="grid gap-px bg-black/5 sm:grid-cols-2">
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
                <div key={label} className="bg-white px-4 py-3">
                  <dt className="text-xs text-black/45">{label}</dt>
                  <dd className="mt-0.5 break-words text-sm font-semibold">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="flex items-center gap-3 border-t border-black/5 px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0F1B2E] text-[#E8C468]">
                <Stamp className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{result.municipality.name}</p>
                <p className="truncate text-xs text-black/50">
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

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#EFEBDE] text-[#1B1B16]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#EFEBDE]/90 backdrop-blur-xl">
        <nav
          aria-label="Main"
          className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
        >
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F1B2E] text-[#E8C468]">
              <Stamp className="h-4 w-4" />
            </span>
            <span className="font-serif text-base font-bold">Adama Revenue</span>
          </Link>

          <div className="hidden items-center gap-6 text-sm font-medium md:flex">
            {content.nav.map((link) => (
              <a key={link.href} href={link.href} className="transition hover:text-[#8A6410]">
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <PortalToggle portal={portal} onChange={choosePortal} />
            <Link
              href={content.loginHref}
              className="rounded-xl bg-[#0F1B2E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a2b45]"
            >
              Sign in
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-lg p-2 md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {menuOpen && (
          <div className="space-y-1 border-t border-black/5 px-4 py-4 md:hidden">
            <div className="pb-3">
              <PortalToggle portal={portal} onChange={choosePortal} />
            </div>

            {content.nav.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-black/5"
              >
                {link.label}
              </a>
            ))}

            <Link
              href={content.loginHref}
              className="mt-2 block rounded-xl bg-[#0F1B2E] px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Sign in
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-36 pt-14 sm:px-6 sm:pb-48 sm:pt-20">
        <HeroWaves />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-black/60">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1F5C43]" />
            {content.badge}
          </p>

          <h1 className="mt-6 font-serif text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            {content.headline[0]}{" "}
            <span className="text-[#8A6410]">{content.headline[1]}</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-black/60">
            {content.intro}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={content.loginHref}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F1B2E] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:bg-[#1a2b45] sm:w-auto"
            >
              {content.loginLabel}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>

            {isCitizen ? (
              <a
                href="#app"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-6 py-3.5 text-sm font-semibold transition hover:bg-white/70 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Get the mobile app
              </a>
            ) : (
              <a
                href="#verify"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-6 py-3.5 text-sm font-semibold transition hover:bg-white/70 sm:w-auto"
              >
                <Search className="h-4 w-4" />
                Verify a receipt
              </a>
            )}
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-black/55">
            {content.chips.map((chip) => {
              const Icon = chip.icon;
              return (
                <li key={chip.title} className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-[#1F5C43]" />
                  {chip.title}
                </li>
              );
            })}
          </ul>

          {isCitizen && (
            <p className="mt-6 text-xs text-black/45">
              Citizens can&apos;t self-register. Visit the municipal revenue office to be
              registered as a taxpayer.
            </p>
          )}
        </div>
      </section>

      {/* How it works */}
      <section
        id="workflow"
        className="scroll-mt-20 border-b border-black/5 bg-white/60 px-4 py-16 sm:px-6"
      >
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
                <li
                  key={step.title}
                  className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F1B2E] text-[#E8C468]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs font-bold text-[#8A6410]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-black/55">{step.text}</p>
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
                  className="rounded-2xl border border-black/5 bg-white p-5 transition hover:shadow-md"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F1B2E]/5 text-[#0F1B2E]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-bold">{service.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-black/55">{service.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Citizen: mobile app */}
      {isCitizen && (
        <section id="app" className="scroll-mt-20 px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-6xl rounded-3xl bg-[#0F1B2E] p-6 text-white sm:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E8C468]">
                  Taxpayer mobile app
                </p>
                <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight">
                  Your revenue account, on your phone.
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/65">
                  Download the official Android app to view assessments and invoices, pay,
                  and open your receipts. It uses the same account as the web portal.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-white/75">
                  {["Official application", "Android", "Same account as the web portal"].map(
                    (item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#E8C468]" />
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div className="rounded-2xl bg-white p-4 text-[#1B1B16]">
                <TaxpayerAppDownload />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Office: receipt verification */}
      {!isCitizen && (
        <section
          id="verify"
          className="scroll-mt-20 border-y border-black/5 bg-white/60 px-4 py-16 sm:px-6"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A6410]">
                Receipt verification
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                Check that a receipt is genuine.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-black/60">
                Enter a receipt number to confirm it was issued by the Adama City Revenue
                Office, along with the payment it belongs to.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-black/60">
                {["Official record lookup", "Payment and invoice details", "No sign-in needed"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#1F5C43]" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <ReceiptVerifier />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F1B2E] text-[#E8C468]">
              <Stamp className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold">Adama City Revenue</p>
              <p className="text-xs text-black/45">Municipal revenue management platform</p>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs text-black/50">
            <Link href="/feedback" className="font-medium transition hover:text-black">
              Send feedback
            </Link>
            <p>© {new Date().getFullYear()} Adama City Administration</p>
          </div>
        </div>
      </footer>
    </main>
  );
}