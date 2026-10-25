"use client";

import { RevenueService } from "@/types/revenue/assessment";
import { TariffRuleFormType } from "@/types/revenue/tariff-form";


type ExistingRule = {
  id?: string;
  name: string;
  priority: number;
};

type Props = {
  form: TariffRuleFormType;
  updateField: <K extends keyof TariffRuleFormType>(
    key: K,
    value: TariffRuleFormType[K],
  ) => void;
  selectedService: Pick<RevenueService, "id" | "name"> | null;
  setSelectedService: (
    service: Pick<RevenueService, "id" | "name"> | null,
  ) => void;
  priorityCollision?: ExistingRule;
};

export default function RuleInformationStep({
  form,
  updateField,
  selectedService,
  priorityCollision,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Rule name */}
      <div className="space-y-2">
        <label
          htmlFor="rule-name"
          className="text-sm font-medium"
        >
          Rule name <span className="text-destructive">*</span>
        </label>

        <input
          id="rule-name"
          type="text"
          value={form.name}
          onChange={(event) =>
            updateField("name", event.target.value)
          }
          placeholder="e.g. Residential land lease tariff"
          maxLength={150}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        />

        <p className="text-xs text-muted-foreground">
          Use a clear name that identifies the purpose of this tariff rule.
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label
          htmlFor="rule-description"
          className="text-sm font-medium"
        >
          Description
        </label>

        <textarea
          id="rule-description"
          value={form.description}
          onChange={(event) =>
            updateField("description", event.target.value)
          }
          placeholder="Explain when and why this rule applies..."
          rows={3}
          maxLength={1000}
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Revenue service */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Revenue service <span className="text-destructive">*</span>
        </label>

        {/*
          Keep your existing ServiceDropdown here.
          Its item type and props must match your current implementation.
        */}
        <div className="rounded-md border border-dashed border-input p-3">
          <p className="text-sm font-medium">
            {selectedService?.name ?? "No service selected"}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Connect your existing ServiceDropdown component here to select
            a revenue service.
          </p>
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <label
          htmlFor="rule-priority"
          className="text-sm font-medium"
        >
          Priority <span className="text-destructive">*</span>
        </label>

        <input
          id="rule-priority"
          type="number"
          min={1}
          step={1}
          value={form.priority}
          onChange={(event) => {
            const value = Number(event.target.value);

            updateField(
              "priority",
              (Number.isFinite(value) && value >= 1
                ? Math.floor(value)
                : 1) as TariffRuleFormType["priority"],
            );
          }}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        />

        <p className="text-xs text-muted-foreground">
          Define the evaluation priority according to your tariff rules.
        </p>

        {priorityCollision && (
          <p className="text-sm text-destructive">
            Another rule already uses this priority.
          </p>
        )}
      </div>

      {/* Active status */}
      <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
        <div className="space-y-1">
          <label
            htmlFor="rule-active"
            className="text-sm font-medium"
          >
            Active rule
          </label>

          <p className="text-xs text-muted-foreground">
            Enable this rule for evaluation when the backend determines
            it is applicable.
          </p>
        </div>

        <input
          id="rule-active"
          type="checkbox"
          checked={form.isActive}
          onChange={(event) =>
            updateField("isActive", event.target.checked)
          }
          className="size-4 accent-primary"
        />
      </div>
    </div>
  );
}
