"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  Landmark,
  Menu,
  MessageSquareWarning,
  Receipt,
  Search,
  ShieldCheck,
  Smartphone,
  Stamp,
  UserCheck,
  Users2,
  WalletCards,
  X,
  Download,
  LayoutDashboard,
  Bell,
  Wallet,
  UserRound,
} from "lucide-react";

type Portal = "citizen" | "office";

/* =========================================================
   PORTAL-SPECIFIC TYPES
========================================================= */

type FlowStep = {
  number: string;
  title: string;
  description: string;
  icon: typeof UserCheck;
};

type Service = {
  title: string;
  text: string;
  icon: typeof Users2;
};

/* =========================================================
   CITIZEN WORKFLOW

   Citizen = Taxpayer.

   Citizens do NOT create their own taxpayer registration.
   Their taxpayer record is registered and maintained by
   authorized municipal revenue officers.
========================================================= */

const CITIZEN_FLOW: FlowStep[] = [
  {
    number: "01",
    title: "Get Registered",
    description:
      "Your taxpayer record is registered and maintained by the responsible municipal revenue office.",
    icon: UserCheck,
  },
  {
    number: "02",
    title: "Assessment",
    description:
      "View revenue assessments created for your registered taxpayer record.",
    icon: ClipboardList,
  },
  {
    number: "03",
    title: "Approval",
    description:
      "The responsible revenue office reviews and approves the assessment before payment.",
    icon: ClipboardCheck,
  },
  {
    number: "04",
    title: "Invoice",
    description:
      "An invoice becomes available after the assessment has been approved.",
    icon: FileText,
  },
  {
    number: "05",
    title: "Pay",
    description:
      "Pay your approved invoice using an available digital payment provider.",
    icon: CreditCard,
  },
  {
    number: "06",
    title: "Receipt",
    description:
      "Receive a digital receipt after the payment has been successfully confirmed.",
    icon: Receipt,
  },
];

/* =========================================================
   OFFICE WORKFLOW
========================================================= */

const OFFICE_FLOW: FlowStep[] = [
  {
    number: "01",
    title: "Register",
    description:
      "Register and maintain citizen and taxpayer records in the municipal revenue registry.",
    icon: UserCheck,
  },
  {
    number: "02",
    title: "Assess",
    description:
      "Create revenue assessments using the configured municipal revenue services.",
    icon: ClipboardList,
  },
  {
    number: "03",
    title: "Approve",
    description:
      "Authorized decision officers review and approve or reject revenue assessments.",
    icon: ClipboardCheck,
  },
  {
    number: "04",
    title: "Invoice",
    description:
      "Generate invoices from approved assessments and make them available for payment.",
    icon: FileText,
  },
  {
    number: "05",
    title: "Payment",
    description:
      "Monitor payment transactions received through supported payment providers.",
    icon: CreditCard,
  },
  {
    number: "06",
    title: "Receipt",
    description:
      "Confirm successful payments and issue verifiable digital receipts.",
    icon: Receipt,
  },
  {
    number: "07",
    title: "Audit",
    description:
      "Reconcile transactions and maintain a complete revenue audit trail.",
    icon: ShieldCheck,
  },
];

/* =========================================================
   CITIZEN SERVICES

   Citizen is the taxpayer-facing side.
========================================================= */

const CITIZEN_SERVICES: Service[] = [
  {
    title: "My Taxpayer Profile",
    text: "View the taxpayer information registered for you by the municipal revenue office.",
    icon: Users2,
  },
  {
    title: "My Assessments",
    text: "View assessments associated with your registered taxpayer record.",
    icon: ClipboardList,
  },
  {
    title: "My Invoices",
    text: "View approved invoices and amounts due.",
    icon: FileText,
  },
  {
    title: "Online Payment",
    text: "Pay approved invoices through supported payment channels.",
    icon: CreditCard,
  },
  {
    title: "Digital Receipts",
    text: "Access receipts generated after successful payments.",
    icon: Receipt,
  },
  {
    title: "Receipt Verification",
    text: "Verify whether a municipal receipt exists in the system.",
    icon: ShieldCheck,
  },
];

/* =========================================================
   OFFICE SERVICES
========================================================= */

const OFFICE_SERVICES: Service[] = [
  {
    title: "Taxpayer Registry",
    text: "Register, search, update, and manage citizen and taxpayer records.",
    icon: Users2,
  },
  {
    title: "Assessments",
    text: "Create and manage municipal revenue assessments.",
    icon: ClipboardList,
  },
  {
    title: "Approvals",
    text: "Review, approve, or reject revenue assessments.",
    icon: ClipboardCheck,
  },
  {
    title: "Invoices",
    text: "Generate and manage invoices from approved assessments.",
    icon: FileText,
  },
  {
    title: "Payments",
    text: "Monitor and reconcile payments from digital providers.",
    icon: CreditCard,
  },
  {
    title: "Audit & Reports",
    text: "Track revenue activity and maintain an auditable record.",
    icon: BarChart3,
  },
];

/* =========================================================
   PAYMENT PROVIDERS
========================================================= */

const PAYMENTS = [
  {
    title: "Telebirr",
    text: "Mobile payment",
    icon: Smartphone,
  },
  {
    title: "Chapa",
    text: "Online payment",
    icon: CreditCard,
  },
  {
    title: "Other providers",
    text: "Expandable channels",
    icon: WalletCards,
  },
];

/* =========================================================
   PORTAL TOGGLE
========================================================= */

function PortalToggle({
  portal,
  setPortal,
}: {
  portal: Portal;
  setPortal: (value: Portal) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-black/10 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => setPortal("citizen")}
        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
          portal === "citizen"
            ? "bg-[#0F1B2E] text-white"
            : "text-black/50 hover:text-black"
        }`}
      >
        Citizen
      </button>

      <button
        type="button"
        onClick={() => setPortal("office")}
        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
          portal === "office"
            ? "bg-[#0F1B2E] text-white"
            : "text-black/50 hover:text-black"
        }`}
      >
        Revenue Office
      </button>
    </div>
  );
}

