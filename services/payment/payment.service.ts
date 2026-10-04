import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import type {
  ApiResponse,
  ListResponse,
} from "@/types/api";
import { Payment, PaymentDetail, PaymentFilters } from "@/types/payment";
import { CreateBankTransferPaymentRequest, CreateCashPaymentRequest, InitializeOnlinePaymentRequest, InitializeOnlinePaymentResponse, RejectBankTransferRequest, VerifyBankTransferRequest, VerifyOnlinePaymentResponse } from "@/types/payment/payment-requests";




// ============================================================
// PAYMENT PARAMETER CLEANER
// ============================================================

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


// ============================================================
// PAYMENT SERVICE
// ============================================================

export const paymentService = {

  // ==========================================================
  // GET ALL PAYMENTS
  // ==========================================================
  //
  // GET /payments
  //
  // Common payment query endpoint.
  //
  // Supports:
  //
  // - search
  // - payment method
  // - payment provider
  // - status
  // - invoice
  // - assessment
  // - amount
  // - date
  // - pagination
  // - sorting
  //
  // ==========================================================

  getPayments: async (
    params?: PaymentFilters,
  ): Promise<ListResponse<Payment>> => {

    try {

      const response =
        await api.get<ListResponse<Payment>>(
          "/payments",
          {
            params:
              cleanPaymentParams(params),
          },
        );

      return response.data;

    } catch (error) {

      throw normalizeApiError(error);
    }
  },


  // ==========================================================
  // GET PAYMENT DETAIL
  // ==========================================================
  //
  // GET /payments/{payment}
  //
  // Common endpoint for:
  //
  // - CASH
  // - BANK_TRANSFER
  // - ONLINE
  //
  // ==========================================================

  getPaymentById: async (
    paymentId: string,
  ): Promise<ApiResponse<PaymentDetail>> => {

    try {

      const response =
        await api.get<ApiResponse<PaymentDetail>>(
          `/payments/${encodeURIComponent(
            paymentId,
          )}`,
        );

      return response.data;

    } catch (error) {

      throw normalizeApiError(error);
    }
  },


  // ==========================================================
  // GET PAYMENT RECEIPT
  // ==========================================================
  //
  // GET /payments/{payment}/receipt
  //
  // Common receipt endpoint.
  //
  // ==========================================================

  getPaymentReceipt: async (
    paymentId: string,
  ): Promise<ApiResponse<Payment>> => {

    try {

      const response =
        await api.get<ApiResponse<Payment>>(
          `/payments/${encodeURIComponent(
            paymentId,
          )}/receipt`,
        );

      return response.data;

    } catch (error) {

      throw normalizeApiError(error);
    }
  },


  // ==========================================================
  // INITIALIZE ONLINE PAYMENT
  // ==========================================================
  //
  // POST /online-payments/initialize
  //
  // The provider can be:
  //
  // - CHAPA
  // - TELEBIRR
  // - CBE_BIRR
  //
  // The backend automatically determines:
  //
  // payment_method = ONLINE
  //
  // ==========================================================

  initializeOnlinePayment: async (
    data: InitializeOnlinePaymentRequest,
  ): Promise<InitializeOnlinePaymentResponse> => {

    try {

      const response =
        await api.post<InitializeOnlinePaymentResponse>(
          "/online-payments/initialize",
          data,
        );

      return response.data;

    } catch (error) {

      throw normalizeApiError(error);
    }
  },


  // ==========================================================
  // GET ONLINE PAYMENT STATUS
  // ==========================================================
  //
  // GET /online-payments/{payment}/status
  //
  // This returns the LOCAL payment state.
  //
  // The backend is responsible for:
  //
  // - checking provider state
  // - verifying the provider transaction
  // - updating the local payment
  // - returning the current state
  //
  // The frontend must NOT treat the browser return URL
  // itself as proof of payment.
  //
  // ==========================================================

  getOnlinePaymentStatus: async (
    paymentId: string,
  ): Promise<VerifyOnlinePaymentResponse> => {

    try {

      const response =
        await api.get<VerifyOnlinePaymentResponse>(
          `/online-payments/${encodeURIComponent(
            paymentId,
          )}/status`,
        );

      return response.data;

    } catch (error) {

      throw normalizeApiError(error);
    }
  },


  // ==========================================================
  // CREATE CASH PAYMENT
  // ==========================================================
  //
  // POST /cash-payments
  //
  // The backend determines:
  //
  // - payment method
  // - payment provider
  // - transaction reference
  // - collector / authenticated user
  // - initial status
  //
  // ==========================================================

  createCashPayment: async (
    data: CreateCashPaymentRequest,
  ): Promise<ApiResponse<Payment>> => {

    try {

      const response =
        await api.post<ApiResponse<Payment>>(
          "/cash-payments",
          data,
        );

      return response.data;

    } catch (error) {

      throw normalizeApiError(error);
    }
  },


  // ==========================================================
  // POST CASH PAYMENT
  // ==========================================================
  //
  // POST /cash-payments/{payment}/post
  //
  // Changes the cash payment from its recorded state
  // to POSTED after the required municipal control.
  //
  // ==========================================================

  postCashPayment: async (
    paymentId: string,
  ): Promise<ApiResponse<Payment>> => {

    try {

      const response =
        await api.post<ApiResponse<Payment>>(
          `/cash-payments/${encodeURIComponent(
            paymentId,
          )}/post`,
        );

      return response.data;

    } catch (error) {

      throw normalizeApiError(error);
    }
  },


  // ==========================================================
  // CREATE BANK TRANSFER
  // ==========================================================
  //
  // POST /bank-transfers
  //
  // Creates:
  //
  // PENDING_VERIFICATION
  //
  // The transfer is NOT officially collected yet.
  //
  // ==========================================================

  createBankTransfer: async (
    data: CreateBankTransferPaymentRequest,
  ): Promise<ApiResponse<Payment>> => {

    try {

      const response =
        await api.post<ApiResponse<Payment>>(
          "/bank-transfers",
          data,
        );

      return response.data;

    } catch (error) {

      throw normalizeApiError(error);
    }
  },


  // ==========================================================
  // GET PENDING BANK TRANSFERS
  // ==========================================================
  //
  // GET /bank-transfers/pending
  //
  // Used by authorized revenue officers.
  //
  // ==========================================================

  getPendingBankTransfers: async (
    params?: {
      page?: number;
      per_page?: number;
    },
  ): Promise<ListResponse<Payment>> => {

    try {

      const response =
        await api.get<ListResponse<Payment>>(
          "/bank-transfers/pending",
          {
            params:
              cleanPaymentParams(params),
          },
        );

      return response.data;

    } catch (error) {

      throw normalizeApiError(error);
    }
  },


  // ==========================================================
  // VERIFY BANK TRANSFER
  // ==========================================================
  //
  // POST /bank-transfers/{payment}/verify
  //
  // Verification and posting are handled by the backend
  // as the controlled bank-transfer operation.
  //
  // ==========================================================

  verifyBankTransfer: async (
    paymentId: string,
    data?: VerifyBankTransferRequest,
  ): Promise<ApiResponse<Payment>> => {

    try {

      const response =
        await api.post<ApiResponse<Payment>>(
          `/bank-transfers/${encodeURIComponent(
            paymentId,
          )}/verify`,
          data ?? {},
        );

      return response.data;

    } catch (error) {

      throw normalizeApiError(error);
    }
  },


  // ==========================================================
  // REJECT BANK TRANSFER
  // ==========================================================
  //
  // POST /bank-transfers/{payment}/reject
  //
  // A rejection reason is required.
  //
  // ==========================================================

  rejectBankTransfer: async (
    paymentId: string,
    data: RejectBankTransferRequest,
  ): Promise<ApiResponse<Payment>> => {

    try {

      const response =
        await api.post<ApiResponse<Payment>>(
          `/bank-transfers/${encodeURIComponent(
            paymentId,
          )}/reject`,
          data,
        );

      return response.data;

    } catch (error) {

      throw normalizeApiError(error);
    }
  },
};