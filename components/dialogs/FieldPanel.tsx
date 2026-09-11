"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Hash,
  Divide,
  Percent,
  Type as TypeIcon,
  Calendar,
  ToggleLeft,
  ListChecks,
  Plus,
  Trash2,
  X,
  Ruler,
  AlertTriangle,
  Loader2,
  FileText,
  CheckSquare,
  CircleDot,
  GripVertical,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Eye,
  Check,
} from "lucide-react";

import { BaseField, BaseFieldDataType, BaseFieldOption } from "@/types/revenue/revenue-baseField";
import { MeasurementUnit } from "@/types/revenue/revenue-unit";
import { MeasurementUnitDropdown } from "@/components/input/MeasurmentUnitDropDown";

/* ============================================================
   DATA TYPE PRESENTATION
   Each type carries a one-line, domain-specific description so
   people can tell types apart without guessing from the icon
   alone (this is what actually gets shown in the picker + the
   live preview).
============================================================ */

export const DATA_TYPE_META: Record<
  BaseFieldDataType,
  {
    label: string;
    description: string;
    icon: React.ElementType;
    needsUnit: boolean;
    needsOptions: boolean;
  }
> = {
  NUMBER: {
    label: "Number",
    description: "Whole numbers, like square footage or unit count.",
    icon: Hash,
    needsUnit: true,
    needsOptions: false,
  },
  DECIMAL: {
    label: "Decimal",
    description: "Numbers with decimal precision, like an interest rate.",
    icon: Divide,
    needsUnit: true,
    needsOptions: false,
  },
  PERCENTAGE: {
    label: "Percentage",
    description: "A percentage value, like occupancy or cap rate.",
    icon: Percent,
    needsUnit: false,
    needsOptions: false,
  },
  TEXT: {
    label: "Text",
    description: "Free-form text, like a name or a short note.",
    icon: TypeIcon,
    needsUnit: false,
    needsOptions: false,
  },
  DATE: {
    label: "Date",
    description: "A calendar date, like a lease start date.",
    icon: Calendar,
    needsUnit: false,
    needsOptions: false,
  },
  BOOLEAN: {
    label: "Boolean",
    description: "A single true/false toggle, like \u201cis renovated.\u201d",
    icon: ToggleLeft,
    needsUnit: false,
    needsOptions: false,
  },
  SELECT: {
    label: "Select",
    description: "One choice picked from a dropdown list.",
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
    description: "One choice selected from visible buttons.",
    icon: CircleDot,
    needsUnit: false,
    needsOptions: true,
  },
};

export const DATA_TYPES = Object.keys(DATA_TYPE_META) as BaseFieldDataType[];



/* ============================================================
   FIELD FORM STATE
============================================================ */

export interface FieldFormState {
  name: string;
  code: string;
  data_type: BaseFieldDataType;
  measurement_unit_id: string;
  description: string;
  is_active: boolean;
  options: BaseFieldOption[];
}

const emptyForm: FieldFormState = {
  name: "",
  code: "",
  data_type: "NUMBER",
  measurement_unit_id: "",
  description: "",
  is_active: true,
  options: [],
};

/* ============================================================
   HELPERS
============================================================ */

function toCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function snapshot(form: FieldFormState): string {
  return JSON.stringify(form);
}

/* ============================================================
   SMALL PRIMITIVES
============================================================ */

