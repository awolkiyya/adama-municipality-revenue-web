"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Copy,
  Loader2,
  RefreshCw,
  Search,
  Sigma,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface TariffRule {
  id: string;
  name?: string | null;
  code?: string | null;
  calculation_type?: string | null;
  calculationType?: string | null;
}

interface CopyFormulaSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tariffVersionId: string;
  sourceRuleId: string | null;
  sourceRuleName: string;
  onCopied?: () => void;
}

type CopyOptionKey = "variables" | "expression" | "conditions";
type CopyOptions = Record<CopyOptionKey, boolean>;

// ============================================================================
// CONSTANTS
// ============================================================================

const INITIAL_COPY_OPTIONS: CopyOptions = {
  variables: true,
  expression: true,
  conditions: true,
};

const OPTION_META: {
  key: CopyOptionKey;
  label: string;
  description: string;
}[] = [
  {
    key: "variables",
    label: "Formula variables",
    description: "Variable names, sources, types and default values.",
  },
  {
    key: "expression",
    label: "Formula expression",
    description: "The mathematical expression used for calculation.",
  },
  {
    key: "conditions",
    label: "Formula conditions",
    description: "Conditions that determine when the formula applies.",
  },
];

// ============================================================================
// HELPERS
// ============================================================================

const normalizeCalculationType = (value: unknown): string =>
  String(value ?? "").trim().toLowerCase();

const getRuleName = (rule: TariffRule): string =>
  rule.name || rule.code || `Tariff Rule ${rule.id}`;

const isFormulaRule = (rule: TariffRule): boolean =>
  normalizeCalculationType(rule.calculation_type ?? rule.calculationType) ===
  "formula";

