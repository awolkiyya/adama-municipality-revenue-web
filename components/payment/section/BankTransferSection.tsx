"use client";

import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  FileText,
  Upload,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CopyAccountNumber,
  maskAccountNumber,
} from "@/components/copy-account-number";

import type { BankAccount } from "@/types/revenue/bank-account";

interface BankTransferSectionProps {
  banks: BankAccount[];
  selectedBank: BankAccount | null;
  onBankChange: (bank: BankAccount) => void;
  transferReference: string;
  onTransferReferenceChange: (value: string) => void;
  transferDate: string;
  onTransferDateChange: (value: string) => void;
  evidence: File | null;
  onEvidenceChange: (file: File | null) => void;
  evidenceMaxMb?: number;
}

// The whole card is a button, so it must not contain another button.
// It shows the masked number only. The full number, with copy, is in the
// account details panel below once an account is selected.
function BankOption({
  bank,
  selected,
  onClick,
}: {
  bank: BankAccount;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "w-full rounded-xl border p-4 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected
          ? "border-primary bg-primary/5"
          : "hover:bg-muted/50",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            selected
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          ].join(" ")}
        >
          <Building2 className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {bank.bank_name}
              </p>

              <p className="mt-1 truncate text-sm text-muted-foreground">
                {bank.account_name}
              </p>
            </div>

            {selected && (
              <CheckCircle2 className="size-5 shrink-0 text-primary" />
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="font-mono text-sm tabular-nums text-muted-foreground">
              {maskAccountNumber(bank.account_number)}
            </p>

            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              {bank.currency}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function BankDetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <div className="flex min-w-0 items-center justify-end text-right text-sm font-medium">
        {children}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BankTransferSection({
  banks,
  selectedBank,
  onBankChange,
  transferReference,
  onTransferReferenceChange,
  transferDate,
  onTransferDateChange,
  evidence,
  onEvidenceChange,
  evidenceMaxMb = 5,
}: BankTransferSectionProps) {
  const [fileError, setFileError] = useState<string | null>(
    null,
  );

  const handleEvidenceChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      onEvidenceChange(null);
      setFileError(null);
      return;
    }

    const maxBytes =
      evidenceMaxMb * 1024 * 1024;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      setFileError(
        "Please upload a JPG, PNG, or PDF file.",
      );

      event.target.value = "";
      onEvidenceChange(null);

      return;
    }

    if (file.size > maxBytes) {
      setFileError(
        `File size must not exceed ${evidenceMaxMb} MB.`,
      );

      event.target.value = "";
      onEvidenceChange(null);

      return;
    }

    setFileError(null);
    onEvidenceChange(file);
  };

  if (banks.length === 0) {
    return (
      <section className="rounded-xl border bg-card">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">
            Bank transfer
          </h2>
        </div>

        <div className="p-5">
          <div className="rounded-lg border border-dashed px-4 py-6 text-center">
            <p className="text-sm font-medium">
              No bank account available
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Bank transfer is currently unavailable.
              Please choose another payment method.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b px-5 py-4">
        <h2 className="text-sm font-semibold">
          Bank transfer
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Transfer the payment to a municipal bank account,
          then submit the transfer details for verification.
        </p>
      </div>

      <div className="space-y-5 p-5">
        {/* Bank accounts */}
        <div className="space-y-3">
          <div>
            <Label>Municipal bank account</Label>

            <p className="mt-1 text-xs text-muted-foreground">
              Choose the account you will transfer the money
              to.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {banks.map((bank) => (
              <BankOption
                key={bank.id}
                bank={bank}
                selected={
                  selectedBank?.id === bank.id
                }
                onClick={() =>
                  onBankChange(bank)
                }
              />
            ))}
          </div>
        </div>

        {/* Selected account details */}
        {selectedBank && (
          <div className="rounded-xl border bg-background">
            <div className="border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />

                <p className="text-sm font-medium">
                  Account details
                </p>
              </div>
            </div>

            <div className="divide-y">
              <BankDetailRow label="Bank">
                {selectedBank.bank_name}
              </BankDetailRow>

              <BankDetailRow label="Account name">
                {selectedBank.account_name}
              </BankDetailRow>

              <BankDetailRow label="Account number">
                <CopyAccountNumber
                  key={selectedBank.id}
                  value={selectedBank.account_number}
                />
              </BankDetailRow>

              <BankDetailRow label="Currency">
                {selectedBank.currency}
              </BankDetailRow>
            </div>
          </div>
        )}

        {/* Transfer reference */}
        <div className="space-y-2">
          <Label htmlFor="transfer-reference">
            Transfer reference
          </Label>

          <Input
            id="transfer-reference"
            value={transferReference}
            onChange={(event) =>
              onTransferReferenceChange(
                event.target.value,
              )
            }
            placeholder="Enter bank transfer reference"
            autoComplete="off"
          />

          <p className="text-xs text-muted-foreground">
            Enter the reference or transaction number
            shown on your bank receipt.
          </p>
        </div>

        {/* Transfer date */}
        <div className="space-y-2">
          <Label htmlFor="transfer-date">
            Transfer date
          </Label>

          <Input
            id="transfer-date"
            type="date"
            value={transferDate}
            onChange={(event) =>
              onTransferDateChange(
                event.target.value,
              )
            }
          />

          <p className="text-xs text-muted-foreground">
            Select the date when the bank transfer was made.
          </p>
        </div>

        {/* Evidence */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="transfer-evidence">
              Transfer evidence
            </Label>

            <p className="mt-1 text-xs text-muted-foreground">
              Upload the bank transfer receipt or
              confirmation.
            </p>
          </div>

          <label
            htmlFor="transfer-evidence"
            className={[
              "flex cursor-pointer items-center gap-4 rounded-xl border border-dashed p-4",
              "transition-colors hover:bg-muted/50",
              fileError
                ? "border-destructive"
                : "",
            ].join(" ")}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              {evidence ? (
                <FileText className="size-5 text-primary" />
              ) : (
                <Upload className="size-5 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              {evidence ? (
                <>
                  <p className="truncate text-sm font-medium">
                    {evidence.name}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatFileSize(evidence.size)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    Upload transfer receipt
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, PNG, or PDF up to{" "}
                    {evidenceMaxMb} MB
                  </p>
                </>
              )}
            </div>

            <span className="shrink-0 rounded-md border px-3 py-2 text-xs font-medium">
              {evidence
                ? "Change"
                : "Choose file"}
            </span>

            <input
              id="transfer-evidence"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              onChange={handleEvidenceChange}
              className="sr-only"
            />
          </label>

          {fileError && (
            <p
              className="text-xs text-destructive"
              role="alert"
            >
              {fileError}
            </p>
          )}

          {evidence && !fileError && (
            <button
              type="button"
              onClick={() => {
                onEvidenceChange(null);

                const input =
                  document.getElementById(
                    "transfer-evidence",
                  ) as HTMLInputElement | null;

                if (input) {
                  input.value = "";
                }
              }}
              className="text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Remove uploaded file
            </button>
          )}
        </div>

        {/* Verification notice */}
        <div className="rounded-lg bg-muted/50 px-4 py-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

            <div>
              <p className="text-sm font-medium">
                Transfer verification
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Your transfer will be reviewed by the
                revenue office before the payment is
                confirmed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}