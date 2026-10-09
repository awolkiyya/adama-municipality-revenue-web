// services/lease-amendment.service.ts

import { api } from "@/lib/api";
import { PaginatedResponse } from "@/types/api";
import { ApiMessageResponse, CreateLeaseAmendmentPayload, LeaseAmendment, LeaseAmendmentDecisionPayload, LeaseAmendmentFilters, LeaseAmendmentSummary, RejectLeaseAmendmentPayload, UpdateLeaseAmendmentPayload } from "@/types/assessment/lease-amendment";



const BASE_URL = "/lease-amendments";

export const leaseAmendmentService = {
  async getAll(
    filters: LeaseAmendmentFilters = {},
  ): Promise<PaginatedResponse<LeaseAmendment,LeaseAmendmentSummary>> {
    const response = await api.get(BASE_URL, {
      params: filters,
    });

    return response.data;
  },

  async getById(id: string): Promise<LeaseAmendment> {
    const response = await api.get(
      `${BASE_URL}/${encodeURIComponent(id)}`,
    );

    return response.data.data ?? response.data;
  },

  async create(
    payload: CreateLeaseAmendmentPayload,
  ): Promise<LeaseAmendment> {
    const response = await api.post(BASE_URL, payload);

    return response.data.data ?? response.data;
  },

  async update(
    id: string,
    payload: UpdateLeaseAmendmentPayload,
  ): Promise<LeaseAmendment> {
    const response = await api.put(
      `${BASE_URL}/${encodeURIComponent(id)}`,
      payload,
    );

    return response.data.data ?? response.data;
  },

  async submit(id: string): Promise<ApiMessageResponse> {
    const response = await api.post(
      `${BASE_URL}/${encodeURIComponent(id)}/submit`,
    );

    return response.data;
  },

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

  async apply(id: string): Promise<ApiMessageResponse> {
    const response = await api.post(
      `${BASE_URL}/${encodeURIComponent(id)}/apply`,
    );

    return response.data;
  },

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