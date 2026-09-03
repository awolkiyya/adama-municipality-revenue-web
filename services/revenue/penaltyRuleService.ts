import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";
import { ApiResponse, ListResponse } from "@/types/api";
import { PenaltyRule, PenaltyRuleFilters } from "@/types/revenue/penality.";




export const penaltyRuleService = {


  /**
   * ============================================================
   * GET ALL PENALTY RULES
   * ============================================================
   *
   * GET /revenue/penalty-rules
   *
   * Supports:
   *
   * - search
   * - revenue_service_id
   * - scope
   * - is_active
   * - calculation_type
   * - sort_by
   * - sort_direction
   * - page
   * - per_page
   */
  getPenaltyRules: async (
    params?: PenaltyRuleFilters
  ): Promise<ListResponse<PenaltyRule>> => {

    try {

      const cleanParams =
        Object.entries(params || {})
          .reduce(
            (acc, [key, value]) => {

              if (
                value !== undefined &&
                value !== null &&
                value !== "" &&
                value !== "ALL"
              ) {

                acc[key] = value;

              }

              return acc;

            },
            {} as Record<string, any>
          );


      const res =
        await api.get<ListResponse<PenaltyRule>>(
          "/revenue/penalty-rules",
          {
            params: cleanParams,
          }
        );


      return res.data;

    } catch (error) {

      throw normalizeApiError(error);

    }

  },







  /**
   * ============================================================
   * GET PENALTY RULE DETAIL
   * ============================================================
   *
   * GET /revenue/penalty-rules/{id}
   */
  getPenaltyRuleById: async (
    id: string
  ): Promise<ApiResponse<PenaltyRule>> => {

    try {

      const res =
        await api.get<ApiResponse<PenaltyRule>>(
          `/revenue/penalty-rules/${id}`
        );


      return res.data;

    } catch (error) {

      throw normalizeApiError(error);

    }

  },







  /**
   * ============================================================
   * CREATE PENALTY RULE
   * ============================================================
   *
   * POST /revenue/penalty-rules
   */
  createPenaltyRule: async (
    data: Partial<PenaltyRule>
  ): Promise<ApiResponse<PenaltyRule>> => {

    try {

      const res =
        await api.post<ApiResponse<PenaltyRule>>(
          "/revenue/penalty-rules",
          data
        );


      return res.data;

    } catch (error) {

      throw normalizeApiError(error);

    }

  },







  /**
   * ============================================================
   * UPDATE PENALTY RULE
   * ============================================================
   *
   * PATCH /revenue/penalty-rules/{id}
   */
  updatePenaltyRule: async (
    id: string,
    data: Partial<PenaltyRule>
  ): Promise<ApiResponse<PenaltyRule>> => {

    try {

      const res =
        await api.patch<ApiResponse<PenaltyRule>>(
          `/revenue/penalty-rules/${id}`,
          data
        );


      return res.data;

    } catch (error) {

      throw normalizeApiError(error);

    }

  },







  /**
   * ============================================================
   * ACTIVATE PENALTY RULE
   * ============================================================
   *
   * PATCH /revenue/penalty-rules/{id}/activate
   */
  activatePenaltyRule: async (
    id: string
  ): Promise<ApiResponse<PenaltyRule>> => {

    try {

      const res =
        await api.patch<ApiResponse<PenaltyRule>>(
          `/revenue/penalty-rules/${id}/activate`
        );


      return res.data;

    } catch (error) {

      throw normalizeApiError(error);

    }

  },







  /**
   * ============================================================
   * DEACTIVATE PENALTY RULE
   * ============================================================
   *
   * PATCH /revenue/penalty-rules/{id}/deactivate
   */
  deactivatePenaltyRule: async (
    id: string
  ): Promise<ApiResponse<PenaltyRule>> => {

    try {

      const res =
        await api.patch<ApiResponse<PenaltyRule>>(
          `/revenue/penalty-rules/${id}/deactivate`
        );


      return res.data;

    } catch (error) {

      throw normalizeApiError(error);

    }

  },







  /**
   * ============================================================
   * GET PENALTY RULE HISTORY
   * ============================================================
   *
   * GET /revenue/penalty-rules/{id}/history
   */
  getPenaltyRuleHistory: async (
    id: string
  ): Promise<ApiResponse<any[]>> => {

    try {

      const res =
        await api.get<ApiResponse<any[]>>(
          `/revenue/penalty-rules/${id}/history`
        );


      return res.data;

    } catch (error) {

      throw normalizeApiError(error);

    }

  },


};