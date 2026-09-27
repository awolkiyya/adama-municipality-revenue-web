import {
    Info,
  } from "lucide-react";
  
  import {
    Alert,
    AlertDescription,
    AlertTitle,
  } from "@/components/ui/alert";
  
  import {
    Badge,
  } from "@/components/ui/badge";
  
  import {
    Separator,
  } from "@/components/ui/separator";
import { STEP_HELP, STEPS } from "@/types/assessment/assessment-form.constants";
  

  
  type AssessmentStepHeaderProps = {
    currentStep: number;
    completedRequiredFields: number;
    totalRequiredFields: number;
  };
  
  export function AssessmentStepHeader({
    currentStep,
    completedRequiredFields,
    totalRequiredFields,
  }: AssessmentStepHeaderProps) {
    const step = STEPS[currentStep];
  
    const help = STEP_HELP[step.key];
  
    const progress =
      totalRequiredFields > 0
        ? Math.round(
            (completedRequiredFields /
              totalRequiredFields) *
              100,
          )
        : 100;
  
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant="secondary"
                className="shrink-0"
              >
                Step {currentStep + 1} of{" "}
                {STEPS.length}
              </Badge>
  
              <span className="truncate text-sm text-muted-foreground">
                {step.shortTitle}
              </span>
            </div>
  
            <h2 className="text-xl font-semibold tracking-tight">
              {help.heading}
            </h2>
  
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              {help.body}
            </p>
          </div>
  
          <div className="shrink-0 rounded-lg border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Required fields
            </p>
  
            <p className="mt-0.5 text-sm font-semibold">
              {completedRequiredFields} /{" "}
              {totalRequiredFields}
            </p>
          </div>
        </div>
  
        <Alert>
          <Info className="size-4" />
  
          <AlertTitle>
            Helpful tips
          </AlertTitle>
  
          <AlertDescription>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {help.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
  
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Required field progress
            </span>
  
            <span className="font-medium">
              {progress}%
            </span>
          </div>
  
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Required field progress"
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
  
        <Separator />
      </div>
    );
  }