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
  Payment,
  PaymentFilters,
  InitializePaymentRequest,
  InitializePaymentResponse,
} from "@/types/payment";

import {
  paymentService,
} from "@/services/payment/payment.service";


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


  chapaStatus: (
    id: string,
  ) => [
    ...paymentKeys.all,
    "chapa-status",
    id,
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
    ApiResponse<Payment>
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
// INITIALIZE CHAPA PAYMENT
// =====================================================
//
// POST /payments/chapa/initialize
//
// Flow:
//
// Invoice
//    ↓
// Pay Invoice
//    ↓
// Initialize Chapa Payment
//    ↓
// Laravel creates PENDING payment
//    ↓
// Chapa checkout
//
// IMPORTANT:
//
// The frontend amount is only a requested amount.
//
// Laravel MUST:
//
// - authenticate the taxpayer
// - verify invoice ownership
// - read the current invoice balance
// - validate the requested amount
// - create the payment transaction
// - initialize Chapa
//
// The frontend must NEVER update:
//
// - invoice.paid_amount
// - invoice.balance_due
// - invoice.status
// - payment.status
//
// =====================================================

export const useInitializeChapaPayment = () => {

  const queryClient =
    useQueryClient();


  return useMutation<
    InitializePaymentResponse,
    Error,
    InitializePaymentRequest
  >({

    mutationFn:
      (
        data,
      ) =>
        paymentService.initializeChapaPayment(
          data,
        ),


    onSuccess:
      (
        response,
      ) => {

        /*
         * Initialization does not mean payment success.
         *
         * The payment should normally still be PENDING
         * until Laravel receives and verifies the provider
         * result.
         *
         * Therefore we do not update invoice/payment
         * financial values here.
         */


        const paymentReference =
          response?.data
            ?.paymentReference;


        /*
         * If the backend returns a payment reference,
         * refresh payment-related queries.
         *
         * Do not construct a fake Payment object from
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
// GET CHAPA PAYMENT STATUS
// =====================================================
//
// GET /payments/chapa/{payment}/status
//
// This endpoint returns the LOCAL Laravel payment state.
//
// Laravel remains the source of truth.
//
// Possible lifecycle:
//
// PENDING
//    ↓
// SUCCESS
//
// or
//
// PENDING
//    ↓
// FAILED
//
// =====================================================

export const useChapaPaymentStatus = (
  paymentId: string,
  enabled = true,
) => {

  return useQuery<
    ApiResponse<Payment>
  >({

    queryKey:
      paymentKeys.chapaStatus(
        paymentId,
      ),

    queryFn:
      () =>
        paymentService.getChapaPaymentStatus(
          paymentId,
        ),

    enabled:
      enabled &&
      !!paymentId,

    staleTime:
      1000 * 30,

    refetchOnWindowFocus:
      false,

  });

};