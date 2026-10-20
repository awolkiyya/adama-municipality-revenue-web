"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Period, PERIODS } from "@/types/dashboard";
import { EthiopianDatePicker } from "../input/EthiopianDatePicker";

export type PeriodSelection =
  | {
      type: "preset";
      period: Period;
    }
  | {
      type: "custom";
      from: string;
      to: string;
    };

type PeriodSwitchProps = {
  value: PeriodSelection;
  onChange: (selection: PeriodSelection) => void;
};

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function fromDateKey(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

function getDefaultDateRange() {
  const to = new Date();
  const from = new Date(to);

  from.setDate(from.getDate() - 29);

  return {
    from: toDateKey(from),
    to: toDateKey(to),
  };
}

export function PeriodSwitch({
  value,
  onChange,
}: PeriodSwitchProps) {
  const [customOpen, setCustomOpen] = useState(false);

  const [draftRange, setDraftRange] = useState(() =>
    value.type === "custom"
      ? { from: value.from, to: value.to }
      : getDefaultDateRange(),
  );

  useEffect(() => {
    if (value.type === "custom") {
      setDraftRange({
        from: value.from,
        to: value.to,
      });
    }
  }, [value]);

  const todayKey = toDateKey(new Date());

  const fromDate = fromDateKey(draftRange.from);
  const toDate = fromDateKey(draftRange.to);

  const invalidRange =
    !fromDate ||
    !toDate ||
    draftRange.from > draftRange.to ||
    draftRange.to > todayKey;

  function selectPreset(period: Period) {
    setCustomOpen(false);

    onChange({
      type: "preset",
      period,
    });
  }

  function openCustomRange() {
    setDraftRange(
      value.type === "custom"
        ? { from: value.from, to: value.to }
        : getDefaultDateRange(),
    );

    setCustomOpen(true);
  }

  function applyCustomRange() {
    if (invalidRange) {
      return;
    }

    onChange({
      type: "custom",
      from: draftRange.from,
      to: draftRange.to,
    });

    setCustomOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-background p-1">
      {PERIODS.map((period) => {
        const selected =
          value.type === "preset" &&
          value.period === period.key;

        return (
          <Button
            key={period.key}
            type="button"
            size="sm"
            variant={selected ? "secondary" : "ghost"}
            className="h-8 px-3"
            aria-pressed={selected}
            onClick={() => selectPreset(period.key)}
          >
            {period.label}
          </Button>
        );
      })}

      <Popover
        open={customOpen}
        onOpenChange={(open) => {
          if (open) {
            openCustomRange();
          } else {
            setCustomOpen(false);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant={
              value.type === "custom" ? "secondary" : "ghost"
            }
            className="h-8 gap-2 px-3"
            aria-label="Choose a custom reporting date range"
          >
            <CalendarDays className="size-4" />
            {value.type === "custom"
              ? "Custom range"
              : "Custom"}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={8}
          collisionPadding={8}
          className="w-[calc(100vw-2rem)] max-w-sm p-4"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">
              Custom date range
            </h3>

            <p className="text-xs text-muted-foreground">
              Select dates using the Ethiopian calendar.
            </p>
          </div>

          <div className="mt-4 grid gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                From date
              </label>

              <EthiopianDatePicker
                value={fromDate}
                onChange={(date) =>
                  setDraftRange((current) => ({
                    ...current,
                    from: toDateKey(date),
                  }))
                }
                placeholder="Select start date"
                maxYear={new Date().getFullYear()}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                To date
              </label>

              <EthiopianDatePicker
                value={toDate}
                onChange={(date) =>
                  setDraftRange((current) => ({
                    ...current,
                    to: toDateKey(date),
                  }))
                }
                placeholder="Select end date"
                maxYear={new Date().getFullYear()}
              />
            </div>
          </div>

          {invalidRange && (
            <p
              className="mt-3 text-xs text-destructive"
              role="alert"
            >
              Select a valid date range. The end date must be on or
              after the start date, and dates cannot be in the future.
            </p>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCustomOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={invalidRange}
              onClick={applyCustomRange}
            >
              Apply range
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}