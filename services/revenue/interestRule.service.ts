import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import type {
  ApiResponse,
  ListResponse,
} from "@/types/api";
import { InterestRule, InterestRuleFilters, InterestRuleHistory, InterestRulePayload } from "@/types/revenue/interestRule";




export const interestRuleService = {
  /**
   * ============================================================
   * GET ALL INTEREST RULES
   * ============================================================
   *
   * GET /revenue/interest-rules
   *
   * Supports:
   * - search
   * - is_active
   * - rate_period
   * - calculation_method
   * - calculation_basis
   * - sort_by
   * - sort_direction
   * - page
   * - per_page
   */
  getInterestRules: async (
    params?: InterestRuleFilters,
  ): Promise<ListResponse<InterestRule>> => {
    try {
      const cleanParams = Object.entries(
        params ?? {},
      ).reduce(
        (
          acc,
          [key, value],
        ) => {
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
        {} as Record<string, unknown>,
      );

      const res =
        await api.get<ListResponse<InterestRule>>(
          "/revenue/interest-rules",
          {
            params: cleanParams,
          },
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * ============================================================
   * GET INTEREST RULE DETAIL
   * ============================================================
   *
   * GET /revenue/interest-rules/{id}
   */
  getInterestRuleById: async (
    id: string,
  ): Promise<ApiResponse<InterestRule>> => {
    try {
      const res =
        await api.get<ApiResponse<InterestRule>>(
          `/revenue/interest-rules/${id}`,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * ============================================================
   * CREATE INTEREST RULE
   * ============================================================
   *
   * POST /revenue/interest-rules
   *
   * Uses InterestRulePayload because the API receives
   * the normalized numeric rate and configuration values.
   */
  createInterestRule: async (
    data: InterestRulePayload,
  ): Promise<ApiResponse<InterestRule>> => {
    try {
      const res =
        await api.post<ApiResponse<InterestRule>>(
          "/revenue/interest-rules",
          data,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * ============================================================
   * UPDATE INTEREST RULE
   * ============================================================
   *
   * PATCH /revenue/interest-rules/{id}
   */
  updateInterestRule: async (
    id: string,
    data: Partial<InterestRulePayload>,
  ): Promise<ApiResponse<InterestRule>> => {
    try {
      const res =
        await api.patch<ApiResponse<InterestRule>>(
          `/revenue/interest-rules/${id}`,
          data,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * ============================================================
   * ACTIVATE INTEREST RULE
   * ============================================================
   *
   * PATCH /revenue/interest-rules/{id}/activate
   */
  activateInterestRule: async (
    id: string,
  ): Promise<ApiResponse<InterestRule>> => {
    try {
      const res =
        await api.patch<ApiResponse<InterestRule>>(
          `/revenue/interest-rules/${id}/activate`,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * ============================================================
   * DEACTIVATE INTEREST RULE
   * ============================================================
   *
   * PATCH /revenue/interest-rules/{id}/deactivate
   */
  deactivateInterestRule: async (
    id: string,
  ): Promise<ApiResponse<InterestRule>> => {
    try {
      const res =
        await api.patch<ApiResponse<InterestRule>>(
          `/revenue/interest-rules/${id}/deactivate`,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * ============================================================
   * GET APPLICABLE INTEREST RULE
   * ============================================================
   *
   * GET /revenue/interest-rules/applicable
   *
   * Returns the active interest rule applicable to the
   * requested effective date.
   *
   * Example:
   *
   * /revenue/interest-rules/applicable?effective_date=2026-07-08
   */
  getApplicableInterestRule: async (
    effectiveDate?: string,
  ): Promise<ApiResponse<InterestRule | null>> => {
    try {
      const params =
        effectiveDate
          ? {
              effective_date: effectiveDate,
            }
          : undefined;

      const res =
        await api.get<
          ApiResponse<InterestRule | null>
        >(
          "/revenue/interest-rules/applicable",
          {
            params,
          },
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * ============================================================
   * GET INTEREST RULE HISTORY
   * ============================================================
   *
   * GET /revenue/interest-rules/{id}/history
   */
  getInterestRuleHistory: async (
    id: string,
  ): Promise<
    ApiResponse<InterestRuleHistory[]>
  > => {
    try {
      const res =
        await api.get<
          ApiResponse<InterestRuleHistory[]>
        >(
          `/revenue/interest-rules/${id}/history`,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};