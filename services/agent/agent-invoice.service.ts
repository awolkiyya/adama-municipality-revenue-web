import { api } from "@/lib/api";

import type {
  AgentPendingInvoice,
  AgentPendingInvoiceFilters,
} from "@/types/agent/agent-invoice";

import type { PaginatedResponse } from "@/types/api";

class AgentInvoiceService {
  async getPending(
    filters: AgentPendingInvoiceFilters = {},
  ): Promise<
    PaginatedResponse<AgentPendingInvoice>
  > {
    const params = new URLSearchParams();

    if (filters.search?.trim()) {
      params.set(
        "search",
        filters.search.trim(),
      );
    }

    if (filters.page) {
      params.set(
        "page",
        String(filters.page),
      );
    }

    if (filters.per_page) {
      params.set(
        "per_page",
        String(filters.per_page),
      );
    }

    const query = params.toString();

    const response = await api.get<
      PaginatedResponse<AgentPendingInvoice>
    >(
      `/agent/invoices/pending${
        query ? `?${query}` : ""
      }`,
    );

    return response.data;
  }
}

export const agentInvoiceService =
  new AgentInvoiceService();