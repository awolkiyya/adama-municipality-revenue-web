"use client";

import { useEffect, useRef } from "react";

type GridLinesDirection = "vertical" | "horizontal";

interface GridLinesProps {
  lineColor?: string;
  sweepColor?: string;
  spacing?: number;
  speed?: number;
  direction?: GridLinesDirection;
}

/**
 * Safely ensures canvas-compatible color.
 * Canvas does NOT support oklch/lab/hsl(var()) formats.
 */
function safeColor(value: string, fallback: string) {
  if (!value || typeof value !== "string") return fallback;

  // Reject CSS variables or unsupported modern color functions
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

export function GridLines({
  lineColor = "rgba(0, 7, 16, 0.16)",
  sweepColor = "#E8A33D",
  spacing = 32,
  speed = 1,
  direction = "vertical",
}: GridLinesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // SAFE COLORS ONLY
    const safeLineColor = safeColor(lineColor, "rgba(0, 7, 16, 0.16)");
    const safeSweepColor = safeColor(sweepColor, "#E8A33D");

    const LINE_WIDTH = 1;
    const BAND_WIDTH = 160;
    const PERIOD_MS = 6000 / Math.max(speed, 0.1);

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

    const drawGrid = (alpha: number) => {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = safeLineColor;
      ctx.lineWidth = LINE_WIDTH;

      ctx.beginPath();

      for (let x = 0; x <= width; x += spacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }

      for (let y = 0; y <= height; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }

      ctx.stroke();
    };

    const drawSweep = (elapsed: number) => {
      const travel =
        direction === "vertical"
          ? width + BAND_WIDTH * 2
          : height + BAND_WIDTH * 2;

      const pos = ((elapsed % PERIOD_MS) / PERIOD_MS) * travel - BAND_WIDTH;

      const gradient =
        direction === "vertical"
          ? ctx.createLinearGradient(pos - BAND_WIDTH, 0, pos + BAND_WIDTH, 0)
          : ctx.createLinearGradient(0, pos - BAND_WIDTH, 0, pos + BAND_WIDTH);

      gradient.addColorStop(0, "transparent");
      gradient.addColorStop(0.5, safeSweepColor);
      gradient.addColorStop(1, "transparent");

      ctx.globalCompositeOperation = "source-atop";
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = gradient;

      if (direction === "vertical") {
        ctx.fillRect(pos - BAND_WIDTH, 0, BAND_WIDTH * 2, height);
      } else {
        ctx.fillRect(0, pos - BAND_WIDTH, width, BAND_WIDTH * 2);
      }
    };

    const drawFrame = (elapsed: number) => {
      ctx.clearRect(0, 0, width, height);

      const breathe = reduceMotion
        ? 0.5
        : 0.4 + 0.15 * Math.sin(elapsed / 2200);

      drawGrid(breathe);

      if (!reduceMotion) {
        drawSweep(elapsed);
      }

      ctx.globalCompositeOperation = "source-over";
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
  }, [lineColor, sweepColor, spacing, speed, direction]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}