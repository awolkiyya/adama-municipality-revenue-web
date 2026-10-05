"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import type {
  CreateBankTransferPaymentRequest,
  CreateCashPaymentRequest,
  InitializeOnlinePaymentRequest,
  InitializeOnlinePaymentResponse,
  RejectBankTransferRequest,
  VerifyBankTransferRequest,
  VerifyOnlinePaymentResponse,
} from "@/types/payment/payment-requests";

import {
  paymentService,
} from "@/services/payment/payment.service";

import type {
  Payment,
  PaymentDetail,
  PaymentFilters,
  PaymentReceipt,
} from "@/types/payment";


// =====================================================
// QUERY KEYS
// =====================================================

export const paymentKeys = {
  all: ["payments"] as const,

  // ---------------------------------------------------
  // Lists
  // ---------------------------------------------------

  lists: () =>
    [
      ...paymentKeys.all,
      "list",
    ] as const,

  list: (
    params?: PaymentFilters,
  ) =>
    [
      ...paymentKeys.lists(),
      params,
    ] as const,


  // ---------------------------------------------------
  // Details
  // ---------------------------------------------------

  details: () =>
    [
      ...paymentKeys.all,
      "detail",
    ] as const,

  detail: (
    id: string,
  ) =>
    [
      ...paymentKeys.details(),
      id,
    ] as const,


  // ---------------------------------------------------
  // Receipts
  // ---------------------------------------------------

  receipts: () =>
    [
      ...paymentKeys.all,
      "receipt",
    ] as const,

  receipt: (
    paymentId: string,
  ) =>
    [
      ...paymentKeys.receipts(),
      paymentId,
    ] as const,


  // ---------------------------------------------------
  // Online payment status
  // ---------------------------------------------------

  onlineStatuses: () =>
    [
      ...paymentKeys.all,
      "online-status",
    ] as const,

  onlineStatus: (
    id: string,
  ) =>
    [
      ...paymentKeys.onlineStatuses(),
      id,
    ] as const,


  // ---------------------------------------------------
  // Pending bank transfers
  // ---------------------------------------------------

  pendingBankTransfers: () =>
    [
      ...paymentKeys.all,
      "bank-transfers",
      "pending",
    ] as const,
};


// =====================================================
// GET PAYMENTS
// =====================================================
//
// GET /payments
//
// Administrative payment listing.
//
// =====================================================

type UsePaymentsOptions = {
  params?: PaymentFilters;
};

export const usePayments = ({
  params,
}: UsePaymentsOptions = {}) => {
  return useQuery<
    ListResponse<Payment>
  >({
    queryKey:
      paymentKeys.list(params),

    queryFn:
      () =>
        paymentService.getPayments(
          params,
        ),

    staleTime:
      1000 * 60 * 2,

    placeholderData:
      (previousData) =>
        previousData,
  });
};


// =====================================================
// GET PAYMENT DETAIL
// =====================================================
//
// GET /payments/{payment}
//
// Returns:
// - invoice
// - citizen
// - service
// - method details
// - receipt
// - files
//
// =====================================================

export const usePayment = (
  id: string,
  enabled = true,
) => {
  return useQuery<
    ApiResponse<PaymentDetail>
  >({
    queryKey:
      paymentKeys.detail(id),

    queryFn:
      () =>
        paymentService.getPaymentById(
          id,
        ),

    enabled:
      enabled &&
      !!id,

    staleTime:
      1000 * 60 * 2,
  });
};


// =====================================================
// GET PAYMENT RECEIPT
// =====================================================
//
// GET /payments/{payment}/receipt
//
// IMPORTANT:
//
// This reads an existing official receipt.
//
// It does NOT create a receipt.
//
// Receipt lifecycle:
//
// Payment PENDING
//      ↓
// Payment COMPLETED
//      ↓
// Receipt CREATED
//
// =====================================================

export const usePaymentReceipt = (
  paymentId: string,
  enabled = true,
) => {
  return useQuery<
    ApiResponse<PaymentReceipt>
  >({
    queryKey:
      paymentKeys.receipt(
        paymentId,
      ),

    queryFn:
      () =>
        paymentService.getPaymentReceipt(
          paymentId,
        ),

    enabled:
      enabled &&
      !!paymentId,

    staleTime:
      1000 * 60 * 5,

    retry: 1,
  });
};


// =====================================================
// DOWNLOAD PAYMENT RECEIPT PDF
// =====================================================
//
// GET /payments/{payment}/receipt/pdf
//
// Returns a Blob.
//
// The caller is responsible for creating the browser
// download URL.
//
// =====================================================

