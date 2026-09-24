// hooks/revenue/existing-lizz.hook.ts

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
  existingLizzService,
} from "@/services/revenue/existing-lizz.service";


// =====================================================
// QUERY KEYS
// =====================================================

export const existingLizzKeys = {

  // ---------------------------------------------------
  // ROOT
  // ---------------------------------------------------

  all: [
    "existing-lizz",
  ],

  // ---------------------------------------------------
  // LISTS
  // ---------------------------------------------------

  lists: () => [
    ...existingLizzKeys.all,
    "list",
  ],

  list: (
    params?: AssessmentFilters,
  ) => [
    ...existingLizzKeys.lists(),
    params,
  ],

  // ---------------------------------------------------
  // DETAILS
  // ---------------------------------------------------

  details: () => [
    ...existingLizzKeys.all,
    "detail",
  ],

  detail: (
    id: string,
  ) => [
    ...existingLizzKeys.details(),
    id,
  ],

};


// =====================================================
// GET EXISTING LIZZ
// =====================================================
//
// GET /existing-lizz
//
// Existing LIZZ records are already filtered by the
// backend. No sourceType needs to be manually added
// by the frontend.
// =====================================================

type UseExistingLizzOptions = {
  params?: AssessmentFilters;
  pending?: boolean;
};


// =====================================================
// GET EXISTING LIZZ DETAIL
// =====================================================

export const useExistingLizz = (
  id: string,
  enabled = true,
) => {

  return useQuery<
    ApiResponse<Assessment>
  >({

    queryKey:
      existingLizzKeys.detail(
        id,
      ),

    queryFn:
      () =>
        existingLizzService.getExistingLizzById(
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
// CREATE EXISTING LIZZ
// =====================================================
//
// Creates a new Existing LIZZ assessment.
//
// status:
//   DRAFT
//   PENDING_APPROVAL
//
// Uses FormData because service fields may contain
// dynamic values and FILE / MULTI_FILE fields.
// =====================================================

export const useCreateExistingLizz = () => {

  const router =
    useRouter();

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: (
      data: FormData,
    ) =>
      existingLizzService.createExistingLizz(
        data,
      ),

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey:
          existingLizzKeys.lists(),
      });

      // Also invalidate normal assessment lists because
      // Existing LIZZ records are still assessments.
      queryClient.invalidateQueries({
        queryKey:
          [
            "assessments",
            "list",
          ],
      });

      toast.success(
        "Existing LIZZ created successfully",
      );

      router.push(
        "/office/dashboard/revenue/existing-lizz",
      );

    },

  });

};


// =====================================================
// SAVE EXISTING LIZZ DRAFT
// =====================================================

export const useSaveExistingLizzDraft = () => {

  const router =
    useRouter();

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: (
      data: FormData,
    ) =>
      existingLizzService.saveDraft(
        data,
      ),

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey:
          existingLizzKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          [
            "assessments",
            "list",
          ],
      });

      toast.success(
        "Existing LIZZ draft saved successfully",
      );

      router.push(
        "/office/dashboard/revenue/existing-lizz",
      );

    },

  });

};


// =====================================================
// UPDATE EXISTING LIZZ
// =====================================================
//
// Multipart update.
//
// Laravel receives:
//
// POST /existing-lizz/{id}
//
// _method=PUT
// =====================================================

export const useUpdateExistingLizz = () => {

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
      existingLizzService.updateExistingLizz(
        id,
        data,
      ),

    onSuccess: (
      _response,
      variables,
    ) => {

      queryClient.invalidateQueries({
        queryKey:
          existingLizzKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          existingLizzKeys.detail(
            variables.id,
          ),
      });

      // Existing LIZZ is still an Assessment.
      queryClient.invalidateQueries({
        queryKey:
          [
            "assessments",
            "list",
          ],
      });

      queryClient.invalidateQueries({
        queryKey:
          [
            "assessments",
            "detail",
            variables.id,
          ],
      });

      toast.success(
        "Existing LIZZ updated successfully",
      );

    },

  });

};


// =====================================================
// SUBMIT EXISTING LIZZ
// =====================================================
//
// Creates a new Existing LIZZ record directly in:
//
// PENDING_APPROVAL
//
// This is used when the user submits the creation form.
// =====================================================

export const useSubmitExistingLizz = () => {

  const router =
    useRouter();

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: (
      data: FormData,
    ) =>
      existingLizzService.submitExistingLizz(
        data,
      ),

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey:
          existingLizzKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          [
            "assessments",
            "list",
          ],
      });

      toast.success(
        "Existing LIZZ submitted successfully",
      );

      router.push(
        "/office/dashboard/revenue/existing-lizz",
      );

    },

  });

};


// =====================================================
// SUBMIT EXISTING LIZZ DRAFT
// =====================================================
//
// DRAFT
//
//   ↓
//
// PENDING_APPROVAL
// =====================================================

export const useSubmitExistingLizzDraft = () => {

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
      existingLizzService.submitExistingLizzDraft(
        id,
        data,
      ),

    onSuccess: (
      _response,
      variables,
    ) => {

      queryClient.invalidateQueries({
        queryKey:
          existingLizzKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          existingLizzKeys.detail(
            variables.id,
          ),
      });

      queryClient.invalidateQueries({
        queryKey:
          [
            "assessments",
            "list",
          ],
      });

      queryClient.invalidateQueries({
        queryKey:
          [
            "assessments",
            "detail",
            variables.id,
          ],
      });

      toast.success(
        "Existing LIZZ submitted successfully",
      );

    },

  });

};


// =====================================================
// APPROVE EXISTING LIZZ
// =====================================================
//
// PENDING_APPROVAL
//
//      ↓
//
// APPROVED
//
// Approval uses the common Assessment workflow because
// Existing LIZZ is an Assessment with:
//
// sourceType = EXISTING_LIZZ
//
// Backend:
//
// PATCH /assessments/{id}/approve
// =====================================================

export const useApproveExistingLizz = () => {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: (
      id: string,
    ) =>
      existingLizzService.approveExistingLizz(
        id,
      ),

    onSuccess: (
      _response,
      id,
    ) => {

      queryClient.invalidateQueries({
        queryKey:
          existingLizzKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          existingLizzKeys.detail(
            id,
          ),
      });

      queryClient.invalidateQueries({
        queryKey:
          [
            "assessments",
            "list",
          ],
      });

      queryClient.invalidateQueries({
        queryKey:
          [
            "assessments",
            "detail",
            id,
          ],
      });

      toast.success(
        "Existing LIZZ approved successfully",
      );

    },

  });

};


// =====================================================
// RETURN EXISTING LIZZ
// =====================================================
//
// PENDING_APPROVAL
//
//      ↓
//
// RETURNED
//
// The user can correct the record and submit it again.
// =====================================================

export const useReturnExistingLizz = () => {

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
      existingLizzService.returnExistingLizz(
        id,
        reason,
      ),

    onSuccess: (
      _response,
      variables,
    ) => {

      queryClient.invalidateQueries({
        queryKey:
          existingLizzKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          existingLizzKeys.detail(
            variables.id,
          ),
      });

      queryClient.invalidateQueries({
        queryKey:
          [
            "assessments",
            "list",
          ],
      });

      queryClient.invalidateQueries({
        queryKey:
          [
            "assessments",
            "detail",
            variables.id,
          ],
      });

      toast.success(
        "Existing LIZZ returned successfully",
      );

    },

  });

};
