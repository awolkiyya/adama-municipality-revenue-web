
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import { ThemeToggle } from "@/components/landing/theme-toggle";

interface AuthHeaderProps {
  /** Route the back button and logo link send the user to. */
  backHref?: string;
  /** Name shown next to the logo mark. */
  appName?: string;
  className?: string;
}

export function AuthHeader({
  backHref,
  appName = "Adama City",
  className,
}: AuthHeaderProps) {
  const locale = useLocale();

  // Keep navigation inside the citizen portal.
  const defaultBackHref = `/${locale}`;
  const destination = backHref ?? defaultBackHref;

  return (
    <header
      className={`sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className ?? ""}`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">


          <a
            href={destination}
            className="flex items-center gap-3"
            aria-label={`${appName} home`}
          >
            <img
              src="/images/logo.png"
              alt={`${appName} logo`}
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />

            <span className="flex flex-col leading-none">
              <span className="font-serif text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
                {appName}
              </span>

              <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Mosajii Tejajila GMQ.
              </span>
            </span>
          </a>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
