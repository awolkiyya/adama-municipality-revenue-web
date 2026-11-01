
"use client";

import Link from "next/link";
import {
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  ArrowRight,
  Banknote,
  IdCard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { StatusBadge } from "../commen/StatusBadge";
import { FloatingChip } from "../commen/FloatingChip";
import { GridLines } from "../design/GridLines";

/* =========================================================
   THEME COLOR
   ========================================================= */

/**
 * Reads a CSS custom property and resolves raw HSL values
 * into a format supported by canvas and SVG components.
 */
function useThemeColor(
  variable: string,
  fallback: string,
): string {
  const getSnapshot = useCallback(() => {
    const raw = getComputedStyle(
      document.documentElement,
    )
      .getPropertyValue(variable)
      .trim();

    if (!raw) {
      return fallback;
    }

    return raw.startsWith("#") ||
      raw.startsWith("rgb") ||
      raw.startsWith("hsl")
      ? raw
      : `hsl(${raw})`;
  }, [variable, fallback]);

  const getServerSnapshot = useCallback(
    () => fallback,
    [fallback],
  );

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const observer = new MutationObserver(() => {
        onStoreChange();
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });

      return () => {
        observer.disconnect();
      };
    },
    [],
  );

  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}

/* =========================================================
   ENTRANCE ANIMATION
   ========================================================= */

/**
 * Detects when the component is mounted in the browser.
 * The server snapshot remains false to prevent hydration
 * mismatches.
 *
 * requestAnimationFrame triggers the client subscription
 * without calling setState inside an effect.
 */
function subscribeToEntrance(
  onStoreChange: () => void,
) {
  const frameId = window.requestAnimationFrame(() => {
    onStoreChange();
  });

  return () => {
    window.cancelAnimationFrame(frameId);
  };
}

function getEntranceSnapshot() {
  return true;
}

function getEntranceServerSnapshot() {
  return false;
}

function useEntrance(): boolean {
  return useSyncExternalStore(
    subscribeToEntrance,
    getEntranceSnapshot,
    getEntranceServerSnapshot,
  );
}

/* =========================================================
   REVEAL
   ========================================================= */

function Reveal({
  show,
  delay = 0,
  className = "",
  children,
}: {
  show: boolean;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        show
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0"
      } ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* =========================================================
   HERO
   ========================================================= */

export function Hero() {
  const primary = useThemeColor(
    "--primary",
    "#2563EB",
  );

  const ready = useEntrance();

  return (
    <section className="relative overflow-hidden px-6 py-16 sm:py-24">
      {/* ===================================================
          BACKGROUND GRID
          =================================================== */}

      <div className="pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_60%_60%_at_20%_20%,black,transparent)]">
        <GridLines
          sweepColor={primary}
          spacing={100}
        />
      </div>

      {/* ===================================================
          HERO CONTENT
          =================================================== */}

      <div className="relative mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        {/* =================================================
            TEXT CONTENT
            ================================================= */}

        <div>
          <Reveal show={ready}>
            <Badge
              variant="secondary"
              className="mb-4 gap-1.5 rounded-full px-3 py-1 text-xs"
            >
              <Sparkles className="h-3 w-3" />

              Now serving Adama citizens online
            </Badge>
          </Reveal>

          <Reveal
            show={ready}
            delay={80}
          >
            <h2 className="text-4xl font-bold leading-tight tracking-tight text-foreground">
              Mosajii Tejajila GMQ
            </h2>
          </Reveal>

          <Reveal
            show={ready}
            delay={160}
          >
            <p className="mt-4 text-lg text-muted-foreground">
              Access public services, manage payments,
              and handle government operations in one
              secure system.
            </p>
          </Reveal>

          <Reveal
            show={ready}
            delay={240}
          >
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="gap-2"
              >
                <Link href="/citizen/auth/login">
                  Citizen Portal

                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="gap-2"
              >
                <Link href="/office/auth/login">
                  Office System

                  <StatusBadge status="beta" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>

        {/* =================================================
            ILLUSTRATION
            ================================================= */}

        <Reveal
          show={ready}
          delay={200}
          className="relative mx-auto aspect-square w-full max-w-sm"
        >
          <Image
            src="/images/svgs/revenue-hub-illustration.svg"
            alt=""
            aria-hidden="true"
            width={500}
            height={500}
            priority
            className="relative mx-auto aspect-square h-auto w-full max-w-sm"
          />

          {/* Citizen ID */}

          <FloatingChip
            icon={<IdCard className="h-4 w-4" />}
            label="Citizen ID"
            className="floating-chip [animation-delay:0s] -left-2 top-8 -rotate-3"
          />

          {/* Payments */}

          <FloatingChip
            icon={<Banknote className="h-4 w-4" />}
            label="Payments"
            className="floating-chip [animation-delay:1.2s] right-8 bottom-4 -rotate-2"
          />

          {/* Security */}

          <FloatingChip
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Secure"
            className="floating-chip [animation-delay:2.4s] -right-2 top-4 rotate-2"
          />
        </Reveal>
      </div>

      {/* ===================================================
          ANIMATIONS
          =================================================== */}

      <style>{`
        @keyframes gentle-float {
          0%, 100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-6px);
          }
        }

        .floating-chip {
          animation: gentle-float 6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .floating-chip {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
