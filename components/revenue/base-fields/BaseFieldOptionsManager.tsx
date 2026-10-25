"use client";

import { useRef, useState } from "react";
import type { DragEvent } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ListChecks,
  AlertTriangle,
} from "lucide-react";

import type { BaseFieldOption } from "@/types/revenue/revenue-baseField";

interface BaseFieldOptionsManagerProps {
  options: BaseFieldOption[];
  disabled?: boolean;
  error?: string;
  onChange: (options: BaseFieldOption[]) => void;
}

function toCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function reindex(options: BaseFieldOption[]): BaseFieldOption[] {
  return options.map((option, index) => ({
    ...option,
    sort_order: index,
  }));
}

const inputClassName = [
  "block w-full rounded-md border border-input",
  "bg-background px-3 py-2 text-sm text-foreground outline-none",
  "placeholder:text-muted-foreground",
  "transition-colors",
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

const labelClassName =
  "mb-1.5 block text-xs font-medium text-foreground";

const helperClassName =
  "mt-1 text-[11px] text-muted-foreground";

function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  danger = false,
}: {
  icon: typeof Trash2;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex size-8 items-center justify-center rounded-md",
        "border border-transparent text-muted-foreground transition-colors",
        "hover:border-border hover:bg-accent hover:text-accent-foreground",
        "disabled:cursor-not-allowed disabled:opacity-40",
        danger
          ? "hover:!border-destructive/30 hover:!bg-destructive/10 hover:!text-destructive"
          : "",
      ].join(" ")}
    >
      <Icon size={16} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}

export default function BaseFieldOptionsManager({
  options,
  disabled = false,
  error,
  onChange,
}: BaseFieldOptionsManagerProps) {
  const dragIndex = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  function addOption() {
    const newOption: BaseFieldOption = {
      value: "",
      label: "",
      sort_order: options.length,
      is_default: options.length === 0,
    };

    onChange([...options, newOption]);
  }

  function updateOption(
    index: number,
    field: "label" | "value",
    value: string,
  ) {
    const next = [...options];
    const current = next[index];

    if (!current) return;

    if (field === "label") {
      const previousGeneratedValue = toCode(current.label);

      next[index] = {
        ...current,
        label: value,
        value:
          !current.value || current.value === previousGeneratedValue
            ? toCode(value)
            : current.value,
      };
    } else {
      next[index] = {
        ...current,
        value: value.toUpperCase().replace(/\s+/g, "_"),
      };
    }

    onChange(next);
  }

  function removeOption(index: number) {
    const removed = options[index];

    if (!removed) return;

    let next = options.filter((_, i) => i !== index);

    if (removed.is_default && next.length > 0) {
      next = next.map((option, i) => ({
        ...option,
        is_default: i === 0,
      }));
    }

    onChange(reindex(next));
  }

  function setDefault(index: number) {
    onChange(
      options.map((option, i) => ({
        ...option,
        is_default: i === index,
      })),
    );
  }

  function moveOption(index: number, direction: -1 | 1) {
    const target = index + direction;

    if (target < 0 || target >= options.length) return;

    const next = [...options];
    [next[index], next[target]] = [next[target], next[index]];

    onChange(reindex(next));
  }

  function handleDragStart(index: number) {
    dragIndex.current = index;
    setDraggingIndex(index);
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
    targetIndex: number,
  ) {
    event.preventDefault();

    const sourceIndex = dragIndex.current;

    if (sourceIndex === null || sourceIndex === targetIndex) {
      return;
    }

    const next = [...options];
    const [moved] = next.splice(sourceIndex, 1);

    if (!moved) return;

    next.splice(targetIndex, 0, moved);

    dragIndex.current = targetIndex;
    onChange(reindex(next));
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setDraggingIndex(null);
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-medium text-foreground">
            Field options
          </h4>

          <p className="mt-1 text-xs text-muted-foreground">
            {options.length === 0
              ? "No options added yet."
              : `${options.length} option${options.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={addOption}
          className={[
            "inline-flex shrink-0 items-center gap-1.5 rounded-md",
            "border border-input bg-background px-3 py-2",
            "text-xs font-medium text-foreground transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
          ].join(" ")}
        >
          <Plus size={14} aria-hidden="true" />
          Add option
        </button>
      </div>

      {options.length === 0 ? (
        <button
          type="button"
          disabled={disabled}
          onClick={addOption}
          className={[
            "w-full rounded-md border border-dashed border-border",
            "bg-background px-4 py-8 text-center transition-colors",
            "hover:border-primary/50 hover:bg-accent/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
          ].join(" ")}
        >
          <ListChecks
            size={22}
            className="mx-auto mb-2 text-muted-foreground"
            aria-hidden="true"
          />

          <p className="text-sm font-medium text-foreground">
            Add your first option
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Define the choices available to users.
          </p>
        </button>
      ) : (
        <div className="space-y-3">
          {options.map((option, index) => (
            <div
              key={option.id ?? `new-option-${index}`}
              draggable={!disabled}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(event) => handleDragOver(event, index)}
              onDragEnd={handleDragEnd}
              className={[
                "rounded-lg border border-border bg-card p-3",
                "transition-opacity",
                draggingIndex === index ? "opacity-50" : "",
              ].join(" ")}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <GripVertical
                    size={15}
                    className="shrink-0 cursor-grab text-muted-foreground"
                    aria-hidden="true"
                  />

                  <span className="text-xs font-medium text-foreground">
                    Option {index + 1}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <IconButton
                    icon={ChevronUp}
                    label="Move option up"
                    onClick={() => moveOption(index, -1)}
                    disabled={disabled || index === 0}
                  />

                  <IconButton
                    icon={ChevronDown}
                    label="Move option down"
                    onClick={() => moveOption(index, 1)}
                    disabled={disabled || index === options.length - 1}
                  />

                  <IconButton
                    icon={Trash2}
                    label={`Remove option ${index + 1}`}
                    onClick={() => removeOption(index)}
                    disabled={disabled}
                    danger
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`base-field-option-label-${index}`}
                    className={labelClassName}
                  >
                    Label <span className="text-destructive">*</span>
                  </label>

                  <input
                    id={`base-field-option-label-${index}`}
                    type="text"
                    value={option.label}
                    disabled={disabled}
                    onChange={(event) =>
                      updateOption(index, "label", event.target.value)
                    }
                    placeholder="Commercial Property"
                    className={inputClassName}
                  />

                  <p className={helperClassName}>
                    Displayed to users.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor={`base-field-option-value-${index}`}
                    className={labelClassName}
                  >
                    Value <span className="text-destructive">*</span>
                  </label>

                  <input
                    id={`base-field-option-value-${index}`}
                    type="text"
                    value={option.value}
                    disabled={disabled}
                    onChange={(event) =>
                      updateOption(index, "value", event.target.value)
                    }
                    placeholder="COMMERCIAL"
                    className={`${inputClassName} font-mono`}
                  />

                  <p className={helperClassName}>
                    Stable value used by formulas and integrations.
                  </p>
                </div>
              </div>

              <label className="mt-3 flex w-fit cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="base-field-default-option"
                  checked={option.is_default}
                  disabled={disabled}
                  onChange={() => setDefault(index)}
                  className="size-4 accent-primary"
                />

                <span className="text-xs text-muted-foreground">
                  Default option
                </span>
              </label>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-center gap-1.5 text-xs text-destructive"
        >
          <AlertTriangle size={13} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
