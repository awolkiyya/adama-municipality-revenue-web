"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Sigma,
  AlertCircle,
  Link2,
  Hash,
  CircleDot,
} from "lucide-react";

import type {
  TariffFormulaVariable,
  TariffFormulaVariableSourceType,
  TariffFormulaVariableDataType,
  TariffFormulaVariableApiPayload,
} from "@/types/revenue/tariff-formula-variable";

import {
  useTariffFormulaVariables,
  useCreateTariffFormulaVariable,
  useUpdateTariffFormulaVariable,
  useDeleteTariffFormulaVariable,
} from "@/hooks/revenue/useTariffFormulaVariable.hook";

import { BaseFieldDropdown } from "../input/BasefieldDropDown";

/*
|--------------------------------------------------------------------------
| Local editable row model
|--------------------------------------------------------------------------
*/

interface EditableVariable {
  _localId: string;
  _isNew: boolean;
  _dirty: boolean;

  id?: string;
  code?: string;
  variableName: string;
  label: string;
  sourceType: TariffFormulaVariableSourceType;
  baseFieldId: string | null;
  defaultValue: number | string | null;
  dataType: TariffFormulaVariableDataType;
  isRequired: boolean;
  sortOrder: number;
}

export interface FormulaVariablesFormProps {
  tariffRuleId: string;
  formula?: string | null;
  enabled?: boolean;
  onSaved?: () => void;
  onCancel?: () => void;
  variant?: "modal" | "page";
  title?: string;
  description?: string;
  className?: string;
}

interface FormulaVariablesEditorProps {
  tariffRuleId: string;
  formula?: string | null;
  initialRows: EditableVariable[];
  onSaved?: () => void;
  onCancel?: () => void;
  variant: "modal" | "page";
  className?: string;
  onReload: () => void;
}

const DATA_TYPES: TariffFormulaVariableDataType[] = [
  "NUMBER",
  "DECIMAL",
  "PERCENTAGE",
  "MONEY",
];

const SOURCE_TYPES: {
  value: TariffFormulaVariableSourceType;
  label: string;
}[] = [
  { value: "BASE_FIELD", label: "Base Field" },
  { value: "CONSTANT", label: "Constant" },
];

let localIdCounter = 0;

function nextLocalId(): string {
  localIdCounter += 1;
  return `local-${localIdCounter}`;
}

function createEmptyRow(sortOrder: number): EditableVariable {
  return {
    _localId: nextLocalId(),
    _isNew: true,
    _dirty: true,
    variableName: "",
    label: "",
    sourceType: "CONSTANT",
    baseFieldId: null,
    defaultValue: null,
    dataType: "DECIMAL",
    isRequired: true,
    sortOrder,
  };
}

function toEditableRow(
  variable: TariffFormulaVariable,
): EditableVariable {
  return {
    _localId: variable.id,
    _isNew: false,
    _dirty: false,
    id: variable.id,
    code: variable.code,
    variableName: variable.variableName,
    label: variable.label,
    sourceType: variable.sourceType,
    baseFieldId: variable.baseFieldId,
    defaultValue: variable.defaultValue,
    dataType: variable.dataType,
    isRequired: variable.isRequired,
    sortOrder: variable.sortOrder,
  };
}

/*
|--------------------------------------------------------------------------
| API payload builders
|--------------------------------------------------------------------------
|
| The backend generates the variable code.
| Never send the code from the frontend.
|
*/

function toCreatePayload(
  row: EditableVariable,
  sortOrder: number,
): TariffFormulaVariableApiPayload {
  return {
    variable_name: row.variableName.trim(),
    label: row.label.trim(),
    source_type: row.sourceType,
    base_field_id:
      row.sourceType === "BASE_FIELD"
        ? row.baseFieldId
        : null,
    default_value: row.defaultValue,
    data_type: row.dataType,
    is_required: row.isRequired,
    sort_order: sortOrder,
  };
}

