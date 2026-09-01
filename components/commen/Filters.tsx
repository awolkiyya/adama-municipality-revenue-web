"use client";

import { useCallback } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  DateRangeValue,
  FilterField,
} from "@/types/commen";

import { RotateCcw } from "lucide-react";

import { EthiopianDatePicker } from "../input/EthiopianDatePicker";

import { cn } from "@/lib/utils";

// =====================================================
// TYPES
// =====================================================

type FiltersLayout =
  | "grid"
  | "row"
  | "column";

type ResetPosition =
  | "start"
  | "end"
  | "bottom";

type FiltersProps<
  T extends Record<string, unknown>,
> = {
  /**
   * Filter definition schema.
   */
  schema: FilterField[];

  /**
   * Controlled filter values.
   */
  value?: T;

  /**
   * Called whenever a filter changes.
   */
  onChange: (
    value: T,
  ) => void;

  /**
   * Optional reset handler.
   *
   * If not provided, the Reset button
   * will not be rendered.
   */
  onReset?: () => void;

  /**
   * Main filter layout.
   *
   * grid:
   * Responsive CSS grid.
   *
   * row:
   * Horizontal flex layout with wrapping.
   *
   * column:
   * Vertical flex layout.
   *
   * Default: "grid"
   */
  layout?: FiltersLayout;

  /**
   * Controls where Reset participates
   * in the layout.
   *
   * start:
   * Reset appears before filters.
   *
   * end:
   * Reset appears after filters.
   *
   * bottom:
   * Reset gets its own row.
   *
   * Default: "end"
   */
  resetPosition?: ResetPosition;

  /**
   * Additional classes applied to
   * the main layout container.
   *
   * Examples:
   *
   * className="md:grid-cols-2 lg:grid-cols-4"
   *
   * className="gap-3"
   */
  className?: string;

  /**
   * Additional classes applied to
   * every filter field.
   *
   * Particularly useful for row layout.
   *
   * Example:
   *
   * fieldClassName="min-w-[200px]"
   */
  fieldClassName?: string;

  /**
   * Additional classes applied to
   * the Reset item.
   */
  resetClassName?: string;
};

// =====================================================
// HELPERS
// =====================================================

/**
 * Convert an API date string:
 *
 * YYYY-MM-DD
 *
 * into a local JavaScript Date.
 */
function parseDate(
  value?: string,
): Date | undefined {
  if (!value) {
    return undefined;
  }

  const parts = value
    .split("-")
    .map(Number);

  if (parts.length !== 3) {
    return undefined;
  }

  const [
    year,
    month,
    day,
  ] = parts;

  if (!year || !month || !day) {
    return undefined;
  }

  const date = new Date(
    year,
    month - 1,
    day,
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return undefined;
  }

  return date;
}

/**
 * Convert a local JavaScript Date
 * into:
 *
 * YYYY-MM-DD
 */
