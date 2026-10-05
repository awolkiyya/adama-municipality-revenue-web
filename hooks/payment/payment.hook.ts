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
// - method-specific details
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
// Initialization does NOT complete the payment.
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
// Stop polling for terminal states.
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
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.lists(),
        });

        const payment =
          response?.data;

        if (!payment?.id) {
          return;
        }

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
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.lists(),
        });

        const payment =
          response?.data;

        if (!payment?.id) {
          return;
        }

        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.detail(
              payment.id,
            ),
        });

        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.receipt(
              payment.id,
            ),
        });
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
// Verification state:
//
// bank_transfer_details.verification_status
// = PENDING
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
         * General payment list changed.
         */
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.lists(),
        });

        /*
         * The new transfer is now part of the
         * verification queue.
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
      },
  });
};


// =====================================================
// VERIFY BANK TRANSFER
// =====================================================
//
// POST /bank-transfers/{payment}/verify
//
// Flow:
//
// Payment:
// PENDING
//    ↓
// COMPLETED
//
// Bank-transfer verification:
//
// PENDING
//    ↓
// VERIFIED
//
// On successful verification:
//
// - payment becomes COMPLETED
// - bank transfer becomes VERIFIED
// - official receipt is created
// - invoice balance is recalculated
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
         * General payment list changed.
         */
        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.lists(),
        });

        /*
         * Verified transfer is no longer pending.
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
         * COMPLETED payment has an official receipt.
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
// Payment:
//
// PENDING
//    ↓
// FAILED
//
// Bank-transfer verification:
//
// PENDING
//    ↓
// REJECTED
//
// IMPORTANT:
//
// Rejection is NOT a PaymentStatus::REJECTED state.
//
// The global payment status remains:
//
// FAILED
//
// The method-specific verification status is:
//
// REJECTED
//
// Rejection:
//
// - does NOT create a receipt
// - does NOT increase invoice paid amount
// - does NOT reduce invoice balance
// - removes the transfer from the pending queue
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
         * Rejected transfer is no longer pending.
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
         * Do NOT invalidate the receipt query.
         *
         * A rejected bank transfer has no receipt.
         */
      },
  });
};
