"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

import {
  TariffFormulaVariable,
  TariffFormulaVariableSourceType,
  TariffFormulaVariableDataType,
  CreateTariffFormulaVariableRequest,
  UpdateTariffFormulaVariableRequest,
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
|
| Rows in the grid are a superset of the API shape: they carry a stable
| local id (for React keys / focus) plus bookkeeping flags so we know
| which rows are brand new vs. edited vs. untouched when the user saves.
|
*/

interface EditableVariable {
  _localId: string;
  _isNew: boolean;
  _dirty: boolean;

  id?: string;
  /** Backend-generated identifier. Read-only; absent until the row is saved. */
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
  /** The formula expression saved on this tariff rule, e.g. "land_area * rate + base_fee". */
  formula?: string | null;

  /**
   * Gates the initial fetch. A modal wrapper should pass its `open` state
   * so the list isn't fetched while closed; on a page, just leave this
   * true (the default) — it fetches as soon as `tariffRuleId` is present.
   */
  enabled?: boolean;

  /** Called after every row saves successfully. Modal wrappers typically close on this. */
  onSaved?: () => void;

  /** If provided, a Cancel button is rendered next to Save and calls this. Omit to hide it (e.g. on a page with no "cancel" concept). */
  onCancel?: () => void;

  /** "modal" fills its container's height and scrolls internally (for use inside DialogContent). "page" flows naturally with the page and lets the browser scroll. Defaults to "page". */
  variant?: "modal" | "page";

  title?: string;
  description?: string;
  className?: string;
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
function nextLocalId() {
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

function toEditableRow(v: TariffFormulaVariable): EditableVariable {
  return {
    _localId: v.id,
    _isNew: false,
    _dirty: false,
    id: v.id,
    code: v.code,
    variableName: v.variableName,
    label: v.label,
    sourceType: v.sourceType,
    baseFieldId: v.baseFieldId,
    defaultValue: v.defaultValue,
    dataType: v.dataType,
    isRequired: v.isRequired,
    sortOrder: v.sortOrder,
  };
}

// `code` is backend-generated (see CreateTariffFormulaVariableRequest /
// UpdateTariffFormulaVariableRequest — it's intentionally not on either
// type) and must never be sent from the frontend.

function toCreatePayload(
  row: EditableVariable,
  sortOrder: number
): TariffFormulaVariableApiPayload {
  return {
    variable_name: row.variableName.trim(),
    label: row.label.trim(),
    source_type: row.sourceType,
    base_field_id:
      row.sourceType === "BASE_FIELD" ? row.baseFieldId : null,
    default_value: row.defaultValue,
    data_type: row.dataType,
    is_required: row.isRequired,
    sort_order: sortOrder,
  };
}

function toUpdatePayload(
  row: EditableVariable,
  sortOrder: number
): TariffFormulaVariableApiPayload {
  return {
    variable_name: row.variableName.trim(),
    label: row.label.trim(),
    source_type: row.sourceType,
    base_field_id:
      row.sourceType === "BASE_FIELD" ? row.baseFieldId : null,
    default_value: row.defaultValue,
    data_type: row.dataType,
    is_required: row.isRequired,
    sort_order: sortOrder,
  };
}



// Splits a formula string into tokens so recognized variable names can be
// highlighted inline in the formula preview.
function tokenizeFormula(formula: string) {
  return formula.split(/([A-Za-z_][A-Za-z0-9_]*)/g).filter((t) => t !== "");
}

function SourceBadge({ type }: { type: TariffFormulaVariableSourceType }) {
  const isBaseField = type === "BASE_FIELD";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isBaseField
          ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
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

function StatusBadge({ row }: { row: EditableVariable }) {
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

export default function FormulaVariablesForm({
  tariffRuleId,
  formula,
  enabled = true,
  onSaved,
  onCancel,
  variant = "page",
  title = "Formula Variables",
  description = "Define the inputs this tariff rule's formula can reference",
  className,
}: FormulaVariablesFormProps) {
  const [rows, setRows] = useState<EditableVariable[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const initializedRef = useRef(false);

  const { data, isLoading, isError, refetch } = useTariffFormulaVariables(
    tariffRuleId,
    enabled
  );

  const createMutation = useCreateTariffFormulaVariable();
  const updateMutation = useUpdateTariffFormulaVariable();
  const deleteMutation = useDeleteTariffFormulaVariable();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Reset local state whenever this (re)activates for a rule — mirrors the
  // old "modal reopened" reset, but keyed off `enabled`/`tariffRuleId` so it
  // works the same whether this is mounted fresh on a page or toggled by a
  // parent modal.
  useEffect(() => {
    if (enabled) {
      initializedRef.current = false;
      setError(null);
      setDeletingIds(new Set());
    } else {
      setRows([]);
    }
  }, [enabled, tariffRuleId]);

  // Populate rows from the server once, the first time data arrives after
  // activation. Avoids clobbering in-progress edits on background refetches.
  useEffect(() => {
    if (enabled && !initializedRef.current && data) {
      const existing = (data.data ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(toEditableRow);
      setRows(existing);
      initializedRef.current = true;
    }
  }, [enabled, data]);

  const addVariable = () => {
    setRows((prev) => [...prev, createEmptyRow(prev.length)]);
  };

  const updateVariable = <K extends keyof EditableVariable>(
    localId: string,
    field: K,
    value: EditableVariable[K]
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row._localId === localId
          ? { ...row, [field]: value, _dirty: true }
          : row
      )
    );
  };

  const removeVariable = async (localId: string) => {
    const row = rows.find((r) => r._localId === localId);
    if (!row) return;

    // Brand new, unsaved row: just drop it locally.
    if (row._isNew || !row.id) {
      setRows((prev) => prev.filter((r) => r._localId !== localId));
      return;
    }

    // Saved row: this is a real delete, confirm before hitting the API.
    const confirmed = window.confirm(
      `Delete variable "${row.variableName || row.code}"? This can't be undone.`
    );
    if (!confirmed) return;

    setDeletingIds((prev) => new Set(prev).add(localId));
    setError(null);
    try {
      await deleteMutation.mutateAsync({
        tariffRuleId,
        variableId: row.id,
      });
      setRows((prev) => prev.filter((r) => r._localId !== localId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete variable."
      );
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(localId);
        return next;
      });
    }
  };

  const validate = (): string | null => {
    if (rows.length === 0) return "Add at least one variable.";

    const names = new Set<string>();

    for (const row of rows) {
      if (!row.variableName.trim() || !row.label.trim()) {
        return "Every variable needs a variable name and label.";
      }

      if (names.has(row.variableName.trim())) {
        return `Duplicate variable name: "${row.variableName}".`;
      }
      names.add(row.variableName.trim());

      if (row.sourceType === "BASE_FIELD" && !row.baseFieldId) {
        return `"${row.variableName}" is set to Base Field but has no field selected.`;
      }
    }
    return null;
  };


  

  const handleSaveAll = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const creates = rows.filter((r) => r._isNew);
    const updates = rows.filter((r) => !r._isNew && r._dirty && r.id);

    if (creates.length === 0 && updates.length === 0) {
      onSaved?.();
      return;
    }

    const operations: {
      row: EditableVariable;
      kind: "create" | "update";
    }[] = [
      ...creates.map((row) => ({ row, kind: "create" as const })),
      ...updates.map((row) => ({ row, kind: "update" as const })),
    ];

    const results = await Promise.allSettled(
      operations.map(({ row, kind }) => {
        const sortOrder = rows.findIndex((r) => r._localId === row._localId);
        return kind === "create"
          ? createMutation.mutateAsync({
              tariffRuleId,
              data: toCreatePayload(row, sortOrder),
            })
          : updateMutation.mutateAsync({
              tariffRuleId,
              variableId: row.id as string,
              data: toUpdatePayload(row, sortOrder),
            });
      })
    );

    const failed = results
      .map((result, i) => ({ result, op: operations[i] }))
      .filter(({ result }) => result.status === "rejected");

    if (failed.length > 0) {
      const labels = failed
        .map(({ op }) => op.row.code || op.row.variableName || "variable")
        .join(", ");
      setError(
        `Failed to save ${failed.length} variable${
          failed.length === 1 ? "" : "s"
        }: ${labels}. Fix and try again.`
      );
      // Re-sync with the server so successful rows aren't re-submitted.
      await refetch();
      initializedRef.current = false;
      return;
    }

    onSaved?.();
  };

  const requiredCount = rows.filter((r) => r.isRequired).length;
  const knownVariableNames = useMemo(
    () => new Set(rows.map((r) => r.variableName).filter(Boolean)),
    [rows]
  );
  const unreferencedVariables = rows.filter(
    (r) => r.variableName && formula && !formula.includes(r.variableName)
  );

  const isModal = variant === "modal";

  return (
    <div
      className={cn(
        "flex flex-col gap-0",
        isModal && "max-h-[85vh] min-h-0 flex-1 overflow-hidden",
        className
      )}
    >
      <div className="shrink-0 border-b px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sigma className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-none tracking-tight">
              {title}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col",
          isModal ? "min-h-0 flex-1 overflow-y-auto" : "flex-1"
        )}
      >
        {formula && (
          <div className="border-b bg-slate-950 px-5 py-4 sm:px-6">
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Current Formula
            </div>
            <code className="block overflow-x-auto whitespace-pre text-sm leading-relaxed text-slate-100">
              {tokenizeFormula(formula).map((token, i) =>
                knownVariableNames.has(token) ? (
                  <span
                    key={i}
                    className="rounded bg-blue-500/20 px-1 py-0.5 text-blue-300"
                  >
                    {token}
                  </span>
                ) : (
                  <span key={i}>{token}</span>
                )
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

        <div className="flex items-center justify-between border-b bg-muted/40 px-5 py-3 sm:px-6">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {rows.length === 0
              ? "No variables yet"
              : `${rows.length} variable${
                  rows.length === 1 ? "" : "s"
                } · ${requiredCount} required`}
          </span>
          <Button size="sm" onClick={addVariable} disabled={isLoading}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Variable
          </Button>
        </div>

        <div className="flex-1 px-5 py-4 sm:px-6">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading variables…
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm font-medium">
                Couldn't load formula variables
              </p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : rows.length === 0 ? (
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
              <Button size="sm" variant="outline" onClick={addVariable}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add your first variable
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row, index) => {
                const isDeleting = deletingIds.has(row._localId);
                return (
                  <div
                    key={row._localId}
                    className={cn(
                      "rounded-lg border bg-card p-4 transition-opacity",
                      isDeleting && "pointer-events-none opacity-50"
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
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
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-500"
                        onClick={() => removeVariable(row._localId)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      <div className="col-span-1 space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Variable
                        </label>
                        <Input
                          className="font-mono text-sm"
                          placeholder="land_area"
                          value={row.variableName}
                          onChange={(e) =>
                            updateVariable(
                              row._localId,
                              "variableName",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="col-span-2 space-y-1 sm:col-span-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Label
                        </label>
                        <Input
                          placeholder="Land Area"
                          value={row.label}
                          onChange={(e) =>
                            updateVariable(
                              row._localId,
                              "label",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="col-span-1 space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Source
                        </label>
                        <Select
                          value={row.sourceType}
                          onValueChange={(
                            value: TariffFormulaVariableSourceType
                          ) => {
                            updateVariable(row._localId, "sourceType", value);
                            if (value === "CONSTANT") {
                              updateVariable(
                                row._localId,
                                "baseFieldId",
                                null
                              );
                            }
                          }}
                          
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SOURCE_TYPES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-1 space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Type
                        </label>
                        <Select
                          value={row.dataType}
                          onValueChange={(
                            value: TariffFormulaVariableDataType
                          ) =>
                            updateVariable(row._localId, "dataType", value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DATA_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-1 space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          {row.sourceType === "CONSTANT" ? "Value" : "Default"}
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={row.defaultValue ?? ""}
                          onChange={(e) =>
                            updateVariable(
                              row._localId,
                              "defaultValue",
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                        />
                      </div>
                    </div>

                    {row.sourceType === "BASE_FIELD" && (
                      <div className="mt-3 max-w-xs space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Base Field
                        </label>
                        <BaseFieldDropdown
                          value={row.baseFieldId}
                          onChange={(value) =>
                            updateVariable(row._localId, "baseFieldId", value)
                          }
                          disabled={isDeleting}
                        />
                      </div>
                    )}

                    <label className="mt-3 flex w-fit items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox
                        checked={row.isRequired}
                        onCheckedChange={(checked) =>
                          updateVariable(
                            row._localId,
                            "isRequired",
                            Boolean(checked)
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

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t px-5 py-4 sm:px-6">
        <span className="mr-auto hidden text-xs text-muted-foreground sm:inline">
          {rows.length > 0
            ? `${rows.length} variable${rows.length === 1 ? "" : "s"} · ${
                rows.filter((r) => r._isNew || r._dirty).length
              } unsaved change${
                rows.filter((r) => r._isNew || r._dirty).length === 1
                  ? ""
                  : "s"
              }`
            : "Nothing to save yet"}
        </span>
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSaveAll} disabled={isSaving || isLoading}>
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