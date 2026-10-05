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
// FORM DATA VALUE APPENDER
// ============================================================
//
// Converts objects/arrays into Laravel-compatible nested
// multipart/form-data fields.
//
// Example:
//
// metadata = {
//   amount_mode: "FULL",
//   source: "REVENUE_COLLECTION_PORTAL"
// }
//
// becomes:
//
// metadata[amount_mode] = FULL
// metadata[source] = REVENUE_COLLECTION_PORTAL
//
// ============================================================

const appendFormDataValue = (
  formData: FormData,
  key: string,
  value: unknown,
): void => {
  // Ignore empty values.
  if (value === undefined || value === null) {
    return;
  }

  // ----------------------------------------------------------
  // File
  // ----------------------------------------------------------

  if (value instanceof File) {
    formData.append(key, value);
    return;
  }

  // ----------------------------------------------------------
  // Blob
  // ----------------------------------------------------------

  if (value instanceof Blob) {
    formData.append(key, value);
    return;
  }

  // ----------------------------------------------------------
  // Array
  // ----------------------------------------------------------

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      appendFormDataValue(
        formData,
        `${key}[${index}]`,
        item,
      );
    });

    return;
  }

  // ----------------------------------------------------------
  // Object
  // ----------------------------------------------------------

  if (typeof value === "object") {
    Object.entries(
      value as Record<string, unknown>,
    ).forEach(([childKey, childValue]) => {
      appendFormDataValue(
        formData,
        `${key}[${childKey}]`,
        childValue,
      );
    });

    return;
  }

  // ----------------------------------------------------------
  // String / number / boolean
  // ----------------------------------------------------------

  formData.append(
    key,
    String(value),
  );
};


// ============================================================
// BANK TRANSFER FORM DATA BUILDER
// ============================================================

const buildBankTransferFormData = (
  data: CreateBankTransferPaymentRequest,
): FormData => {
  const formData = new FormData();

  // ----------------------------------------------------------
  // Required fields
  // ----------------------------------------------------------

  formData.append(
    "invoice_id",
    data.invoice_id,
  );

  formData.append(
    "amount",
    String(data.amount),
  );

  formData.append(
    "bank_account_id",
    data.bank_account_id,
  );

  formData.append(
    "transfer_reference",
    data.transfer_reference,
  );

  formData.append(
    "transfer_date",
    data.transfer_date,
  );

  // ----------------------------------------------------------
  // Payer
  // ----------------------------------------------------------

  if (data.payer_name) {
    formData.append(
      "payer_name",
      data.payer_name,
    );
  }

  if (data.payer_phone) {
    formData.append(
      "payer_phone",
      data.payer_phone,
    );
  }

  // ----------------------------------------------------------
  // Sender
  // ----------------------------------------------------------

  if (data.sender_name) {
    formData.append(
      "sender_name",
      data.sender_name,
    );
  }

  if (data.sender_account) {
    formData.append(
      "sender_account",
      data.sender_account,
    );
  }

  // ----------------------------------------------------------
  // Notes
  // ----------------------------------------------------------

  if (data.notes) {
    formData.append(
      "notes",
      data.notes,
    );
  }

  // ----------------------------------------------------------
  // Evidence
  // ----------------------------------------------------------

  if (data.evidence instanceof File) {
    formData.append(
      "evidence",
      data.evidence,
    );
  }

  // ----------------------------------------------------------
  // Metadata
  // ----------------------------------------------------------

  if (
    data.metadata !== undefined &&
    data.metadata !== null
  ) {
    appendFormDataValue(
      formData,
      "metadata",
      data.metadata,
    );
  }

  return formData;
};


// ============================================================
// PAYMENT SERVICE
// ============================================================

export const paymentService = {

  // ==========================================================
  // GET ALL PAYMENTS
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
  // IMPORTANT:
  // This request MUST use FormData because evidence is a file.
  //
  // ==========================================================

  createBankTransfer: async (
    data: CreateBankTransferPaymentRequest,
  ): Promise<ApiResponse<Payment>> => {
    try {
      const formData =
        buildBankTransferFormData(data);

      const response =
        await api.post<ApiResponse<Payment>>(
          "/bank-transfers",
          formData,
        );

      return response.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },


  // ==========================================================
  // VERIFY BANK TRANSFER
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

