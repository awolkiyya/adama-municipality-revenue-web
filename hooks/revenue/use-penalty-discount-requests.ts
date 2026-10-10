"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";

import type {
  DecidePenaltyDiscountRequestPayload,
  PenaltyDiscountRequestFilters,
  UpdatePenaltyDiscountRequestPayload,
} from "@/types/revenue/penalty-discount-request";

import { penaltyDiscountRequestService } from "@/services/revenue/penalty-discount-request-service";

/**
 * Laravel API error response.
 */
interface LaravelApiError {
  message?: string;
  errors?: Record<string, string[] | string>;
}

/**
 * Convert Axios/Laravel errors into readable messages.
 */
function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<LaravelApiError>;
  const responseData = axiosError.response?.data;

  if (responseData?.errors) {
    const messages = Object.values(responseData.errors).flatMap(
      (value) => (Array.isArray(value) ? value : [value]),
    );

    if (messages.length > 0) {
      return messages.join("\n");
    }
  }

  return (
    responseData?.message ??
    axiosError.message ??
    "An unexpected error occurred. Please try again."
  );
}

/**
 * Query keys for penalty discount requests.
 */
export const penaltyDiscountRequestKeys = {
  all: ["penalty-discount-requests"] as const,

  lists: () =>
    [...penaltyDiscountRequestKeys.all, "list"] as const,

  list: (filters: PenaltyDiscountRequestFilters) =>
    [...penaltyDiscountRequestKeys.lists(), filters] as const,

  details: () =>
    [...penaltyDiscountRequestKeys.all, "detail"] as const,

  detail: (id: string) =>
    [...penaltyDiscountRequestKeys.details(), id] as const,

  history: (id: string) =>
    [...penaltyDiscountRequestKeys.all, "history", id] as const,
};

/**
 * Invalidate list, detail, and history queries after mutations.
 */
function useInvalidatePenaltyDiscountRequests() {
  const queryClient = useQueryClient();

  return async (id?: string) => {
    await queryClient.invalidateQueries({
      queryKey: penaltyDiscountRequestKeys.lists(),
    });

    if (id) {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: penaltyDiscountRequestKeys.detail(id),
        }),
        queryClient.invalidateQueries({
          queryKey: penaltyDiscountRequestKeys.history(id),
        }),
      ]);
    }
  };
}

/**
 * List penalty discount requests and dashboard summary.
 */
export function usePenaltyDiscountRequests(
  filters: PenaltyDiscountRequestFilters = {},
) {
  return useQuery({
    queryKey: penaltyDiscountRequestKeys.list(filters),
    queryFn: () =>
      penaltyDiscountRequestService.getAll(filters),
  });
}

/**
 * Retrieve a single penalty discount request.
 */
export function usePenaltyDiscountRequest(
  id: string,
  enabled = true,
) {
  return useQuery({
    queryKey: penaltyDiscountRequestKeys.detail(id),
    queryFn: () =>
      penaltyDiscountRequestService.getById(id),
    enabled: enabled && Boolean(id),
  });
}

/**
 * Retrieve request history/details.
 */
export function usePenaltyDiscountRequestHistory(
  id: string,
  enabled = true,
) {
  return useQuery({
    queryKey: penaltyDiscountRequestKeys.history(id),
    queryFn: () =>
      penaltyDiscountRequestService.getHistory(id),
    enabled: enabled && Boolean(id),
  });
}

/**
 * Create a penalty discount request using multipart/form-data.
 *
 * FormData is required to upload the supporting document correctly.
 * Do not convert this payload to JSON.
 */
export function useCreatePenaltyDiscountRequest() {
  const invalidate = useInvalidatePenaltyDiscountRequests();

  return useMutation({
    mutationFn: (payload: FormData) =>
      penaltyDiscountRequestService.create(payload),

    onSuccess: async () => {
      await invalidate();

      toast.success(
        "Penalty discount request created successfully.",
      );
    },

    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Update a draft penalty discount request.
 */
export function useUpdatePenaltyDiscountRequest() {
  const invalidate = useInvalidatePenaltyDiscountRequests();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePenaltyDiscountRequestPayload;
    }) => penaltyDiscountRequestService.update(id, payload),

    onSuccess: async (request) => {
      await invalidate(request.id);

      toast.success(
        "Penalty discount request updated successfully.",
      );
    },

    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Submit a draft request for approval.
 */
export function useSubmitPenaltyDiscountRequest() {
  const invalidate = useInvalidatePenaltyDiscountRequests();

  return useMutation({
    mutationFn: (id: string) =>
      penaltyDiscountRequestService.submit(id),

    onSuccess: async (_response, id) => {
      await invalidate(id);

      toast.success(
        "Penalty discount request submitted successfully.",
      );
    },

    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Approve or reject a submitted request.
 */
export function useDecidePenaltyDiscountRequest() {
  const invalidate = useInvalidatePenaltyDiscountRequests();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: DecidePenaltyDiscountRequestPayload;
    }) => penaltyDiscountRequestService.decide(id, payload),

    onSuccess: async (_response, variables) => {
      await invalidate(variables.id);

      toast.success(
        variables.payload.decision === "APPROVED"
          ? "Penalty discount request approved successfully."
          : "Penalty discount request rejected successfully.",
      );
    },

    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Apply an approved discount to the invoice.
 */
export function useApplyPenaltyDiscountRequest() {
  const invalidate = useInvalidatePenaltyDiscountRequests();

  return useMutation({
    mutationFn: (id: string) =>
      penaltyDiscountRequestService.apply(id),

    onSuccess: async (_response, id) => {
      await invalidate(id);

      toast.success(
        "Approved penalty discount applied to the invoice successfully.",
      );
    },

    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Cancel an eligible request.
 */
export function useCancelPenaltyDiscountRequest() {
  const invalidate = useInvalidatePenaltyDiscountRequests();

  return useMutation({
    mutationFn: (id: string) =>
      penaltyDiscountRequestService.cancel(id),

    onSuccess: async (_response, id) => {
      await invalidate(id);

      toast.success(
        "Penalty discount request cancelled successfully.",
      );
    },

    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
