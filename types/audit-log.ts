/*
|--------------------------------------------------------------------------
| Audit log types
|--------------------------------------------------------------------------
| Mirror the `GET /audit-logs` response.
*/

/** Known actions get colours; unknown ones still type-check and render. */
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "VIEW"
  | "VIEW_LIST"
  | (string & {})

export interface AuditLogUser {
  id: string
  name: string
  email: string
}

export interface AuditLogResource {
  type: string | null
  id: string | null
}

export type AuditValues = Record<string, unknown>

export interface AuditLog {
  id: number
  user: AuditLogUser | null
  user_id: string | null
  action: AuditAction
  module: string
  resource: AuditLogResource
  description: string
  old_values: AuditValues | null
  new_values: AuditValues | null
  request_id: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: AuditValues | null
  created_at: string
}

export interface AuditLogsMeta {
  timestamp?: string
  request_id?: string
  version?: string
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number | null
  to: number | null
  has_more: boolean
}

export interface AuditLogsResponse {
  success: boolean
  message: string
  data: AuditLog[]
  errors: unknown
  meta: AuditLogsMeta
}

export interface AuditLogQuery {
  page: number
  perPage: number
  search?: string
  action?: string
  module?: string
}