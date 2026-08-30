"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Position =
  | "full"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

type FloatingParticlesProps = {
  /** Particle color. Falls back safely if given an unsupported CSS color function. */
  color?: string;
  /** Number of particles. */
  count?: number;
  /** Particle radius range, in px. */
  minRadius?: number;
  maxRadius?: number;
  /** Drift speed. Higher = faster movement. */
  speed?: number;
  /**
   * Max distance (px) at which two particles get a connecting line drawn
   * between them, for a "constellation" look. Set to 0 to disable.
   */
  connectDistance?: number;
  /**
   * Where the effect sits within its container. "full" covers everything
   * (the default). Edges/corners anchor the effect to that region only —
   * useful for a decorative accent rather than a full background.
   */
  position?: Position;
  /**
   * Softly fades the effect toward transparent at the edge facing the
   * container's center, so it blends in instead of looking like a hard
   * rectangle. Has no effect when position="full". Defaults to true.
   */
  fade?: boolean;
};

/**
 * Safely ensures canvas-compatible color.
 * Canvas does NOT support oklch/lab/hsl(var()) formats.
 */
function safeColor(value: string, fallback: string) {
  if (!value || typeof value !== "string") return fallback;

  if (
    value.includes("var(") ||
    value.includes("oklch") ||
    value.includes("lab") ||
    value.includes("color(")
  ) {
    return fallback;
  }

  return value;
}

const POSITION_CLASSES: Record<Position, string> = {
  full: "inset-0",
  top: "inset-x-0 top-0 h-1/2",
  bottom: "inset-x-0 bottom-0 h-1/2",
  left: "inset-y-0 left-0 w-1/2",
  right: "inset-y-0 right-0 w-1/2",
  "top-left": "left-0 top-0 h-2/3 w-2/3",
  "top-right": "right-0 top-0 h-2/3 w-2/3",
  "bottom-left": "bottom-0 left-0 h-2/3 w-2/3",
  "bottom-right": "bottom-0 right-0 h-2/3 w-2/3",
  center: "left-1/2 top-1/2 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2",
};

const FADE_MASKS: Partial<Record<Position, string>> = {
  top: "linear-gradient(to top, transparent, black)",
  bottom: "linear-gradient(to bottom, transparent, black)",
  left: "linear-gradient(to left, transparent, black)",
  right: "linear-gradient(to right, transparent, black)",
  "top-left": "radial-gradient(circle at top left, black, transparent 70%)",
  "top-right": "radial-gradient(circle at top right, black, transparent 70%)",
  "bottom-left":
    "radial-gradient(circle at bottom left, black, transparent 70%)",
  "bottom-right":
    "radial-gradient(circle at bottom right, black, transparent 70%)",
  center: "radial-gradient(circle, black, transparent 70%)",
};

type Particle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
};

export function FloatingParticles({
  color = "#E8A33D",
  count = 40,
  minRadius = 1,
  maxRadius = 2.5,
  speed = 0.3,
  connectDistance = 0,
  position = "full",
  fade = true,
}: FloatingParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const safeC = safeColor(color, "#E8A33D");

    let width = 0;
    let height = 0;
    let raf = 0;
    let particles: Particle[] = [];

    const makeParticles = () => {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: minRadius + Math.random() * (maxRadius - minRadius),
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
      }));
    };

    // Observes the canvas's own box, not the window — so this adapts
    // correctly to whatever region it's given, full-size or a corner slice.
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeParticles();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.globalAlpha = 0.7;
        ctx.fillStyle = safeC;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (connectDistance > 0) {
        ctx.strokeStyle = safeC;
        ctx.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < connectDistance) {
              ctx.globalAlpha = 0.15 * (1 - dist / connectDistance);
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      ctx.globalAlpha = 1;
    };

    const loop = () => {
      drawFrame();
      raf = requestAnimationFrame(loop);
    };

    if (reduceMotion) {
      drawFrame();
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [color, count, minRadius, maxRadius, speed, connectDistance]);

  const maskImage =
    fade && position !== "full" ? FADE_MASKS[position] : undefined;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute h-full w-full",
        POSITION_CLASSES[position]
      )}
      style={
        maskImage
          ? { maskImage, WebkitMaskImage: maskImage }
          : undefined
      }
    />
  );
}