"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  LoaderCircle,
  Save,
  TriangleAlert,
} from "lucide-react";

import type {
  BaseField,
  BaseFieldOption,
} from "@/types/revenue/revenue-baseField";

import type { MeasurementUnit } from "@/types/revenue/revenue-unit";

import BaseFieldFormFields, {
  type FieldFormErrors,
  type FieldFormState,
} from "@/components/revenue/base-fields/BaseFieldFormFields";

interface BaseFieldFormProps {
  initialField?: BaseField | null;
  existingFields?: BaseField[];
  loading?: boolean;
  onSubmit: (payload: FieldFormState) => Promise<unknown>;
  onCancel?: () => void;
}

const OPTION_DATA_TYPES = [
  "SELECT",
  "CHECKBOX",
  "RADIO",
] as const;

const EMPTY_FORM: FieldFormState = {
  name: "",
  code: "",
  data_type: "NUMBER",
  input_source: "MANUAL",
  measurement_unit_id: "",
  description: "",
  is_active: true,
  options: [],
};

function toCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function requiresOptions(
  dataType: FieldFormState["data_type"],
): boolean {
  return (OPTION_DATA_TYPES as readonly string[]).includes(
    dataType,
  );
}

function normalizeOptions(
  options: BaseFieldOption[],
): BaseFieldOption[] {
  return options.map((option, index) => ({
    ...option,
    label: String(option.label ?? "").trim(),
    value: String(option.value ?? "")
      .trim()
      .toUpperCase(),
    sort_order: index + 1,
    is_default: Boolean(option.is_default),
  }));
}

function createInitialForm(
  field?: BaseField | null,
): FieldFormState {
  if (!field) {
    return {
      ...EMPTY_FORM,
      input_source: "MANUAL",
      options: [],
    };
  }

  return {
    name: field.name ?? "",
    code: field.code ?? "",
    data_type: field.data_type,
    input_source: field.input_source ?? "MANUAL",
    measurement_unit_id:
      field.measurement_unit_id != null
        ? String(field.measurement_unit_id)
        : "",
    description: field.description ?? "",
    is_active: Boolean(field.is_active),
    options: (field.options ?? []).map((option) => ({
      ...option,
    })),
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to save the field. Please try again.";
}

function validateForm(
  form: FieldFormState,
  existingCodes: Set<string>,
  _editing: boolean,
): FieldFormErrors {
  const errors: FieldFormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Field name is required.";
  }

  const code = form.code.trim().toUpperCase();

  if (!code) {
    errors.code = "Field code is required.";
  } else if (!/^[A-Z][A-Z0-9_]*$/.test(code)) {
    errors.code =
      "Use uppercase letters, numbers, and underscores. Start with a letter.";
  } else if (existingCodes.has(code)) {
    // existingCodes excludes the current field during editing.
    errors.code = "This field code is already in use.";
  }

  if (
    (form.data_type === "NUMBER" ||
      form.data_type === "DECIMAL") &&
    !form.measurement_unit_id
  ) {
    errors.measurement_unit_id =
      "Select a measurement unit for this data type.";
  }

  if (requiresOptions(form.data_type)) {
    const options = normalizeOptions(form.options);

    // Ignore completely empty rows, but do not silently submit
    // a partially completed option.
    if (options.length === 0) {
      errors.options = "Add at least one option.";
    } else if (
      options.some((option) => !option.label || !option.value)
    ) {
      errors.options =
        "Every option must have both a label and a value.";
    } else {
      const values = options.map((option) => option.value);

      if (new Set(values).size !== values.length) {
        errors.options =
          "Each option must have a unique value.";
      }
    }

    const defaultCount = options.filter(
      (option) => option.is_default,
    ).length;

    if (defaultCount > 1) {
      errors.options =
        "Only one option can be selected as the default.";
    }
  }

  return errors;
}

function getComparableForm(form: FieldFormState) {
  return {
    ...form,
    name: form.name.trim(),
    code: form.code.trim().toUpperCase(),
    input_source: form.input_source ?? "MANUAL",
    measurement_unit_id: form.measurement_unit_id
      ? String(form.measurement_unit_id)
      : "",
    description: form.description.trim(),
    options: normalizeOptions(form.options),
  };
}

function getFirstErrorTarget(
  field: keyof FieldFormErrors,
): string {
  if (field === "measurement_unit_id") {
    return "base-field-unit-error";
  }

  if (field === "options") {
    return "base-field-options";
  }

  return `base-field-${field}`;
}

