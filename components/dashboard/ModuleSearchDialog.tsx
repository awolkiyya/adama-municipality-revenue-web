"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Search,
} from "lucide-react";


import Can from "@/components/access/Can";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { ModuleCategory, MODULES } from "@/types/dashboard";
/**
 * Searchable module dialog.
 *
 * Command handles text filtering and arrow-key navigation.
 * Enter opens a result; Escape closes the dialog.
 * Can wraps every result so users only see modules they can access.
 */
  export default function ModuleSearchDialog({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) {
    const router = useRouter();
  
    const categories: ModuleCategory[] = [
      "Revenue",
      "Operations",
      "Administration",
    ];
  
    function navigateToModule(href: string) {
      onOpenChange(false);
      router.push(href);
    }
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="overflow-hidden p-5 sm:max-w-[620px]">
          <DialogHeader className="sr-only">
            <DialogTitle>Search modules</DialogTitle>
            <DialogDescription>
              Search the municipal revenue system and open an authorized module.
            </DialogDescription>
          </DialogHeader>
  
          <Command
            loop
            className="rounded-xl"
            filter={(value, search) =>
              value.toLowerCase().includes(search.toLowerCase().trim()) ? 1 : 0
            }
          >
            <div className="flex w-full items-center gap-3 border-b px-4">
  <Search className="size-5 shrink-0 text-muted-foreground" />

  <CommandInput
    placeholder="Search modules, payments, invoices..."
    className="h-14 min-w-0 flex-1 border-0 px-0 text-sm shadow-none focus-visible:ring-0"
  />

  <kbd className="hidden shrink-0 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-block">
    ESC
  </kbd>
</div>
  
            <CommandList className="max-h-[min(65vh,480px)] p-2">
              <CommandEmpty className="py-10 text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
                  <Search className="size-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium">No modules found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try another module name or search term.
                </p>
              </CommandEmpty>
  
              {categories.map((category, categoryIndex) => (
                <div key={category}>
                  {categoryIndex > 0 && <CommandSeparator className="my-2" />}
  
                  <CommandGroup
                    heading={category}
                    className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                  >
                    {MODULES.filter((module) => module.category === category).map(
                      (module) => {
                        const Icon = module.icon;
  
                        return (
                          <Can
                            key={module.title}
                            resource={module.resource}
                            action={module.action}
                          >
                            <CommandItem
                              value={`${module.title} ${module.description} ${(module.keywords ?? []).join(" ")}`}
                              onSelect={() => navigateToModule(module.href)}
                              className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3"
                            >
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground group-data-[selected=true]:border-primary/20 group-data-[selected=true]:bg-primary/10 group-data-[selected=true]:text-primary">
                                <Icon className="size-4" />
                              </div>
  
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">
                                  {module.title}
                                </p>
                                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                  {module.description}
                                </p>
                              </div>
  
                              <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
                            </CommandItem>
                          </Can>
                        );
                      },
                    )}
                  </CommandGroup>
                </div>
              ))}
            </CommandList>
  
            <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-4 py-3 text-[11px] text-muted-foreground">
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
  
              <span>Only authorized modules are shown</span>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    );
  }