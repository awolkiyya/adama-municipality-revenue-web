"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, MapPin, User, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { Citizen } from "@/types/citizen";

type TaxpayerSelectorProps = {
  value: string;
  onChange: (taxpayerId: string) => void;
  taxpayers: Citizen[];
  disabled?: boolean;
};

export function TaxpayerSelector({
  value,
  onChange,
  taxpayers,
  disabled = false,
}: TaxpayerSelectorProps) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => taxpayers.find((t) => String(t.id) === String(value)) ?? null,
    [taxpayers, value],
  );

  const details = selected
    ? [
        { label: "Full name", value: selected.full_name },
        { label: "National ID", value: selected.national_id },
        { label: "Citizen UID", value: selected.citizen_uid },
        { label: "Phone", value: selected.phone || "—" },
        { label: "Gender", value: selected.gender },
        {
          label: "Address",
          value:
            selected.administrative_unit?.full_address ||
            selected.address ||
            "—",
        },
      ]
    : [];

  return (
    <div className="rounded-xl border-none bg-card shadow-none p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Taxpayer
        </h2>
        <p className="text-sm text-muted-foreground">
          Select the citizen this assessment applies to.
        </p>
      </div>

      <div>
        <Label htmlFor="taxpayer-selector">
          Taxpayer <span className="text-destructive">*</span>
        </Label>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="taxpayer-selector"
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="mt-2 h-auto min-h-11 w-full justify-between py-2 font-normal"
            >
              {selected ? (
                <span className="flex flex-col items-start text-left truncate">
                  <span className="truncate text-sm font-medium">
                    {selected.full_name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    National ID {selected.national_id}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground truncate">
                  Search by name, national ID, or phone...
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            className="w-[var(--radix-popover-trigger-width)] p-0"
          >
            <Command>
              <CommandInput placeholder="Search by name, national ID, or phone..." />

              <CommandList className="max-h-[320px] overflow-y-auto">
                <CommandEmpty>
                  <div className="py-5 text-center text-sm text-muted-foreground">
                    No taxpayer found.
                  </div>
                </CommandEmpty>

                <CommandGroup>
                  {taxpayers.map((t) => {
                    const isSelected = String(t.id) === String(value);
                    return (
                      <CommandItem
                        key={t.id}
                        value={[
                          t.full_name,
                          t.national_id,
                          t.phone,
                          t.administrative_unit?.name,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onSelect={() => {
                          onChange(t.id);
                          setOpen(false);
                        }}
                        className="py-3"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 shrink-0 ${
                            isSelected ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {t.full_name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {t.national_id} · {t.gender}
                            {t.administrative_unit?.name &&
                              ` · ${t.administrative_unit.name}`}
                          </p>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>

              <div className="border-t p-2">
                <Button
                  asChild
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full justify-center text-xs"
                >
                  <Link href="/revenue/taxpayers/create" onClick={() => setOpen(false)}>
                    <User className="mr-2 h-3.5 w-3.5" />
                    Register new taxpayer
                  </Link>
                </Button>
              </div>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selected && (
        <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-1">
              <Check className="h-3 w-3" />
              Selected
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onChange("")}
            >
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {details.map((d) => (
              <div key={d.label} className="min-w-0">
                <span className="text-xs text-muted-foreground">{d.label}</span>
                <p className="truncate font-medium">{d.value}</p>
              </div>
            ))}
          </div>

          {selected.administrative_unit?.name && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {selected.administrative_unit.name}
            </p>
          )}
        </div>
      )}
    </div>
  );
}