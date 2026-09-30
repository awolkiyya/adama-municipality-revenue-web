"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTransition } from "react";

// Keep in sync with your next-intl locales. Names are shown in their own language.
export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "am", label: "አማርኛ" },
  { value: "or", label: "Afaan Oromoo" },
] as const;

/** Switches the locale segment of the URL and keeps the user on the same page. */
export function useLocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const change = (next: string) => {
    if (next === locale) return;

    const segments = pathname.split("/"); // ["", "en", "citizen", ...]
    if (segments[1] === locale) segments[1] = next;
    else segments.splice(1, 0, next); // default locale had no prefix

    const query = window.location.search;
    startTransition(() => {
      router.replace(segments.join("/") + query);
    });
  };

  return { locale, change, pending, languages: LANGUAGES };
}