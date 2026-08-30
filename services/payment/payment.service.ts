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
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from "@/types/payment";


// =====================================================
// PAYMENT SERVICE
// =====================================================

const cleanPaymentParams = (
  params?: PaymentFilters,
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


export const paymentService = {

  // ===================================================
  // GET ALL PAYMENTS
  // ===================================================
  //
  // GET /payments
  //
  // Backend performs:
  //
  // - filtering
  // - searching
  // - pagination
  // - sorting
  //
  // ===================================================

  getPayments: async (
    params?: PaymentFilters,
  ): Promise<
    ListResponse<Payment>
  > => {

    try {

      const res =
        await api.get<
          ListResponse<Payment>
        >(
          "/payments",
          {
            params:
              cleanPaymentParams(
                params,
              ),
          },
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
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
  ): Promise<
    ApiResponse<Payment>
  > => {

    try {

      const res =
        await api.get<
          ApiResponse<Payment>
        >(
          `/payments/${encodeURIComponent(id)}`,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // INITIALIZE PAYMENT
  // ===================================================
  //
  // POST /payments/initialize
  //
  // Generic provider initialization.
  //
  // Supported providers can include:
  //
  // - CHAPA
  // - TELEBIRR
  // - CBE BIRR
  // - BANK
  // - CASH
  //
  // The backend decides which provider implementation
  // is used.
  //
  // ===================================================

  initializePayment: async (
    data: InitializePaymentRequest,
  ): Promise<
    InitializePaymentResponse
  > => {

    try {

      const res =
        await api.post<
          InitializePaymentResponse
        >(
          "/payments/chapa/initialize",
          data,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // INITIALIZE CHAPA PAYMENT
  // ===================================================
  //
  // POST /payments/chapa/initialize
  //
  // Chapa-specific initialization.
  //
  // The backend should generate the actual Chapa
  // checkout session and return checkout_url.
  //
  // ===================================================

  initializeChapaPayment: async (
    data: InitializePaymentRequest,
  ): Promise<
    InitializePaymentResponse
  > => {

    try {

      const res =
        await api.post<
          InitializePaymentResponse
        >(
          "/payments/chapa/initialize",
          {
            ...data,
          },
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // VERIFY PAYMENT
  // ===================================================
  //
  // POST /payments/verify
  //
  // Laravel verifies the payment directly with the
  // configured payment provider.
  //
  // The frontend NEVER decides whether a payment
  // succeeded.
  //
  // ===================================================

  verifyPayment: async (
    data: VerifyPaymentRequest,
  ): Promise<
    VerifyPaymentResponse
  > => {

    try {

      const res =
        await api.post<
          VerifyPaymentResponse
        >(
          "/payments/verify",
          data,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // GET CHAPA PAYMENT STATUS
  // ===================================================
  //
  // GET /payments/chapa/{payment}/status
  //
  // Used after the customer returns from Chapa.
  //
  // IMPORTANT:
  //
  // This returns the LOCAL Laravel payment state.
  // Laravel remains the source of truth.
  //
  // ===================================================

  getChapaPaymentStatus: async (
    paymentId: string,
  ): Promise<
    ApiResponse<Payment>
  > => {

    try {

      const res =
        await api.get<
          ApiResponse<Payment>
        >(
          `/payments/chapa/${encodeURIComponent(
            paymentId,
          )}/status`,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // GET PAYMENT BY TRANSACTION REFERENCE
  // ===================================================
  //
  // GET /payments/transaction/{transactionReference}
  //
  // ===================================================

  getPaymentByTransactionReference: async (
    transactionReference: string,
  ): Promise<
    ApiResponse<Payment>
  > => {

    try {

      const res =
        await api.get<
          ApiResponse<Payment>
        >(
          `/payments/transaction/${encodeURIComponent(
            transactionReference,
          )}`,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },

};