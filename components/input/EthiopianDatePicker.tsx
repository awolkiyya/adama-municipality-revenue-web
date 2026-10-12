"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  ChevronDownIcon,
  CalendarDays,
  Clock3,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Input } from "@/components/ui/input";

import { cn, formatEthiopianDate } from "@/lib/utils";

import {
  ETH_MONTHS,
  gregorianToEth,
} from "@/utils/ethiopianCalendar";

import { generateEthCalendar } from "@/utils/generateEthCalendar";

// =====================================================
// TYPES
// =====================================================

interface Props {
  value?: Date;
  onChange?: (date: Date) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  yearMode?: "FULL" | "LIMITED";
  minYear?: number;
  maxYear?: number;
  showTime?: boolean;
  timeFormat?: "12h" | "24h";
}

// =====================================================
// COMPONENT
// =====================================================

export function EthiopianDatePicker({
  value,
  onChange,
  error,
  placeholder = "ቀን ይምረጡ",
  disabled = false,
  searchable = false,
  yearMode = "FULL",
  minYear = 1900,
  maxYear = new Date().getFullYear(),
  showTime = false,
  timeFormat = "24h",
}: Props) {
  // ===================================================
  // CURRENT DATE
  // ===================================================

  const today = new Date();
  const ethToday = gregorianToEth(today);

  const currentYear = ethToday.year;
  const previousYear = currentYear - 1;
  const isLimited = yearMode === "LIMITED";

  // ===================================================
  // STATE
  // ===================================================

  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(ethToday.month);
  const [selected, setSelected] = useState<Date | undefined>(value);
  const [search, setSearch] = useState("");

  const [selectedHour, setSelectedHour] = useState(
    String(value?.getHours() ?? 0).padStart(2, "0"),
  );

  const [selectedMinute, setSelectedMinute] = useState(
    String(value?.getMinutes() ?? 0).padStart(2, "0"),
  );

  // ===================================================
  // SYNC EXTERNAL VALUE
  // ===================================================

  useEffect(() => {
    setSelected(value);

    if (!value) {
      return;
    }

    const eth = gregorianToEth(value);

    setYear(eth.year);
    setMonth(eth.month);

    setSelectedHour(
      String(value.getHours()).padStart(2, "0"),
    );

    setSelectedMinute(
      String(value.getMinutes()).padStart(2, "0"),
    );
  }, [value]);

  // ===================================================
  // YEAR RULES
  // ===================================================

  const isYearAllowed = (targetYear: number) => {
    if (isLimited) {
      return (
        targetYear === currentYear ||
        targetYear === previousYear
      );
    }

    return targetYear >= minYear && targetYear <= maxYear;
  };

  // ===================================================
  // MONTH RULES
  // ===================================================

  const isMonthAllowed = (
    targetYear: number,
    targetMonth: number,
  ) => {
    if (!isYearAllowed(targetYear)) {
      return false;
    }

    if (!isLimited) {
      return targetMonth >= 1 && targetMonth <= 13;
    }

    if (targetYear === currentYear) {
      return targetMonth >= 1 && targetMonth <= 10;
    }

    if (targetYear === previousYear) {
      return targetMonth >= 11 && targetMonth <= 13;
    }

    return false;
  };

  // ===================================================
  // DATE HELPERS
  // ===================================================

  const isToday = (date: Date) =>
    date.toDateString() === today.toDateString();

  const isSameDay = (a?: Date, b?: Date) =>
    Boolean(
      a &&
        b &&
        a.toDateString() === b.toDateString(),
    );

  // ===================================================
  // NAVIGATION
  // ===================================================

  const nextMonth = () => {
    let nextMonthValue = month + 1;
    let nextYear = year;

    if (nextMonthValue > 13) {
      nextMonthValue = 1;
      nextYear += 1;
    }

    if (!isMonthAllowed(nextYear, nextMonthValue)) {
      return;
    }

    setYear(nextYear);
    setMonth(nextMonthValue);
  };

  const prevMonth = () => {
    let previousMonth = month - 1;
    let previousYearValue = year;

    if (previousMonth < 1) {
      previousMonth = 13;
      previousYearValue -= 1;
    }

    if (!isMonthAllowed(previousYearValue, previousMonth)) {
      return;
    }

    setYear(previousYearValue);
    setMonth(previousMonth);
  };

  // ===================================================
  // CALENDAR DATA
  // ===================================================

  const days = useMemo(
    () => generateEthCalendar(year, month),
    [year, month],
  );

  // ===================================================
  // SEARCH
  // ===================================================

  const filteredDays = useMemo(() => {
    if (!searchable || !search.trim()) {
      return days;
    }

    const lower = search.toLowerCase().trim();

    return days.filter((day) => {
      if (!day) {
        return false;
      }

      return (
        day.day.toString().includes(lower) ||
        ETH_MONTHS[day.month - 1]
          .toLowerCase()
          .includes(lower) ||
        day.year.toString().includes(lower)
      );
    });
  }, [days, search, searchable]);

  // ===================================================
  // SELECT DATE
  // ===================================================

  const handleSelect = (date: Date) => {
    const eth = gregorianToEth(date);

    if (!isMonthAllowed(eth.year, eth.month)) {
      return;
    }

    const nextDate = new Date(date);

    if (showTime) {
      nextDate.setHours(
        Number(selectedHour),
        Number(selectedMinute),
        0,
        0,
      );
    } else if (value) {
      // Preserve the existing time when changing the date.
      nextDate.setHours(
        value.getHours(),
        value.getMinutes(),
        value.getSeconds(),
        value.getMilliseconds(),
      );
    }

    setSelected(nextDate);
    onChange?.(nextDate);
    setOpen(false);
  };

  // ===================================================
  // SELECT TIME
  // ===================================================

  const handleTimeChange = (
    hour: string,
    minute: string,
  ) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);

    if (!selected) {
      return;
    }

    const nextDate = new Date(selected);

    nextDate.setHours(
      Number(hour),
      Number(minute),
      0,
      0,
    );

    setSelected(nextDate);
    onChange?.(nextDate);
  };

  // ===================================================
  // YEAR OPTIONS
  // ===================================================

  const yearOptions = useMemo(() => {
    if (isLimited) {
      return [previousYear, currentYear];
    }

    const startYear = Math.min(minYear, maxYear);
    const endYear = Math.max(minYear, maxYear);

    return Array.from(
      { length: endYear - startYear + 1 },
      (_, index) => startYear + index,
    );
  }, [
    isLimited,
    previousYear,
    currentYear,
    minYear,
    maxYear,
  ]);

  // ===================================================
  // TIME OPTIONS
  // ===================================================

  const hourOptions = useMemo(
    () =>
      Array.from({ length: 24 }, (_, hour) =>
        String(hour).padStart(2, "0"),
      ),
    [],
  );

  const minuteOptions = useMemo(
    () =>
      Array.from({ length: 60 }, (_, minute) =>
        String(minute).padStart(2, "0"),
      ),
    [],
  );

  // ===================================================
  // FORMAT HOUR
  // ===================================================

  const formatHourLabel = (hour: string) => {
    if (timeFormat === "24h") {
      return hour;
    }

    const numericHour = Number(hour);
    const displayHour = numericHour % 12 || 12;
    const period = numericHour < 12 ? "AM" : "PM";

    return `${displayHour} ${period}`;
  };

  // ===================================================
  // DISPLAY VALUE
  // ===================================================

  const displayValue = useMemo(() => {
    if (!selected) {
      return undefined;
    }

    const dateLabel = formatEthiopianDate(
      selected.toDateString(),
    );

    if (!showTime) {
      return dateLabel;
    }

    const hours = selected.getHours();
    const minutes = String(selected.getMinutes()).padStart(
      2,
      "0",
    );

    if (timeFormat === "12h") {
      const displayHour = hours % 12 || 12;
      const period = hours < 12 ? "AM" : "PM";

      return `${dateLabel} · ${displayHour}:${minutes} ${period}`;
    }

    return `${dateLabel} · ${String(hours).padStart(
      2,
      "0",
    )}:${minutes}`;
  }, [selected, showTime, timeFormat]);

  // ===================================================
  // RESET SEARCH WHEN CLOSED
  // ===================================================

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setSearch("");
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="w-full min-w-0 space-y-1">
      <Popover open={open} onOpenChange={handleOpenChange}>
        {/* =================================================
            TRIGGER
            ================================================= */}

        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={cn(
              "h-10 w-full min-w-0 justify-between rounded-sm border px-3 text-left sm:px-4",
              error && "border-destructive",
            )}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />

              <span
                className={cn(
                  "min-w-0 truncate text-sm",
                  !selected && "text-muted-foreground",
                )}
              >
                {displayValue ?? placeholder}
              </span>
            </span>

            <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>

        {/* =================================================
            RESPONSIVE, SCROLLABLE POPOVER
            ================================================= */}

        <PopoverContent
          align="center"
          side="bottom"
          sideOffset={6}
          avoidCollisions
          collisionPadding={8}
          className={cn(
            "z-50 flex w-[calc(100vw-1rem)] max-w-[340px] min-w-0",
            "flex-col overflow-hidden rounded-sm border bg-popover p-0 shadow-xl",
            "max-h-[min(80dvh,620px)]",
          )}
        >
          {/* =================================================
              FIXED SEARCH AND NAVIGATION
              ================================================= */}

          <div className="shrink-0 bg-popover p-3 sm:p-4">
            {searchable && (
              <Input
                placeholder="Search..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className="mb-3 h-9 w-full"
              />
            )}

            <div className="flex min-w-0 items-center justify-between gap-1">
              {/* PREVIOUS MONTH */}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={prevMonth}
                disabled={
                  !isMonthAllowed(
                    month === 1 ? year - 1 : year,
                    month === 1 ? 13 : month - 1,
                  )
                }
                className="h-9 w-9 shrink-0"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* MONTH / YEAR */}

              <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
                <select
                  value={month}
                  onChange={(event) =>
                    setMonth(Number(event.target.value))
                  }
                  className="h-9 min-w-0 max-w-[130px] flex-1 truncate rounded-sm border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring sm:text-sm"
                  aria-label="Ethiopian month"
                >
                  {ETH_MONTHS.map((monthName, index) => (
                    <option
                      key={index}
                      value={index + 1}
                      disabled={
                        !isMonthAllowed(year, index + 1)
                      }
                    >
                      {monthName}
                    </option>
                  ))}
                </select>

                <select
                  value={year}
                  onChange={(event) => {
                    const nextYear = Number(
                      event.target.value,
                    );

                    if (!isYearAllowed(nextYear)) {
                      return;
                    }

                    setYear(nextYear);
                  }}
                  className="h-9 min-w-0 max-w-[100px] flex-1 rounded-sm border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring sm:text-sm"
                  aria-label="Ethiopian year"
                >
                  {yearOptions.map((yearOption) => (
                    <option
                      key={yearOption}
                      value={yearOption}
                    >
                      {yearOption} ዓ.ም
                    </option>
                  ))}
                </select>
              </div>

              {/* NEXT MONTH */}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={nextMonth}
                disabled={
                  !isMonthAllowed(
                    month === 13 ? year + 1 : year,
                    month === 13 ? 1 : month + 1,
                  )
                }
                className="h-9 w-9 shrink-0"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* =================================================
              SCROLLABLE CALENDAR AND TIME
              ================================================= */}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 sm:px-4 sm:pb-4">
            {/* DAYS OF MONTH */}

            <div className="grid w-full grid-cols-7 gap-1">
              {filteredDays.map((day, index) =>
                day ? (
                  <button
                    key={`${day.year}-${day.month}-${day.day}-${index}`}
                    type="button"
                    onClick={() =>
                      handleSelect(day.gregorian)
                    }
                    disabled={
                      !isMonthAllowed(day.year, day.month)
                    }
                    aria-label={`${day.day} ${ETH_MONTHS[day.month - 1]} ${day.year}`}
                    aria-pressed={isSameDay(
                      selected,
                      day.gregorian,
                    )}
                    className={cn(
                      "aspect-square w-full min-w-0 rounded-md text-sm",
                      "transition-colors hover:bg-accent",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "active:scale-95",
                      isSameDay(
                        selected,
                        day.gregorian,
                      ) &&
                        "bg-primary text-primary-foreground hover:bg-primary",
                      isToday(day.gregorian) &&
                        !isSameDay(
                          selected,
                          day.gregorian,
                        ) &&
                        "border border-primary",
                      !isMonthAllowed(
                        day.year,
                        day.month,
                      ) &&
                        "pointer-events-none opacity-30",
                    )}
                  >
                    {day.day}
                  </button>
                ) : (
                  <div
                    key={`empty-${year}-${month}-${index}`}
                    className="aspect-square w-full"
                    aria-hidden="true"
                  />
                ),
              )}
            </div>

            {/* TIME SELECTION */}

            {showTime && (
              <div className="mt-4 border-t pt-4">
                <div className="mb-3 flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-muted-foreground" />

                  <span className="text-sm font-medium">
                    Select time
                  </span>
                </div>

                {!selected && (
                  <p className="mb-3 text-xs text-muted-foreground">
                    Select a date first, then choose the
                    time.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {/* HOUR */}

                  <div className="min-w-0 space-y-1">
                    <label
                      htmlFor="ethiopian-picker-hour"
                      className="text-xs text-muted-foreground"
                    >
                      Hour
                    </label>

                    <select
                      id="ethiopian-picker-hour"
                      value={selectedHour}
                      onChange={(event) =>
                        handleTimeChange(
                          event.target.value,
                          selectedMinute,
                        )
                      }
                      disabled={disabled || !selected}
                      className="h-10 w-full rounded-sm border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {hourOptions.map((hour) => (
                        <option key={hour} value={hour}>
                          {formatHourLabel(hour)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* MINUTE */}

                  <div className="min-w-0 space-y-1">
                    <label
                      htmlFor="ethiopian-picker-minute"
                      className="text-xs text-muted-foreground"
                    >
                      Minute
                    </label>

                    <select
                      id="ethiopian-picker-minute"
                      value={selectedMinute}
                      onChange={(event) =>
                        handleTimeChange(
                          selectedHour,
                          event.target.value,
                        )
                      }
                      disabled={disabled || !selected}
                      className="h-10 w-full rounded-sm border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {minuteOptions.map((minute) => (
                        <option
                          key={minute}
                          value={minute}
                        >
                          {minute}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selected && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Selected time:{" "}
                    {timeFormat === "12h"
                      ? `${Number(selectedHour) % 12 || 12}:${selectedMinute} ${
                          Number(selectedHour) < 12
                            ? "AM"
                            : "PM"
                        }`
                      : `${selectedHour}:${selectedMinute}`}
                  </p>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