export const useDownloadPaymentReceiptPdf = () => {
  return useMutation<
    Blob,
    Error,
    string
  >({
    mutationFn:
      (paymentId) =>
        paymentService.downloadPaymentReceiptPdf(
          paymentId,
        ),
  });
};


// =====================================================
// STREAM PAYMENT RECEIPT PDF
// =====================================================
//
// GET /payments/{payment}/receipt/pdf/stream
//
// Returns a Blob.
//
// The caller can create an object URL and open the PDF
// in a new browser tab.
//
// =====================================================

export const useStreamPaymentReceiptPdf = () => {
  return useMutation<
    Blob,
    Error,
    string
  >({
    mutationFn:
      (paymentId) =>
        paymentService.streamPaymentReceiptPdf(
          paymentId,
        ),
  });
};


// =====================================================
// INITIALIZE ONLINE PAYMENT
// =====================================================
//
// POST /online-payments/initialize
//
// Flow:
//
// Invoice
//    ↓
// Initialize
//    ↓
// Payment created
//    ↓
// Provider checkout
//    ↓
// Provider callback/status verification
//    ↓
// COMPLETED / FAILED / CANCELLED / EXPIRED
//
// Initialization itself does NOT complete the payment.
//
// =====================================================

export const useInitializeOnlinePayment = () => {
  const queryClient =
    useQueryClient();

  return useMutation<
    InitializeOnlinePaymentResponse,
    Error,
    InitializeOnlinePaymentRequest
  >({
    mutationFn:
      (data) =>
        paymentService.initializeOnlinePayment(
          data,
        ),

    onSuccess:
      () => {
        /*
         * The payment list may now contain the newly
         * initialized payment.
         *
         * Do not update financial state manually.
         */
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.lists(),
        });
      },
  });
};


// =====================================================
// GET ONLINE PAYMENT STATUS
// =====================================================
//
// GET /online-payments/{payment}/status
//
// Laravel is the source of truth.
//
// Poll while:
//
// PENDING
// PROCESSING
//
// Stop polling for all terminal states.
//
// =====================================================

export const useOnlinePaymentStatus = (
  paymentId: string,
  enabled = true,
) => {
  return useQuery<
    VerifyOnlinePaymentResponse
  >({
    queryKey:
      paymentKeys.onlineStatus(
        paymentId,
      ),

    queryFn:
      () =>
        paymentService.getOnlinePaymentStatus(
          paymentId,
        ),

    enabled:
      enabled &&
      !!paymentId,

    staleTime:
      1000 * 15,

    refetchOnWindowFocus:
      false,

    refetchInterval:
      (query) => {
        const payment =
          query.state.data
            ?.data
            ?.payment;

        if (!payment) {
          return false;
        }

        if (
          payment.status === "PENDING" ||
          payment.status === "PROCESSING"
        ) {
          return 3000;
        }

        return false;
      },
  });
};


// =====================================================
// CREATE CASH PAYMENT
// =====================================================
//
// POST /cash-payments
//
// Creates:
//
// PENDING
//
// No invoice settlement.
// No receipt.
//
// =====================================================

export const useCreateCashPayment = () => {
  const queryClient =
    useQueryClient();

  return useMutation<
    ApiResponse<Payment>,
    Error,
    CreateCashPaymentRequest
  >({
    mutationFn:
      (data) =>
        paymentService.createCashPayment(
          data,
        ),

    onSuccess:
      (response) => {
        /*
         * Payment list changed.
         */
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.lists(),
        });

        const payment =
          response?.data;

        if (!payment?.id) {
          return;
        }

        /*
         * Refresh exact payment.
         */
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.detail(
              payment.id,
            ),
        });
      },
  });
};


// =====================================================
// COMPLETE CASH PAYMENT
// =====================================================
//
// POST /cash-payments/{payment}/complete
//
// Flow:
//
// PENDING
//    ↓
// COMPLETED
//    ↓
// Receipt created
//    ↓
// Invoice recalculated
//
// =====================================================

export const useCompleteCashPayment = () => {
  const queryClient =
    useQueryClient();

  return useMutation<
    ApiResponse<Payment>,
    Error,
    string
  >({
    mutationFn:
      (paymentId) =>
        paymentService.completeCashPayment(
          paymentId,
        ),

    onSuccess:
      (response) => {
        /*
         * Payment list changed.
         */
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.lists(),
        });

        const payment =
          response?.data;

        if (!payment?.id) {
          return;
        }

        /*
         * Refresh payment detail.
         */
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.detail(
              payment.id,
            ),
        });

        /*
         * Receipt was created by the backend.
         */
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.receipt(
              payment.id,
            ),
        });

        /*
         * Do NOT invent an invoice query key here.
         *
         * The invoice module should invalidate its own
         * invoice queries when necessary.
         */
      },
  });
};


