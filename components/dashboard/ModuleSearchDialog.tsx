"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  LayoutGrid,
  Search,
} from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { NavItem } from "@/types/commen";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type IconComponent = React.ComponentType<{
  className?: string;
}>;

type NavigationEntry = Omit<NavItem, "items" | "icon"> & {
  description?: string;
  keywords?: string[];
  items?: NavigationEntry[];
  icon?: IconComponent;
};

type NavGroup = {
  key: string;
  title: string;
  items: NavigationEntry[];
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Only links with a real destination can appear as search results.
 */
function hasDestination(
  item: NavigationEntry,
): boolean {
  return Boolean(item.url && item.url !== "#");
}

/**
 * Builds searchable groups from the navigation supplied by AppSidebar.
 *
 * Permission filtering is performed by AppSidebar before this component
 * receives the navigation items.
 *
 * - Groups with visible child links remain grouped.
 * - Standalone links are collected under General.
 * - Empty groups are omitted.
 */
function buildGroups(
  entries: NavigationEntry[],
): NavGroup[] {
  const groups: NavGroup[] = [];
  const standalone: NavigationEntry[] = [];

  for (const entry of entries) {
    const children = (entry.items ?? []).filter(
      hasDestination,
    );

    if (children.length > 0) {
      groups.push({
        key: entry.url || entry.title,
        title: entry.title,
        items: children,
      });

      continue;
    }

    if (hasDestination(entry)) {
      standalone.push(entry);
    }
  }

  if (standalone.length > 0) {
    groups.unshift({
      key: "general",
      title: "General",
      items: standalone,
    });
  }

  return groups;
}

/* -------------------------------------------------------------------------- */
/* Module Search Dialog                                                       */
/* -------------------------------------------------------------------------- */

interface ModuleSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navItems: NavItem[];
}

/**
 * Searchable navigation dialog.
 *
 * Features:
 * - Uses the active portal's navigation.
 * - Displays only the items supplied by AppSidebar.
 * - Supports text filtering and keyboard navigation.
 * - Enter opens a module.
 * - Escape closes the dialog through the Dialog component.
 */
export default function ModuleSearchDialog({
  open,
  onOpenChange,
  navItems,
}: ModuleSearchDialogProps) {
  const router = useRouter();

  const groups = useMemo(
    () =>
      buildGroups(
        navItems as NavigationEntry[],
      ),
    [navItems],
  );

  function navigateTo(url: string) {
    if (!url || url === "#") {
      return;
    }

    onOpenChange(false);
    router.push(url);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="overflow-hidden p-0 sm:max-w-[620px]">
        <DialogHeader className="sr-only">
          <DialogTitle>
            Search modules
          </DialogTitle>

          <DialogDescription>
            Search the application navigation and open
            an authorized module.
          </DialogDescription>
        </DialogHeader>

        <Command
          loop
          className="rounded-xl"
          filter={(value, search) =>
            value
              .toLowerCase()
              .includes(search.toLowerCase().trim())
              ? 1
              : 0
          }
        >
          {/* SEARCH INPUT */}

          <div className="flex w-full items-center gap-3 border-b px-4">
            <Search
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />

            <CommandInput
              placeholder="Search modules, payments, invoices..."
              className="h-14 min-w-0 flex-1 border-0 px-0 text-sm shadow-none focus-visible:ring-0"
            />

            <kbd
              className="hidden shrink-0 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-block"
              aria-hidden="true"
            >
              Esc
            </kbd>
          </div>

          {/* SEARCH RESULTS */}

          <CommandList className="max-h-[min(65vh,480px)] p-2">
            <CommandEmpty className="py-10 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
                <Search
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>

              <p className="mt-3 text-sm font-medium">
                No modules found
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Try another module name or search term.
              </p>
            </CommandEmpty>

            {groups.map((group, index) => (
              <div key={group.key}>
                {index > 0 && (
                  <CommandSeparator className="my-2" />
                )}

                <CommandGroup
                  heading={group.title}
                  className="
                    [&_[cmdk-group-heading]]:px-3
                    [&_[cmdk-group-heading]]:py-2
                    [&_[cmdk-group-heading]]:text-xs
                    [&_[cmdk-group-heading]]:font-semibold
                  "
                >
                  {group.items.map((item) => {
                    const Icon = item.icon ?? LayoutGrid;

                    const searchValue = [
                      item.title,
                      group.title,
                      item.description,
                      ...(item.keywords ?? []),
                      item.url,
                    ]
                      .filter(
                        (value): value is string =>
                          typeof value === "string" &&
                          value.length > 0,
                      )
                      .join(" ");

                    return (
                      <CommandItem
                        key={item.url}
                        value={searchValue}
                        onSelect={() =>
                          navigateTo(item.url)
                        }
                        className="
                          group flex cursor-pointer
                          items-center gap-3 rounded-lg px-3 py-2.5
                        "
                      >
                        {/* MODULE ICON */}

                        <div
                          className="
                            flex size-9 shrink-0 items-center
                            justify-center rounded-lg border
                            bg-background text-muted-foreground
                            group-data-[selected=true]:border-primary/20
                            group-data-[selected=true]:bg-primary/10
                            group-data-[selected=true]:text-primary
                          "
                        >
                          <Icon
                            className="size-4"
                            aria-hidden="true"
                          />
                        </div>

                        {/* MODULE DETAILS */}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.title}
                          </p>

                          {item.description && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* SELECTED INDICATOR */}

                        <ArrowRight
                          className="
                            size-4 shrink-0 text-muted-foreground
                            opacity-0 transition-opacity
                            group-data-[selected=true]:opacity-100
                          "
                          aria-hidden="true"
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </div>
            ))}
          </CommandList>

          {/* KEYBOARD HINTS */}

          <div
            className="
              flex flex-wrap items-center justify-between
              gap-2 border-t bg-muted/30 px-4 py-3
              text-[11px] text-muted-foreground
            "
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <kbd className="rounded border bg-background px-1.5 py-0.5">
                  ↑
                </kbd>

                <kbd className="rounded border bg-background px-1.5 py-0.5">
                  ↓
                </kbd>

                Navigate
              </span>

              <span className="inline-flex items-center gap-1.5">
                <kbd className="rounded border bg-background px-1.5 py-0.5">
                  ↵
                </kbd>

                Open
              </span>
            </div>

            <span>
              Available modules depend on your permissions
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
