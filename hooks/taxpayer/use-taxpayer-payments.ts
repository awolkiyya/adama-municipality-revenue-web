"use client";

import {
  useQuery,
} from "@tanstack/react-query";

import type {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import type {
  Payment,
  PaymentFilters,
} from "@/types/payment";

import {
  taxpayerPaymentService,
} from "@/services/taxpayer/taxpayer-payment.service";

export const taxpayerPaymentKeys = {
  all: ["taxpayer", "payments"] as const,

  lists: () =>
    [
      ...taxpayerPaymentKeys.all,
      "list",
    ] as const,

  list: (
    params?: PaymentFilters,
  ) =>
    [
      ...taxpayerPaymentKeys.lists(),
      params ?? {},
    ] as const,

  details: () =>
    [
      ...taxpayerPaymentKeys.all,
      "detail",
    ] as const,

  detail: (
    paymentId: string,
  ) =>
    [
      ...taxpayerPaymentKeys.details(),
      paymentId,
    ] as const,

  receipts: () =>
    [
      ...taxpayerPaymentKeys.all,
      "receipt",
    ] as const,

  receipt: (
    paymentId: string,
  ) =>
    [
      ...taxpayerPaymentKeys.receipts(),
      paymentId,
    ] as const,
};

/**
 * Taxpayer payment history.
 */
export function useTaxpayerPayments(
  params?: PaymentFilters,
) {
  return useQuery<
    ListResponse<Payment>
  >({
    queryKey:
      taxpayerPaymentKeys.list(params),

    queryFn:
      () =>
        taxpayerPaymentService.getPayments(
          params,
        ),

    staleTime:
      1000 * 60 * 2,

    placeholderData:
      (previousData) =>
        previousData,
  });
}

/**
 * Single taxpayer payment.
 */
export function useTaxpayerPayment(
  paymentId: string,
  enabled = true,
) {
  return useQuery<
    ApiResponse<Payment>
  >({
    queryKey:
      taxpayerPaymentKeys.detail(
        paymentId,
      ),

    queryFn:
      () =>
        taxpayerPaymentService.getPayment(
          paymentId,
        ),

    enabled:
      enabled && Boolean(paymentId),

    staleTime:
      1000 * 60 * 2,
  });
}

/**
 * Successful payment receipt.
 *
 * The backend itself enforces that the payment must be SUCCESS.
 */
export function useTaxpayerPaymentReceipt(
  paymentId: string,
  enabled = true,
) {
  return useQuery<
    ApiResponse<Payment>
  >({
    queryKey:
      taxpayerPaymentKeys.receipt(
        paymentId,
      ),

    queryFn:
      () =>
        taxpayerPaymentService.getPaymentReceipt(
          paymentId,
        ),

    enabled:
      enabled && Boolean(paymentId),

    staleTime:
      1000 * 60 * 5,

    refetchOnWindowFocus:
      false,
  });
}