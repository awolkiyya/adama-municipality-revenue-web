// hooks/revenue/interestRule.hook.ts

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
import { InterestRule, InterestRuleFilters, InterestRuleHistory, InterestRulePayload } from "@/types/revenue/interestRule";
import { interestRuleService } from "@/services/revenue/interestRule.service";


// =====================================================
// QUERY KEYS
// =====================================================

export const interestRuleKeys = {

  // ---------------------------------------------------
  // ROOT
  // ---------------------------------------------------

  all: [
    "interest-rules",
  ],

  // ---------------------------------------------------
  // LISTS
  // ---------------------------------------------------

  lists: () => [
    ...interestRuleKeys.all,
    "list",
  ],

  list: (
    params?: InterestRuleFilters,
  ) => [
    ...interestRuleKeys.lists(),
    params,
  ],

  // ---------------------------------------------------
  // DETAILS
  // ---------------------------------------------------

  details: () => [
    ...interestRuleKeys.all,
    "detail",
  ],

  detail: (
    id: string,
  ) => [
    ...interestRuleKeys.details(),
    id,
  ],

  // ---------------------------------------------------
  // HISTORY
  // ---------------------------------------------------

  histories: () => [
    ...interestRuleKeys.all,
    "history",
  ],

  history: (
    id: string,
  ) => [
    ...interestRuleKeys.histories(),
    id,
  ],

  // ---------------------------------------------------
  // APPLICABLE
  // ---------------------------------------------------

  applicable: (
    effectiveDate?: string,
  ) => [
    ...interestRuleKeys.all,
    "applicable",
    effectiveDate ?? null,
  ],

};

// =====================================================
// GET INTEREST RULES
// =====================================================

export const useInterestRules = (
  params?: InterestRuleFilters,
) => {

  return useQuery<
    ListResponse<InterestRule>
  >({

    queryKey:
      interestRuleKeys.list(
        params,
      ),

    queryFn:
      () =>
        interestRuleService.getInterestRules(
          params,
        ),

    staleTime:
      1000 * 60 * 5,

    placeholderData:
      (
        previousData,
      ) =>
        previousData,

  });

};

// =====================================================
// GET INTEREST RULE DETAIL
// =====================================================

