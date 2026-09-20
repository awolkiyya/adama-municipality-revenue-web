"use client"

import {
  ArrowRight,
  FileCheck2,
  ReceiptText,
  WalletCards,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function WhatHappensNext() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />

          <CardTitle className="text-sm">
            What Happens Next
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <NextItem
            icon={FileCheck2}
            title="Agreement becomes a municipal record"
            description="The historical agreement and its original terms are preserved in the revenue system."
          />

          <NextItem
            icon={ReceiptText}
            title="Financial position becomes the opening position"
            description="The verified historical balance can be used as the starting point for subsequent revenue processing."
          />

          <NextItem
            icon={WalletCards}
            title="Future payments follow the normal workflow"
            description="When payment is due, the applicable invoice or payment schedule can be generated according to the revenue service."
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface NextItemProps {
  icon: React.ComponentType<{
    className?: string
  }>
  title: string
  description: string
}

function NextItem({
  icon: Icon,
  title,
  description,
}: NextItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted/30">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium">
          {title}
        </p>

        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}