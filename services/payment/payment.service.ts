import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import type {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import type {
  Payment,
  PaymentDetail,
  PaymentFilters,
  PaymentReceipt,
} from "@/types/payment";

import type {
  CreateBankTransferPaymentRequest,
  CreateCashPaymentRequest,
  InitializeOnlinePaymentRequest,
  InitializeOnlinePaymentResponse,
  RejectBankTransferRequest,
  VerifyBankTransferRequest,
  VerifyOnlinePaymentResponse,
} from "@/types/payment/payment-requests";


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
  // Administrative payment listing.
  //
  // Supported filters implemented by the backend:
  //
  // - search
  // - transaction_reference
  // - invoice_id
  // - citizen_id
  // - payment_method
  // - payment_source
  // - status
  // - currency
  // - amount_from
  // - amount_to
  // - payment_date_from
  // - payment_date_to
  // - verified_from
  // - verified_to
  // - page
  // - per_page
  // - sort_by
  // - sort_direction
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
            params: cleanPaymentParams(params),
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
  // Administrative payment detail.
  //
  // Returns:
  //
  // - payment
  // - invoice
  // - citizen
  // - method-specific details
  // - receipt
  // - files
  //
  // ==========================================================

  getPaymentById: async (
    paymentId: string,
  ): Promise<ApiResponse<PaymentDetail>> => {
    try {
      const response =
        await api.get<ApiResponse<PaymentDetail>>(
          `/payments/${encodeURIComponent(paymentId)}`,
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
  // Returns the existing official receipt.
  //
  // IMPORTANT:
  //
  // This endpoint does NOT create a receipt.
  //
  // A receipt is created automatically when a payment reaches
  // COMPLETED status.
  //
  // ==========================================================

  getPaymentReceipt: async (
    paymentId: string,
  ): Promise<ApiResponse<PaymentReceipt>> => {
    try {
      const response =
        await api.get<ApiResponse<PaymentReceipt>>(
          `/payments/${encodeURIComponent(paymentId)}/receipt`,
        );

      return response.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },


  // ==========================================================
  // DOWNLOAD PAYMENT RECEIPT PDF
  // ==========================================================
  //
  // GET /payments/{payment}/receipt/pdf
  //
  // Downloads the official receipt as a PDF.
  //
  // The backend:
  //
  // - verifies authentication
  // - verifies payment access
  // - verifies payment is completed
  // - verifies an official receipt exists
  // - renders the receipt PDF
  //
  // The frontend receives a Blob.
  //
  // ==========================================================

  downloadPaymentReceiptPdf: async (
    paymentId: string,
  ): Promise<Blob> => {
    try {
      const response =
        await api.get<Blob>(
          `/payments/${encodeURIComponent(paymentId)}/receipt/pdf`,
          {
            responseType: "blob",
          },
        );

      return response.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },


  // ==========================================================
  // STREAM PAYMENT RECEIPT PDF
  // ==========================================================
  //
  // GET /payments/{payment}/receipt/pdf/stream
  //
  // Returns the official receipt PDF as a Blob so the frontend
  // can open it in a browser tab or PDF viewer.
  //
  // ==========================================================

  streamPaymentReceiptPdf: async (
    paymentId: string,
  ): Promise<Blob> => {
    try {
      const response =
        await api.get<Blob>(
          `/payments/${encodeURIComponent(paymentId)}/receipt/pdf/stream`,
          {
            responseType: "blob",
          },
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
  // Online payment processing belongs to the online-payment
  // controller/module.
  //
  // The backend determines:
  //
  // payment_method = ONLINE
  //
  // Provider-specific information belongs to the online
  // payment details/configuration.
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
  // Returns the current LOCAL payment state.
  //
  // The backend is responsible for:
  //
  // 1. Checking the external provider.
  // 2. Verifying the transaction.
  // 3. Updating the local payment.
  // 4. Returning the current payment state.
  //
  // The frontend must NOT treat a browser redirect/return
  // as proof that the payment was completed.
  //
  // ==========================================================

  getOnlinePaymentStatus: async (
    paymentId: string,
  ): Promise<VerifyOnlinePaymentResponse> => {
    try {
      const response =
        await api.get<VerifyOnlinePaymentResponse>(
          `/online-payments/${encodeURIComponent(paymentId)}/status`,
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
  // Creates a cash payment in PENDING status.
  //
  // No receipt is created at this stage.
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
  // COMPLETE CASH PAYMENT
  // ==========================================================
  //
  // POST /cash-payments/{payment}/complete
  //
  // PENDING
  //    ↓
  // COMPLETED
  //
  // On completion the backend:
  //
  // - completes the payment
  // - records verification
  // - creates the official receipt
  // - updates invoice paid amount
  // - updates invoice balance
  // - updates invoice status
  //
  // ==========================================================

  completeCashPayment: async (
    paymentId: string,
  ): Promise<ApiResponse<Payment>> => {
    try {
      const response =
        await api.post<ApiResponse<Payment>>(
          `/cash-payments/${encodeURIComponent(paymentId)}/complete`,
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
  // Creates a bank-transfer payment in PENDING status.
  //
  // Method-specific information is stored in:
  //
  // bank_transfer_details
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
  // Returns bank-transfer payments awaiting verification.
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
            params: cleanPaymentParams(params),
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
  // PENDING
  //    ↓
  // COMPLETED
  //
  // On successful verification the backend:
  //
  // - completes the payment
  // - records verification
  // - creates the official receipt
  // - updates the invoice
  //
  // ==========================================================

  verifyBankTransfer: async (
    paymentId: string,
    data?: VerifyBankTransferRequest,
  ): Promise<ApiResponse<Payment>> => {
    try {
      const response =
        await api.post<ApiResponse<Payment>>(
          `/bank-transfers/${encodeURIComponent(paymentId)}/verify`,
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
  // Rejection is a bank-transfer verification operation.
  //
  // It does NOT introduce:
  //
  // PaymentStatus::REJECTED
  //
  // The backend should use the established payment status
  // model and store the rejection reason appropriately.
  //
  // ==========================================================

  rejectBankTransfer: async (
    paymentId: string,
    data: RejectBankTransferRequest,
  ): Promise<ApiResponse<Payment>> => {
    try {
      const response =
        await api.post<ApiResponse<Payment>>(
          `/bank-transfers/${encodeURIComponent(paymentId)}/reject`,
          data,
        );

      return response.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};