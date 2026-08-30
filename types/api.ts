/**
 * ApiResponse.types.ts
 */

/*
|--------------------------------------------------------------------------
| ERROR CODES
|--------------------------------------------------------------------------
*/

export type ApiErrorCode =
  | "ERROR"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "METHOD_NOT_ALLOWED"
  | "HTTP_ERROR"
  | "SERVER_ERROR"
  | "PAYMENT_FAILED";

/*
|--------------------------------------------------------------------------
| PAGINATION META
|--------------------------------------------------------------------------
*/

export interface ApiPaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
  has_more: boolean;

  timestamp: string;
  request_id: string;
  version: string;
}

/*
|--------------------------------------------------------------------------
| API META
|--------------------------------------------------------------------------
*/

export interface ApiResponseMeta<
  TSummary = undefined
> extends Partial<ApiPaginationMeta> {
  summary?: TSummary;
}

/*
|--------------------------------------------------------------------------
| SUCCESS RESPONSE
|--------------------------------------------------------------------------
*/

export interface ApiSuccessResponse<
  T = unknown,
  TSummary = undefined
> {
  success: true;

  message: string;

  data: T;

  errors: null;

  meta: ApiResponseMeta<TSummary>;
}

/*
|--------------------------------------------------------------------------
| ERROR RESPONSE
|--------------------------------------------------------------------------
*/

export type ApiValidationErrors =
  Record<string, string[]>;

export interface ApiDebugErrorDetails {
  exception: string;
  message: string;
  file: string;
  line: number;
  trace: unknown[];
}

export interface ApiErrorResponse {
  success: false;

  message: string;

  data: null;

  errors:
    | ApiValidationErrors
    | ApiDebugErrorDetails
    | Record<string, unknown>
    | null;

  meta: ApiResponseMeta;

  error_code: ApiErrorCode;
}

/*
|--------------------------------------------------------------------------
| FULL API RESPONSE
|--------------------------------------------------------------------------
*/

export type ApiResponse<
  T = unknown,
  TSummary = undefined
> =
  | ApiSuccessResponse<T, TSummary>
  | ApiErrorResponse;

/*
|--------------------------------------------------------------------------
| TYPE GUARD
|--------------------------------------------------------------------------
*/

export function isApiSuccess<
  T,
  TSummary = undefined
>(
  res: ApiResponse<T, TSummary>
): res is ApiSuccessResponse<T, TSummary> {
  return res.success === true;
}

/*
|--------------------------------------------------------------------------
| PAGINATION GUARD
|--------------------------------------------------------------------------
*/

export function hasPagination(
  meta: ApiResponseMeta
): meta is ApiPaginationMeta {
  return typeof meta.current_page === "number";
}

/*
|--------------------------------------------------------------------------
| RESPONSE ALIASES
|--------------------------------------------------------------------------
*/

export type SingleResponse<
  T,
  TSummary = undefined
> = ApiResponse<T, TSummary>;

export type ListResponse<
  T,
  TSummary = undefined
> = ApiResponse<T[], TSummary>;

export type PaginatedResponse<
  T,
  TSummary = undefined
> = ApiResponse<T[], TSummary>;