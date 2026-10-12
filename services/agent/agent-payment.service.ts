import { api } from "@/lib/api";
import {
  AgentPaymentDashboard,
  AgentPaymentFilters,
  AgentPaymentPage,
  AgentPaymentSummary,
  AgentPaymentTodaySummary,
} from "@/types/payment/agent-payment";
import type { Payment } from "@/types/payment/payment";

// ============================================================
// API RESPONSE TYPES
// ============================================================

interface ApiPagination {
  current_page?: number;
  last_page?: number;
  per_page?: number | string;
  total?: number;
  from?: number | null;
  to?: number | null;
  has_more?: boolean;
}

interface ApiEnvelope<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
  meta?: ApiPagination & {
    timestamp?: string;
    request_id?: string;
    version?: string;
  };
}

interface LaravelResourceCollection {
  data?: Payment[];
  meta?: ApiPagination;

  // Some API responses expose pagination at the root.
  current_page?: number;
  last_page?: number;
  per_page?: number | string;
  total?: number;
  from?: number | null;
  to?: number | null;
  has_more?: boolean;
}

type NumericValue = number | string | null | undefined;

type UnknownRecord = Record<string, unknown>;

// ============================================================
// HELPERS
// ============================================================

function isRecord(value: unknown): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function toNumber(
  value: NumericValue,
  fallback = 0,
): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

/**
 * Handles both standard Axios responses and clients that return
 * the response body directly.
 *
 * Standard Axios:
 *   response.data = { success, data, meta }
 *
 * Unwrapped API client:
 *   response = { success, data, meta }
 */
function getResponseBody(response: unknown): unknown {
  if (!isRecord(response)) {
    return response;
  }

  // Axios response normally has its payload under `data`.
  if (
    "data" in response &&
    !("success" in response) &&
    !("meta" in response)
  ) {
    return response.data;
  }

  return response;
}

/**
 * Unwraps the standard Laravel API envelope.
 *
 * Returns the response payload without discarding pagination
 * metadata needed by the payments page.
 */
function unwrap<T>(response: unknown): T {
  const body = getResponseBody(response);

  if (!isRecord(body)) {
    return body as T;
  }

  if (body.success === false) {
    const message =
      typeof body.message === "string"
        ? body.message
        : "Request failed.";

    throw new Error(message);
  }

  if ("data" in body) {
    return body.data as T;
  }

  return body as T;
}

/**
 * Extracts a Laravel collection envelope while preserving
 * its root-level `meta` pagination object.
 *
 * Supported response shapes:
 *
 * 1. { success, data: Payment[], meta }
 * 2. { data: { data: Payment[], meta } }
 * 3. { data: Payment[], meta }
 * 4. { items: Payment[], pagination }
 */
function normalizePaymentPage(
  response: unknown,
  requestedPage: number,
  requestedPerPage: number,
): AgentPaymentPage {
  const body = getResponseBody(response);

  if (!isRecord(body)) {
    return createEmptyPaymentPage(
      requestedPage,
      requestedPerPage,
    );
  }

  if (body.success === false) {
    const message =
      typeof body.message === "string"
        ? body.message
        : "Unable to retrieve payments.";

    throw new Error(message);
  }

  let payload: unknown = body;

  // Unwrap an outer API envelope but retain its metadata.
  if ("success" in body && "data" in body) {
    payload = body.data;
  }

  if (!isRecord(payload)) {
    // A plain array is also a valid collection payload.
    if (Array.isArray(payload)) {
      return buildPaymentPage(
        payload as Payment[],
        {},
        requestedPage,
        requestedPerPage,
      );
    }

    return createEmptyPaymentPage(
      requestedPage,
      requestedPerPage,
    );
  }

  const nestedMeta = isRecord(payload.meta)
    ? (payload.meta as ApiPagination)
    : undefined;

  const nestedPagination = isRecord(payload.pagination)
    ? (payload.pagination as ApiPagination)
    : undefined;

  const meta =
    nestedMeta ??
    nestedPagination ??
    (payload as ApiPagination);

  // Laravel resource collections return `data`.
  // A normalized frontend response may instead return `items`.
  const rawItems = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.items)
      ? payload.items
      : [];

  return buildPaymentPage(
    rawItems as Payment[],
    meta,
    requestedPage,
    requestedPerPage,
  );
}

