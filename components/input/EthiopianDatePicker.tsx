"use client";

/**
 * EthiopianDatePicker — portable version
 *
 * Drop this single file into any shadcn/ui + Tailwind project.
 * External requirements: react, lucide-react, and the shadcn
 * `button`, `popover`, `input` components plus `cn` from "@/lib/utils".
 *
 * Everything else (calendar math, formatting, labels) is built in,
 * and every app-specific piece can be replaced through props.
 */

import {
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";

import {
  CalendarDays,
  ChevronDownIcon,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// =====================================================
// CALENDAR ADAPTER (swap this to use your own utils)
// =====================================================

export interface EthDate {
  year: number;
  month: number; // 1..13
  day: number; // 1..30 (or 1..5/6 in Pagume)
}

export interface EthCalendarDay extends EthDate {
  gregorian: Date;
}

export interface CalendarAdapter {
  monthNames: readonly string[];
  toEthiopian: (date: Date) => EthDate;
  /** Returns the grid for a month: `null` entries are leading blanks. */
  generateMonth: (
    year: number,
    month: number,
  ) => (EthCalendarDay | null)[];
  formatDate: (date: Date) => string;
}

export const ETH_MONTH_NAMES = [
  "መስከረም",
  "ጥቅምት",
  "ኅዳር",
  "ታኅሣሥ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዝያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜን",
] as const;

const JDN_EPOCH_ETH = 1723856;
const JDN_UNIX_EPOCH = 2440588;
const MS_PER_DAY = 86_400_000;

const gregorianToJdn = (d: Date) =>
  Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_PER_DAY +
  JDN_UNIX_EPOCH;

const jdnToGregorian = (jdn: number) => {
  const u = new Date((jdn - JDN_UNIX_EPOCH) * MS_PER_DAY);
  return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate());
};

const ethToJdn = (y: number, m: number, d: number) =>
  JDN_EPOCH_ETH + 365 * (y - 1) + Math.floor(y / 4) + 30 * m + d - 31;

const daysInEthMonth = (year: number, month: number) =>
  month < 13 ? 30 : year % 4 === 3 ? 6 : 5;

export const defaultCalendar: CalendarAdapter = {
  monthNames: ETH_MONTH_NAMES,

  toEthiopian(date) {
    const jdn = gregorianToJdn(date);
    const r = (jdn - JDN_EPOCH_ETH) % 1461;
    const n = (r % 365) + 365 * Math.floor(r / 1460);

    return {
      year:
        4 * Math.floor((jdn - JDN_EPOCH_ETH) / 1461) +
        Math.floor(r / 365) -
        Math.floor(r / 1460),
      month: Math.floor(n / 30) + 1,
      day: (n % 30) + 1,
    };
  },

  generateMonth(year, month) {
    const first = jdnToGregorian(ethToJdn(year, month, 1));
    const blanks = first.getDay(); // Sunday-first grid
    const count = daysInEthMonth(year, month);

    return [
      ...Array.from({ length: blanks }, () => null),
      ...Array.from({ length: count }, (_, i) => ({
        year,
        month,
        day: i + 1,
        gregorian: jdnToGregorian(ethToJdn(year, month, i + 1)),
      })),
    ];
  },

  formatDate(date) {
    const e = defaultCalendar.toEthiopian(date);
    return `${e.day} ${ETH_MONTH_NAMES[e.month - 1]} ${e.year}`;
  },
};

// =====================================================
// LABELS (i18n / copy overrides)
// =====================================================

export interface PickerLabels {
  placeholder: string;
  search: string;
  time: string;
  hour: string;
  minute: string;
  now: string;
  done: string;
  timeHint: string;
  yearSuffix: string;
  previousMonth: string;
  nextMonth: string;
  chooseMonth: string;
  chooseYear: string;
}

export const defaultLabels: PickerLabels = {
  placeholder: "ቀን ይምረጡ",
  search: "Search...",
  time: "Time",
  hour: "Hour",
  minute: "Minute",
  now: "Now",
  done: "Done",
  timeHint: "This time is applied to the date you pick.",
  yearSuffix: "ዓ.ም",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  chooseMonth: "Choose month",
  chooseYear: "Choose year",
};

// =====================================================
// TYPES
// =====================================================

export interface TriggerContext {
  displayValue?: string;
  placeholder: string;
  open: boolean;
  disabled: boolean;
  invalid: boolean;
}

export interface EthiopianDatePickerProps {
  // value (controlled via `value`, uncontrolled via `defaultValue`)
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date) => void;

  // open state (controlled via `open`, uncontrolled via `defaultOpen`)
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  // behaviour
  disabled?: boolean;
  searchable?: boolean;
  yearMode?: "FULL" | "LIMITED";
  minYear?: number;
  maxYear?: number;
  showTime?: boolean;
  timeFormat?: "12h" | "24h";
  minuteStep?: number;

  // forms
  id?: string;
  name?: string;
  error?: string;

  // customisation
  placeholder?: string;
  labels?: Partial<PickerLabels>;
  calendar?: CalendarAdapter;
  formatValue?: (date: Date, ctx: { showTime: boolean }) => string;
  /** Any element that forwards its ref (Button, a div, an icon button…). */
  trigger?: ReactNode | ((ctx: TriggerContext) => ReactNode);
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

type PickerView = "days" | "months" | "years";

// =====================================================
// HELPERS
// =====================================================

const pad = (n: number) => String(n).padStart(2, "0");

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

function formatTime(
  hour24: number,
  minute: number,
  format: "12h" | "24h",
) {
  if (format === "12h") {
    return `${hour24 % 12 || 12}:${pad(minute)} ${
      hour24 < 12 ? "AM" : "PM"
    }`;
  }

  return `${pad(hour24)}:${pad(minute)}`;
}

// =====================================================
// TIME FIELD
// =====================================================

interface TimeFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  onCommit: (value: number) => void;
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
  const [text, setText] = useState(() => pad(value));
  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef(pad(value));

  const displayedText = isEditing ? text : pad(value);

  const updateText = (next: string) => {
    textRef.current = next;
    setText(next);
  };

  const commitText = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);

    if (raw === "" || !Number.isFinite(parsed)) {
      updateText(pad(value));
      return;
    }

    const next = clamp(parsed, min, max);

    onCommit(next);
    updateText(pad(next));
  };

  const finishEditing = () => {
    commitText(textRef.current);
    setIsEditing(false);
  };

  const stepBy = (direction: 1 | -1) => {
    const nextValue = value + direction * step;
    const next =
      nextValue > max ? min : nextValue < min ? max : nextValue;

    onCommit(next);
    updateText(pad(next));
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
          value={displayedText}
          maxLength={2}
          aria-label={label}
          onFocus={(event) => {
            setIsEditing(true);
            updateText(pad(value));
            event.currentTarget.select();
          }}
          onBlur={finishEditing}
          onChange={(event) => {
            const digits = event.target.value
              .replace(/\D/g, "")
              .slice(0, 2);

            updateText(digits);

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
              finishEditing();
              onFilled?.();
              event.currentTarget.blur();
            }
          }}
          className={cn(
            "h-10 w-full rounded-sm border bg-background pl-2 pr-7 text-center text-base tabular-nums",
            "outline-none focus:ring-2 focus:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />

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
  value: valueProp,
  defaultValue = null,
  onChange,

  open: openProp,
  defaultOpen = false,
  onOpenChange,

  disabled = false,
  searchable = false,
  yearMode = "FULL",
  minYear = 1900,
  maxYear,
  showTime = false,
  timeFormat = "24h",
  minuteStep = 1,

  id,
  name,
  error,

  placeholder,
  labels: labelsProp,
  calendar = defaultCalendar,
  formatValue,
  trigger,
  className,
  triggerClassName,
  contentClassName,
  align = "center",
  side = "bottom",
  sideOffset = 6,
}: EthiopianDatePickerProps) {
  const uid = useId();
  const labels = useMemo(
    () => ({ ...defaultLabels, ...labelsProp }),
    [labelsProp],
  );
  const monthNames = calendar.monthNames;
  const placeholderText = placeholder ?? labels.placeholder;

  // ===================================================
  // CURRENT DATE
  // ===================================================

  const today = useMemo(() => new Date(), []);
  const ethToday = useMemo(
    () => calendar.toEthiopian(today),
    [today, calendar],
  );

  const currentYear = ethToday.year;
  const previousYear = currentYear - 1;

  const resolvedMaxYear = maxYear ?? currentYear;
  const isLimited = yearMode === "LIMITED";
  const is12h = timeFormat === "12h";
  const step = Math.max(1, Math.floor(minuteStep));

  // ===================================================
  // CONTROLLED / UNCONTROLLED STATE
  // ===================================================

  const [innerValue, setInnerValue] = useState<Date | null>(
    defaultValue,
  );
  const isValueControlled = valueProp !== undefined;
  const selected = (isValueControlled ? valueProp : innerValue) ?? undefined;

  const emitChange = (date: Date) => {
    if (!isValueControlled) setInnerValue(date);
    onChange?.(date);
  };

  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const isOpenControlled = openProp !== undefined;
  const open = isOpenControlled ? openProp : innerOpen;

  const setOpen = (next: boolean) => {
    if (!isOpenControlled) setInnerOpen(next);
    onOpenChange?.(next);
  };

  // ===================================================
  // VIEW STATE
  // ===================================================

  const [view, setView] = useState<PickerView>("days");

  const [calendarYear, setCalendarYear] = useState(() =>
    selected ? calendar.toEthiopian(selected).year : currentYear,
  );

  const [calendarMonth, setCalendarMonth] = useState(() =>
    selected ? calendar.toEthiopian(selected).month : ethToday.month,
  );

  const [search, setSearch] = useState("");

  const [pendingTime, setPendingTime] = useState<{
    hour: number;
    minute: number;
  } | null>(null);

  const hour24 = pendingTime?.hour ?? selected?.getHours() ?? 0;
  const minute = pendingTime?.minute ?? selected?.getMinutes() ?? 0;

  const minuteInputRef = useRef<HTMLInputElement>(null);

  // ===================================================
  // YEAR / MONTH RULES
  // ===================================================

  const isYearAllowed = (targetYear: number) => {
    if (isLimited) {
      return targetYear === currentYear || targetYear === previousYear;
    }

    return targetYear >= minYear && targetYear <= resolvedMaxYear;
  };

  const isMonthAllowed = (targetYear: number, targetMonth: number) => {
    if (!isYearAllowed(targetYear)) return false;
    if (!isLimited) return targetMonth >= 1 && targetMonth <= 13;

    if (targetYear === currentYear) {
      return targetMonth >= 1 && targetMonth <= 10;
    }

    if (targetYear === previousYear) {
      return targetMonth >= 11 && targetMonth <= 13;
    }

    return false;
  };

  const clampMonth = (targetYear: number, targetMonth: number) => {
    if (isMonthAllowed(targetYear, targetMonth)) return targetMonth;

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

  const isToday = (date: Date) =>
    date.toDateString() === today.toDateString();

  const isSameDay = (a?: Date, b?: Date) =>
    Boolean(a && b && a.toDateString() === b.toDateString());

  // ===================================================
  // NAVIGATION
  // ===================================================

  const nextMonth = () => {
    let m = calendarMonth + 1;
    let y = calendarYear;

    if (m > 13) {
      m = 1;
      y += 1;
    }

    if (!isMonthAllowed(y, m)) return;

    setCalendarYear(y);
    setCalendarMonth(m);
  };

  const prevMonth = () => {
    let m = calendarMonth - 1;
    let y = calendarYear;

    if (m < 1) {
      m = 13;
      y -= 1;
    }

    if (!isMonthAllowed(y, m)) return;

    setCalendarYear(y);
    setCalendarMonth(m);
  };

  const canGoPrev = isMonthAllowed(
    calendarMonth === 1 ? calendarYear - 1 : calendarYear,
    calendarMonth === 1 ? 13 : calendarMonth - 1,
  );

  const canGoNext = isMonthAllowed(
    calendarMonth === 13 ? calendarYear + 1 : calendarYear,
    calendarMonth === 13 ? 1 : calendarMonth + 1,
  );

  // ===================================================
  // CALENDAR DATA + SEARCH
  // ===================================================

  const days = useMemo(
    () => calendar.generateMonth(calendarYear, calendarMonth),
    [calendar, calendarYear, calendarMonth],
  );

  const filteredDays = useMemo(() => {
    if (!searchable || !search.trim()) return days;

    const lower = search.toLowerCase().trim();

    return days.filter((day) => {
      if (!day) return false;

      return (
        day.day.toString().includes(lower) ||
        monthNames[day.month - 1].toLowerCase().includes(lower) ||
        day.year.toString().includes(lower)
      );
    });
  }, [days, search, searchable, monthNames]);

  // ===================================================
  // SELECT DATE
  // ===================================================

  const handleSelect = (date: Date) => {
    const eth = calendar.toEthiopian(date);

    if (!isMonthAllowed(eth.year, eth.month)) return;

    const nextDate = new Date(date);

    if (showTime) {
      nextDate.setHours(hour24, minute, 0, 0);
    } else if (selected) {
      nextDate.setHours(
        selected.getHours(),
        selected.getMinutes(),
        selected.getSeconds(),
        selected.getMilliseconds(),
      );
    }

    emitChange(nextDate);

    if (!showTime) setOpen(false);
  };

  // ===================================================
  // MONTH / YEAR SELECTION
  // ===================================================

  const handlePickMonth = (targetMonth: number) => {
    if (!isMonthAllowed(calendarYear, targetMonth)) return;

    setCalendarMonth(targetMonth);
    setView("days");
  };

  const handlePickYear = (targetYear: number) => {
    if (!isYearAllowed(targetYear)) return;

    setCalendarYear(targetYear);
    setCalendarMonth((current) => clampMonth(targetYear, current));
    setView("months");
  };

  // ===================================================
  // TIME
  // ===================================================

  const applyTime = (nextHour: number, nextMinute: number) => {
    setPendingTime({ hour: nextHour, minute: nextMinute });

    if (!selected) return;

    const nextDate = new Date(selected);
    nextDate.setHours(nextHour, nextMinute, 0, 0);

    emitChange(nextDate);
  };

  const isPM = hour24 >= 12;
  const displayHour = is12h ? hour24 % 12 || 12 : hour24;

  const commitHour = (display: number) => {
    const next = is12h ? (display % 12) + (isPM ? 12 : 0) : display;
    applyTime(next, minute);
  };

  const setPeriod = (pm: boolean) => {
    if (pm === isPM) return;
    applyTime((hour24 % 12) + (pm ? 12 : 0), minute);
  };

  const timePresets = useMemo(() => {
    const now = new Date();
    const nowMinute = Math.floor(now.getMinutes() / step) * step;

    return [
      {
        key: "now",
        label: labels.now,
        h: now.getHours(),
        m: Math.min(59, nowMinute),
      },
      { key: "morning", label: formatTime(9, 0, timeFormat), h: 9, m: 0 },
      { key: "noon", label: formatTime(12, 0, timeFormat), h: 12, m: 0 },
      { key: "evening", label: formatTime(17, 0, timeFormat), h: 17, m: 0 },
    ];
  }, [step, timeFormat, labels.now]);

  // ===================================================
  // YEAR OPTIONS
  // ===================================================

  const yearOptions = useMemo(() => {
    if (isLimited) return [currentYear, previousYear];

    const startYear = Math.min(minYear, resolvedMaxYear);
    const endYear = Math.max(minYear, resolvedMaxYear);

    return Array.from(
      { length: endYear - startYear + 1 },
      (_, index) => endYear - index,
    );
  }, [isLimited, previousYear, currentYear, minYear, resolvedMaxYear]);

  // ===================================================
  // DISPLAY VALUE
  // ===================================================

  const displayValue = useMemo(() => {
    if (!selected) return undefined;

    if (formatValue) return formatValue(selected, { showTime });

    const dateLabel = calendar.formatDate(selected);

    if (!showTime) return dateLabel;

    return `${dateLabel} · ${formatTime(
      selected.getHours(),
      selected.getMinutes(),
      timeFormat,
    )}`;
  }, [selected, showTime, timeFormat, calendar, formatValue]);

  // ===================================================
  // OPEN / CLOSE / KEYBOARD
  // ===================================================

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      const eth = calendar.toEthiopian(selected ?? today);

      setCalendarYear(eth.year);
      setCalendarMonth(eth.month);
      setPendingTime(null);
    } else {
      setSearch("");
      setView("days");
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && view !== "days") {
      event.preventDefault();
      event.stopPropagation();
      setView("days");
    }
  };

  const toggleView = (target: Exclude<PickerView, "days">) => {
    setView((current) => (current === target ? "days" : target));
  };

  // ===================================================
  // TRIGGER
  // ===================================================

  const triggerCtx: TriggerContext = {
    displayValue,
    placeholder: placeholderText,
    open,
    disabled,
    invalid: Boolean(error),
  };

  const defaultTrigger = (
    <Button
      id={id}
      type="button"
      variant="outline"
      disabled={disabled}
      aria-invalid={Boolean(error)}
      className={cn(
        "h-10 w-full min-w-0 justify-between rounded-sm border px-3 text-left sm:px-4",
        error && "border-destructive",
        triggerClassName,
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
          {displayValue ?? placeholderText}
        </span>
      </span>

      <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-60" />
    </Button>
  );

  const triggerNode =
    typeof trigger === "function"
      ? trigger(triggerCtx)
      : (trigger ?? defaultTrigger);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className={cn("w-full min-w-0 space-y-1", className)}>
      {name && (
        <input
          type="hidden"
          name={name}
          value={selected ? selected.toISOString() : ""}
        />
      )}

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild disabled={disabled}>
          {triggerNode as React.ReactElement}
        </PopoverTrigger>

        <PopoverContent
          align={align}
          side={side}
          sideOffset={sideOffset}
          onKeyDown={handleKeyDown}
          collisionPadding={8}
          avoidCollisions
          // Dialog/Sheet lock scrolling outside their own content.
          // Stopping propagation keeps wheel/touch scrolling working here.
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
          className={cn(
            "z-[100] flex w-[calc(100vw-1rem)] max-w-[340px] min-w-0",
            "flex-col overflow-hidden rounded-sm border bg-popover p-0 shadow-xl",
            "max-h-[min(var(--radix-popover-content-available-height,80dvh),80dvh,640px)]",
            contentClassName,
          )}
        >
          {/* HEADER */}

          <div className="shrink-0 bg-popover p-3 sm:p-4">
            {searchable && view === "days" && (
              <Input
                placeholder={labels.search}
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
                aria-label={labels.previousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleView("months")}
                  aria-expanded={view === "months"}
                  aria-label={`${labels.chooseMonth}, ${monthNames[calendarMonth - 1]}`}
                  className={cn(
                    "inline-flex h-9 min-w-0 items-center gap-1 rounded-sm px-2 text-sm font-medium",
                    "transition-colors hover:bg-accent",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    view === "months" && "bg-accent",
                  )}
                >
                  <span className="truncate">
                    {monthNames[calendarMonth - 1]}
                  </span>

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
                  aria-label={`${labels.chooseYear}, ${calendarYear}`}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1 rounded-sm px-2 text-sm font-medium",
                    "transition-colors hover:bg-accent",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    view === "years" && "bg-accent",
                  )}
                >
                  <span className="tabular-nums">
                    {calendarYear} {labels.yearSuffix}
                  </span>

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
                aria-label={labels.nextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* BODY */}

          <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-3 pb-3 sm:px-4 sm:pb-4">
            {view === "months" && (
              <div
                className="grid grid-cols-3 gap-1.5"
                role="listbox"
                aria-label={labels.chooseMonth}
              >
                {monthNames.map((monthName, index) => {
                  const monthNumber = index + 1;
                  const allowed = isMonthAllowed(
                    calendarYear,
                    monthNumber,
                  );
                  const active = monthNumber === calendarMonth;

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
                          calendarYear === currentYear &&
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

            {view === "years" && (
              <div
                className="relative max-h-[216px] overflow-y-auto overscroll-contain rounded-sm"
                role="listbox"
                aria-label={labels.chooseYear}
              >
                <div className="grid grid-cols-4 gap-1.5 pr-1">
                  {yearOptions.map((yearOption) => {
                    const active = yearOption === calendarYear;

                    return (
                      <button
                        key={yearOption}
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

            {view === "days" && (
              <>
                <div className="grid w-full grid-cols-7 gap-1">
                  {filteredDays.map((day, index) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${calendarYear}-${calendarMonth}-${index}`}
                          className="aspect-square w-full"
                          aria-hidden="true"
                        />
                      );
                    }

                    const allowed = isMonthAllowed(day.year, day.month);
                    const isSelected = isSameDay(selected, day.gregorian);

                    return (
                      <button
                        key={`${day.year}-${day.month}-${day.day}-${index}`}
                        type="button"
                        onClick={() => handleSelect(day.gregorian)}
                        disabled={!allowed}
                        aria-label={`${day.day} ${monthNames[day.month - 1]} ${day.year}`}
                        aria-pressed={isSelected}
                        className={cn(
                          "aspect-square w-full min-w-0 rounded-md text-sm",
                          "transition-colors hover:bg-accent",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          "active:scale-95",
                          isSelected &&
                            "bg-primary text-primary-foreground hover:bg-primary",
                          isToday(day.gregorian) &&
                            !isSelected &&
                            "border border-primary",
                          !allowed && "pointer-events-none opacity-30",
                        )}
                      >
                        {day.day}
                      </button>
                    );
                  })}
                </div>

                {/* TIME */}

                {showTime && (
                  <div
                    className="mt-4 border-t pt-4"
                    role="group"
                    aria-label={labels.time}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {labels.time}
                        </span>
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
                        id={`${uid}-hour`}
                        label={labels.hour}
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
                        id={`${uid}-minute`}
                        label={labels.minute}
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
                        {labels.timeHint}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* FOOTER */}

          {showTime && view === "days" && (
            <div className="shrink-0 border-t bg-popover p-3 sm:px-4">
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={() => handleOpenChange(false)}
              >
                {labels.done}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default EthiopianDatePicker;