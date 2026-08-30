import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import type {
  PaginatedResponse,
  SingleResponse,
} from "@/types/api";

import {
  Citizen,
  CitizenFilters,
  CitizenFormData,
} from "@/types/citizen";

/**
 * citizenService
 *
 * Stateless API layer for Citizens.
 * This service ONLY communicates with backend APIs.
 */
export const citizenService = {
  /* -----------------------------
     GET ALL CITIZENS
  ------------------------------ */
  getAll: async (params?: CitizenFilters) => {
    try {
      const res = await api.get<
        PaginatedResponse<Citizen>
      >(
        "/citizens",
        {
          params,
        }
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* -----------------------------
     GET SINGLE CITIZEN
  ------------------------------ */
  getById: async (
    id: string
  ): Promise<Citizen> => {
    try {
      const res = await api.get<
        SingleResponse<Citizen>
      >(
        `/citizens/${id}`
      );

      return res.data.data!;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* -----------------------------
     CREATE CITIZEN
  ------------------------------ */
  create: async (
    data: CitizenFormData
  ): Promise<Citizen> => {
    try {
      const res = await api.post<
        SingleResponse<Citizen>
      >(
        "/citizens",
        data
      );

      return res.data.data!;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* -----------------------------
     UPDATE CITIZEN
  ------------------------------ */
  update: async (
    id: string,
    data: CitizenFormData
  ): Promise<Citizen> => {
    try {
      const res = await api.put<
        SingleResponse<Citizen>
      >(
        `/citizens/${id}`,
        data
      );

      return res.data.data!;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* -----------------------------
     TOGGLE CITIZEN STATUS
  ------------------------------ */

  /**
   * Activate or deactivate a citizen.
   *
   * PATCH /citizens/{id}/status
   *
   * Request:
   *
   * {
   *   is_active: true
   * }
   *
   * or
   *
   * {
   *   is_active: false
   * }
   */
  toggleStatus: async (
    id: string,
    isActive: boolean
  ): Promise<Citizen> => {
    try {
      const res = await api.patch<
        SingleResponse<Citizen>
      >(
        `/citizens/${id}/status`,
        {
          is_active: isActive,
        }
      );

      return res.data.data!;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* -----------------------------
     DELETE CITIZEN
  ------------------------------ */
  delete: async (
    id: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      const res = await api.delete<
        SingleResponse<null>
      >(
        `/citizens/${id}`
      );

      return {
        success: res.data.success,
        message: res.data.message,
      };
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* -----------------------------
     DOWNLOAD IMPORT TEMPLATE
  ------------------------------ */
  downloadTemplate: async () => {
    try {
      const res = await api.get(
        "/citizens/import/template",
        {
          responseType: "blob",
        }
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* -----------------------------
     IMPORT CITIZENS
  ------------------------------ */
  import: async (
    file: File,
    onProgress?: (
      progress: number
    ) => void
  ) => {
    try {
      const formData = new FormData();

      formData.append(
        "file",
        file
      );

      const res = await api.post<
        SingleResponse<{
          imported: number;
          failed: number;
          errors?: unknown[];
        }>
      >(
        "/citizens/import",
        formData,
        {
          onUploadProgress(event) {
            if (event.total) {
              const percent =
                Math.round(
                  (event.loaded * 100) /
                    event.total
                );

              onProgress?.(
                percent
              );
            }
          },
        }
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* -----------------------------
     EXPORT CITIZENS
  ------------------------------ */
  export: async (
    params?: CitizenFilters
  ) => {
    try {
      const res = await api.get(
        "/citizens/export",
        {
          params,
          responseType: "blob",
        }
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};