
import { api } from "@/lib/api";

import type { ApiResponse } from "@/types/api";

import type {
  CreateMobileAppReleasePayload,
  CreateMobileAppReleaseUploadPayload,
  MobileAppRelease,
  MobileAppReleaseActionResponse,
  MobileAppReleaseFilters,
  MobileAppReleaseSummary,
  MobileAppReleaseUpload,
  MobileAppType,
  PublishMobileAppReleasePayload,
  UpdateMobileAppReleasePayload,
  UploadProgressCallback,
  WithdrawMobileAppReleasePayload,
} from "@/types/mobile-app-release";

const BASE_URL = "/mobile-app-releases";
const UPLOADS_URL = `${BASE_URL}/uploads`;

/**
 * Maximum time allowed for an individual chunk request.
 */
const CHUNK_UPLOAD_TIMEOUT = 120_000;

/**
 * Maximum number of attempts for an individual chunk.
 */
const CHUNK_UPLOAD_MAX_RETRIES = 3;

/**
 * Delay before retrying a failed chunk.
 */
const CHUNK_UPLOAD_RETRY_DELAY = 1_000;

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
 * Extract an upload object from either a standard API envelope
 * or a direct upload resource.
 */
function extractUpload(
  responseData:
    | ApiResponse<MobileAppReleaseUpload>
    | MobileAppReleaseUpload,
): MobileAppReleaseUpload {
  const result = responseData as ApiResponse<MobileAppReleaseUpload>;

  return result.data ?? (responseData as MobileAppReleaseUpload);
}

/**
 * Generate a stable local storage key for a selected APK.
 *
 * This stores only the upload session UUID, never the APK itself.
 */
function getUploadStorageKey(
  appType: string,
  file: File,
): string {
  return [
    "mobile-app-release-upload",
    appType,
    file.name,
    file.size,
    file.lastModified,
  ].join(":");
}

/**
 * Read a previously saved upload UUID.
 */
function getSavedUploadUuid(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Save an upload UUID for resumability.
 */
function saveUploadUuid(
  key: string,
  uuid: string,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, uuid);
  } catch {
    // Upload remains functional without local persistence.
  }
}

/**
 * Remove a saved upload UUID.
 */
function removeSavedUploadUuid(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore local storage failures.
  }
}

/**
 * Wait before retrying a failed chunk.
 */
function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

/**
 * Calculate upload progress using confirmed uploaded bytes.
 */
function calculateUploadProgress(
  uploadedChunks: number[],
  totalChunks: number,
  chunkSize: number,
  totalSize: number,
): number {
  if (totalSize <= 0) {
    return 100;
  }

  const uploadedBytes = uploadedChunks.reduce(
    (total, chunkIndex) => {
      const chunkStart = chunkIndex * chunkSize;
      const remainingBytes = totalSize - chunkStart;

      return total + Math.max(
        0,
        Math.min(chunkSize, remainingBytes),
      );
    },
    0,
  );

  return Math.min(
    100,
    Math.round((uploadedBytes / totalSize) * 100),
  );
}

/**
 * Normalize uploaded chunk indexes.
 *
 * The backend should return uploaded_chunks as an array of
 * zero-based chunk indexes.
 */
function normalizeUploadedChunks(
  uploadedChunks: number[] | null | undefined,
): number[] {
  if (!Array.isArray(uploadedChunks)) {
    return [];
  }

  return [
    ...new Set(
      uploadedChunks.filter(
        (index) =>
          Number.isInteger(index) && index >= 0,
      ),
    ),
  ].sort((a, b) => a - b);
}

/**
 * Mobile App Releases API service.
 *
 * Supports:
 * - Release CRUD operations.
 * - Chunked APK uploads.
 * - Upload session resumption.
 * - Chunk retry handling.
 * - Upload progress reporting.
 *
 * Release IDs and upload UUIDs are strings.
 */
