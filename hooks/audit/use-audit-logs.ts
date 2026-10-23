"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import type {
  AuditLogQuery,
  AuditLogsResponse,
} from "@/types/audit-log"

/*
|--------------------------------------------------------------------------
| Fetcher
|--------------------------------------------------------------------------
| TODO: swap this for your existing API client (the one that already
| attaches your auth token and base URL) so requests are authenticated
| the same way as your other hooks.
*/

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ""

async function fetchAuditLogs(
  query: AuditLogQuery,
  signal?: AbortSignal,
): Promise<AuditLogsResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    per_page: String(query.perPage),
  })

  if (query.search) params.set("search", query.search)
  if (query.action) params.set("action", query.action)
  if (query.module) params.set("module", query.module)

  const response = await fetch(
    `${API_BASE}/api/v1/audit-logs?${params.toString()}`,
    {
      credentials: "include",
      headers: { Accept: "application/json" },
      signal,
    },
  )

  const body = (await response
    .json()
    .catch(() => null)) as AuditLogsResponse | null

  if (!response.ok || !body?.success) {
    throw new Error(
      body?.message ?? `Request failed (${response.status})`,
    )
  }

  return body
}

/*
|--------------------------------------------------------------------------
| Hook
|--------------------------------------------------------------------------
*/

export function useAuditLogs(query: AuditLogQuery) {
  return useQuery({
    queryKey: ["audit-logs", query],
    queryFn: ({ signal }) => fetchAuditLogs(query, signal),
    // Keep the old page on screen while the next one loads.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}