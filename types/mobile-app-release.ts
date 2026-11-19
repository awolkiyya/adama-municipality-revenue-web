
/**
 * Mobile App Release Types
 *
 * Types representing Laravel mobile app release and
 * resumable APK upload API contracts.
 */

/* -------------------------------------------------------------------------- */
/* Application Types                                                          */
/* -------------------------------------------------------------------------- */

export type MobileAppType =
  | "field_collector"
  | "taxpayer"
  | "inspector"
  | "administrator"
  | "supervisor";

export const MOBILE_APP_TYPES: {
  value: MobileAppType;
  label: string;
  description: string;
}[] = [
  {
    value: "field_collector",
    label: "Field Collector",
    description:
      "For municipal revenue collectors to register taxpayers, manage assessments, and collect payments in the field.",
  },
  {
    value: "taxpayer",
    label: "Taxpayer",
    description:
      "For taxpayers to access municipal services, manage their tax information, and make payments.",
  },
  {
    value: "inspector",
    label: "Inspector",
    description:
      "For municipal inspectors to conduct inspections, verify compliance, and submit inspection reports.",
  },
  {
    value: "administrator",
    label: "Administrator",
    description:
      "For system administrators to manage users, permissions, configurations, and system operations.",
  },
  {
    value: "supervisor",
    label: "Supervisor",
    description:
      "For supervisors to monitor field operations, review activities, and oversee revenue collection performance.",
  },
];

/* -------------------------------------------------------------------------- */
/* Release Status                                                             */
/* -------------------------------------------------------------------------- */

export type MobileAppReleaseStatus =
  | "draft"
  | "published"
  | "withdrawn";

/* -------------------------------------------------------------------------- */
/* APK File                                                                   */
/* -------------------------------------------------------------------------- */

export interface MobileAppReleaseApk {
  uuid: string;
  original_name: string;
  extension: string | null;
  size_bytes: number;
  checksum: string | null;
  mime_type: string | null;
  status: string;
}

/* -------------------------------------------------------------------------- */
/* Creator                                                                    */
/* -------------------------------------------------------------------------- */

export interface MobileAppReleaseCreator {
  id: string;
  name: string;
  email?: string;
}

/* -------------------------------------------------------------------------- */
/* Release Record                                                             */
/* -------------------------------------------------------------------------- */

export interface MobileAppRelease {
  id: string;

  app_type: MobileAppType;

  version_name: string;
  version_code: number;

  release_notes: string | null;

  is_latest: boolean;
  is_mandatory: boolean;

  status: MobileAppReleaseStatus;
  published_at: string | null;

  is_downloadable: boolean;

  apk: MobileAppReleaseApk | null;

  download_url: string | null;

  creator?: MobileAppReleaseCreator | null;

  created_at: string;
  updated_at: string;
}

/* -------------------------------------------------------------------------- */
/* Summary Statistics                                                         */
/* -------------------------------------------------------------------------- */

export interface MobileAppReleaseSummary {
  total: number;
  drafts: number;
  published: number;
  withdrawn: number;
  mandatory: number;
  optional: number;
  latest: MobileAppRelease | null;
}

/* -------------------------------------------------------------------------- */
/* API Responses                                                              */
/* -------------------------------------------------------------------------- */

export interface MobileAppReleaseActionResponse {
  success?: boolean;
  message: string;
  data?: MobileAppRelease;
  errors?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
}

/* -------------------------------------------------------------------------- */
/* Create Payload                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Create a release using an already completed APK upload.
 *
 * The APK itself is uploaded separately through the resumable
 * upload endpoints. This endpoint receives only upload_uuid.
 */
export interface CreateMobileAppReleasePayload {
  app_type: MobileAppType;

  version_name: string;
  version_code: number;

  upload_uuid: string;

  release_notes?: string | null;
  is_mandatory?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Update Payload                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Update a draft release.
 *
 * upload_uuid is optional:
 * - Provided: replace the existing APK.
 * - Omitted: retain the existing APK.
 *
 * Application type cannot be changed.
 */
export interface UpdateMobileAppReleasePayload {
  version_name?: string;
  version_code?: number;

  upload_uuid?: string;

  release_notes?: string | null;
  is_mandatory?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Resumable APK Upload                                                       */
/* -------------------------------------------------------------------------- */

export type MobileAppReleaseUploadStatus =
  | "UPLOADING"
  | "ASSEMBLING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED"
  | "CONSUMED";

/**
 * Upload session returned by Laravel.
 *
 * uploaded_chunks contains zero-based chunk indexes
 * successfully received by the server.
 */
export interface MobileAppReleaseUpload {
  uuid: string;

  app_type: MobileAppType;

  original_name: string;

  total_size: number;

  chunk_size: number;

  total_chunks: number;

  uploaded_chunks: number[];

  status: MobileAppReleaseUploadStatus;

  checksum: string | null;

  expires_at: string | null;

  completed_at: string | null;
}

/**
 * Request to create a new resumable upload session.
 *
 * The backend determines chunk_size and total_chunks.
 */
export interface CreateMobileAppReleaseUploadPayload {
  app_type: MobileAppType;

  original_name: string;

  total_size: number;
}

/**
 * Optional expected SHA-256 checksum.
 *
 * Include this only if your Laravel upload-session endpoint
 * accepts and validates expected_checksum.
 */
export interface CreateMobileAppReleaseUploadWithChecksumPayload
  extends CreateMobileAppReleaseUploadPayload {
  expected_checksum?: string;
}

/**
 * Progress callback used by the upload service.
 */
export type UploadProgressCallback = (
  percentage: number,
) => void;

/* -------------------------------------------------------------------------- */
/* Release Filters                                                            */
/* -------------------------------------------------------------------------- */

export interface MobileAppReleaseFilters {
  app_type?: MobileAppType;

  search?: string;
  status?: MobileAppReleaseStatus | "all";

  is_latest?: boolean;
  is_mandatory?: boolean;

  page?: number;
  per_page?: number;

  sort_by?: string;
  sort_direction?: "asc" | "desc";
}

/* -------------------------------------------------------------------------- */
/* List Parameters                                                            */
/* -------------------------------------------------------------------------- */

export interface MobileAppReleaseListParams {
  app_type?: MobileAppType;

  search?: string;
  status?: MobileAppReleaseStatus | "all";

  page?: number;
  per_page?: number;
}

/* -------------------------------------------------------------------------- */
/* Publish Payload                                                            */
/* -------------------------------------------------------------------------- */

export type PublishMobileAppReleasePayload = Record<string, never>;

/* -------------------------------------------------------------------------- */
/* Withdraw Payload                                                           */
/* -------------------------------------------------------------------------- */

export interface WithdrawMobileAppReleasePayload {
  reason?: string;
}

/* -------------------------------------------------------------------------- */
/* Latest Release                                                             */
/* -------------------------------------------------------------------------- */

export interface LatestReleaseResult {
  release: MobileAppRelease | null;
  notFound: boolean;
}
