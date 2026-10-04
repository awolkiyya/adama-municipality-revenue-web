import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import type {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import type {
  PaymentProvider,
  PaymentProviderFilters,
  PaymentProviderFormData,
} from "@/types/revenue/payment-provider";

// =====================================================
// PAYMENT PROVIDER SERVICE
// =====================================================

const cleanPaymentProviderParams = (
  params?: PaymentProviderFilters,
): Record<string, unknown> => {
  return Object.entries(
    params ?? {},
  ).reduce(
    (
      acc,
      [key, value],
    ) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "ALL"
      ) {
        acc[key] = value;
      }

      return acc;
    },
    {} as Record<string, unknown>,
  );
};

export const paymentProviderService = {
  // ===================================================
  // GET PAYMENT PROVIDERS
  // ===================================================

  getPaymentProviders: async (
    params?: PaymentProviderFilters,
  ): Promise<ListResponse<PaymentProvider>> => {
    try {
      const res =
        await api.get<ListResponse<PaymentProvider>>(
          "/revenue/payment-providers",
          {
            params:
              cleanPaymentProviderParams(params),
          },
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  // ===================================================
  // GET PAYMENT PROVIDER BY ID
  // ===================================================

  getPaymentProviderById: async (
    id: string,
  ): Promise<ApiResponse<PaymentProvider>> => {
    try {
      const res =
        await api.get<ApiResponse<PaymentProvider>>(
          `/revenue/payment-providers/${id}`,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  // ===================================================
  // CREATE PAYMENT PROVIDER
  // ===================================================

  createPaymentProvider: async (
    data: PaymentProviderFormData,
  ): Promise<ApiResponse<PaymentProvider>> => {
    try {
      const res =
        await api.post<ApiResponse<PaymentProvider>>(
          "/revenue/payment-providers",
          data,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  // ===================================================
  // UPDATE PAYMENT PROVIDER
  // ===================================================

  updatePaymentProvider: async (
    id: string,
    data: PaymentProviderFormData,
  ): Promise<ApiResponse<PaymentProvider>> => {
    try {
      const res =
        await api.put<ApiResponse<PaymentProvider>>(
          `/revenue/payment-providers/${id}`,
          data,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  // ===================================================
  // ACTIVATE PAYMENT PROVIDER
  // ===================================================

  activatePaymentProvider: async (
    id: string,
  ): Promise<ApiResponse<PaymentProvider>> => {
    try {
      const res =
        await api.patch<ApiResponse<PaymentProvider>>(
          `/revenue/payment-providers/${id}/activate`,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  // ===================================================
  // DEACTIVATE PAYMENT PROVIDER
  // ===================================================

  deactivatePaymentProvider: async (
    id: string,
  ): Promise<ApiResponse<PaymentProvider>> => {
    try {
      const res =
        await api.patch<ApiResponse<PaymentProvider>>(
          `/revenue/payment-providers/${id}/deactivate`,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};