
import { api } from "@/lib/api";
import type {
  CashReconciliation,
  CashReconciliationFilters,
  CashReconciliationListResponse,
  CashReconciliationSingleResponse,
  CreateCashReconciliationPayload,
  UpdateCashReconciliationPayload,
  SubmitCashReconciliationPayload,
  ReviewCashReconciliationPayload,
} from "@/types/cash-reconciliation";

const BASE_URL = "/cash-reconciliations";

function buildQueryString(
  filters?: CashReconciliationFilters,
): string {
  if (!filters) return "";

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

export const cashReconciliationService = {
  /**
   * GET /cash-reconciliations
   */
  async getAll(
    filters?: CashReconciliationFilters,
  ): Promise<CashReconciliationListResponse> {
    const response = await api.get<CashReconciliationListResponse>(
      `${BASE_URL}${buildQueryString(filters)}`,
    );

    return response.data;
  },

  /**
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
   * POST /cash-reconciliations
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
   * POST /cash-reconciliations/{id}/submit
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
   * POST /cash-reconciliations/{id}/review
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