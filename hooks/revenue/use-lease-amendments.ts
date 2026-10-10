"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CreateLeaseAmendmentPayload,
  LeaseAmendmentDecisionPayload,
  LeaseAmendmentFilters,
  RejectLeaseAmendmentPayload,
  UpdateLeaseAmendmentPayload,
} from "@/types/assessment/lease-amendment";

import { leaseAmendmentService } from "@/services/revenue/lease-amendment.service";

/* -------------------------------------------------------------------------- */
/* Error handling                                                              */
/* -------------------------------------------------------------------------- */

type ApiRecord = Record<string, unknown>;

type OutstandingInstallment = {
  installment_number?: number | string;
  due_date?: string;
  amount_due?: number | string;
  amount_paid?: number | string;
  remaining_amount?: number | string;
};

function isRecord(value: unknown): value is ApiRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getErrorResponse(error: unknown): ApiRecord | null {
  if (!isRecord(error)) {
    return null;
  }

  const response = error.response;

  if (!isRecord(response) || !isRecord(response.data)) {
    return null;
  }

  return response.data;
}

function getErrorText(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(getErrorText);
  }

  return [];
}

function parseOutstandingInstallments(
  value: unknown,
): OutstandingInstallment[] {
  if (Array.isArray(value)) {
    const results: OutstandingInstallment[] = [];

    for (const item of value) {
      if (isRecord(item)) {
        results.push(item as OutstandingInstallment);
        continue;
      }

      if (typeof item === "string") {
        try {
          const parsed: unknown = JSON.parse(item);

          if (Array.isArray(parsed)) {
            results.push(
              ...parsed.filter(isRecord) as OutstandingInstallment[],
            );
          } else if (isRecord(parsed)) {
            results.push(parsed as OutstandingInstallment);
          }
        } catch {
          // Ignore non-JSON strings; the main validation message
          // will still be shown in the toast.
        }
      }
    }

    return results;
  }

  if (typeof value === "string") {
    try {
      return parseOutstandingInstallments(JSON.parse(value));
    } catch {
      return [];
    }
  }

  if (isRecord(value)) {
    return [value as OutstandingInstallment];
  }

  return [];
}

