
import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import type {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import type {
  CreateRevenueServicePayload,
  RevenueService,
  RevenueServiceFilters,
  RevenueServiceSummary,
  UpdateRevenueServicePayload,
} from "@/types/revenue/revenu-service";

export const revenueServiceService = {
  /**
   * GET ALL SERVICES
   */
  getServices: async (
    params?: RevenueServiceFilters
  ): Promise<ListResponse<RevenueService, RevenueServiceSummary>> => {
    try {
      const cleanParams = Object.entries(params ?? {}).reduce<
        Record<string, unknown>
      >((acc, [key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          value !== "ALL"
        ) {
          acc[key] = value;
        }

        return acc;
      }, {});

      const res = await api.get<
        ListResponse<RevenueService, RevenueServiceSummary>
      >("/revenue/services", {
        params: cleanParams,
      });

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * GET SERVICE DETAIL
   */
  getServiceById: async (
    id: string
  ): Promise<ApiResponse<RevenueService>> => {
    try {
      const res = await api.get<ApiResponse<RevenueService>>(
        `/revenue/services/${id}`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * CREATE SERVICE + REQUIRED FIELDS
   */
  createService: async (
    data: CreateRevenueServicePayload
  ): Promise<ApiResponse<RevenueService>> => {
    try {
      const res = await api.post<ApiResponse<RevenueService>>(
        "/revenue/services",
        data
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * UPDATE SERVICE
   */
  updateService: async (
    id: string,
    data: UpdateRevenueServicePayload
  ): Promise<ApiResponse<RevenueService>> => {
    try {
      const res = await api.patch<ApiResponse<RevenueService>>(
        `/revenue/services/${id}`,
        data
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * ACTIVATE SERVICE
   */
  activateService: async (
    id: string
  ): Promise<ApiResponse<RevenueService>> => {
    try {
      const res = await api.patch<ApiResponse<RevenueService>>(
        `/revenue/services/${id}/activate`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * DEACTIVATE SERVICE
   */
  deactivateService: async (
    id: string
  ): Promise<ApiResponse<RevenueService>> => {
    try {
      const res = await api.patch<ApiResponse<RevenueService>>(
        `/revenue/services/${id}/deactivate`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * DELETE SERVICE
   */
  deleteService: async (
    id: string
  ): Promise<ApiResponse<null>> => {
    try {
      const res = await api.delete<ApiResponse<null>>(
        `/revenue/services/${id}`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};
