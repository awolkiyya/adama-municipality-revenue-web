
"use client";

import {
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { agentPaymentService } from "@/services/agent/agent-payment.service";
import { AgentPaymentDashboard, AgentPaymentFilters, AgentPaymentPage, AgentPaymentSummary, AgentPaymentTodaySummary } from "@/types/payment/agent-payment";



// ============================================================
// QUERY KEYS
// ============================================================

export const agentPaymentKeys = {
  all: ["agent-payments"] as const,

  lists: () =>
    [...agentPaymentKeys.all, "list"] as const,

  list: (filters: AgentPaymentFilters) =>
    [...agentPaymentKeys.lists(), filters] as const,

  dashboards: () =>
    [...agentPaymentKeys.all, "dashboard"] as const,

  dashboard: (recentLimit: number) =>
    [...agentPaymentKeys.dashboards(), recentLimit] as const,

  summaries: () =>
    [...agentPaymentKeys.all, "summary"] as const,

  summary: () =>
    [...agentPaymentKeys.summaries(), "overall"] as const,

  todaySummary: () =>
    [...agentPaymentKeys.summaries(), "today"] as const,
};

type AgentQueryOptions<T> = Omit<
  UseQueryOptions<T, Error>,
  "queryKey" | "queryFn"
>;

// ============================================================
// PAYMENT HISTORY
// ============================================================

export function useAgentPayments(
  filters: AgentPaymentFilters = {},
  options?: AgentQueryOptions<AgentPaymentPage>,
) {
  return useQuery({
    queryKey: agentPaymentKeys.list(filters),
    queryFn: () => agentPaymentService.getPayments(filters),
    staleTime: 30_000,
    ...options,
  });
}

// ============================================================
// DASHBOARD
// ============================================================

export function useAgentPaymentDashboard(
  recentLimit = 5,
  options?: AgentQueryOptions<AgentPaymentDashboard>,
) {
  return useQuery({
    queryKey: agentPaymentKeys.dashboard(recentLimit),
    queryFn: () => agentPaymentService.getDashboard(recentLimit),
    staleTime: 30_000,
    ...options,
  });
}

// ============================================================
// OVERALL SUMMARY
// ============================================================

export function useAgentPaymentSummary(
  options?: AgentQueryOptions<AgentPaymentSummary>,
) {
  return useQuery({
    queryKey: agentPaymentKeys.summary(),
    queryFn: () => agentPaymentService.getSummary(),
    staleTime: 60_000,
    ...options,
  });
}

// ============================================================
// TODAY SUMMARY
// ============================================================

export function useAgentPaymentTodaySummary(
  options?: AgentQueryOptions<AgentPaymentTodaySummary>,
) {
  return useQuery({
    queryKey: agentPaymentKeys.todaySummary(),
    queryFn: () => agentPaymentService.getTodaySummary(),
    staleTime: 30_000,
    ...options,
  });
}