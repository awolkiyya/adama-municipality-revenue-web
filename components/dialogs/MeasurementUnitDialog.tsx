
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Loader2,
  Pencil,
  Plus,
  Ruler,
  Save,
  X,
} from "lucide-react";

import type { MeasurementUnit } from "@/types/revenue/revenue-unit";

import { cn } from "@/lib/utils";

// ============================================================
// TYPES
// ============================================================

export type MeasurementUnitDialogMode =
  | "create"
  | "edit"
  | "view";

export type MeasurementUnitFormValues = {
  code: string;
  name: string;
  symbol: string;
  description: string;
  is_active: boolean;
};

type MeasurementUnitDialogProps = {
  /**
   * Controls whether the dialog is open.
   */
  open: boolean;

  /**
   * Dialog open state handler.
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Dialog mode.
   *
   * create → create new measurement unit
   * edit   → update existing measurement unit
   * view   → read-only view
   */
  mode: MeasurementUnitDialogMode;

  /**
   * Existing measurement unit.
   *
   * Required for edit/view.
   * Null for create.
   */
  unit?: MeasurementUnit | null;

  /**
   * Loading state from parent mutation.
   */
  isLoading?: boolean;

  /**
   * Called when create/edit form is submitted.
   */
  onSubmit?: (
    data: MeasurementUnitFormValues,
  ) => void;

  /**
   * Optional custom title.
   */
  title?: string;

  /**
   * Optional custom description.
   */
  description?: string;
};

// ============================================================
// VALIDATION
// ============================================================

const measurementUnitSchema = z.object({
  code: z
    .string()
    .trim()
    .min(
      1,
      "Measurement unit code is required.",
    )
    .max(
      50,
      "Measurement unit code cannot exceed 50 characters.",
    ),

  name: z
    .string()
    .trim()
    .min(
      1,
      "Measurement unit name is required.",
    )
    .max(
      100,
      "Measurement unit name cannot exceed 100 characters.",
    ),

  symbol: z
    .string()
    .trim()
    .min(
      1,
      "Measurement unit symbol is required.",
    )
    .max(
      30,
      "Measurement unit symbol cannot exceed 30 characters.",
    ),

  description: z
    .string()
    .trim()
    .max(
      500,
      "Description cannot exceed 500 characters.",
    ),

  is_active: z.boolean(),
});

// ============================================================
// DEFAULT VALUES
// ============================================================

const DEFAULT_VALUES: MeasurementUnitFormValues = {
  code: "",
  name: "",
  symbol: "",
  description: "",
  is_active: true,
};

// ============================================================
// COMPONENT
// ============================================================

