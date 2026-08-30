"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Banknote, IdCard, ShieldCheck, Sparkles } from "lucide-react";
import { StatusBadge } from "../commen/StatusBadge";
import { DotField } from "../design/DotField";
import { FloatingChip } from "../commen/FloatingChip";
import { GridLines } from "../design/GridLines";

/**
 * Resolves a CSS custom property to a color the canvas can actually use.
 * shadcn-style themes store --primary as raw HSL components
 * ("222.2 47.4% 11.2%"), which a canvas fillStyle can't parse directly —
 * this wraps it in hsl(...) when needed, and re-reads whenever the theme
 * changes (e.g. toggling a `dark` class on <html>).
 */
function useThemeColor(variable: string, fallback: string) {
  const [color, setColor] = useState(fallback);

  useEffect(() => {
    const root = document.documentElement;

    const read = () => {
      const raw = getComputedStyle(root).getPropertyValue(variable).trim();
      if (!raw) return;
      const resolved =
        raw.startsWith("#") || raw.startsWith("rgb") || raw.startsWith("hsl")
          ? raw
          : `hsl(${raw})`;
      setColor(resolved);
    };

    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class", "style"] });
    return () => observer.disconnect();
  }, [variable]);

  return color;
}

/** Staggers a fade-up entrance on mount. Resolves instantly (no motion)
 *  under prefers-reduced-motion rather than skipping the reveal oddly. */
function useEntrance() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setReady(true);
      return;
    }
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return ready;
}

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
      className={`transition-all duration-700 ease-out ${
        show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function Hero() {
  const primary = useThemeColor("--primary", "#2563EB");
  const ready = useEntrance();

  return (
    <section className="relative overflow-hidden px-6 py-16 sm:py-24">

<div className="pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_60%_60%_at_20%_20%,black,transparent)]">
  <GridLines sweepColor={primary} spacing={100} />
</div>
      {/* Animated dot field, concentrated toward the text column the same
          way the old static grid was — but alive instead of painted-on.
          DotField itself is untouched; the mask/opacity live on this
          wrapper so the component stays reusable elsewhere unmodified. */}
      {/* <div className="pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_60%_60%_at_20%_20%,black,transparent)]">
        <DotField sweepColor={primary} baseColor="rgba(148, 163, 184, 0.35)" />
      </div> */}

      <div className="relative mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        {/* text */}
        <div>
          <Reveal show={ready}>
            <Badge variant="secondary" className="mb-4 gap-1.5 rounded-full px-3 py-1 text-xs">
              <Sparkles className="h-3 w-3" />
              Now serving Adama citizens online
            </Badge>
          </Reveal>

          <Reveal show={ready} delay={80}>
            <h2 className="text-4xl font-bold leading-tight tracking-tight text-foreground">
              Mosajii Tejajila GMQ
            </h2>
          </Reveal>

          <Reveal show={ready} delay={160}>
            <p className="mt-4 text-lg text-muted-foreground">
              Access public services, manage payments, and handle government
              operations in one secure system.
            </p>
          </Reveal>

          <Reveal show={ready} delay={240}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href="/citizen/auth/login">
                  Citizen Portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link href="/office/auth/login">
                  Office System
                  <StatusBadge status="beta" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>

        {/* illustration */}
        <Reveal
          show={ready}
          delay={200}
          className="relative mx-auto aspect-square w-full max-w-sm"
        >
          {/* <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(var(--primary)_1.5px,transparent_1.5px)] bg-[size:18px_18px] opacity-[0.18] [mask-image:radial-gradient(closest-side,black,transparent)]" /> */}

          {/* <svg viewBox="0 0 200 200" className="relative h-full w-full">
            <g fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round">
              <path d="M58 82 L100 48 L142 82 Z" />
              <rect x="54" y="82" width="92" height="66" rx="2" />
              <line x1="70" y1="88" x2="70" y2="142" />
              <line x1="90" y1="88" x2="90" y2="142" />
              <line x1="110" y1="88" x2="110" y2="142" />
              <line x1="130" y1="88" x2="130" y2="142" />
              <line x1="44" y1="150" x2="156" y2="150" />
              <line x1="38" y1="157" x2="162" y2="157" />
            </g>
            <rect x="54" y="82" width="92" height="66" rx="2" fill="var(--primary)" opacity="0.07" />
          </svg> */}

            <img
            src="/images/svgs/revenue-hub-illustration.svg"
            alt=""
            aria-hidden="true"
            className="relative mx-auto aspect-square w-full max-w-sm"
            />

          <FloatingChip
            icon={<IdCard className="h-4 w-4" />}
            label="Citizen ID"
            className="floating-chip [animation-delay:0s] -left-2 top-8 -rotate-3"
          />
          <FloatingChip
            icon={<Banknote className="h-4 w-4" />}
            label="Payments"
            className="floating-chip [animation-delay:1.2s] right-8 bottom-4 -rotate-2"
          />
          <FloatingChip
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Secure"
            className="floating-chip [animation-delay:2.4s] -right-2 top-4 rotate-2"
          />
        </Reveal>
      </div>

      <style>{`
        @keyframes gentle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .floating-chip {
          animation: gentle-float 6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .floating-chip { animation: none; }
        }
      `}</style>
    </section>
  );
}