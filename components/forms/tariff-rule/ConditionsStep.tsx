"use client";

import {
  CircleDot,
  Filter,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { BaseFieldDropdown } from "@/components/input/BasefieldDropDown";

import type {
  BaseField,
  BaseFieldOption,
} from "@/types/revenue/revenue-baseField";

import type {
  BaseFieldDataType,
  Condition,
  TariffRuleFormType,
} from "@/types/revenue/tariff-form";

import {
  CONDITION_OPERATORS,
  getFieldDataType,
} from "@/types/revenue/tariff-form";

type UpdateCondition = <K extends keyof Condition>(
  index: number,
  key: K,
  value: Condition[K],
) => void;

type Props = {
  conditions: TariffRuleFormType["conditions"];
  conditionFieldMeta: Record<number, BaseField | null>;
  updateCondition: UpdateCondition;
  setConditionFieldForRow: (
    index: number,
    field: BaseField | null,
  ) => void;
  addCondition: () => void;
  removeCondition: (index: number) => void;
};

type ConditionValueInputProps = {
  fieldType: BaseFieldDataType;
  value: string;
  options?: BaseFieldOption[];
  onChange: (value: string) => void;
};

function ConditionValueInput({
  fieldType,
  value,
  options = [],
  onChange,
}: ConditionValueInputProps) {
  switch (fieldType) {
    case "SELECT":
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full py-5">
            <SelectValue placeholder="Select value" />
          </SelectTrigger>

          <SelectContent>
            {[...options]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      );

    case "BOOLEAN":
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full py-5">
            <SelectValue placeholder="Select value" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      );

    case "NUMBER":
      return (
        <Input
          type="number"
          step={1}
          placeholder="Enter number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="py-5"
        />
      );

    case "DECIMAL":
      return (
        <Input
          type="number"
          step="0.01"
          placeholder="Enter value"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="py-5"
        />
      );

    case "DATE":
      return (
        <Input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="py-5"
        />
      );

    case "TEXT":
    default:
      return (
        <Input
          type="text"
          placeholder="Enter value"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="py-5"
        />
      );
  }
}

export default function ConditionsStep({
  conditions,
  conditionFieldMeta,
  updateCondition,
  setConditionFieldForRow,
  addCondition,
  removeCondition,
}: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Define when this tariff rule should be applied. Leave
        conditions empty to apply the rule to every matching
        transaction.
      </p>

      {conditions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
          <Filter className="h-6 w-6 text-muted-foreground" />

          <p className="text-sm text-muted-foreground">
            No conditions yet — this rule applies universally.
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={addCondition}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Condition
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {conditions.map((condition, index) => {
              const selectedField =
                conditionFieldMeta[index] ?? null;

              const fieldType = getFieldDataType(selectedField);
              const operators = CONDITION_OPERATORS[fieldType];

              // Keep the saved operator available while metadata loads.
              const availableOperators = [
                ...operators,
                ...(operators.some(
                  (operator) =>
                    operator.value === condition.operator,
                )
                  ? []
                  : [
                      {
                        value: condition.operator,
                        label: condition.operator.replaceAll(
                          "_",
                          " ",
                        ),
                      },
                    ]),
              ];

              const incomplete =
                !condition.fieldId.trim() ||
                !condition.value.trim();

              return (
                <div
                  key={`${condition.fieldId || "new"}-${index}`}
                  className="space-y-3 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {index === 0 ? "IF" : "AND"}
                    </span>

                    {incomplete && (
                      <span className="flex items-center gap-1 text-xs text-amber-700">
                        <CircleDot className="h-3 w-3" />
                        Incomplete
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                    <div className="sm:col-span-4">
                      <BaseFieldDropdown
                        value={condition.fieldId || null}
                        onChange={(value, item) => {
                          const nextFieldId = value ?? "";
                          const fieldChanged =
                            nextFieldId !== condition.fieldId;

                          if (fieldChanged) {
                            updateCondition(index, "value", "");
                            updateCondition(
                              index,
                              "operator",
                              "equals",
                            );
                          }

                          updateCondition(
                            index,
                            "fieldId",
                            nextFieldId,
                          );

                          updateCondition(
                            index,
                            "fieldName",
                            item?.name ?? "",
                          );

                          setConditionFieldForRow(
                            index,
                            item,
                          );
                        }}
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <Select
                        value={condition.operator}
                        onValueChange={(value) =>
                          updateCondition(
                            index,
                            "operator",
                            value as Condition["operator"],
                          )
                        }
                      >
                        <SelectTrigger className="w-full py-5">
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>

                        <SelectContent>
                          {availableOperators.map((operator) => (
                            <SelectItem
                              key={operator.value}
                              value={operator.value}
                            >
                              {operator.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="sm:col-span-3">
                      <ConditionValueInput
                        fieldType={fieldType}
                        value={condition.value}
                        options={selectedField?.options ?? []}
                        onChange={(value) =>
                          updateCondition(index, "value", value)
                        }
                      />
                    </div>

                    <div className="flex justify-end sm:col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove condition"
                        onClick={() => removeCondition(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <p className="inline-block rounded bg-emerald-50 px-2 py-1 font-mono text-xs text-emerald-700">
                    {selectedField?.name ||
                      condition.fieldName ||
                      condition.fieldId ||
                      "field"}{" "}
                    {condition.operator.replaceAll("_", " ")}{" "}
                    {condition.value || "value"}
                  </p>
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addCondition}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Condition
          </Button>
        </>
      )}
    </div>
  );
}