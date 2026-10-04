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

import { CreateBankTransferPaymentRequest, CreateCashPaymentRequest, InitializeOnlinePaymentRequest, InitializeOnlinePaymentResponse, RejectBankTransferRequest, VerifyBankTransferRequest, VerifyOnlinePaymentResponse } from "@/types/payment/payment-requests";


import {
  paymentService,
} from "@/services/payment/payment.service";
import { Payment, PaymentDetail, PaymentFilters } from "@/types/payment";


// =====================================================
// QUERY KEYS
// =====================================================

export const paymentKeys = {

  all: [
    "payments",
  ] as const,


  lists: () => [
    ...paymentKeys.all,
    "list",
  ] as const,


  list: (
    params?: PaymentFilters,
  ) => [
    ...paymentKeys.lists(),
    params,
  ] as const,


  details: () => [
    ...paymentKeys.all,
    "detail",
  ] as const,


  detail: (
    id: string,
  ) => [
    ...paymentKeys.details(),
    id,
  ] as const,


  onlineStatus: (
    id: string,
  ) => [
    ...paymentKeys.all,
    "online-status",
    id,
  ] as const,


  pendingBankTransfers: () => [
    ...paymentKeys.all,
    "bank-transfers",
    "pending",
  ] as const,

};


// =====================================================
// GET PAYMENTS
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
      paymentKeys.list(
        params,
      ),

    queryFn:
      () =>
        paymentService.getPayments(
          params,
        ),

    staleTime:
      1000 * 60 * 5,

    placeholderData:
      (
        previousData,
      ) =>
        previousData,

  });

};


// =====================================================
// GET PAYMENT DETAIL
// =====================================================

export const usePayment = (
  id: string,
  enabled = true,
) => {

  return useQuery<
    ApiResponse<PaymentDetail>
  >({

    queryKey:
      paymentKeys.detail(
        id,
      ),

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

export const usePaymentReceipt = (
  paymentId: string,
  enabled = true,
) => {

  return useQuery<
    ApiResponse<Payment>
  >({

    queryKey: [
      ...paymentKeys.detail(
        paymentId,
      ),
      "receipt",
    ],

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
// Pay Invoice
//    ↓
// Initialize Online Payment
//    ↓
// Laravel creates payment
//    ↓
// Chapa / Telebirr / CBE Birr
//    ↓
// Checkout
//
// IMPORTANT:
//
// Initialization does NOT mean payment success.
//
// Laravel MUST:
//
// - authenticate the taxpayer
// - verify invoice ownership
// - read the current invoice balance
// - validate the requested amount
// - create the payment
// - initialize the external provider
//
// The frontend must NEVER update:
//
// - invoice.paid_amount
// - invoice.balance_due
// - invoice.status
// - payment.status
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
      (
        data,
      ) =>
        paymentService.initializeOnlinePayment(
          data,
        ),


    onSuccess:
      (
        response,
      ) => {

        /*
         * Initialization does not mean payment success.
         *
         * The payment normally remains in an
         * intermediate state until the provider result
         * is received and verified by Laravel.
         *
         * Therefore we do not modify any financial
         * state in the frontend.
         */

        const paymentReference =
          response?.data
            ?.paymentReference;


        /*
         * If the backend returned a payment reference,
         * refresh the payment list.
         *
         * Do NOT construct a fake Payment object from
         * the initialization response.
         */

        if (!paymentReference) {
          return;
        }


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
// Returns:
//
// {
//   success: true,
//   message: "...",
//   data: {
//     payment: Payment,
//     verification: {
//       status: "SUCCESS" | "FAILED" | "PENDING",
//       is_successful: boolean,
//       ...
//     }
//   }
// }
//
// Laravel remains the source of truth.
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
      1000 * 30,

    refetchOnWindowFocus:
      false,

    /*
     * Poll while the online payment is still being
     * processed.
     *
     * The payment itself is inside:
     *
     * response.data.payment
     */
    refetchInterval:
      (
        query,
      ) => {

        const payment =
          query.state.data
            ?.data
            ?.payment;


        if (!payment) {
          return false;
        }


        switch (payment.status) {

          case "INITIATED":
          case "PENDING":
            return 3000;

          default:
            return false;

        }

      },

  });

};



// =====================================================
// CREATE CASH PAYMENT
// =====================================================
//
// POST /cash-payments
//
// Flow:
//
// Invoice
//    ↓
// Collector receives cash
//    ↓
// Create cash payment
//    ↓
// RECORDED
//    ↓
// Physical/control confirmation
//    ↓
// POSTED
//
// IMPORTANT:
//
// Creating a cash payment does NOT automatically mean
// that it is financially posted.
//
// The backend controls the lifecycle.
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
      (
        data,
      ) =>
        paymentService.createCashPayment(
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
// POST CASH PAYMENT
// =====================================================
//
// POST /cash-payments/{payment}/post
//
// This is the financial posting action.
//
// Only after posting should the backend update the
// invoice's official paid amount / balance / status.
//
// =====================================================

export const usePostCashPayment = () => {

  const queryClient =
    useQueryClient();


  return useMutation<
    ApiResponse<Payment>,
    Error,
    string
  >({

    mutationFn:
      (
        paymentId,
      ) =>
        paymentService.postCashPayment(
          paymentId,
        ),


    onSuccess:
      (
        response,
      ) => {

        const payment =
          response?.data;

        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.lists(),
        });


        if (payment?.id) {

          queryClient.invalidateQueries({
            queryKey:
              paymentKeys.detail(
                payment.id,
              ),
          });

        }

      },

  });

};


// =====================================================
// CREATE BANK TRANSFER
// =====================================================
//
// POST /bank-transfers
//
// Flow:
//
// Taxpayer makes bank transfer
//    ↓
// Submit transfer + evidence
//    ↓
// PENDING_VERIFICATION
//    ↓
// Revenue officer verifies
//    ↓
// VERIFIED
//    ↓
// POSTED
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
      (
        data,
      ) =>
        paymentService.createBankTransfer(
          data,
        ),


    onSuccess:
      () => {

        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.lists(),
        });

        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.pendingBankTransfers(),
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
// Used by revenue officers / authorized users to review
// bank transfers awaiting verification.
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

  });

};


// =====================================================
// VERIFY BANK TRANSFER
// =====================================================
//
// POST /bank-transfers/{payment}/verify
//
// Verification confirms that the submitted transfer
// is valid.
//
// Depending on the backend workflow, posting may occur
// as part of verification or as a separate financial
// posting operation.
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
      (
        response,
      ) => {

        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.lists(),
        });

        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.pendingBankTransfers(),
        });


        const payment =
          response?.data;

        if (payment?.id) {

          queryClient.invalidateQueries({
            queryKey:
              paymentKeys.detail(
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
// A rejected transfer must not affect the invoice's
// official paid amount.
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
      (
        response,
      ) => {

        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.lists(),
        });

        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.pendingBankTransfers(),
        });


        const payment =
          response?.data;

        if (payment?.id) {

          queryClient.invalidateQueries({
            queryKey:
              paymentKeys.detail(
                payment.id,
              ),
          });

        }

      },

  });

};