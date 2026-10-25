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
getBaseFields: async (
  params?: BaseFieldFilters,
): Promise<ListResponse<BaseField>> => {
  try {
    const cleanParams: Record<
      string,
      string | number | boolean
    > = {};

    if (params?.page !== undefined) {
      cleanParams.page = params.page;
    }

    if (params?.per_page !== undefined) {
      cleanParams.per_page = params.per_page;
    }

    if (params?.search?.trim()) {
      cleanParams.search = params.search.trim();
    }

    // Map frontend camelCase to Laravel snake_case.
    if (params?.dataType) {
      cleanParams.data_type = params.dataType;
    }

    // Preserve false to allow filtering inactive records.
    if (params?.isActive !== undefined) {
      cleanParams.is_active = params.isActive;
    }

    // Include requested IDs when provided.
    if (params?.ids?.length) {
      cleanParams.ids = params.ids.join(",");
    }

    const res = await api.get<ListResponse<BaseField>>(
      "/revenue/base-fields",
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
   * GET BASE FIELD DETAIL
   */
  getBaseFieldById: async(
    id:string
  ):Promise<ApiResponse<BaseField>>=>{


    try{


      const res =
        await api.get<ApiResponse<BaseField>>(
          `/revenue/base-fields/${id}`
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