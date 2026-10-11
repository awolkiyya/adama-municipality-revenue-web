
"use client";

import { useQuery } from "@tanstack/react-query";

import revenueReportService from "@/services/report/revenue-report-service";

import type {
  RevenueCollectionReportFilters,
} from "@/types/report/revenue-report";

export const revenueCollectionReportKeys = {
  all: ["revenue-collection-report"] as const,

  collection: (filters: RevenueCollectionReportFilters = {}) =>
    [...revenueCollectionReportKeys.all, filters] as const,
};

/**
 * Fetch and cache the Revenue Collection Report.
 *
 * Changing a filter automatically triggers a new query.
 */
export function useRevenueCollectionReport(
  filters: RevenueCollectionReportFilters = {},
) {
  return useQuery({
    queryKey: revenueCollectionReportKeys.collection(filters),

    queryFn: () =>
      revenueReportService.getCollectionReport(filters),

    placeholderData: (previousData) => previousData,

    staleTime: 60 * 1000,

    refetchOnWindowFocus: false,
  });
}

export default useRevenueCollectionReport;