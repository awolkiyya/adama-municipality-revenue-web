"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  ChevronDownIcon,
  ChevronUp,
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
  /** Step used by the minute arrows and presets. Typing accepts any minute. */
  minuteStep?: number;
}

/** Which panel the popover body is showing. */
type PickerView = "days" | "months" | "years";

// =====================================================
// SMALL HELPERS
// =====================================================

const pad = (n: number) => String(n).padStart(2, "0");

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

function formatTime(hour24: number, minute: number, format: "12h" | "24h") {
  if (format === "12h") {
    return `${hour24 % 12 || 12}:${pad(minute)} ${hour24 < 12 ? "AM" : "PM"}`;
  }

  return `${pad(hour24)}:${pad(minute)}`;
}

// =====================================================
// TIME FIELD
// Typed numeric input with arrow-key / button stepping.
// =====================================================

interface TimeFieldProps {
  id: string;
  label: string;
  /** Value as displayed (1-12 for 12h hours, 0-23 for 24h hours, 0-59 minutes). */
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  onCommit: (value: number) => void;
  /** Called once the field is complete so focus can move on. */
  onFilled?: () => void;
}

function TimeField({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  disabled,
  inputRef,
  onCommit,
  onFilled,
}: TimeFieldProps) {
  const [text, setText] = useState(pad(value));
  const [editing, setEditing] = useState(false);

  // Mirror the external value whenever the user is not typing.
  useEffect(() => {
    if (!editing) {
      setText(pad(value));
    }
  }, [value, editing]);

  const commitText = (raw: string) => {
    if (raw === "") {
      setText(pad(value));
      return;
    }

    const next = clamp(Number.parseInt(raw, 10), min, max);

    onCommit(next);
    setText(pad(next));
  };

  const stepBy = (direction: 1 | -1) => {
    let next = value + direction * step;

    // Wrap around so 23 -> 00 and 59 -> 00 feel natural.
    if (next > max) next = min;
    if (next < min) next = max;

    onCommit(next);
    setText(pad(next));
  };

  return (
    <div className="min-w-0 flex-1 space-y-1">
      <label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          value={text}
          maxLength={2}
          aria-label={label}
          onFocus={(event) => {
            setEditing(true);
            event.currentTarget.select();
          }}
          onBlur={() => {
            setEditing(false);
            commitText(text);
          }}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "").slice(0, 2);

            setText(digits);

            // Complete when two digits are typed, or when a single digit
            // can no longer grow into a valid value (e.g. "3" for hours).
            const complete =
              digits.length === 2 ||
              (digits.length === 1 && Number(digits) * 10 > max);

            if (complete) {
              commitText(digits);
              onFilled?.();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp") {
              event.preventDefault();
              stepBy(1);
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              stepBy(-1);
            } else if (event.key === "Enter") {
              event.preventDefault();
              commitText(text);
              onFilled?.();
            }
          }}
          className={cn(
            "h-10 w-full rounded-sm border bg-background pl-2 pr-7 text-center text-base tabular-nums",
            "outline-none focus:ring-2 focus:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />

        {/* Mouse / touch steppers. Keyboard users have the arrow keys. */}
        <div className="absolute inset-y-0 right-0 flex w-6 flex-col">
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => stepBy(1)}
            aria-label={`Increase ${label.toLowerCase()}`}
            className="flex flex-1 items-center justify-center rounded-tr-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => stepBy(-1)}
            aria-label={`Decrease ${label.toLowerCase()}`}
            className="flex flex-1 items-center justify-center rounded-br-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none"
          >
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
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
  minuteStep = 1,
}: Props) {
  // ===================================================
  // CURRENT DATE
  // ===================================================

  const today = useMemo(() => new Date(), []);
  const ethToday = useMemo(() => gregorianToEth(today), [today]);

  const currentYear = ethToday.year;
  const previousYear = currentYear - 1;
  const isLimited = yearMode === "LIMITED";
  const is12h = timeFormat === "12h";
  const step = Math.max(1, Math.floor(minuteStep));

  // ===================================================
  // STATE
  // ===================================================

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PickerView>("days");
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(ethToday.month);
  const [selected, setSelected] = useState<Date | undefined>(value);
  const [search, setSearch] = useState("");

  // Time is kept as 24h numbers; display conversion happens at the edges.
  const [hour24, setHour24] = useState(value?.getHours() ?? 0);
  const [minute, setMinute] = useState(value?.getMinutes() ?? 0);

  const yearListRef = useRef<HTMLDivElement>(null);
  const activeYearRef = useRef<HTMLButtonElement>(null);
  const minuteInputRef = useRef<HTMLInputElement>(null);

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
    setHour24(value.getHours());
    setMinute(value.getMinutes());
  }, [value]);

  // ===================================================
  // YEAR RULES
  // ===================================================

  const isYearAllowed = (targetYear: number) => {
    if (isLimited) {
      return targetYear === currentYear || targetYear === previousYear;
    }

    return targetYear >= minYear && targetYear <= maxYear;
  };

  // ===================================================
  // MONTH RULES
  // ===================================================

  const isMonthAllowed = (targetYear: number, targetMonth: number) => {
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

  /** Closest allowed month when the year changes (LIMITED mode). */
  const clampMonth = (targetYear: number, targetMonth: number) => {
    if (isMonthAllowed(targetYear, targetMonth)) {
      return targetMonth;
    }

    for (let offset = 1; offset <= 13; offset += 1) {
      const before = targetMonth - offset;
      const after = targetMonth + offset;

      if (before >= 1 && isMonthAllowed(targetYear, before)) {
        return before;
      }

      if (after <= 13 && isMonthAllowed(targetYear, after)) {
        return after;
      }
    }

    return targetMonth;
  };

  // ===================================================
  // DATE HELPERS
  // ===================================================

  const isToday = (date: Date) => date.toDateString() === today.toDateString();

  const isSameDay = (a?: Date, b?: Date) =>
    Boolean(a && b && a.toDateString() === b.toDateString());

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

  const canGoPrev = isMonthAllowed(
    month === 1 ? year - 1 : year,
    month === 1 ? 13 : month - 1,
  );

  const canGoNext = isMonthAllowed(
    month === 13 ? year + 1 : year,
    month === 13 ? 1 : month + 1,
  );

  // ===================================================
  // CALENDAR DATA
  // ===================================================

  const days = useMemo(() => generateEthCalendar(year, month), [year, month]);

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
        ETH_MONTHS[day.month - 1].toLowerCase().includes(lower) ||
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
      nextDate.setHours(hour24, minute, 0, 0);
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

    // With time enabled, keep the popover open so the time can be adjusted.
    // The Done button closes it.
    if (!showTime) {
      setOpen(false);
    }
  };

  // ===================================================
  // SELECT MONTH / YEAR FROM COMPACT PANELS
  // ===================================================

  const handlePickMonth = (targetMonth: number) => {
    if (!isMonthAllowed(year, targetMonth)) {
      return;
    }

    setMonth(targetMonth);
    setView("days");
  };

  const handlePickYear = (targetYear: number) => {
    if (!isYearAllowed(targetYear)) {
      return;
    }

    setYear(targetYear);
    setMonth((current) => clampMonth(targetYear, current));
    setView("months");
  };

  // ===================================================
  // TIME
  // ===================================================

  /** Single place where time changes are stored and pushed to the parent. */
  const applyTime = (nextHour: number, nextMinute: number) => {
    setHour24(nextHour);
    setMinute(nextMinute);

    if (!selected) {
      // No date yet: the time is remembered and applied when a date is picked.
      return;
    }

    const nextDate = new Date(selected);
    nextDate.setHours(nextHour, nextMinute, 0, 0);

    setSelected(nextDate);
    onChange?.(nextDate);
  };

  const isPM = hour24 >= 12;
  const displayHour = is12h ? hour24 % 12 || 12 : hour24;

  const commitHour = (display: number) => {
    const next = is12h ? (display % 12) + (isPM ? 12 : 0) : display;
    applyTime(next, minute);
  };

  const setPeriod = (pm: boolean) => {
    if (pm === isPM) {
      return;
    }

    applyTime((hour24 % 12) + (pm ? 12 : 0), minute);
  };

  /** Quick presets, plus "Now" rounded down to the minute step. */
  const timePresets = useMemo(() => {
    const now = new Date();
    const nowMinute = Math.floor(now.getMinutes() / step) * step;

    return [
      { key: "now", label: "Now", h: now.getHours(), m: nowMinute },
      { key: "morning", label: formatTime(9, 0, timeFormat), h: 9, m: 0 },
      { key: "noon", label: formatTime(12, 0, timeFormat), h: 12, m: 0 },
      { key: "evening", label: formatTime(17, 0, timeFormat), h: 17, m: 0 },
    ];
  }, [step, timeFormat]);

  // ===================================================
  // YEAR OPTIONS (newest first so recent years are reached quickly)
  // ===================================================

  const yearOptions = useMemo(() => {
    if (isLimited) {
      return [currentYear, previousYear];
    }

    const startYear = Math.min(minYear, maxYear);
    const endYear = Math.max(minYear, maxYear);

    return Array.from(
      { length: endYear - startYear + 1 },
      (_, index) => endYear - index,
    );
  }, [isLimited, previousYear, currentYear, minYear, maxYear]);

  // Center the active year when the year panel opens.
  useEffect(() => {
    if (view !== "years") {
      return;
    }

    const list = yearListRef.current;
    const active = activeYearRef.current;

    if (list && active) {
      list.scrollTop =
        active.offsetTop - list.clientHeight / 2 + active.clientHeight / 2;
    }
  }, [view]);

  // ===================================================
  // DISPLAY VALUE
  // ===================================================

  const displayValue = useMemo(() => {
    if (!selected) {
      return undefined;
    }

    const dateLabel = formatEthiopianDate(selected.toDateString());

    if (!showTime) {
      return dateLabel;
    }

    return `${dateLabel} · ${formatTime(
      selected.getHours(),
      selected.getMinutes(),
      timeFormat,
    )}`;
  }, [selected, showTime, timeFormat]);

  // ===================================================
  // OPEN / CLOSE / KEYBOARD
  // ===================================================

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setSearch("");
      setView("days");
    }
  };

  // Escape inside the month/year panels returns to the calendar first.
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" && view !== "days") {
      event.preventDefault();
      event.stopPropagation();
      setView("days");
    }
  };

  const toggleView = (target: Exclude<PickerView, "days">) =>
    setView((current) => (current === target ? "days" : target));

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
            POPOVER
            ================================================= */}

        <PopoverContent
          align="center"
          side="bottom"
          sideOffset={6}
          avoidCollisions
          collisionPadding={8}
          onKeyDown={handleKeyDown}
          className={cn(
            "z-50 flex w-[calc(100vw-1rem)] max-w-[340px] min-w-0",
            "flex-col overflow-hidden rounded-sm border bg-popover p-0 shadow-xl",
            "max-h-[min(80dvh,640px)]",
          )}
        >
          {/* =================================================
              FIXED SEARCH AND NAVIGATION
              ================================================= */}

          <div className="shrink-0 bg-popover p-3 sm:p-4">
            {searchable && view === "days" && (
              <Input
                placeholder="Search..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mb-3 h-9 w-full"
              />
            )}

            <div className="flex min-w-0 items-center justify-between gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={prevMonth}
                disabled={view !== "days" || !canGoPrev}
                className={cn(
                  "h-9 w-9 shrink-0",
                  view !== "days" && "invisible",
                )}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleView("months")}
                  aria-expanded={view === "months"}
                  aria-label={`Choose month, current ${ETH_MONTHS[month - 1]}`}
                  className={cn(
                    "inline-flex h-9 min-w-0 items-center gap-1 rounded-sm px-2 text-sm font-medium",
                    "transition-colors hover:bg-accent",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    view === "months" && "bg-accent",
                  )}
                >
                  <span className="truncate">{ETH_MONTHS[month - 1]}</span>
                  <ChevronDownIcon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 opacity-60 transition-transform",
                      view === "months" && "rotate-180",
                    )}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => toggleView("years")}
                  aria-expanded={view === "years"}
                  aria-label={`Choose year, current ${year}`}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1 rounded-sm px-2 text-sm font-medium",
                    "transition-colors hover:bg-accent",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    view === "years" && "bg-accent",
                  )}
                >
                  <span className="tabular-nums">{year} ዓ.ም</span>
                  <ChevronDownIcon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 opacity-60 transition-transform",
                      view === "years" && "rotate-180",
                    )}
                  />
                </button>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={nextMonth}
                disabled={view !== "days" || !canGoNext}
                className={cn(
                  "h-9 w-9 shrink-0",
                  view !== "days" && "invisible",
                )}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* =================================================
              SCROLLABLE BODY
              ================================================= */}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 sm:px-4 sm:pb-4">
            {/* ---------------- MONTH PANEL ---------------- */}

            {view === "months" && (
              <div
                className="grid grid-cols-3 gap-1.5"
                role="listbox"
                aria-label="Ethiopian month"
              >
                {ETH_MONTHS.map((monthName, index) => {
                  const monthNumber = index + 1;
                  const allowed = isMonthAllowed(year, monthNumber);
                  const active = monthNumber === month;

                  return (
                    <button
                      key={monthName}
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={!allowed}
                      onClick={() => handlePickMonth(monthNumber)}
                      className={cn(
                        "h-10 min-w-0 truncate rounded-md px-1 text-sm transition-colors",
                        "hover:bg-accent",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "disabled:pointer-events-none disabled:opacity-30",
                        active &&
                          "bg-primary text-primary-foreground hover:bg-primary",
                        !active &&
                          year === currentYear &&
                          monthNumber === ethToday.month &&
                          "border border-primary",
                      )}
                    >
                      {monthName}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ---------------- YEAR PANEL ---------------- */}

            {view === "years" && (
              <div
                ref={yearListRef}
                className="relative max-h-[216px] overflow-y-auto overscroll-contain rounded-sm"
                role="listbox"
                aria-label="Ethiopian year"
              >
                <div className="grid grid-cols-4 gap-1.5 pr-1">
                  {yearOptions.map((yearOption) => {
                    const active = yearOption === year;

                    return (
                      <button
                        key={yearOption}
                        ref={active ? activeYearRef : undefined}
                        type="button"
                        role="option"
                        aria-selected={active}
                        disabled={!isYearAllowed(yearOption)}
                        onClick={() => handlePickYear(yearOption)}
                        className={cn(
                          "h-10 min-w-0 rounded-md text-sm tabular-nums transition-colors",
                          "hover:bg-accent",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          "disabled:pointer-events-none disabled:opacity-30",
                          active &&
                            "bg-primary text-primary-foreground hover:bg-primary",
                          !active &&
                            yearOption === currentYear &&
                            "border border-primary",
                        )}
                      >
                        {yearOption}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------------- DAYS PANEL ---------------- */}

            {view === "days" && (
              <>
                <div className="grid w-full grid-cols-7 gap-1">
                  {filteredDays.map((day, index) =>
                    day ? (
                      <button
                        key={`${day.year}-${day.month}-${day.day}-${index}`}
                        type="button"
                        onClick={() => handleSelect(day.gregorian)}
                        disabled={!isMonthAllowed(day.year, day.month)}
                        aria-label={`${day.day} ${ETH_MONTHS[day.month - 1]} ${day.year}`}
                        aria-pressed={isSameDay(selected, day.gregorian)}
                        className={cn(
                          "aspect-square w-full min-w-0 rounded-md text-sm",
                          "transition-colors hover:bg-accent",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          "active:scale-95",
                          isSameDay(selected, day.gregorian) &&
                            "bg-primary text-primary-foreground hover:bg-primary",
                          isToday(day.gregorian) &&
                            !isSameDay(selected, day.gregorian) &&
                            "border border-primary",
                          !isMonthAllowed(day.year, day.month) &&
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

                {/* =============================================
                    TIME
                    ============================================= */}

                {showTime && (
                  <div
                    className="mt-4 border-t pt-4"
                    role="group"
                    aria-label="Time"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Time</span>
                      </div>

                      <span
                        className="text-xs tabular-nums text-muted-foreground"
                        aria-live="polite"
                      >
                        {formatTime(hour24, minute, timeFormat)}
                      </span>
                    </div>

                    <div className="flex items-end gap-2">
                      <TimeField
                        id="ethiopian-picker-hour"
                        label="Hour"
                        value={displayHour}
                        min={is12h ? 1 : 0}
                        max={is12h ? 12 : 23}
                        disabled={disabled}
                        onCommit={commitHour}
                        onFilled={() => minuteInputRef.current?.focus()}
                      />

                      <span
                        className="pb-2 text-lg font-medium text-muted-foreground"
                        aria-hidden="true"
                      >
                        :
                      </span>

                      <TimeField
                        id="ethiopian-picker-minute"
                        label="Minute"
                        value={minute}
                        min={0}
                        max={59}
                        step={step}
                        disabled={disabled}
                        inputRef={minuteInputRef}
                        onCommit={(next) => applyTime(hour24, next)}
                      />

                      {is12h && (
                        <div
                          role="radiogroup"
                          aria-label="AM or PM"
                          className="flex h-10 shrink-0 overflow-hidden rounded-sm border"
                        >
                          {(["AM", "PM"] as const).map((period) => {
                            const active = (period === "PM") === isPM;

                            return (
                              <button
                                key={period}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                disabled={disabled}
                                onClick={() => setPeriod(period === "PM")}
                                className={cn(
                                  "w-10 text-xs font-medium transition-colors",
                                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                                  active
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-accent",
                                )}
                              >
                                {period}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Quick presets */}

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {timePresets.map((preset) => {
                        const active =
                          preset.key !== "now" &&
                          preset.h === hour24 &&
                          preset.m === minute;

                        return (
                          <button
                            key={preset.key}
                            type="button"
                            disabled={disabled}
                            onClick={() => applyTime(preset.h, preset.m)}
                            aria-pressed={active}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs transition-colors",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              active
                                ? "border-primary bg-primary/10 font-medium"
                                : "hover:bg-accent",
                            )}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    {!selected && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        This time is applied to the date you pick.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* =================================================
              FOOTER (only when time is enabled)
              ================================================= */}

          {showTime && view === "days" && (
            <div className="shrink-0 border-t bg-popover p-3 sm:px-4">
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={() => handleOpenChange(false)}
              >
                Done
              </Button>
            </div>
          )}
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