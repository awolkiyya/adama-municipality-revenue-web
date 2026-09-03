// hooks/revenue/penaltyRule.hook.ts

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
import { PenaltyRule, PenaltyRuleFilters, PenaltyRuleHistory } from "@/types/revenue/penality.";
import { penaltyRuleService } from "@/services/revenue/penaltyRuleService";



// =====================================================
// QUERY KEYS
// =====================================================

export const penaltyRuleKeys = {

  // ---------------------------------------------------
  // ROOT
  // ---------------------------------------------------

  all: [
    "penalty-rules",
  ],

  // ---------------------------------------------------
  // LISTS
  // ---------------------------------------------------

  lists: () => [
    ...penaltyRuleKeys.all,
    "list",
  ],

  list: (
    params?: PenaltyRuleFilters,
  ) => [
    ...penaltyRuleKeys.lists(),
    params,
  ],

  // ---------------------------------------------------
  // DETAILS
  // ---------------------------------------------------

  details: () => [
    ...penaltyRuleKeys.all,
    "detail",
  ],

  detail: (
    id: string,
  ) => [
    ...penaltyRuleKeys.details(),
    id,
  ],

  // ---------------------------------------------------
  // HISTORY
  // ---------------------------------------------------

  histories: () => [
    ...penaltyRuleKeys.all,
    "history",
  ],

  history: (
    id: string,
  ) => [
    ...penaltyRuleKeys.histories(),
    id,
  ],

};


// =====================================================
// GET PENALTY RULES
// =====================================================
//
// GET /revenue/penalty-rules
//
// Supports:
//
// - search
// - revenue_service_id
// - scope
// - is_active
// - calculation_type
// - sorting
// - pagination
// =====================================================

export const usePenaltyRules = (
  params?: PenaltyRuleFilters,
) => {

  return useQuery<
    ListResponse<PenaltyRule>
  >({

    queryKey:
      penaltyRuleKeys.list(
        params,
      ),

    queryFn:
      () =>
        penaltyRuleService.getPenaltyRules(
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
// GET PENALTY RULE DETAIL
// =====================================================

export const usePenaltyRule = (
  id: string,
  enabled = true,
) => {

  return useQuery<
    ApiResponse<PenaltyRule>
  >({

    queryKey:
      penaltyRuleKeys.detail(
        id,
      ),

    queryFn:
      () =>
        penaltyRuleService.getPenaltyRuleById(
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
// GET PENALTY RULE HISTORY
// =====================================================

export const usePenaltyRuleHistory = (
  id: string,
  enabled = true,
) => {

  return useQuery<
    ApiResponse<PenaltyRuleHistory[]>
  >({

    queryKey:
      penaltyRuleKeys.history(
        id,
      ),

    queryFn:
      () =>
        penaltyRuleService.getPenaltyRuleHistory(
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
// CREATE PENALTY RULE
// =====================================================
//
// Creates either:
//
// GLOBAL rule
//
// revenue_service_id = null
//
// OR
//
// SERVICE-SPECIFIC rule
//
// revenue_service_id = UUID
// =====================================================

export const useCreatePenaltyRule = () => {

  const router =
    useRouter();

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: (
      data: Partial<PenaltyRule>,
    ) =>
      penaltyRuleService.createPenaltyRule(
        data,
      ),

    onSuccess: () => {

      queryClient.invalidateQueries({
        queryKey:
          penaltyRuleKeys.lists(),
      });

      toast.success(
        "Penalty rule created successfully",
      );

      router.push(
        "/office/dashboard/revenue/penalty-rules",
      );

    },

  });

};


// =====================================================
// UPDATE PENALTY RULE
// =====================================================

export const useUpdatePenaltyRule = () => {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<PenaltyRule>;
    }) =>
      penaltyRuleService.updatePenaltyRule(
        id,
        data,
      ),

    onSuccess: (
      _response,
      variables,
    ) => {

      queryClient.invalidateQueries({
        queryKey:
          penaltyRuleKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          penaltyRuleKeys.detail(
            variables.id,
          ),
      });

      queryClient.invalidateQueries({
        queryKey:
          penaltyRuleKeys.history(
            variables.id,
          ),
      });

      toast.success(
        "Penalty rule updated successfully",
      );

    },

  });

};


// =====================================================
// ACTIVATE PENALTY RULE
// =====================================================
//
// INACTIVE
//
// ->
//
// ACTIVE
// =====================================================

export const useActivatePenaltyRule = () => {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: (
      id: string,
    ) =>
      penaltyRuleService.activatePenaltyRule(
        id,
      ),

    onSuccess: (
      _response,
      id,
    ) => {

      queryClient.invalidateQueries({
        queryKey:
          penaltyRuleKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          penaltyRuleKeys.detail(
            id,
          ),
      });

      queryClient.invalidateQueries({
        queryKey:
          penaltyRuleKeys.history(
            id,
          ),
      });

      toast.success(
        "Penalty rule activated successfully",
      );

    },

  });

};


// =====================================================
// DEACTIVATE PENALTY RULE
// =====================================================
//
// ACTIVE
//
// ->
//
// INACTIVE
// =====================================================

export const useDeactivatePenaltyRule = () => {

  const queryClient =
    useQueryClient();

  return useMutation({

    mutationFn: (
      id: string,
    ) =>
      penaltyRuleService.deactivatePenaltyRule(
        id,
      ),

    onSuccess: (
      _response,
      id,
    ) => {

      queryClient.invalidateQueries({
        queryKey:
          penaltyRuleKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          penaltyRuleKeys.detail(
            id,
          ),
      });

      queryClient.invalidateQueries({
        queryKey:
          penaltyRuleKeys.history(
            id,
          ),
      });

      toast.success(
        "Penalty rule deactivated successfully",
      );

    },

  });

};