function formatETB(value: unknown): string {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;

  if (!Number.isFinite(amount)) {
    return "ETB amount unavailable";
  }

  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Extract a useful user-facing message from Laravel/API errors.
 */
function getLeaseAmendmentApplyError(error: unknown): string {
  if (!isRecord(error) && !(error instanceof Error)) {
    return "Unable to apply the lease amendment. Please try again.";
  }

  const errorRecord = isRecord(error) ? error : {};
  const response = isRecord(errorRecord.response)
    ? errorRecord.response
    : null;

  // Support Axios response.data and common custom API wrappers.
  let data: ApiRecord | null = null;

  if (response && isRecord(response.data)) {
    data = response.data;
  } else if (isRecord(errorRecord.data)) {
    data = errorRecord.data;
  }

  // Some API clients place the actual response inside `body`.
  if (!data && isRecord(errorRecord.body)) {
    data = errorRecord.body;
  }

  // If the service throws a JSON response as its message, parse it.
  if (!data && error instanceof Error) {
    try {
      const parsed: unknown = JSON.parse(error.message);

      if (isRecord(parsed)) {
        data = parsed;
      }
    } catch {
      // The message is ordinary text, not JSON.
    }
  }

  const errors = isRecord(data?.errors) ? data.errors : {};

  const paymentMessages = getErrorText(errors.payment_schedules);
  const installments = parseOutstandingInstallments(
    errors.outstanding_installments,
  );

  if (paymentMessages.length > 0) {
    const message = paymentMessages[0];

    if (installments.length === 0) {
      return message;
    }

    const total = installments.reduce((sum, item) => {
      const amount = Number(item.remaining_amount ?? 0);
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);

    return `${message} ${installments.length} outstanding installment(s), totaling ${formatETB(total)}. Settle them and try again.`;
  }

  // Use any other field-specific Laravel validation message.
  const otherMessages = Object.entries(errors)
    .filter(
      ([key]) =>
        key !== "payment_schedules" &&
        key !== "outstanding_installments",
    )
    .flatMap(([, value]) => getErrorText(value));

  if (otherMessages.length > 0) {
    return otherMessages[0];
  }

  // Prefer a meaningful API message over Laravel's generic message.
  if (
    typeof data?.message === "string" &&
    data.message.trim().toLowerCase() !==
      "the given data was invalid"
  ) {
    return data.message.trim();
  }

  // Inspect nested error objects often used by custom HTTP clients.
  const nestedError = isRecord(errorRecord.error)
    ? errorRecord.error
    : null;

  if (nestedError) {
    const nestedMessage = getErrorText(nestedError.message)[0];

    if (nestedMessage) {
      return nestedMessage;
    }
  }

  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message.trim().toLowerCase() !==
      "the given data was invalid"
  ) {
    return error.message.trim();
  }

  return "The amendment cannot be applied because one or more installments due today or earlier remain unpaid. Settle all due installments and try again.";
}


/* -------------------------------------------------------------------------- */
/* Query keys                                                                  */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Queries                                                                     */
/* -------------------------------------------------------------------------- */

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
 * Retrieve one lease amendment.
 */
export function useLeaseAmendment(id: string) {
  return useQuery({
    queryKey: leaseAmendmentKeys.detail(id),
    queryFn: () => leaseAmendmentService.getById(id),
    enabled: Boolean(id),
  });
}

/* -------------------------------------------------------------------------- */
/* Cache invalidation                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Invalidate amendment lists and, optionally, one detail query.
 */
function useInvalidateLeaseAmendments() {
  const queryClient = useQueryClient();

  return async (id?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: leaseAmendmentKeys.lists(),
      }),

      ...(id
        ? [
            queryClient.invalidateQueries({
              queryKey: leaseAmendmentKeys.detail(id),
            }),
          ]
        : []),
    ]);
  };
}

/* -------------------------------------------------------------------------- */
/* Create                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Create a draft lease amendment.
 */
export function useCreateLeaseAmendment() {
  const invalidate = useInvalidateLeaseAmendments();

  return useMutation({
    mutationFn: (payload: CreateLeaseAmendmentPayload) =>
      leaseAmendmentService.create(payload),

    onSuccess: async () => {
      await invalidate();
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Update                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Update an editable lease amendment.
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

    onSuccess: async (_, variables) => {
      await invalidate(variables.id);
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Submit                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Submit a draft amendment for approval.
 */
export function useSubmitLeaseAmendment() {
  const invalidate = useInvalidateLeaseAmendments();

  return useMutation({
    mutationFn: (id: string) =>
      leaseAmendmentService.submit(id),

    onSuccess: async (_, id) => {
      await invalidate(id);
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Approve                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Approve an amendment pending approval.
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

    onSuccess: async (_, variables) => {
      await invalidate(variables.id);
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Reject                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Reject an amendment pending approval.
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

    onSuccess: async (_, variables) => {
      await invalidate(variables.id);
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Apply                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Apply an approved amendment.
 *
 * Shows a specific, actionable toast if the backend rejects the
 * operation because due installments remain outstanding.
 */
export function useApplyLeaseAmendment() {
  const invalidate = useInvalidateLeaseAmendments();

  return useMutation({
    mutationFn: (id: string) =>
      leaseAmendmentService.apply(id),

    onSuccess: async (_, id) => {
      await invalidate(id);
    },

    onError: (error) => {
      toast.error(getLeaseAmendmentApplyError(error), {
        duration: 8000,
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Cancel                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Cancel an amendment eligible for cancellation.
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

    onSuccess: async (_, variables) => {
      await invalidate(variables.id);
    },
  });
}
