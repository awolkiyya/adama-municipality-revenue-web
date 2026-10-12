import { api } from "@/lib/api";

import type {
  CashReconciliation,
  CashReconciliationFilters,
  CashReconciliationListResponse,
  CreateCashReconciliationPayload,
  UpdateCashReconciliationPayload,
  SubmitCashReconciliationPayload,
  ReviewCashReconciliationPayload,
  CashReconciliationSingleResponse,
} from "@/types/cash-reconciliation";

const BASE_URL = "/cash-reconciliations";

// ============================================================
// QUERY STRING
// ============================================================

function buildQueryString(
  filters?: CashReconciliationFilters,
): string {
  if (!filters) {
    return "";
  }

  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      params.set(key, String(value));
    }
  });

  const query = params.toString();

  return query ? `?${query}` : "";
}

// ============================================================
// SERVICE
// ============================================================

export const cashReconciliationService = {
  /**
   * List cash reconciliations.
   *
   * GET /cash-reconciliations
   *
   * Supports pagination, status filtering, collector filtering,
   * period filtering, and sorting.
   */
  async getAll(
    filters?: CashReconciliationFilters,
  ): Promise<CashReconciliationListResponse> {
    const response =
      await api.get<CashReconciliationListResponse>(
        `${BASE_URL}${buildQueryString(filters)}`,
      );

    return response.data;
  },

  /**
   * Retrieve one reconciliation.
   *
   * GET /cash-reconciliations/{id}
   */
  async getById(
    id: number,
  ): Promise<CashReconciliation> {
    const response =
      await api.get<CashReconciliationSingleResponse>(
        `${BASE_URL}/${id}`,
      );

    return response.data.data;
  },

  /**
   * Create a draft reconciliation.
   *
   * POST /cash-reconciliations
   *
   * The backend assigns the collector from the authenticated
   * user and initializes the financial totals.
   */
  async create(
    payload: CreateCashReconciliationPayload,
  ): Promise<CashReconciliation> {
    const response =
      await api.post<CashReconciliationSingleResponse>(
        BASE_URL,
        payload,
      );

    return response.data.data;
  },

  /**
   * Update an editable draft or returned reconciliation.
   *
   * PUT /cash-reconciliations/{id}
   */
  async update(
    id: number,
    payload: UpdateCashReconciliationPayload,
  ): Promise<CashReconciliation> {
    const response =
      await api.put<CashReconciliationSingleResponse>(
        `${BASE_URL}/${id}`,
        payload,
      );

    return response.data.data;
  },

  /**
   * Submit the physical cash count for finance review.
   *
   * POST /cash-reconciliations/{id}/submit
   *
   * The backend calculates expected cash and the difference.
   */
  async submit(
    id: number,
    payload: SubmitCashReconciliationPayload,
  ): Promise<CashReconciliation> {
    const response =
      await api.post<CashReconciliationSingleResponse>(
        `${BASE_URL}/${id}/submit`,
        payload,
      );

    return response.data.data;
  },

  /**
   * Review a submitted reconciliation.
   *
   * POST /cash-reconciliations/{id}/review
   *
   * Decisions:
   * - RECONCILED
   * - DISCREPANCY
   * - RETURNED
   */
  async review(
    id: number,
    payload: ReviewCashReconciliationPayload,
  ): Promise<CashReconciliation> {
    const response =
      await api.post<CashReconciliationSingleResponse>(
        `${BASE_URL}/${id}/review`,
        payload,
      );

    return response.data.data;
  },

  /**
   * Cancel an eligible draft or returned reconciliation.
   *
   * POST /cash-reconciliations/{id}/cancel
   */
  async cancel(
    id: number,
  ): Promise<CashReconciliation> {
    const response =
      await api.post<CashReconciliationSingleResponse>(
        `${BASE_URL}/${id}/cancel`,
      );

    return response.data.data;
  },
};
