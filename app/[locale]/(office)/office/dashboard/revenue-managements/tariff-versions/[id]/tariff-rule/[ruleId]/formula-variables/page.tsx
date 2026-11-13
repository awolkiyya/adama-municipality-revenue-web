
"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Sigma,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import FormulaVariablesForm from "@/components/forms/FormulaVariablesForm";
import CopyFormulaSheet from "@/components/forms/CopyFormulaSheet";

export default function FormulaVariablesPage() {
  const { id, locale, ruleId } = useParams<{
    id: string;
    locale: string;
    ruleId: string;
  }>();

  const router = useRouter();

  const [copyDialogOpen, setCopyDialogOpen] = useState(false);

  // Current tariff rule is the destination.
  const destinationRuleId = String(ruleId);
  const tariffVersionId = String(id);

  // Tariff rules page URL.
  const rulesUrl =
    `/${locale}/office/dashboard/revenue-managements/` +
    `tariff-versions/${tariffVersionId}`;

  // --------------------------------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------------------------------

  const handleBack = useCallback(() => {
    router.push(rulesUrl);
  }, [router, rulesUrl]);

  // --------------------------------------------------------------------------
  // FORM CALLBACKS
  // --------------------------------------------------------------------------

  const handleSaved = useCallback(() => {
    toast.success("Formula variables saved successfully.");
    router.push(rulesUrl);
  }, [router, rulesUrl]);

  const handleCopied = useCallback(() => {
    setCopyDialogOpen(false);

    toast.success("Formula configuration copied successfully.");

    // Refresh server-rendered data after successful copying.
    router.refresh();
  }, [router]);

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      {/* Back navigation */}
      <Button
        type="button"
        variant="ghost"
        onClick={handleBack}
        className="-ml-3 w-fit"
      >
        <ArrowLeft className="mr-2 size-4" />
        Back to tariff rules
      </Button>

      {/* Page header */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sigma className="size-5" />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight">
                Formula Variables
              </h1>

              <p className="text-sm text-muted-foreground">
                Manage the variables associated with this tariff rule.
              </p>
            </div>
          </div>

          {/* Copy from another rule */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCopyDialogOpen(true)}
          >
            <Copy className="mr-2 size-4" />
            Copy from rule
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Rule ID: {destinationRuleId}
        </p>
      </section>

      {/* Formula variables form */}
      <FormulaVariablesForm
        variant="page"
        tariffRuleId={destinationRuleId}
        enabled
        onSaved={handleSaved}
        onCancel={handleBack}
      />

      {/* Copy formula configuration */}
      {/* <CopyFormulaSheet
        open={copyDialogOpen}
        onOpenChange={setCopyDialogOpen}
        tariffVersionId={tariffVersionId}
        onCopied={handleCopied}
      /> */}
    </div>
  );
}
