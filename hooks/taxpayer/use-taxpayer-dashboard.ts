/**
 * src/hooks/taxpayer/use-taxpayer-dashboard.ts
 *
 * React Query hook for the taxpayer dashboard.
 */

import { useQuery } from "@tanstack/react-query";

import { taxpayerDashboardService } from "@/services/taxpayer/taxpayer-dashboard.service";

/* ================================================================
   QUERY KEY
================================================================ */

export const taxpayerDashboardQueryKey = [
  "taxpayer",
  "dashboard",
] as const;

/* ================================================================
   HOOK
================================================================ */

export function useTaxpayerDashboard() {
  return useQuery({
    queryKey: taxpayerDashboardQueryKey,

    queryFn: () =>
      taxpayerDashboardService.getDashboard(),

    /*
     * Dashboard data does not need to be refetched constantly.
     *
     * Later we can tune this according to the real municipal
     * application's requirements.
     */
    staleTime: 60 * 1000,
  });
}