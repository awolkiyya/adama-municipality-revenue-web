import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import type {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import type {
  Payment,
  PaymentFilters,
  InitializePaymentRequest,
  InitializePaymentResponse,
} from "@/types/payment";

// =====================================================
// PAYMENT SERVICE
// =====================================================

const cleanPaymentParams = (
  params?: PaymentFilters,
): Record<string, unknown> => {
  return Object.entries(params ?? {}).reduce(
    (acc, [key, value]) => {
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

export const paymentService = {
  // ===================================================
  // GET ALL PAYMENTS
  // ===================================================
  //
  // GET /payments
  //
  // Backend performs:
  // - filtering
  // - searching
  // - pagination
  // - sorting
  //
  // ===================================================

  getPayments: async (
    params?: PaymentFilters,
  ): Promise<ListResponse<Payment>> => {
    try {
      const res = await api.get<ListResponse<Payment>>(
        "/payments",
        {
          params: cleanPaymentParams(params),
        },
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  // ===================================================
  // GET PAYMENT DETAIL
  // ===================================================
  //
  // GET /payments/{payment}
  //
  // ===================================================

  getPaymentById: async (
    id: string,
  ): Promise<ApiResponse<Payment>> => {
    try {
      const res = await api.get<ApiResponse<Payment>>(
        `/payments/${encodeURIComponent(id)}`,
      );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  // ===================================================
  // INITIALIZE CHAPA PAYMENT
  // ===================================================
  //
  // POST /payments/chapa/initialize
  //
  // Flow:
  //
  // 1. Frontend sends invoice + amount.
  // 2. Laravel authenticates taxpayer.
  // 3. Laravel validates invoice ownership.
  // 4. Laravel reads CURRENT balance_due.
  // 5. Laravel validates requested amount.
  // 6. Laravel creates PENDING payment.
  // 7. Laravel initializes Chapa.
  // 8. Laravel returns checkout information.
  //
  // IMPORTANT:
  //
  // The frontend amount is only a request.
  // Laravel remains the financial authority.
  //
  // ===================================================

  initializeChapaPayment: async (
    data: InitializePaymentRequest,
  ): Promise<InitializePaymentResponse> => {
    try {
      const res =
        await api.post<InitializePaymentResponse>(
          "/payments/chapa/initialize",
          data,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  // ===================================================
  // GET CHAPA PAYMENT STATUS
  // ===================================================
  //
  // GET /payments/chapa/{payment}/status
  //
  // Used after the taxpayer returns from Chapa.
  //
  // IMPORTANT:
  //
  // This endpoint should return the LOCAL Laravel
  // payment state.
  //
  // Laravel remains the source of truth.
  //
  // ===================================================

  getChapaPaymentStatus: async (
    paymentId: string,
  ): Promise<ApiResponse<Payment>> => {
    try {
      const res =
        await api.get<ApiResponse<Payment>>(
          `/payments/chapa/${encodeURIComponent(
            paymentId,
          )}/status`,
        );

      return res.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};