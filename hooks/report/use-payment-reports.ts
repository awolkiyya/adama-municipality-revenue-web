// src/hooks/use-payment-reports.ts

"use client";

import {
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";

import paymentReportService from "@/services/report/payment-report-service";

import type {
  PaginatedPaymentReports,
  PaymentReport,
  PaymentReportFilters,
  PaymentReportSummary,
} from "@/types/report/payment-report";

export const paymentReportKeys = {
  all: ["payment-reports"] as const,

  lists: () =>
    [...paymentReportKeys.all, "list"] as const,

  list: (filters: PaymentReportFilters) =>
    [...paymentReportKeys.lists(), filters] as const,

  summaries: () =>
    [...paymentReportKeys.all, "summary"] as const,

  summary: (filters: PaymentReportFilters) =>
    [...paymentReportKeys.summaries(), filters] as const,

  details: () =>
    [...paymentReportKeys.all, "detail"] as const,

  detail: (paymentId: number | string) =>
    [...paymentReportKeys.details(), paymentId] as const,
};

/**
 * Get paginated payment reports.
 */
export function usePaymentReports(
  filters: PaymentReportFilters = {},
  options?: Omit<
    UseQueryOptions<PaginatedPaymentReports>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: paymentReportKeys.list(filters),
    queryFn: () =>
      paymentReportService.getReports(filters),
    ...options,
  });
}

/**
 * Get payment report summary statistics.
 */
export function usePaymentReportSummary(
  filters: PaymentReportFilters = {},
  options?: Omit<
    UseQueryOptions<PaymentReportSummary>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: paymentReportKeys.summary(filters),
    queryFn: () =>
      paymentReportService.getSummary(filters),
    ...options,
  });
}

/**
 * Get details for a single payment.
 */
export function usePaymentReport(
  paymentId: number | string | null | undefined,
  options?: Omit<
    UseQueryOptions<PaymentReport>,
    "queryKey" | "queryFn" | "enabled"
  >,
) {
  return useQuery({
    queryKey: paymentReportKeys.detail(paymentId ?? ""),
    queryFn: () => {
      if (paymentId === null || paymentId === undefined) {
        throw new Error("A payment ID is required.");
      }

      return paymentReportService.getReport(paymentId);
    },
    enabled:
      paymentId !== null &&
      paymentId !== undefined &&
      paymentId !== "",
    ...options,
  });
}