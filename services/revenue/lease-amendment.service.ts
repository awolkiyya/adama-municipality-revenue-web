// services/lease-amendment.service.ts

import { api } from "@/lib/api";

import type { PaginatedResponse } from "@/types/api";

import type {
  ApiMessageResponse,
  CreateLeaseAmendmentPayload,
  LeaseAmendment,
  LeaseAmendmentDecisionPayload,
  LeaseAmendmentFilters,
  LeaseAmendmentSummary,
  RejectLeaseAmendmentPayload,
  UpdateLeaseAmendmentPayload,
} from "@/types/assessment/lease-amendment";

const BASE_URL = "/lease-amendments";

/**
 * Convert an amendment payload to multipart/form-data when supporting
 * documents are present. Otherwise, preserve the JSON request format.
 */
function toMultipartFormData(
  payload: CreateLeaseAmendmentPayload | UpdateLeaseAmendmentPayload,
): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (key === "supporting_documents" && Array.isArray(value)) {
      for (const file of value) {
        if (file instanceof File) {
          formData.append("supporting_documents[]", file);
        }
      }

      continue;
    }

    if (Array.isArray(value) || typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      continue;
    }

    formData.append(key, String(value));
  }

  return formData;
}

function hasSupportingDocuments(
  payload: CreateLeaseAmendmentPayload | UpdateLeaseAmendmentPayload,
): boolean {
  return (
    Array.isArray(payload.supporting_documents) &&
    payload.supporting_documents.some((file) => file instanceof File)
  );
}

export const leaseAmendmentService = {
  /**
   * List lease amendments.
   */
  async getAll(
    filters: LeaseAmendmentFilters = {},
  ): Promise<PaginatedResponse<LeaseAmendment> & {
    summary?: LeaseAmendmentSummary;
  }> {
    const response = await api.get(BASE_URL, {
      params: filters,
    });

    return response.data;
  },

  /**
   * Retrieve a single amendment.
   */
  async getById(id: string): Promise<LeaseAmendment> {
    const response = await api.get(
      `${BASE_URL}/${encodeURIComponent(id)}`,
    );

    return response.data.data ?? response.data;
  },

  /**
   * Create an amendment.
   */
  async create(
    payload: CreateLeaseAmendmentPayload,
  ): Promise<LeaseAmendment> {
    if (hasSupportingDocuments(payload)) {
      const formData = toMultipartFormData(payload);

      const response = await api.post(BASE_URL, formData);

      return response.data.data ?? response.data;
    }

    const response = await api.post(BASE_URL, payload);

    return response.data.data ?? response.data;
  },

  /**
   * Update an existing amendment.
   */
  async update(
    id: string,
    payload: UpdateLeaseAmendmentPayload,
  ): Promise<LeaseAmendment> {
    const url = `${BASE_URL}/${encodeURIComponent(id)}`;

    if (hasSupportingDocuments(payload)) {
      const formData = toMultipartFormData(payload);

      // Laravel reliably handles multipart uploads through POST + _method.
      formData.append("_method", "PUT");

      const response = await api.post(url, formData);

      return response.data.data ?? response.data;
    }

    const response = await api.put(url, payload);

    return response.data.data ?? response.data;
  },

  /**
   * Submit an amendment for approval.
   */
  async submit(id: string): Promise<ApiMessageResponse> {
    const response = await api.post(
      `${BASE_URL}/${encodeURIComponent(id)}/submit`,
    );

    return response.data;
  },

  /**
   * Approve an amendment.
   */
  async approve(
    id: string,
    payload: LeaseAmendmentDecisionPayload = {},
  ): Promise<ApiMessageResponse> {
    const response = await api.post(
      `${BASE_URL}/${encodeURIComponent(id)}/approve`,
      payload,
    );

    return response.data;
  },

  /**
   * Reject an amendment.
   */
  async reject(
    id: string,
    payload: RejectLeaseAmendmentPayload,
  ): Promise<ApiMessageResponse> {
    const response = await api.post(
      `${BASE_URL}/${encodeURIComponent(id)}/reject`,
      payload,
    );

    return response.data;
  },

  /**
   * Apply an approved amendment.
   */
  async apply(id: string): Promise<ApiMessageResponse> {
    const response = await api.post(
      `${BASE_URL}/${encodeURIComponent(id)}/apply`,
    );

    return response.data;
  },

  /**
   * Cancel an amendment.
   */
  async cancel(
    id: string,
    payload: LeaseAmendmentDecisionPayload = {},
  ): Promise<ApiMessageResponse> {
    const response = await api.post(
      `${BASE_URL}/${encodeURIComponent(id)}/cancel`,
      payload,
    );

    return response.data;
  },
};
