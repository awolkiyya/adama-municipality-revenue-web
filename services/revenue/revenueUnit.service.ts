import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";


import {
  ApiResponse,
  ListResponse,
} from "@/types/api";
import { MeasurementUnit, MeasurementUnitFilters } from "@/types/revenue/revenue-unit";



export const measurementUnitService = {


  /**
   * GET ALL MEASUREMENT UNITS
   */
  getUnits: async(
    params?: MeasurementUnitFilters
  ): Promise<ListResponse<MeasurementUnit>> => {


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
        await api.get<ListResponse<MeasurementUnit>>(
          "/revenue/measurement-units",
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
   * GET UNIT DETAIL
   */
  getUnitById: async(
    id:string
  ):Promise<ApiResponse<MeasurementUnit>>=>{


    try{


      const res =
        await api.get<ApiResponse<MeasurementUnit>>(
          `/revenue/measurement-units/${id}`
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },







  /**
   * CREATE UNIT
   */
  createUnit: async(
    data:Partial<MeasurementUnit>
  ):Promise<ApiResponse<MeasurementUnit>>=>{


    try{


      const res =
        await api.post<ApiResponse<MeasurementUnit>>(
          "/revenue/measurement-units",
          data
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },







  /**
   * UPDATE UNIT
   */
  updateUnit: async(
    id:string,
    data:Partial<MeasurementUnit>
  ):Promise<ApiResponse<MeasurementUnit>>=>{


    try{


      const res =
        await api.patch<ApiResponse<MeasurementUnit>>(
          `/measurement-units/${id}`,
          data
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },







  /**
   * ACTIVATE UNIT
   */
  activateUnit: async(
    id:string
  ):Promise<ApiResponse<MeasurementUnit>>=>{


    try{


      const res =
        await api.patch<ApiResponse<MeasurementUnit>>(
          `/measurement-units/${id}/activate`
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },







  /**
   * DEACTIVATE UNIT
   */
  deactivateUnit: async(
    id:string
  ):Promise<ApiResponse<MeasurementUnit>>=>{


    try{


      const res =
        await api.patch<ApiResponse<MeasurementUnit>>(
          `/measurement-units/${id}/deactivate`
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },







  /**
   * DELETE UNIT
   */
  deleteUnit: async(
    id:string
  ):Promise<ApiResponse<null>>=>{


    try{


      const res =
        await api.delete<ApiResponse<null>>(
          `/measurement-units/${id}`
        );


      return res.data;


    }catch(error){

      throw normalizeApiError(error);

    }

  },


};