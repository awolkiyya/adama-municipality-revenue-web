import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import {
  ApiResponse,
  ListResponse,
} from "@/types/api";
import { CreateTariffRulePayload, TariffRuleRecord, UpdateTariffRulePayload } from "@/types/revenue/tariff-form";



export const tariffRuleService = {


  /**
   * GET ALL TARIFF RULES
   */
  getTariffRules: async (
    tariffVersionId:string,
    params:any
  )=>{
    
    const res =
      await api.get(
        `/revenue/tariff-versions/${tariffVersionId}/tariff-rules`,
        {
          params:{
            ...params,
            tariff_version_id:undefined
          }
        }
      );
  
  
    return res.data;
  
  },



  /**
   * GET SINGLE TARIFF RULE
   */
  getTariffRuleById: async (
    id:string,
    tariffVersionId:string,

  ):Promise<ApiResponse<TariffRuleRecord>> => {

    try {

      const res =
        await api.get<ApiResponse<TariffRuleRecord>>(
          `/revenue/tariff-versions/${tariffVersionId}/tariff-rules/${id}`
        );


      return res.data;


    } catch(error) {

      throw normalizeApiError(error);

    }

  },




  /**
   * CREATE TARIFF RULE
   */
  createTariffRule: async (
    tariffVersionId:string,
    data:CreateTariffRulePayload
  ):Promise<ApiResponse<TariffRuleRecord>> => {
  
    try {
  
      const res =
        await api.post<ApiResponse<TariffRuleRecord>>(
          `/revenue/tariff-versions/${tariffVersionId}/tariff-rules`,
          data
        );
  
      return res.data;
  
  
    } catch(error) {
  
      throw normalizeApiError(error);
  
    }
  
  },




  /**
   * UPDATE TARIFF RULE
   */
  updateTariffRule: async (
    id:string,
    data:UpdateTariffRulePayload
  ):Promise<ApiResponse<TariffRuleRecord>> => {


    try {

      const res =
        await api.patch<ApiResponse<TariffRuleRecord>>(
          `/revenue/tariff-rules/${id}`,
          data
        );


      return res.data;


    } catch(error) {

      throw normalizeApiError(error);

    }

  },




  /**
   * DELETE TARIFF RULE
   */
  deleteTariffRule: async (
    id:string
  ):Promise<ApiResponse<null>> => {


    try {

      const res =
        await api.delete<ApiResponse<null>>(
          `/revenue/tariff-rules/${id}`
        );


      return res.data;


    } catch(error) {

      throw normalizeApiError(error);

    }

  },




  /**
   * RESTORE TARIFF RULE
   */
  restoreTariffRule: async (
    id:string
  ):Promise<ApiResponse<TariffRuleRecord>> => {


    try {

      const res =
        await api.patch<ApiResponse<TariffRuleRecord>>(
          `/revenue/tariff-rules/${id}/restore`
        );


      return res.data;


    } catch(error) {

      throw normalizeApiError(error);

    }

  },




  /**
   * ACTIVATE TARIFF RULE
   */
  activateTariffRule: async (
    id:string
  ):Promise<ApiResponse<TariffRuleRecord>> => {


    try {

      const res =
        await api.patch<ApiResponse<TariffRuleRecord>>(
          `/revenue/tariff-rules/${id}/activate`
        );


      return res.data;


    } catch(error) {

      throw normalizeApiError(error);

    }

  },




  /**
   * DEACTIVATE TARIFF RULE
   */
  deactivateTariffRule: async (
    id:string
  ):Promise<ApiResponse<TariffRuleRecord>> => {


    try {

      const res =
        await api.patch<ApiResponse<TariffRuleRecord>>(
          `/revenue/tariff-rules/${id}/deactivate`
        );


      return res.data;


    } catch(error) {

      throw normalizeApiError(error);

    }

  },


};