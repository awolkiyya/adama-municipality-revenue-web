
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BannerProps = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  background?: ReactNode;
  overlayClassName?: string;
  className?: string;
};

export function Banner({
  title,
  description,
  icon,
  badge,
  actions,
  background,
  overlayClassName,
  className,
}: BannerProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-sm border p-4 sm:p-5 shadow-none",
        className
      )}
    >
      {background && (
        <>
          <div
            className="absolute inset-0"
            aria-hidden="true"
          >
            {background}
          </div>

          <div
            className={cn(
              "absolute inset-0",
              overlayClassName ?? "bg-white/90"
            )}
            aria-hidden="true"
          />
        </>
      )}

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border">
              {icon}
            </div>
          )}

          <div className="min-w-0">
            {(title || badge) && (
              <div className="flex flex-wrap items-center gap-2">
                {title && (
                  <h1 className="text-lg font-semibold tracking-tight">
                    {title}
                  </h1>
                )}

                {badge}
              </div>
            )}

            {description && (
              <p
                className={cn(
                  "text-sm leading-relaxed",
                  (title || badge) && "mt-1"
                )}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}