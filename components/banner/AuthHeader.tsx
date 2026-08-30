"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { Locale } from "next-intl";




interface AuthHeaderProps {
  /** Route the back button and logo link send the user to. Defaults to "/". */
  backHref?: string;
  /** Name shown next to the logo mark. Defaults to "Adama City". */
  appName?: string;
  className?: string;
}

/**
 * Sticky, blurred auth-flow header: back button, logo + app name,
 * language switcher, and theme toggle. Drop into any auth page
 * (login, register, forgot-password, etc.) with no extra wiring —
 * it owns its own locale state.
 */
export function AuthHeader({
  backHref = "/",
  appName = "Adama City",
  className,
}: AuthHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={`sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className ?? ""}`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.push(backHref)}
            aria-label={"Back"}
            className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <ChevronLeft className="h-[18px] w-[18px]" />
          </Button>

          <Separator orientation="vertical" className="hidden h-6 sm:block" />

          <a href={backHref} className="flex items-center gap-10">
            <img src={"/images/logo.png"} className="h-8 w-8 " />

            <span className="flex flex-col leading-none">
              <span className="font-serif text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
                {appName}
              </span>
              <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {" Mosajii Tejajila GMQ."}
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