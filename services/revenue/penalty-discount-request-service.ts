import { api } from "@/lib/api";

import type { PaginatedResponse } from "@/types/api";

import type {
  DecidePenaltyDiscountRequestPayload,
  PenaltyDiscountRequest,
  PenaltyDiscountRequestFilters,
  PenaltyDiscountRequestSummary,
  UpdatePenaltyDiscountRequestPayload,
} from "@/types/revenue/penalty-discount-request";

const BASE_URL = "/penalty-discount-requests";

/**
 * List penalty discount requests.
 *
 * The backend index endpoint returns the dashboard summary together
 * with the paginated request collection.
 */
export const penaltyDiscountRequestService = {
  async getAll(
    filters: PenaltyDiscountRequestFilters = {},
  ): Promise<
    PaginatedResponse<PenaltyDiscountRequest> & {
      summary?: PenaltyDiscountRequestSummary;
      requests?: PaginatedResponse<PenaltyDiscountRequest>;
    }
  > {
    const response = await api.get(BASE_URL, {
      params: filters,
    });

    return response.data;
  },

  /**
   * Retrieve a single penalty discount request.
   */
  async getById(id: string): Promise<PenaltyDiscountRequest> {
    const response = await api.get(
      `${BASE_URL}/${encodeURIComponent(id)}`,
    );

    return response.data.data ?? response.data;
  },

  /**
   * Create a penalty discount request using multipart/form-data.
   *
   * FormData carries the actual supporting document file.
   * Do not convert it to JSON or stringify it.
   */
  async create(
    payload: FormData,
  ): Promise<PenaltyDiscountRequest> {
    const response = await api.post(BASE_URL, payload);

    return response.data.data ?? response.data;
  },

  /**
   * Update a draft penalty discount request.
   */
  async update(
    id: string,
    payload: UpdatePenaltyDiscountRequestPayload,
  ): Promise<PenaltyDiscountRequest> {
    const response = await api.put(
      `${BASE_URL}/${encodeURIComponent(id)}`,
      payload,
    );

    return response.data.data ?? response.data;
  },

  /**
   * Submit a draft request for approval.
   */
  async submit(id: string): Promise<PenaltyDiscountRequest> {
    const response = await api.post(
      `${BASE_URL}/${encodeURIComponent(id)}/submit`,
    );

    return response.data;
  },

  /**
   * Approve or reject a submitted request.
   */
  async decide(
    id: string,
    payload: DecidePenaltyDiscountRequestPayload,
  ): Promise<PenaltyDiscountRequest> {
    const response = await api.post(
      `${BASE_URL}/${encodeURIComponent(id)}/decide`,
      payload,
    );

    return response.data;
  },

  /**
   * Apply an approved discount to the invoice.
   */
  async apply(id: string): Promise<PenaltyDiscountRequest> {
    const response = await api.post(
      `${BASE_URL}/${encodeURIComponent(id)}/apply`,
    );

    return response.data;
  },

  /**
   * Cancel an eligible request.
   */
  async cancel(id: string): Promise<PenaltyDiscountRequest> {
    const response = await api.post(
      `${BASE_URL}/${encodeURIComponent(id)}/cancel`,
    );

    return response.data;
  },

  /**
   * Retrieve request history/details.
   *
   * The current backend endpoint returns the request resource,
   * not a separate collection of audit events.
   */
  async getHistory(
    id: string,
  ): Promise<PenaltyDiscountRequest> {
    const response = await api.get(
      `${BASE_URL}/${encodeURIComponent(id)}/history`,
    );

    return response.data.data ?? response.data;
  },
};
