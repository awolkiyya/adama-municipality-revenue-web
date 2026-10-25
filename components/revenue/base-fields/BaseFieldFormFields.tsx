"use client";

import type { RefObject, ReactNode } from "react";
import {
  Ruler,
  RotateCcw,
  AlertTriangle,
  Bot,
  Keyboard,
  Workflow,
} from "lucide-react";

import type {
  BaseField,
  BaseFieldDataType,
  BaseFieldOption,
} from "@/types/revenue/revenue-baseField";

import type { MeasurementUnit } from "@/types/revenue/revenue-unit";

import { MeasurementUnitDropdown } from "@/components/input/MeasurmentUnitDropDown";

import BaseFieldDataTypePicker, {
  DATA_TYPE_META,
} from "@/components/revenue/base-fields/BaseFieldDataTypePicker";

import BaseFieldOptionsManager from "@/components/revenue/base-fields/BaseFieldOptionsManager";

import BaseFieldPreview from "@/components/revenue/base-fields/BaseFieldPreview";

export type BaseFieldInputSource =
  | "MANUAL"
  | "AI"
  | "MANUAL_OR_AI";

export interface FieldFormState {
  name: string;
  code: string;
  data_type: BaseFieldDataType;
  input_source: BaseFieldInputSource;
  measurement_unit_id: string;
  description: string;
  is_active: boolean;
  options: BaseFieldOption[];
}

export interface FieldFormErrors {
  name?: string;
  code?: string;
  measurement_unit_id?: string;
  options?: string;
}

interface BaseFieldFormFieldsProps {
  form: FieldFormState;
  errors: FieldFormErrors;
  existingCodes: Set<string>;
  editing: BaseField | null;
  disabled?: boolean;
  unitLabel: string;
  firstInputRef: RefObject<HTMLInputElement | null>;
  codeTouched: boolean;
  onChange: (form: FieldFormState) => void;
  onNameChange: (name: string) => void;
  onUnitLabelChange: (label: string) => void;
  onCodeTouchedChange: (touched: boolean) => void;
  onClearError: (field: keyof FieldFormErrors) => void;
}

