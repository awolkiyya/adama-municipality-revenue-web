
"use client";

import * as React from "react";
import {
  Check,
  ChevronsUpDown,
  X,
} from "lucide-react";

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

/* =========================================================
   TYPES
   ========================================================= */

export type Option = {
  id: string;
  label: string;
  meta?: unknown;
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

/* =========================================================
   COMPONENT
   ========================================================= */

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

  /* =======================================================
     SELECTED OPTION
     ======================================================= */

  const selected = React.useMemo(() => {
    if (!value) {
      return undefined;
    }

    return options.find(
      (option) => String(option.id) === String(value),
    );
  }, [options, value]);

  /* =======================================================
     ACTIONS
     ======================================================= */

  const handleSelect = (option: Option) => {
    onChange(option);
    setOpen(false);
  };

  const handleClear = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    if (disabled) {
      return;
    }

    onChange(null);
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="w-full justify-between py-4"
          aria-expanded={open}
        >
          <span className="truncate">
            {selected
              ? selected.label
              : placeholder}
          </span>

          <div className="flex items-center gap-1">
            {selected && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear selection"
                className="flex items-center justify-center rounded-md p-1 hover:bg-muted"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-red-500" />
              </button>
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
          <CommandInput
            placeholder={searchPlaceholder}
          />

          <CommandList>
            <CommandEmpty>
              {emptyMessage}
            </CommandEmpty>

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
                        isActive
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />

                    {option.label}
                  </CommandItem>
                );
              })}

              {/* Clear selection */}

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
