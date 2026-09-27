import {
    Check,
    Lock,
  } from "lucide-react";
  
  import {
    cn,
  } from "@/lib/utils";
  
  import {
    Button,
  } from "@/components/ui/button";
import { StepKey } from "@/types/assessment/assessment-form.types";
import { STEPS } from "@/types/assessment/assessment-form.constants";
  

  
  type AssessmentStepperProps = {
    currentStep: number;
    furthestStep: number;
    onStepChange: (
      step: number,
    ) => void;
    isStepComplete: (
      stepKey: StepKey,
    ) => boolean;
  };
  
  export function AssessmentStepper({
    currentStep,
    furthestStep,
    onStepChange,
    isStepComplete,
  }: AssessmentStepperProps) {
    return (
      <aside className="w-full shrink-0 lg:w-64">
        <div className="rounded-xl border bg-card p-3">
          <div className="mb-3 px-2">
            <p className="text-sm font-semibold">
              Assessment Progress
            </p>
  
            <p className="mt-1 text-xs text-muted-foreground">
              Complete each section before
              submitting.
            </p>
          </div>
  
          <nav
            aria-label="Assessment steps"
            className="space-y-1"
          >
            {STEPS.map(
              (step, index) => {
                const Icon = step.icon;
  
                const isCurrent =
                  currentStep === index;
  
                const isReached =
                  index <= furthestStep;
  
                const isComplete =
                  isStepComplete(
                    step.key,
                  );
  
                const isLocked =
                  !isReached;
  
                return (
                  <div
                    key={step.key}
                    className="relative"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isLocked}
                      onClick={() =>
                        onStepChange(
                          index,
                        )
                      }
                      className={cn(
                        "relative h-auto w-full justify-start gap-3 rounded-lg px-3 py-3 text-left",
                        isCurrent &&
                          "bg-accent text-accent-foreground",
                        !isCurrent &&
                          isReached &&
                          "hover:bg-muted",
                        isLocked &&
                          "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                          isCurrent &&
                            "border-primary bg-primary text-primary-foreground",
                          isComplete &&
                            !isCurrent &&
                            "border-primary/30 bg-primary/10 text-primary",
                          !isCurrent &&
                            !isComplete &&
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {isComplete &&
                        !isCurrent ? (
                          <Check className="size-4" />
                        ) : isLocked ? (
                          <Lock className="size-3.5" />
                        ) : (
                          <Icon className="size-4" />
                        )}
                      </span>
  
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm font-medium",
                            isCurrent &&
                              "text-foreground",
                          )}
                        >
                          {step.title}
                        </span>
  
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {isComplete
                            ? "Complete"
                            : isLocked
                              ? "Locked"
                              : `Step ${
                                  index + 1
                                }`}
                        </span>
                      </span>
                    </Button>
  
                    {index <
                      STEPS.length - 1 && (
                      <div
                        className={cn(
                          "absolute left-[1.15rem] top-[3.35rem] h-2 w-px",
                          index <
                            furthestStep
                            ? "bg-primary/40"
                            : "bg-border",
                        )}
                      />
                    )}
                  </div>
                );
              },
            )}
          </nav>
        </div>
      </aside>
    );
  }