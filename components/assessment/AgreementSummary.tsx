"use client"

import {
  CalendarDays,
  FileText,
  User,
} from "lucide-react"

import {
  Badge,
} from "@/components/ui/badge"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type {
  ExistingAgreementForm,
} from "@/types/existing-agreement"

import type {
  RevenueService,
} from "@/types/revenue/assessment"

import type {
  Citizen,
} from "@/types/citizen"

interface AgreementSummaryProps {
  agreement: ExistingAgreementForm

  selectedTaxpayer: Citizen | null

  selectedRevenueService: RevenueService | null

  revenueCode: string

  serviceFieldValues: Record<
    string,
    Record<string, string>
  >
}

interface SummaryRowProps {
  label: string
  value?: React.ReactNode
}

function SummaryRow({
  label,
  value,
}: SummaryRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-xs text-muted-foreground">
        {label}
      </span>

      <span className="max-w-[62%] text-right text-xs font-medium">
        {value || "—"}
      </span>
    </div>
  )
}

function formatDate(
  value?: string,
) {
  if (!value) {
    return "—"
  }

  const date = new Date(
    `${value}T00:00:00`,
  )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date)
}

function formatFieldValue(
  value?: string,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "—"
  }

  return value
}

function isDateField(
  field: {
    key: string
    type?: string
  },
) {
  return (
    field.type === "date" ||
    field.key.includes("date")
  )
}

function isPeriodField(
  field: {
    key: string
  },
) {
  return (
    field.key ===
      "payment_completion_period" ||
    field.key ===
      "completion_period" ||
    field.key ===
      "lease_period"
  )
}

function formatServiceFieldValue(
  field: {
    key: string
    type?: string
  },
  value?: string,
) {
  const formattedValue =
    formatFieldValue(value)

  if (
    formattedValue === "—"
  ) {
    return formattedValue
  }

  if (isDateField(field)) {
    return formatDate(value)
  }

  if (isPeriodField(field)) {
    return `${formattedValue} years`
  }

  return formattedValue
}

export function AgreementSummary({
  agreement,
  selectedTaxpayer,
  selectedRevenueService,
  revenueCode,
  serviceFieldValues,
}: AgreementSummaryProps) {
  const serviceValues =
    selectedRevenueService
      ? serviceFieldValues[
          selectedRevenueService.id
        ] ?? {}
      : {}

  const serviceFields =
    selectedRevenueService?.fields ?? []

  return (
    <Card className="overflow-hidden">

      {/* =========================================================
          HEADER
      ========================================================= */}
      <CardHeader className="border-b bg-muted/20 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="min-w-0">
            <CardTitle className="text-sm">
              Agreement Summary
            </CardTitle>

            <p className="mt-1 text-xs text-muted-foreground">
              Current registration information
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">

        {/* =======================================================
            AGREEMENT
        ======================================================= */}
        <section>
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />

            <p className="text-xs font-semibold">
              Agreement
            </p>
          </div>

          <div className="divide-y">

            <SummaryRow
              label="Revenue Service"
              value={
                selectedRevenueService ? (
                  <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
                    <span>
                      {
                        selectedRevenueService.name
                      }
                    </span>

                    {revenueCode && (
                      <Badge
                        variant="secondary"
                        className="font-mono text-[9px]"
                      >
                        {revenueCode}
                      </Badge>
                    )}
                  </span>
                ) : (
                  "—"
                )
              }
            />


          </div>
        </section>

        {/* =======================================================
            TAXPAYER
        ======================================================= */}
        <section className="mt-5 border-t pt-5">

          <div className="mb-2 flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />

            <p className="text-xs font-semibold">
              Taxpayer
            </p>
          </div>

          <div className="divide-y">

            <SummaryRow
              label="Name"
              value={
                selectedTaxpayer?.full_name
              }
            />

            <SummaryRow
              label="Citezen UUID"
              value={
                selectedTaxpayer?.citizen_uid
              }
            />

          </div>
        </section>

        {/* =======================================================
            SERVICE DETAILS
        ======================================================= */}
        <section className="mt-5 border-t pt-5">

          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />

            <div className="min-w-0">
              <p className="text-xs font-semibold">
                Service Details
              </p>

              {selectedRevenueService && (
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {
                    selectedRevenueService.name
                  }
                </p>
              )}
            </div>
          </div>

          {!selectedRevenueService ? (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <p className="text-xs text-muted-foreground">
                No revenue service selected.
              </p>
            </div>
          ) : serviceFields.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <p className="text-xs text-muted-foreground">
                This service has no additional
                details.
              </p>
            </div>
          ) : (
            <div className="divide-y">

              {serviceFields.map(
                (field) => (
                  <SummaryRow
                    key={
                      field.id ??
                      field.key
                    }
                    label={
                      field.label ??
                      field.description ??
                      field.key
                    }
                    value={formatServiceFieldValue(
                      field,
                      serviceValues[
                        field.key
                      ],
                    )}
                  />
                ),
              )}

            </div>
          )}

        </section>

        {/* =======================================================
            EMPTY SERVICE STATE
        ======================================================= */}
        {!selectedRevenueService && (
          <section className="mt-5 border-t pt-5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />

              <p className="text-xs font-semibold">
                Service Information
              </p>
            </div>

            <div className="mt-2 rounded-lg border border-dashed p-4 text-center">
              <p className="text-xs text-muted-foreground">
                Select a revenue service to
                view its details.
              </p>
            </div>
          </section>
        )}

      </CardContent>
    </Card>
  )
}
