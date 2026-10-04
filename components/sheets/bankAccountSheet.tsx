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
  BankAccount,
  BankAccountFormData,
} from "@/types/revenue/bank-account";
import {
  useCreateBankAccount,
  useUpdateBankAccount,
} from "@/hooks/revenue/bankaccount.hook";
import { CopyAccountNumber } from "@/components/copy-account-number";

// =====================================================
// TYPES
// =====================================================

export type SheetMode = "create" | "edit" | "view";

type FormErrors = Partial<Record<keyof BankAccountFormData, string>>;


const EMPTY_FORM: BankAccountFormData = {
  bank_name: "",
  account_name: "",
  account_number: "",
  currency: "ETB",
  is_active: true,
};

function toForm(account: BankAccount | null): BankAccountFormData {
  if (!account) return EMPTY_FORM;
  return {
    bank_name: account.bank_name,
    account_name: account.account_name,
    account_number: account.account_number,
    currency: account.currency,
    is_active: account.is_active,
  };
}

function validate(values: BankAccountFormData): FormErrors {
  const errors: FormErrors = {};
  if (!values.bank_name.trim()) errors.bank_name = "Enter the bank name.";
  if (!values.account_name.trim())
    errors.account_name = "Enter the account name.";
  if (!values.account_number.trim()) {
    errors.account_number = "Enter the account number.";
  } else if (!/^[A-Za-z0-9]{6,34}$/.test(values.account_number)) {
    errors.account_number = "Use 6 to 34 letters or digits, without spaces.";
  }
  if (!values.currency) errors.currency = "Choose a currency.";
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
        fields[key as keyof BankAccountFormData] = messages[0];
      }
    }
  }

  return {
    message:
      data?.message ??
      (error as Error)?.message ??
      "Could not save the bank account. Try again.",
    fields,
  };
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
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
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

export function BankAccountSheet({
  open,
  mode,
  account,
  onOpenChange,
  onModeChange,
}: {
  open: boolean;
  mode: SheetMode;
  account: BankAccount | null;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: SheetMode) => void;
}) {
  const [values, setValues] = useState<BankAccountFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Success toasts and list/detail cache invalidation live in the hooks.
  const createMutation = useCreateBankAccount();
  const updateMutation = useUpdateBankAccount();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Reset the form whenever the sheet opens or switches record / mode
  useEffect(() => {
    if (open) {
      setValues(toForm(mode === "create" ? null : account));
      setErrors({});
      setServerError(null);
    }
  }, [open, mode, account]);

  const set = <K extends keyof BankAccountFormData>(
    key: K,
    value: BankAccountFormData[K],
  ) => {
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

    const payload: BankAccountFormData = {
      ...values,
      bank_name: values.bank_name.trim(),
      account_name: values.account_name.trim(),
      account_number: values.account_number.trim(),
    };

    const callbacks = {
      onSuccess: () => onOpenChange(false),
      onError: handleError,
    };

    if (mode === "edit" && account) {
      updateMutation.mutate({ id: account.id, data: payload }, callbacks);
      return;
    }

    createMutation.mutate(payload, callbacks);
  };

  const handleCancel = () => {
    if (mode === "edit" && account) onModeChange("view");
    else onOpenChange(false);
  };

  const title =
    mode === "create"
      ? "Add bank account"
      : mode === "edit"
        ? "Edit bank account"
        : (account?.bank_name ?? "Bank account");

  const description =
    mode === "create"
      ? "Add a municipal account that taxpayers can pay into."
      : mode === "edit"
        ? "Update the account details. Changes apply to new payments."
        : (account?.account_name ?? "");

  return (
    <Sheet open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {/* ================= VIEW ================= */}
        {mode === "view" && account && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-2">
              <dl>
                <DetailRow label="Bank">{account.bank_name}</DetailRow>
                <DetailRow label="Account name">
                  {account.account_name}
                </DetailRow>
                <DetailRow label="Account number">
                  <CopyAccountNumber value={account.account_number} />
                </DetailRow>
                <DetailRow label="Currency">
                  <Badge variant="secondary" className="font-mono">
                    {account.currency}
                  </Badge>
                </DetailRow>
                <DetailRow label="Status">
                  <StatusBadge isActive={account.is_active} />
                </DetailRow>
                <DetailRow label="Added">
                  {formatDate(account.created_at)}
                </DetailRow>
              </dl>
            </div>

            <SheetFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => onModeChange("edit")}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit account
              </Button>
            </SheetFooter>
          </>
        )}

        {/* ============ CREATE / EDIT ============ */}
        {mode !== "view" && (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <Field
                label="Bank name"
                htmlFor="bank_name"
                error={errors.bank_name}
              >
                <Input
                  id="bank_name"
                  value={values.bank_name}
                  onChange={(e) => set("bank_name", e.target.value)}
                  placeholder="Commercial Bank of Ethiopia"
                  autoFocus
                />
              </Field>

              <Field
                label="Account name"
                htmlFor="account_name"
                error={errors.account_name}
              >
                <Input
                  id="account_name"
                  value={values.account_name}
                  onChange={(e) => set("account_name", e.target.value)}
                  placeholder="Municipal revenue collection"
                />
              </Field>

              <Field
                label="Account number"
                htmlFor="account_number"
                error={errors.account_number}
              >
                <Input
                  id="account_number"
                  value={values.account_number}
                  onChange={(e) =>
                    set("account_number", e.target.value.replace(/\s+/g, ""))
                  }
                  placeholder="1000123456789"
                  className="font-mono tracking-wide"
                  autoComplete="off"
                />
              </Field>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="pr-4">
                  <p className="text-sm font-medium">Available for payments</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {values.is_active
                      ? "Taxpayers can choose this account for bank transfers."
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
                {mode === "create" ? "Add account" : "Save changes"}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}