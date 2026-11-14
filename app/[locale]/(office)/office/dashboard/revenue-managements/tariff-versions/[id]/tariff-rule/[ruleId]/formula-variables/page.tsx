"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Code2,
  Copy,
  Info,
  RefreshCw,
  Sigma,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import FormulaVariablesForm from "@/components/forms/FormulaVariablesForm";

import { useTariffRule } from "@/hooks/revenue/revenueTariffRule.hook";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

type TokenType = "variable" | "function" | "number" | "operator" | "space";

type Token = {
  type: TokenType;
  value: string;
};

/**
 * Splits a formula such as `LAND_AREA * RATE * LIZZ_PERIOD` into tokens so
 * variables, numbers and operators can be styled differently.
 */
function tokenize(expression: string): Token[] {
  const parts =
    expression.match(/[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|\s+|[^\sA-Za-z0-9_]/g) ??
    [];

  return parts.map((value, index) => {
    if (/^\s+$/.test(value)) return { type: "space", value };
    if (/^\d/.test(value)) return { type: "number", value };

    if (/^[A-Za-z_]/.test(value)) {
      const next = parts.slice(index + 1).find((p) => !/^\s+$/.test(p));
      return { type: next === "(" ? "function" : "variable", value };
    }

    return { type: "operator", value };
  });
}

const TOKEN_CLASSES: Record<TokenType, string> = {
  variable: "font-semibold text-primary",
  function: "font-semibold text-foreground",
  number: "text-foreground",
  operator: "text-muted-foreground",
  space: "",
};

function useCopyToClipboard(resetAfterMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string, successMessage: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(successMessage);

        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), resetAfterMs);
      } catch {
        toast.error("Could not copy. Please copy it manually.");
      }
    },
    [resetAfterMs],
  );

  return { copied, copy };
}

/* -------------------------------------------------------------------------- */
/* Formula Expression Preview                                                */
/* -------------------------------------------------------------------------- */

