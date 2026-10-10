// services/mobile-app-releases-service.ts

import { api } from "@/lib/api";

import type { ApiResponse } from "@/types/api";

import type {
  CreateMobileAppReleasePayload,
  MobileAppRelease,
  MobileAppReleaseActionResponse,
  MobileAppReleaseFilters,

  MobileAppReleaseSummary,

  PublishMobileAppReleasePayload,
  UpdateMobileAppReleasePayload,
  WithdrawMobileAppReleasePayload,
} from "@/types/mobile-app-release";

const BASE_URL = "/mobile-app-releases";

/**
 * Timeout for uploading an APK and receiving the API response.
 */
const APK_UPLOAD_TIMEOUT = 120_000;

/**
 * Extract a release object from either a standard API envelope
 * or a direct release resource.
 */
function extractRelease(
  responseData: ApiResponse<MobileAppRelease> | MobileAppRelease,
): MobileAppRelease {
  const result = responseData as ApiResponse<MobileAppRelease>;

  return result.data ?? (responseData as MobileAppRelease);
}

/**
 * Mobile App Releases API service.
 *
 * Uses the shared API client to preserve authentication, CSRF,
 * base URL, and existing error-handling conventions.
 *
 * Release IDs are UUID strings, not numeric IDs.
 */
export const mobileAppReleasesService = {
  /**
   * List mobile app releases with optional filters and pagination.
   *
   * Laravel response:
   * {
   *   success: true,
   *   message: "...",
   *   data: MobileAppRelease[],
   *   errors: null,
   *   meta: {
   *     current_page: 1,
   *     per_page: 10,
   *     total: 1,
   *     ...
   *   }
   * }
   */
  async getAll(
    filters: MobileAppReleaseFilters = {},
  ): Promise<ApiResponse<MobileAppRelease,MobileAppReleaseSummary>> {
    const response = await api.get(BASE_URL, {
      params: filters,
    });

    return response.data;
  },

  /**
   * Retrieve a single mobile app release.
   */
  async getById(id: string): Promise<MobileAppRelease> {
    const response = await api.get(
      `${BASE_URL}/${encodeURIComponent(id)}`,
    );

    return extractRelease(response.data);
  },

  /**
   * Retrieve the latest published release.
   *
   * Intended for Android application update checks.
   */
  async getLatest(): Promise<MobileAppRelease> {
    const response = await api.get(`${BASE_URL}/latest`);

    return extractRelease(response.data);
  },

  /**
   * Create a draft release and upload its APK.
   *
   * FormData is required for multipart file uploads.
   * Let the browser/Axios adapter generate the multipart boundary.
   */
  async create(
    payload: CreateMobileAppReleasePayload,
  ): Promise<MobileAppRelease> {
    const formData = new FormData();

    formData.append("version_name", payload.version_name);
    formData.append("version_code", String(payload.version_code));
    formData.append("apk", payload.apk, payload.apk.name);

    if (payload.release_notes !== undefined) {
      formData.append("release_notes", payload.release_notes ?? "");
    }

    if (payload.is_mandatory !== undefined) {
      formData.append(
        "is_mandatory",
        String(payload.is_mandatory),
      );
    }

    const startedAt = Date.now();

    console.info(
      "[MobileAppReleases] Starting release creation.",
      {
        version_name: payload.version_name,
        version_code: payload.version_code,
        apk_name: payload.apk.name,
        apk_size_bytes: payload.apk.size,
        apk_type: payload.apk.type,
        is_mandatory: payload.is_mandatory,
      },
    );

    try {
      const response = await api.post(BASE_URL, formData, {
        timeout: APK_UPLOAD_TIMEOUT,
      });

      console.info(
        "[MobileAppReleases] Release creation response received.",
        {
          status: response.status,
          duration_ms: Date.now() - startedAt,
        },
      );

      const release = extractRelease(response.data);

      if (
        !release ||
        typeof release !== "object" ||
        typeof release.id !== "string" ||
        release.id.length === 0
      ) {
        console.error(
          "[MobileAppReleases] Unexpected create response format.",
          {
            status: response.status,
            response_data: response.data,
          },
        );

        throw new Error(
          "The server returned an unexpected response after creating the release.",
        );
      }

      return release;
    } catch (error: unknown) {
      console.error(
        "[MobileAppReleases] Release creation request failed.",
        {
          ...getRequestErrorDetails(error),
          duration_ms: Date.now() - startedAt,
          version_name: payload.version_name,
          version_code: payload.version_code,
          apk_name: payload.apk.name,
          apk_size_bytes: payload.apk.size,
        },
      );

      throw error;
    }
  },

  /**
   * Update a release and optionally replace its APK.
   *
   * Uses POST with Laravel's _method=PUT override for multipart
   * compatibility with PHP/Laravel request parsing.
   */
  async update(
    id: string,
    payload: UpdateMobileAppReleasePayload,
  ): Promise<MobileAppRelease> {
    const formData = new FormData();

    if (payload.version_name !== undefined) {
      formData.append("version_name", payload.version_name);
    }

    if (payload.version_code !== undefined) {
      formData.append("version_code", String(payload.version_code));
    }

    if (payload.apk) {
      formData.append("apk", payload.apk, payload.apk.name);
    }

    if (payload.release_notes !== undefined) {
      formData.append("release_notes", payload.release_notes ?? "");
    }

    if (payload.is_mandatory !== undefined) {
      formData.append(
        "is_mandatory",
        String(payload.is_mandatory),
      );
    }

    formData.append("_method", "PUT");

    const startedAt = Date.now();

    console.info(
      "[MobileAppReleases] Starting release update.",
      {
        release_id: id,
        updated_fields: [
          ...(payload.version_name !== undefined
            ? ["version_name"]
            : []),
          ...(payload.version_code !== undefined
            ? ["version_code"]
            : []),
          ...(payload.release_notes !== undefined
            ? ["release_notes"]
            : []),
          ...(payload.is_mandatory !== undefined
            ? ["is_mandatory"]
            : []),
          ...(payload.apk ? ["apk"] : []),
        ],
        apk_replacement_requested: Boolean(payload.apk),
        apk_name: payload.apk?.name,
        apk_size_bytes: payload.apk?.size,
      },
    );

    try {
      const response = await api.post(
        `${BASE_URL}/${encodeURIComponent(id)}`,
        formData,
        {
          timeout: APK_UPLOAD_TIMEOUT,
        },
      );

      console.info(
        "[MobileAppReleases] Release update response received.",
        {
          release_id: id,
          status: response.status,
          duration_ms: Date.now() - startedAt,
        },
      );

      return extractRelease(response.data);
    } catch (error: unknown) {
      console.error(
        "[MobileAppReleases] Release update request failed.",
        {
          ...getRequestErrorDetails(error),
          release_id: id,
          duration_ms: Date.now() - startedAt,
        },
      );

      throw error;
    }
  },

  /**
   * Publish a draft release.
   *
   * POST /mobile-app-releases/{id}/publish
   */
  async publish(
    id: string,
    payload: PublishMobileAppReleasePayload = {},
  ): Promise<MobileAppReleaseActionResponse> {
    const response = await api.post(
      `${BASE_URL}/${encodeURIComponent(id)}/publish`,
      payload,
    );

    return response.data;
  },

  /**
   * Withdraw a release.
   *
   * POST /mobile-app-releases/{id}/withdraw
   */
  async withdraw(
    id: string,
    payload: WithdrawMobileAppReleasePayload = {},
  ): Promise<MobileAppReleaseActionResponse> {
    const response = await api.post(
      `${BASE_URL}/${encodeURIComponent(id)}/withdraw`,
      payload,
    );

    return response.data;
  },

  /**
   * Download a published APK.
   *
   * Returns a Blob so the UI can trigger a browser download.
   */
  async download(id: string): Promise<Blob> {
    const response = await api.get(
      `${BASE_URL}/${encodeURIComponent(id)}/download`,
      {
        responseType: "blob",
      },
    );

    return response.data;
  },
};

/**
 * Extract useful diagnostics from Axios-style errors without
 * logging request headers, cookies, authentication tokens, or file data.
 */
function getRequestErrorDetails(
  error: unknown,
): Record<string, unknown> {
  if (typeof error !== "object" || error === null) {
    return {
      message: error instanceof Error ? error.message : String(error),
    };
  }

  const value = error as {
    message?: string;
    code?: string;
    response?: {
      status?: number;
      data?: unknown;
    };
    request?: unknown;
  };

  return {
    message: value.message,
    code: value.code,
    status: value.response?.status,
    response_data: value.response?.data,
    request_sent: Boolean(value.request),
  };
}

export default mobileAppReleasesService;
