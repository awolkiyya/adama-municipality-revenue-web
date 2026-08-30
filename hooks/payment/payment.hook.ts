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
  VerifyPaymentRequest,
  VerifyPaymentResponse,
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


  verification: (
    id: string,
  ) => [
    ...paymentKeys.all,
    "verification",
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
// INITIALIZE GENERIC PAYMENT
// =====================================================

export const useInitializePayment = () => {

  const queryClient =
    useQueryClient();


  return useMutation<
    InitializePaymentResponse,
    Error,
    InitializePaymentRequest
  >({

    // ===================================================
    // MUTATION
    // ===================================================

    mutationFn:
      (
        data,
      ) =>
        paymentService.initializePayment(
          data,
        ),


    // ===================================================
    // SUCCESS
    // ===================================================

    onSuccess:
      (
        response,
      ) => {

        /*
         * The initialize-payment response does NOT
         * return a Payment resource.
         *
         * It returns the provider initialization result:
         *
         * - paymentReference
         * - providerReference
         * - checkoutUrl
         * - status
         * - amount
         * - currency
         *
         * Therefore, do not try to access:
         *
         * response.data.payment
         */

        const paymentReference =
          response?.data
            ?.paymentReference;


        if (!paymentReference) {
          return;
        }


        // =================================================
        // REFRESH PAYMENT LISTS
        // =================================================

        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.lists(),
        });


        /*
         * Do NOT construct a fake ApiResponse.
         *
         * The initialize response has its own response
         * structure and should remain separate from the
         * payment-detail response.
         */
      },

  });

};


// =====================================================
// VERIFY PAYMENT
// =====================================================

export const useVerifyPayment = () => {

  const queryClient =
    useQueryClient();


  return useMutation<
    VerifyPaymentResponse,
    Error,
    VerifyPaymentRequest
  >({

    mutationFn:
      (
        data,
      ) =>
        paymentService.verifyPayment(
          data,
        ),


    onSuccess:
      (
        response,
        variables,
      ) => {

        const payment =
          response?.data?.payment;


        if (payment?.id) {

          // ------------------------------------------------
          // Store the actual verification response
          // ------------------------------------------------

          queryClient.setQueryData(
            paymentKeys.verification(
              payment.id,
            ),
            response,
          );


          // ------------------------------------------------
          // Refresh payment detail from backend
          // ------------------------------------------------

          queryClient.invalidateQueries({
            queryKey:
              paymentKeys.detail(
                payment.id,
              ),
          });


          // ------------------------------------------------
          // Refresh payment list
          // ------------------------------------------------

          queryClient.invalidateQueries({
            queryKey:
              paymentKeys.lists(),
          });

        }


        // ------------------------------------------------
        // Also invalidate verification query
        // ------------------------------------------------

        queryClient.invalidateQueries({
          queryKey:
            paymentKeys.verification(
              variables.payment_id,
            ),
        });

      },

  });

};


// =====================================================
// GET CHAPA PAYMENT STATUS
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