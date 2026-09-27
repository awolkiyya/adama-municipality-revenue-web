import {
    ArrowLeft,
    ArrowRight,
    Loader2,
    Save,
    Send,
  } from "lucide-react";
  
  import {
    Button,
  } from "@/components/ui/button";
  
  type AssessmentFormActionsProps = {
    currentStep: number;
    totalSteps: number;
  
    isFirstStep: boolean;
    isLastStep: boolean;
  
    canGoNext: boolean;
    canSubmit: boolean;
  
    isSaving: boolean;
    editMode: boolean;
  
    onBack: () => void;
    onNext: () => void;
    onCancel: () => void;
    onSaveDraft: () => void;
    onSubmit: () => void;
  };
  
  export function AssessmentFormActions({
    currentStep,
    totalSteps,
  
    isFirstStep,
    isLastStep,
  
    canGoNext,
    canSubmit,
  
    isSaving,
    editMode,
  
    onBack,
    onNext,
    onCancel,
    onSaveDraft,
    onSubmit,
  }: AssessmentFormActionsProps) {
    return (
      <div className="sticky bottom-0 z-10 border-t bg-background/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
  
            {!isFirstStep && (
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                disabled={isSaving}
              >
                <ArrowLeft className="mr-2 size-4" />
                Back
              </Button>
            )}
          </div>
  
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {!isLastStep && (
              <Button
                type="button"
                onClick={onNext}
                disabled={
                  isSaving ||
                  !canGoNext
                }
              >
                Next
                <ArrowRight className="ml-2 size-4" />
              </Button>
            )}
  
            {isLastStep && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSaveDraft}
                  disabled={
                    isSaving
                  }
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}
  
                  {editMode
                    ? "Save Draft"
                    : "Save Draft"}
                </Button>
  
                <Button
                  type="button"
                  onClick={onSubmit}
                  disabled={
                    isSaving ||
                    !canSubmit
                  }
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 size-4" />
                  )}
  
                  {editMode
                    ? "Update & Submit"
                    : "Submit for Approval"}
                </Button>
              </>
            )}
          </div>
        </div>
  
        <div className="mt-2 text-center text-xs text-muted-foreground">
          Step {currentStep + 1} of{" "}
          {totalSteps}
        </div>
      </div>
    );
  }