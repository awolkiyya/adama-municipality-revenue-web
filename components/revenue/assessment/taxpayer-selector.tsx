"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  MapPin,
  User,
  X,
} from "lucide-react";

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

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Citizen } from "@/types/citizen";

/* =====================================================
 * TYPES
 * ===================================================== */

type TaxpayerSelectorProps = {
  value: string;
  onChange: (taxpayerId: string) => void;
  taxpayers: Citizen[];
  disabled?: boolean;
};

/* =====================================================
 * COMPONENT
 * ===================================================== */

export function TaxpayerSelector({
  value,
  onChange,
  taxpayers,
  disabled = false,
}: TaxpayerSelectorProps) {
  const [open, setOpen] = useState(false);

  /* ===================================================
   * SELECTED TAXPAYER
   * =================================================== */

  const selectedTaxpayer = useMemo(
    () =>
      taxpayers.find(
        (taxpayer) => String(taxpayer.id) === String(value),
      ) ?? null,
    [taxpayers, value],
  );

  /* ===================================================
   * HANDLERS
   * =================================================== */

  const handleSelect = (taxpayerId: string) => {
    onChange(taxpayerId);
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
  };

  /* ===================================================
   * RENDER
   * =================================================== */

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* =================================================
       * HEADER
       * ================================================= */}

      <div className="flex items-center gap-3 border-b p-5 sm:p-6">
        <div className="rounded-lg bg-primary/10 p-2">
          <User className="h-4 w-4 text-primary" />
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-semibold">
            Taxpayer
          </h2>

          <p className="text-sm text-muted-foreground">
            Select the citizen this assessment applies to.
          </p>
        </div>
      </div>

      {/* =================================================
       * CONTENT
       * ================================================= */}

      <div className="space-y-4 p-5 sm:p-6">
        {/* =================================================
         * TAXPAYER SELECTOR
         * ================================================= */}

        <div>
          <Label htmlFor="taxpayer-selector">
            Taxpayer
            <span className="ml-1 text-destructive">
              *
            </span>
          </Label>

          <Popover
            open={open}
            onOpenChange={setOpen}
          >
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
                {selectedTaxpayer ? (
                  <span className="flex min-w-0 flex-col items-start text-left">
                    <span className="max-w-[calc(100%-2rem)] truncate text-sm font-medium">
                      {selectedTaxpayer.full_name}
                    </span>

                    <span className="max-w-[calc(100%-2rem)] truncate text-xs text-muted-foreground">
                      National ID {selectedTaxpayer.national_id}
                    </span>
                  </span>
                ) : (
                  <span className="truncate text-muted-foreground">
                    Search by name, national ID, or phone...
                  </span>
                )}

                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            {/* =================================================
             * DROPDOWN
             * ================================================= */}

            <PopoverContent
              align="start"
              sideOffset={6}
              className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] overflow-hidden p-0"
            >
              <Command className="w-full">
                {/* =================================================
                 * SEARCH
                 * ================================================= */}

                <CommandInput
                  placeholder="Search by name, national ID, or phone..."
                />

                <CommandList className="max-h-[360px] overflow-y-auto">
                  {/* =================================================
                   * EMPTY
                   * ================================================= */}

                  <CommandEmpty>
                    <div className="space-y-3 px-4 py-5 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>

                      <div>
                        <p className="text-sm font-medium">
                          No taxpayer found
                        </p>

                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          Try another name, national ID, or
                          phone number.
                        </p>
                      </div>

                      {/* =================================================
                       * REGISTER NEW TAXPAYER
                       * ================================================= */}

                      <Button
                        asChild
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Link
                          href="/revenue/taxpayers/create"
                          onClick={() => setOpen(false)}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Register new taxpayer
                        </Link>
                      </Button>
                    </div>
                  </CommandEmpty>

                  {/* =================================================
                   * TAXPAYER LIST
                   * ================================================= */}

                  <CommandGroup>
                    {taxpayers.map((taxpayer) => {
                      const selected =
                        String(taxpayer.id) === String(value);

                      return (
                        <CommandItem
                          key={taxpayer.id}
                          value={[
                            taxpayer.full_name,
                            taxpayer.national_id,
                            taxpayer.citizen_uid,
                            taxpayer.phone,
                            taxpayer.address,
                            taxpayer.administrative_unit?.name,
                            taxpayer.administrative_unit?.full_address,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onSelect={() =>
                            handleSelect(taxpayer.id)
                          }
                          className="cursor-pointer py-3"
                        >
                          {/* =================================================
                           * SELECTION INDICATOR
                           * ================================================= */}

                          <div
                            className={`mr-3 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {selected && (
                              <Check className="h-3 w-3" />
                            )}
                          </div>

                          {/* =================================================
                           * TAXPAYER INFORMATION
                           * ================================================= */}

                          <div className="min-w-0 flex-1">
                            {/* Name */}

                            <p className="truncate text-sm font-medium">
                              {taxpayer.full_name}
                            </p>

                            {/* National ID + Gender */}

                            <p className="truncate text-xs text-muted-foreground">
                              National ID {taxpayer.national_id}
                              {" · "}
                              {taxpayer.gender}
                            </p>

                            {/* Phone */}

                            {taxpayer.phone && (
                              <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">
                                {taxpayer.phone}
                              </p>
                            )}

                            {/* Administrative Unit */}

                            {taxpayer.administrative_unit?.name && (
                              <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground/70">
                                <MapPin className="h-3 w-3 shrink-0" />

                                {taxpayer.administrative_unit.name}
                              </p>
                            )}
                          </div>

                          {/* =================================================
                           * SELECTED BADGE
                           * ================================================= */}

                          {selected && (
                            <Badge
                              variant="secondary"
                              className="ml-2 shrink-0 text-[10px]"
                            >
                              Selected
                            </Badge>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>

                {/* =================================================
                 * DROPDOWN FOOTER
                 * ================================================= */}

                {taxpayers.length > 0 && (
                  <div className="border-t bg-muted/20 p-2">
                    <Button
                      asChild
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full justify-center text-xs"
                    >
                      <Link
                        href="/revenue/taxpayers/create"
                        onClick={() => setOpen(false)}
                      >
                        <User className="mr-2 h-3.5 w-3.5" />
                        Register new taxpayer
                      </Link>
                    </Button>
                  </div>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* =================================================
         * SELECTED TAXPAYER
         * ================================================= */}

        {selectedTaxpayer && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            {/* =================================================
             * SELECTED STATUS
             * ================================================= */}

            <div className="mb-4 flex items-center justify-between gap-3">
              <Badge
                variant="secondary"
                className="gap-1"
              >
                <Check className="h-3 w-3" />
                Taxpayer selected
              </Badge>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={handleClear}
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            </div>

            {/* =================================================
             * TAXPAYER DETAILS
             * ================================================= */}

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Full Name */}

              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Full name
                </p>

                <p className="mt-1 truncate text-sm font-medium">
                  {selectedTaxpayer.full_name}
                </p>
              </div>

              {/* National ID */}

              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  National ID
                </p>

                <p className="mt-1 truncate text-sm font-medium">
                  {selectedTaxpayer.national_id}
                </p>
              </div>

              {/* Citizen UID */}

              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Citizen UID
                </p>

                <p className="mt-1 truncate text-sm font-medium">
                  {selectedTaxpayer.citizen_uid}
                </p>
              </div>

              {/* Phone */}

              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Phone
                </p>

                <p className="mt-1 truncate text-sm font-medium">
                  {selectedTaxpayer.phone || "—"}
                </p>
              </div>

              {/* Gender */}

              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Gender
                </p>

                <p className="mt-1 truncate text-sm font-medium">
                  {selectedTaxpayer.gender}
                </p>
              </div>

              {/* Administrative Unit */}

              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Administrative unit
                </p>

                <p className="mt-1 truncate text-sm font-medium">
                  {selectedTaxpayer.administrative_unit?.name ||
                    "—"}
                </p>
              </div>

              {/* Address */}

              <div className="min-w-0 sm:col-span-2">
                <p className="text-xs text-muted-foreground">
                  Address
                </p>

                <p className="mt-1 text-sm font-medium">
                  {selectedTaxpayer.administrative_unit
                    ?.full_address ||
                    selectedTaxpayer.address ||
                    "—"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}