function getRulesFromResponse(result: unknown): TariffRule[] {
  if (typeof result !== "object" || result === null || !("data" in result)) {
    return [];
  }

  const responseData = (result as { data?: unknown }).data;

  if (Array.isArray(responseData)) return responseData as TariffRule[];

  if (
    typeof responseData === "object" &&
    responseData !== null &&
    "data" in responseData
  ) {
    const nested = (responseData as { data?: unknown }).data;
    return Array.isArray(nested) ? (nested as TariffRule[]) : [];
  }

  return [];
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CopyFormulaSheet({
  open,
  onOpenChange,
  tariffVersionId,
  sourceRuleId,
  sourceRuleName,
  onCopied,
}: CopyFormulaSheetProps) {
  const [rules, setRules] = useState<TariffRule[]>([]);
  const [destinationRuleId, setDestinationRuleId] = useState("");
  const [search, setSearch] = useState("");
  const [loadingRules, setLoadingRules] = useState(false);
  const [copying, setCopying] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [copyOptions, setCopyOptions] = useState<CopyOptions>({
    ...INITIAL_COPY_OPTIONS,
  });

  // --------------------------------------------------------------------------
  // LOAD DESTINATION RULES
  // --------------------------------------------------------------------------

  const loadRules = useCallback(
    async (signal?: AbortSignal) => {
      if (!tariffVersionId || !sourceRuleId) {
        setRules([]);
        return;
      }

      setLoadingRules(true);
      setLoadError(null);

      try {
        // Replace with your actual route / API service if it differs.
        const response = await fetch(
          `/api/v1/revenue/tariff-versions/${encodeURIComponent(
            tariffVersionId,
          )}/tariff-rules`,
          {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
            signal,
          },
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(result?.message || "Unable to load tariff rules.");
        }

        const destinationRules = getRulesFromResponse(result).filter(
          (rule) =>
            String(rule.id) !== String(sourceRuleId) && isFormulaRule(rule),
        );

        if (signal?.aborted) return;

        setRules(destinationRules);
        setDestinationRuleId((current) =>
          destinationRules.some((r) => String(r.id) === current)
            ? current
            : "",
        );
      } catch (error) {
        if (signal?.aborted) return;
        console.error("Failed to load destination tariff rules:", error);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load destination tariff rules.",
        );
        setRules([]);
      } finally {
        if (!signal?.aborted) setLoadingRules(false);
      }
    },
    [tariffVersionId, sourceRuleId],
  );

  useEffect(() => {
    if (!open || !sourceRuleId) return;
    const controller = new AbortController();
    loadRules(controller.signal);
    return () => controller.abort();
  }, [open, sourceRuleId, loadRules]);

  // --------------------------------------------------------------------------
  // RESET + VISIBILITY
  // --------------------------------------------------------------------------

  const resetSheet = useCallback(() => {
    setDestinationRuleId("");
    setSearch("");
    setConfirmOverwrite(false);
    setCopyOptions({ ...INITIAL_COPY_OPTIONS });
    setLoadError(null);
    setRules([]);
  }, []);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value && copying) return;
      if (!value) resetSheet();
      onOpenChange(value);
    },
    [copying, onOpenChange, resetSheet],
  );

  // --------------------------------------------------------------------------
  // DERIVED STATE
  // --------------------------------------------------------------------------

  const filteredRules = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rules;
    return rules.filter((rule) =>
      `${rule.name ?? ""} ${rule.code ?? ""}`.toLowerCase().includes(query),
    );
  }, [rules, search]);

  const selectedDestination = useMemo(
    () => rules.find((r) => String(r.id) === destinationRuleId) ?? null,
    [rules, destinationRuleId],
  );

  const selectedCount = Object.values(copyOptions).filter(Boolean).length;
  const allSelected = selectedCount === OPTION_META.length;

  const toggleAll = (checked: boolean) =>
    setCopyOptions({
      variables: checked,
      expression: checked,
      conditions: checked,
    });

  const toggleOption = (key: CopyOptionKey, checked: boolean) =>
    setCopyOptions((prev) => ({ ...prev, [key]: checked }));

  const canSubmit =
    !copying &&
    !loadingRules &&
    !loadError &&
    Boolean(sourceRuleId) &&
    Boolean(destinationRuleId) &&
    selectedCount > 0 &&
    confirmOverwrite;

  // --------------------------------------------------------------------------
  // COPY
  // --------------------------------------------------------------------------

  const handleCopy = useCallback(async () => {
    if (!sourceRuleId) {
      toast.error("The source tariff rule is missing.");
      return;
    }
    if (!destinationRuleId) {
      toast.error("Please select a destination tariff rule.");
      return;
    }
    if (sourceRuleId === destinationRuleId) {
      toast.error("Source and destination rules cannot be the same.");
      return;
    }
    if (!Object.values(copyOptions).some(Boolean)) {
      toast.error("Select at least one configuration to copy.");
      return;
    }

    setCopying(true);

    try {
      // Proposed API contract. Confirm the actual Laravel route before production.
      const response = await fetch(
        `/api/v1/revenue/tariff-versions/${encodeURIComponent(
          tariffVersionId,
        )}/tariff-rules/${encodeURIComponent(destinationRuleId)}/copy-formula`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source_rule_id: sourceRuleId,
            options: copyOptions,
          }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || "Failed to copy formula configuration.",
        );
      }

      toast.success(
        result?.message || "Formula configuration copied successfully.",
      );

      resetSheet();
      onOpenChange(false);
      onCopied?.();
    } catch (error) {
      console.error("Formula copy failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to copy formula configuration.",
      );
    } finally {
      setCopying(false);
    }
  }, [
    sourceRuleId,
    destinationRuleId,
    copyOptions,
    tariffVersionId,
    resetSheet,
    onOpenChange,
    onCopied,
  ]);

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b p-6 text-left">
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Copy className="size-5" />
          </div>
          <SheetTitle>Copy formula configuration</SheetTitle>
          <SheetDescription>
            Reuse a formula setup by copying it into another rule in this
            tariff version.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 p-6">
            {/* FROM → TO SUMMARY */}
            <section className="space-y-2" aria-label="Copy direction">
              <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                <Sigma className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">Copy from</p>
                  <p className="break-words text-sm font-medium">
                    {sourceRuleName || "Selected formula rule"}
                  </p>
                  <p className="break-all font-mono text-xs text-muted-foreground">
                    {sourceRuleId || "No source rule selected"}
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="size-4 text-muted-foreground" />
              </div>

              <div
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                  selectedDestination
                    ? "border-primary/30 bg-primary/5"
                    : "border-dashed",
                )}
              >
                <CheckCircle2
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    selectedDestination
                      ? "text-primary"
                      : "text-muted-foreground/50",
                  )}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">Copy to</p>
                  {selectedDestination ? (
                    <>
                      <p className="break-words text-sm font-medium">
                        {getRuleName(selectedDestination)}
                      </p>
                      <Badge variant="secondary" className="font-normal">
                        Formula
                      </Badge>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Choose a destination below
                    </p>
                  )}
                </div>
              </div>
            </section>

            <Separator />

            {/* DESTINATION PICKER */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Destination tariff rule</Label>
                {!loadingRules && rules.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {filteredRules.length} of {rules.length}
                  </span>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or code"
                  className="pl-9"
                  disabled={loadingRules || copying || rules.length === 0}
                />
              </div>

              {loadingRules && (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              )}

              {loadError && (
                <div className="flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs text-destructive">{loadError}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => loadRules()}
                    disabled={loadingRules}
                  >
                    <RefreshCw className="mr-1.5 size-3.5" />
                    Retry
                  </Button>
                </div>
              )}

              {!loadingRules && !loadError && rules.length === 0 && (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No other formula rules are available in this tariff version.
                </p>
              )}

              {!loadingRules &&
                !loadError &&
                rules.length > 0 &&
                filteredRules.length === 0 && (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    No rules match “{search}”.
                  </p>
                )}

              {!loadingRules && filteredRules.length > 0 && (
                <div
                  role="radiogroup"
                  aria-label="Destination tariff rule"
                  className="max-h-64 space-y-2 overflow-y-auto pr-1"
                >
                  {filteredRules.map((rule) => {
                    const id = String(rule.id);
                    const selected = id === destinationRuleId;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={copying}
                        onClick={() => setDestinationRuleId(id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                          "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selected && "border-primary bg-primary/5",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-full border",
                            selected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40",
                          )}
                        >
                          {selected && (
                            <span className="size-1.5 rounded-full bg-primary-foreground" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {getRuleName(rule)}
                          </span>
                          {rule.code && rule.name && (
                            <span className="block truncate font-mono text-xs text-muted-foreground">
                              {rule.code}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <Separator />

            {/* WHAT TO COPY */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">What to copy</h4>
                  <p className="text-xs text-muted-foreground">
                    {selectedCount} of {OPTION_META.length} selected
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={copying}
                  onClick={() => toggleAll(!allSelected)}
                >
                  {allSelected ? "Clear all" : "Select all"}
                </Button>
              </div>

              <div className="divide-y rounded-lg border">
                {OPTION_META.map(({ key, label, description }) => (
                  <div key={key} className="flex items-start gap-3 p-3">
                    <Checkbox
                      id={`copy-${key}`}
                      checked={copyOptions[key]}
                      disabled={copying}
                      onCheckedChange={(checked) =>
                        toggleOption(key, checked === true)
                      }
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <Label
                        htmlFor={`copy-${key}`}
                        className="cursor-pointer text-sm font-medium"
                      >
                        {label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* OVERWRITE CONFIRMATION */}
            <section className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    This may replace existing configuration
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Selected items on the destination rule can be overwritten.
                    The server checks existing data before applying changes.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-7">
                <Checkbox
                  id="confirm-overwrite"
                  checked={confirmOverwrite}
                  disabled={copying}
                  onCheckedChange={(c) => setConfirmOverwrite(c === true)}
                />
                <Label
                  htmlFor="confirm-overwrite"
                  className="cursor-pointer text-xs"
                >
                  I understand and want to continue
                </Label>
              </div>
            </section>
          </div>
        </ScrollArea>

        <SheetFooter className="flex-row justify-end gap-2 border-t p-4 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={copying}
          >
            Cancel
          </Button>

          <Button type="button" onClick={handleCopy} disabled={!canSubmit}>
            {copying ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Copying...
              </>
            ) : (
              <>
                <Copy className="mr-2 size-4" />
                Copy {selectedCount > 0 ? `${selectedCount} item${selectedCount > 1 ? "s" : ""}` : "configuration"}
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}