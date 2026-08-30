import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import {
  RevenueCategory,
  CreateRevenueCategoryPayload,
  UpdateRevenueCategoryPayload,
  RevenueCategoryFilters,
  RevenueCategorySummary,
} from "@/types/revenue/revenue-category";

import {
  ApiResponse,
  ListResponse,
} from "@/types/api";



export const revenueCategoryService = {


  /**
   * GET ALL CATEGORIES
   */
  getCategories: async(
    params?: RevenueCategoryFilters
  ): Promise<ListResponse<RevenueCategory,RevenueCategorySummary>> => {


    try {


      const cleanParams =
        Object.entries(params || {})
        .reduce((acc,[key,value])=>{


          if(
            value !== undefined &&
            value !== null &&
            value !== "" &&
            value !== "ALL"
          ){

            acc[key] = value;

          }


          return acc;


        },{} as Record<string,any>);



      const res =
        await api.get<ListResponse<RevenueCategory,RevenueCategorySummary>>(
          "/revenue/categories",
          {
            params: cleanParams
          }
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },





  /**
   * GET CATEGORY DETAIL
   */
  getCategoryById: async(
    id:string
  ):Promise<ApiResponse<RevenueCategory>>=>{


    try{

      const res =
        await api.get<ApiResponse<RevenueCategory>>(
          `/revenue/categories/${id}`
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },







  /**
   * CREATE CATEGORY + CODES
   */
  createCategory: async(
    data:CreateRevenueCategoryPayload
  ):Promise<ApiResponse<RevenueCategory>>=>{


    try{

      const res =
        await api.post<ApiResponse<RevenueCategory>>(
          "/revenue/categories",
          data
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },







  /**
   * UPDATE CATEGORY
   */
  updateCategory: async(
    id:string,
    data:UpdateRevenueCategoryPayload
  ):Promise<ApiResponse<RevenueCategory>>=>{


    try{


      const res =
        await api.patch<ApiResponse<RevenueCategory>>(
          `/revenue/categories/${id}`,
          data
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },







  /**
   * ACTIVATE CATEGORY
   */
  activateCategory: async(
    id:string
  ):Promise<ApiResponse<RevenueCategory>>=>{


    try{


      const res =
        await api.patch<ApiResponse<RevenueCategory>>(
          `/revenue/categories/${id}/activate`
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },







  /**
   * DEACTIVATE CATEGORY
   */
  deactivateCategory: async(
    id:string
  ):Promise<ApiResponse<RevenueCategory>>=>{


    try{


      const res =
        await api.patch<ApiResponse<RevenueCategory>>(
          `/revenue/categories/${id}/deactivate`
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },







  /**
   * DELETE CATEGORY
   */
  deleteCategory: async(
    id:string
  ):Promise<ApiResponse<null>>=>{


    try{


      const res =
        await api.delete<ApiResponse<null>>(
          `/revenue/categories/${id}`
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },


};