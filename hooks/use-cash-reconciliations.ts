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

// ============================================================
// QUERY KEYS
// ============================================================

const QUERY_KEY = ["cash-reconciliations"] as const;

export const cashReconciliationQueryKeys = {
  all: QUERY_KEY,

  lists: () => [...QUERY_KEY, "list"] as const,

  list: (filters: CashReconciliationFilters = {}) =>
    [...QUERY_KEY, "list", filters] as const,

  details: () => [...QUERY_KEY, "detail"] as const,

  detail: (id: number) =>
    [...QUERY_KEY, "detail", id] as const,
};

// ============================================================
// CACHE INVALIDATION
// ============================================================

async function invalidateCashReconciliations(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: number,
): Promise<void> {
  const invalidations = [
    queryClient.invalidateQueries({
      queryKey: cashReconciliationQueryKeys.all,
    }),
  ];

  if (id !== undefined) {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: cashReconciliationQueryKeys.detail(id),
      }),
    );
  }

  await Promise.all(invalidations);
}

// ============================================================
// LIST
// ============================================================

/**
 * Fetch paginated cash reconciliations with optional filters.
 *
 * Supports status, collector, period, pagination, and sorting
 * filters accepted by the backend.
 */
export function useCashReconciliations(
  filters: CashReconciliationFilters = {},
) {
  return useQuery({
    queryKey: cashReconciliationQueryKeys.list(filters),

    queryFn: () =>
      cashReconciliationService.getAll(filters),

    staleTime: 30_000,
  });
}

// ============================================================
// DETAIL
// ============================================================

/**
 * Fetch one reconciliation by its numeric database ID.
 */
export function useCashReconciliation(
  id: number | null | undefined,
) {
  const validId =
    typeof id === "number" &&
    Number.isSafeInteger(id) &&
    id > 0;

  return useQuery({
    queryKey: validId
      ? cashReconciliationQueryKeys.detail(id)
      : [...cashReconciliationQueryKeys.details(), "disabled"],

    queryFn: () =>
      cashReconciliationService.getById(id as number),

    enabled: validId,

    staleTime: 30_000,
  });
}

// ============================================================
// CREATE
// ============================================================

/**
 * Create a draft cash reconciliation.
 */
export function useCreateCashReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: CreateCashReconciliationPayload,
    ) => cashReconciliationService.create(payload),

    onSuccess: async (created) => {
      await invalidateCashReconciliations(
        queryClient,
        created.id,
      );
    },
  });
}

// ============================================================
// UPDATE
// ============================================================

/**
 * Update an editable draft or returned reconciliation.
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
      await invalidateCashReconciliations(
        queryClient,
        updated.id,
      );
    },
  });
}

// ============================================================
// SUBMIT
// ============================================================

/**
 * Submit the physical cash count for finance review.
 *
 * The backend calculates expected cash and the difference.
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
      await invalidateCashReconciliations(
        queryClient,
        updated.id,
      );
    },
  });
}

// ============================================================
// REVIEW
// ============================================================

/**
 * Review a submitted reconciliation.
 *
 * Decisions:
 * - RECONCILED
 * - DISCREPANCY
 * - RETURNED
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
      await invalidateCashReconciliations(
        queryClient,
        updated.id,
      );
    },
  });
}

// ============================================================
// CANCEL
// ============================================================

/**
 * Cancel an eligible draft or returned reconciliation.
 */
export function useCancelCashReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      cashReconciliationService.cancel(id),

    onSuccess: async (updated) => {
      await invalidateCashReconciliations(
        queryClient,
        updated.id,
      );
    },
  });
}