type FormulaExpressionPreviewProps = {
  expression: string | null;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

function FormulaExpressionPreview({
  expression,
  isLoading = false,
  isError = false,
  onRetry,
}: FormulaExpressionPreviewProps) {
  const trimmed = expression?.trim() ?? "";
  const hasExpression = trimmed.length > 0;

  const { copied, copy } = useCopyToClipboard();

  const tokens = useMemo(() => tokenize(trimmed), [trimmed]);

  const variables = useMemo(() => {
    const unique = new Set<string>();
    tokens.forEach((t) => {
      if (t.type === "variable") unique.add(t.value);
    });
    return Array.from(unique);
  }, [tokens]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Code2 className="size-4" aria-hidden="true" />
            </div>

            <div>
              <CardTitle className="text-base">Formula expression</CardTitle>
              <CardDescription className="mt-1">
                How the amount is calculated for this tariff rule.
              </CardDescription>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="outline">Read only</Badge>

            {hasExpression && !isLoading && !isError && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copy(trimmed, "Formula copied to clipboard.")}
                aria-label="Copy formula expression"
              >
                {copied ? (
                  <Check className="mr-2 size-4 text-primary" />
                ) : (
                  <Copy className="mr-2 size-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent aria-live="polite" aria-busy={isLoading}>
        {isLoading ? (
          <div className="space-y-3" role="status">
            <span className="sr-only">Loading formula expression</span>
            <div className="h-14 animate-pulse rounded-lg bg-muted" />
            <div className="flex gap-2">
              <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />

              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Couldn&rsquo;t load the formula
                </p>
                <p className="text-sm text-muted-foreground">
                  Check your connection and try again.
                </p>
              </div>
            </div>

            {onRetry && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
              >
                <RefreshCw className="mr-2 size-4" />
                Try again
              </Button>
            )}
          </div>
        ) : hasExpression ? (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border bg-muted/40 p-4">
              <code className="block whitespace-pre-wrap break-words font-mono text-sm leading-7">
                {tokens.map((token, index) => (
                  <span key={index} className={TOKEN_CLASSES[token.type]}>
                    {token.value}
                  </span>
                ))}
              </code>
            </div>

            {variables.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Uses {variables.length}{" "}
                  {variables.length === 1 ? "variable" : "variables"}
                </p>

                <ul className="flex flex-wrap gap-2">
                  {variables.map((name) => (
                    <li key={name}>
                      <Badge
                        variant="secondary"
                        className="font-mono text-xs font-medium"
                      >
                        {name}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-dashed p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

            <div className="space-y-1">
              <p className="text-sm font-medium">No formula yet</p>
              <p className="text-sm text-muted-foreground">
                This tariff rule has no saved formula. Add one from the tariff
                rule settings, then come back to set its variables.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function FormulaVariablesPage() {
  const { id, locale, ruleId } = useParams<{
    id: string;
    locale: string;
    ruleId: string;
  }>();

  const router = useRouter();

  const [copyDialogOpen, setCopyDialogOpen] = useState(false);

  // Bumped after variables are copied in, so the form remounts with fresh data.
  const [formKey, setFormKey] = useState(0);

  // The current tariff rule is the destination rule.
  const destinationRuleId = String(ruleId);
  const tariffVersionId = String(id);

  const { copied: ruleIdCopied, copy: copyText } = useCopyToClipboard();

  /* ------------------------------------------------------------------------ */
  /* TARIFF RULE QUERY                                                        */
  /* ------------------------------------------------------------------------ */

  const {
    data: ruleResponse,
    isLoading: ruleLoading,
    isError: ruleError,
    refetch: refetchRule,
  } = useTariffRule(
    destinationRuleId,
    tariffVersionId,
    Boolean(destinationRuleId && tariffVersionId),
  );

  // The API response contains the tariff rule inside data.
  const tariffRule = ruleResponse?.data;

  // Example: LAND_AREA * RATE * LIZZ_PERIOD
  const expression = tariffRule?.formula ?? null;

  /* ------------------------------------------------------------------------ */
  /* URL                                                                      */
  /* ------------------------------------------------------------------------ */

  const rulesUrl =
    `/${locale}/office/dashboard/revenue-managements/` +
    `tariff-versions/${tariffVersionId}`;

  /* ------------------------------------------------------------------------ */
  /* CALLBACKS                                                                */
  /* ------------------------------------------------------------------------ */

  const handleBack = useCallback(() => {
    router.push(rulesUrl);
  }, [router, rulesUrl]);

  const handleSaved = useCallback(() => {
    toast.success("Formula variables saved.");
    router.push(rulesUrl);
  }, [router, rulesUrl]);


  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-10">
      {/* Back navigation */}
      <Button
        type="button"
        variant="ghost"
        onClick={handleBack}
        className="-ml-3 w-fit text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 size-4" />
        Back to tariff rules
      </Button>

      {/* Page header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sigma className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">
              Formula variables
            </h1>

            <p className="text-sm text-muted-foreground">
              Set the values this tariff rule&rsquo;s formula uses.
            </p>

            <button
              type="button"
              onClick={() =>
                copyText(destinationRuleId, "Rule ID copied to clipboard.")
              }
              className="group inline-flex items-center gap-1.5 rounded-md text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Copy rule ID ${destinationRuleId}`}
            >
              <span>Rule ID</span>
              <span className="font-mono">{destinationRuleId}</span>
              {ruleIdCopied ? (
                <Check className="size-3 text-primary" />
              ) : (
                <Copy className="size-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Formula expression preview */}
      <FormulaExpressionPreview
        expression={expression}
        isLoading={ruleLoading}
        isError={ruleError}
        onRetry={() => {
          void refetchRule();
        }}
      />

      {/* Formula variables form */}
      <FormulaVariablesForm
        key={formKey}
        variant="page"
        tariffRuleId={destinationRuleId}
        enabled
        onSaved={handleSaved}
        onCancel={handleBack}
      />

    </div>
  );
}