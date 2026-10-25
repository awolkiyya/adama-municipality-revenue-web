
"use client";

import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Calculator, CalendarClock, Sigma } from "lucide-react";

import { Banner } from "@/components/banner/topBanner";
import { IconBadge } from "@/components/commen/icon-badge";
import { Button } from "@/components/ui/button";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import FormulaVariablesForm from "@/components/forms/FormulaVariablesForm";

export default function FormulaVariablesPage() {
  const { id, locale, ruleId } = useParams<{
    id: string;
    locale: string;
    ruleId: string;
  }>();

  const router = useRouter();

  const rulesUrl =
    `/${locale}/office/dashboard/revenue-managements/` +
    `tariff-versions/${id}`;

  const handleBack = useCallback(() => {
    router.push(rulesUrl);
  }, [router, rulesUrl]);

  const handleSaved = useCallback(() => {
    toast.success("Formula variables saved successfully.");
    router.push(rulesUrl);
  }, [router, rulesUrl]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <Button
        type="button"
        variant="ghost"
        onClick={handleBack}
        className="-ml-3 w-fit"
      >
        <ArrowLeft className="mr-2 size-4" />
        Back to tariff rules
      </Button>
      

      <section className="space-y-2">
        <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sigma className="h-4.5 w-4.5" />
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

        <p className="text-xs text-muted-foreground">
          Rule ID: {ruleId}
        </p>
      </section>

      <FormulaVariablesForm
        variant="page"
        tariffRuleId={ruleId}
        enabled
        onSaved={handleSaved}
        onCancel={handleBack}
      />
    </div>
  );
}
