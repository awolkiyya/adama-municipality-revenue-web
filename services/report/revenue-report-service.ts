

import { api } from "@/lib/api";
import type {
  RevenueCollectionReport,
  RevenueCollectionReportApiResponse,
  RevenueCollectionReportFilters,
} from "@/types/report/revenue-report";

const BASE_URL = "/revenue-reports";

export const revenueReportService = {
  /**
   * Fetch aggregated Revenue Collection Report data.
   */
  async getCollectionReport(
    filters: RevenueCollectionReportFilters = {},
  ): Promise<RevenueCollectionReport> {
    const response =
      await api.get<RevenueCollectionReportApiResponse>(
        `${BASE_URL}/collection`,
        {
          params: filters,
        },
      );

    return response.data.data;
  },
};

export default revenueReportService;