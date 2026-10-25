"use client";

import {
  Bot,
  Calendar,
  Eye,
  FileText,
  Hand,
  Sparkles,
} from "lucide-react";

import type {
  BaseFieldOption,
  BaseFieldDataType,
  BaseFieldInputSource,
} from "@/types/revenue/revenue-baseField";

import {
  DATA_TYPE_META,
} from "@/components/revenue/base-fields/BaseFieldDataTypePicker";

export interface FieldPreviewData {
  name: string;
  code: string;
  data_type: BaseFieldDataType;
  input_source: BaseFieldInputSource;
  description: string;
  options: BaseFieldOption[];
}

interface BaseFieldPreviewProps {
  form: FieldPreviewData;
  unitLabel?: string;
}

const INPUT_SOURCE_META: Record<
  BaseFieldInputSource,
  {
    label: string;
    description: string;
  }
> = {
  MANUAL: {
    label: "Manual input",
    description: "Entered directly by the user.",
  },
  AI: {
    label: "AI generated",
    description: "Generated or populated by AI.",
  },
  MANUAL_OR_AI: {
    label: "Manual or AI",
    description: "Can be populated by AI or entered manually.",
  },
};

export default function BaseFieldPreview({
  form,
  unitLabel = "",
}: BaseFieldPreviewProps) {
  const meta = DATA_TYPE_META[form.data_type];
  const label = form.name.trim() || "Untitled field";

  const inputSource = form.input_source ?? "MANUAL";
  const sourceMeta = INPUT_SOURCE_META[inputSource];

  const isAiOnly = inputSource === "AI";
  const supportsManualInput = inputSource !== "AI";

  const options = [...form.options]
    .filter((option) => option.label.trim())
    .sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );

  const defaultOption =
    options.find((option) => option.is_default) ?? options[0];

  function renderPreview() {
    const sharedInputClass = [
      "min-w-0 flex-1 rounded-md border border-slate-300",
      "bg-slate-50 px-3 py-2 text-sm text-slate-500",
      "disabled:cursor-not-allowed",
    ].join(" ");

    switch (form.data_type) {
      case "NUMBER":
      case "DECIMAL":
        return (
          <div className="flex">
            <input
              type="number"
              disabled
              placeholder={
                isAiOnly
                  ? "AI will generate this value"
                  : "Enter a number"
              }
              aria-label={`${label} preview`}
              className={[
                sharedInputClass,
                unitLabel ? "rounded-r-none" : "",
              ].join(" ")}
            />

            {unitLabel && (
              <span className="flex shrink-0 items-center rounded-r-md border border-l-0 border-slate-300 bg-slate-100 px-3 text-xs text-slate-600">
                {unitLabel}
              </span>
            )}
          </div>
        );

      case "PERCENTAGE":
        return (
          <div className="flex">
            <input
              type="number"
              disabled
              placeholder={
                isAiOnly
                  ? "AI will generate this value"
                  : "Enter a percentage"
              }
              aria-label={`${label} preview`}
              className="min-w-0 flex-1 rounded-l-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />

            <span className="flex items-center rounded-r-md border border-l-0 border-slate-300 bg-slate-100 px-3 text-xs text-slate-600">
              %
            </span>
          </div>
        );

      case "TEXT":
        return (
          <input
            type="text"
            disabled
            placeholder={
              isAiOnly
                ? "AI will generate this text"
                : "Enter text"
            }
            aria-label={`${label} preview`}
            className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500 disabled:cursor-not-allowed"
          />
        );

      case "DATE":
        return (
          <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            <Calendar size={15} aria-hidden="true" />

            <span>
              {isAiOnly
                ? "AI will generate this date"
                : "Select a date"}
            </span>
          </div>
        );

      case "BOOLEAN":
        return (
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="relative h-5 w-9 rounded-full bg-slate-200"
            >
              <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow" />
            </span>

            <span className="text-xs text-slate-500">
              {isAiOnly
                ? "AI determines the value"
                : "Off"}
            </span>
          </div>
        );

      case "SELECT":
        return options.length > 0 ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
            <span className="truncate text-slate-600">
              {isAiOnly
                ? "AI will select an option"
                : defaultOption?.label ?? "Select an option"}
            </span>

            <span
              aria-hidden="true"
              className="text-slate-400"
            >
              ▾
            </span>
          </div>
        ) : (
          <EmptyOptionsMessage />
        );

      case "CHECKBOX":
        return options.length > 0 ? (
          <div className="space-y-2">
            {options.map((option, index) => (
              <label
                key={option.id ?? `${option.value}-${index}`}
                className="flex items-center gap-2 text-sm text-slate-600"
              >
                <input
                  type="checkbox"
                  disabled
                  checked={
                    !isAiOnly && !!option.is_default
                  }
                  readOnly
                  className="h-4 w-4 rounded accent-teal-600"
                />

                <span>{option.label}</span>
              </label>
            ))}
          </div>
        ) : (
          <EmptyOptionsMessage />
        );

      case "RADIO":
        return options.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {options.map((option, index) => (
              <span
                key={option.id ?? `${option.value}-${index}`}
                className={[
                  "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs",
                  !isAiOnly && option.is_default
                    ? "border-teal-300 bg-teal-50 text-teal-800"
                    : "border-slate-300 bg-slate-50 text-slate-600",
                ].join(" ")}
              >
                {!isAiOnly && option.is_default && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-teal-600"
                    aria-hidden="true"
                  />
                )}

                {option.label}
              </span>
            ))}
          </div>
        ) : (
          <EmptyOptionsMessage />
        );

      case "FILE":
        return (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-center">
            <FileText
              size={20}
              className="mx-auto mb-2 text-slate-400"
              aria-hidden="true"
            />

            <p className="text-xs text-slate-500">
              {isAiOnly
                ? "AI will provide or process this file"
                : "Drop a file or browse"}
            </p>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <section
      aria-label="Field preview"
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      {/* Preview heading */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Eye size={14} aria-hidden="true" />

          <span className="text-[11px] font-semibold uppercase tracking-wide">
            Live preview
          </span>
        </div>

        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
            "text-[11px] font-medium",
            isAiOnly
              ? "bg-violet-50 text-violet-700"
              : inputSource === "MANUAL_OR_AI"
                ? "bg-sky-50 text-sky-700"
                : "bg-slate-100 text-slate-600",
          ].join(" ")}
        >
          {isAiOnly ? (
            <Bot size={12} aria-hidden="true" />
          ) : inputSource === "MANUAL_OR_AI" ? (
            <Sparkles size={12} aria-hidden="true" />
          ) : (
            <Hand size={12} aria-hidden="true" />
          )}

          {sourceMeta.label}
        </span>
      </div>

      {/* Field label */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-800">
          {label}
        </label>

        {/* Input source indicator */}
        {isAiOnly && (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-violet-700">
            <Sparkles size={13} aria-hidden="true" />
            <span>Value generated by AI</span>
          </div>
        )}

        {renderPreview()}

        {/* Manual or AI behavior */}
        {inputSource === "MANUAL_OR_AI" && (
          <div className="mt-2 flex items-start gap-2 rounded-md border border-sky-100 bg-sky-50/70 p-2.5">
            <Sparkles
              size={14}
              className="mt-0.5 shrink-0 text-sky-700"
              aria-hidden="true"
            />

            <p className="text-xs leading-5 text-sky-800">
              AI can populate this field. The user can also
              enter or edit the value manually.
            </p>
          </div>
        )}

        {isAiOnly && (
          <p className="mt-2 text-xs leading-5 text-violet-700">
            This field is AI-controlled and is not intended
            for manual entry.
          </p>
        )}

        {supportsManualInput && inputSource === "MANUAL" && (
          <p className="mt-2 text-xs text-slate-500">
            {sourceMeta.description}
          </p>
        )}

        {/* Description */}
        {form.description.trim() && (
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {form.description.trim()}
          </p>
        )}

        {/* Metadata */}
        <p className="mt-3 text-[11px] text-slate-500">
          {meta.label} field

          {form.code.trim() && (
            <>
              {" · "}
              <span className="font-mono">
                {form.code}
              </span>
            </>
          )}
        </p>
      </div>
    </section>
  );
}

function EmptyOptionsMessage() {
  return (
    <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
      Add options to preview this field.
    </p>
  );
}
