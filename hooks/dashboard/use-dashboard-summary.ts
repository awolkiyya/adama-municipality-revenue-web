
"use client"

import { useQuery } from "@tanstack/react-query"

import { dashboardService } from "@/services/dashboard/dashboard.service"

import type {
  DashboardSummaryParams,
} from "@/types/dashboard"

export const dashboardQueryKeys = {
  all: ["dashboard"] as const,

  summary: (params?: DashboardSummaryParams) =>
    [...dashboardQueryKeys.all, "summary", params ?? {}] as const,
}

export function useDashboardSummary(
  params?: DashboardSummaryParams,
) {
  return useQuery({
    queryKey: dashboardQueryKeys.summary(params),
    queryFn: () => dashboardService.getSummary(params),
    staleTime: 60_000,
  })
}