/* =========================================================
   CITIZEN DESKTOP PORTAL FRAME
========================================================= */

function CitizenPortalDesktopFrame() {
  return (
    <div className="mx-auto w-full max-w-[620px]">
      <div
        className="
          relative
          aspect-[16/9]
          w-full
          overflow-hidden
          rounded-[1rem]
          border
          border-black/10
          bg-white
          shadow-[0_25px_60px_-30px_rgba(0,0,0,0.45)]
        "
      >
        {/* =================================================
            BROWSER BAR
        ================================================= */}

        <div className="absolute inset-x-0 top-0 z-10 flex h-[10%] min-h-[24px] items-center gap-1.5 border-b border-black/5 bg-[#F5F3EA] px-[2%]">
          <span className="h-1.5 w-1.5 rounded-full bg-black/15 sm:h-2 sm:w-2" />
          <span className="h-1.5 w-1.5 rounded-full bg-black/15 sm:h-2 sm:w-2" />
          <span className="h-1.5 w-1.5 rounded-full bg-black/15 sm:h-2 sm:w-2" />

          <div className="ml-2 flex h-[55%] min-w-0 flex-1 items-center rounded-md bg-white px-2 sm:ml-3">
            <span className="truncate text-[5px] text-black/30 sm:text-[6px]">
              revenue.adamacity.gov.et/citizen
            </span>
          </div>
        </div>

        {/* =================================================
            PORTAL CONTENT
        ================================================= */}

        <div className="absolute inset-x-0 bottom-0 top-[10%] grid grid-cols-[18%_82%]">
          {/* =================================================
              SIDEBAR
          ================================================= */}

          <div className="overflow-hidden bg-[#0F1B2E] p-[4%] text-white">
            <div className="mb-[14%] flex items-center gap-1.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#E8C468] text-[#0F1B2E]">
                <Stamp className="h-2.5 w-2.5" />
              </div>

              <span className="truncate text-[5px] font-bold sm:text-[6px]">
                Revenue
              </span>
            </div>

            <div className="space-y-1">
              {[
                {
                  label: "Dashboard",
                  icon: LayoutDashboard,
                  active: true,
                },
                {
                  label: "Assessments",
                  icon: ClipboardList,
                  active: false,
                },
                {
                  label: "Invoices",
                  icon: FileText,
                  active: false,
                },
                {
                  label: "Payments",
                  icon: Wallet,
                  active: false,
                },
                {
                  label: "Receipts",
                  icon: Receipt,
                  active: false,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className={`flex min-w-0 items-center gap-1 rounded-md px-1 py-1.5 ${
                      item.active
                        ? "bg-white/10 text-[#E8C468]"
                        : "text-white/35"
                    }`}
                  >
                    <Icon className="h-2.5 w-2.5 shrink-0" />

                    <span className="truncate text-[5px]">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* =================================================
              MAIN CONTENT
          ================================================= */}

          <div className="min-w-0 overflow-hidden bg-[#F7F5EE] p-[4%]">
            {/* HEADER */}

            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="truncate text-[5px] uppercase tracking-wider text-black/30 sm:text-[6px]">
                  Citizen Portal
                </p>

                <h3 className="truncate text-[10px] font-bold text-[#0F1B2E] sm:text-sm">
                  My Revenue Dashboard
                </h3>
              </div>

              <div className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white sm:h-6 sm:w-6">
                <Bell className="h-2.5 w-2.5 text-black/45 sm:h-3 sm:w-3" />
              </div>
            </div>

            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <div className="mt-[4%] grid grid-cols-3 gap-[2%]">
              <div className="min-w-0 rounded-lg bg-white p-[4%] sm:rounded-xl">
                <p className="truncate text-[5px] text-black/30 sm:text-[6px]">
                  Outstanding
                </p>

                <p className="mt-1 truncate font-mono text-[9px] font-bold sm:text-sm">
                  Br 4,250
                </p>
              </div>

              <div className="min-w-0 rounded-lg bg-white p-[4%] sm:rounded-xl">
                <p className="truncate text-[5px] text-black/30 sm:text-[6px]">
                  Assessments
                </p>

                <p className="mt-1 font-mono text-[9px] font-bold sm:text-sm">
                  03
                </p>
              </div>

              <div className="min-w-0 rounded-lg bg-white p-[4%] sm:rounded-xl">
                <p className="truncate text-[5px] text-black/30 sm:text-[6px]">
                  Receipts
                </p>

                <p className="mt-1 font-mono text-[9px] font-bold sm:text-sm">
                  08
                </p>
              </div>
            </div>

            {/* =================================================
                INVOICE
            ================================================= */}

            <div className="mt-[3%] rounded-lg bg-white p-[4%] sm:rounded-xl">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[5px] text-black/30 sm:text-[6px]">
                    Latest invoice
                  </p>

                  <p className="mt-1 truncate text-[7px] font-bold sm:text-[8px]">
                    Land Revenue
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-[#C89116]/10 px-1.5 py-0.5 text-[4.5px] font-semibold text-[#8A6410] sm:px-2 sm:py-1 sm:text-[5.5px]">
                  Approved
                </span>
              </div>

              <div className="mt-[4%] flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[5px] text-black/35 sm:text-[7px]">
                    INV-2026-004829
                  </p>

                  <p className="mt-1 truncate font-mono text-[10px] font-bold sm:text-base">
                    Br 4,250.00
                  </p>
                </div>

                <button
                  type="button"
                  className="shrink-0 rounded-md bg-[#0F1B2E] px-2 py-1 text-[5px] font-semibold text-white sm:rounded-lg sm:px-3 sm:py-2 sm:text-[6px]"
                >
                  Pay now
                </button>
              </div>
            </div>

            {/* =================================================
                RECENT ACTIVITY
            ================================================= */}

            <div className="mt-[3%]">
              <p className="text-[5px] font-bold text-black/40 sm:text-[6px]">
                Recent activity
              </p>

              <div className="mt-1 space-y-1">
                {[
                  "Assessment approved",
                  "Invoice generated",
                  "Receipt available",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 sm:rounded-lg sm:py-1.5"
                  >
                    <CheckCircle2 className="h-2 w-2 shrink-0 text-[#1F5C43] sm:h-2.5 sm:w-2.5" />

                    <span className="truncate text-[5px] text-black/45 sm:text-[6px]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LABEL */}

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[8px] font-semibold text-black/45">
        <LayoutDashboard className="h-3 w-3" />
        Citizen web portal
      </div>
    </div>
  );
}

/* =========================================================
   CITIZEN MOBILE APP FRAME
========================================================= */

function TaxpayerMobileAppFrame() {
  return (
    <div className="relative mx-auto w-[165px] sm:w-[180px] lg:w-[190px]">
      {/* PHONE */}

      <div className="relative rounded-[2rem] border-[5px] border-[#202A39] bg-[#111827] p-1.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)]">
        {/* NOTCH */}

        <div className="absolute left-1/2 top-0 z-20 h-4 w-16 -translate-x-1/2 rounded-b-2xl bg-[#202A39]" />

        {/* SCREEN */}

        <div className="overflow-hidden rounded-[1.45rem] bg-[#F6F4EC]">
          {/* APP HEADER */}

          <div className="bg-[#0F1B2E] px-3.5 pb-3.5 pt-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[6px] uppercase tracking-[0.15em] text-white/40">
                  Adama Revenue
                </p>

                <p className="mt-0.5 text-[10px] font-bold">
                  Taxpayer App
                </p>
              </div>

              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                <Bell className="h-3 w-3" />
              </div>
            </div>

            <div className="mt-3">
              <p className="text-[6px] text-white/40">
                Welcome back
              </p>

              <p className="mt-0.5 text-[11px] font-semibold">
                Your revenue account
              </p>
            </div>
          </div>

          {/* APP CONTENT */}

          <div className="space-y-2 p-2.5">
            {/* TAXPAYER CARD */}

            <div className="rounded-xl bg-white p-2.5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0F1B2E]/5">
                  <UserRound className="h-3 w-3 text-[#0F1B2E]" />
                </div>

                <div>
                  <p className="text-[6px] text-black/35">
                    Taxpayer
                  </p>

                  <p className="text-[8px] font-bold">
                    Registered taxpayer
                  </p>
                </div>

                <CheckCircle2 className="ml-auto h-3 w-3 text-[#1F5C43]" />
              </div>
            </div>

            {/* AMOUNT CARD */}

            <div className="rounded-xl bg-[#0F1B2E] p-2.5 text-white">
              <div className="flex items-center justify-between">
                <p className="text-[6px] text-white/40">
                  Amount due
                </p>

                <Wallet className="h-3 w-3 text-[#E8C468]" />
              </div>

              <p className="mt-1 font-mono text-base font-bold">
                Br 4,250
              </p>

              <p className="mt-1 text-[6px] text-white/35">
                Approved invoice
              </p>
            </div>

            {/* SERVICES */}

            <div className="grid grid-cols-3 gap-1.5">
              {[
                {
                  label: "Assessments",
                  icon: ClipboardList,
                },
                {
                  label: "Invoices",
                  icon: FileText,
                },
                {
                  label: "Receipts",
                  icon: Receipt,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-lg bg-white p-1.5 text-center shadow-sm"
                  >
                    <Icon className="mx-auto h-3 w-3 text-[#0F1B2E]" />

                    <p className="mt-1 text-[6px] font-semibold text-black/55">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* PAY BUTTON */}

            <button
              type="button"
              className="w-full rounded-xl bg-[#E8C468] py-2 text-[7px] font-bold text-[#0F1B2E]"
            >
              Pay invoice
            </button>

            {/* RECEIPT */}

            <div className="rounded-xl border border-[#1F5C43]/10 bg-[#1F5C43]/5 p-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-[#1F5C43]" />

                <p className="text-[6.5px] font-semibold text-[#1F5C43]">
                  Payment confirmed
                </p>
              </div>

              <p className="mt-1 text-[6px] text-black/40">
                Digital receipt available
              </p>
            </div>
          </div>

          {/* APP NAVIGATION */}

          <div className="border-t border-black/5 bg-white px-2.5 py-1.5">
            <div className="grid grid-cols-4 text-center">
              {[
                {
                  label: "Home",
                  icon: LayoutDashboard,
                },
                {
                  label: "Invoices",
                  icon: FileText,
                },
                {
                  label: "Payments",
                  icon: Wallet,
                },
                {
                  label: "Profile",
                  icon: UserRound,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label}>
                    <Icon className="mx-auto h-2.5 w-2.5 text-[#0F1B2E]" />

                    <p className="mt-0.5 text-[5px] text-black/35">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* LABEL */}

      <div className="mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[7px] font-semibold text-black/50 shadow-sm">
        <Smartphone className="h-2.5 w-2.5" />
        Taxpayer mobile app
      </div>
    </div>
  );
}

/* =========================================================
   CITIZEN HERO VISUAL
========================================================= */

function CitizenHeroVisual() {
  return (
    <div
      className="
        relative
        min-h-[390px]
        w-full
        overflow-hidden
        rounded-[1.4rem]
        bg-[#0F1B2E]
        p-4
        sm:min-h-[420px]
        sm:p-6
        lg:min-h-[450px]
      "
    >
      {/* BACKGROUND DECORATION */}

      <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#E8C468]/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-white/5 blur-3xl" />

      {/* =================================================
          LABEL
      ================================================= */}

      <div className="relative z-30 flex items-center justify-between">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#E8C468]">
            Citizen access
          </p>

          <h2 className="mt-1 font-serif text-lg font-semibold text-white">
            Your taxpayer account
          </h2>
        </div>

        <div className="rounded-full bg-white/10 px-2.5 py-1 text-[7px] font-semibold text-white/55">
          Mobile + Web
        </div>
      </div>

      {/* =================================================
          DESKTOP PORTAL
          
          Controlled width + controlled aspect ratio.
          It will NOT stretch with the hero column.
      ================================================= */}

      <div
        className="
          relative
          z-10
          mt-5
          hidden
          sm:block
          sm:ml-0
          lg:ml-2
        "
      >
        <CitizenPortalDesktopFrame />
      </div>

      {/* =================================================
          MOBILE APP

          Desktop:
            overlays the portal.

          Mobile:
            becomes the primary visual.
      ================================================= */}

      <div
        className="
          relative
          z-20
          mt-6
          flex
          justify-center
          sm:absolute
          sm:bottom-3
          sm:right-4
          sm:mt-0
          lg:right-5
        "
      >
        <TaxpayerMobileAppFrame />
      </div>

      {/* =================================================
          MOBILE DESCRIPTION
      ================================================= */}

      <div className="relative z-10 mt-5 max-w-[250px] sm:hidden">
        <p className="text-[9px] leading-4 text-white/45">
          Use the taxpayer mobile app to view your
          registered taxpayer information, assessments,
          invoices, payments, and digital receipts.
        </p>
      </div>

      {/* =================================================
          DESKTOP DESCRIPTION
      ================================================= */}

      <div className="relative z-10 mt-3 hidden max-w-[300px] sm:block">
        <p className="text-[9px] leading-4 text-white/40">
          Access the same taxpayer account from the
          Citizen Portal on desktop or from the Taxpayer
          mobile app.
        </p>
      </div>
    </div>
  );
}





/* =========================================================
   MAIN PAGE
========================================================= */

export default function LandingPage() {
  const [portal, setPortal] = useState<Portal>("citizen");
  const [activeStep, setActiveStep] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [receiptQuery, setReceiptQuery] = useState("");
  const [verified, setVerified] = useState(false);

  const isCitizen = portal === "citizen";

  const flow = isCitizen ? CITIZEN_FLOW : OFFICE_FLOW;

  const services = isCitizen
    ? CITIZEN_SERVICES
    : OFFICE_SERVICES;

  const loginUrl = isCitizen
    ? "/citizen/auth/login"
    : "/office/auth/login";

  /*
   * Citizens are registered by the Revenue Office.
   * Therefore there is NO citizen self-registration URL.
   */
  const registerUrl = "/office/taxpayers/register";

  /*
   * Replace this with your actual app-store / APK page.
   *
   * Example:
   * /downloads/taxpayer-app
   *
   * or:
   * https://play.google.com/store/apps/details?id=...
   */
  const taxpayerAppUrl = "/downloads/taxpayer-app";

  /* =======================================================
     AUTO FLOW ANIMATION
  ======================================================= */

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveStep((current) => {
        const next = current + 1;

        return next >= flow.length ? 0 : next;
      });
    }, 2800);

    return () => window.clearInterval(timer);
  }, [flow.length]);

  /* =======================================================
     RESET FLOW WHEN PORTAL CHANGES
  ======================================================= */

  useEffect(() => {
    setActiveStep(0);
    setMenuOpen(false);
    setVerified(false);
    setReceiptQuery("");
  }, [portal]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#EFEBDE] text-[#1B1B16]">
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        @keyframes flowPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }

          50% {
            transform: scale(1.04);
            opacity: 0.9;
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .flow-pulse {
          animation: flowPulse 2s ease-in-out infinite;
        }

        .fade-up {
          animation: fadeUp 0.4s ease both;
        }

        @media (prefers-reduced-motion: reduce) {
          .flow-pulse,
          .fade-up {
            animation: none !important;
          }
        }
      `}</style>

      {/* =====================================================
          TOP NOTICE
      ===================================================== */}

      <div className="flex min-h-8 items-center justify-center gap-2 bg-[#0F1B2E] px-4 py-2 text-center text-[11px] text-[#E8C468]">
        <MessageSquareWarning className="h-3.5 w-3.5" />

        <span>
          Adama municipal revenue portal

          <a
            href="/feedback"
            className="ml-1 font-semibold underline underline-offset-2"
          >
            Send feedback
          </a>
        </span>
      </div>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#EFEBDE]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a
            href="/"
            className="flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F1B2E] text-[#E8C468]">
              <Stamp className="h-4 w-4" />
            </span>

            <span className="font-serif text-base font-bold">
              Adama Revenue
            </span>
          </a>

          {/* DESKTOP NAV */}

          <div className="hidden items-center gap-6 text-xs font-semibold md:flex">
            <a
              href="#workflow"
              className="transition hover:text-[#C89116]"
            >
              How it works
            </a>

            <a
              href="#services"
              className="transition hover:text-[#C89116]"
            >
              Services
            </a>

            <a
              href="#payments"
              className="transition hover:text-[#C89116]"
            >
              Payments
            </a>

            <a
              href="#security"
              className="transition hover:text-[#C89116]"
            >
              Security
            </a>
          </div>

          {/* DESKTOP ACTIONS */}

          <div className="hidden items-center gap-2 md:flex">
            <PortalToggle
              portal={portal}
              setPortal={setPortal}
            />

            <a
              href={loginUrl}
              className="rounded-xl bg-[#0F1B2E] px-4 py-2.5 text-xs font-semibold text-white transition hover:-translate-y-0.5"
            >
              Sign in
            </a>
          </div>

          {/* MOBILE MENU BUTTON */}

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="rounded-lg p-2 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </nav>

        {/* MOBILE MENU */}

        {menuOpen && (
          <div className="border-t border-black/5 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <PortalToggle
                portal={portal}
                setPortal={setPortal}
              />

              <a href="#workflow">How it works</a>
              <a href="#services">Services</a>
              <a href="#payments">Payments</a>
              <a href="#security">Security</a>

              <a
                href={loginUrl}
                className="rounded-xl bg-[#0F1B2E] px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Sign in
              </a>

              {isCitizen && (
                <a
                  href={taxpayerAppUrl}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#0F1B2E]/10 bg-white px-4 py-3 text-sm font-semibold"
                >
                  <Download className="h-4 w-4" />
                  Download taxpayer app
                </a>
              )}

              {isCitizen && (
                <div className="rounded-xl border border-black/10 bg-white px-4 py-3 text-center text-xs text-black/50">
                  Registration is handled by the
                  municipal revenue office.
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-[#E8C468]/10 blur-3xl" />

        <div className="pointer-events-none absolute -left-32 top-40 h-72 w-72 rounded-full bg-[#0F1B2E]/5 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">

            {/* =================================================
                HERO LEFT
            ================================================= */}

            <div key={portal} className="fade-up">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-black/55">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1F5C43]" />

                {isCitizen
                  ? "Citizen / Taxpayer Portal"
                  : "Revenue Office Portal"}
              </div>

              <h1 className="max-w-xl font-serif text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[4rem]">
                {isCitizen ? (
                  <>
                    Your municipal revenue,
                    <span className="text-[#8A6410]">
                      {" "}
                      made simple.
                    </span>
                  </>
                ) : (
                  <>
                    Municipal revenue,
                    <span className="text-[#8A6410]">
                      {" "}
                      managed properly.
                    </span>
                  </>
                )}
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-6 text-black/60 sm:text-[15px]">
                {isCitizen
                  ? "As a taxpayer, access the taxpayer record registered for you by the municipal revenue office. View assessments and invoices, pay approved amounts, and receive digital receipts from the mobile app or citizen web portal."
                  : "Register taxpayers, manage assessments, approvals, invoices, payments, reconciliation, and audit activity through one connected municipal revenue system."}
              </p>

              <div className="mt-7 flex flex-wrap gap-2.5">
                <a
                  href={loginUrl}
                  className="group inline-flex items-center gap-2 rounded-xl bg-[#0F1B2E] px-5 py-3 text-xs font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5"
                >
                  {isCitizen
                    ? "Open citizen portal"
                    : "Open office portal"}

                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </a>

                {isCitizen && (
                  <a
                    href={taxpayerAppUrl}
                    className="group inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-5 py-3 text-xs font-semibold transition hover:bg-white"
                  >
                    <Download className="h-3.5 w-3.5" />

                    Download taxpayer app

                    <ArrowUpRight className="h-3 w-3 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                )}

                {!isCitizen && (
                  <a
                    href="#workflow"
                    className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/60 px-5 py-3 text-xs font-semibold transition hover:bg-white"
                  >
                    See how it works
                  </a>
                )}
              </div>

              {isCitizen && (
                <div className="mt-3 text-[9px] text-black/35">
                  Mobile app and web portal use the same taxpayer account.
                </div>
              )}

              {/* PORTAL-SPECIFIC TRUST ITEMS */}

              <div className="mt-6 flex flex-wrap gap-4 text-[10px] font-medium text-black/45">
                {isCitizen ? (
                  <>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#1F5C43]" />
                      Secure access
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Receipt className="h-3.5 w-3.5 text-[#1F5C43]" />
                      Digital receipts
                    </span>

                    <span className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-[#1F5C43]" />
                      Online payment
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#1F5C43]" />
                      Controlled workflow
                    </span>

                    <span className="flex items-center gap-1.5">
                      <ClipboardCheck className="h-3.5 w-3.5 text-[#1F5C43]" />
                      Approval controls
                    </span>

                    <span className="flex items-center gap-1.5">
                      <BarChart3 className="h-3.5 w-3.5 text-[#1F5C43]" />
                      Revenue monitoring
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* =================================================
                HERO RIGHT
            ================================================= */}

            {isCitizen ? (
              <CitizenHeroVisual />
            ) : (
              <div className="rounded-[1.75rem] border border-black/5 bg-white/70 p-3 shadow-[0_25px_70px_-35px_rgba(15,27,46,0.5)]">
                <div className="rounded-[1.4rem] bg-[#0F1B2E] p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/35">
                        Office workflow
                      </p>

                      <h2 className="mt-1 font-serif text-lg font-semibold text-white">
                        Revenue management journey
                      </h2>
                    </div>

                    <Landmark className="h-5 w-5 text-[#E8C468]" />
                  </div>

                  <div className="mt-5 space-y-1.5">
                    {flow.map((step, index) => {
                      const Icon = step.icon;
                      const active = index === activeStep;

                      return (
                        <button
                          key={step.number}
                          type="button"
                          onClick={() => setActiveStep(index)}
                          className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all duration-300 ${
                            active
                              ? "bg-white text-[#0F1B2E] shadow-md"
                              : "text-white/55 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              active
                                ? "bg-[#E8C468] text-[#0F1B2E] flow-pulse"
                                : "bg-white/10"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold">
                                {step.title}
                              </span>

                              <span className="font-mono text-[9px] opacity-30">
                                {step.number}
                              </span>
                            </div>

                            {active && (
                              <p className="fade-up mt-0.5 text-[10px] text-black/45">
                                {step.description}
                              </p>
                            )}
                          </div>

                          <ChevronRight
                            className={`h-3.5 w-3.5 ${
                              active
                                ? "opacity-100"
                                : "opacity-20"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#E8C468]" />

                    <span className="text-[10px] text-white/55">
                      Current stage:
                    </span>

                    <span className="text-[10px] font-semibold text-white">
                      {flow[activeStep].title}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          WORKFLOW
      ===================================================== */}

      <section
        id="workflow"
        className="border-y border-black/5 bg-white/50 px-4 py-12 sm:px-6 lg:py-16"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-xl text-center">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#C89116]">
              {isCitizen
                ? "Your journey"
                : "Revenue workflow"}
            </span>

            <h2 className="mt-2 font-serif text-3xl font-bold">
              {isCitizen
                ? "From registration to receipt."
                : "From registration to audit."}
            </h2>

            <p className="mt-3 text-xs leading-6 text-black/50">
              {isCitizen
                ? "Your taxpayer record is registered by the revenue office, then your revenue activity progresses from assessment to payment and receipt."
                : "Every revenue activity follows a controlled, traceable workflow from taxpayer registration through reconciliation and audit."}
            </p>
          </div>

          <div
            className={`mt-9 grid gap-2 ${
              flow.length === 6
                ? "lg:grid-cols-6"
                : "lg:grid-cols-7"
            } sm:grid-cols-2`}
          >
            {flow.map((step, index) => {
              const Icon = step.icon;
              const active = activeStep === index;

              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className="group relative text-center"
                >
                  <div
                    className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                      active
                        ? "bg-[#0F1B2E] text-[#E8C468] shadow-lg"
                        : "bg-[#0F1B2E]/5 text-[#0F1B2E] group-hover:bg-[#0F1B2E]/10"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <p className="mt-2 font-mono text-[9px] text-[#C89116]">
                    {step.number}
                  </p>

                  <p className="mt-0.5 text-[11px] font-bold">
                    {step.title}
                  </p>

                  {index < flow.length - 1 && (
                    <ArrowRight className="absolute -right-2 top-5 hidden h-3.5 w-3.5 text-black/20 lg:block" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-black/5 bg-white p-5 text-center shadow-sm">
            <p className="text-xs font-semibold">
              {flow[activeStep].title}
            </p>

            <p className="mt-1.5 text-xs leading-5 text-black/50">
              {flow[activeStep].description}
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          PORTAL ACCESS
      ===================================================== */}

      <section className="px-4 py-14 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#C89116]">
              Access
            </span>

            <h2 className="mt-2 font-serif text-3xl font-bold">
              Choose your side of the system.
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-black/50">
              Citizens and revenue officers use different
              interfaces while working with the same
              municipal revenue infrastructure.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            {/* CITIZEN */}

            <div
              className={`rounded-[1.5rem] border p-6 transition ${
                portal === "citizen"
                  ? "border-[#0F1B2E]/15 bg-white shadow-xl"
                  : "border-black/5 bg-white/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F1B2E]/5">
                  <Users2 className="h-5 w-5" />
                </div>

                <span className="font-mono text-[9px] text-[#C89116]">
                  CITIZEN / TAXPAYER
                </span>
              </div>

              <h3 className="mt-5 font-serif text-xl font-bold">
                Citizen portal
              </h3>

              <p className="mt-2 text-xs leading-6 text-black/50">
                Access the taxpayer record registered for
                you by the municipal revenue office, view
                assessments and invoices, make payments,
                and access digital receipts.
              </p>

              <div className="mt-5 space-y-2">
                {[
                  "View registered taxpayer information",
                  "View assessments",
                  "View invoices",
                  "Pay approved invoices",
                  "Access digital receipts",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-[10px] text-black/55"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#1F5C43]" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <a
                  href="/citizen/auth/login"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F1B2E] px-4 py-2.5 text-xs font-semibold text-white"
                >
                  Sign in
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>

                <a
                  href={taxpayerAppUrl}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download app
                </a>
              </div>

              <div className="mt-4 rounded-xl border border-[#C89116]/20 bg-[#C89116]/5 px-3 py-2.5">
                <p className="text-[10px] leading-5 text-black/50">
                  <span className="font-semibold text-[#8A6410]">
                    Registration:
                  </span>{" "}
                  Citizen and taxpayer records are
                  registered by authorized municipal
                  revenue officers.
                </p>
              </div>
            </div>

            {/* OFFICE */}

            <div
              className={`rounded-[1.5rem] border p-6 transition ${
                portal === "office"
                  ? "border-[#0F1B2E]/15 bg-white shadow-xl"
                  : "border-black/5 bg-white/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F1B2E]/5">
                  <ClipboardList className="h-5 w-5" />
                </div>

                <span className="font-mono text-[9px] text-[#C89116]">
                  OFFICE
                </span>
              </div>

              <h3 className="mt-5 font-serif text-xl font-bold">
                Revenue office
              </h3>

              <p className="mt-2 text-xs leading-6 text-black/50">
                Register and manage taxpayers, create
                assessments, approve transactions, generate
                invoices, monitor payments, and maintain
                the revenue audit trail.
              </p>

              <div className="mt-5 space-y-2">
                {[
                  "Register citizen and taxpayer records",
                  "Create assessments",
                  "Approve or reject assessments",
                  "Generate invoices",
                  "Monitor and reconcile payments",
                  "Audit revenue activity",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-[10px] text-black/55"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#1F5C43]" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <a
                  href="/office/auth/login"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F1B2E] px-4 py-2.5 text-xs font-semibold text-white"
                >
                  Office sign in
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SERVICES
      ===================================================== */}

      <section
        id="services"
        className="bg-white/50 px-4 py-14 sm:px-6 lg:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#C89116]">
              {isCitizen
                ? "Citizen / taxpayer services"
                : "Office services"}
            </span>

            <h2 className="mt-2 font-serif text-3xl font-bold">
              {isCitizen
                ? "What you can do."
                : "What your revenue team can manage."}
            </h2>

            <p className="mt-3 text-xs leading-6 text-black/50">
              {isCitizen
                ? "Access the municipal revenue services associated with your registered taxpayer record."
                : "The operational capabilities available to authorized municipal revenue officers."}
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <div
                  key={service.title}
                  className="group rounded-2xl border border-black/5 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F1B2E]/5 transition group-hover:bg-[#0F1B2E] group-hover:text-white">
                    <Icon className="h-4 w-4" />
                  </div>

                  <h3 className="mt-4 text-xs font-bold">
                    {service.title}
                  </h3>

                  <p className="mt-1.5 text-[11px] leading-5 text-black/45">
                    {service.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          CITIZEN PAYMENT SECTION
      ===================================================== */}

      {isCitizen && (
        <section
          id="payments"
          className="px-4 py-14 sm:px-6 lg:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#C89116]">
                  Payment
                </span>

                <h2 className="mt-2 max-w-md font-serif text-3xl font-bold">
                  Pay your approved invoice.
                </h2>

                <p className="mt-3 max-w-md text-xs leading-6 text-black/50">
                  Once your assessment is approved,
                  your invoice becomes payable through
                  supported digital payment channels.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  {PAYMENTS.map((payment) => {
                    const Icon = payment.icon;

                    return (
                      <div
                        key={payment.title}
                        className="rounded-xl border border-black/5 bg-white p-3 text-center"
                      >
                        <Icon className="mx-auto h-4 w-4" />

                        <p className="mt-2 text-[10px] font-bold">
                          {payment.title}
                        </p>

                        <p className="mt-0.5 text-[9px] text-black/40">
                          {payment.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* INVOICE CARD */}

              <div className="mx-auto w-full max-w-sm rounded-[1.5rem] bg-[#0F1B2E] p-5 text-white shadow-2xl">
                <div className="flex justify-between">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-white/35">
                      Invoice
                    </p>

                    <p className="mt-1 font-mono text-xs">
                      INV-2026-004829
                    </p>
                  </div>

                  <FileText className="h-5 w-5 text-[#E8C468]" />
                </div>

                <div className="mt-7">
                  <p className="text-[10px] text-white/35">
                    Amount due
                  </p>

                  <p className="mt-1 font-mono text-3xl font-bold">
                    Br 4,250.00
                  </p>
                </div>

                <div className="mt-5 rounded-xl bg-white/5 p-3">
                  <p className="text-[9px] text-white/35">
                    Service
                  </p>

                  <p className="mt-1 text-xs font-semibold">
                    Land Revenue
                  </p>
                </div>

                <button
                  type="button"
                  className="mt-3 w-full rounded-xl bg-[#E8C468] py-3 text-xs font-bold text-[#0F1B2E]"
                >
                  Choose payment method
                </button>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-white/40">
                  <ShieldCheck className="h-3 w-3" />
                  Secure payment confirmation
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          OFFICE PAYMENT / RECONCILIATION
      ===================================================== */}

      {!isCitizen && (
        <section
          id="payments"
          className="px-4 py-14 sm:px-6 lg:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#C89116]">
                  Payment monitoring
                </span>

                <h2 className="mt-2 max-w-md font-serif text-3xl font-bold">
                  Monitor every payment.
                </h2>

                <p className="mt-3 max-w-md text-xs leading-6 text-black/50">
                  Revenue officers can monitor payment
                  transactions received through supported
                  payment providers and reconcile them
                  with internal records.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  {PAYMENTS.map((payment) => {
                    const Icon = payment.icon;

                    return (
                      <div
                        key={payment.title}
                        className="rounded-xl border border-black/5 bg-white p-3 text-center"
                      >
                        <Icon className="mx-auto h-4 w-4" />

                        <p className="mt-2 text-[10px] font-bold">
                          {payment.title}
                        </p>

                        <p className="mt-0.5 text-[9px] text-black/40">
                          {payment.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* OFFICE MONITORING CARD */}

              <div className="rounded-[1.5rem] bg-[#0F1B2E] p-5 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-white/35">
                      Payment monitoring
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      Today's transactions
                    </p>
                  </div>

                  <BarChart3 className="h-5 w-5 text-[#E8C468]" />
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-[9px] text-white/35">
                      Transactions
                    </p>

                    <p className="mt-1 font-mono text-lg font-bold">
                      248
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-[9px] text-white/35">
                      Successful
                    </p>

                    <p className="mt-1 font-mono text-lg font-bold text-[#76D8AC]">
                      236
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-[9px] text-white/35">
                      Pending
                    </p>

                    <p className="mt-1 font-mono text-lg font-bold text-[#E8C468]">
                      12
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-white/35">
                      Reconciliation status
                    </span>

                    <span className="flex items-center gap-1 text-[9px] font-semibold text-[#76D8AC]">
                      <CheckCircle2 className="h-3 w-3" />
                      Operational
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#E8C468]"
                      style={{ width: "94%" }}
                    />
                  </div>

                  <p className="mt-2 text-[9px] text-white/35">
                    94% reconciled
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          SECURITY / AUDIT
      ===================================================== */}

      <section
        id="security"
        className="bg-[#0F1B2E] px-4 py-14 text-white sm:px-6 lg:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#E8C468]">
              {isCitizen
                ? "Trust & security"
                : "Audit & reconciliation"}
            </span>

            <h2 className="mt-2 font-serif text-3xl font-bold">
              {isCitizen
                ? "Your payment becomes a trusted record."
                : "Every transaction remains traceable."}
            </h2>

            <p className="mt-3 text-xs leading-6 text-white/45">
              {isCitizen
                ? "Successful payments produce digital receipts that can be verified later."
                : "Assessment, approval, invoice, payment, and receipt records remain connected for reconciliation and audit."}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">

            {/* RECEIPT */}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Receipt className="h-5 w-5 text-[#E8C468]" />

              <h3 className="mt-4 text-sm font-semibold">
                Digital receipt
              </h3>

              <p className="mt-2 text-[11px] leading-5 text-white/40">
                {isCitizen
                  ? "A verifiable receipt is generated after successful payment."
                  : "Receipts provide evidence that a payment was successfully completed."}
              </p>

              <div className="mt-4 rounded-xl bg-white/5 p-3">
                <div className="flex justify-between text-[9px]">
                  <span className="text-white/30">
                    Receipt
                  </span>

                  <span className="font-mono">
                    ADR-2026-081934
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-[9px] text-[#76D8AC]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Payment confirmed
                </div>
              </div>
            </div>

            {/* AUDIT */}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <ShieldCheck className="h-5 w-5 text-[#E8C468]" />

              <h3 className="mt-4 text-sm font-semibold">
                {isCitizen
                  ? "Transaction history"
                  : "Audit trail"}
              </h3>

              <p className="mt-2 text-[11px] leading-5 text-white/40">
                {isCitizen
                  ? "Your revenue transactions remain connected across assessments, invoices, payments, and receipts."
                  : "Assessment, invoice, payment, and receipt events remain connected for auditing."}
              </p>

              <div className="mt-4 space-y-1.5">
                {(isCitizen
                  ? [
                      "Taxpayer record registered",
                      "Assessment available",
                      "Invoice generated",
                      "Payment confirmed",
                      "Receipt generated",
                    ]
                  : [
                      "Taxpayer registered",
                      "Assessment approved",
                      "Invoice generated",
                      "Payment confirmed",
                      "Receipt generated",
                    ]
                ).map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-2"
                  >
                    <Check className="h-3 w-3 text-[#E8C468]" />

                    <span className="text-[9px] text-white/55">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* REPORTING */}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <BarChart3 className="h-5 w-5 text-[#E8C468]" />

              <h3 className="mt-4 text-sm font-semibold">
                {isCitizen
                  ? "Payment transparency"
                  : "Revenue reconciliation"}
              </h3>

              <p className="mt-2 text-[11px] leading-5 text-white/40">
                {isCitizen
                  ? "Payment status and receipts give you clear confirmation of your municipal payment."
                  : "Revenue officers can compare gateway transactions against internal records."}
              </p>

              <div className="mt-5 flex h-20 items-end gap-1.5">
                {[30, 45, 35, 58, 50, 72, 64, 82].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t bg-white/20"
                      style={{
                        height: `${height}%`,
                      }}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          RECEIPT VERIFICATION
          CITIZEN ONLY
      ===================================================== */}

      {isCitizen && (
        <section className="bg-[#C89116]/5 px-4 py-12 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#8A6410]">
                <Search className="h-4 w-4" />

                <span className="font-mono text-[9px] font-bold uppercase tracking-widest">
                  Receipt verification
                </span>
              </div>

              <h2 className="mt-2 font-serif text-2xl font-bold">
                Verify a receipt.
              </h2>

              <p className="mt-1 text-xs text-black/45">
                Check whether a municipal receipt exists
                in the system.
              </p>
            </div>

            <div className="w-full max-w-md">
              <div className="flex rounded-xl border border-black/10 bg-white p-1">
                <input
                  value={receiptQuery}
                  onChange={(event) => {
                    setReceiptQuery(event.target.value);
                    setVerified(false);
                  }}
                  placeholder="ADR-2026-081934"
                  className="min-w-0 flex-1 bg-transparent px-3 text-xs outline-none"
                />

                <button
                  type="button"
                  onClick={() => {
                    if (receiptQuery.trim()) {
                      setVerified(true);
                    }
                  }}
                  className="rounded-lg bg-[#0F1B2E] px-4 py-2.5 text-xs font-semibold text-white"
                >
                  Verify
                </button>
              </div>

              {verified && (
                <div className="fade-up mt-2 flex items-center gap-2 text-[10px] font-semibold text-[#1F5C43]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Receipt submitted for verification.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          CITIZEN APP CTA
      ===================================================== */}

      {isCitizen && (
        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[1.5rem] bg-[#C89116]/10 p-6 sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#8A6410]">
                  Taxpayer mobile app
                </span>

                <h2 className="mt-2 font-serif text-2xl font-bold">
                  Take your municipal revenue account with you.
                </h2>

                <p className="mt-2 max-w-xl text-xs leading-5 text-black/50">
                  Use the taxpayer mobile app to access your
                  registered taxpayer information, assessments,
                  invoices, payments, and digital receipts from
                  your phone.
                </p>
              </div>

              <a
                href={taxpayerAppUrl}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0F1B2E] px-5 py-3 text-xs font-semibold text-white"
              >
                <Download className="h-3.5 w-3.5" />
                Download taxpayer app
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          OFFICE CTA
      ===================================================== */}

      {!isCitizen && (
        <section className="px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-6xl rounded-[1.5rem] bg-[#C89116]/10 p-6 sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#8A6410]">
                  Revenue administration
                </span>

                <h2 className="mt-2 font-serif text-2xl font-bold">
                  Manage municipal revenue from one system.
                </h2>

                <p className="mt-2 max-w-xl text-xs leading-5 text-black/50">
                  Authorized revenue officers can register
                  citizens and taxpayers and manage the
                  complete revenue lifecycle through
                  reconciliation and audit.
                </p>
              </div>

              <a
                href="/office/auth/login"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0F1B2E] px-5 py-3 text-xs font-semibold text-white"
              >
                Open office portal
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-black/5 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F1B2E] text-[#E8C468]">
              <Stamp className="h-4 w-4" />
            </span>

            <div>
              <p className="text-xs font-bold">
                Adama City Revenue
              </p>

              <p className="text-[9px] text-black/35">
                Municipal revenue management platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/feedback"
              className="text-[9px] text-black/35 transition hover:text-black"
            >
              Feedback
            </a>

            <p className="text-[9px] text-black/35">
              © {new Date().getFullYear()} Adama City
              Administration
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}