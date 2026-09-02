"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Hash,
  Divide,
  Percent,
  Type as TypeIcon,
  Calendar,
  ToggleLeft,
  ListChecks,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  CircleCheck,
  CircleSlash,
  Ruler,
  AlertTriangle,
  Inbox,
  Loader2,
  FileText,
  CheckSquare,
  CircleDot,
} from "lucide-react";

import {
  BaseField,
  BaseFieldDataType,
  BaseFieldFilters,
} from "@/types/revenue/revenue-baseField";

import { MeasurementUnit } from "@/types/revenue/revenue-unit";
import { MeasurementUnitDropdown } from "@/components/input/MeasurmentUnitDropDown";

import {
  useBaseFields,
  useCreateBaseField,
  useUpdateBaseField,
  useActivateBaseField,
  useDeactivateBaseField,
  useDeleteBaseField,
} from "@/hooks/revenue/revenueBaseField.hook";

import { toast } from "sonner";
// ============================================================
// FIELD PANEL
// ============================================================



// ============================================================
// DATA TYPE PRESENTATION
// ============================================================

export const DATA_TYPE_META: Record<
  BaseFieldDataType,
  {
    label: string;
    icon: React.ElementType;
    needsUnit: boolean;
  }
> = {
  NUMBER: {
    label: "Number",
    icon: Hash,
    needsUnit: true,
  },

  DECIMAL: {
    label: "Decimal",
    icon: Divide,
    needsUnit: true,
  },

  PERCENTAGE: {
    label: "Percentage",
    icon: Percent,
    needsUnit: false,
  },

  TEXT: {
    label: "Text",
    icon: TypeIcon,
    needsUnit: false,
  },

  DATE: {
    label: "Date",
    icon: Calendar,
    needsUnit: false,
  },

  BOOLEAN: {
    label: "Boolean",
    icon: ToggleLeft,
    needsUnit: false,
  },

  SELECT: {
    label: "Select",
    icon: ListChecks,
    needsUnit: false,
  },
  FILE: {
    label: "File",
    icon: FileText,
    needsUnit: false,
  },
  CHECKBOX: {
    label: "Checkbox",
    icon: CheckSquare,
    needsUnit: false,
  },
 
  RADIO: {
    label: "Radio",
    icon: CircleDot,
    needsUnit: false,
  },
};

export const DATA_TYPES =
  Object.keys(DATA_TYPE_META) as BaseFieldDataType[];


// ============================================================
// HELPERS
// ============================================================

