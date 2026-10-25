"use client";

import {
  Hash,
  Divide,
  Percent,
  Type as TypeIcon,
  Calendar,
  ToggleLeft,
  ListChecks,
  FileText,
  CheckSquare,
  CircleDot,
  Check,
} from "lucide-react";

import type { ElementType } from "react";
import type { BaseFieldDataType } from "@/types/revenue/revenue-baseField";

export interface DataTypeMeta {
  label: string;
  description: string;
  icon: ElementType;
  needsUnit: boolean;
  needsOptions: boolean;
}

export const DATA_TYPE_META: Record<BaseFieldDataType, DataTypeMeta> = {
  NUMBER: {
    label: "Number",
    description: "Whole numbers, such as land area or unit count.",
    icon: Hash,
    needsUnit: true,
    needsOptions: false,
  },
  DECIMAL: {
    label: "Decimal",
    description: "Numbers with decimal precision, such as a rate.",
    icon: Divide,
    needsUnit: true,
    needsOptions: false,
  },
  PERCENTAGE: {
    label: "Percentage",
    description: "A percentage value, such as an occupancy rate.",
    icon: Percent,
    needsUnit: false,
    needsOptions: false,
  },
  TEXT: {
    label: "Text",
    description: "Free-form text, such as a name or short note.",
    icon: TypeIcon,
    needsUnit: false,
    needsOptions: false,
  },
  DATE: {
    label: "Date",
    description: "A calendar date, such as a lease start date.",
    icon: Calendar,
    needsUnit: false,
    needsOptions: false,
  },
  BOOLEAN: {
    label: "Boolean",
    description:
      "A true or false value, such as whether a property is renovated.",
    icon: ToggleLeft,
    needsUnit: false,
    needsOptions: false,
  },
  SELECT: {
    label: "Select",
    description: "One choice selected from a dropdown list.",
    icon: ListChecks,
    needsUnit: false,
    needsOptions: true,
  },
  FILE: {
    label: "File",
    description: "An uploaded file or document.",
    icon: FileText,
    needsUnit: false,
    needsOptions: false,
  },
  CHECKBOX: {
    label: "Checkbox",
    description: "One or more choices selected from a list.",
    icon: CheckSquare,
    needsUnit: false,
    needsOptions: true,
  },
  RADIO: {
    label: "Radio",
    description: "One choice selected from visible options.",
    icon: CircleDot,
    needsUnit: false,
    needsOptions: true,
  },
};

export const DATA_TYPES = Object.keys(
  DATA_TYPE_META,
) as BaseFieldDataType[];

interface BaseFieldDataTypePickerProps {
  value: BaseFieldDataType;
  disabled?: boolean;
  onChange: (type: BaseFieldDataType) => void;
}

export default function BaseFieldDataTypePicker({
  value,
  disabled = false,
  onChange,
}: BaseFieldDataTypePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Field data type"
      className={[
        "overflow-hidden rounded-lg border border-border",
        "bg-card",
      ].join(" ")}
    >
      {DATA_TYPES.map((type, index) => {
        const meta = DATA_TYPE_META[type];
        const Icon = meta.icon;
        const selected = value === type;

        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(type)}
            className={[
              "flex w-full items-start gap-3 px-3 py-2.5 text-left",
              "transition-colors",
              "focus-visible:z-10 focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              index > 0 ? "border-t border-border" : "",
              selected
                ? "bg-accent text-accent-foreground"
                : "bg-card text-foreground hover:bg-muted/60",
            ].join(" ")}
          >
            <span
              className={[
                "mt-0.5 flex size-7 shrink-0 items-center",
                "justify-center rounded-md transition-colors",
                selected
                  ? "bg-primary text-foreground"
                  : "bg-muted text-muted-foreground",
              ].join(" ")}
            >
              <Icon size={14} strokeWidth={2} aria-hidden="true" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium ">
                {meta.label}
              </span>

              <span className="block text-xs ">
                {meta.description}
              </span>
            </span>

            {selected && (
              <Check
                size={16}
                className="mt-1 shrink-0 text-primary"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}