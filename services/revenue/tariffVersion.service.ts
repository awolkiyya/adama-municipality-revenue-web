import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import {
  TariffVersion,
  CreateTariffVersionPayload,
  UpdateTariffVersionPayload,
  CurrentActiveTariffSummary,
} from "@/types/revenue/tariff-version";



export const tariffVersionService = {



  /**
   * GET ALL TARIFF VERSIONS
   */
  getTariffVersions: async (
    params?: {
      search?: string;
      year?: number;
      is_active?: boolean;
      page?: number;
      per_page?: number;
      sort_by?: string;
      sort_direction?: "asc" | "desc";
    }
  ): Promise<ListResponse<TariffVersion,CurrentActiveTariffSummary>> => {


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
        await api.get<ListResponse<TariffVersion,CurrentActiveTariffSummary>>(
          "/revenue/tariff-versions",
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
   * GET CURRENT ACTIVE TARIFF SUMMARY
   */
  getSummary: async (): Promise<
    ApiResponse<CurrentActiveTariffSummary>
  > => {


    try {


      const res =
        await api.get<ApiResponse<CurrentActiveTariffSummary>>(
          "/revenue/tariff-versions/summary"
        );


      return res.data;



    } catch(error) {

      throw normalizeApiError(error);

    }

  },









  /**
   * GET SINGLE TARIFF VERSION
   */
  getTariffVersionById: async (
    id:string
  ):Promise<ApiResponse<TariffVersion>> => {


    try {


      const res =
        await api.get<ApiResponse<TariffVersion>>(
          `/revenue/tariff-versions/${id}`
        );


      return res.data;



    } catch(error) {

      throw normalizeApiError(error);

    }

  },









  /**
   * CREATE TARIFF VERSION
   *
   * Example:
   *
   * {
   *   year:2026,
   *   version:1,
   *   name:"2026 Standard Tariff",
   *   effectiveFrom:"2026-01-01"
   * }
   */
  createTariffVersion: async (
    data:CreateTariffVersionPayload
  ):Promise<ApiResponse<TariffVersion>> => {


    try {


      const res =
        await api.post<ApiResponse<TariffVersion>>(
          "/revenue/tariff-versions",
          data
        );


      return res.data;



    } catch(error) {

      throw normalizeApiError(error);

    }

  },









  /**
   * UPDATE TARIFF VERSION
   */
  updateTariffVersion: async (
    id:string,
    data:UpdateTariffVersionPayload
  ):Promise<ApiResponse<TariffVersion>> => {


    try {


      const res =
        await api.patch<ApiResponse<TariffVersion>>(
          `/revenue/tariff-versions/${id}`,
          data
        );


      return res.data;



    } catch(error) {

      throw normalizeApiError(error);

    }

  },









  /**
   * ACTIVATE TARIFF VERSION
   */
  activateTariffVersion: async (
    id:string
  ):Promise<ApiResponse<TariffVersion>> => {


    try {


      const res =
        await api.patch<ApiResponse<TariffVersion>>(
          `/revenue/tariff-versions/${id}/activate`
        );


      return res.data;



    } catch(error) {

      throw normalizeApiError(error);

    }

  },









  /**
   * DELETE TARIFF VERSION
   */
  deleteTariffVersion: async (
    id:string
  ):Promise<ApiResponse<null>> => {


    try {


      const res =
        await api.delete<ApiResponse<null>>(
          `/revenue/tariff-versions/${id}`
        );


      return res.data;



    } catch(error) {

      throw normalizeApiError(error);

    }

  },









  /**
   * RESTORE TARIFF VERSION
   */
  restoreTariffVersion: async (
    id:string
  ):Promise<ApiResponse<null>> => {


    try {


      const res =
        await api.patch<ApiResponse<null>>(
          `/revenue/tariff-versions/${id}/restore`
        );


      return res.data;



    } catch(error) {

      throw normalizeApiError(error);

    }

  },

};