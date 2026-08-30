// src/modules/audit/types/system-log.ts

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'EXPORT';

export type AuditSortField =
  | 'created_at'
  | 'action'
  | 'module'
  | 'user_id'
  | 'resource_type';

export type AuditSortDirection = 'asc' | 'desc';

export interface AuditUser {
  id: string;
  name: string;
  email: string | null;
}

export interface AuditResource {
  type: string;
  id: string;
}

export interface AuditMetadata {
  source?: 'web' | 'mobile' | 'api' | string;
  latency_ms?: number;
  [key: string]: unknown;
}

export interface SystemLog {
  id: string;

  user: AuditUser | null;

  user_id: string | null;

  action: AuditAction | string;

  module: string;

  resource: AuditResource;

  description: string | null;

  old_values: Record<string, unknown> | null;

  new_values: Record<string, unknown> | null;

  request_id: string | null;

  ip_address: string | null;

  user_agent: string | null;

  metadata: AuditMetadata | null;

  created_at: string | null;
}

export interface SystemLogQuery {
  search?: string;
  action?: string;
  module?: string;
  user_id?: string;
  resource_type?: string;
  resource_id?: string;
  request_id?: string;
  ip_address?: string;

  from?: string;
  to?: string;

  per_page?: number;
  page?: number;

  sort_by?: AuditSortField;
  sort_direction?: AuditSortDirection;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginatedData<T> {
  data: T[];
  meta: PaginationMeta;
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: Record<string, string[]> | null;
  meta?: {
    timestamp: string;
    request_id: string | null;
    version: string;
  };
}