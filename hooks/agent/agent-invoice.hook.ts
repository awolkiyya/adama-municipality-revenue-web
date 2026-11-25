import { useQuery } from "@tanstack/react-query";


import type {
  AgentPendingInvoiceFilters,
} from "@/types/agent/agent-invoice";
import { agentInvoiceService } from "@/services/agent/agent-invoice.service";

export const agentInvoiceKeys = {
  all: ["agent-invoices"] as const,

  pending: (
    filters: AgentPendingInvoiceFilters,
  ) =>
    [
      ...agentInvoiceKeys.all,
      "pending",
      filters,
    ] as const,
};

export function useAgentPendingInvoices(
  filters: AgentPendingInvoiceFilters = {},
  options?: { enabled?: boolean },

) {
  return useQuery({
    queryKey:
      agentInvoiceKeys.pending(filters),

    queryFn: () =>
      agentInvoiceService.getPending(filters),
    enabled: options?.enabled ?? true, // existing callers keep working


    placeholderData: (previousData) =>
      previousData,
  });
}