function IconButton({
  icon: Icon,
  label,
  onClick,
  tone = "default",
  disabled = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 ${
        tone === "danger" ? "hover:!border-red-200 hover:!bg-red-50 hover:!text-red-700" : ""
      }`}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
      <AlertTriangle size={12} />
      {message}
    </p>
  );
}

/* ============================================================
   DATA TYPE PICKER
   A scannable list (icon + label + one-line description) reads
   far faster than a grid of icon buttons once there are 10
   types to choose between, and it's where the field's behavior
   is actually explained.
============================================================ */

function DataTypePicker({
  value,
  disabled,
  onChange,
}: {
  value: BaseFieldDataType;
  disabled: boolean;
  onChange: (type: BaseFieldDataType) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
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
            className={`flex w-full items-start gap-3 border-slate-200 px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              index !== 0 ? "border-t" : ""
            } ${selected ? "bg-teal-50" : "bg-white hover:bg-slate-50"}`}
          >
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                selected ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              <Icon size={14} strokeWidth={2} />
            </span>

            <span className="min-w-0 flex-1">
              <span className={`block text-sm font-medium ${selected ? "text-teal-900" : "text-slate-800"}`}>
                {meta.label}
              </span>
              <span className="block truncate text-xs text-slate-500">{meta.description}</span>
            </span>

            {selected && <Check size={16} className="mt-1 shrink-0 text-teal-600" />}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   OPTION EDITOR
============================================================ */

function OptionEditor({
  option,
  index,
  count,
  isLoading,
  valueRef,
  onChange,
  onRemove,
  onSetDefault,
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  option: BaseFieldOption;
  index: number;
  count: number;
  isLoading: boolean;
  valueRef?: (el: HTMLInputElement | null) => void;
  onChange: (index: number, field: keyof BaseFieldOption, value: string | number | boolean) => void;
  onRemove: (index: number) => void;
  onSetDefault: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number, event: React.DragEvent) => void;
  onDrop: () => void;
}) {
  return (
    <div
      draggable={!isLoading}
      onDragStart={() => onDragStart(index)}
      onDragOver={(event) => onDragOver(index, event)}
      onDrop={onDrop}
      className="rounded-lg border border-slate-200 bg-white p-3"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="cursor-grab text-slate-300 active:cursor-grabbing" aria-hidden="true">
            <GripVertical size={15} />
          </span>
          <span className="text-xs font-medium text-slate-500">Option {index + 1}</span>
        </div>

        <div className="flex items-center gap-1">
          <IconButton
            icon={ChevronUp}
            label="Move option up"
            onClick={() => onMove(index, -1)}
            disabled={isLoading || index === 0}
          />
          <IconButton
            icon={ChevronDown}
            label="Move option down"
            onClick={() => onMove(index, 1)}
            disabled={isLoading || index === count - 1}
          />
          <IconButton icon={Trash2} label="Remove option" tone="danger" onClick={() => onRemove(index)} disabled={isLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">
            Label <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={option.label}
            disabled={isLoading}
            onChange={(event) => {
              const label = event.target.value;
              onChange(index, "label", label);
              // Keep the internal value in sync until the person edits it directly.
              if (!option.value || option.value === toCode(option.label)) {
                onChange(index, "value", toCode(label));
              }
            }}
            placeholder="Commercial Property"
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
          <p className="mt-1 text-[11px] text-slate-400">Shown to users.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">
            Value <span className="text-red-500">*</span>
          </label>
          <input
            ref={valueRef}
            type="text"
            value={option.value}
            disabled={isLoading}
            onChange={(event) => onChange(index, "value", event.target.value.toUpperCase().replace(/\s+/g, "_"))}
            placeholder="COMMERCIAL"
            className="block w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
          <p className="mt-1 text-[11px] text-slate-400">Stable value used by formulas and integrations.</p>
        </div>
      </div>

      <label className="mt-3 flex w-fit cursor-pointer items-center gap-2">
        <input
          type="radio"
          name="default-option"
          checked={option.is_default}
          disabled={isLoading}
          onChange={() => onSetDefault(index)}
          className="h-4 w-4 accent-teal-600"
        />
        <span className="text-xs text-slate-600">Default option</span>
      </label>
    </div>
  );
}

/* ============================================================
   OPTIONS MANAGER
============================================================ */

function OptionsManager({
  options,
  isLoading,
  onChange,
}: {
  options: BaseFieldOption[];
  isLoading: boolean;
  onChange: (options: BaseFieldOption[]) => void;
}) {
  const dragIndex = useRef<number | null>(null);
  const newValueRef = useRef<HTMLInputElement | null>(null);
  const shouldFocusNew = useRef(false);

  useEffect(() => {
    if (shouldFocusNew.current) {
      newValueRef.current?.focus();
      shouldFocusNew.current = false;
    }
  }, [options.length]);

  function reindex(list: BaseFieldOption[]): BaseFieldOption[] {
    return list.map((option, index) => ({ ...option, sort_order: index }));
  }

  function addOption() {
    shouldFocusNew.current = true;
    onChange(reindex([...options, { value: "", label: "", sort_order: 0, is_default: options.length === 0 }]));
  }

  function updateOption(index: number, field: keyof BaseFieldOption, value: string | number | boolean) {
    const next = [...options];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  }

  function removeOption(index: number) {
    const removed = options[index];
    let next = options.filter((_, i) => i !== index);
    if (removed?.is_default && next.length > 0) {
      next[0] = { ...next[0], is_default: true };
    }
    onChange(reindex(next));
  }

  function setDefault(index: number) {
    onChange(options.map((option, i) => ({ ...option, is_default: i === index })));
  }

  function moveOption(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= options.length) return;
    const next = [...options];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(reindex(next));
  }

  function handleDrop() {
    dragIndex.current = null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {options.length === 0 ? "No options yet" : `${options.length} option${options.length === 1 ? "" : "s"}`}
        </p>
        <button
          type="button"
          disabled={isLoading}
          onClick={addOption}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} />
          Add option
        </button>
      </div>

      {options.length === 0 ? (
        <button
          type="button"
          onClick={addOption}
          disabled={isLoading}
          className="w-full rounded-md border border-dashed border-slate-300 bg-white px-4 py-8 text-center transition-colors hover:border-teal-400 hover:bg-teal-50/40 disabled:cursor-not-allowed"
        >
          <ListChecks size={22} className="mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-medium text-slate-600">Add the first option</p>
          <p className="mt-1 text-[11px] text-slate-400">People will choose from this list.</p>
        </button>
      ) : (
        <div className="space-y-3">
          {options.map((option, index) => (
            <OptionEditor
              key={option.id ?? `new-option-${index}`}
              option={option}
              index={index}
              count={options.length}
              isLoading={isLoading}
              valueRef={index === options.length - 1 ? (el) => (newValueRef.current = el) : undefined}
              onChange={updateOption}
              onRemove={removeOption}
              onSetDefault={setDefault}
              onMove={moveOption}
              onDragStart={(i) => (dragIndex.current = i)}
              onDragOver={(i, event) => {
                event.preventDefault();
                if (dragIndex.current === null || dragIndex.current === i) return;
                const next = [...options];
                const [moved] = next.splice(dragIndex.current, 1);
                next.splice(i, 0, moved);
                dragIndex.current = i;
                onChange(reindex(next));
              }}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   LIVE PREVIEW
   Shows the field the way an end user would actually see it,
   so whoever is building it can confirm the configuration
   before saving instead of finding out after the fact.
============================================================ */

function FieldPreview({ form, unitLabel }: { form: FieldFormState; unitLabel: string }) {
  const meta = DATA_TYPE_META[form.data_type];
  const label = form.name.trim() || "Untitled field";
  const options = form.options.filter((option) => option.label.trim());

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-1.5 text-slate-400">
        <Eye size={13} />
        <span className="text-[11px] font-medium uppercase tracking-wide">Preview</span>
      </div>

      <label className="mb-1.5 block text-sm font-medium text-slate-800">{label}</label>

      {(() => {
        switch (form.data_type) {
          case "NUMBER":
          case "DECIMAL":
            return (
              <div className="flex">
                <input
                  disabled
                  placeholder="0"
                  className="w-full rounded-l-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-400"
                />
                {unitLabel && (
                  <span className="flex items-center rounded-r-md border border-l-0 border-slate-300 bg-slate-100 px-3 text-xs text-slate-500">
                    {unitLabel}
                  </span>
                )}
              </div>
            );
          case "PERCENTAGE":
            return (
              <div className="flex">
                <input disabled placeholder="0" className="w-full rounded-l-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-400" />
                <span className="flex items-center rounded-r-md border border-l-0 border-slate-300 bg-slate-100 px-3 text-xs text-slate-500">%</span>
              </div>
            );
          case "DATE":
            return (
              <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-400">
                <Calendar size={14} />
                Select a date
              </div>
            );
          case "BOOLEAN":
            return (
              <div className="flex items-center gap-2">
                <span className="relative h-5 w-9 rounded-full bg-slate-200">
                  <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow" />
                </span>
                <span className="text-xs text-slate-400">Off</span>
              </div>
            );
          case "SELECT":
            return options.length > 0 ? (
              <div className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                {options.find((o) => o.is_default)?.label ?? options[0].label}
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">Add options to preview the list.</p>
            );
          case "CHECKBOX":
            return options.length > 0 ? (
              <div className="space-y-1.5">
                {options.map((option, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm text-slate-500">
                    <input type="checkbox" disabled defaultChecked={option.is_default} className="h-4 w-4 rounded accent-teal-600" />
                    {option.label}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">Add options to preview the list.</p>
            );
          case "RADIO":
            return options.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {options.map((option, i) => (
                  <span
                    key={i}
                    className={`rounded-md border px-3 py-1.5 text-xs ${
                      option.is_default ? "border-teal-300 bg-teal-50 text-teal-800" : "border-slate-300 text-slate-500"
                    }`}
                  >
                    {option.label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">Add options to preview the list.</p>
            );
          case "FILE":
            return (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-center text-xs text-slate-400">
                Drop a file or browse
              </div>
            );
          default:
            return <input disabled placeholder="Text" className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-400" />;
        }
      })()}

      {form.description.trim() && <p className="mt-1.5 text-xs text-slate-400">{form.description.trim()}</p>}
      <p className="mt-3 text-[11px] text-slate-400">
        {meta.label} field
        {form.code ? (
          <>
            {" \u00b7 "}
            <span className="font-mono">{form.code}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}

/* ============================================================
   FIELD PANEL
============================================================ */

export default function FieldPanel({
  open,
  editing,
  existingCodes,
  isLoading,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: BaseField | null;
  existingCodes: Set<string>;
  isLoading: boolean;
  onClose: () => void;
  onSave: (data: FieldFormState) => void;
}) {
  const [form, setForm] = useState<FieldFormState>(emptyForm);
  const [codeTouched, setCodeTouched] = useState(false);
  const [unitLabel, setUnitLabel] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FieldFormState, string>>>({});
  const [confirmingClose, setConfirmingClose] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);
  const initialSnapshot = useRef<string>(snapshot(emptyForm));
  const isDirty = snapshot(form) !== initialSnapshot.current;

  /* ---------- initialize form ---------- */

  useEffect(() => {
    if (!open) return;

    let nextForm: FieldFormState;

    if (editing) {
      const existingOptions = (editing as BaseField & { options?: BaseFieldOption[] }).options ?? [];
      nextForm = {
        name: editing.name ?? "",
        code: editing.code ?? "",
        data_type: editing.data_type,
        measurement_unit_id: editing.measurement_unit_id ?? "",
        description: editing.description ?? "",
        is_active: editing.is_active ?? true,
        options: existingOptions.map((option, index) => ({
          id: option.id,
          base_field_id: option.base_field_id,
          value: option.value ?? "",
          label: option.label ?? "",
          sort_order: option.sort_order ?? index,
          is_default: option.is_default ?? false,
        })),
      };
      setCodeTouched(true);
    } else {
      nextForm = { ...emptyForm, options: [] };
      setCodeTouched(false);
    }

    setForm(nextForm);
    setUnitLabel("");
    setErrors({});
    setConfirmingClose(false);
    initialSnapshot.current = snapshot(nextForm);

    const timer = setTimeout(() => firstInputRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [open, editing]);

  /* ---------- auto-generate code from name ---------- */

  useEffect(() => {
    if (!codeTouched) {
      setForm((current) => ({ ...current, code: toCode(current.name) }));
    }
  }, [form.name, codeTouched]);

  /* ---------- keyboard shortcuts: Esc to close, Cmd/Ctrl+Enter to save ---------- */

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
      } else if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        (document.getElementById("field-form") as HTMLFormElement | null)?.requestSubmit();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isDirty, confirmingClose, isLoading]);

  if (!open) return null;

  const meta = DATA_TYPE_META[form.data_type];
  const needsOptions = meta.needsOptions;

  /* ---------- close handling (protects against losing unsaved work) ---------- */

  function requestClose() {
    if (isLoading) return;
    if (isDirty) {
      setConfirmingClose(true);
      return;
    }
    onClose();
  }

  /* ---------- validation ---------- */

  function validate(): boolean {
    const next: Partial<Record<keyof FieldFormState, string>> = {};

    if (!form.name.trim()) {
      next.name = "Enter a field name.";
    }

    if (!form.code.trim()) {
      next.code = "Enter a field code.";
    } else if (!/^[A-Z][A-Z0-9_]*$/.test(form.code)) {
      next.code = "Use uppercase letters, numbers, and underscores, starting with a letter.";
    } else {
      const normalizedCode = form.code.trim().toUpperCase();
      const isDuplicate = existingCodes.has(normalizedCode) && !(editing && editing.code === normalizedCode);
      if (isDuplicate) next.code = "This code is already in use.";
    }

    if (meta.needsUnit && !form.measurement_unit_id) {
      next.measurement_unit_id = "Select a measurement unit.";
    }

    if (needsOptions) {
      if (form.options.length === 0) {
        next.options = "Add at least one option.";
      } else {
        const values = new Set<string>();
        let hasInvalidOption = false;
        let hasDuplicate = false;
        let defaultCount = 0;

        for (const option of form.options) {
          const value = option.value.trim().toUpperCase();
          const label = option.label.trim();
          if (!value || !label) hasInvalidOption = true;
          if (value && values.has(value)) hasDuplicate = true;
          if (value) values.add(value);
          if (option.is_default) defaultCount++;
        }

        if (hasInvalidOption) next.options = "Every option needs a label and a value.";
        else if (hasDuplicate) next.options = "Option values must be unique.";
        else if (defaultCount > 1) next.options = "Only one option can be the default.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  /* ---------- submit ---------- */

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isLoading || !validate()) return;

    const normalizedForm: FieldFormState = {
      ...form,
      options: needsOptions
        ? form.options.map((option, index) => ({
            ...(option.id ? { id: option.id } : {}),
            ...(option.base_field_id ? { base_field_id: option.base_field_id } : {}),
            value: option.value.trim().toUpperCase(),
            label: option.label.trim(),
            sort_order: option.sort_order ?? index,
            is_default: option.is_default ?? false,
          }))
        : [],
    };

    onSave(normalizedForm);
  }

  /* ---------- data type change ---------- */

  function handleDataTypeChange(dataType: BaseFieldDataType) {
    const nextMeta = DATA_TYPE_META[dataType];
    setForm((current) => ({
      ...current,
      data_type: dataType,
      measurement_unit_id: nextMeta.needsUnit ? current.measurement_unit_id : "",
      // Options survive moves between SELECT / RADIO / CHECKBOX, and are
      // cleared only when switching away from an option-based type.
      options: nextMeta.needsOptions ? current.options : [],
    }));
    setErrors((current) => ({ ...current, measurement_unit_id: undefined, options: undefined }));
  }

  /* ---------- render ---------- */

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30" onClick={requestClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "Edit base field" : "Create base field"}
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">{editing ? "Edit base field" : "New base field"}</h2>
              {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-teal-500" aria-label="Unsaved changes" />}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{editing ? `Editing ${editing.code}` : "Define a reusable data field"}</p>
          </div>
          <IconButton icon={X} label="Close panel" onClick={requestClose} disabled={isLoading} />
        </div>

        {/* DISCARD CONFIRMATION */}
        {confirmingClose && (
          <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-6 py-3">
            <p className="text-xs text-amber-800">You have unsaved changes. Discard them?</p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setConfirmingClose(false)}
                className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-amber-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-700"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* FORM */}
        <form id="field-form" className="flex-1 overflow-y-auto px-6 py-5" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <FieldPreview form={form} unitLabel={unitLabel} />

            <Section title="Basics">
              <div>
                <label htmlFor="field-name" className="mb-1.5 block text-xs font-medium text-slate-700">
                  Field name
                </label>
                <input
                  id="field-name"
                  ref={firstInputRef}
                  type="text"
                  value={form.name}
                  disabled={isLoading}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "field-name-error" : undefined}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Property Type"
                  className={`block w-full rounded-md border px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/30 ${
                    errors.name ? "border-red-300 focus:border-red-400" : "border-slate-300 focus:border-teal-500"
                  }`}
                />
                <FieldError id="field-name-error" message={errors.name} />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="field-code" className="block text-xs font-medium text-slate-700">
                    Field code
                  </label>
                  {!editing && codeTouched && (
                    <button
                      type="button"
                      onClick={() => setCodeTouched(false)}
                      className="flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:text-teal-800"
                    >
                      <RotateCcw size={11} />
                      Regenerate from name
                    </button>
                  )}
                </div>
                <input
                  id="field-code"
                  type="text"
                  value={form.code}
                  disabled={isLoading || !!editing}
                  aria-invalid={!!errors.code}
                  aria-describedby={errors.code ? "field-code-error" : undefined}
                  onChange={(event) => {
                    setCodeTouched(true);
                    setForm((current) => ({ ...current, code: event.target.value.toUpperCase().replace(/\s+/g, "_") }));
                  }}
                  placeholder="PROPERTY_TYPE"
                  className={`block w-full rounded-md border px-3 py-2 font-mono text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                    errors.code ? "border-red-300 focus:border-red-400" : "border-slate-300 focus:border-teal-500"
                  }`}
                />
                {errors.code ? (
                  <FieldError id="field-code-error" message={errors.code} />
                ) : (
                  <p className="mt-1 text-xs text-slate-400">
                    {editing ? "Codes can't be changed after a field is created." : "The stable reference used in integrations and formulas."}
                  </p>
                )}
              </div>
            </Section>

            <Section title="Format" description="Choose how this field stores and displays data.">
              <div role="radiogroup" aria-label="Data type">
                <DataTypePicker value={form.data_type} disabled={isLoading} onChange={handleDataTypeChange} />
              </div>

              {meta.needsUnit && (
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700">
                    <Ruler size={12} />
                    Measurement unit
                  </label>
                  <MeasurementUnitDropdown
                    value={form.measurement_unit_id || null}
                    onChange={(value: string, item: MeasurementUnit) => {
                      const selectedId = item?.id ?? value;
                      setForm((current) => ({ ...current, measurement_unit_id: selectedId }));
                      setUnitLabel((item as unknown as { name?: string })?.name ?? "");
                      setErrors((current) => ({ ...current, measurement_unit_id: undefined }));
                    }}
                  />
                  <FieldError id="field-unit-error" message={errors.measurement_unit_id} />
                  <p className="mt-1 text-xs text-slate-400">Search and select from your organization's measurement units.</p>
                </div>
              )}

              {needsOptions && (
                <div>
                  <OptionsManager
                    options={form.options}
                    isLoading={isLoading}
                    onChange={(options) => {
                      setForm((current) => ({ ...current, options }));
                      setErrors((current) => ({ ...current, options: undefined }));
                    }}
                  />
                  <FieldError id="field-options-error" message={errors.options} />
                </div>
              )}
            </Section>

            <Section title="Details">
              <div>
                <label htmlFor="field-description" className="mb-1.5 block text-xs font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  id="field-description"
                  value={form.description}
                  disabled={isLoading}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="What this field represents and where it's used."
                  rows={3}
                  className="block w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
                <p className="mt-1 text-[11px] text-slate-400">Shown as helper text wherever this field appears.</p>
              </div>

              <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2.5">
                <div>
                  <span className="text-sm text-slate-700">Active</span>
                  <p className="text-xs text-slate-400">{form.is_active ? "Field is available for use." : "Field is hidden from new records."}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.is_active}
                  disabled={isLoading}
                  onClick={() => setForm((current) => ({ ...current, is_active: !current.is_active }))}
                  className={`relative h-5 w-9 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    form.is_active ? "bg-teal-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      form.is_active ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </Section>
          </div>
        </form>

        {/* FOOTER */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-6 py-4">
          <p className="hidden text-[11px] text-slate-400 sm:block">
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-sans">Esc</kbd> to close &nbsp;\u00b7&nbsp;
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-sans">
              {typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "\u2318" : "Ctrl"}+Enter
            </kbd>{" "}
            to save
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestClose}
              disabled={isLoading}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="field-form"
              disabled={isLoading}
              className="inline-flex items-center rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading && <Loader2 size={15} className="mr-2 animate-spin" />}
              {editing ? (isLoading ? "Saving..." : "Save changes") : isLoading ? "Creating..." : "Create field"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}