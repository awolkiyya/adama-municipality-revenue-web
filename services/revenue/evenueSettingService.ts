import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import type {
  RevenueSettingResponse,
  UpdateRevenueSettingPayload,
} from "@/types/revenue/revenueSetting";


export const revenueSettingService = {


  /*
  |--------------------------------------------------------------------------
  | GET ACTIVE REVENUE SETTINGS
  |--------------------------------------------------------------------------
  |
  | GET /revenue/settings
  |
  | Returns the active global Revenue Management configuration.
  |
  */

  getRevenueSettings: async (): Promise<RevenueSettingResponse> => {

    try {

      const res =
        await api.get<RevenueSettingResponse>(
          "/revenue/settings"
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(error);

    }

  },


  /*
  |--------------------------------------------------------------------------
  | UPDATE REVENUE SETTINGS
  |--------------------------------------------------------------------------
  |
  | PUT /revenue/settings/{id}
  |
  | Revenue settings are singleton-style configuration, but the backend
  | route uses the concrete RevenueSetting UUID for safe model binding.
  |
  */

  updateRevenueSettings: async (
    id: string,
    data: UpdateRevenueSettingPayload
  ): Promise<RevenueSettingResponse> => {

    try {

      const res =
        await api.put<RevenueSettingResponse>(
          `/revenue/settings/${id}`,
          data
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(error);

    }

  },


};