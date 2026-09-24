import { api } from "@/lib/api";
import { normalizeApiError } from "@/lib/api-error";

import {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import {
  Assessment,
  AssessmentFilters,
  AssessmentSummary,
} from "@/types/revenue/assessment";

// =====================================================
// EXISTING LIZZ SERVICE
// =====================================================

const cleanExistingLizzParams = (
  params?: AssessmentFilters,
): Record<string, unknown> => {

  return Object.entries(
    params ?? {},
  ).reduce(
    (
      acc,
      [key, value],
    ) => {

      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "ALL"
      ) {
        acc[key] = value;
      }

      return acc;
    },
    {} as Record<string, unknown>,
  );
};

export const existingLizzService = {

  // ===================================================
  // GET ALL EXISTING LIZZ
  // ===================================================
  //
  // GET /existing-lizz
  //
  // The backend returns only assessments where:
  //
  // source_type = EXISTING_LIZZ
  //
  // ===================================================

  getExistingLizz: async (
    params?: AssessmentFilters,
  ): Promise<
    ListResponse<
      Assessment,
      AssessmentSummary
    >
  > => {

    try {

      const res =
        await api.get<
          ListResponse<
            Assessment,
            AssessmentSummary
          >
        >(
          "/existing-lizz",
          {
            params:
              cleanExistingLizzParams(
                params,
              ),
          },
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // GET EXISTING LIZZ DETAIL
  // ===================================================

  getExistingLizzById: async (
    id: string,
  ): Promise<
    ApiResponse<Assessment>
  > => {

    try {

      const res =
        await api.get<
          ApiResponse<Assessment>
        >(
          `/existing-lizz/${id}`,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // CREATE EXISTING LIZZ
  // ===================================================
  //
  // Existing LIZZ uses FormData because service fields
  // may contain dynamic values and FILE / MULTI_FILE.
  //
  // Top-level financial fields:
  //
  // computedAmount
  // paidAmount
  //
  // remainingAmount is calculated by the backend.
  //
  // status:
  //
  // DRAFT
  // PENDING_APPROVAL
  //
  // ===================================================

  createExistingLizz: async (
    data: FormData,
  ): Promise<
    ApiResponse<Assessment>
  > => {

    try {

      const res =
        await api.post<
          ApiResponse<Assessment>
        >(
          "/existing-lizz",
          data,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // UPDATE EXISTING LIZZ
  // ===================================================
  //
  // Multipart update.
  //
  // Laravel receives:
  //
  // POST /existing-lizz/{id}
  //
  // _method=PUT
  //
  // ===================================================

  updateExistingLizz: async (
    id: string,
    data: FormData,
  ): Promise<
    ApiResponse<Assessment>
  > => {

    try {

      if (
        !data.has("_method")
      ) {
        data.append(
          "_method",
          "PUT",
        );
      }

      const res =
        await api.post<
          ApiResponse<Assessment>
        >(
          `/existing-lizz/${id}`,
          data,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // SAVE EXISTING LIZZ DRAFT
  // ===================================================
  //
  // Creates a new Existing LIZZ assessment with:
  //
  // status = DRAFT
  //
  // ===================================================

  saveDraft: async (
    data: FormData,
  ): Promise<
    ApiResponse<Assessment>
  > => {

    try {

      if (
        !data.has("status")
      ) {
        data.append(
          "status",
          "DRAFT",
        );
      }

      const res =
        await api.post<
          ApiResponse<Assessment>
        >(
          "/existing-lizz",
          data,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // SUBMIT EXISTING LIZZ
  // ===================================================
  //
  // Creates a new Existing LIZZ assessment with:
  //
  // status = PENDING_APPROVAL
  //
  // ===================================================

  submitExistingLizz: async (
    data: FormData,
  ): Promise<
    ApiResponse<Assessment>
  > => {

    try {

      data.set(
        "status",
        "PENDING_APPROVAL",
      );

      const res =
        await api.post<
          ApiResponse<Assessment>
        >(
          "/existing-lizz",
          data,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // SUBMIT EXISTING LIZZ DRAFT
  // ===================================================
  //
  // Existing workflow:
  //
  // DRAFT
  //   ↓
  // PENDING_APPROVAL
  //
  // ===================================================

  submitExistingLizzDraft: async (
    id: string,
    data?: FormData,
  ): Promise<
    ApiResponse<Assessment>
  > => {

    try {

      const formData =
        data ??
        new FormData();

      formData.set(
        "status",
        "PENDING_APPROVAL",
      );

      if (
        !formData.has("_method")
      ) {
        formData.append(
          "_method",
          "PUT",
        );
      }

      const res =
        await api.post<
          ApiResponse<Assessment>
        >(
          `/existing-lizz/${id}`,
          formData,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // APPROVE EXISTING LIZZ
  // ===================================================
  //
  // Approval is handled by the common Assessment
  // workflow because Existing LIZZ is still an
  // Assessment with:
  //
  // sourceType = EXISTING_LIZZ
  //
  // Backend:
  //
  // PATCH /assessments/{id}/approve
  //
  // On approval, the backend handles:
  //
  // 1. Assessment approval
  // 2. Payment schedule creation
  // 3. Invoice creation
  // 4. Invoice issuance
  //
  // ===================================================

  approveExistingLizz: async (
    id: string,
  ): Promise<
    ApiResponse<Assessment>
  > => {

    try {

      const res =
        await api.patch<
          ApiResponse<Assessment>
        >(
          `/assessments/${id}/approve`,
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },


  // ===================================================
  // RETURN EXISTING LIZZ
  // ===================================================
  //
  // PENDING_APPROVAL
  //        ↓
  //     RETURNED
  //
  // The record can then be corrected and submitted
  // again.
  //
  // Backend:
  //
  // PATCH /assessments/{id}/return
  //
  // ===================================================

  returnExistingLizz: async (
    id: string,
    reason: string,
  ): Promise<
    ApiResponse<Assessment>
  > => {

    try {

      const res =
        await api.patch<
          ApiResponse<Assessment>
        >(
          `/assessments/${id}/return`,
          {
            reason,
          },
        );

      return res.data;

    } catch (error) {

      throw normalizeApiError(
        error,
      );
    }
  },

};
