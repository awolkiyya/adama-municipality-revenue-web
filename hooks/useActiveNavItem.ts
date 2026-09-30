"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useCallback, useMemo } from "react";

import { getActiveNavItem, normalizePath, type NavItem } from "@/lib/navigation";

export function useActiveNavItem<T extends NavItem>(items: readonly T[]) {
  const pathname = usePathname();
  const locale = useLocale();

  const path = useMemo(
    () => normalizePath(pathname, [locale]),
    [pathname, locale]
  );

  const active = useMemo(() => getActiveNavItem(items, path), [items, path]);
  const isActive = useCallback((item: T) => item === active, [active]);

  return { active, isActive, path };
}