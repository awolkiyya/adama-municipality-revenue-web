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
// ASSESSMENT SERVICE
// =====================================================

const cleanAssessmentParams = (
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

export const assessmentService = {

  // ===================================================
  // GET ALL ASSESSMENTS
  // ===================================================

  getAssessments: async (
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
          "/assessments",
          {
            params:
              cleanAssessmentParams(
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
  // GET ASSESSMENT DETAIL
  // ===================================================

  getAssessmentById: async (
    id: string,
  ): Promise<
    ApiResponse<Assessment>
  > => {
    try {
      const res =
        await api.get<
          ApiResponse<Assessment>
        >(
          `/assessments/${id}`,
        );

      return res.data;

    } catch (error) {
      throw normalizeApiError(
        error,
      );
    }
  },

  // ===================================================
  // CREATE ASSESSMENT
  // ===================================================

  createAssessment: async (
    data: FormData,
  ): Promise<
    ApiResponse<Assessment>
  > => {
    try {
      const res =
        await api.post<
          ApiResponse<Assessment>
        >(
          "/assessments",
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
  // UPDATE ASSESSMENT
  // ===================================================
  //
  // Multipart update.
  //
  // Laravel receives:
  //
  // POST /assessments/{id}
  //
  // _method=PUT
  //
  // ===================================================

  updateAssessment: async (
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
          `/assessments/${id}`,
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
  // SAVE DRAFT
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
          "/assessments",
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
  // SUBMIT NEW ASSESSMENT
  // ===================================================

  submitAssessment: async (
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
          "PENDING_APPROVAL",
        );
      }

      const res =
        await api.post<
          ApiResponse<Assessment>
        >(
          "/assessments",
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
  // SUBMIT EXISTING DRAFT
  // ===================================================

  submitExistingAssessment: async (
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
          `/assessments/${id}`,
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
  // APPROVE ASSESSMENT
  // ===================================================

  approveAssessment: async (
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
  // return ASSESSMENT
  // ===================================================

  returnAssessment: async (
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

  // ===================================================
  // DELETE ASSESSMENT
  // ===================================================

  deleteAssessment: async (
    id: string,
  ): Promise<
    ApiResponse<null>
  > => {
    try {

      const res =
        await api.delete<
          ApiResponse<null>
        >(
          `/assessments/${id}`,
        );

      return res.data;

    } catch (error) {
      throw normalizeApiError(
        error,
      );
    }
  },

};