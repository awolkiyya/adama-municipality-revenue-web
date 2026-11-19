
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
  ExpectedByCollectorFilters,
} from "@/types/cash-reconciliation";

// ============================================================
// MUTATION INPUT TYPES
// ============================================================

export interface CreateCashReconciliationInput {
  payload: CreateCashReconciliationPayload;
  files: File[];
}

export interface UpdateCashReconciliationInput {
  id: string;
  payload: UpdateCashReconciliationPayload;
  files: File[];
  removeEvidenceIds: string[];
}

// ============================================================
// UUID VALIDATION
// ============================================================

function isValidUuid(id: unknown): id is string {
  return (
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  );
}

// ============================================================
// QUERY KEYS
// ============================================================

const QUERY_KEY = ["cash-reconciliations"] as const;

export const cashReconciliationQueryKeys = {
  all: QUERY_KEY,

  lists: () => [...QUERY_KEY, "list"] as const,

  list: (filters: CashReconciliationFilters = {}) =>
    [...QUERY_KEY, "list", filters] as const,

  // Expected cash by collector
  expectedByCollectors: () =>
    [...QUERY_KEY, "expected-by-collector"] as const,

  expectedByCollector: (
    filters: ExpectedByCollectorFilters = {},
  ) =>
    [...QUERY_KEY, "expected-by-collector", filters] as const,

  details: () => [...QUERY_KEY, "detail"] as const,

  detail: (id: string) =>
    [...QUERY_KEY, "detail", id] as const,
};

// ============================================================
// CACHE INVALIDATION
// ============================================================

async function invalidateCashReconciliations(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
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
// EXPECTED CASH BY COLLECTOR
// ============================================================

/**
 * Fetch expected, reconciled, and outstanding cash grouped
 * by revenue collector.
 *
 * Supports:
 * - Date range filtering
 * - Collector name/email search
 * - Expected, reconciled, and outstanding sorting
 * - Pagination
 *
 * The response includes pagination metadata and aggregate
 * totals for the currently filtered collector dataset.
 */
export function useExpectedCashByCollector(
  filters: ExpectedByCollectorFilters = {},
) {
  return useQuery({
    queryKey:
      cashReconciliationQueryKeys.expectedByCollector(filters),

    queryFn: () =>
      cashReconciliationService.expectedByCollector(filters),

    staleTime: 30_000,
  });
}

// ============================================================
// DETAIL
// ============================================================

/**
 * Fetch one reconciliation by its UUID.
 */
export function useCashReconciliation(
  id: string | null | undefined,
) {
  const validId = isValidUuid(id);

  return useQuery({
    queryKey: validId
      ? cashReconciliationQueryKeys.detail(id)
      : [...cashReconciliationQueryKeys.details(), "disabled"],

    queryFn: () =>
      cashReconciliationService.getById(id as string),

    enabled: validId,

    staleTime: 30_000,
  });
}

// ============================================================
// CREATE
// ============================================================

/**
 * Create a draft cash reconciliation together with
 * its evidence files in one multipart request.
 */
export function useCreateCashReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      files,
    }: CreateCashReconciliationInput) =>
      cashReconciliationService.create(payload, files),

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
 * Update an editable draft or returned reconciliation
 * together with newly selected evidence files and requested
 * removals of existing evidence.
 */
export function useUpdateCashReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
      files,
      removeEvidenceIds,
    }: UpdateCashReconciliationInput) =>
      cashReconciliationService.update(
        id,
        payload,
        files,
        removeEvidenceIds,
      ),

    onSuccess: async (updated) => {
      await invalidateCashReconciliations(
        queryClient,
        updated.id,
      );
    },
  });
}

// ============================================================
// DELETE DRAFT
// ============================================================

/**
 * Permanently delete an unsubmitted DRAFT reconciliation.
 *
 * The backend must enforce:
 * - The authenticated collector owns the reconciliation.
 * - The reconciliation status is exactly DRAFT.
 * - Submitted and reviewed records cannot be deleted.
 *
 * After deletion, refresh reconciliation lists and remove
 * the deleted reconciliation from the detail cache.
 */
export function useDeleteCashReconciliationDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      if (!isValidUuid(id)) {
        throw new Error(
          "Invalid cash reconciliation ID.",
        );
      }

      return cashReconciliationService.deleteDraft(id);
    },

    onSuccess: async (_result, id) => {
      queryClient.removeQueries({
        queryKey: cashReconciliationQueryKeys.detail(id),
        exact: true,
      });

      await invalidateCashReconciliations(queryClient);
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
      id: string;
      payload: SubmitCashReconciliationPayload;
    }) =>
      cashReconciliationService.submit(id, payload),

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
      id: string;
      payload: ReviewCashReconciliationPayload;
    }) =>
      cashReconciliationService.review(id, payload),

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
    mutationFn: (id: string) =>
      cashReconciliationService.cancel(id),

    onSuccess: async (updated) => {
      await invalidateCashReconciliations(
        queryClient,
        updated.id,
      );
    },
  });
}
