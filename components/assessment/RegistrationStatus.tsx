"use client"

import {
  CheckCircle2,
  CircleDot,
  FileCheck2,
  ShieldCheck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RegistrationStatusProps {
  registered: boolean
}

export function RegistrationStatus({
  registered,
}: RegistrationStatusProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />

          <CardTitle className="text-sm">
            Registration Status
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {registered ? (
          <>
            {/* Registered */}
            <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">
                    Registered
                  </p>

                  <Badge
                    variant="secondary"
                    className="text-[10px]"
                  >
                    Completed
                  </Badge>
                </div>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  The existing agreement has been registered in
                  the municipal revenue system.
                </p>
              </div>
            </div>

            {/* Record state */}
            <div className="space-y-3">
              <StatusItem
                icon={FileCheck2}
                title="Historical agreement"
                description="Agreement information preserved."
                completed
              />

              <StatusItem
                icon={CircleDot}
                title="Financial position"
                description="Opening financial position established."
                completed
              />

              <StatusItem
                icon={ShieldCheck}
                title="Municipal record"
                description="Record is available for subsequent processing."
                completed
              />
            </div>
          </>
        ) : (
          <>
            {/* Pending */}
            <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
              <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">
                    Pending Registration
                  </p>

                  <Badge
                    variant="outline"
                    className="text-[10px]"
                  >
                    Draft
                  </Badge>
                </div>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  The agreement information is being prepared
                  and has not yet been registered.
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-3">
              <StatusItem
                icon={FileCheck2}
                title="Agreement information"
                description="Historical agreement details."
              />

              <StatusItem
                icon={CircleDot}
                title="Financial position"
                description="Historical financial position."
              />

              <StatusItem
                icon={ShieldCheck}
                title="Municipal record"
                description="Final registration."
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface StatusItemProps {
  icon: React.ComponentType<{
    className?: string
  }>
  title: string
  description: string
  completed?: boolean
}

function StatusItem({
  icon: Icon,
  title,
  description,
  completed = false,
}: StatusItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-muted/20">
        {completed ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium">
          {title}
        </p>

        <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}