import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";
import { ApiResponse, ListResponse } from "@/types/api";
import { AdminUnit, Cluster, Sector } from "@/types/admin-unit";

/**
 * adminUnitService
 * * Stateless API layer for Administrative Units and Sectors.
 */
export const adminUnitService = {

  /* -----------------------------
     GET ALL UNITS (Paginated)
  ------------------------------ */
  getAll: async (params?: { 
    level?: string | 'ALL'; 
    search?: string; 
    page?: number;
    per_page?: number;
  }): Promise<ApiResponse<AdminUnit[]>> => {
    try {
      // 1. Clean the params object
      const cleanParams = Object.entries(params || {}).reduce((acc, [key, value]) => {
        // Exclude if undefined, null, or the string "all"
        if (value !== undefined && value !== null && value !== 'ALL') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      // 2. Pass the clean params to the API
      const res = await api.get<ApiResponse<AdminUnit[]>>("/administrative", {
        params: cleanParams
      });
      
      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* -----------------------------
     GET SINGLE UNIT
  ------------------------------ */
  getById: async (id: string): Promise<ApiResponse<AdminUnit>> => {
    try {
      const res = await api.get<ApiResponse<AdminUnit>>(`/administrative/${id}`);
      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* -----------------------------
     CREATE UNIT
  ------------------------------ */
  create: async (data: {
    name: string;
    code: string;
    level: 'CITY' | 'SUBCITY' | 'WEREDA';
    parent_id?: string | null;
  }): Promise<ApiResponse<AdminUnit>> => {
    try {
      const res = await api.post<ApiResponse<AdminUnit>>("/administrative", data);
      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* -----------------------------
     UPDATE UNIT
  ------------------------------ */
  update: async (id: string, data: Partial<{
    name: string;
    is_active: boolean;
  }>): Promise<ApiResponse<AdminUnit>> => {
    try {
      const res = await api.patch<ApiResponse<AdminUnit>>(`/administrative/${id}`, data);
      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* -----------------------------
     DELETE UNIT
  ------------------------------ */
  delete: async (id: string): Promise<ApiResponse<null>> => {
    try {
      const res = await api.delete<ApiResponse<null>>(`/administrative/${id}`);
      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* -----------------------------
     GET CHILDREN
  ------------------------------ */
  getChildren: async (id: string): Promise<ApiResponse<AdminUnit[]>> => {
    try {
      const res = await api.get<ApiResponse<AdminUnit[]>>(`/administrative/${id}/children`);
      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },


  // cluster related
  /* -----------------------------
   GET CLUSTERS (Paginated)
  ------------------------------ */
  getClusters: async (params?: {
    city_id?: string;
    search?: string;
    is_active?: boolean;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: "asc" | "desc";
  }): Promise<ListResponse<Cluster>> => {
    try {
      const cleanParams = Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const res = await api.get<ListResponse<Cluster>>(
        "/administrative/clusters",
        {
          params: cleanParams,
        }
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

    // sector related
  /* -----------------------------
     GET SECTORS (Paginated)
  ------------------------------ */
  getSectors: async (params?: {
    cluster_id?: string;
    search?: string;
    is_active?: boolean;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: "asc" | "desc";
  }): Promise<ListResponse<Sector>> => {
    try {
      const cleanParams = Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          acc[key] = value;
        }

        return acc;
      }, {} as Record<string, any>);


      const res = await api.get<ListResponse<Sector>>(
        "/administrative/sectors",
        {
          params: cleanParams,
        }
      );

      return res.data;

    } catch (error) {
      throw normalizeApiError(error);
    }
  },


  /* -----------------------------
     CREATE SECTOR
  ------------------------------ */
  createSector: async (data: {
    name: string;
    code: string;
    description: string;
    cluster_id: string;
  }): Promise<ApiResponse<Sector>> => {
    try {

      const res = await api.post<ApiResponse<Sector>>(
        "/administrative/sectors",
        data
      );

      return res.data;

    } catch (error) {
      throw normalizeApiError(error);
    }
  },



  /* -----------------------------
     UPDATE SECTOR
  ------------------------------ */
  updateSector: async (
    id: string,
    data: Partial<{
      name: string;
      code: string;
      description: string;
      cluster_id: string;
      is_active: boolean;
    }>
  ): Promise<ApiResponse<Sector>> => {

    try {

      const res = await api.patch<ApiResponse<Sector>>(
        `/administrative/sectors/${id}`,
        data
      );

      return res.data;

    } catch (error) {
      throw normalizeApiError(error);
    }

  },

  /* -----------------------------
     DELETE SECTOR
  ------------------------------ */
  deleteSector: async (
    id: string
  ): Promise<ApiResponse<null>> => {
    try {

      const res = await api.delete<ApiResponse<null>>(
        `/administrative/sectors/${id}`
      );

      return res.data;

    } catch (error) {
      throw normalizeApiError(error);
    }
  },

};