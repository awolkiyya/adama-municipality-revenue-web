'use client'
import { useEffect, useRef } from "react";

interface DotFieldProps {
  /** Color the sweep ring lights dots up as it passes through them */
  sweepColor?: string;
  /** Resting color of ambient, un-swept dots */
  baseColor?: string;
}

/**
 * Full-bleed ambient dot grid. A soft ring sweeps outward from a fixed
 * point on a slow cycle; dots near the ring's edge brighten into
 * `sweepColor` as it passes, then fade back to `baseColor`.
 *
 * Respects prefers-reduced-motion: renders a single static frame instead
 * of animating.
 */
export function DotField({
  sweepColor = "#E8A33D",
  baseColor = "rgba(148, 163, 184, 0.4)",
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const SPACING = 30;
    const DOT_RADIUS = 1.4;
    const SWEEP_PERIOD_MS = 5200;
    const SWEEP_SPEED = 0.42; // px per ms
    const RING_WIDTH = 70;

    let width = 0;
    let height = 0;
    let raf = 0;
    const startTime = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const originX = () => width / 2;
    const originY = () => height * 0.36;

    const drawFrame = (elapsed: number) => {
      ctx.clearRect(0, 0, width, height);

      const sweepRadius = reduceMotion
        ? -1
        : (elapsed % SWEEP_PERIOD_MS) * SWEEP_SPEED;
      const maxRadius = Math.hypot(width, height) * 0.65;

      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;
      const ox = originX();
      const oy = originY();

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * SPACING;
          const y = j * SPACING;

          let opacity = 0.14;
          let color = baseColor;

          if (!reduceMotion) {
            const twinkle =
              0.12 + 0.09 * Math.sin(elapsed / 1800 + (i + j) * 0.6);
            opacity = Math.max(0.05, twinkle);

            const dist = Math.hypot(x - ox, y - oy);
            const ringDist = Math.abs(dist - sweepRadius);
            if (ringDist < RING_WIDTH && sweepRadius < maxRadius) {
              const proximity = 1 - ringDist / RING_WIDTH;
              opacity = Math.min(1, opacity + proximity * 0.85);
              color = sweepColor;
            }
          }

          ctx.beginPath();
          ctx.globalAlpha = opacity;
          ctx.fillStyle = color;
          ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      drawFrame(now - startTime);
      if (!reduceMotion) raf = requestAnimationFrame(loop);
    };

    if (reduceMotion) {
      drawFrame(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [sweepColor, baseColor]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
