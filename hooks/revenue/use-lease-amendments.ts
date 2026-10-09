// hooks/use-lease-amendments.ts

"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { ApiMessageResponse, CreateLeaseAmendmentPayload, LeaseAmendment, LeaseAmendmentDecisionPayload, LeaseAmendmentFilters, RejectLeaseAmendmentPayload, UpdateLeaseAmendmentPayload } from "@/types/assessment/lease-amendment";
import { leaseAmendmentService } from "@/services/revenue/lease-amendment.service";


export const leaseAmendmentKeys = {
  all: ["lease-amendments"] as const,

  lists: () =>
    [...leaseAmendmentKeys.all, "list"] as const,

  list: (filters: LeaseAmendmentFilters) =>
    [...leaseAmendmentKeys.lists(), filters] as const,

  details: () =>
    [...leaseAmendmentKeys.all, "detail"] as const,

  detail: (id: string) =>
    [...leaseAmendmentKeys.details(), id] as const,
};

/**
 * List and filter lease amendments.
 */
export function useLeaseAmendments(
  filters: LeaseAmendmentFilters = {},
) {
  return useQuery({
    queryKey: leaseAmendmentKeys.list(filters),
    queryFn: () => leaseAmendmentService.getAll(filters),
  });
}

/**
 * Retrieve one amendment.
 */
export function useLeaseAmendment(id: string) {
  return useQuery({
    queryKey: leaseAmendmentKeys.detail(id),
    queryFn: () => leaseAmendmentService.getById(id),
    enabled: Boolean(id),
  });
}

/**
 * Shared cache invalidation.
 */
function useInvalidateLeaseAmendments() {
  const queryClient = useQueryClient();

  return (id?: string) => {
    const tasks = [
      queryClient.invalidateQueries({
        queryKey: leaseAmendmentKeys.all,
      }),
    ];

    if (id) {
      tasks.push(
        queryClient.invalidateQueries({
          queryKey: leaseAmendmentKeys.detail(id),
        }),
      );
    }

    return Promise.all(tasks);
  };
}

/**
 * Create a draft amendment.
 */
export function useCreateLeaseAmendment() {
  const invalidate = useInvalidateLeaseAmendments();

  return useMutation({
    mutationFn: (payload: CreateLeaseAmendmentPayload) =>
      leaseAmendmentService.create(payload),

    onSuccess: () => invalidate(),
  });
}

/**
 * Update an editable amendment.
 */
export function useUpdateLeaseAmendment() {
  const invalidate = useInvalidateLeaseAmendments();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateLeaseAmendmentPayload;
    }) => leaseAmendmentService.update(id, payload),

    onSuccess: (_, variables) => invalidate(variables.id),
  });
}

/**
 * Submit a draft for approval.
 */
export function useSubmitLeaseAmendment() {
  const invalidate = useInvalidateLeaseAmendments();

  return useMutation({
    mutationFn: (id: string) =>
      leaseAmendmentService.submit(id),

    onSuccess: (_, id) => invalidate(id),
  });
}

/**
 * Approve a submitted amendment.
 */
export function useApproveLeaseAmendment() {
  const invalidate = useInvalidateLeaseAmendments();

  return useMutation({
    mutationFn: ({
      id,
      payload = {},
    }: {
      id: string;
      payload?: LeaseAmendmentDecisionPayload;
    }) => leaseAmendmentService.approve(id, payload),

    onSuccess: (_, variables) => invalidate(variables.id),
  });
}

/**
 * Reject a submitted amendment.
 */
export function useRejectLeaseAmendment() {
  const invalidate = useInvalidateLeaseAmendments();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: RejectLeaseAmendmentPayload;
    }) => leaseAmendmentService.reject(id, payload),

    onSuccess: (_, variables) => invalidate(variables.id),
  });
}

/**
 * Apply an approved amendment.
 */
export function useApplyLeaseAmendment() {
  const invalidate = useInvalidateLeaseAmendments();

  return useMutation({
    mutationFn: (id: string) =>
      leaseAmendmentService.apply(id),

    onSuccess: (_, id) => invalidate(id),
  });
}

/**
 * Cancel an eligible amendment.
 */
export function useCancelLeaseAmendment() {
  const invalidate = useInvalidateLeaseAmendments();

  return useMutation({
    mutationFn: ({
      id,
      payload = {},
    }: {
      id: string;
      payload?: LeaseAmendmentDecisionPayload;
    }) => leaseAmendmentService.cancel(id, payload),

    onSuccess: (_, variables) => invalidate(variables.id),
  });
}