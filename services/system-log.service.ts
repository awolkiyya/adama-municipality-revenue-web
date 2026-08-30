// src/modules/audit/services/system-log.service.ts

import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";
import { ApiResponse, PaginatedResponse } from "@/types/api";
import {
  PaginatedData,
  SystemLog,
  SystemLogQuery,
} from "@/types/auditLog";

/**
 * systemLogService
 *
 * Stateless API layer for System Audit Logs.
 *
 * Backend is responsible for:
 * - searching
 * - filtering
 * - sorting
 * - pagination
 */
export const systemLogService = {

  /* -----------------------------
     GET AUDIT LOGS (Paginated)
  ------------------------------ */
  getAll: async (
    params?: SystemLogQuery
  ): Promise<PaginatedResponse<SystemLog>> => {
    try {
      /**
       * Remove empty values before sending the request.
       *
       * Example:
       *
       * {
       *   search: "",
       *   action: null,
       *   module: "Users",
       *   page: 1
       * }
       *
       * becomes:
       *
       * {
       *   module: "Users",
       *   page: 1
       * }
       */
      const cleanParams = Object.entries(params || {}).reduce(
        (acc, [key, value]) => {
          if (
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {
            acc[key] = value;
          }

          return acc;
        },
        {} as Record<string, unknown>
      );

      const res = await api.get<
      PaginatedResponse<SystemLog>
      >("/audit-logs", {
        params: cleanParams,
      });

      return res.data;

    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /* -----------------------------
     GET SINGLE AUDIT LOG
  ------------------------------ */
  getById: async (
    id: string
  ): Promise<ApiResponse<SystemLog>> => {
    try {
      const res = await api.get<ApiResponse<SystemLog>>(
        `/audit-logs/${id}`
      );

      return res.data;

    } catch (error) {
      throw normalizeApiError(error);
    }
  },

};