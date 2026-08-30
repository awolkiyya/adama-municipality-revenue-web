import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import { ApiResponse, ListResponse } from "@/types/api";

import {
  TariffFormulaVariable,
  CreateTariffFormulaVariableRequest,
  UpdateTariffFormulaVariableRequest,
  TariffFormulaVariableApiPayload,
} from "@/types/revenue/tariff-formula-variable";

export const tariffFormulaVariableService = {
  /*
  |--------------------------------------------------------------------------
  | GET ALL FORMULA VARIABLES
  |--------------------------------------------------------------------------
  */

  getFormulaVariables: async (
    tariffRuleId: string
  ): Promise<ListResponse<TariffFormulaVariable>> => {
    try {
      const res = await api.get<
        ListResponse<TariffFormulaVariable>
      >(
        `/revenue/tariff-rules/${tariffRuleId}/formula-variables`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | GET SINGLE FORMULA VARIABLE
  |--------------------------------------------------------------------------
  */

  getFormulaVariableById: async (
    tariffRuleId: string,
    variableId: string
  ): Promise<ApiResponse<TariffFormulaVariable>> => {
    try {
      const res = await api.get<
        ApiResponse<TariffFormulaVariable>
      >(
        `/revenue/tariff-rules/${tariffRuleId}/formula-variables/${variableId}`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE FORMULA VARIABLE
  |--------------------------------------------------------------------------
  */

  createFormulaVariable: async (
    tariffRuleId: string,
    data: TariffFormulaVariableApiPayload
  ): Promise<ApiResponse<TariffFormulaVariable>> => {
    try {
      const res = await api.post<
        ApiResponse<TariffFormulaVariable>
      >(
        `/revenue/tariff-rules/${tariffRuleId}/formula-variables`,
        data
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE FORMULA VARIABLE
  |--------------------------------------------------------------------------
  */

  updateFormulaVariable: async (
    tariffRuleId: string,
    variableId: string,
    data: TariffFormulaVariableApiPayload
  ): Promise<ApiResponse<TariffFormulaVariable>> => {
    try {
      const res = await api.patch<
        ApiResponse<TariffFormulaVariable>
      >(
        `/revenue/tariff-rules/${tariffRuleId}/formula-variables/${variableId}`,
        data
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | DELETE FORMULA VARIABLE
  |--------------------------------------------------------------------------
  */

  deleteFormulaVariable: async (
    tariffRuleId: string,
    variableId: string
  ): Promise<ApiResponse<null>> => {
    try {
      const res = await api.delete<ApiResponse<null>>(
        `/revenue/tariff-rules/${tariffRuleId}/formula-variables/${variableId}`
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};