
import { api } from "@/lib/api"
import { SingleResponse } from "@/types/api"

import type {
  DashboardSummary,
  DashboardSummaryParams,
} from "@/types/dashboard"

const DASHBOARD_ENDPOINT = "/dashboard/summary"

export const dashboardService = {
  async getSummary(
    params?: DashboardSummaryParams,
  ): Promise<SingleResponse<DashboardSummary>> {
    const response = await api.get<SingleResponse<DashboardSummary>>(
      DASHBOARD_ENDPOINT,
      { params },
    )

    return response.data
  },
}