function toUpdatePayload(
  row: EditableVariable,
  sortOrder: number,
): TariffFormulaVariableApiPayload {
  return {
    variable_name: row.variableName.trim(),
    label: row.label.trim(),
    source_type: row.sourceType,
    base_field_id:
      row.sourceType === "BASE_FIELD"
        ? row.baseFieldId
        : null,
    default_value: row.defaultValue,
    data_type: row.dataType,
    is_required: row.isRequired,
    sort_order: sortOrder,
  };
}

/*
|--------------------------------------------------------------------------
| Formula helpers
|--------------------------------------------------------------------------
*/

function tokenizeFormula(formula: string): string[] {
  return formula
    .split(/([A-Za-z_][A-Za-z0-9_]*)/g)
    .filter((token) => token !== "");
}

/*
|--------------------------------------------------------------------------
| Badges
|--------------------------------------------------------------------------
*/

function SourceBadge({
  type,
}: {
  type: TariffFormulaVariableSourceType;
}) {
  const isBaseField = type === "BASE_FIELD";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isBaseField
          ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      )}
    >
      {isBaseField ? (
        <Link2 className="h-3 w-3" />
      ) : (
        <Hash className="h-3 w-3" />
      )}

      {isBaseField ? "Base Field" : "Constant"}
    </span>
  );
}

function StatusBadge({
  row,
}: {
  row: EditableVariable;
}) {
  if (row._isNew) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        <CircleDot className="h-3 w-3" />
        New
      </span>
    );
  }

  if (row._dirty) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
        <CircleDot className="h-3 w-3" />
        Modified
      </span>
    );
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| Main component
|--------------------------------------------------------------------------
|
| A new inner component instance is created when the tariff rule or
| enabled state changes. This avoids synchronizing local state through
| useEffect.
|
*/

export default function FormulaVariablesForm(
  props: FormulaVariablesFormProps,
) {
  const {
    tariffRuleId,
    enabled = true,
  } = props;

  return (
    <FormulaVariablesFormContent
      key={`${tariffRuleId}-${enabled ? "enabled" : "disabled"}`}
      {...props}
      enabled={enabled}
    />
  );
}

/*
|--------------------------------------------------------------------------
| Data loading component
|--------------------------------------------------------------------------
*/

function FormulaVariablesFormContent({
  tariffRuleId,
  formula,
  enabled,
  onSaved,
  onCancel,
  variant = "page",
  className,
}: FormulaVariablesFormProps & {
  enabled: boolean;
}) {
  const [reloadVersion, setReloadVersion] = useState(0);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useTariffFormulaVariables(
    tariffRuleId,
    enabled,
  );

  const handleReload = () => {
    setReloadVersion((previous) => previous + 1);
  };

  /*
  |--------------------------------------------------------------------------
  | Disabled state
  |--------------------------------------------------------------------------
  |
  | Do not display stale data when the parent disables the form.
  |
  */

  if (!enabled) {
    return (
      <FormulaVariablesEditor
        key={`${tariffRuleId}-disabled`}
        tariffRuleId={tariffRuleId}
        formula={formula}
        initialRows={[]}
        onSaved={onSaved}
        onCancel={onCancel}
        variant={variant}
        className={className}
        onReload={handleReload}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Loading state
  |--------------------------------------------------------------------------
  */

  if (isLoading && !data) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading variables…
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error state
  |--------------------------------------------------------------------------
  */

  if (isError && !data) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center",
          className,
        )}
      >
        <AlertCircle className="h-5 w-5 text-red-500" />

        <p className="text-sm font-medium">
          Couldn&apos;t load formula variables
        </p>

        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
        >
          Try again
        </Button>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Initialize editor from fetched data
  |--------------------------------------------------------------------------
  |
  | The editor receives its initial rows as props and initializes its
  | local state once. Background refetches do not overwrite user edits.
  |
  */

  const initialRows: EditableVariable[] = (
    data?.data ?? []
  )
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toEditableRow);

  return (
    <FormulaVariablesEditor
      key={`${tariffRuleId}-${reloadVersion}`}
      tariffRuleId={tariffRuleId}
      formula={formula}
      initialRows={initialRows}
      onSaved={onSaved}
      onCancel={onCancel}
      variant={variant}
      className={className}
      onReload={handleReload}
    />
  );
}

