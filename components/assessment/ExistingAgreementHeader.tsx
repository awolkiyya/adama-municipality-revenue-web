"use client"

import { ArrowLeft, FileText, History } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ExistingAgreementHeaderProps {
  onBack: () => void
}

export function ExistingAgreementHeader({
  onBack,
}: ExistingAgreementHeaderProps) {
  return (
    <div className="space-y-5">
      {/* Top navigation */}
      <div className="flex items-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                Register Existing LIZZ Agreement
              </h1>

              <Badge
                variant="secondary"
                className="gap-1.5 font-normal"
              >
                <History className="h-3.5 w-3.5" />
                Historical Record
              </Badge>
            </div>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Register an existing land lease agreement and its
              historical financial position in the municipal
              revenue system.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}