export const mobileAppReleasesService = {
  /**
   * List mobile app releases.
   */
  async getAll(
    filters: MobileAppReleaseFilters = {},
  ): Promise<ApiResponse<MobileAppRelease, MobileAppReleaseSummary>> {
    const response = await api.get(BASE_URL, {
      params: filters,
    });

    return response.data;
  },

  /**
   * Retrieve a single release.
   */
  async getById(id: string): Promise<MobileAppRelease> {
    const response = await api.get(
      `${BASE_URL}/${encodeURIComponent(id)}`,
    );

    return extractRelease(response.data);
  },

  /**
   * Retrieve the latest published release.
   */
  async getLatest(): Promise<MobileAppRelease> {
    const response = await api.get(`${BASE_URL}/latest`);

    return extractRelease(response.data);
  },

  /* ---------------------------------------------------------------------- */
  /* Upload sessions                                                        */
  /* ---------------------------------------------------------------------- */

  /**
   * Create an APK upload session.
   *
   * POST /mobile-app-releases/uploads
   */
  async createUploadSession(
    payload: CreateMobileAppReleaseUploadPayload,
  ): Promise<MobileAppReleaseUpload> {
    const response = await api.post(
      UPLOADS_URL,
      payload,
    );

    return extractUpload(response.data);
  },

  /**
   * Retrieve upload session status.
   *
   * GET /mobile-app-releases/uploads/{uuid}
   */
  async getUpload(
    uuid: string,
  ): Promise<MobileAppReleaseUpload> {
    const response = await api.get(
      `${UPLOADS_URL}/${encodeURIComponent(uuid)}`,
    );

    return extractUpload(response.data);
  },

  /**
   * Upload one APK chunk.
   *
   * The Laravel route uses PUT, so POST with _method=PUT is
   * used for multipart request compatibility.
   *
   * POST /mobile-app-releases/uploads/{uuid}/chunks/{chunkIndex}
   */
  async uploadChunk(
    uuid: string,
    chunkIndex: number,
    chunk: Blob,
  ): Promise<void> {
    const formData = new FormData();

    formData.append(
      "chunk",
      chunk,
      `chunk-${chunkIndex}`,
    );

    formData.append("_method", "PUT");

    await api.post(
      `${UPLOADS_URL}/${encodeURIComponent(uuid)}/chunks/${chunkIndex}`,
      formData,
      {
        timeout: CHUNK_UPLOAD_TIMEOUT,
      },
    );
  },

  /**
   * Complete APK upload and trigger server-side verification.
   *
   * POST /mobile-app-releases/uploads/{uuid}/complete
   */
  async completeUpload(
    uuid: string,
  ): Promise<MobileAppReleaseUpload> {
    const response = await api.post(
      `${UPLOADS_URL}/${encodeURIComponent(uuid)}/complete`,
    );

    return extractUpload(response.data);
  },

  /* ---------------------------------------------------------------------- */
  /* Resumable APK upload                                                   */
  /* ---------------------------------------------------------------------- */

  /**
   * Upload an APK using resumable chunked uploads.
   *
   * Existing upload sessions are reused when:
   * - The same app type is selected.
   * - The same file name is selected.
   * - The file size is unchanged.
   * - The file modification timestamp is unchanged.
   *
   * Progress represents confirmed uploaded bytes.
   */
  async uploadApk(
    appType: MobileAppType,
    file: File,
    onProgress?: UploadProgressCallback,
  ): Promise<MobileAppReleaseUpload> {
    if (!file || file.size <= 0) {
      throw new Error("Please select a valid APK file.");
    }

    const storageKey = getUploadStorageKey(
      appType,
      file,
    );

    let upload: MobileAppReleaseUpload | null = null;

    const savedUuid = getSavedUploadUuid(storageKey);

    /**
     * Resume an existing upload session when possible.
     */
    if (savedUuid) {
      try {
        const existingUpload = await this.getUpload(savedUuid);

        const matchesFile =
          existingUpload.app_type === appType &&
          existingUpload.original_name === file.name &&
          Number(existingUpload.total_size) === file.size;

        if (
          !matchesFile ||
          existingUpload.status === "FAILED" ||
          existingUpload.status === "EXPIRED" ||
          existingUpload.status === "CONSUMED"
        ) {
          removeSavedUploadUuid(storageKey);
        } else {
          upload = existingUpload;
        }
      } catch {
        /**
         * A missing, inaccessible, or expired session must not
         * prevent creating a new upload session.
         */
        removeSavedUploadUuid(storageKey);
      }
    }

    /**
     * Create a new session when no reusable session exists.
     */
    if (!upload) {
      upload = await this.createUploadSession({
        app_type: appType,
        original_name: file.name,
        total_size: file.size,
      });

      saveUploadUuid(storageKey, upload.uuid);
    }

    /**
     * If the upload already complested, do not upload again.
     */
    if (upload.status === "COMPLETED") {
      onProgress?.(100);
      return upload;
    }

    if (upload.status !== "UPLOADING") {
      throw new Error(
        `The upload cannot continue. Current status: ${upload.status}.`,
      );
    }

    const chunkSize = Number(upload.chunk_size);
    const totalChunks = Number(upload.total_chunks);

    if (
      !Number.isSafeInteger(chunkSize) ||
      chunkSize <= 0 ||
      !Number.isSafeInteger(totalChunks) ||
      totalChunks <= 0
    ) {
      throw new Error(
        "The server returned invalid upload chunk configuration.",
      );
    }

    const expectedTotalChunks = Math.ceil(
      file.size / chunkSize,
    );

    if (
      expectedTotalChunks !== totalChunks ||
      Number(upload.total_size) !== file.size
    ) {
      throw new Error(
        "The selected APK does not match the upload session configuration.",
      );
    }

    let uploadedChunks = normalizeUploadedChunks(
      upload.uploaded_chunks,
    );

    onProgress?.(
      calculateUploadProgress(
        uploadedChunks,
        totalChunks,
        chunkSize,
        file.size,
      ),
    );

    /**
     * Upload missing chunks sequentially.
     *
     * Sequential uploads simplify server-side assembly and
     * avoid overwhelming the API server.
     */
    for (
      let chunkIndex = 0;
      chunkIndex < totalChunks;
      chunkIndex++
    ) {
      if (uploadedChunks.includes(chunkIndex)) {
        continue;
      }

      const start = chunkIndex * chunkSize;
      const end = Math.min(
        start + chunkSize,
        file.size,
      );

      const chunk = file.slice(start, end);

      let uploaded = false;
      let lastError: unknown;

      for (
        let attempt = 1;
        attempt <= CHUNK_UPLOAD_MAX_RETRIES;
        attempt++
      ) {
        try {
          await this.uploadChunk(
            upload.uuid,
            chunkIndex,
            chunk,
          );

          uploaded = true;
          break;
        } catch (error: unknown) {
          lastError = error;

          /**
           * The server may have stored the chunk even if
           * the response was lost. Check server state before
           * retrying to avoid unnecessary retransmission.
           */
          try {
            const refreshedUpload = await this.getUpload(
              upload.uuid,
            );

            if (
              refreshedUpload.status !== "UPLOADING"
            ) {
              throw new Error(
                `Upload session is no longer accepting chunks: ${refreshedUpload.status}.`,
              );
            }

            const refreshedChunks = normalizeUploadedChunks(
              refreshedUpload.uploaded_chunks,
            );

            if (refreshedChunks.includes(chunkIndex)) {
              uploadedChunks = refreshedChunks;
              uploaded = true;
              break;
            }
          } catch (statusError: unknown) {
            if (
              statusError instanceof Error &&
              statusError.message.startsWith(
                "Upload session is no longer accepting chunks:",
              )
            ) {
              throw statusError;
            }
          }

          if (attempt < CHUNK_UPLOAD_MAX_RETRIES) {
            await delay(
              CHUNK_UPLOAD_RETRY_DELAY * 2 ** (attempt - 1),
            );
          }
        }
      }

      if (!uploaded) {
        throw lastError instanceof Error
          ? lastError
          : new Error(
              `Failed to upload APK chunk ${chunkIndex + 1} of ${totalChunks}.`,
            );
      }

      if (!uploadedChunks.includes(chunkIndex)) {
        uploadedChunks.push(chunkIndex);
      }

      onProgress?.(
        calculateUploadProgress(
          uploadedChunks,
          totalChunks,
          chunkSize,
          file.size,
        ),
      );
    }

    /**
     * Refresh upload state before completion.
     */
    upload = await this.getUpload(upload.uuid);

    uploadedChunks = normalizeUploadedChunks(
      upload.uploaded_chunks,
    );

    if (uploadedChunks.length !== totalChunks) {
      throw new Error(
        "The APK upload is incomplete. Some chunks are still missing.",
      );
    }

    /**
     * Ask the backend to assemble and verify the APK.
     */
    upload = await this.completeUpload(upload.uuid);

    if (upload.status !== "COMPLETED") {
      throw new Error(
        `The server did not complete APK verification. Current status: ${upload.status}.`,
      );
    }

    onProgress?.(100);

    return upload;
  },

  /**
   * Clear the saved upload session after successful release creation
   * or update.
   *
   * Call this only after the release API operation succeeds.
   */
  clearSavedUpload(
    appType: string,
    file: File,
  ): void {
    removeSavedUploadUuid(
      getUploadStorageKey(appType, file),
    );
  },

  /* ---------------------------------------------------------------------- */
  /* Release management                                                     */
  /* ---------------------------------------------------------------------- */

  /**
   * Create a draft release from a completed upload session.
   *
   * POST /mobile-app-releases
   */
  async create(
    payload: CreateMobileAppReleasePayload,
  ): Promise<MobileAppRelease> {
    const startedAt = Date.now();

    console.info(
      "[MobileAppReleases] Creating release.",
      {
        app_type: payload.app_type,
        version_name: payload.version_name,
        version_code: payload.version_code,
        upload_uuid: payload.upload_uuid,
      },
    );

    try {
      const response = await api.post(
        BASE_URL,
        payload,
      );

      const release = extractRelease(response.data);

      if (
        !release ||
        typeof release.id !== "string" ||
        release.id.length === 0
      ) {
        throw new Error(
          "The server returned an unexpected response after creating the release.",
        );
      }

      console.info(
        "[MobileAppReleases] Release created.",
        {
          release_id: release.id,
          duration_ms: Date.now() - startedAt,
        },
      );

      return release;
    } catch (error: unknown) {
      console.error(
        "[MobileAppReleases] Release creation failed.",
        {
          ...getRequestErrorDetails(error),
          duration_ms: Date.now() - startedAt,
          app_type: payload.app_type,
          version_name: payload.version_name,
          version_code: payload.version_code,
        },
      );

      throw error;
    }
  },

  /**
   * Update a release.
   *
   * A completed upload_uuid is supplied only when replacing the APK.
   * Metadata-only updates do not require an upload session.
   *
   * PUT /mobile-app-releases/{id}
   */
  async update(
    id: string,
    payload: UpdateMobileAppReleasePayload,
  ): Promise<MobileAppRelease> {
    const startedAt = Date.now();

    console.info(
      "[MobileAppReleases] Updating release.",
      {
        release_id: id,
        updated_fields: Object.keys(payload),
        apk_replacement_requested: Boolean(
          payload.upload_uuid,
        ),
      },
    );

    try {
      const response = await api.put(
        `${BASE_URL}/${encodeURIComponent(id)}`,
        payload,
      );

      const release = extractRelease(response.data);

      if (
        !release ||
        typeof release.id !== "string" ||
        release.id.length === 0
      ) {
        throw new Error(
          "The server returned an unexpected response after updating the release.",
        );
      }

      console.info(
        "[MobileAppReleases] Release updated.",
        {
          release_id: release.id,
          duration_ms: Date.now() - startedAt,
        },
      );

      return release;
    } catch (error: unknown) {
      console.error(
        "[MobileAppReleases] Release update failed.",
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
 * Uses the authenticated Axios instance and validates
 * the response before returning the downloaded file.
 */
async download(id: string): Promise<Blob> {
  const response = await api.get(
    `${BASE_URL}/${encodeURIComponent(id)}/download`,
    {
      responseType: "blob",
      headers: {
        Accept: "application/vnd.android.package-archive",
      },
      timeout: 120000,
    },
  );

  const blob = response.data as Blob;

  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error("The downloaded APK is empty or invalid.");
  }

  // Normalize the Axios response header.
  const contentType = String(
    response.headers["content-type"] ?? blob.type ?? "",
  ).toLowerCase();

  // Detect API errors returned as JSON or HTML.
  if (
    contentType.includes("application/json") ||
    contentType.includes("text/html")
  ) {
    const errorText = await blob.text();

    throw new Error(
      errorText || "The server returned an error instead of an APK.",
    );
  }

  // APK files are ZIP archives and start with PK.
  const signature = new Uint8Array(
    await blob.slice(0, 4).arrayBuffer(),
  );

  if (signature[0] !== 0x50 || signature[1] !== 0x4b) {
    throw new Error("The downloaded file is not a valid APK archive.");
  }

  return new Blob([blob], {
    type: "application/vnd.android.package-archive",
  });
},

};

/**
 * Extract useful diagnostics from Axios-style errors without
 * logging authentication headers, cookies, tokens, or file data.
 */
function getRequestErrorDetails(
  error: unknown,
): Record<string, unknown> {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return {
      message:
        error instanceof Error
          ? error.message
          : String(error),
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
