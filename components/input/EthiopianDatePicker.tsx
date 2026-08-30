"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  ChevronDownIcon,
  CalendarDays,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Input,
} from "@/components/ui/input";

import {
  cn,
} from "@/lib/utils";

import {
  ETH_MONTHS,
  gregorianToEth,
} from "@/utils/ethiopianCalendar";

import {
  generateEthCalendar,
} from "@/utils/generateEthCalendar";

import {
  formatEthiopianDate,
} from "@/lib/utils";


// =====================================================
// TYPES
// =====================================================

interface Props {

  value?:
    Date;

  onChange?:
    (
      date: Date,
    ) => void;

  error?:
    string;

  placeholder?:
    string;

  disabled?:
    boolean;

  searchable?:
    boolean;

  yearMode?:
    "FULL" |
    "LIMITED";

  minYear?:
    number;

  maxYear?:
    number;
}


// =====================================================
// COMPONENT
// =====================================================

export function EthiopianDatePicker({

  value,

  onChange,

  error,

  placeholder =
    "ቀን ይምረጡ",

  disabled =
    false,

  searchable =
    false,

  yearMode =
    "FULL",

  minYear =
    1900,

  maxYear =
    new Date().getFullYear(),

}: Props) {


  // ===================================================
  // CURRENT DATE
  // ===================================================

  const today =
    new Date();

  const ethToday =
    gregorianToEth(
      today,
    );

  const currentYear =
    ethToday.year;

  const previousYear =
    currentYear - 1;

  const isLimited =
    yearMode ===
    "LIMITED";


  // ===================================================
  // STATE
  // ===================================================

  const [
    open,
    setOpen,
  ] =
    useState(false);


  const [
    year,
    setYear,
  ] =
    useState(
      currentYear,
    );


  const [
    month,
    setMonth,
  ] =
    useState(
      ethToday.month,
    );


  const [
    selected,
    setSelected,
  ] =
    useState<
      Date |
      undefined
    >(
      value,
    );


  const [
    search,
    setSearch,
  ] =
    useState("");


  // ===================================================
  // SYNC VALUE
  // ===================================================

  useEffect(() => {

    setSelected(
      value,
    );

    if (value) {

      const eth =
        gregorianToEth(
          value,
        );

      setYear(
        eth.year,
      );

      setMonth(
        eth.month,
      );
    }

  }, [
    value,
  ]);


  // ===================================================
  // TODAY CHECK
  // ===================================================

  const isToday =
    (
      date: Date,
    ) =>
      date.toDateString() ===
      today.toDateString();


  // ===================================================
  // SAME DAY CHECK
  // ===================================================

  const isSameDay =
    (
      a?: Date,
      b?: Date,
    ) =>
      !!(
        a &&
        b &&
        a.toDateString() ===
          b.toDateString()
      );


  // ===================================================
  // YEAR RULE
  // ===================================================

  const isYearAllowed =
    (
      y: number,
    ) => {

      if (!isLimited) {
        return true;
      }

      return (
        y === currentYear ||
        y === previousYear
      );
    };


  // ===================================================
  // MONTH RULE
  // ===================================================

  const isMonthAllowed =
    (
      y: number,
      m: number,
    ) => {

      if (!isLimited) {
        return true;
      }

      if (
        y ===
        currentYear
      ) {

        return (
          m >= 1 &&
          m <= 10
        );
      }

      if (
        y ===
        previousYear
      ) {

        return (
          m >= 11 &&
          m <= 13
        );
      }

      return false;
    };


  // ===================================================
  // NAVIGATION
  // ===================================================

  const nextMonth =
    () => {

      let nextMonthValue =
        month + 1;

      let nextYear =
        year;


      if (
        nextMonthValue >
        13
      ) {

        nextMonthValue =
          1;

        nextYear++;
      }


      if (
        !isYearAllowed(
          nextYear,
        ) ||
        !isMonthAllowed(
          nextYear,
          nextMonthValue,
        )
      ) {

        return;
      }


      setYear(
        nextYear,
      );

      setMonth(
        nextMonthValue,
      );
    };


  const prevMonth =
    () => {

      let previousMonth =
        month - 1;

      let previousYearValue =
        year;


      if (
        previousMonth <
        1
      ) {

        previousMonth =
          13;

        previousYearValue--;
      }


      if (
        !isYearAllowed(
          previousYearValue,
        ) ||
        !isMonthAllowed(
          previousYearValue,
          previousMonth,
        )
      ) {

        return;
      }


      setYear(
        previousYearValue,
      );

      setMonth(
        previousMonth,
      );
    };


  // ===================================================
  // CALENDAR DATA
  // ===================================================

  const days =
    useMemo(
      () =>
        generateEthCalendar(
          year,
          month,
        ),
      [
        year,
        month,
      ],
    );


  // ===================================================
  // SEARCHED DAYS
  // ===================================================

  const filteredDays =
    useMemo(
      () => {

        if (
          !searchable ||
          !search.trim()
        ) {

          return days;
        }


        const lower =
          search
            .toLowerCase()
            .trim();


        return days.filter(
          (
            day,
          ) => {

            if (!day) {
              return false;
            }


            return (

              day.day
                .toString()
                .includes(
                  lower,
                )

              ||

              ETH_MONTHS[
                day.month - 1
              ]
                .toLowerCase()
                .includes(
                  lower,
                )

              ||

              day.year
                .toString()
                .includes(
                  lower,
                )

            );
          },
        );

      },
      [
        days,
        search,
        searchable,
      ],
    );


  // ===================================================
  // SELECT DATE
  // ===================================================

  const handleSelect =
    (
      date: Date,
    ) => {

      const eth =
        gregorianToEth(
          date,
        );


      if (
        !isMonthAllowed(
          eth.year,
          eth.month,
        )
      ) {

        return;
      }


      setSelected(
        date,
      );

      onChange?.(
        date,
      );

      setOpen(
        false,
      );
    };


  // ===================================================
  // YEAR OPTIONS
  // ===================================================

  const yearOptions =
    useMemo(
      () => {

        if (isLimited) {

          return [
            previousYear,
            currentYear,
          ];
        }


        return Array.from(
          {
            length:
              maxYear -
              minYear +
              1,
          },
          (
            _,
            index,
          ) =>
            minYear +
            index,
        );

      },
      [
        isLimited,
        previousYear,
        currentYear,
        minYear,
        maxYear,
      ],
    );


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div
      className="
        w-full
        min-w-0
        space-y-1
      "
    >

      <Popover
        open={
          open
        }
        onOpenChange={
          setOpen
        }
      >

        {/* =================================================
            TRIGGER
            ================================================= */}

        <PopoverTrigger
          asChild
        >

          <Button
            type="button"
            variant="outline"
            disabled={
              disabled
            }
            className={cn(
              `
                h-10
                w-full
                min-w-0
                justify-between
                rounded-sm
                border
                px-3
                text-left
                sm:px-4
              `,
              error &&
                "border-destructive",
            )}
          >

            <div
              className="
                flex
                min-w-0
                flex-1
                items-center
                gap-2
              "
            >

              <CalendarDays
                className="
                  h-4
                  w-4
                  shrink-0
                  text-muted-foreground
                "
              />


              <span
                className={cn(
                  `
                    min-w-0
                    truncate
                    text-sm
                  `,
                  !selected &&
                    "text-muted-foreground",
                )}
              >

                {selected
                  ? formatEthiopianDate(
                      selected.toDateString(),
                    )
                  : placeholder}

              </span>

            </div>


            <ChevronDownIcon
              className="
                ml-2
                h-4
                w-4
                shrink-0
                opacity-60
              "
            />

          </Button>

        </PopoverTrigger>


        {/* =================================================
            POPOVER
            ================================================= */}

        <PopoverContent
          align="center"
          sideOffset={6}
          className="
            w-[calc(100vw-1rem)]
            max-w-[340px]
            min-w-0
            rounded-sm
            border
            bg-popover
            p-3
            shadow-xl
            sm:p-4
          "
        >

          {/* =================================================
              SEARCH
              ================================================= */}

          {searchable && (

            <Input
              placeholder="Search..."
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target.value,
                )
              }
              className="
                mb-3
                h-9
                w-full
              "
            />

          )}


          {/* =================================================
              HEADER
              ================================================= */}

          <div
            className="
              mb-3
              flex
              min-w-0
              items-center
              justify-between
              gap-1
            "
          >

            {/* -----------------------------------------------
                PREVIOUS
                ----------------------------------------------- */}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={
                prevMonth
              }
              className="
                h-8
                w-8
                shrink-0
                sm:h-9
                sm:w-9
              "
              aria-label="Previous month"
            >

              <ChevronLeft
                className="
                  h-4
                  w-4
                "
              />

            </Button>


            {/* -----------------------------------------------
                MONTH / YEAR
                ----------------------------------------------- */}

            <div
              className="
                flex
                min-w-0
                flex-1
                items-center
                justify-center
                gap-1.5
                sm:gap-2
              "
            >

              {/* MONTH */}

              <select
                value={
                  month
                }
                onChange={(
                  event,
                ) =>
                  setMonth(
                    Number(
                      event.target.value,
                    ),
                  )
                }
                className="
                  h-8
                  min-w-0
                  max-w-[130px]
                  flex-1
                  truncate
                  rounded-sm
                  border
                  bg-background
                  px-1.5
                  text-xs
                  outline-none
                  focus:ring-1
                  focus:ring-ring
                  sm:h-9
                  sm:px-2
                  sm:text-sm
                "
                aria-label="Ethiopian month"
              >

                {ETH_MONTHS.map(
                  (
                    monthName,
                    index,
                  ) => (

                    <option
                      key={
                        index
                      }
                      value={
                        index + 1
                      }
                      disabled={
                        !isMonthAllowed(
                          year,
                          index + 1,
                        )
                      }
                    >

                      {
                        monthName
                      }

                    </option>

                  ),
                )}

              </select>


              {/* YEAR */}

              <select
                value={
                  year
                }
                onChange={(
                  event,
                ) => {

                  const nextYear =
                    Number(
                      event.target.value,
                    );


                  if (
                    !isYearAllowed(
                      nextYear,
                    )
                  ) {

                    return;
                  }


                  setYear(
                    nextYear,
                  );
                }}
                className="
                  h-8
                  min-w-0
                  max-w-[100px]
                  flex-1
                  rounded-sm
                  border
                  bg-background
                  px-1.5
                  text-xs
                  outline-none
                  focus:ring-1
                  focus:ring-ring
                  sm:h-9
                  sm:px-2
                  sm:text-sm
                "
                aria-label="Ethiopian year"
              >

                {yearOptions.map(
                  (
                    yearOption,
                  ) => (

                    <option
                      key={
                        yearOption
                      }
                      value={
                        yearOption
                      }
                    >

                      {
                        yearOption
                      }{" "}
                      ዓ.ም

                    </option>

                  ),
                )}

              </select>

            </div>


            {/* -----------------------------------------------
                NEXT
                ----------------------------------------------- */}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={
                nextMonth
              }
              className="
                h-8
                w-8
                shrink-0
                sm:h-9
                sm:w-9
              "
              aria-label="Next month"
            >

              <ChevronRight
                className="
                  h-4
                  w-4
                "
              />

            </Button>

          </div>


          {/* =================================================
              DAYS
              ================================================= */}

          <div
            className="
              grid
              w-full
              grid-cols-7
              gap-1
            "
          >

            {filteredDays.map(
              (
                day,
                index,
              ) => (

                day ? (

                  <button
                    key={
                      index
                    }
                    type="button"
                    onClick={() =>
                      handleSelect(
                        day.gregorian,
                      )
                    }
                    disabled={
                      !isMonthAllowed(
                        day.year,
                        day.month,
                      )
                    }
                    className={cn(
                      `
                        aspect-square
                        w-full
                        min-w-0
                        rounded-md
                        text-xs
                        transition
                        hover:bg-accent
                        focus:outline-none
                        focus:ring-1
                        focus:ring-ring
                        sm:rounded-lg
                        sm:text-sm
                      `,

                      isSameDay(
                        selected,
                        day.gregorian,
                      ) &&
                        `
                          bg-primary
                          text-primary-foreground
                          hover:bg-primary
                        `,

                      isToday(
                        day.gregorian,
                      ) &&
                        `
                          border
                          border-primary
                        `,

                      !isMonthAllowed(
                        day.year,
                        day.month,
                      ) &&
                        `
                          pointer-events-none
                          opacity-30
                        `,
                    )}
                  >

                    {
                      day.day
                    }

                  </button>

                ) : (

                  <div
                    key={
                      index
                    }
                    className="
                      aspect-square
                      w-full
                    "
                  />

                )

              ),
            )}

          </div>

        </PopoverContent>

      </Popover>


      {/* =================================================
          ERROR
          ================================================= */}

      {error && (

        <p
          className="
            text-xs
            text-destructive
          "
        >

          {
            error
          }

        </p>

      )}

    </div>
  );
}