export const useInterestRule = (
  id: string,
  enabled = true,
) => {

  return useQuery<
    ApiResponse<InterestRule>
  >({

    queryKey:
      interestRuleKeys.detail(
        id,
      ),

    queryFn:
      () =>
        interestRuleService.getInterestRuleById(
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
// GET INTEREST RULE HISTORY
// =====================================================

export const useInterestRuleHistory = (
  id: string,
  enabled = true,
) => {

  return useQuery<
    ApiResponse<InterestRuleHistory[]>
  >({

    queryKey:
      interestRuleKeys.history(
        id,
      ),

    queryFn:
      () =>
        interestRuleService.getInterestRuleHistory(
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
// GET APPLICABLE INTEREST RULE
// =====================================================
//
// The backend determines which active interest rule
// applies to the requested effective date.
//
// The frontend does NOT calculate interest.
//

export const useApplicableInterestRule = (
  effectiveDate?: string,
  enabled = true,
) => {

  return useQuery<
    ApiResponse<InterestRule | null>
  >({

    queryKey:
      interestRuleKeys.applicable(
        effectiveDate,
      ),

    queryFn:
      () =>
        interestRuleService.getApplicableInterestRule(
          effectiveDate,
        ),

    enabled:
      enabled,

    staleTime:
      1000 * 60 * 5,

  });

};

// =====================================================
// CREATE INTEREST RULE
// =====================================================
//
// UI:
//
// InterestRuleFormValues
//      ↓
// interestRuleFormToPayload()
//      ↓
// InterestRulePayload
//      ↓
// useCreateInterestRule()
//      ↓
// Laravel API
//
// The frontend only sends configuration.
// Interest calculation is performed by the backend.
//

export const useCreateInterestRule = () => {

  const router =
    useRouter();

  const queryClient =
    useQueryClient();

  return useMutation<
    ApiResponse<InterestRule>,
    Error,
    InterestRulePayload
  >({

    mutationFn: (
      data: InterestRulePayload,
    ) =>
      interestRuleService.createInterestRule(
        data,
      ),

    onSuccess: () => {

      // Refresh all interest-rule lists.
      queryClient.invalidateQueries({
        queryKey:
          interestRuleKeys.lists(),
      });

      // Applicable rule may have changed.
      queryClient.invalidateQueries({
        queryKey:
          interestRuleKeys.all,
      });

      toast.success(
        "Interest rule created successfully",
      );

      router.push(
        "/office/dashboard/revenue/interest-rules",
      );

    },

  });

};

// =====================================================
// UPDATE INTEREST RULE
// =====================================================
//
// Update uses the same API payload model.
//
// Partial<InterestRulePayload> is used because an update
// may contain only the fields being changed.
//

export const useUpdateInterestRule = () => {

  const queryClient =
    useQueryClient();

  return useMutation<
    ApiResponse<InterestRule>,
    Error,
    {
      id: string;
      data: Partial<InterestRulePayload>;
    }
  >({

    mutationFn: ({
      id,
      data,
    }) =>
      interestRuleService.updateInterestRule(
        id,
        data,
      ),

    onSuccess: (
      _response,
      variables,
    ) => {

      // Refresh list.
      queryClient.invalidateQueries({
        queryKey:
          interestRuleKeys.lists(),
      });

      // Refresh detail.
      queryClient.invalidateQueries({
        queryKey:
          interestRuleKeys.detail(
            variables.id,
          ),
      });

      // Refresh history.
      queryClient.invalidateQueries({
        queryKey:
          interestRuleKeys.history(
            variables.id,
          ),
      });

      // Configuration may affect which rule
      // is applicable.
      queryClient.invalidateQueries({
        queryKey:
          interestRuleKeys.all,
      });

      toast.success(
        "Interest rule updated successfully",
      );

    },

  });

};

// =====================================================
// ACTIVATE INTEREST RULE
// =====================================================

export const useActivateInterestRule = () => {

  const queryClient =
    useQueryClient();

  return useMutation<
    ApiResponse<InterestRule>,
    Error,
    string
  >({

    mutationFn: (
      id: string,
    ) =>
      interestRuleService.activateInterestRule(
        id,
      ),

    onSuccess: (
      _response,
      id,
    ) => {

      // Refresh lists.
      queryClient.invalidateQueries({
        queryKey:
          interestRuleKeys.lists(),
      });

      // Refresh detail.
      queryClient.invalidateQueries({
        queryKey:
          interestRuleKeys.detail(
            id,
          ),
      });

      // Refresh history.
      queryClient.invalidateQueries({
        queryKey:
          interestRuleKeys.history(
            id,
          ),
      });

      // Active rule may have changed.
      queryClient.invalidateQueries({
        queryKey:
          interestRuleKeys.all,
      });

      toast.success(
        "Interest rule activated successfully",
      );

    },

  });

};

// =====================================================
// DEACTIVATE INTEREST RULE
// =====================================================

export const useDeactivateInterestRule = () => {

  const queryClient =
    useQueryClient();

  return useMutation<
    ApiResponse<InterestRule>,
    Error,
    string
  >({

    mutationFn: (
      id: string,
    ) =>
      interestRuleService.deactivateInterestRule(
        id,
      ),

    onSuccess: (
      _response,
      id,
    ) => {

      // Refresh lists.
      queryClient.invalidateQueries({
        queryKey:
          interestRuleKeys.lists(),
      });

      // Refresh detail.
      queryClient.invalidateQueries({
        queryKey:
          interestRuleKeys.detail(
            id,
          ),
      });

      // Refresh history.
      queryClient.invalidateQueries({
        queryKey:
          interestRuleKeys.history(
            id,
          ),
      });

      // Active rule may have changed.
      queryClient.invalidateQueries({
        queryKey:
          interestRuleKeys.all,
      });

      toast.success(
        "Interest rule deactivated successfully",
      );

    },

  });

};