function buildPaymentPage(
  items: Payment[],
  meta: ApiPagination,
  requestedPage: number,
  requestedPerPage: number,
): AgentPaymentPage {
  const currentPage = Math.max(
    1,
    toNumber(meta.current_page, requestedPage),
  );

  const perPage = Math.max(
    1,
    toNumber(meta.per_page, requestedPerPage),
  );

  const total = Math.max(
    0,
    toNumber(meta.total, items.length),
  );

  const calculatedLastPage = Math.max(
    1,
    Math.ceil(total / perPage),
  );

  const from =
    meta.from !== undefined
      ? meta.from
      : items.length > 0
        ? (currentPage - 1) * perPage + 1
        : null;

  const to =
    meta.to !== undefined
      ? meta.to
      : items.length > 0
        ? (currentPage - 1) * perPage + items.length
        : null;

  return {
    items,
    pagination: {
      current_page: currentPage,
      last_page: Math.max(
        1,
        toNumber(meta.last_page, calculatedLastPage),
      ),
      per_page: perPage,
      total,
      from,
      to,
    },
  };
}

function createEmptyPaymentPage(
  page: number,
  perPage: number,
): AgentPaymentPage {
  return {
    items: [],
    pagination: {
      current_page: page,
      last_page: 1,
      per_page: perPage,
      total: 0,
      from: null,
      to: null,
    },
  };
}

function normalizeSummary(
  value: Partial<AgentPaymentSummary> | null | undefined,
): AgentPaymentSummary {
  const summary = value ?? {};

  return {
    total_payments: toNumber(summary.total_payments),
    total_collected: String(summary.total_collected ?? "0.00"),
    completed_count: toNumber(summary.completed_count),
    pending_count: toNumber(summary.pending_count),
    processing_count: toNumber(summary.processing_count),
    failed_count: toNumber(summary.failed_count),
    cancelled_count: toNumber(summary.cancelled_count),
    ...(summary.reversed_count === undefined
      ? {}
      : {
          reversed_count: toNumber(summary.reversed_count),
        }),
    currency: summary.currency ?? "ETB",
  };
}

function normalizeTodaySummary(
  value:
    | Partial<AgentPaymentTodaySummary>
    | null
    | undefined,
): AgentPaymentTodaySummary {
  const summary = value ?? {};

  return {
    ...normalizeSummary(summary),
    date: summary.date ?? "",
  };
}

// ============================================================
// AGENT PAYMENT SERVICE
// ============================================================

export const agentPaymentService = {
  /**
   * Retrieves payments associated with the authenticated agent.
   *
   * Expected API response:
   * {
   *   success: true,
   *   data: Payment[],
   *   meta: {
   *     current_page: 1,
   *     per_page: 100,
   *     total: 19,
   *     last_page: 1
   *   }
   * }
   */
  async getPayments(
    filters: AgentPaymentFilters = {},
  ): Promise<AgentPaymentPage> {
    const page = Math.max(
      1,
      toNumber(filters.page, 1),
    );

    const perPage = Math.max(
      1,
      Math.min(toNumber(filters.per_page, 15), 100),
    );

    const params: Record<string, string | number> = {
      page,
      per_page: perPage,
    };

    if (filters.search?.trim()) {
      params.search = filters.search.trim();
    }

    if (filters.status) {
      params.status = filters.status;
    }

    const response = await api.get<unknown>(
      "/agent/payments",
      { params },
    );

    return normalizePaymentPage(
      response,
      page,
      perPage,
    );
  },

  /**
   * Retrieves dashboard statistics and recent payments.
   */
  async getDashboard(
    recentLimit = 5,
  ): Promise<AgentPaymentDashboard> {
    const response = await api.get<unknown>(
      "/agent/payments/dashboard",
      {
        params: {
          recent_limit: Math.max(
            1,
            Math.min(recentLimit, 20),
          ),
        },
      },
    );

    const dashboard = unwrap<
      Partial<AgentPaymentDashboard>
    >(response);

    return {
      date: dashboard.date ?? "",
      overall: normalizeSummary(dashboard.overall),
      today: normalizeTodaySummary(dashboard.today),
      recent_payments: Array.isArray(
        dashboard.recent_payments,
      )
        ? dashboard.recent_payments
        : [],
    } as AgentPaymentDashboard;
  },

  /**
   * Retrieves all-time payment statistics for the agent.
   */
  async getSummary(): Promise<AgentPaymentSummary> {
    const response = await api.get<unknown>(
      "/agent/payments/summary",
    );

    const summary = unwrap<
      Partial<AgentPaymentSummary>
    >(response);

    return normalizeSummary(summary);
  },

  /**
   * Retrieves today's payment statistics for the agent.
   */
  async getTodaySummary(): Promise<AgentPaymentTodaySummary> {
    const response = await api.get<unknown>(
      "/agent/payments/today-summary",
    );

    const summary = unwrap<
      Partial<AgentPaymentTodaySummary>
    >(response);

    return normalizeTodaySummary(summary);
  },
};

export default agentPaymentService;
