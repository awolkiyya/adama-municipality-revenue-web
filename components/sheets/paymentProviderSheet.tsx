"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import type {
  PaymentProvider,
  PaymentProviderFormData,
} from "@/types/revenue/payment-provider";
import {
  useCreatePaymentProvider,
  useUpdatePaymentProvider,
} from "@/hooks/revenue/payment-provider.hook";
import { CopyCode } from "@/components/copy-code";

// =====================================================
// TYPES
// =====================================================

export type SheetMode = "create" | "edit" | "view";

/** The fee is kept as text while typing, then converted to a number on save. */
type FormValues = {
  name: string;
  code: string;
  fee_percentage: string;
  is_active: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = {
  name: "",
  code: "",
  fee_percentage: "0",
  is_active: true,
};

function toForm(provider: PaymentProvider | null): FormValues {
  if (!provider) return EMPTY_FORM;
  return {
    name: provider.name,
    code: provider.code,
    fee_percentage: String(provider.fee_percentage),
    is_active: provider.is_active,
  };
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) errors.name = "Enter the provider name.";

  if (!values.code.trim()) {
    errors.code = "Enter the provider code.";
  } else if (!/^[A-Z0-9_]{2,20}$/.test(values.code)) {
    errors.code = "Use 2 to 20 capital letters, digits or underscores.";
  }

  const fee = Number(values.fee_percentage);
  if (values.fee_percentage.trim() === "" || Number.isNaN(fee)) {
    errors.fee_percentage = "Enter the fee as a number.";
  } else if (fee < 0 || fee > 100) {
    errors.fee_percentage = "The fee must be between 0 and 100.";
  }

  return errors;
}

/** Reads a Laravel-style 422 response: { message, errors: { field: [msg] } } */
function parseServerError(error: unknown): {
  message: string;
  fields: FormErrors;
} {
  const data = (
    error as {
      response?: {
        data?: { message?: string; errors?: Record<string, string[]> };
      };
    }
  )?.response?.data;

  const fields: FormErrors = {};
  if (data?.errors) {
    for (const [key, messages] of Object.entries(data.errors)) {
      if (key in EMPTY_FORM && messages?.[0]) {
        fields[key as keyof FormValues] = messages[0];
      }
    }
  }

  return {
    message:
      data?.message ??
      (error as Error)?.message ??
      "Could not save the payment provider. Try again.",
    fields,
  };
}

function formatFee(fee: number | string) {
  return `${Number(fee).toFixed(2)}%`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

// =====================================================
// SMALL PIECES
// =====================================================

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3.5 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 font-medium ${
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

// =====================================================
// SHEET: CREATE / EDIT / VIEW
// =====================================================

export function PaymentProviderSheet({
  open,
  mode,
  provider,
  onOpenChange,
  onModeChange,
}: {
  open: boolean;
  mode: SheetMode;
  provider: PaymentProvider | null;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: SheetMode) => void;
}) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Success toasts and cache invalidation live in the hooks.
  const createMutation = useCreatePaymentProvider();
  const updateMutation = useUpdatePaymentProvider();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Reset the form whenever the sheet opens or switches record / mode
  useEffect(() => {
    if (open) {
      setValues(toForm(mode === "create" ? null : provider));
      setErrors({});
      setServerError(null);
    }
  }, [open, mode, provider]);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleError = (error: unknown) => {
    const { message, fields } = parseServerError(error);
    setErrors(fields);
    setServerError(message);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setServerError(null);

    const payload: PaymentProviderFormData = {
      name: values.name.trim(),
      code: values.code.trim(),
      fee_percentage: Number(values.fee_percentage),
      is_active: values.is_active,
    };

    const callbacks = {
      onSuccess: () => onOpenChange(false),
      onError: handleError,
    };

    if (mode === "edit" && provider) {
      updateMutation.mutate({ id: provider.id, data: payload }, callbacks);
      return;
    }

    createMutation.mutate(payload, callbacks);
  };

  const handleCancel = () => {
    if (mode === "edit" && provider) onModeChange("view");
    else onOpenChange(false);
  };

  const title =
    mode === "create"
      ? "Add payment provider"
      : mode === "edit"
        ? "Edit payment provider"
        : (provider?.name ?? "Payment provider");

  const description =
    mode === "create"
      ? "Add an external service that taxpayers can pay through."
      : mode === "edit"
        ? "Update the provider details. Changes apply to new payments."
        : "External payment service";

  // Live example so the fee is easy to understand
  const feeNumber = Number(values.fee_percentage);
  const feeExample =
    !Number.isNaN(feeNumber) && feeNumber >= 0 && feeNumber <= 100
      ? ((1000 * feeNumber) / 100).toFixed(2)
      : null;

  return (
    <Sheet open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {/* ================= VIEW ================= */}
        {mode === "view" && provider && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-2">
              <dl>
                <DetailRow label="Provider">{provider.name}</DetailRow>
                <DetailRow label="Code">
                  <CopyCode value={provider.code} />
                </DetailRow>
                <DetailRow label="Fee">
                  {formatFee(provider.fee_percentage)}
                </DetailRow>
                <DetailRow label="Status">
                  <StatusBadge isActive={provider.is_active} />
                </DetailRow>
                <DetailRow label="Added">
                  {formatDate(provider.created_at)}
                </DetailRow>
              </dl>
            </div>

            <SheetFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => onModeChange("edit")}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit provider
              </Button>
            </SheetFooter>
          </>
        )}

        {/* ============ CREATE / EDIT ============ */}
        {mode !== "view" && (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <Field label="Provider name" htmlFor="name" error={errors.name}>
                <Input
                  id="name"
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Telebirr"
                  autoFocus
                />
              </Field>

              <Field
                label="Code"
                htmlFor="code"
                error={errors.code}
                hint="A short unique identifier, such as TELEBIRR."
              >
                <Input
                  id="code"
                  value={values.code}
                  onChange={(e) =>
                    set(
                      "code",
                      e.target.value.toUpperCase().replace(/\s+/g, "_"),
                    )
                  }
                  placeholder="TELEBIRR"
                  className="font-mono tracking-wide"
                  autoComplete="off"
                />
              </Field>

              <Field
                label="Fee percentage"
                htmlFor="fee_percentage"
                error={errors.fee_percentage}
                hint={
                  feeExample !== null
                    ? `On a payment of 1,000, the provider charge is ${feeExample}.`
                    : undefined
                }
              >
                <div className="relative">
                  <Input
                    id="fee_percentage"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="0.01"
                    value={values.fee_percentage}
                    onChange={(e) => set("fee_percentage", e.target.value)}
                    className="pr-9"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
              </Field>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="pr-4">
                  <p className="text-sm font-medium">Available for payments</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {values.is_active
                      ? "Taxpayers can choose this provider for electronic payments."
                      : "Hidden from taxpayers. Kept for historical records."}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={values.is_active}
                  aria-label="Available for payments"
                  onClick={() => set("is_active", !values.is_active)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    values.is_active
                      ? "bg-emerald-500"
                      : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      values.is_active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {serverError && (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                >
                  {serverError}
                </p>
              )}
            </div>

            <SheetFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Add provider" : "Save changes"}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}