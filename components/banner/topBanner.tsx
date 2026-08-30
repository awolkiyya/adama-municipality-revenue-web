import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BannerProps = {
  /**
   * Optional now — when omitted, the icon + badge combo carries the
   * banner's identity on their own (e.g. an icon with a "Draft" or
   * "Beta" badge next to it, no heading text needed).
   */
  title?: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  /**
   * Small label rendered inline next to the title — or, when there's no
   * title, standing in as the banner's identity alongside the icon.
   * Pass a styled <span> or your own <Badge /> component; Banner just
   * places it, it doesn't style it.
   */
  badge?: ReactNode;
  /**
   * Optional decorative background, rendered behind everything.
   * Pass a <GridLines /> here, a gradient div, an image, or nothing at all —
   * Banner doesn't need to know what it is, only where to put it.
   */
  background?: ReactNode;
  /**
   * Optional tint sitting between the background and the content, so
   * text stays legible over busy backgrounds like GridLines or an image.
   * Accepts Tailwind classes — e.g. "bg-background/80" or a gradient like
   * "bg-gradient-to-r from-background via-background/85 to-background/40".
   * Defaults to a soft gradient that works with most backgrounds.
   */
  overlayClassName?: string;
  className?: string;
};

export function Banner({
  title,
  description,
  actions,
  icon,
  badge,
  background,
  overlayClassName = "bg-gradient-to-r from-background/95 via-background/85 to-background/60",
  className,
}: BannerProps) {
  const hasHeaderRow = title || badge;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 shadow-sm sm:p-6",
        className
      )}
    >
      {background && (
        <div className="absolute inset-0" aria-hidden="true">
          {background}
        </div>
      )}

      {background && (
        <div
          className={cn("absolute inset-0", overlayClassName)}
          aria-hidden="true"
        />
      )}

      <div className="relative z-0 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/80 text-foreground shadow-sm backdrop-blur-sm">
              {icon}
            </div>
          )}

          <div className="">
            {hasHeaderRow && (
              <div className="flex flex-wrap items-left gap-2">
                {title && (
                  <h1 className="text-xl font-semibold tracking-tight">
                    {title}
                  </h1>
                )}
                {badge}
              </div>
            )}
            {description && (
              <p className="text-lg pl-1  font-bold leading-relaxed">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}