const inputClassName = [
  "block w-full rounded-md border border-input",
  "bg-background px-3 py-2 text-sm text-foreground",
  "outline-none placeholder:text-muted-foreground",
  "transition-colors",
  "focus-visible:border-ring",
  "focus-visible:ring-2 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

const labelClassName =
  "mb-1.5 block text-xs font-medium text-foreground";

const helperClassName =
  "mt-1 text-xs text-muted-foreground";

const inputSources: {
  value: BaseFieldInputSource;
  label: string;
  description: string;
  Icon: typeof Keyboard;
}[] = [
  {
    value: "MANUAL",
    label: "Manual entry",
    description: "Entered directly by a user.",
    Icon: Keyboard,
  },
  {
    value: "AI",
    label: "AI-generated",
    description: "Provided by AI processing.",
    Icon: Bot,
  },
  {
    value: "MANUAL_OR_AI",
    label: "Manual or AI",
    description: "Supports either input method.",
    Icon: Workflow,
  },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border pt-5 first:border-t-0 first:pt-0">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          {title}
        </h3>

        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FieldError({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-center gap-1 text-xs text-destructive"
    >
      <AlertTriangle size={12} aria-hidden="true" />
      {message}
    </p>
  );
}

function InputSourcePicker({
  value,
  disabled,
  onChange,
}: {
  value: BaseFieldInputSource;
  disabled: boolean;
  onChange: (value: BaseFieldInputSource) => void;
}) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className={labelClassName}>
        Input source <span className="text-destructive">*</span>
      </legend>

      <p className="mb-3 text-xs text-muted-foreground">
        Choose how this field receives its value.
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {inputSources.map(({ value: source, label, description, Icon }) => {
          const selected = value === source;
          const inputId = `base-field-input-source-${source.toLowerCase()}`;

          return (
            <label
              key={source}
              htmlFor={inputId}
              className={[
                "flex min-w-0 cursor-pointer items-start gap-2.5",
                "rounded-md border p-3 transition-colors",
                "focus-within:ring-2 focus-within:ring-ring",
              ].join(" ")}
            >
              <input
                id={inputId}
                type="radio"
                name="base-field-input-source"
                value={source}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(source)}
                className="sr-only"
              />

              <Icon
                size={17}
                aria-hidden="true"
                className={[
                  "mt-0.5 shrink-0"
                ].join(" ")}
              />

              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium">
                  {label}
                </span>

                <span className="mt-1 block text-xs leading-relaxed">
                  {description}
                </span>
              </span>

              <span
                aria-hidden="true"
                className={[
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center",
                  "rounded-full border",
                  selected
                    ? "border-primary"
                    : "border-input",
                ].join(" ")}
              >
                {selected && (
                  <span className="size-2 rounded-full bg-primary" />
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function BaseFieldFormFields({
  form,
  errors,
  editing,
  disabled = false,
  unitLabel,
  firstInputRef,
  codeTouched,
  onChange,
  onNameChange,
  onUnitLabelChange,
  onCodeTouchedChange,
  onClearError,
}: BaseFieldFormFieldsProps) {
  const meta = DATA_TYPE_META[form.data_type];

  function update<K extends keyof FieldFormState>(
    field: K,
    value: FieldFormState[K],
  ) {
    onChange({
      ...form,
      [field]: value,
    });
  }

  function handleDataTypeChange(dataType: BaseFieldDataType) {
    const nextMeta = DATA_TYPE_META[dataType];

    onChange({
      ...form,
      data_type: dataType,
      measurement_unit_id: nextMeta.needsUnit
        ? form.measurement_unit_id
        : "",
      options: nextMeta.needsOptions
        ? form.options
        : [],
    });

    if (!nextMeta.needsUnit) {
      onUnitLabelChange("");
    }

    onClearError("measurement_unit_id");
    onClearError("options");
  }

  return (
    <div className="space-y-6">
      <BaseFieldPreview
        form={form}
        unitLabel={unitLabel}
      />

      <Section title="Basics">
        <div>
          <label
            htmlFor="base-field-name"
            className={labelClassName}
          >
            Field name <span className="text-destructive">*</span>
          </label>

          <input
            id="base-field-name"
            ref={firstInputRef}
            type="text"
            value={form.name}
            disabled={disabled}
            required
            maxLength={255}
            aria-invalid={!!errors.name}
            aria-describedby={
              errors.name
                ? "base-field-name-error"
                : undefined
            }
            onChange={(event) => {
              onNameChange(event.target.value);
              onClearError("name");
            }}
            placeholder="Property Type"
            className={[
              inputClassName,
              errors.name
                ? "border-destructive focus-visible:ring-destructive/20"
                : "",
            ].join(" ")}
          />

          <FieldError
            id="base-field-name-error"
            message={errors.name}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label
              htmlFor="base-field-code"
              className="block text-xs font-medium text-foreground"
            >
              Field code <span className="text-destructive">*</span>
            </label>

            {!editing && codeTouched && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onCodeTouchedChange(false)}
                className={[
                  "inline-flex items-center gap-1 text-xs font-medium",
                  "text-primary transition-opacity hover:opacity-80",
                  "focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                ].join(" ")}
              >
                <RotateCcw size={11} aria-hidden="true" />
                Regenerate from name
              </button>
            )}
          </div>

          <input
            id="base-field-code"
            type="text"
            value={form.code}
            disabled={disabled || !!editing}
            required
            maxLength={255}
            aria-invalid={!!errors.code}
            aria-describedby={
              errors.code
                ? "base-field-code-error"
                : "base-field-code-help"
            }
            onChange={(event) => {
              onCodeTouchedChange(true);

              update(
                "code",
                event.target.value
                  .toUpperCase()
                  .replace(/\s+/g, "_"),
              );

              onClearError("code");
            }}
            placeholder="PROPERTY_TYPE"
            className={[
              inputClassName,
              "font-mono",
              errors.code
                ? "border-destructive focus-visible:ring-destructive/20"
                : "",
            ].join(" ")}
          />

          {errors.code ? (
            <FieldError
              id="base-field-code-error"
              message={errors.code}
            />
          ) : (
            <p
              id="base-field-code-help"
              className={helperClassName}
            >
              {editing
                ? "Codes cannot be changed after creation."
                : "A stable reference used in formulas and integrations."}
            </p>
          )}
        </div>
      </Section>

      <Section
        title="Format"
        description="Choose how this field stores and receives data."
      >
        <BaseFieldDataTypePicker
          value={form.data_type}
          disabled={disabled}
          onChange={handleDataTypeChange}
        />

        <InputSourcePicker
          value={form.input_source}
          disabled={disabled}
          onChange={(inputSource) =>
            update("input_source", inputSource)
          }
        />

        {meta.needsUnit && (
          <div>
            <label
              htmlFor="base-field-measurement-unit"
              className={[
                "mb-1.5 flex items-center gap-1.5",
                "text-xs font-medium text-foreground",
              ].join(" ")}
            >
              <Ruler size={12} aria-hidden="true" />
              Measurement unit{" "}
              <span className="text-destructive">*</span>
            </label>

            <MeasurementUnitDropdown
              value={form.measurement_unit_id || null}
              onChange={(
                value: string,
                item: MeasurementUnit,
              ) => {
                const selectedId = item?.id ?? value;

                update(
                  "measurement_unit_id",
                  String(selectedId ?? ""),
                );

                onUnitLabelChange(item?.name ?? "");
                onClearError("measurement_unit_id");
              }}
            />

            <FieldError
              id="base-field-unit-error"
              message={errors.measurement_unit_id}
            />

            <p className={helperClassName}>
              Select a measurement unit used by your organization.
            </p>
          </div>
        )}

        {meta.needsOptions && (
          <div id="base-field-options">
            <BaseFieldOptionsManager
              options={form.options}
              disabled={disabled}
              error={errors.options}
              onChange={(options: BaseFieldOption[]) => {
                update("options", options);
                onClearError("options");
              }}
            />
          </div>
        )}
      </Section>

      <Section title="Details">
        <div>
          <label
            htmlFor="base-field-description"
            className={labelClassName}
          >
            Description
          </label>

          <textarea
            id="base-field-description"
            value={form.description}
            disabled={disabled}
            maxLength={2000}
            rows={3}
            onChange={(event) =>
              update("description", event.target.value)
            }
            placeholder="What this field represents and where it is used."
            className={[
              inputClassName,
              "resize-y",
            ].join(" ")}
          />

          <p className={helperClassName}>
            Optional helper text shown wherever the field is used.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-card px-3 py-3">
          <div>
            <p className="text-sm font-medium text-card-foreground">
              Active
            </p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {form.is_active
                ? "Available for use in new records."
                : "Hidden from new records."}
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-label="Active status"
            aria-checked={form.is_active}
            disabled={disabled}
            onClick={() =>
              update("is_active", !form.is_active)
            }
            className={[
              "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full",
              "transition-colors focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-50",
              form.is_active
                ? "bg-primary"
                : "bg-muted-foreground/30",
            ].join(" ")}
          >
            <span
              className={[
                "pointer-events-none block size-4 rounded-full",
                "bg-background shadow-sm ring-0 transition-transform",
                form.is_active
                  ? "translate-x-4"
                  : "translate-x-0.5",
              ].join(" ")}
            />
          </button>
        </div>
      </Section>
    </div>
  );
}
