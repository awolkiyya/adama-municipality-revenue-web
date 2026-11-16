"use client";

import {
  useRef,
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
  ReactNode,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Download,
  Expand,
  FileText,
  Loader2,
  MapPin,
  Menu,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Stamp,
  UserCheck,
  Users2,
  WifiOff,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import MagnetLines from "@/components/MagnetLines";
import DotGrid from "@/components/DotGrid";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { useLatestMobileAppRelease } from "@/hooks/use-latest-mobile-app-release";
import { MobileAppRelease, MobileAppType } from "@/types/mobile-app-release";

/* -------------------------------------------------------------------------- */
/* API configuration                                                         */
/* -------------------------------------------------------------------------- */

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

/* -------------------------------------------------------------------------- */
/* Theme                                                                      */
/* -------------------------------------------------------------------------- */

const SUCCESS = "var(--success, var(--chart-1))";
const ACCENT = "var(--warning, var(--chart-4))";

const tint = (color: string, percent = 12) =>
  `color-mix(in oklab, ${color} ${percent}%, transparent)`;

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
      { href: "#field-app", label: "Field app" },
      { href: "#verify", label: "Verify receipt" },
    ],
  },
};

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

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "—";

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getApiErrorMessage(
  payload: unknown,
  fallback: string,
): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallback;
}

/**
 * API resources may return either an absolute URL or a relative download path.
 * Relative paths are resolved against NEXT_PUBLIC_API_URL.
 */
// function resolveDownloadUrl(release: MobileAppRelease): string {
//   const path =
//     release.download_url ??
//     release.apk_download_url ??
//     `/api/v1/mobile-app-releases/${release.id}/download`;

//   if (!path) return "";

//   if (/^https?:\/\//i.test(path)) {
//     return path;
//   }

//   if (!API_URL) {
//     return path;
//   }

//   return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
// }


/* -------------------------------------------------------------------------- */
/* Mobile app release download                                                */
/* -------------------------------------------------------------------------- */

function resolveDownloadUrl(release: MobileAppRelease): string {
  const downloadUrl = (
    release as MobileAppRelease & {
      download_url?: string | null;
    }
  ).download_url;

  if (!downloadUrl || !API_URL) {
    return "";
  }

  try {
    const configuredApiUrl = new URL(API_URL);
    const resolvedUrl = new URL(downloadUrl, configuredApiUrl);

    // Always use the configured API host.
    // This prevents internal development IPs from being exposed to users.
    resolvedUrl.protocol = configuredApiUrl.protocol;
    resolvedUrl.host = configuredApiUrl.host;

    return resolvedUrl.toString();
  } catch {
    return "";
  }
}


interface MobileAppReleaseDownloadProps {
  appType: MobileAppType;
  appName: string;
  description: string;
  platform?: string;
}


/* -------------------------------------------------------------------------- */
/* Shared styles                                                              */
/* -------------------------------------------------------------------------- */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

// 44px+ tap target, full width on mobile, natural width on larger screens
const secondaryButton = `inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted active:bg-muted/80 sm:w-auto ${focusRing}`;

/* -------------------------------------------------------------------------- */
/* Small building blocks                                                      */
/* -------------------------------------------------------------------------- */

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 px-2 py-3 text-center sm:px-4 sm:py-4">
      <dt className="text-[11px] font-medium text-muted-foreground sm:text-xs">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-foreground sm:text-base">
        {value}
      </dd>
    </div>
  );
}

