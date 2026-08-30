import { useEffect, useRef } from "react";

interface WaveLinesProps {
    /** One color per line — cycles if lineCount exceeds colors.length */
    colors?: string[];
    /** How many wave lines to draw */
    lineCount?: number;
    /** Vertical reach of the wave, in px */
    amplitude?: number;
    /** Overall animation speed multiplier */
    speed?: number;
  }
  
  /**
   * Full-bleed ambient wave field. Each line drifts as a layered sine wave;
   * a bright segment travels along every line on its own cycle, fading in
   * and out via a gradient stroke rather than a hard edge.
   *
   * Respects prefers-reduced-motion: renders a single static frame with
   * plain, dim strokes and no traveling highlight.
   */
  export function WaveLines({
    colors = ["#E8A33D", "#E14B4B", "rgba(148, 163, 184, 0.4)"],
    lineCount = colors.length,
    amplitude = 22,
    speed = 1,
  }: WaveLinesProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
  
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
  
      const WAVELENGTH = 220; // px per full sine cycle
      const STEP = 5; // px between sampled points along x
      const LINE_WIDTH = 1.6;
      const GLOW_WIDTH = 110; // px reach of the traveling highlight
      const PULSE_PERIOD_MS = 4400; // how often the highlight crosses a line
  
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
  
      const baselineFor = (index: number) => {
        if (lineCount === 1) return height * 0.5;
        const top = height * 0.28;
        const bottom = height * 0.72;
        return top + (index / (lineCount - 1)) * (bottom - top);
      };
  
      const sampleY = (x: number, baseline: number, phase: number, t: number) =>
        baseline +
        Math.sin(x / WAVELENGTH + t * 1.2 + phase) * amplitude +
        Math.sin(x / 60 + t * 1.9 + phase) * amplitude * 0.22;
  
      const drawFrame = (elapsed: number) => {
        ctx.clearRect(0, 0, width, height);
        const t = reduceMotion ? 0 : (elapsed / 1000) * speed;
  
        for (let li = 0; li < lineCount; li++) {
          const color = colors[li % colors.length];
          const phase = li * 1.7;
          const baseline = baselineFor(li);
  
          // Base line — dim, always visible.
          ctx.beginPath();
          for (let x = 0; x <= width; x += STEP) {
            const y = sampleY(x, baseline, phase, t);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.globalAlpha = 0.22;
          ctx.strokeStyle = color;
          ctx.lineWidth = LINE_WIDTH;
          ctx.stroke();
  
          if (reduceMotion) continue;
  
          // Traveling highlight — a short segment that fades in/out via a
          // gradient stroke, sweeping along the same path on its own cycle.
          const pulseT =
            ((elapsed + li * 900) % PULSE_PERIOD_MS) / PULSE_PERIOD_MS;
          const pulseX = pulseT * (width + GLOW_WIDTH * 2) - GLOW_WIDTH;
          const from = Math.max(0, pulseX - GLOW_WIDTH);
          const to = Math.min(width, pulseX + GLOW_WIDTH);
          if (to <= from) continue;
  
          ctx.beginPath();
          for (let x = from; x <= to; x += STEP) {
            const y = sampleY(x, baseline, phase, t);
            if (x === from) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
  
          const gradient = ctx.createLinearGradient(from, 0, to, 0);
          gradient.addColorStop(0, "transparent");
          gradient.addColorStop(0.5, color);
          gradient.addColorStop(1, "transparent");
  
          ctx.globalAlpha = 0.85;
          ctx.strokeStyle = gradient;
          ctx.lineWidth = LINE_WIDTH + 1.2;
          ctx.stroke();
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
    }, [colors, lineCount, amplitude, speed]);
  
    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    );
  }