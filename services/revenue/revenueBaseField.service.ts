import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";


import {
  ApiResponse,
  ListResponse,
} from "@/types/api";
import { BaseField, BaseFieldFilters } from "@/types/revenue/revenue-baseField";



export const baseFieldService = {


  /**
   * GET ALL BASE FIELDS
   */
  getBaseFields: async(
    params?: BaseFieldFilters
  ): Promise<ListResponse<BaseField>>=>{


    try{


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
        await api.get<ListResponse<BaseField>>(
          "/revenue/base-fields",
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
   * GET BASE FIELD DETAIL
   */
  getBaseFieldById: async(
    id:string
  ):Promise<ApiResponse<BaseField>>=>{


    try{


      const res =
        await api.get<ApiResponse<BaseField>>(
          `/base-fields/${id}`
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },







  /**
   * CREATE BASE FIELD
   */
  createBaseField: async(
    data:Partial<BaseField>
  ):Promise<ApiResponse<BaseField>>=>{


    try{


      const res =
        await api.post<ApiResponse<BaseField>>(
          "/revenue/base-fields",
          data
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },







  /**
   * UPDATE BASE FIELD
   */
  updateBaseField: async(
    id:string,
    data:Partial<BaseField>
  ):Promise<ApiResponse<BaseField>>=>{


    try{


      const res =
        await api.patch<ApiResponse<BaseField>>(
          `/revenue/base-fields/${id}`,
          data
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },







  /**
   * ACTIVATE BASE FIELD
   */
  activateBaseField: async(
    id:string
  ):Promise<ApiResponse<BaseField>>=>{


    try{


      const res =
        await api.patch<ApiResponse<BaseField>>(
          `/revenue/base-fields/${id}/activate`
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },







  /**
   * DEACTIVATE BASE FIELD
   */
  deactivateBaseField: async(
    id:string
  ):Promise<ApiResponse<BaseField>>=>{


    try{


      const res =
        await api.patch<ApiResponse<BaseField>>(
          `/revenue/base-fields/${id}/deactivate`
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },







  /**
   * DELETE BASE FIELD
   */
  deleteBaseField: async(
    id:string
  ):Promise<ApiResponse<null>>=>{


    try{


      const res =
        await api.delete<ApiResponse<null>>(
          `/revenue/base-fields/${id}`
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },


};