"use client"

import {
  CircleDollarSign,
  Info,
  Wallet,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import type {
  ExistingFinancialPosition,
} from "@/types/existing-agreement"

interface FinancialPositionStepProps {
  financial: ExistingFinancialPosition

  updateFinancial: (
    field: keyof ExistingFinancialPosition,
    value: string,
  ) => void

  outstandingBalance: number

  errors?: Partial<
    Record<
      keyof ExistingFinancialPosition,
      string
    >
  >
}

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    Number.isFinite(value)
      ? value
      : 0,
  )
}

function sanitizeAmount(
  value: string,
): string {
  if (value === "") {
    return ""
  }

  const normalized =
    value.replace(
      /[^0-9.]/g,
      "",
    )

  const [
    integerPart,
    ...decimalParts
  ] = normalized.split(".")

  if (decimalParts.length === 0) {
    return integerPart
  }

  return `${integerPart}.${decimalParts
    .join("")
    .slice(0, 2)}`
}

// ============================================================
// COMPONENT
// ============================================================

export function FinancialPositionStep({
  financial,
  updateFinancial,
  outstandingBalance,
  errors = {},
}: FinancialPositionStepProps) {
  const hasFinancialValues =
    financial.originalObligation !== "" ||
    financial.amountAlreadyPaid !== ""

  const originalObligation =
    Number(
      financial.originalObligation || 0,
    )

  const amountAlreadyPaid =
    Number(
      financial.amountAlreadyPaid || 0,
    )

  const isOverpaid =
    amountAlreadyPaid >
    originalObligation

  return (
    <div className="space-y-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="space-y-5">

        <div className="flex items-start gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="min-w-0">

            <h2 className="text-sm font-semibold">
              Historical Financial Position
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
              Record the verified historical financial
              amounts of this existing agreement.
            </p>

          </div>

        </div>

      </section>

      {/* ======================================================
          HISTORICAL AMOUNTS
      ====================================================== */}

      <section className="space-y-5">

        <div className="grid gap-5 sm:grid-cols-2">

          {/* ==================================================
              ORIGINAL OBLIGATION
          ================================================== */}

          <div className="space-y-2">

            <Label htmlFor="original-obligation">
              Original Obligation
              <span className="ml-1 text-destructive">
                *
              </span>
            </Label>

            <div className="relative">

              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ETB
              </span>

              <Input
                id="original-obligation"
                name="originalObligation"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={
                  financial.originalObligation
                }
                onChange={(event) =>
                  updateFinancial(
                    "originalObligation",
                    sanitizeAmount(
                      event.target.value,
                    ),
                  )
                }
                placeholder="0.00"
                aria-invalid={
                  Boolean(
                    errors.originalObligation,
                  )
                }
                className="pl-12"
              />

            </div>

            {errors.originalObligation && (
              <p className="text-xs text-destructive">
                {
                  errors.originalObligation
                }
              </p>
            )}

            <p className="text-xs leading-5 text-muted-foreground">
              Total historical financial obligation recorded
              for this agreement.
            </p>

          </div>

          {/* ==================================================
              AMOUNT ALREADY PAID
          ================================================== */}

          <div className="space-y-2">

            <Label htmlFor="amount-already-paid">
              Amount Already Paid
              <span className="ml-1 text-destructive">
                *
              </span>
            </Label>

            <div className="relative">

              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ETB
              </span>

              <Input
                id="amount-already-paid"
                name="amountAlreadyPaid"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={
                  financial.amountAlreadyPaid
                }
                onChange={(event) =>
                  updateFinancial(
                    "amountAlreadyPaid",
                    sanitizeAmount(
                      event.target.value,
                    ),
                  )
                }
                placeholder="0.00"
                aria-invalid={
                  Boolean(
                    errors.amountAlreadyPaid,
                  )
                }
                className="pl-12"
              />

            </div>

            {errors.amountAlreadyPaid && (
              <p className="text-xs text-destructive">
                {
                  errors.amountAlreadyPaid
                }
              </p>
            )}

            <p className="text-xs leading-5 text-muted-foreground">
              Total amount confirmed as already paid according
              to the available historical municipal records.
            </p>

          </div>

        </div>

      </section>

      {/* ======================================================
          CALCULATED OPENING BALANCE
      ====================================================== */}

      <section className="rounded-xl border bg-muted/30 p-5">

        <div className="flex items-start gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="min-w-0 flex-1">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="min-w-0">

                <p className="text-sm font-medium">
                  Outstanding Historical Balance
                </p>

                <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
                  Automatically calculated from the original
                  obligation less the amount already paid.
                </p>

              </div>

              <p className="shrink-0 text-lg font-semibold tracking-tight">
                ETB{" "}
                {formatCurrency(
                  outstandingBalance,
                )}
              </p>

            </div>

            {/* ==================================================
                CALCULATION BREAKDOWN
            ================================================== */}

            {hasFinancialValues && (
              <div className="mt-4 grid gap-3 border-t pt-4 text-xs sm:grid-cols-3">

                <div>
                  <p className="text-muted-foreground">
                    Original obligation
                  </p>

                  <p className="mt-1 font-medium">
                    ETB{" "}
                    {formatCurrency(
                      originalObligation,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">
                    Amount already paid
                  </p>

                  <p className="mt-1 font-medium">
                    ETB{" "}
                    {formatCurrency(
                      amountAlreadyPaid,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">
                    Remaining balance
                  </p>

                  <p className="mt-1 font-semibold">
                    ETB{" "}
                    {formatCurrency(
                      outstandingBalance,
                    )}
                  </p>
                </div>

              </div>
            )}

          </div>

        </div>

      </section>

      {/* ======================================================
          OVERPAYMENT WARNING
      ====================================================== */}

      {isOverpaid && (
        <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">

          <div className="flex items-start gap-3">

            <Info className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />

            <div className="space-y-1">

              <p className="text-sm font-medium">
                Historical amounts require verification
              </p>

              <p className="text-xs leading-5 text-muted-foreground">
                The amount already paid is greater than the
                original obligation. Verify the historical
                municipal records before registering this
                agreement.
              </p>

            </div>

          </div>

        </section>
      )}

      {/* ======================================================
          INFORMATION NOTICE
      ====================================================== */}

      <section className="rounded-lg border bg-muted/20 p-4">

        <div className="flex items-start gap-3">

          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

          <div className="space-y-2">

            <p className="text-sm font-medium">
              Historical financial data
            </p>

            <p className="text-xs leading-5 text-muted-foreground">
              These values represent the verified historical
              financial position carried into the municipal
              revenue system.
            </p>

            <p className="text-xs leading-5 text-muted-foreground">
              Individual historical payment transactions do not
              need to be recreated here unless your migration
              policy requires transaction-level reconstruction.
              The verified historical totals can instead be
              carried forward as the opening financial position
              for subsequent revenue processing.
            </p>

          </div>

        </div>

      </section>

    </div>
  )
}
