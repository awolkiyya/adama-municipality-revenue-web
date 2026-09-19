import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import type {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import type {
  PaymentScheduleRule,
  PaymentScheduleRuleFilters,
  PaymentScheduleRulePayload,
  PaymentScheduleRuleSummary,
} from "@/types/revenue/payment-schedule-rule";


export const paymentScheduleRuleService = {
  /**
   * ============================================================
   * GET ALL PAYMENT SCHEDULE RULES
   * ============================================================
   *
   * GET /revenue/payment-schedule-rules
   *
   * Supports:
   * - search
   * - is_enabled
   * - revenue_code_id
   * - has_first_installment_percentage
   * - sort_by
   * - sort_direction
   * - page
   * - per_page
   */
  getPaymentScheduleRules: async (
    params?: PaymentScheduleRuleFilters,
  ): Promise<ListResponse<PaymentScheduleRule>> => {
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
        await api.get<
          ListResponse<PaymentScheduleRule>
        >(
          "/revenue/payment-schedule-rules",
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
   * GET PAYMENT SCHEDULE RULE DETAIL
   * ============================================================
   *
   * GET /revenue/payment-schedule-rules/{id}
   */
  getPaymentScheduleRuleById: async (
    id: string,
  ): Promise<ApiResponse<PaymentScheduleRule>> => {
    try {
      const res =
        await api.get<
          ApiResponse<PaymentScheduleRule>
        >(
          `/revenue/payment-schedule-rules/${id}`,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * ============================================================
   * GET PAYMENT SCHEDULE RULE SUMMARY
   * ============================================================
   *
   * GET /revenue/payment-schedule-rules/summary
   *
   * Returns:
   * - total
   * - active
   * - inactive
   * - percentage_configured
   * - percentage_not_configured
   */
  getPaymentScheduleRuleSummary: async (): Promise<
    ApiResponse<PaymentScheduleRuleSummary>
  > => {
    try {
      const res =
        await api.get<
          ApiResponse<PaymentScheduleRuleSummary>
        >(
          "/revenue/payment-schedule-rules/summary",
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * ============================================================
   * CREATE PAYMENT SCHEDULE RULE
   * ============================================================
   *
   * POST /revenue/payment-schedule-rules
   *
   * first_installment_percentage is optional.
   */
  createPaymentScheduleRule: async (
    data: PaymentScheduleRulePayload,
  ): Promise<
    ApiResponse<PaymentScheduleRule>
  > => {
    try {
      const res =
        await api.post<
          ApiResponse<PaymentScheduleRule>
        >(
          "/revenue/payment-schedule-rules",
          data,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * ============================================================
   * UPDATE PAYMENT SCHEDULE RULE
   * ============================================================
   *
   * PUT /revenue/payment-schedule-rules/{id}
   */
  updatePaymentScheduleRule: async (
    id: string,
    data: Partial<PaymentScheduleRulePayload>,
  ): Promise<
    ApiResponse<PaymentScheduleRule>
  > => {
    try {
      const res =
        await api.put<
          ApiResponse<PaymentScheduleRule>
        >(
          `/revenue/payment-schedule-rules/${id}`,
          data,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * ============================================================
   * ACTIVATE PAYMENT SCHEDULE RULE
   * ============================================================
   *
   * PATCH /revenue/payment-schedule-rules/{id}/activate
   */
  activatePaymentScheduleRule: async (
    id: string,
  ): Promise<
    ApiResponse<PaymentScheduleRule>
  > => {
    try {
      const res =
        await api.patch<
          ApiResponse<PaymentScheduleRule>
        >(
          `/revenue/payment-schedule-rules/${id}/activate`,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * ============================================================
   * DEACTIVATE PAYMENT SCHEDULE RULE
   * ============================================================
   *
   * PATCH /revenue/payment-schedule-rules/{id}/deactivate
   */
  deactivatePaymentScheduleRule: async (
    id: string,
  ): Promise<
    ApiResponse<PaymentScheduleRule>
  > => {
    try {
      const res =
        await api.patch<
          ApiResponse<PaymentScheduleRule>
        >(
          `/revenue/payment-schedule-rules/${id}/deactivate`,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};