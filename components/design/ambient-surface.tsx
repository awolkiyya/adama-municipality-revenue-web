"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface AmbientSurfaceProps {
  /** The animated background element, e.g. <DotField /> or <WaveLines /> */
  background: ReactNode;
  children: ReactNode;
  className?: string;
  /**
   * Defer mounting the background until this container scrolls into view.
   * Keeps a page with many cards from running many rAF loops at once.
   * Turn off for content that's visible on first paint (e.g. the hero).
   */
  lazy?: boolean;
}

/**
 * Standard positioning shell for ambient canvas backgrounds:
 * - `relative overflow-hidden` on the container, so the canvas is clipped
 *   to rounded corners and never bleeds into neighboring sections
 * - background layer at `absolute inset-0`, z-0 (the default stacking
 *   order, no z-index needed)
 * - content layer at `relative z-10`, always above the canvas
 *
 * This is the one place that ordering lives — call sites never repeat it.
 */
export function AmbientSurface({
  background,
  children,
  className = "",
  lazy = true,
}: AmbientSurfaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(!lazy);

  useEffect(() => {
    if (!lazy) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // start the canvas slightly before it's visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [lazy]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {shouldRender && (
        <div className="absolute inset-0">{background}</div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}