/*
|--------------------------------------------------------------------------
| Editable form
|--------------------------------------------------------------------------
*/

function FormulaVariablesEditor({
  tariffRuleId,
  formula,
  initialRows,
  onSaved,
  onCancel,
  variant,
  className,
  onReload,
}: FormulaVariablesEditorProps) {
  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  |
  | Initial data is provided by the parent before this component mounts.
  | No effect is needed to copy query data into local state.
  |
  */

  const [rows, setRows] = useState<EditableVariable[]>(
    () => initialRows,
  );

  const [error, setError] = useState<string | null>(null);

  const [deletingIds, setDeletingIds] = useState<Set<string>>(
    () => new Set(),
  );

  /*
  |--------------------------------------------------------------------------
  | Mutations
  |--------------------------------------------------------------------------
  */

  const createMutation = useCreateTariffFormulaVariable();
  const updateMutation = useUpdateTariffFormulaVariable();
  const deleteMutation = useDeleteTariffFormulaVariable();

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending;

  /*
  |--------------------------------------------------------------------------
  | Add Variable
  |--------------------------------------------------------------------------
  */

  const addVariable = () => {
    setRows((previous) => [
      ...previous,
      createEmptyRow(previous.length),
    ]);

    setError(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Update Variable
  |--------------------------------------------------------------------------
  */

  const updateVariable = <K extends keyof EditableVariable>(
    localId: string,
    field: K,
    value: EditableVariable[K],
  ) => {
    setRows((previous) =>
      previous.map((row) =>
        row._localId === localId
          ? {
              ...row,
              [field]: value,
              _dirty: true,
            }
          : row,
      ),
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Remove Variable
  |--------------------------------------------------------------------------
  */

  const removeVariable = async (localId: string) => {
    const row = rows.find(
      (item) => item._localId === localId,
    );

    if (!row) {
      return;
    }

    // Unsaved row: remove locally.
    if (row._isNew || !row.id) {
      setRows((previous) =>
        previous.filter(
          (item) => item._localId !== localId,
        ),
      );

      return;
    }

    // Saved row: confirm before deleting from the backend.
    const confirmed = window.confirm(
      `Delete variable "${row.variableName || row.code}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingIds((previous) => {
      const next = new Set(previous);
      next.add(localId);
      return next;
    });

    setError(null);

    try {
      await deleteMutation.mutateAsync({
        tariffRuleId,
        variableId: row.id,
      });

      setRows((previous) =>
        previous.filter(
          (item) => item._localId !== localId,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete variable.",
      );
    } finally {
      setDeletingIds((previous) => {
        const next = new Set(previous);
        next.delete(localId);
        return next;
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Validation
  |--------------------------------------------------------------------------
  */

  const validate = (): string | null => {
    if (rows.length === 0) {
      return "Add at least one variable.";
    }

    const names = new Set<string>();

    for (const row of rows) {
      const variableName = row.variableName.trim();

      if (!variableName || !row.label.trim()) {
        return "Every variable needs a variable name and label.";
      }

      if (names.has(variableName)) {
        return `Duplicate variable name: "${row.variableName}".`;
      }

      names.add(variableName);

      if (
        row.sourceType === "BASE_FIELD" &&
        !row.baseFieldId
      ) {
        return `"${row.variableName}" is set to Base Field but has no field selected.`;
      }
    }

    return null;
  };

  /*
  |--------------------------------------------------------------------------
  | Save All
  |--------------------------------------------------------------------------
  */

  const handleSaveAll = async () => {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    const creates = rows.filter(
      (row) => row._isNew,
    );

    const updates = rows.filter(
      (row) =>
        !row._isNew &&
        row._dirty &&
        Boolean(row.id),
    );

    if (
      creates.length === 0 &&
      updates.length === 0
    ) {
      onSaved?.();
      return;
    }

    const operations: {
      row: EditableVariable;
      kind: "create" | "update";
    }[] = [
      ...creates.map((row) => ({
        row,
        kind: "create" as const,
      })),

      ...updates.map((row) => ({
        row,
        kind: "update" as const,
      })),
    ];

    const results = await Promise.allSettled(
      operations.map(({ row, kind }) => {
        const sortOrder = rows.findIndex(
          (item) => item._localId === row._localId,
        );

        if (kind === "create") {
          return createMutation.mutateAsync({
            tariffRuleId,
            data: toCreatePayload(row, sortOrder),
          });
        }

        return updateMutation.mutateAsync({
          tariffRuleId,
          variableId: row.id as string,
          data: toUpdatePayload(row, sortOrder),
        });
      }),
    );

    const failed = results
      .map((result, index) => ({
        result,
        operation: operations[index],
      }))
      .filter(
        ({ result }) => result.status === "rejected",
      );

    if (failed.length > 0) {
      const labels = failed
        .map(
          ({ operation }) =>
            operation.row.code ||
            operation.row.variableName ||
            "variable",
        )
        .join(", ");

      setError(
        `Failed to save ${failed.length} variable${
          failed.length === 1 ? "" : "s"
        }: ${labels}. Fix and try again.`,
      );

      // Reload server state after partial success so already-saved
      // rows are not submitted again.
      onReload();

      return;
    }

    onSaved?.();
  };

  /*
  |--------------------------------------------------------------------------
  | Derived Values
  |--------------------------------------------------------------------------
  */

  const requiredCount = rows.filter(
    (row) => row.isRequired,
  ).length;

  const knownVariableNames = useMemo(
    () =>
      new Set(
        rows
          .map((row) => row.variableName)
          .filter(Boolean),
      ),
    [rows],
  );

  const unreferencedVariables = rows.filter(
    (row) =>
      row.variableName &&
      formula &&
      !formula.includes(row.variableName),
  );

  const unsavedCount = rows.filter(
    (row) => row._isNew || row._dirty,
  ).length;

  const isModal = variant === "modal";

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className={cn(
        "flex flex-col gap-0",
        isModal &&
          "max-h-[85vh] min-h-0 flex-1 overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col",
          isModal
            ? "min-h-0 flex-1 overflow-y-auto"
            : "flex-1",
        )}
      >
        {/* FORMULA PREVIEW */}

        {formula && (
          <div className="border-b bg-slate-950 px-5 py-4 sm:px-6">
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Current Formula
            </div>

            <code className="block overflow-x-auto whitespace-pre text-sm leading-relaxed text-slate-100">
              {tokenizeFormula(formula).map(
                (token, index) =>
                  knownVariableNames.has(token) ? (
                    <span
                      key={index}
                      className="rounded bg-blue-500/20 px-1 py-0.5 text-blue-300"
                    >
                      {token}
                    </span>
                  ) : (
                    <span key={index}>
                      {token}
                    </span>
                  ),
              )}
            </code>

            {unreferencedVariables.length > 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />

                {unreferencedVariables.length === 1
                  ? `"${unreferencedVariables[0].variableName}" isn't used in this formula.`
                  : `${unreferencedVariables.length} variables aren't used in this formula.`}
              </p>
            )}
          </div>
        )}

        {/* VARIABLES HEADER */}

        <div className="flex items-center justify-between border-b bg-muted/40 px-5 py-3 sm:px-6">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {rows.length === 0
              ? "No variables yet"
              : `${rows.length} variable${
                  rows.length === 1 ? "" : "s"
                } · ${requiredCount} required`}
          </span>

          <Button
            type="button"
            size="sm"
            onClick={addVariable}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Variable
          </Button>
        </div>

        {/* VARIABLE LIST */}

        <div className="flex-1 py-4">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Sigma className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">
                  This formula has no variables
                </p>

                <p className="text-xs text-muted-foreground">
                  Add a variable to reference it in the tariff calculation
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addVariable}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add your first variable
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row, index) => {
                const isDeleting = deletingIds.has(
                  row._localId,
                );

                return (
                  <div
                    key={row._localId}
                    className={cn(
                      "rounded-lg border bg-card p-4 transition-opacity",
                      isDeleting &&
                        "pointer-events-none opacity-50",
                    )}
                  >
                    {/* ROW HEADER */}

                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[11px] font-medium text-muted-foreground">
                          {index + 1}
                        </span>

                        <SourceBadge type={row.sourceType} />

                        {row.code ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                            {row.code}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[11px] italic text-muted-foreground">
                            code assigned on save
                          </span>
                        )}

                        <StatusBadge row={row} />

                        {row.isRequired && (
                          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            Required
                          </span>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-500"
                        onClick={() =>
                          removeVariable(row._localId)
                        }
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>

                    {/* VARIABLE FIELDS */}

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {/* VARIABLE NAME */}

                      <div className="col-span-1 space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Variable
                        </label>

                        <Input
                          className="font-mono text-sm"
                          placeholder="land_area"
                          value={row.variableName}
                          onChange={(event) =>
                            updateVariable(
                              row._localId,
                              "variableName",
                              event.target.value,
                            )
                          }
                        />
                      </div>

                      {/* LABEL */}

                      <div className="col-span-2 space-y-1 sm:col-span-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Label
                        </label>

                        <Input
                          placeholder="Land Area"
                          value={row.label}
                          onChange={(event) =>
                            updateVariable(
                              row._localId,
                              "label",
                              event.target.value,
                            )
                          }
                        />
                      </div>

                      {/* SOURCE */}

                      <div className="col-span-1 space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Source
                        </label>

                        <Select
                          value={row.sourceType}
                          onValueChange={(
                            value: TariffFormulaVariableSourceType,
                          ) => {
                            updateVariable(
                              row._localId,
                              "sourceType",
                              value,
                            );

                            if (value === "CONSTANT") {
                              updateVariable(
                                row._localId,
                                "baseFieldId",
                                null,
                              );
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            {SOURCE_TYPES.map((source) => (
                              <SelectItem
                                key={source.value}
                                value={source.value}
                              >
                                {source.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* DATA TYPE */}

                      <div className="col-span-1 space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Type
                        </label>

                        <Select
                          value={row.dataType}
                          onValueChange={(
                            value: TariffFormulaVariableDataType,
                          ) =>
                            updateVariable(
                              row._localId,
                              "dataType",
                              value,
                            )
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            {DATA_TYPES.map((type) => (
                              <SelectItem
                                key={type}
                                value={type}
                              >
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* DEFAULT VALUE */}

                      <div className="col-span-1 space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          {row.sourceType === "CONSTANT"
                            ? "Value"
                            : "Default"}
                        </label>

                        <Input
                          type="number"
                          placeholder="0"
                          value={row.defaultValue ?? ""}
                          onChange={(event) =>
                            updateVariable(
                              row._localId,
                              "defaultValue",
                              event.target.value
                                ? Number(event.target.value)
                                : null,
                            )
                          }
                        />
                      </div>
                    </div>

                    {/* BASE FIELD */}

                    {row.sourceType === "BASE_FIELD" && (
                      <div className="mt-3 max-w-xs space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Base Field
                        </label>

                        <BaseFieldDropdown
                          value={row.baseFieldId}
                          onChange={(value) =>
                            updateVariable(
                              row._localId,
                              "baseFieldId",
                              value,
                            )
                          }
                          disabled={isDeleting}
                        />
                      </div>
                    )}

                    {/* REQUIRED */}

                    <label className="mt-3 flex w-fit items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox
                        checked={row.isRequired}
                        onCheckedChange={(checked) =>
                          updateVariable(
                            row._localId,
                            "isRequired",
                            Boolean(checked),
                          )
                        }
                      />

                      Required for this formula to run
                    </label>
                  </div>
                );
              })}
            </div>
          )}

          {/* ERROR MESSAGE */}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER ACTIONS */}

      <div className="flex shrink-0 items-center justify-end gap-2 border-t px-5 py-4 sm:px-6">
        <span className="mr-auto hidden text-xs text-muted-foreground sm:inline">
          {rows.length > 0
            ? `${rows.length} variable${
                rows.length === 1 ? "" : "s"
              } · ${unsavedCount} unsaved change${
                unsavedCount === 1 ? "" : "s"
              }`
            : "Nothing to save yet"}
        </span>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
        )}

        <Button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}

          Save Variables
        </Button>
      </div>
    </div>
  );
}