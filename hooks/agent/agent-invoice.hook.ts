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
) {
  return useQuery({
    queryKey:
      agentInvoiceKeys.pending(filters),

    queryFn: () =>
      agentInvoiceService.getPending(filters),

    placeholderData: (previousData) =>
      previousData,
  });
}