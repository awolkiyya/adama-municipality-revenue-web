"use client";

import { useEffect, useRef } from "react";

type DotWaveVariant = "wave" | "drift" | "ripple";

interface DotWaveProps {
  /** "wave" = rolling sine motion, "drift" = slow orbital wander,
   *  "ripple" = mostly still, only reacts where the pointer is */
  variant?: DotWaveVariant;
  color?: string;
  /** px between dots — lower = denser field */
  spacing?: number;
  dotRadius?: number;
  /** animation speed multiplier */
  speed?: number;
  /** dots brighten/enlarge near the pointer when true */
  interactive?: boolean;
  className?: string;
}

/**
 * Drop this inside any `position: relative` container as an absolutely
 * positioned background layer, then stack real content on top with a
 * higher z-index. Sizes itself to its parent via ResizeObserver, so the
 * same component works full-bleed in a hero or boxed inside a card.
 *
 * <div className="relative overflow-hidden rounded-xl">
 *   <DotWave variant="wave" color="#6366F1" className="absolute inset-0" />
 *   <div className="relative z-10 p-8">...content...</div>
 * </div>
 */
export function DotWave({
  variant = "wave",
  color = "#6366F1",
  spacing = 26,
  dotRadius = 1.6,
  speed = 1,
  interactive = true,
  className = "",
}: DotWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !container || !ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let raf = 0;
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const handleMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleLeave = () => {
      mouse.current = { x: -9999, y: -9999 };
    };
    if (interactive) {
      container.addEventListener("pointermove", handleMove);
      container.addEventListener("pointerleave", handleLeave);
    }

    const draw = (elapsed: number) => {
      ctx.clearRect(0, 0, width, height);
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      const t = (elapsed / 1000) * speed;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const baseX = i * spacing;
          const baseY = j * spacing;
          let x = baseX;
          let y = baseY;
          let opacity = 0.18;
          let radius = dotRadius;

          if (variant === "wave") {
            const wave =
              Math.sin(baseX * 0.02 + t * 1.4) *
              Math.cos(baseY * 0.03 + t * 0.8);
            y = baseY + wave * 8;
            opacity = 0.14 + Math.abs(wave) * 0.32;
          } else if (variant === "drift") {
            const angle =
              Math.sin(baseX * 0.01 + baseY * 0.01 + t * 0.5) * Math.PI;
            x = baseX + Math.cos(angle) * 4;
            y = baseY + Math.sin(angle) * 4;
            opacity = 0.16 + 0.14 * Math.sin(t + i * 0.3 + j * 0.3);
          } else {
            opacity = 0.14 + 0.06 * Math.sin(t * 1.2 + (i + j) * 0.4);
          }

          if (interactive && !reduceMotion) {
            const dist = Math.hypot(x - mouse.current.x, y - mouse.current.y);
            const reach = 120;
            if (dist < reach) {
              const proximity = 1 - dist / reach;
              opacity = Math.min(1, opacity + proximity * 0.7);
              radius = dotRadius + proximity * 2.2;
            }
          }

          ctx.beginPath();
          ctx.globalAlpha = reduceMotion ? 0.2 : opacity;
          ctx.fillStyle = color;
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (!reduceMotion) raf = requestAnimationFrame(draw);
    };

    if (reduceMotion) {
      draw(0);
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (interactive) {
        container.removeEventListener("pointermove", handleMove);
        container.removeEventListener("pointerleave", handleLeave);
      }
    };
  }, [variant, color, spacing, dotRadius, speed, interactive]);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-auto relative overflow-hidden ${className}`}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 block"
      />
    </div>
  );
}