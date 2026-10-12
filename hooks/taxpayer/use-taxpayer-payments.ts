"use client";

import { useQuery } from "@tanstack/react-query";

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

/* -------------------------------------------------------------------------- */
/* Query Keys                                                                 */
/* -------------------------------------------------------------------------- */

export const taxpayerPaymentKeys = {
all: ["taxpayer", "payments"] as const,

lists: () =>
[...taxpayerPaymentKeys.all, "list"] as const,

list: (params?: PaymentFilters) =>
[...taxpayerPaymentKeys.lists(), params ?? {}] as const,

details: () =>
[...taxpayerPaymentKeys.all, "detail"] as const,

detail: (paymentId: string) =>
[...taxpayerPaymentKeys.details(), paymentId] as const,

receipts: () =>
[...taxpayerPaymentKeys.all, "receipt"] as const,

receipt: (paymentId: string) =>
[...taxpayerPaymentKeys.receipts(), paymentId] as const,
};

/* -------------------------------------------------------------------------- */
/* Taxpayer Payment History                                                   */
/* -------------------------------------------------------------------------- */

/**

* Fetches the authenticated taxpayer's payment history.
  */
  export function useTaxpayerPayments(
  params?: PaymentFilters,
  ) {
  return useQuery<ListResponse<Payment>>({
  queryKey: taxpayerPaymentKeys.list(params),

  queryFn: () =>
  taxpayerPaymentService.getPayments(params),

  staleTime: 1000 * 60 * 2,

  // Retain the previous result while changing query parameters.
  placeholderData: (previousData) => previousData,
  });
  }

/* -------------------------------------------------------------------------- */
/* Single Taxpayer Payment                                                    */
/* -------------------------------------------------------------------------- */

/**

* Fetches one payment by its ID.
  */
  export function useTaxpayerPayment(
  paymentId: string,
  enabled = true,
  ) {
  return useQuery<ApiResponse<Payment>>({
  queryKey: taxpayerPaymentKeys.detail(paymentId),

  queryFn: () =>
  taxpayerPaymentService.getPayment(paymentId),

  enabled: enabled && Boolean(paymentId),

  staleTime: 1000 * 60 * 2,
  });
  }

/* -------------------------------------------------------------------------- */
/* Payment Receipt                                                            */
/* -------------------------------------------------------------------------- */

/**

* Fetches the receipt for a payment.
*
* The backend must enforce the receipt eligibility rules.
* A completed payment uses the COMPLETED status, not SUCCESS.
  */
  export function useTaxpayerPaymentReceipt(
  paymentId: string,
  enabled = true,
  ) {
  return useQuery<ApiResponse<Payment>>({
  queryKey: taxpayerPaymentKeys.receipt(paymentId),

  queryFn: () =>
  taxpayerPaymentService.getPaymentReceipt(paymentId),

  enabled: enabled && Boolean(paymentId),

  staleTime: 1000 * 60 * 5,

  refetchOnWindowFocus: false,
  });
  }
