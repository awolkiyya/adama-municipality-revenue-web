import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import {
  ServiceAccessRule,
  CreateServiceAccessRulePayload,
  UpdateServiceAccessRulePayload,
  ServiceAccessRuleSummary,
} from "@/types/revenue/service-access-rule";



export const serviceAccessRuleService = {



  /**
   * GET ALL ACCESS RULES FOR SERVICE
   */
  getRules: async (
    serviceId: string,
    params?: {
      sector_id?: string;
      role_id?: string;
      is_active?: boolean;
      page?: number;
      per_page?: number;
    }
  ): Promise<ListResponse<ServiceAccessRule, ServiceAccessRuleSummary>> => {


    try {


      const cleanParams =
        Object.entries(params || {})
          .reduce((acc, [key, value]) => {


            if (
              value !== undefined &&
              value !== null &&
              value !== "" &&
              value !== "ALL"
            ) {

              acc[key] = value;

            }


            return acc;


          }, {} as Record<string, any>);



      const res =
        await api.get<ListResponse<ServiceAccessRule, ServiceAccessRuleSummary>>(
          `/revenue/services/${serviceId}/access-rules`,
          {
            params: cleanParams,
          }
        );



      return res.data;


    } catch(error) {

      throw normalizeApiError(error);

    }

  },







  /**
   * GET SINGLE ACCESS RULE
   */
  getRuleById: async (
    serviceId: string,
    ruleId: string
  ): Promise<ApiResponse<ServiceAccessRule>> => {


    try {


      const res =
        await api.get<ApiResponse<ServiceAccessRule>>(
          `/revenue/services/${serviceId}/access-rules/${ruleId}`
        );



      return res.data;



    } catch(error) {

      throw normalizeApiError(error);

    }

  },









  /**
   * CREATE ACCESS RULE
   *
   * Example:
   *
   * {
   *   sector_id:"uuid",
   *   role_id:"uuid",
   *   actions:[
   *      "CREATE",
   *      "APPROVE"
   *   ]
   * }
   */
  createRule: async (
    serviceId:string,
    data:CreateServiceAccessRulePayload
  ):Promise<ApiResponse<ServiceAccessRule>> => {


    try {


      const res =
        await api.post<ApiResponse<ServiceAccessRule>>(
          `/revenue/services/${serviceId}/access-rules`,
          data
        );



      return res.data;



    }catch(error){

      throw normalizeApiError(error);

    }

  },









  /**
   * UPDATE ACCESS RULE
   */
  updateRule: async (
    serviceId:string,
    ruleId:string,
    data:UpdateServiceAccessRulePayload
  ):Promise<ApiResponse<ServiceAccessRule>> => {


    try {


      const res =
        await api.patch<ApiResponse<ServiceAccessRule>>(
          `/revenue/services/${serviceId}/access-rules/${ruleId}`,
          data
        );



      return res.data;



    }catch(error){

      throw normalizeApiError(error);

    }

  },









  /**
   * ACTIVATE RULE
   */
  activateRule: async (
    serviceId:string,
    ruleId:string
  ):Promise<ApiResponse<ServiceAccessRule>> => {


    try {


      const res =
        await api.patch<ApiResponse<ServiceAccessRule>>(
          `/revenue/services/${serviceId}/access-rules/${ruleId}/activate`
        );



      return res.data;



    }catch(error){

      throw normalizeApiError(error);

    }

  },









  /**
   * DEACTIVATE RULE
   */
  deactivateRule: async (
    serviceId:string,
    ruleId:string
  ):Promise<ApiResponse<ServiceAccessRule>> => {


    try {


      const res =
        await api.patch<ApiResponse<ServiceAccessRule>>(
          `/revenue/services/${serviceId}/access-rules/${ruleId}/deactivate`
        );



      return res.data;



    }catch(error){

      throw normalizeApiError(error);

    }

  },









  /**
   * DELETE ACCESS RULE
   */
  deleteRule: async (
    serviceId:string,
    ruleId:string
  ):Promise<ApiResponse<null>> => {


    try {


      const res =
        await api.delete<ApiResponse<null>>(
          `/revenue/services/${serviceId}/access-rules/${ruleId}`
        );



      return res.data;



    }catch(error){

      throw normalizeApiError(error);

    }

  },


};