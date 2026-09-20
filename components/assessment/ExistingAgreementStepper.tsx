"use client"

import {
  CalendarDays,
  Check,
  CircleDollarSign,
  FileText,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Step } from "@/types/existing-agreement"


interface ExistingAgreementStepperProps {
  currentStep: Step
  onStepChange?: (step: Step) => void
}

const steps = [
  {
    id: 1 as const,
    title: "Agreement",
    description: "Agreement information",
    icon: FileText,
  },
  {
    id: 2 as const,
    title: "Financial Position",
    description: "Historical financials",
    icon: CircleDollarSign,
  },
  {
    id: 3 as const,
    title: "Review & Register",
    description: "Confirm and register",
    icon: CalendarDays,
  },
]

export function ExistingAgreementStepper({
  currentStep,
  onStepChange,
}: ExistingAgreementStepperProps) {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {steps.map((step, index) => {
          const Icon = step.icon

          const isCompleted = currentStep > step.id
          const isCurrent = currentStep === step.id
          const isClickable =
            step.id <= currentStep && !!onStepChange

          return (
            <div
              key={step.id}
              className="flex min-w-0 flex-1 items-center"
            >
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => {
                  if (isClickable) {
                    onStepChange?.(step.id)
                  }
                }}
                className={cn(
                  "flex min-w-0 items-center gap-3 text-left",
                  isClickable && "cursor-pointer",
                  !isClickable && "cursor-default"
                )}
              >
                {/* Step indicator */}
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      !isCompleted &&
                      "border-primary bg-primary/10 text-primary",
                    !isCurrent &&
                      !isCompleted &&
                      "border-muted-foreground/25 bg-muted/40 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                {/* Step information */}
                <div className="min-w-0">
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      isCurrent || isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </button>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-4 hidden h-px flex-1 md:block",
                    currentStep > step.id
                      ? "bg-primary"
                      : "bg-border"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}