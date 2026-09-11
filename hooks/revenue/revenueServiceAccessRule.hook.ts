import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  serviceAccessRuleService,
} from "@/services/revenue/serviceAccessRule.service";

import {
  ServiceAccessRule,
  ServiceAccessRuleSummary,
  UpdateServiceAccessRequestPayload,
  UpdateServiceAccessRulePayload,
} from "@/types/revenue/service-access-rule";

import {
  ListResponse,
} from "@/types/api";

import {
  toast,
} from "sonner";

/* =========================================================
   GET ALL SERVICE ACCESS RULES
========================================================= */

export const useServiceAccessRules = (
  serviceId: string,
  params?: {
    sector_id?: string;
    is_active?: boolean;
    page?: number;
    per_page?: number;
  }
) => {
  return useQuery<
    ListResponse<
      ServiceAccessRule,
      ServiceAccessRuleSummary
    >
  >({
    queryKey: [
      "service-access-rules",
      serviceId,
      params,
    ],

    queryFn: () =>
      serviceAccessRuleService.getRules(
        serviceId,
        params
      ),

    enabled: !!serviceId,

    staleTime: 1000 * 60 * 2,

    placeholderData: (previousData) =>
      previousData,
  });
};

/* =========================================================
   GET SINGLE RULE
========================================================= */

export const useServiceAccessRule = (
  serviceId: string,
  ruleId: string,
  enabled = true
) => {
  return useQuery({
    queryKey: [
      "service-access-rule",
      serviceId,
      ruleId,
    ],

    queryFn: () =>
      serviceAccessRuleService.getRuleById(
        serviceId,
        ruleId
      ),

    enabled:
      enabled &&
      !!serviceId &&
      !!ruleId,

    staleTime: 1000 * 60 * 2,
  });
};

/* =========================================================
   SYNC ALL SECTOR ACCESS
========================================================= */

/**
 * Synchronize all sector access rules for a service.
 *
 * Backend:
 *
 * PUT /revenue/services/{serviceId}/access-rules
 *
 * Payload:
 *
 * {
 *   sectors: [
 *     {
 *       sectorId: string;
 *       sectorName?: string;
 *       isActive: boolean;
 *     }
 *   ]
 * }
 */
export const useSyncServiceAccessRules = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      serviceId,
      data,
    }: {
      serviceId: string;
      data: UpdateServiceAccessRequestPayload;
    }) =>
      serviceAccessRuleService.syncRules(
        serviceId,
        data
      ),

    onSuccess: (_, variables) => {
      /* -----------------------------------------------
         Refresh service access rules
      ------------------------------------------------ */

      queryClient.invalidateQueries({
        queryKey: [
          "service-access-rules",
          variables.serviceId,
        ],
      });

      /* -----------------------------------------------
         Refresh individual rules if currently cached
      ------------------------------------------------ */

      queryClient.invalidateQueries({
        queryKey: [
          "service-access-rule",
          variables.serviceId,
        ],
      });

      toast.success(
        "Service access rules updated successfully"
      );
    },
  });
};

/* =========================================================
   UPDATE SINGLE RULE
========================================================= */

/**
 * Update one existing access rule.
 *
 * Backend:
 *
 * PATCH /revenue/services/{serviceId}/access-rules/{ruleId}
 */
export const useUpdateServiceAccessRule = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      serviceId,
      ruleId,
      data,
    }: {
      serviceId: string;
      ruleId: string;
      data: UpdateServiceAccessRulePayload;
    }) =>
      serviceAccessRuleService.updateRule(
        serviceId,
        ruleId,
        data
      ),

    onSuccess: (_, variables) => {
      /* -----------------------------------------------
         Refresh list
      ------------------------------------------------ */

      queryClient.invalidateQueries({
        queryKey: [
          "service-access-rules",
          variables.serviceId,
        ],
      });

      /* -----------------------------------------------
         Refresh single rule
      ------------------------------------------------ */

      queryClient.invalidateQueries({
        queryKey: [
          "service-access-rule",
          variables.serviceId,
          variables.ruleId,
        ],
      });

      toast.success(
        "Service access rule updated successfully"
      );
    },
  });
};

/* =========================================================
   ACTIVATE RULE
========================================================= */

/**
 * Activate one access rule.
 *
 * Backend:
 *
 * PATCH /revenue/services/{serviceId}/access-rules/{ruleId}/status
 *
 * Payload:
 *
 * {
 *   is_active: true
 * }
 */
export const useActivateServiceAccessRule = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      serviceId,
      ruleId,
    }: {
      serviceId: string;
      ruleId: string;
    }) =>
      serviceAccessRuleService.activateRule(
        serviceId,
        ruleId
      ),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "service-access-rules",
          variables.serviceId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "service-access-rule",
          variables.serviceId,
          variables.ruleId,
        ],
      });

      toast.success(
        "Sector access allowed successfully"
      );
    },
  });
};

/* =========================================================
   DEACTIVATE RULE
========================================================= */

/**
 * Deactivate one access rule.
 *
 * Backend:
 *
 * PATCH /revenue/services/{serviceId}/access-rules/{ruleId}/status
 *
 * Payload:
 *
 * {
 *   is_active: false
 * }
 */
export const useDeactivateServiceAccessRule = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      serviceId,
      ruleId,
    }: {
      serviceId: string;
      ruleId: string;
    }) =>
      serviceAccessRuleService.deactivateRule(
        serviceId,
        ruleId
      ),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "service-access-rules",
          variables.serviceId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "service-access-rule",
          variables.serviceId,
          variables.ruleId,
        ],
      });

      toast.success(
        "Sector access disabled successfully"
      );
    },
  });
};