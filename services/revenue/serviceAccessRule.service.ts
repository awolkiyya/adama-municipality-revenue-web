import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import {
  ServiceAccessRule,
  UpdateServiceAccessRulePayload,
  UpdateServiceAccessRequestPayload,
  ServiceAccessRuleSummary,
} from "@/types/revenue/service-access-rule";


export const serviceAccessRuleService = {

  /* =========================================================
     GET ALL ACCESS RULES FOR SERVICE
  ========================================================= */

  getRules: async (
    serviceId: string,
    params?: {
      sector_id?: string;
      is_active?: boolean;
      page?: number;
      per_page?: number;
    }
  ): Promise<
    ListResponse<
      ServiceAccessRule,
      ServiceAccessRuleSummary
    >
  > => {

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
            {} as Record<string, unknown>
          );


      const res =
        await api.get<
          ListResponse<
            ServiceAccessRule,
            ServiceAccessRuleSummary
          >
        >(
          `/revenue/services/${serviceId}/access-rules`,
          {
            params: cleanParams,
          }
        );


      return res.data;

    } catch (error) {

      throw normalizeApiError(error);

    }
  },


  /* =========================================================
     GET SINGLE ACCESS RULE
  ========================================================= */

  getRuleById: async (
    serviceId: string,
    ruleId: string
  ): Promise<
    ApiResponse<ServiceAccessRule>
  > => {

    try {

      const res =
        await api.get<
          ApiResponse<ServiceAccessRule>
        >(
          `/revenue/services/${serviceId}/access-rules/${ruleId}`
        );


      return res.data;

    } catch (error) {

      throw normalizeApiError(error);

    }
  },


  /* =========================================================
     SYNC ALL SECTOR ACCESS RULES
  ========================================================= */

  /**
   * Synchronize the complete sector access configuration
   * for a revenue service.
   *
   * Backend:
   *
   * PUT /revenue/services/{serviceId}/access-rules
   *
   * Payload:
   *
   * {
   *   sectors: [
   *     {
   *       sectorId: "uuid",
   *       sectorName: "Finance",
   *       isActive: true
   *     },
   *     {
   *       sectorId: "uuid",
   *       sectorName: "Revenue",
   *       isActive: false
   *     }
   *   ]
   * }
   */

  syncRules: async (
    serviceId: string,
    data: UpdateServiceAccessRequestPayload
  ): Promise<
    ApiResponse<ServiceAccessRule[]>
  > => {

    try {

      const res =
        await api.put<
          ApiResponse<ServiceAccessRule[]>
        >(
          `/revenue/services/${serviceId}/access-rules`,
          data
        );


      return res.data;

    } catch (error) {

      throw normalizeApiError(error);

    }
  },


  /* =========================================================
     UPDATE SINGLE ACCESS RULE
  ========================================================= */

  /**
   * Update one existing service-sector access rule.
   *
   * Backend:
   *
   * PATCH /revenue/services/{serviceId}/access-rules/{ruleId}
   */

  updateRule: async (
    serviceId: string,
    ruleId: string,
    data: UpdateServiceAccessRulePayload
  ): Promise<
    ApiResponse<ServiceAccessRule>
  > => {

    try {

      const res =
        await api.patch<
          ApiResponse<ServiceAccessRule>
        >(
          `/revenue/services/${serviceId}/access-rules/${ruleId}`,
          data
        );


      return res.data;

    } catch (error) {

      throw normalizeApiError(error);

    }
  },


  /* =========================================================
     ACTIVATE ACCESS RULE
  ========================================================= */

  /**
   * Activate an existing service-sector access rule.
   *
   * Backend controller:
   *
   * PATCH
   * /revenue/services/{serviceId}/access-rules/{ruleId}/status
   *
   * Payload:
   *
   * {
   *   is_active: true
   * }
   */

  activateRule: async (
    serviceId: string,
    ruleId: string
  ): Promise<
    ApiResponse<ServiceAccessRule>
  > => {

    try {

      const res =
        await api.patch<
          ApiResponse<ServiceAccessRule>
        >(
          `/revenue/services/${serviceId}/access-rules/${ruleId}/status`,
          {
            is_active: true,
          }
        );


      return res.data;

    } catch (error) {

      throw normalizeApiError(error);

    }
  },


  /* =========================================================
     DEACTIVATE ACCESS RULE
  ========================================================= */

  /**
   * Deactivate an existing service-sector access rule.
   *
   * Backend controller:
   *
   * PATCH
   * /revenue/services/{serviceId}/access-rules/{ruleId}/status
   *
   * Payload:
   *
   * {
   *   is_active: false
   * }
   */

  deactivateRule: async (
    serviceId: string,
    ruleId: string
  ): Promise<
    ApiResponse<ServiceAccessRule>
  > => {

    try {

      const res =
        await api.patch<
          ApiResponse<ServiceAccessRule>
        >(
          `/revenue/services/${serviceId}/access-rules/${ruleId}/status`,
          {
            is_active: false,
          }
        );


      return res.data;

    } catch (error) {

      throw normalizeApiError(error);

    }
  },

};