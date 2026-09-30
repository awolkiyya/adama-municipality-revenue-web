import type { LucideIcon } from "lucide-react";

/**
 * Shape of a navigation entry. Add `exact` for pages that must only be
 * active on their own URL (usually the dashboard home).
 */
export interface NavItem {
  key?: string;
  href: string;
  labelKey: string;
  icon?: LucideIcon;
  /** Active only when the path equals `href`, not for nested paths. */
  exact?: boolean;
  /** Extra paths that should also highlight this item (e.g. detail pages). */
  matchPrefixes?: readonly string[];
}

/** "/am/dashboard/taxpayer/" -> "/dashboard/taxpayer" */
export function normalizePath(
  pathname: string,
  locales: readonly string[] = []
): string {
  const parts = pathname.split("/");
  let path = pathname;

  // parts[0] is "" because the path starts with "/"
  if (parts[1] && locales.includes(parts[1])) {
    path = "/" + parts.slice(2).join("/");
  }

  // Remove the trailing slash, but keep the root "/"
  return path.length > 1 ? path.replace(/\/+$/, "") : path || "/";
}

function matches(pathname: string, prefix: string, exact = false): boolean {
  if (exact) return pathname === prefix;
  // The "/" boundary stops "/invoices-archive" matching "/invoices".
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Returns the single best-matching item for a path, or null.
 * The longest matching href wins, so a parent route such as
 * "/dashboard/taxpayer" never steals a child such as
 * ".../invoices", whatever the order of the config array.
 */
export function getActiveNavItem<T extends NavItem>(
  items: readonly T[],
  pathname: string
): T | null {
  let best: T | null = null;
  let bestLength = -1;

  for (const item of items) {
    const candidates = [item.href, ...(item.matchPrefixes ?? [])];

    for (const candidate of candidates) {
      const isMatch = matches(
        pathname,
        candidate,
        candidate === item.href ? item.exact : false
      );

      if (isMatch && candidate.length > bestLength) {
        best = item;
        bestLength = candidate.length;
      }
    }
  }

  return best;
}