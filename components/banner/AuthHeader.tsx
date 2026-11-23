
"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import { ThemeToggle } from "@/components/landing/theme-toggle";

interface AuthHeaderProps {
  /** Route the logo link sends the user to. */
  backHref?: string;

  /** Name shown next to the logo mark. */
  appName?: string;

  /** Additional classes for the header. */
  className?: string;
}

export function AuthHeader({
  backHref,
  appName = "Adama City",
  className,
}: AuthHeaderProps) {
  const locale = useLocale();

  // Keep navigation inside the citizen portal.
  const destination = backHref ?? `/${locale}`;

  return (
    <header
  className={`
    fixed inset-x-0 top-0 z-50
    w-full
    border-b border-border/60
    bg-background/80
    backdrop-blur-xl
    supports-[backdrop-filter]:bg-background/60
    ${className ?? ""}
  `}
>
      {/* Full-width header container */}
      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* Brand / Logo */}
        <a
          href={destination}
          className="flex shrink-0 items-center gap-3"
          aria-label={`${appName} home`}
        >
          <img
            src="/images/logo.png"
            alt={`${appName} logo`}
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />

          <span className="flex flex-col leading-none">
            <span className="font-serif text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
              {appName}
            </span>

            <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-[11px]">
              Mosajii Tejajila GMQ.
            </span>
          </span>
        </a>

        {/* Header Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

      </div>
    </header>
  );
}