function formatDate(
  date?: Date,
): string | undefined {
  if (!date) {
    return undefined;
  }

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =====================================================
// COMPONENT
// =====================================================

export function Filters<
  T extends Record<string, unknown>,
>({
  schema,

  value = {} as T,

  onChange,

  onReset,

  layout = "grid",

  resetPosition = "end",

  className,

  fieldClassName,

  resetClassName,
}: FiltersProps<T>) {

  // ===================================================
  // MAIN LAYOUT
  // ===================================================

  const layoutClassName = cn(
    {
      // -----------------------------------------------
      // GRID
      // -----------------------------------------------

      grid:
        layout === "grid",

      // -----------------------------------------------
      // ROW
      // -----------------------------------------------

      "flex flex-row flex-wrap items-end":
        layout === "row",

      // -----------------------------------------------
      // COLUMN
      // -----------------------------------------------

      "flex flex-col":
        layout === "column",
    },

    "w-full min-w-0 gap-5",

    // -----------------------------------------------
    // DEFAULT GRID
    // -----------------------------------------------

    layout === "grid" &&
      "grid-cols-1",

    className,
  );

  // ===================================================
  // FIELD LAYOUT
  // ===================================================

  /**
   * Controls the width of each individual filter.
   *
   * GRID:
   *   Full width inside its grid cell.
   *
   * COLUMN:
   *   Full width.
   *
   * ROW:
   *   Flexible width with a minimum size.
   */
  const fieldLayoutClassName =
    cn(
      "min-w-0 space-y-2 flex flex-row gap-2 justify-center item-center",

      // GRID
      layout === "grid" &&
        "w-full",

      // COLUMN
      layout === "column" &&
        "w-full",

      // ROW
      layout === "row" &&
        "min-w-[220px] flex-1",

      fieldClassName,
    );

  // ===================================================
  // RESET LAYOUT
  // ===================================================

  const resetLayoutClassName =
    cn(
      "min-w-0",

      // -----------------------------------------------
      // ROW
      // -----------------------------------------------

      layout === "row" &&
        "shrink-0",

      // -----------------------------------------------
      // COLUMN
      // -----------------------------------------------

      layout === "column" &&
        "w-full",

      // -----------------------------------------------
      // GRID
      // -----------------------------------------------

      layout === "grid" &&
        "w-full",

      // -----------------------------------------------
      // BOTTOM
      // -----------------------------------------------

      resetPosition ===
        "bottom" &&
        layout === "grid" &&
        "col-span-full",

      resetPosition ===
        "bottom" &&
        layout === "row" &&
        "basis-full",

      resetClassName,
    );

  // ===================================================
  // VALUE RESOLVER
  // ===================================================

  const resolveValue =
    useCallback(
      (
        field: FilterField,
      ) => {

        // -----------------------------------------------
        // DATE RANGE
        // -----------------------------------------------

        if (
          field.type ===
          "dateRange"
        ) {
          const current =
            value[field.key] as
              | DateRangeValue
              | null
              | undefined;

          const fallback =
            (
              field.defaultValue as
                | DateRangeValue
                | null
                | undefined
            ) ?? null;

          return {
            from:
              current?.from ??
              fallback?.from ??
              "",

            to:
              current?.to ??
              fallback?.to ??
              "",
          };
        }

        // -----------------------------------------------
        // CONTROLLED VALUE
        // -----------------------------------------------

        if (
          value[field.key] !==
            undefined &&
          value[field.key] !== ""
        ) {
          return value[field.key];
        }

        // -----------------------------------------------
        // DEFAULT VALUE
        // -----------------------------------------------

        if (
          field.defaultValue !==
          undefined
        ) {
          return field.defaultValue;
        }

        // -----------------------------------------------
        // FIRST SELECT OPTION
        // -----------------------------------------------

        if (
          field.type ===
            "select" &&
          field.options?.length
        ) {
          return field
            .options[0]
            .value;
        }

        // -----------------------------------------------
        // EMPTY
        // -----------------------------------------------

        return "";
      },
      [value],
    );

  // ===================================================
  // UPDATE FIELD
  // ===================================================

  const updateField = (
    key: string,
    fieldValue: unknown,
  ) => {
    onChange({
      ...value,
      [key]: fieldValue,
    });
  };

  // ===================================================
  // LABEL
  // ===================================================

  const labelClassName = `
    flex
    items-center
    gap-1.5
    text-sm
    font-medium
    text-foreground
  `;

  // ===================================================
  // RESET COMPONENT
  // ===================================================

  const renderReset =
    () => {

      if (!onReset) {
        return null;
      }

      return (
        <div
          className={
            resetLayoutClassName
          }
        >

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={
              onReset
            }
            className="
              h-9
              gap-2
              px-2
              text-sm
              text-muted-foreground
              hover:text-foreground
            "
          >

            <RotateCcw
              className="
                size-3.5
              "
            />

            Reset

          </Button>

        </div>
      );
    };

  // ===================================================
  // RENDER FIELD
  // ===================================================

  const renderField = (
    field: FilterField,
  ) => {

    const val =
      resolveValue(
        field,
      );

    const Icon =
      field.icon;

    // ===============================================
    // SELECT
    // ===============================================

    if (
      field.type ===
      "select"
    ) {
      return (
        <div
          key={
            field.key
          }
          className={
            fieldLayoutClassName
          }
        >

          <Label
            htmlFor={
              field.key
            }
            className={
              labelClassName
            }
          >

            {Icon && (
              <Icon
                className="
                  size-4
                  shrink-0
                  text-muted-foreground
                "
              />
            )}

            {field.label}

          </Label>

          <Select
            value={String(
              val ?? "",
            )}
            onValueChange={(
              selectedValue,
            ) => {
              updateField(
                field.key,
                selectedValue,
              );
            }}
          >

            <SelectTrigger
              id={
                field.key
              }
              className="
                h-10
                w-full
                py-5
              "
            >

              <SelectValue
                placeholder={
                  field.label
                }
              />

            </SelectTrigger>

            <SelectContent>

              {field.options?.map(
                (
                  option,
                ) => (
                  <SelectItem
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </SelectItem>
                ),
              )}

            </SelectContent>

          </Select>

        </div>
      );
    }

    // ===============================================
    // TEXT
    // ===============================================

    if (
      field.type ===
      "text"
    ) {
      return (
        <div
          key={
            field.key
          }
          className={
            fieldLayoutClassName
          }
        >

          <Label
            htmlFor={
              field.key
            }
            className={
              labelClassName
            }
          >

            {Icon && (
              <Icon
                className="
                  size-4
                  shrink-0
                  text-muted-foreground
                "
              />
            )}

            {field.label}

          </Label>

          <Input
            id={
              field.key
            }
            placeholder={
              field.label
            }
            value={String(
              val ?? "",
            )}
            onChange={(
              event,
            ) => {
              updateField(
                field.key,
                event.target
                  .value,
              );
            }}
            className="
              h-10
              w-full
            "
          />

        </div>
      );
    }

    // ===============================================
    // DATE RANGE
    // ===============================================

    if (
      field.type ===
      "dateRange"
    ) {
      const range =
        val as
          | DateRangeValue
          | null
          | undefined;

      const updateRange =
        (
          patch: Partial<
            DateRangeValue
          >,
        ) => {

          const current =
            range ?? {
              from: "",
              to: "",
            };

          const next:
            DateRangeValue =
            {
              ...current,
              ...patch,
            };

          const isEmpty =
            !next.from &&
            !next.to;

          updateField(
            field.key,
            isEmpty
              ? null
              : next,
          );
        };

      return (
        <div
          key={
            field.key
          }
          className={
            fieldLayoutClassName
          }
        >

          <Label
            className={
              labelClassName
            }
          >

            {Icon && (
              <Icon
                className="
                  size-4
                  shrink-0
                  text-muted-foreground
                "
              />
            )}

            {field.label}

          </Label>

          <div
            className="
              grid
              w-full
              min-w-0
              grid-cols-1
              gap-3
              sm:grid-cols-2
            "
          >

            {/* FROM */}

            <div
              className="
                min-w-0
              "
            >

              <EthiopianDatePicker
                value={parseDate(
                  range?.from,
                )}
                placeholder="From date"
                onChange={(
                  date,
                ) => {
                  updateRange({
                    from:
                      formatDate(
                        date,
                      ),
                  });
                }}
              />

            </div>

            {/* TO */}

            <div
              className="
                min-w-0
              "
            >

              <EthiopianDatePicker
                value={parseDate(
                  range?.to,
                )}
                placeholder="To date"
                onChange={(
                  date,
                ) => {
                  updateRange({
                    to:
                      formatDate(
                        date,
                      ),
                  });
                }}
              />

            </div>

          </div>

        </div>
      );
    }

    // ===============================================
    // UNSUPPORTED
    // ===============================================

    return null;
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div
      className="
        w-full
        min-w-0
      "
    >

      <div
        className={
          layoutClassName
        }
      >

        {/* ===========================================
            RESET - START
        =========================================== */}

        {onReset &&
          resetPosition ===
            "start" &&
          renderReset()}

        {/* ===========================================
            FILTERS
        =========================================== */}

        {schema.map(
          (
            field,
          ) =>
            renderField(
              field,
            ),
        )}

        {/* ===========================================
            RESET - END
        =========================================== */}

        {onReset &&
          resetPosition ===
            "end" &&
          renderReset()}

        {/* ===========================================
            RESET - BOTTOM
        =========================================== */}

        {onReset &&
          resetPosition ===
            "bottom" &&
          renderReset()}

      </div>

    </div>
  );
}