function toCode(name: string): string {
    return name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

// ============================================================
// FORM STATE
// ============================================================

interface FieldFormState {
  name: string;
  code: string;
  data_type: BaseFieldDataType;
  measurement_unit_id: string;
  description: string;
  is_active: boolean;
}

const emptyForm: FieldFormState = {
  name: "",
  code: "",
  data_type: "NUMBER",
  measurement_unit_id: "",
  description: "",
  is_active: true,
};

// ============================================================
// ICON BUTTON
// ============================================================

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
        className={
          "inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-slate-500 transition-colors " +
          "hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 " +
          "disabled:cursor-not-allowed disabled:opacity-50 " +
          (tone === "danger"
            ? "hover:!border-red-200 hover:!bg-red-50 hover:!text-red-700"
            : "")
        }
      >
        <Icon
          size={16}
          strokeWidth={2}
        />
      </button>
    );
  }

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
    const [form, setForm] =
      useState<FieldFormState>(emptyForm);
  
    const [codeTouched, setCodeTouched] =
      useState(false);
  
    const [errors, setErrors] = useState<
      Partial<Record<keyof FieldFormState, string>>
    >({});
  
    const firstInputRef =
      useRef<HTMLInputElement>(null);
  
    // ==========================================================
    // INITIALIZE
    // ==========================================================
  
    useEffect(() => {
      if (!open) {
        return;
      }
  
      if (editing) {
        setForm({
          name: editing.name ?? "",
          code: editing.code ?? "",
          data_type: editing.data_type,
          measurement_unit_id:
            editing.measurement_unit_id ?? "",
          description:
            editing.description ?? "",
          is_active:
            editing.is_active ?? true,
        });
  
        setCodeTouched(true);
      } else {
        setForm({
          ...emptyForm,
        });
  
        setCodeTouched(false);
      }
  
      setErrors({});
  
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 30);
  
      return () => clearTimeout(timer);
    }, [open, editing]);
  
    // ==========================================================
    // AUTO GENERATE CODE
    // ==========================================================
  
    useEffect(() => {
      if (!codeTouched) {
        setForm((current) => ({
          ...current,
          code: toCode(current.name),
        }));
      }
    }, [form.name, codeTouched]);
  
    if (!open) {
      return null;
    }
  
    const meta =
      DATA_TYPE_META[form.data_type];
  
    // ==========================================================
    // VALIDATE
    // ==========================================================
  
    function validate(): boolean {
      const next: Partial<
        Record<keyof FieldFormState, string>
      > = {};
  
      if (!form.name.trim()) {
        next.name = "Enter a field name.";
      }
  
      if (!form.code.trim()) {
        next.code = "Enter a field code.";
      } else if (
        !/^[A-Z][A-Z0-9_]*$/.test(
          form.code,
        )
      ) {
        next.code =
          "Use uppercase letters, numbers, and underscores, starting with a letter.";
      } else {
        const normalizedCode =
          form.code.trim().toUpperCase();
  
        const isDuplicate =
          existingCodes.has(normalizedCode) &&
          !(
            editing &&
            editing.code === normalizedCode
          );
  
        if (isDuplicate) {
          next.code =
            "This code is already in use.";
        }
      }
  
      if (
        meta.needsUnit &&
        !form.measurement_unit_id
      ) {
        next.measurement_unit_id =
          "Select a measurement unit.";
      }
  
      setErrors(next);
  
      return (
        Object.keys(next).length === 0
      );
    }
  
    // ==========================================================
    // SUBMIT
    // ==========================================================
  
    function handleSubmit(
      event: React.FormEvent,
    ) {
      event.preventDefault();
  
      if (isLoading) {
        return;
      }
  
      if (validate()) {
        onSave(form);
      }
    }
  
    return (
      <div
        className="fixed inset-0 z-40 flex justify-end bg-slate-900/30"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={
            editing
              ? "Edit base field"
              : "Create base field"
          }
          className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          {/* ====================================================
              HEADER
          ==================================================== */}
  
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {editing
                  ? "Edit base field"
                  : "New base field"}
              </h2>
  
              <p className="mt-0.5 text-xs text-slate-500">
                {editing
                  ? `Editing ${editing.code}`
                  : "Define a reusable data field"}
              </p>
            </div>
  
            <IconButton
              icon={X}
              label="Close panel"
              onClick={onClose}
              disabled={isLoading}
            />
          </div>
  
          {/* ====================================================
              FORM
          ==================================================== */}
  
          <form
            id="field-form"
            className="flex-1 overflow-y-auto px-6 py-5"
            onSubmit={handleSubmit}
          >
            <div className="space-y-5">
              {/* =================================================
                  NAME
              ================================================= */}
  
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Field name
                </label>
  
                <input
                  ref={firstInputRef}
                  type="text"
                  value={form.name}
                  disabled={isLoading}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Order quantity"
                  className={
                    "block w-full rounded-md border px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/30 " +
                    (errors.name
                      ? "border-red-300 focus:border-red-400"
                      : "border-slate-300 focus:border-teal-500")
                  }
                />
  
                {errors.name && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <AlertTriangle size={12} />
  
                    {errors.name}
                  </p>
                )}
              </div>
  
              {/* =================================================
                  CODE
              ================================================= */}
  
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Field code
                </label>
  
                <input
                  type="text"
                  value={form.code}
                  disabled={
                    isLoading || !!editing
                  }
                  onChange={(event) => {
                    setCodeTouched(true);
  
                    setForm((current) => ({
                      ...current,
                      code: event.target.value
                        .toUpperCase()
                        .replace(/\s+/g, "_"),
                    }));
                  }}
                  placeholder="ORDER_QTY"
                  className={
                    "block w-full rounded-md border px-3 py-2 font-mono text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/30 " +
                    (errors.code
                      ? "border-red-300 focus:border-red-400"
                      : "border-slate-300 focus:border-teal-500")
                  }
                />
  
                {errors.code ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <AlertTriangle size={12} />
  
                    {errors.code}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">
                    Used as the stable reference
                    in integrations and formulas.
                  </p>
                )}
              </div>
  
              {/* =================================================
                  DATA TYPE
              ================================================= */}
  
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Data type
                </label>
  
                <div className="grid grid-cols-2 gap-2">
                  {DATA_TYPES.map(
                    (dataType) => {
                      const typeMeta =
                        DATA_TYPE_META[
                          dataType
                        ];
  
                      const Icon =
                        typeMeta.icon;
  
                      const selected =
                        form.data_type ===
                        dataType;
  
                      return (
                        <button
                          key={dataType}
                          type="button"
                          disabled={isLoading}
                          onClick={() =>
                            setForm(
                              (current) => ({
                                ...current,
                                data_type:
                                  dataType,
  
                                measurement_unit_id:
                                  typeMeta.needsUnit
                                    ? current.measurement_unit_id
                                    : "",
                              }),
                            )
                          }
                          className={
                            "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 " +
                            (selected
                              ? "border-teal-600 bg-teal-50 text-teal-900"
                              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50")
                          }
                        >
                          <Icon
                            size={15}
                            strokeWidth={2}
                            className={
                              selected
                                ? "text-teal-700"
                                : "text-slate-400"
                            }
                          />
  
                          {typeMeta.label}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
  
              {/* =================================================
                  UNIT
              ================================================= */}
  
              {meta.needsUnit && (
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700">
                    <Ruler size={12} />
  
                    Measurement unit
                  </label>
  
                  <MeasurementUnitDropdown
                    value={
                      form.measurement_unit_id ||
                      null
                    }
                    onChange={(
                      value: string,
                      item: MeasurementUnit,
                    ) => {
                      const selectedId =
                        (item as MeasurementUnit)
                          ?.id ?? value;
  
                      setForm(
                        (current) => ({
                          ...current,
                          measurement_unit_id:
                            selectedId,
                        }),
                      );
  
                      setErrors(
                        (current) => ({
                          ...current,
                          measurement_unit_id:
                            undefined,
                        }),
                      );
                    }}
                  />
  
                  {errors.measurement_unit_id && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <AlertTriangle size={12} />
  
                      {
                        errors.measurement_unit_id
                      }
                    </p>
                  )}
  
                  <p className="mt-1 text-xs text-slate-400">
                    Search and select from
                    your organization's
                    measurement units.
                  </p>
                </div>
              )}
  
              {/* =================================================
                  DESCRIPTION
              ================================================= */}
  
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Description
                </label>
  
                <textarea
                  value={form.description}
                  disabled={isLoading}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description:
                        event.target.value,
                    }))
                  }
                  placeholder="What this field represents and where it's used."
                  rows={3}
                  className="block w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
                />
              </div>
  
              {/* =================================================
                  ACTIVE
              ================================================= */}
  
              <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2.5">
                <div>
                  <span className="text-sm text-slate-700">
                    Active
                  </span>
  
                  <p className="text-xs text-slate-400">
                    {form.is_active
                      ? "Field is available for use."
                      : "Field is currently inactive."}
                  </p>
                </div>
  
                <button
                  type="button"
                  role="switch"
                  aria-checked={
                    form.is_active
                  }
                  disabled={isLoading}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      is_active:
                        !current.is_active,
                    }))
                  }
                  className={
                    "relative h-5 w-9 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 " +
                    (form.is_active
                      ? "bg-teal-600"
                      : "bg-slate-300")
                  }
                >
                  <span
                    className={
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform " +
                      (form.is_active
                        ? "translate-x-4"
                        : "translate-x-0.5")
                    }
                  />
                </button>
              </div>
            </div>
          </form>
  
          {/* ====================================================
              FOOTER
          ==================================================== */}
  
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
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
              {isLoading && (
                <Loader2
                  size={15}
                  className="mr-2 animate-spin"
                />
              )}
  
              {editing
                ? isLoading
                  ? "Saving..."
                  : "Save changes"
                : isLoading
                  ? "Creating..."
                  : "Create field"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  