function StatusPanel({
  tone = "neutral",
  title,
  message,
  action,
}: {
  tone?: "neutral" | "error";
  title: string;
  message: ReactNode;
  action?: ReactNode;
}) {
  const isError = tone === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`rounded-2xl border p-4 sm:p-5 ${
        isError
          ? "border-destructive/30 bg-destructive/5"
          : "bg-muted/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          aria-hidden="true"
          className={`mt-0.5 size-5 shrink-0 ${
            isError ? "text-destructive" : "text-muted-foreground"
          }`}
        />
        <div className="min-w-0">
          <p
            className={`text-sm font-semibold ${
              isError ? "text-destructive" : "text-foreground"
            }`}
          >
            {title}
          </p>
          <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">
            {message}
          </p>
        </div>
      </div>

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-3"
    >
      <span className="sr-only">Loading latest release…</span>

      <div className="grid grid-cols-3 divide-x overflow-hidden rounded-2xl border bg-card">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 px-3 py-4">
            <div className="mx-auto h-2.5 w-10 animate-pulse rounded bg-muted motion-reduce:animate-none" />
            <div className="mx-auto h-4 w-14 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          </div>
        ))}
      </div>

      <div className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-muted/50 text-sm text-muted-foreground">
        <Loader2
          aria-hidden="true"
          className="size-4 animate-spin motion-reduce:animate-none"
        />
        Loading latest release…
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                             */
/* -------------------------------------------------------------------------- */

export function MobileAppReleaseDownload({
  appType,
  appName,
  description,
  platform = "Android",
}: MobileAppReleaseDownloadProps) {
  const { release, loading, error, notFound, retry } =
    useLatestMobileAppRelease(appType);

  // Resolve the download URL against the configured API host.
  const downloadUrl = release ? resolveDownloadUrl(release) : "";
  const canDownload = Boolean(release?.is_downloadable && downloadUrl);

  const showDetails = !loading && !error && !notFound && Boolean(release);

  return (
    <section
      aria-label={`${appName} download`}
      className="mx-auto w-full max-w-md space-y-4 sm:space-y-5"
    >
      {/* App identity */}
      <header className="flex items-center gap-3 sm:gap-4">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm sm:size-14"
        >
          <Smartphone className="size-6 sm:size-7" />
        </span>

        <div className="min-w-0">
          <h3 className="truncate text-base font-bold leading-tight text-foreground sm:text-lg">
            {appName}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground sm:text-sm">
            {description}
          </p>
        </div>
      </header>

      {/* Loading */}
      {loading && <LoadingSkeleton />}

      {/* No published release */}
      {!loading && notFound && (
        <StatusPanel
          title="Coming soon"
          message={
            <>
              No published release is available for {appName} yet. Please
              check again later.
            </>
          }
          action={
            <button type="button" onClick={retry} className={secondaryButton}>
              <RefreshCw aria-hidden="true" className="size-4" />
              Check again
            </button>
          }
        />
      )}

      {/* Error */}
      {!loading && error && (
        <StatusPanel
          tone="error"
          title="Release unavailable"
          message={error}
          action={
            <button type="button" onClick={retry} className={secondaryButton}>
              <RefreshCw aria-hidden="true" className="size-4" />
              Try again
            </button>
          }
        />
      )}

      {/* Release details */}
      {showDetails && release && (
        <div className="space-y-4">
          <dl className="grid grid-cols-3 divide-x overflow-hidden rounded-2xl border bg-card shadow-sm">
            <Stat label="Version" value={release.version_name} />
            <Stat
              label="APK size"
              value={formatFileSize(release.apk?.size_bytes)}
            />
            <Stat label="Platform" value={platform} />
          </dl>

          {release.is_mandatory && (
            <div
              role="note"
              className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3"
            >
              <p className="text-xs leading-5 text-foreground sm:text-sm">
                <span className="font-semibold">Required update:</span> this
                version must be installed to keep using the app.
              </p>
            </div>
          )}

          {canDownload ? (
            <div className="space-y-2">
              <a
                href={downloadUrl}
                download
                className={`group inline-flex min-h-14 w-full items-center gap-3 rounded-2xl bg-primary px-5 text-base font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 active:bg-primary/80 ${focusRing}`}
              >
                <Download aria-hidden="true" className="size-5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">
                  Download for {platform}
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </a>

              {release.apk?.original_name && (
                <p className="truncate text-center text-xs text-muted-foreground">
                  {release.apk.original_name}
                </p>
              )}
            </div>
          ) : (
            <StatusPanel
              title="Download unavailable"
              message="This release can't be downloaded right now. Contact the system administrator if the problem continues."
            />
          )}
        </div>
      )}

      {/* Security / install note */}
      <aside className="flex items-start gap-3 rounded-2xl bg-muted/50 p-3.5 sm:p-4">
        <ShieldCheck
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-primary"
        />
        <p className="text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
          This is the official Adama Municipal Revenue Android app. Install
          it only from this page, on a compatible Android device. If Android
          asks, allow installs from your browser.
        </p>
      </aside>
    </section>
  );
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
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {text}
        </p>
      )}
    </div>
  );
}

function CheckList({
  items,
  onDark = false,
}: {
  items: string[];
  onDark?: boolean;
}) {
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
/* Field collection app preview (office only)                                 */
/* -------------------------------------------------------------------------- */

const PREVIEW_SRC = "/images/Adeemsa Appii fi Maxxansa Rasiitii.gif";

const PREVIEW_ALT =
  "Handheld Android POS terminal with built-in receipt printer running the Adama Field Collection app";

function FieldAppDownload() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="space-y-5">
      {/* Device preview */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Enlarge device preview"
          className="group relative block aspect-[16/11] w-full bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <Image
            src={PREVIEW_SRC}
            alt={PREVIEW_ALT}
            fill
            sizes="(max-width: 640px) 100vw, 420px"
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
            unoptimized
          />

          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm">
            Android
          </span>

          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-foreground/85 px-3 py-1.5 text-[11px] font-semibold text-background opacity-90 shadow-md backdrop-blur transition group-hover:bg-primary group-hover:text-primary-foreground">
            <Expand className="size-3" />
            Enlarge
          </span>
        </button>

        <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">App preview</p>
            <p className="truncate text-xs text-muted-foreground">
              Runs on Android handheld terminals
            </p>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            <Printer className="size-3" />
            Receipt printing
          </span>
        </div>
      </div>

      {/* Latest field collector release */}
      <MobileAppReleaseDownload
        appType="field_collector"
        appName="Adama Field Collection"
        description="For authorized revenue officers"
        platform="Android 8.0+"
      />

      {/* Device preview lightbox */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Device preview"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close preview"
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-5" />
          </button>

          <div
            onClick={(event) => event.stopPropagation()}
            className="relative aspect-square w-full max-w-[min(90vw,80vh,560px)] overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <Image
              src={PREVIEW_SRC}
              alt={PREVIEW_ALT}
              fill
              sizes="(max-width: 640px) 90vw, 560px"
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
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

    if (!API_URL) {
      setError("The API address is not configured.");
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
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
          signal: controller.signal,
        },
      );

      const data = (await response.json().catch(() => null)) as
        | PublicReceipt
        | null;

      if (!response.ok || !data?.verified) {
        throw new Error(
          data?.message ?? "This receipt could not be verified.",
        );
      }

      setResult(data);
    } catch (cause) {
      if (
        cause instanceof DOMException &&
        cause.name === "AbortError"
      ) {
        return;
      }

      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to verify the receipt right now.",
      );
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

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
            onChange={(event) => {
              setQuery(event.target.value);
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
              <p className="text-sm font-semibold text-destructive">
                Not verified
              </p>

              <p className="mt-0.5 text-sm text-muted-foreground">
                {error}
              </p>
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
                <CheckCircle2
                  className="size-6 shrink-0"
                  style={{ color: SUCCESS }}
                />

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
                style={{
                  backgroundColor: tint(SUCCESS, 15),
                  color: SUCCESS,
                }}
              >
                {result.receipt.status || "Official"}
              </span>
            </div>

            <dl className="grid gap-px bg-border sm:grid-cols-2">
              {[
                ["Payment number", result.payment.payment_number],
                [
                  "Amount paid",
                  `${result.payment.currency} ${formatAmount(
                    result.payment.amount,
                  )}`,
                ],
                ["Payment method", result.payment.payment_method],
                ["Payment date", formatDate(result.payment.payment_date)],
                ["Invoice", result.invoice?.invoice_number ?? "—"],
                ["Issued", formatDate(result.receipt.issued_at)],
              ].map(([label, value]) => (
                <div key={label} className="bg-card px-4 py-3">
                  <dt className="text-xs text-muted-foreground">{label}</dt>

                  <dd className="mt-0.5 break-words text-sm font-semibold">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="flex items-center gap-3 border-t px-4 py-3">
              <BrandMark size="sm" />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {result.municipality.name}
                </p>

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
      {/* ------------------------------------------------------------------ */}
      {/* Navbar                                                             */}
      {/* ------------------------------------------------------------------ */}

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
            <span className="font-serif text-base font-bold">
              Adama Revenue
            </span>
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

            <SheetContent
              side="right"
              className="flex w-[85%] max-w-sm flex-col gap-0 p-0"
            >
              <SheetHeader className="border-b p-4 text-left">
                <SheetTitle className="flex items-center gap-2.5">
                  <BrandMark />
                  <span className="font-serif text-base font-bold">
                    Adama Revenue
                  </span>
                </SheetTitle>

                <SheetDescription className="sr-only">
                  Site navigation
                </SheetDescription>
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
                  <Link
                    href={content.loginHref}
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                */}
      {/* ------------------------------------------------------------------ */}

      <section className="relative isolate overflow-hidden px-4 pb-32 pt-16 sm:px-6 sm:pb-44 sm:pt-24">
        {/* Interactive pattern */}
        <div aria-hidden className="absolute inset-0 -z-30">
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

        {/* Spotlight */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-20 h-[75%] w-[85%] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/80 blur-3xl"
        />

        {/* Bottom fade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent"
        />

        {/* Hero content */}
        <div className="pointer-events-none mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: SUCCESS }}
            />
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
            <Link
              href={content.loginHref}
              className={`group w-full sm:w-auto ${primaryButton}`}
            >
              {content.loginLabel}

              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>

            {isCitizen ? (
              <a href="#app" className={`w-full sm:w-auto ${secondaryButton}`}>
                <Download className="size-4" />
                Get the mobile app
              </a>
            ) : (
              <a
                href="#verify"
                className={`w-full sm:w-auto ${secondaryButton}`}
              >
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
              Citizens can&apos;t self-register. Visit the municipal revenue
              office to be registered as a taxpayer.
            </p>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How it works                                                       */}
      {/* ------------------------------------------------------------------ */}

      <section
        id="workflow"
        className="scroll-mt-20 border-b bg-muted/40 px-4 py-16 sm:px-6"
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
                  className="rounded-2xl border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <Icon className="size-5" />
                    </span>

                    <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold">{step.title}</h3>

                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {step.text}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Services                                                            */}
      {/* ------------------------------------------------------------------ */}

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

                  <h3 className="mt-4 text-base font-bold">
                    {service.title}
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {service.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Citizen: taxpayer mobile app                                       */}
      {/* ------------------------------------------------------------------ */}

      {isCitizen && (
        <section
          id="app"
          className="scroll-mt-20 px-4 pb-16 sm:px-6"
        >
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:p-10">
            {/* Background pattern */}
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
                  Download the official Android app to view assessments and
                  invoices, pay, and open your receipts. It uses the same
                  account as the web portal.
                </p>

                <CheckList
                  onDark
                  items={[
                    "Official application",
                    "Android",
                    "Same account as the web portal",
                  ]}
                />
              </div>

              <div className="rounded-2xl bg-card p-4 text-card-foreground">
                <MobileAppReleaseDownload
                  appType="taxpayer"
                  appName="Adama Taxpayer"
                  description="For registered taxpayers"
                  platform="Android"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Office: field collection app                                       */}
      {/* ------------------------------------------------------------------ */}

      {!isCitizen && (
        <section
          id="field-app"
          className="scroll-mt-20 px-4 pb-16 sm:px-6"
        >
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:p-10">
            {/* Background pattern */}
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
                  Give your field officers the Android app to look up
                  taxpayers, record payments on the spot, and issue receipts.
                  Everything syncs with the office portal.
                </p>

                <ul className="mt-5 space-y-2 text-sm text-primary-foreground/80">
                  {[
                    {
                      icon: MapPin,
                      label: "Collect payments where taxpayers are",
                    },
                    {
                      icon: WifiOff,
                      label: "Keeps working with a weak connection",
                    },
                    {
                      icon: Receipt,
                      label: "Issue verifiable receipts on the spot",
                    },
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

      {/* ------------------------------------------------------------------ */}
      {/* Office: receipt verification                                       */}
      {/* ------------------------------------------------------------------ */}

      {!isCitizen && (
        <section
          id="verify"
          className="scroll-mt-20 border-y bg-muted/40 px-4 py-16 sm:px-6"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold" style={accentText}>
                Receipt verification
              </p>

              <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                Check that a receipt is genuine.
              </h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                Enter a receipt number to confirm it was issued by the Adama
                City Revenue Office, along with the payment it belongs to.
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

      {/* ------------------------------------------------------------------ */}
      {/* Footer                                                              */}
      {/* ------------------------------------------------------------------ */}

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
            <Link
              href="/feedback"
              className="font-medium transition hover:text-foreground"
            >
              Send feedback
            </Link>

            <p>© {new Date().getFullYear()} Adama City Administration</p>
          </div>
        </div>
      </footer>
    </main>
  );
}