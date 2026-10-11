
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { cashReconciliationService } from "@/services/cash-reconciliation-service";

import type {
  CashReconciliationFilters,
  CreateCashReconciliationPayload,
  UpdateCashReconciliationPayload,
  SubmitCashReconciliationPayload,
  ReviewCashReconciliationPayload,
} from "@/types/cash-reconciliation";

const QUERY_KEY = ["cash-reconciliations"] as const;

/**
 * List cash reconciliations with optional filters.
 */
export function useCashReconciliations(
  filters: CashReconciliationFilters = {},
) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => cashReconciliationService.getAll(filters),
  });
}

/**
 * Fetch one cash reconciliation.
 */
export function useCashReconciliation(id: number | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, "detail", id],
    queryFn: () => cashReconciliationService.getById(id!),
    enabled: id !== null && Number.isFinite(id) && id > 0,
  });
}

/**
 * Create a cash reconciliation draft.
 */
export function useCreateCashReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCashReconciliationPayload) =>
      cashReconciliationService.create(payload),

    onSuccess: async (created) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: [...QUERY_KEY, "detail", created.id],
        }),
      ]);
    },
  });
}

/**
 * Update a draft or returned reconciliation.
 */
export function useUpdateCashReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateCashReconciliationPayload;
    }) => cashReconciliationService.update(id, payload),

    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: [...QUERY_KEY, "detail", updated.id],
        }),
      ]);
    },
  });
}

/**
 * Submit the physical cash count for finance review.
 */
export function useSubmitCashReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: SubmitCashReconciliationPayload;
    }) => cashReconciliationService.submit(id, payload),

    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: [...QUERY_KEY, "detail", updated.id],
        }),
      ]);
    },
  });
}

/**
 * Review a submitted reconciliation.
 */
export function useReviewCashReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ReviewCashReconciliationPayload;
    }) => cashReconciliationService.review(id, payload),

    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: [...QUERY_KEY, "detail", updated.id],
        }),
      ]);
    },
  });
}

/**
 * Cancel an eligible reconciliation.
 */
export function useCancelCashReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      cashReconciliationService.cancel(id),

    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: [...QUERY_KEY, "detail", updated.id],
        }),
      ]);
    },
  });
}