// =====================================================
// CREATE BANK TRANSFER
// =====================================================
//
// POST /bank-transfers
//
// Creates:
//
// PENDING
//
// No invoice settlement.
// No receipt.
//
// =====================================================

export const useCreateBankTransfer = () => {
  const queryClient =
    useQueryClient();

  return useMutation<
    ApiResponse<Payment>,
    Error,
    CreateBankTransferPaymentRequest
  >({
    mutationFn:
      (data) =>
        paymentService.createBankTransfer(
          data,
        ),

    onSuccess:
      (response) => {
        /*
         * General payment list.
         */
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.lists(),
        });

        /*
         * Pending bank transfer queue.
         */
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.pendingBankTransfers(),
        });

        const payment =
          response?.data;

        if (!payment?.id) {
          return;
        }

        /*
         * Exact payment detail.
         */
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.detail(
              payment.id,
            ),
        });
      },
  });
};


// =====================================================
// GET PENDING BANK TRANSFERS
// =====================================================
//
// GET /bank-transfers/pending
//
// Used by authorized staff to verify/reject transfers.
//
// =====================================================

type PendingBankTransferParams = {
  page?: number;
  per_page?: number;
};

export const usePendingBankTransfers = (
  params?: PendingBankTransferParams,
) => {
  return useQuery<
    ListResponse<Payment>
  >({
    queryKey: [
      ...paymentKeys.pendingBankTransfers(),
      params,
    ] as const,

    queryFn:
      () =>
        paymentService.getPendingBankTransfers(
          params,
        ),

    staleTime:
      1000 * 30,

    refetchOnWindowFocus:
      true,
  });
};


// =====================================================
// VERIFY BANK TRANSFER
// =====================================================
//
// POST /bank-transfers/{payment}/verify
//
// Successful verification:
//
// PENDING
//    ↓
// COMPLETED
//    ↓
// Receipt created
//    ↓
// Invoice recalculated
//
// =====================================================

export const useVerifyBankTransfer = () => {
  const queryClient =
    useQueryClient();

  return useMutation<
    ApiResponse<Payment>,
    Error,
    {
      paymentId: string;
      data?: VerifyBankTransferRequest;
    }
  >({
    mutationFn:
      ({
        paymentId,
        data,
      }) =>
        paymentService.verifyBankTransfer(
          paymentId,
          data,
        ),

    onSuccess:
      (response) => {
        /*
         * Payment list changed.
         */
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.lists(),
        });

        /*
         * Payment should no longer appear in the
         * pending verification queue.
         */
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.pendingBankTransfers(),
        });

        const payment =
          response?.data;

        if (!payment?.id) {
          return;
        }

        /*
         * Refresh exact payment.
         */
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.detail(
              payment.id,
            ),
        });

        /*
         * If verification completed the payment,
         * the receipt now exists.
         */
        if (
          payment.status ===
          "COMPLETED"
        ) {
          queryClient.invalidateQueries({
            queryKey:
              paymentKeys.receipt(
                payment.id,
              ),
          });
        }
      },
  });
};


// =====================================================
// REJECT BANK TRANSFER
// =====================================================
//
// POST /bank-transfers/{payment}/reject
//
// Flow:
//
// PENDING
//    ↓
// CANCELLED
//
// or another backend-approved terminal failure state.
//
// IMPORTANT:
//
// Rejection does NOT create a receipt.
//
// Rejection does NOT increase invoice paid amount.
//
// =====================================================

export const useRejectBankTransfer = () => {
  const queryClient =
    useQueryClient();

  return useMutation<
    ApiResponse<Payment>,
    Error,
    {
      paymentId: string;
      data: RejectBankTransferRequest;
    }
  >({
    mutationFn:
      ({
        paymentId,
        data,
      }) =>
        paymentService.rejectBankTransfer(
          paymentId,
          data,
        ),

    onSuccess:
      (response) => {
        /*
         * General payment list changed.
         */
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.lists(),
        });

        /*
         * Rejected transfer should disappear from
         * the pending verification queue.
         */
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.pendingBankTransfers(),
        });

        const payment =
          response?.data;

        if (!payment?.id) {
          return;
        }

        /*
         * Refresh exact payment detail.
         */
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.detail(
              payment.id,
            ),
        });

        /*
         * No receipt invalidation is required because
         * rejection cannot produce a receipt.
         */
      },
  });
};