export function MeasurementUnitDialog({
  open,
  onOpenChange,
  mode,
  unit = null,
  isLoading = false,
  onSubmit,
  title,
  description,
}: MeasurementUnitDialogProps) {
  // ==========================================================
  // FORM
  // ==========================================================

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: {
      errors,
      isDirty,
    },
  } = useForm<MeasurementUnitFormValues>({
    resolver: zodResolver(
      measurementUnitSchema,
    ),

    defaultValues:
      DEFAULT_VALUES,
  });

  // ==========================================================
  // DERIVED STATE
  // ==========================================================

  const isCreate =
    mode === "create";

  const isEdit =
    mode === "edit";

  const isView =
    mode === "view";

  /**
   * View mode is read-only.
   *
   * While a mutation is running, the form
   * is also temporarily read-only.
   */
  const isReadOnly =
    isView || isLoading;

  const isActive =
    watch("is_active");

  // ==========================================================
  // INITIALIZE FORM
  // ==========================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    // --------------------------------------------------------
    // CREATE
    // --------------------------------------------------------

    if (mode === "create") {
      reset({
        ...DEFAULT_VALUES,
      });

      return;
    }

    // --------------------------------------------------------
    // EDIT / VIEW
    // --------------------------------------------------------

    if (unit) {
      reset({
        code:
          unit.code ?? "",

        name:
          unit.name ?? "",

        symbol:
          unit.symbol ?? "",

        description:
          unit.description ?? "",

        is_active:
          unit.is_active ?? true,
      });
    }
  }, [
    open,
    mode,
    unit,
    reset,
  ]);

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const submitForm = (
    data: MeasurementUnitFormValues,
  ) => {
    if (isView) {
      return;
    }

    onSubmit?.(data);
  };

  // ==========================================================
  // DIALOG TEXT
  // ==========================================================

  const dialogTitle =
    title ??
    (isCreate
      ? "Create Measurement Unit"
      : isEdit
        ? "Edit Measurement Unit"
        : "Measurement Unit");

  const dialogDescription =
    description ??
    (isCreate
      ? "Create a measurement unit used for revenue calculations and assessments."
      : isEdit
        ? "Update the measurement unit configuration."
        : "View measurement unit details.");

  // ==========================================================
  // CLOSE
  // ==========================================================

  const handleClose = (
    nextOpen: boolean,
  ) => {
    if (isLoading) {
      return;
    }

    onOpenChange(nextOpen);
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
    >
      <DialogContent
        className="
          w-[calc(100%-2rem)]
          max-w-lg
          gap-0
          overflow-hidden
          p-0
        "
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <DialogHeader
          className="
            border-b
            px-6
            py-5
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            {/* ICON */}

            <div
              className="
                flex
                size-10
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-primary/10
                text-primary
              "
            >
              {isCreate ? (
                <Plus className="size-5" />
              ) : isEdit ? (
                <Pencil className="size-5" />
              ) : (
                <Ruler className="size-5" />
              )}
            </div>

            {/* TITLE */}

            <div
              className="
                min-w-0
                flex-1
              "
            >
              <DialogTitle>
                {dialogTitle}
              </DialogTitle>

              <DialogDescription
                className="
                  mt-1
                "
              >
                {dialogDescription}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ==================================================
            FORM
        ================================================== */}

        <form
          onSubmit={handleSubmit(
            submitForm,
          )}
        >
          <div
            className="
              max-h-[65vh]
              space-y-5
              overflow-y-auto
              px-6
              py-6
            "
          >
            {/* ==============================================
                CODE
            ============================================== */}

            <div
              className="
                space-y-2
              "
            >
              <Label
                htmlFor="measurement-unit-code"
              >
                Code

                <span
                  className="
                    ml-1
                    text-destructive
                  "
                >
                  *
                </span>
              </Label>

              <Input
                id="measurement-unit-code"
                placeholder="e.g. SQM"
                disabled={
                  isReadOnly
                }
                {...register(
                  "code",
                )}
              />

              {errors.code && (
                <p
                  className="
                    text-xs
                    text-destructive
                  "
                >
                  {
                    errors.code
                      .message
                  }
                </p>
              )}
            </div>

            {/* ==============================================
                NAME
            ============================================== */}

            <div
              className="
                space-y-2
              "
            >
              <Label
                htmlFor="measurement-unit-name"
              >
                Name

                <span
                  className="
                    ml-1
                    text-destructive
                  "
                >
                  *
                </span>
              </Label>

              <Input
                id="measurement-unit-name"
                placeholder="e.g. Square Meter"
                disabled={
                  isReadOnly
                }
                {...register(
                  "name",
                )}
              />

              {errors.name && (
                <p
                  className="
                    text-xs
                    text-destructive
                  "
                >
                  {
                    errors.name
                      .message
                  }
                </p>
              )}
            </div>

            {/* ==============================================
                SYMBOL
            ============================================== */}

            <div
              className="
                space-y-2
              "
            >
              <Label
                htmlFor="measurement-unit-symbol"
              >
                Symbol

                <span
                  className="
                    ml-1
                    text-destructive
                  "
                >
                  *
                </span>
              </Label>

              <Input
                id="measurement-unit-symbol"
                placeholder="e.g. m²"
                disabled={
                  isReadOnly
                }
                {...register(
                  "symbol",
                )}
              />

              {errors.symbol && (
                <p
                  className="
                    text-xs
                    text-destructive
                  "
                >
                  {
                    errors.symbol
                      .message
                  }
                </p>
              )}
            </div>

            {/* ==============================================
                DESCRIPTION
            ============================================== */}

            <div
              className="
                space-y-2
              "
            >
              <Label
                htmlFor="measurement-unit-description"
              >
                Description
              </Label>

              <Textarea
                id="measurement-unit-description"
                placeholder="Describe this measurement unit..."
                disabled={
                  isReadOnly
                }
                rows={4}
                {...register(
                  "description",
                )}
              />

              {errors.description && (
                <p
                  className="
                    text-xs
                    text-destructive
                  "
                >
                  {
                    errors
                      .description
                      .message
                  }
                </p>
              )}
            </div>

            {/* ==============================================
                STATUS
            ============================================== */}

            <div
              className="
                rounded-lg
                border
                p-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >
                <div
                  className="
                    min-w-0
                  "
                >
                  <Label>
                    Status
                  </Label>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-muted-foreground
                    "
                  >
                    {isActive
                      ? "This measurement unit is active."
                      : "This measurement unit is inactive."}
                  </p>
                </div>

                {/* STATUS */}

                <label
                  className="
                    inline-flex
                    cursor-pointer
                    items-center
                  "
                >
                  <input
                    type="checkbox"
                    className="
                      peer
                      sr-only
                    "
                    disabled={
                      isReadOnly
                    }
                    {...register(
                      "is_active",
                    )}
                  />

                  <div
                    className="
                      relative
                      h-6
                      w-11
                      rounded-full
                      bg-muted
                      transition-colors
                      peer-checked:bg-primary
                      peer-focus-visible:ring-2
                      peer-focus-visible:ring-ring
                      peer-focus-visible:ring-offset-2
                      after:absolute
                      after:left-[2px]
                      after:top-[2px]
                      after:size-5
                      after:rounded-full
                      after:bg-background
                      after:transition-transform
                      after:content-['']
                      peer-checked:after:translate-x-5
                    "
                  />
                </label>
              </div>
            </div>

            {/* ==============================================
                VIEW INFORMATION
            ============================================== */}

            {isView && unit && (
              <div
                className="
                  rounded-lg
                  bg-muted/50
                  p-4
                  text-xs
                  text-muted-foreground
                "
              >
                <div
                  className="
                    grid
                    grid-cols-2
                    gap-4
                  "
                >
                  {/* ID */}

                  <div>
                    <p>
                      Unit ID
                    </p>

                    <p
                      className="
                        mt-1
                        break-all
                        font-medium
                        text-foreground
                      "
                    >
                      {unit.id}
                    </p>
                  </div>

                  {/* CODE */}

                  <div>
                    <p>
                      Code
                    </p>

                    <p
                      className="
                        mt-1
                        font-medium
                        text-foreground
                      "
                    >
                      {unit.code}
                    </p>
                  </div>

                  {/* CREATED */}

                  {unit.created_at && (
                    <div>
                      <p>
                        Created
                      </p>

                      <p
                        className="
                          mt-1
                          font-medium
                          text-foreground
                        "
                      >
                        {new Date(
                          unit.created_at,
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* UPDATED */}

                  {unit.updated_at && (
                    <div>
                      <p>
                        Updated
                      </p>

                      <p
                        className="
                          mt-1
                          font-medium
                          text-foreground
                        "
                      >
                        {new Date(
                          unit.updated_at,
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <DialogFooter
            className="
              border-t
              px-6
              py-4
            "
          >
            {/* ==============================================
                VIEW MODE
            ============================================== */}

            {isView ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  handleClose(false)
                }
                disabled={
                  isLoading
                }
              >
                <X className="size-4" />

                Close
              </Button>
            ) : (
              <>
                {/* ==========================================
                    CANCEL
                ========================================== */}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    handleClose(false)
                  }
                  disabled={
                    isLoading
                  }
                >
                  Cancel
                </Button>

                {/* ==========================================
                    SUBMIT
                ========================================== */}

                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    !isDirty
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2
                        className="
                          size-4
                          animate-spin
                        "
                      />

                      {isCreate
                        ? "Creating..."
                        : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />

                      {isCreate
                        ? "Create Unit"
                        : "Save Changes"}
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
