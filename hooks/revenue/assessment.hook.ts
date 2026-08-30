// hooks/revenue/assessment.hook.ts

"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  useRouter,
} from "next/navigation";

import {
  toast,
} from "sonner";

import type {
  ApiResponse,
  ListResponse,
} from "@/types/api";

import type {
  Assessment,
  AssessmentFilters,
  AssessmentSummary,
} from "@/types/revenue/assessment";

import {
  assessmentService,
} from "@/services/revenue/assessment.service";


// =====================================================
// QUERY KEYS
// =====================================================

export const assessmentKeys = {

  // ---------------------------------------------------
  // ROOT
  // ---------------------------------------------------

  all: [
    "assessments",
  ],

  // ---------------------------------------------------
  // LISTS
  // ---------------------------------------------------

  lists: () => [
    ...assessmentKeys.all,
    "list",
  ],

  list: (
    params?: AssessmentFilters,
  ) => [
    ...assessmentKeys.lists(),
    params,
  ],

  // ---------------------------------------------------
  // DETAILS
  // ---------------------------------------------------

  details: () => [
    ...assessmentKeys.all,
    "detail",
  ],

  detail: (
    id: string,
  ) => [
    ...assessmentKeys.details(),
    id,
  ],

};


// =====================================================
// GET ASSESSMENTS
// =====================================================
//
// One endpoint:
//
// GET /assessments
//
// Normal:
//
// GET /assessments
//
// Pending:
//
// GET /assessments?pending=true
//
// The backend decides the appropriate dataset.
// =====================================================

type UseAssessmentsOptions = {
  params?: AssessmentFilters;
  pending?: boolean;
};

export const useAssessments = ({
  params,
  pending = false,
}: UseAssessmentsOptions = {}) => {

  const queryParams: AssessmentFilters = {

    ...params,

    ...(pending
      ? {
          pending: true,
        }
      : {}),

  };

  return useQuery<
    ListResponse<
      Assessment,
      AssessmentSummary
    >
  >({

    queryKey:
      assessmentKeys.list(
        queryParams,
      ),

    queryFn:
      () =>
        assessmentService.getAssessments(
          queryParams,
        ),

    staleTime:
      pending
        ? 1000 * 60 * 2
        : 1000 * 60 * 5,

    placeholderData:
      (
        previousData,
      ) =>
        previousData,

  });

};


// =====================================================
// GET ASSESSMENT DETAIL
// =====================================================

export const useAssessment = (
  id: string,
  enabled = true,
) => {

  return useQuery<
    ApiResponse<Assessment>
  >({

    queryKey:
      assessmentKeys.detail(
        id,
      ),

    queryFn:
      () =>
        assessmentService.getAssessmentById(
          id,
        ),

    enabled:
      enabled &&
      !!id,

    staleTime:
      1000 * 60 * 5,

  });

};


// =====================================================
// CREATE ASSESSMENT
// =====================================================
//
// Assessment creation uses FormData because
// assessment services may contain FILE / MULTI_FILE.
// =====================================================

export const useCreateAssessment = () => {

  const router =
    useRouter();

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: (
      data: FormData,
    ) =>
      assessmentService.createAssessment(
        data,
      ),

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey:
          assessmentKeys.lists(),
      });

      toast.success(
        "Assessment created successfully",
      );

      router.push(
        "/office/dashboard/revenue/assessments",
      );

    },

  });

};


// =====================================================
// SAVE AS DRAFT
// =====================================================

export const useSaveAssessmentDraft = () => {

  const router =
    useRouter();

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: (
      data: FormData,
    ) =>
      assessmentService.saveDraft(
        data,
      ),

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey:
          assessmentKeys.lists(),
      });

      toast.success(
        "Assessment draft saved successfully",
      );

      router.push(
        "/office/dashboard/revenue/assessments",
      );

    },

  });

};


// =====================================================
// UPDATE ASSESSMENT
// =====================================================

export const useUpdateAssessment = () => {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: FormData;
    }) =>
      assessmentService.updateAssessment(
        id,
        data,
      ),

    onSuccess: (
      _response,
      variables,
    ) => {

      queryClient.invalidateQueries({
        queryKey:
          assessmentKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          assessmentKeys.detail(
            variables.id,
          ),
      });

      toast.success(
        "Assessment updated successfully",
      );

    },

  });

};


// =====================================================
// SUBMIT NEW ASSESSMENT
// =====================================================
//
// Creates a new assessment:
//
// status = PENDING_APPROVAL
// =====================================================

export const useSubmitAssessment = () => {

  const router =
    useRouter();

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: (
      data: FormData,
    ) =>
      assessmentService.submitAssessment(
        data,
      ),

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey:
          assessmentKeys.lists(),
      });

      toast.success(
        "Assessment submitted successfully",
      );

      router.push(
        "/office/dashboard/revenue/assessments",
      );

    },

  });

};


// =====================================================
// SUBMIT EXISTING DRAFT
// =====================================================
//
// DRAFT
//
// ->
//
// PENDING_APPROVAL
// =====================================================

export const useSubmitExistingAssessment = () => {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data?: FormData;
    }) =>
      assessmentService.submitExistingAssessment(
        id,
        data,
      ),

    onSuccess: (
      _response,
      variables,
    ) => {

      queryClient.invalidateQueries({
        queryKey:
          assessmentKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          assessmentKeys.detail(
            variables.id,
          ),
      });

      toast.success(
        "Assessment submitted successfully",
      );

    },

  });

};


// =====================================================
// APPROVE ASSESSMENT
// =====================================================
//
// PENDING_APPROVAL
//
// ->
//
// APPROVED
// =====================================================

export const useApproveAssessment = () => {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: (
      id: string,
    ) =>
      assessmentService.approveAssessment(
        id,
      ),

    onSuccess: (
      _response,
      id,
    ) => {

      queryClient.invalidateQueries({
        queryKey:
          assessmentKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          assessmentKeys.detail(
            id,
          ),
      });

      toast.success(
        "Assessment approved successfully",
      );

    },

  });

};


// =====================================================
// REJECT ASSESSMENT
// =====================================================
//
// PENDING_APPROVAL
//
// ->
//
// REJECTED
// =====================================================

export const useReturnAssessment = () => {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: ({
      id,
      reason,
    }: {
      id: string;
      reason: string;
    }) =>
      assessmentService.returnAssessment(
        id,
        reason,
      ),

    onSuccess: (
      _response,
      variables,
    ) => {

      queryClient.invalidateQueries({
        queryKey:
          assessmentKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          assessmentKeys.detail(
            variables.id,
          ),
      });

      toast.success(
        "Assessment rejected successfully",
      );

    },

  });

};


// =====================================================
// DELETE ASSESSMENT
// =====================================================

export const useDeleteAssessment = () => {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: (
      id: string,
    ) =>
      assessmentService.deleteAssessment(
        id,
      ),

    onSuccess: (
      _response,
      id,
    ) => {

      queryClient.invalidateQueries({
        queryKey:
          assessmentKeys.lists(),
      });

      queryClient.removeQueries({
        queryKey:
          assessmentKeys.detail(
            id,
          ),
      });

      toast.success(
        "Assessment deleted successfully",
      );

    },

  });

};