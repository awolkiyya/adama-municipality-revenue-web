"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type Option = {
  id: string;
  label: string;
  meta?: any;
};

type Props = {
  value?: string | null;
  options: Option[];

  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;

  disabled?: boolean;

  onChange: (option: Option | null) => void;
};

export function SmartSelect({
  value,
  options,
  onChange,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  emptyMessage = "No result found.",
  disabled = false,
}: Props) {
  const [open, setOpen] = React.useState(false);

  /**
   * Normalize selection safely (prevents type mismatch bugs)
   */
  const selected = React.useMemo(() => {
    if (!value) return undefined;
    return options.find((o) => String(o.id) === String(value));
  }, [options, value]);

  const handleSelect = (option: Option) => {
    onChange(option);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="w-full justify-between py-4"
        >
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>

          <div className="flex items-center gap-1">
            {selected && !disabled && (
              <span
                onClick={handleClear}
                className="flex items-center justify-center rounded-md hover:bg-muted p-1"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-red-500" />
              </span>
            )}

            <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />

          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>

            <CommandGroup>
              {options.map((option) => {
                const isActive =
                  String(value) === String(option.id);

                return (
                  <CommandItem
                    key={option.id}
                    value={option.label}
                    onSelect={() => handleSelect(option)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isActive ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                );
              })}

              {/* Optional explicit clear row */}
              {selected && (
                <CommandItem
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="text-muted-foreground"
                >
                  Clear selection
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}