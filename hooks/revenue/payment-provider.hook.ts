"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { toast } from "sonner";

import type {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import type {
  PaymentProvider,
  PaymentProviderFilters,
  PaymentProviderFormData,
} from "@/types/revenue/payment-provider";

import {
  paymentProviderService,
} from "@/services/revenue/payment-provider.service";

// =====================================================
// QUERY KEYS
// =====================================================

export const paymentProviderKeys = {
  all: [
    "payment-providers",
  ],

  lists: () => [
    ...paymentProviderKeys.all,
    "list",
  ],

  list: (
    params?: PaymentProviderFilters,
  ) => [
    ...paymentProviderKeys.lists(),
    params,
  ],

  details: () => [
    ...paymentProviderKeys.all,
    "detail",
  ],

  detail: (
    id: string,
  ) => [
    ...paymentProviderKeys.details(),
    id,
  ],
};

// =====================================================
// GET PAYMENT PROVIDERS
// =====================================================

export const usePaymentProviders = (
  params?: PaymentProviderFilters,
) => {
  return useQuery<ListResponse<PaymentProvider>>({
    queryKey:
      paymentProviderKeys.list(params),

    queryFn:
      () =>
        paymentProviderService.getPaymentProviders(
          params,
        ),

    staleTime:
      1000 * 60 * 5,

    placeholderData:
      (previousData) =>
        previousData,
  });
};

// =====================================================
// GET PAYMENT PROVIDER DETAIL
// =====================================================

export const usePaymentProvider = (
  id: string,
  enabled = true,
) => {
  return useQuery<ApiResponse<PaymentProvider>>({
    queryKey:
      paymentProviderKeys.detail(id),

    queryFn:
      () =>
        paymentProviderService.getPaymentProviderById(
          id,
        ),

    enabled:
      enabled &&
      !!id,

    staleTime:
      1000 * 60 * 5,
  });
};

// =====================================================
// CREATE PAYMENT PROVIDER
// =====================================================

export const useCreatePaymentProvider = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      data: PaymentProviderFormData,
    ) =>
      paymentProviderService.createPaymentProvider(
        data,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          paymentProviderKeys.lists(),
      });

      toast.success(
        "Payment provider created successfully",
      );
    },
  });
};

// =====================================================
// UPDATE PAYMENT PROVIDER
// =====================================================

export const useUpdatePaymentProvider = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: PaymentProviderFormData;
    }) =>
      paymentProviderService.updatePaymentProvider(
        id,
        data,
      ),

    onSuccess: (
      _response,
      variables,
    ) => {
      queryClient.invalidateQueries({
        queryKey:
          paymentProviderKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          paymentProviderKeys.detail(
            variables.id,
          ),
      });

      toast.success(
        "Payment provider updated successfully",
      );
    },
  });
};

// =====================================================
// ACTIVATE PAYMENT PROVIDER
// =====================================================

export const useActivatePaymentProvider = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      id: string,
    ) =>
      paymentProviderService.activatePaymentProvider(
        id,
      ),

    onSuccess: (
      _response,
      id,
    ) => {
      queryClient.invalidateQueries({
        queryKey:
          paymentProviderKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          paymentProviderKeys.detail(id),
      });

      toast.success(
        "Payment provider activated successfully",
      );
    },
  });
};

// =====================================================
// DEACTIVATE PAYMENT PROVIDER
// =====================================================

export const useDeactivatePaymentProvider = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      id: string,
    ) =>
      paymentProviderService.deactivatePaymentProvider(
        id,
      ),

    onSuccess: (
      _response,
      id,
    ) => {
      queryClient.invalidateQueries({
        queryKey:
          paymentProviderKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          paymentProviderKeys.detail(id),
      });

      toast.success(
        "Payment provider deactivated successfully",
      );
    },
  });
};