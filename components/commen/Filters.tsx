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

// =====================================================
// TYPES
// =====================================================

type FiltersProps<
  T extends Record<string, unknown>,
> = {
  schema: FilterField[];

  value?: T;

  onChange: (
    value: T,
  ) => void;

  onReset?: () => void;
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

  if (Number.isNaN(date.getTime())) {
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
}: FiltersProps<T>) {

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
  // RENDER
  // ===================================================

  return (
    <div className="w-full min-w-0">

      <div className="grid w-full min-w-0 grid-cols-1 gap-5">

        {schema.map(
          (field) => {

            const val =
              resolveValue(
                field,
              );

            const Icon =
              field.icon;

            // =========================================
            // SELECT
            // =========================================

            if (
              field.type ===
              "select"
            ) {
              return (
                <div
                  key={
                    field.key
                  }
                  className="
                    w-full
                    min-w-0
                    space-y-2
                  "
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

            // =========================================
            // TEXT
            // =========================================

            if (
              field.type ===
              "text"
            ) {
              return (
                <div
                  key={
                    field.key
                  }
                  className="
                    w-full
                    min-w-0
                    space-y-2
                  "
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

            // =========================================
            // DATE RANGE
            // =========================================

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
                  className="
                    w-full
                    min-w-0
                    space-y-2
                  "
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
                      grid-cols-1
                      gap-3
                      sm:grid-cols-2
                    "
                  >

                    {/* FROM */}

                    <div className="min-w-0">
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

                    <div className="min-w-0">
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

            // =========================================
            // UNSUPPORTED
            // =========================================

            return null;
          },
        )}

      </div>

      {/* =============================================
          RESET
      ============================================= */}

      {onReset && (
        <div className="mt-5 flex justify-start">

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
      )}

    </div>
  );
}
