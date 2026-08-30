import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import {
  RevenueCode,
} from "@/types/revenue/revenue-code";

import {
  ListResponse,
} from "@/types/api";



export const revenueCodeService = {



  /**
   * GET ACTIVE REVENUE CODES
   *
   * Used for dropdowns/selects
   *
   * Supports:
   * - search
   * - pagination
   */
  getCodes: async (
    params?: {
      search?: string;
      page?: number;
      per_page?: number;
      is_active?: boolean;
    }
  ): Promise<ListResponse<RevenueCode>> => {


    try {


      const cleanParams =
        Object.entries(params || {})
        .reduce((acc, [key, value]) => {


          if (
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {

            acc[key] = value;

          }


          return acc;


        }, {} as Record<string, any>);



      const res =
        await api.get<
          ListResponse<RevenueCode>
        >(
          "/revenue/codes",
          {
            params: cleanParams,
          }
        );



      return res.data;



    } catch(error) {


      throw normalizeApiError(error);


    }


  },



};