export default function BaseFieldForm({
  initialField = null,
  existingFields = [],
  loading = false,
  onSubmit,
  onCancel,
}: BaseFieldFormProps) {
  const editing = Boolean(initialField);

  const [form, setForm] = useState<FieldFormState>(() =>
    createInitialForm(initialField),
  );

  const [unitLabel, setUnitLabel] = useState("");
  const [codeTouched, setCodeTouched] = useState(editing);
  const [errors, setErrors] = useState<FieldFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(
    null,
  );
  const [saved, setSaved] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);

  const initialSnapshotRef = useRef(
    JSON.stringify(
      getComparableForm(createInitialForm(initialField)),
    ),
  );

  const existingCodes = useMemo(
    () =>
      new Set(
        existingFields
          .filter(
            (field) =>
              !initialField || field.id !== initialField.id,
          )
          .map((field) => field.code.trim().toUpperCase()),
      ),
    [existingFields, initialField],
  );

  useEffect(() => {
    const nextForm = createInitialForm(initialField);

    setForm(nextForm);
    setErrors({});
    setSubmitError(null);
    setSaved(false);
    setCodeTouched(Boolean(initialField));

    initialSnapshotRef.current = JSON.stringify(
      getComparableForm(nextForm),
    );

    const unit = (
      initialField as
        | (BaseField & {
            measurement_unit?: MeasurementUnit | null;
          })
        | null
    )?.measurement_unit;

    setUnitLabel(unit?.name ?? "");
  }, [initialField]);

  const isDirty = useMemo(
    () =>
      JSON.stringify(getComparableForm(form)) !==
      initialSnapshotRef.current,
    [form],
  );

  const clearError = useCallback(
    (field: keyof FieldFormErrors) => {
      setErrors((previous) => {
        if (!previous[field]) {
          return previous;
        }

        const next = { ...previous };
        delete next[field];

        return next;
      });

      setSubmitError(null);
      setSaved(false);
    },
    [],
  );

  const handleChange = useCallback(
    (nextForm: FieldFormState) => {
      setForm(nextForm);
      setSubmitError(null);
      setSaved(false);

      // Clear option errors when the option list changes.
      setErrors((previous) => {
        if (!previous.options) {
          return previous;
        }

        const next = { ...previous };
        delete next.options;

        return next;
      });
    },
    [],
  );

  const handleNameChange = useCallback(
    (name: string) => {
      setForm((previous) => ({
        ...previous,
        name,
        ...(!editing && !codeTouched
          ? { code: toCode(name) }
          : {}),
      }));

      clearError("name");

      if (!codeTouched && !editing) {
        clearError("code");
      }
    },
    [clearError, codeTouched, editing],
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting || loading) {
      return;
    }

    setSubmitError(null);
    setSaved(false);

    const optionsRequired = requiresOptions(form.data_type);

    const normalizedForm: FieldFormState = {
      ...form,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      input_source: form.input_source ?? "MANUAL",
      measurement_unit_id:
        form.data_type === "NUMBER" ||
        form.data_type === "DECIMAL"
          ? form.measurement_unit_id
          : "",
      description: form.description.trim(),
      options: optionsRequired
        ? normalizeOptions(form.options)
        : [],
    };

    const validationErrors = validateForm(
      normalizedForm,
      existingCodes,
      editing,
    );

    setErrors(validationErrors);

    const errorFields = Object.keys(
      validationErrors,
    ) as Array<keyof FieldFormErrors>;

    if (errorFields.length > 0) {
      const target = document.getElementById(
        getFirstErrorTarget(errorFields[0]),
      );

      target?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      return;
    }

    // Option-based field types must never be submitted
    // without at least one complete option.
    if (
      optionsRequired &&
      normalizedForm.options.length === 0
    ) {
      setErrors({
        options: "Add at least one complete option.",
      });

      document
        .getElementById("base-field-options")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

      return;
    }

    try {
      setSubmitting(true);

      // input_source is included in normalizedForm and therefore
      // forwarded to the page-level handler with the other fields.
      // The page-level handler must preserve it in the API payload.
      await onSubmit(normalizedForm);

      initialSnapshotRef.current = JSON.stringify(
        getComparableForm(normalizedForm),
      );

      setForm(normalizedForm);
      setSaved(true);
      setErrors({});
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  const busy = loading || submitting;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {editing ? "Edit base field" : "Create base field"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {editing
              ? "Update the field configuration used by your revenue services."
              : "Define a reusable field for your municipal revenue services."}
          </p>
        </div>

        {isDirty && !busy && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            Unsaved changes
          </span>
        )}
      </div>

      {submitError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <TriangleAlert
            size={16}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <p>{submitError}</p>
        </div>
      )}

      {saved && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          <Check size={16} aria-hidden="true" />
          Changes saved successfully.
        </div>
      )}

      <BaseFieldFormFields
        form={form}
        errors={errors}
        existingCodes={existingCodes}
        editing={initialField}
        disabled={busy}
        unitLabel={unitLabel}
        firstInputRef={firstInputRef}
        codeTouched={codeTouched}
        onChange={handleChange}
        onNameChange={handleNameChange}
        onUnitLabelChange={setUnitLabel}
        onCodeTouchedChange={(touched) => {
          setCodeTouched(touched);

          if (!touched && !editing) {
            setForm((previous) => ({
              ...previous,
              code: toCode(previous.name),
            }));

            clearError("code");
          }
        }}
        onClearError={clearError}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
        <div>
          {onCancel && (
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Cancel
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={busy || (!isDirty && editing)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <LoaderCircle
              size={16}
              className="animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Save size={16} aria-hidden="true" />
          )}

          {submitting
            ? "Saving..."
            : editing
              ? "Save changes"
              : "Create field"}
        </button>
      </div>
    </form>
  );
}