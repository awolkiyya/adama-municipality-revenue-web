
import { api } from "@/lib/api";
import { PaginatedResponse } from "@/types/api";

import type {
  CashReconciliation,
  CashReconciliationFilters,
  CashReconciliationListResponse,
  CreateCashReconciliationPayload,
  UpdateCashReconciliationPayload,
  SubmitCashReconciliationPayload,
  ReviewCashReconciliationPayload,
  CashReconciliationSingleResponse,
  ExpectedByCollectorFilters,
  ExpectedCashCollector,
  ExpectedCashTotals,
} from "@/types/cash-reconciliation";

const BASE_URL = "/cash-reconciliations";

// ============================================================
// QUERY STRING
// ============================================================


function buildQueryString<T extends object>(
  filters?: T,
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
// MULTIPART FORM DATA
// ============================================================

/**
 * Build multipart data for creating or updating a draft.
 *
 * Supported fields:
 * - Reconciliation payload fields
 * - evidence[]: newly uploaded evidence files
 * - remove_evidence_ids[]: UUIDs of existing evidence to remove
 *
 * Existing evidence is preserved unless its ID is explicitly
 * included in removeEvidenceIds.
 */
function buildDraftFormData(
  payload:
    | CreateCashReconciliationPayload
    | UpdateCashReconciliationPayload,
  files: File[] = [],
  removeEvidenceIds: string[] = [],
): FormData {
  const formData = new FormData();

  // Append reconciliation fields.
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (
      typeof File !== "undefined" &&
      value instanceof File
    ) {
      formData.append(key, value);
      return;
    }

    if (
      typeof Blob !== "undefined" &&
      value instanceof Blob
    ) {
      formData.append(key, value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          formData.append(
            `${key}[]`,
            typeof item === "object"
              ? JSON.stringify(item)
              : String(item),
          );
        }
      });

      return;
    }

    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, String(value));
  });

  // Append newly selected evidence files.
  files.forEach((file) => {
    formData.append("evidence[]", file);
  });

  // Append UUIDs of existing evidence selected for removal.
  removeEvidenceIds.forEach((id) => {
    if (id.trim() !== "") {
      formData.append("remove_evidence_ids[]", id);
    }
  });

  return formData;
}

// ============================================================
// SERVICE
// ============================================================

export const cashReconciliationService = {
  /**
   * List cash reconciliations.
   *
   * GET /cash-reconciliations
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
   * Retrieve one reconciliation using its UUID.
   *
   * GET /cash-reconciliations/{id}
   */
  async getById(
    id: string,
  ): Promise<CashReconciliation> {
    const response =
      await api.get<CashReconciliationSingleResponse>(
        `${BASE_URL}/${encodeURIComponent(id)}`,
      );

    return response.data.data;
  },

  /**
   * Create a draft reconciliation together with evidence files.
   *
   * POST /cash-reconciliations
   *
   * Content type: multipart/form-data
   */
  async create(
    payload: CreateCashReconciliationPayload,
    files: File[] = [],
  ): Promise<CashReconciliation> {
    const formData = buildDraftFormData(
      payload,
      files,
    );

    const response =
      await api.post<CashReconciliationSingleResponse>(
        BASE_URL,
        formData,
      );

    return response.data.data;
  },

  /**
   * Update an editable draft or returned reconciliation.
   *
   * PUT /cash-reconciliations/{id}
   *
   * Content type: multipart/form-data
   */
  async update(
    id: string,
    payload: UpdateCashReconciliationPayload,
    files: File[] = [],
    removeEvidenceIds: string[] = [],
  ): Promise<CashReconciliation> {
    const formData = buildDraftFormData(
      payload,
      files,
      removeEvidenceIds,
    );

    // Laravel multipart method spoofing.
    formData.append("_method", "PUT");

    const response =
      await api.post<CashReconciliationSingleResponse>(
        `${BASE_URL}/${encodeURIComponent(id)}`,
        formData,
      );

    return response.data.data;
  },

  /**
   * Delete an unsubmitted DRAFT reconciliation.
   *
   * DELETE /cash-reconciliations/{id}
   *
   * The backend must verify:
   * - The authenticated user owns the reconciliation.
   * - The reconciliation status is DRAFT.
   * - The reconciliation has not been submitted.
   */
  async deleteDraft(
    id: string,
  ): Promise<void> {
    await api.delete(
      `${BASE_URL}/${encodeURIComponent(id)}`,
    );
  },

  /**
   * Submit the physical cash count for finance review.
   *
   * POST /cash-reconciliations/{id}/submit
   */
  async submit(
    id: string,
    payload: SubmitCashReconciliationPayload,
  ): Promise<CashReconciliation> {
    const response =
      await api.post<CashReconciliationSingleResponse>(
        `${BASE_URL}/${encodeURIComponent(id)}/submit`,
        payload,
      );

    return response.data.data;
  },

  /**
   * Review a submitted reconciliation.
   *
   * POST /cash-reconciliations/{id}/review
   */
  async review(
    id: string,
    payload: ReviewCashReconciliationPayload,
  ): Promise<CashReconciliation> {
    const response =
      await api.post<CashReconciliationSingleResponse>(
        `${BASE_URL}/${encodeURIComponent(id)}/review`,
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
    id: string,
  ): Promise<CashReconciliation> {
    const response =
      await api.post<CashReconciliationSingleResponse>(
        `${BASE_URL}/${encodeURIComponent(id)}/cancel`,
      );

    return response.data.data;
  },



  /**
   * Get expected, reconciled, and outstanding cash grouped
   * by revenue collector.
   *
   * GET /cash-reconciliations/expected-by-collector
   *
   * Supports:
   * - Date range filtering
   * - Collector name/email search
   * - Sorting by expected, reconciled, or outstanding cash
   * - Pagination
   *
   * Aggregate totals are returned in meta.summary.
   */
  async expectedByCollector(
    filters?: ExpectedByCollectorFilters,
  ): Promise<PaginatedResponse<ExpectedCashCollector,ExpectedCashTotals>> {
    const response =
      await api.get<PaginatedResponse<ExpectedCashCollector,ExpectedCashTotals>>(
        `${BASE_URL}/expected-by-collector${buildQueryString(filters)}`,
      );

    return response.data;
  },

};
