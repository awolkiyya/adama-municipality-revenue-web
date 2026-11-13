
import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import type { ApiResponse, ListResponse } from "@/types/api";

import type {
  CreateTariffRulePayload,
  TariffRuleRecord,
  UpdateTariffRulePayload,
} from "@/types/revenue/tariff-form";

export type TariffRuleQueryParams = {
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_direction?: "asc" | "desc";
  is_active?: boolean;
  tariff_version_id?: string;
  [key: string]: unknown;
};



export type CopyTariffFormulaOptions = {
  variables: boolean;
  expression: boolean;
  conditions: boolean;
};

export type CopyTariffFormulaPayload = {
  source_rule_id: string;
  options: CopyTariffFormulaOptions;
  overwrite: boolean;
};

export type CopyTariffFormulaResponse = {
  message?: string;
  data?: {
    source_rule_id?: string;
    destination_rule_id?: string;
    copied?: CopyTariffFormulaOptions;
  };
};


export const tariffRuleService = {
  /**
   * GET ALL TARIFF RULES
   */
  getTariffRules: async (
    tariffVersionId: string,
    params?: TariffRuleQueryParams
  ): Promise<ListResponse<TariffRuleRecord>> => {
    try {
      const queryParams = Object.fromEntries(
        Object.entries(params ?? {}).filter(
          ([key]) => key !== "tariff_version_id"
        )
      );

      const res = await api.get<ListResponse<TariffRuleRecord>>(
        `/revenue/tariff-versions/${tariffVersionId}/tariff-rules`,
        {
          params: queryParams,
        }
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * GET SINGLE TARIFF RULE
   */
  getTariffRuleById: async (
    id: string,
    tariffVersionId: string
  ): Promise<ApiResponse<TariffRuleRecord>> => {
    try {
      const res = await api.get<ApiResponse<TariffRuleRecord>>(
        `/revenue/tariff-versions/${tariffVersionId}/tariff-rules/${id}`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * CREATE TARIFF RULE
   */
  createTariffRule: async (
    tariffVersionId: string,
    data: CreateTariffRulePayload
  ): Promise<ApiResponse<TariffRuleRecord>> => {
    try {
      const res = await api.post<ApiResponse<TariffRuleRecord>>(
        `/revenue/tariff-versions/${tariffVersionId}/tariff-rules`,
        data
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * UPDATE TARIFF RULE
   */
  updateTariffRule: async (
    tariffVersionId: string,
    id: string,
    data: UpdateTariffRulePayload
  ): Promise<ApiResponse<TariffRuleRecord>> => {
    try {
      const res = await api.patch<ApiResponse<TariffRuleRecord>>(
        `/revenue/tariff-versions/${tariffVersionId}/tariff-rules/${id}`,
        data
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * DELETE TARIFF RULE
   */
  deleteTariffRule: async (
    id: string
  ): Promise<ApiResponse<null>> => {
    try {
      const res = await api.delete<ApiResponse<null>>(
        `/revenue/tariff-rules/${id}`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * RESTORE TARIFF RULE
   */
  restoreTariffRule: async (
    id: string
  ): Promise<ApiResponse<TariffRuleRecord>> => {
    try {
      const res = await api.patch<ApiResponse<TariffRuleRecord>>(
        `/revenue/tariff-rules/${id}/restore`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * ACTIVATE TARIFF RULE
   */
  activateTariffRule: async (
    id: string
  ): Promise<ApiResponse<TariffRuleRecord>> => {
    try {
      const res = await api.patch<ApiResponse<TariffRuleRecord>>(
        `/revenue/tariff-rules/${id}/activate`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * DEACTIVATE TARIFF RULE
   */
  deactivateTariffRule: async (
    id: string
  ): Promise<ApiResponse<TariffRuleRecord>> => {
    try {
      const res = await api.patch<ApiResponse<TariffRuleRecord>>(
        `/revenue/tariff-rules/${id}/deactivate`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },



  /**
   * COPY FORMULA CONFIGURATION
   *
   * Copies selected formula configuration from a source rule
   * into a destination rule within the same tariff version.
   */
  copyFormula: async (
    tariffVersionId: string,
    destinationRuleId: string,
    data: CopyTariffFormulaPayload
  ): Promise<ApiResponse<CopyTariffFormulaResponse["data"]>> => {
    try {
      const res = await api.post<
        ApiResponse<CopyTariffFormulaResponse["data"]>
      >(
        `/revenue/tariff-versions/${tariffVersionId}/tariff-rules/${destinationRuleId}/copy-formula`,
        data
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

};
