
"use client";

import { useCallback, useMemo, useState } from "react";

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

import type { TariffRuleRecord } from "@/types/revenue/tariff-form";
import {
  useCopyTariffFormula,
  useTariffRules,
} from "@/hooks/revenue/revenueTariffRule.hook";

// ============================================================================
// TYPES
// ============================================================================

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

const getRuleName = (rule: TariffRuleRecord): string =>
  rule.name || `Tariff Rule ${rule.id}`;

const getRuleCode = (rule: TariffRuleRecord): string =>
  String(
    (rule as TariffRuleRecord & { code?: string }).code ?? "",
  );

const isFormulaRule = (rule: TariffRuleRecord): boolean => {
  const calculationType =
    rule.calculationType ??
    (rule as TariffRuleRecord & { calculation_type?: string })
      .calculation_type;

  return normalizeCalculationType(calculationType) === "formula";
};

/**
 * Supports common Laravel API response shapes:
 *
 * { data: [...] }
 * { data: { data: [...] } }
 * { data: { data: { data: [...] } } }
 */
function extractRules(result: unknown): TariffRuleRecord[] {
  let current: unknown = result;

  for (let depth = 0; depth < 4; depth++) {
    if (Array.isArray(current)) {
      return current as TariffRuleRecord[];
    }

    if (
      typeof current !== "object" ||
      current === null ||
      !("data" in current)
    ) {
      return [];
    }

    current = (current as { data?: unknown }).data;
  }

  return Array.isArray(current)
    ? (current as TariffRuleRecord[])
    : [];
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
  // --------------------------------------------------------------------------
  // LOCAL UI STATE
  // --------------------------------------------------------------------------

  const [destinationRuleId, setDestinationRuleId] = useState("");
  const [search, setSearch] = useState("");
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  const [copyOptions, setCopyOptions] = useState<CopyOptions>({
    ...INITIAL_COPY_OPTIONS,
  });

  // --------------------------------------------------------------------------
  // REACT QUERY: DESTINATION RULES
  // --------------------------------------------------------------------------

  const {
    data: tariffRulesResponse,
    isLoading: loadingRules,
    isFetching: fetchingRules,
    isError: rulesError,
    error: rulesErrorObject,
    refetch: refetchRules,
  } = useTariffRules({
    tariff_version_id: tariffVersionId,
    per_page: 100,
  });

  // --------------------------------------------------------------------------
  // REACT QUERY: COPY MUTATION
  // --------------------------------------------------------------------------

  const copyFormulaMutation = useCopyTariffFormula();

  const copying = copyFormulaMutation.isPending;

  // --------------------------------------------------------------------------
  // DERIVED RULES
  // --------------------------------------------------------------------------

  const rules = useMemo(() => {
    return extractRules(tariffRulesResponse).filter(
      (rule) =>
        String(rule.id) !== String(sourceRuleId) &&
        isFormulaRule(rule),
    );
  }, [tariffRulesResponse, sourceRuleId]);

  const filteredRules = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rules;
    }

    return rules.filter((rule) => {
      const name = getRuleName(rule).toLowerCase();
      const code = getRuleCode(rule).toLowerCase();

      return name.includes(query) || code.includes(query);
    });
  }, [rules, search]);

  const selectedDestination = useMemo(
    () =>
      rules.find(
        (rule) => String(rule.id) === destinationRuleId,
      ) ?? null,
    [rules, destinationRuleId],
  );

  const selectedCount = Object.values(copyOptions).filter(
    Boolean,
  ).length;

  const allSelected = selectedCount === OPTION_META.length;

  // --------------------------------------------------------------------------
  // RESET
  // --------------------------------------------------------------------------

  const resetSheet = useCallback(() => {
    setDestinationRuleId("");
    setSearch("");
    setConfirmOverwrite(false);
    setCopyOptions({ ...INITIAL_COPY_OPTIONS });
  }, []);

  // --------------------------------------------------------------------------
  // OPEN / CLOSE
  // --------------------------------------------------------------------------

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value && copying) {
        return;
      }

      if (!value) {
        resetSheet();
      }

      onOpenChange(value);
    },
    [copying, onOpenChange, resetSheet],
  );

  // --------------------------------------------------------------------------
  // COPY OPTION HANDLERS
  // --------------------------------------------------------------------------

  const toggleAll = useCallback((checked: boolean) => {
    setCopyOptions({
      variables: checked,
      expression: checked,
      conditions: checked,
    });
  }, []);

  const toggleOption = useCallback(
    (key: CopyOptionKey, checked: boolean) => {
      setCopyOptions((previous) => ({
        ...previous,
        [key]: checked,
      }));
    },
    [],
  );

  // --------------------------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------------------------

  const canSubmit =
    !copying &&
    !loadingRules &&
    !rulesError &&
    Boolean(sourceRuleId) &&
    Boolean(selectedDestination) &&
    selectedCount > 0 &&
    confirmOverwrite &&
    String(sourceRuleId) !== String(destinationRuleId);

  // --------------------------------------------------------------------------
  // COPY FORMULA
  // --------------------------------------------------------------------------

  const handleCopy = useCallback(async () => {
    if (!sourceRuleId || !selectedDestination) {
      return;
    }

    if (String(sourceRuleId) === String(selectedDestination.id)) {
      return;
    }

    if (selectedCount === 0 || !confirmOverwrite) {
      return;
    }

    try {
      await copyFormulaMutation.mutateAsync({
        tariffVersionId,
        sourceRuleId,
        destinationRuleId: String(selectedDestination.id),
        options: copyOptions,
        overwrite: true,
      });

      resetSheet();
      onOpenChange(false);
      onCopied?.();
    } catch {
      // Error notification is handled by useCopyTariffFormula().
    }
  }, [
    sourceRuleId,
    selectedDestination,
    selectedCount,
    confirmOverwrite,
    copyFormulaMutation,
    tariffVersionId,
    copyOptions,
    resetSheet,
    onOpenChange,
    onCopied,
  ]);

  // --------------------------------------------------------------------------
  // ERROR MESSAGE
  // --------------------------------------------------------------------------

  const loadErrorMessage =
    rulesErrorObject instanceof Error
      ? rulesErrorObject.message
      : "Unable to load destination tariff rules.";

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
      >
        {/* HEADER */}
        <SheetHeader className="border-b p-6 text-left">
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Copy className="size-5" />
          </div>

          <SheetTitle>Copy formula configuration</SheetTitle>

          <SheetDescription>
            Reuse a formula setup by copying its selected
            configuration into another rule in this tariff version.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 p-6">
            {/* COPY DIRECTION */}
            <section className="space-y-2" aria-label="Copy direction">
              {/* SOURCE */}
              <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                <Sigma className="mt-0.5 size-4 shrink-0 text-primary" />

                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Copy from
                  </p>

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

              {/* DESTINATION */}
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
                  <p className="text-xs text-muted-foreground">
                    Copy to
                  </p>

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

                {!loadingRules && !rulesError && rules.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {filteredRules.length} of {rules.length}
                  </span>
                )}
              </div>

              {/* SEARCH */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or code"
                  className="pl-9"
                  disabled={
                    loadingRules ||
                    fetchingRules ||
                    copying ||
                    rules.length === 0
                  }
                />
              </div>

              {/* LOADING */}
              {loadingRules && (
                <div className="space-y-2">
                  {[0, 1, 2].map((index) => (
                    <Skeleton
                      key={index}
                      className="h-14 w-full rounded-lg"
                    />
                  ))}
                </div>
              )}

              {/* ERROR */}
              {rulesError && (
                <div className="flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs text-destructive">
                    {loadErrorMessage}
                  </p>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => void refetchRules()}
                    disabled={fetchingRules}
                  >
                    {fetchingRules ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-1.5 size-3.5" />
                    )}
                    Retry
                  </Button>
                </div>
              )}

              {/* EMPTY */}
              {!loadingRules &&
                !rulesError &&
                rules.length === 0 && (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    No other formula rules are available in this
                    tariff version.
                  </p>
                )}

              {/* NO SEARCH RESULTS */}
              {!loadingRules &&
                !rulesError &&
                rules.length > 0 &&
                filteredRules.length === 0 && (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    No rules match &quot;{search}&quot;.
                  </p>
                )}

              {/* RULE LIST */}
              {!loadingRules &&
                !rulesError &&
                filteredRules.length > 0 && (
                  <div
                    role="radiogroup"
                    aria-label="Destination tariff rule"
                    className="max-h-64 space-y-2 overflow-y-auto pr-1"
                  >
                    {filteredRules.map((rule) => {
                      const id = String(rule.id);
                      const selected = id === destinationRuleId;
                      const code = getRuleCode(rule);

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

                            {code && (
                              <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">
                                {code}
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

            {/* COPY OPTIONS */}
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
                    Existing configuration may be replaced
                  </p>

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    The selected items on the destination rule may be
                    overwritten. Review your selection before continuing.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-7">
                <Checkbox
                  id="confirm-overwrite"
                  checked={confirmOverwrite}
                  disabled={copying}
                  onCheckedChange={(checked) =>
                    setConfirmOverwrite(checked === true)
                  }
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

        {/* FOOTER */}
        <SheetFooter className="flex-row justify-end gap-2 border-t p-4 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={copying}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleCopy}
            disabled={!canSubmit}
          >
            {copying ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Copying...
              </>
            ) : (
              <>
                <Copy className="mr-2 size-4" />
                Copy{" "}
                {selectedCount > 0
                  ? `${selectedCount} item${selectedCount > 1 ? "s" : ""}`
                  : "configuration"}
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
