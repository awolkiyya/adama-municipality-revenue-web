
import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import type { RevenueCode } from "@/types/revenue/revenue-code";
import type { ListResponse } from "@/types/api";

type RevenueCodeQueryParams = {
  search?: string;
  page?: number;
  per_page?: number;
  is_active?: boolean;
};

export const revenueCodeService = {
  /**
   * GET ACTIVE REVENUE CODES
   *
   * Used for dropdowns/selects.
   *
   * Supports:
   * - search
   * - pagination
   */
  getCodes: async (
    params?: RevenueCodeQueryParams
  ): Promise<ListResponse<RevenueCode>> => {
    try {
      const cleanParams = Object.entries(params ?? {}).reduce<
        Record<string, unknown>
      >((acc, [key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          acc[key] = value;
        }

        return acc;
      }, {});

      const res = await api.get<ListResponse<RevenueCode>>(
        "/revenue/codes",
        {
          params: cleanParams,
        }
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};
