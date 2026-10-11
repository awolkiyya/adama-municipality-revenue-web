// src/services/payment-report-service.ts

import { api } from "@/lib/api";
import type {
  PaginatedPaymentReports,
  PaymentReport,
  PaymentReportFilters,
  PaymentReportSummary,
  PaymentReportSummaryResponse,
} from "@/types/report/payment-report";


const BASE_URL = "/payment-reports";

/**
 * Remove empty filters before sending query parameters.
 */
function buildQueryParams(
  filters: PaymentReportFilters = {},
): Record<string, string | number> {
  const params: Record<string, string | number> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      params[key] = value;
    }
  });

  return params;
}

export const paymentReportService = {
  /**
   * Get a paginated list of payment reports.
   */
  async getReports(
    filters: PaymentReportFilters = {},
  ): Promise<PaginatedPaymentReports> {
    const response = await api.get<PaginatedPaymentReports>(
      BASE_URL,
      {
        params: buildQueryParams(filters),
      },
    );

    return response.data;
  },

  /**
   * Get payment report summary statistics.
   */
  async getSummary(
    filters: PaymentReportFilters = {},
  ): Promise<PaymentReportSummary> {
    const response =
      await api.get<PaymentReportSummaryResponse>(
        `${BASE_URL}/summary`,
        {
          params: buildQueryParams(filters),
        },
      );

    return response.data.data;
  },

  /**
   * Get one payment report.
   */
  async getReport(
    paymentId: number | string,
  ): Promise<PaymentReport> {
    const response = await api.get<{ data: PaymentReport }>(
      `${BASE_URL}/${paymentId}`,
    );

    return response.data.data;
  },
};

export default paymentReportService;