"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, LayoutGrid, Search, X } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/commen";
import { NAV_ITEMS } from "@/configs/navConfig";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type IconComponent = React.ComponentType<{ className?: string }>;

type NavigationEntry = NavItem & {
  permission?: string;
  items?: NavigationEntry[];
  icon?: IconComponent;
};

type QuickAccessGroupData = {
  key: string;
  title: string;
  icon?: IconComponent;
  items: NavigationEntry[];
};

/* -------------------------------------------------------------------------- */
/* Permissions                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Connect this hook to your existing permission check.
 * Return a function that is true only when the signed-in user holds the
 * given permission. Entries without a permission are always allowed.
 */
function useCanAccess() {
  // TODO: replace with your real permission hook, for example:
  // const { has } = usePermissions();
  // return (permission?: string) => !permission || has(permission);
  return (permission?: string) => !permission;
}

/* -------------------------------------------------------------------------- */
/* Data helpers                                                               */
/* -------------------------------------------------------------------------- */

function hasDestination(item: NavigationEntry): boolean {
  return Boolean(item.url && item.url !== "#");
}

function getChildren(item: NavigationEntry): NavigationEntry[] {
  return item.items ?? [];
}

/**
 * Builds display groups from the nav tree.
 * - Parents with accessible children become a group.
 * - Standalone top-level links are collected into one "General" group.
 * - Links the user cannot open are removed, so empty groups never render.
 */
function buildGroups(
  entries: NavigationEntry[],
  canAccess: (permission?: string) => boolean,
): QuickAccessGroupData[] {
  const isVisible = (item: NavigationEntry) =>
    hasDestination(item) && canAccess(item.permission);

  const groups: QuickAccessGroupData[] = [];
  const standalone: NavigationEntry[] = [];

  for (const entry of entries) {
    const children = getChildren(entry).filter(isVisible);

    if (children.length > 0) {
      groups.push({
        key: entry.title,
        title: entry.title,
        icon: entry.icon,
        items: children,
      });
    } else if (isVisible(entry)) {
      standalone.push(entry);
    }
  }

  if (standalone.length > 0) {
    groups.unshift({ key: "general", title: "General", items: standalone });
  }

  return groups;
}

/** Matches on module name, or keeps a whole group when its title matches. */
function filterGroups(
  groups: QuickAccessGroupData[],
  query: string,
): QuickAccessGroupData[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;

  return groups
    .map((group) => {
      if (group.title.toLowerCase().includes(q)) return group;
      const items = group.items.filter((item) =>
        item.title.toLowerCase().includes(q),
      );
      return { ...group, items };
    })
    .filter((group) => group.items.length > 0);
}

function isActive(pathname: string, url: string): boolean {
  return pathname === url || pathname.startsWith(`${url}/`);
}

/* -------------------------------------------------------------------------- */
/* Module row                                                                 */
/* -------------------------------------------------------------------------- */

function QuickAccessRow({
  item,
  active,
}: {
  item: NavigationEntry;
  active: boolean;
}) {
  const Icon = item.icon ?? LayoutGrid;

  return (
    <li className="min-w-0">
      <Link
        href={item.url}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group flex min-w-0 items-center gap-2.5 rounded-md px-2 py-1.5 text-sm",
          "transition-colors hover:bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active && "bg-primary/5",
        )}
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
            "bg-muted text-muted-foreground",
            "group-hover:bg-primary/10 group-hover:text-primary",
            active && "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
        </span>

        <span
          className={cn(
            "min-w-0 flex-1 truncate font-medium",
            active && "text-primary",
          )}
        >
          {item.title}
        </span>

        <ArrowUpRight
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground/70 transition-all",
            "group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary",
            "motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0",
            active && "text-primary",
          )}
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Group card                                                                 */
/* -------------------------------------------------------------------------- */

function QuickAccessGroup({
  group,
  pathname,
}: {
  group: QuickAccessGroupData;
  pathname: string;
}) {
  const headingId = useId();
  const Icon = group.icon ?? LayoutGrid;

  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 rounded-xl border bg-card"
    >
      <div className="flex items-center gap-2.5 border-b px-3 py-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-3.5" aria-hidden="true" />
        </span>

        <h3
          id={headingId}
          className="min-w-0 flex-1 truncate text-sm font-semibold"
        >
          {group.title}
        </h3>

        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {group.items.length}
        </span>
      </div>

      <ul className="space-y-0.5 p-1.5">
        {group.items.map((item) => (
          <QuickAccessRow
            key={item.url}
            item={item}
            active={isActive(pathname, item.url)}
          />
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Quick access                                                               */
/* -------------------------------------------------------------------------- */

export default function QuickAccess() {
  const canAccess = useCanAccess();
  const pathname = usePathname() ?? "";
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  const allGroups = useMemo(
    () => buildGroups(NAV_ITEMS as NavigationEntry[], canAccess),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const groups = useMemo(
    () => filterGroups(allGroups, query),
    [allGroups, query],
  );

  const totalModules = allGroups.reduce((sum, g) => sum + g.items.length, 0);
  const visibleModules = groups.reduce((sum, g) => sum + g.items.length, 0);
  const isSearching = query.trim().length > 0;

  // Press "/" anywhere on the page to jump to search.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey) return;

      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (typing) return;

      event.preventDefault();
      searchRef.current?.focus();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <section aria-labelledby="quick-access-heading">
      <Card className="min-w-0 gap-0 py-0">
        <CardHeader className="px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <LayoutGrid className="size-4" aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <CardTitle
                  id="quick-access-heading"
                  className="text-sm font-semibold"
                >
                  Quick access
                </CardTitle>

                <CardDescription className="text-xs">
                  {totalModules > 0
                    ? `${totalModules} modules available to you`
                    : "Jump to the modules you can use"}
                </CardDescription>
              </div>
            </div>

            {totalModules > 0 ? (
              <div className="relative w-full sm:w-64">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />

                <Input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setQuery("");
                  }}
                  placeholder="Search modules"
                  aria-label="Search modules"
                  className="h-9 pl-8 pr-8 text-sm [&::-webkit-search-cancel-button]:hidden"
                />

                {isSearching ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      searchRef.current?.focus();
                    }}
                    aria-label="Clear search"
                    className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                ) : (
                  <kbd
                    className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground sm:block"
                    aria-hidden="true"
                  >
                    /
                  </kbd>
                )}
              </div>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 pt-1">
          <p className="sr-only" role="status" aria-live="polite">
            {isSearching ? `${visibleModules} modules found` : ""}
          </p>

          {groups.length > 0 ? (
            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {groups.map((group) => (
                <QuickAccessGroup
                  key={group.key}
                  group={group}
                  pathname={pathname}
                />
              ))}
            </div>
          ) : isSearching ? (
            <div className="flex flex-col items-center gap-1 py-8 text-center">
              <p className="text-sm font-medium">
                No modules match &ldquo;{query.trim()}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground">
                Check the spelling or try a shorter name.
              </p>
            </div>
          ) : (
            <p className="py-3 text-sm text-muted-foreground">
              You don&rsquo;t have access to any modules yet. Ask an
              administrator to update your permissions.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}