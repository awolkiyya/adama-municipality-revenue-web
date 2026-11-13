
/**
 * Mobile App Release Types
 *
 * These types represent the mobile app release API contracts
 * returned by Laravel's MobileAppReleaseResource.
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
      description: "For municipal revenue collectors to register taxpayers, manage assessments, and collect payments in the field.",
    },
    {
      value: "taxpayer",
      label: "Taxpayer",
      description: "For taxpayers to access municipal services, manage their tax information, and make payments.",
    },
    {
      value: "inspector",
      label: "Inspector",
      description: "For municipal inspectors to conduct inspections, verify compliance, and submit inspection reports.",
    },
    {
      value: "administrator",
      label: "Administrator",
      description: "For system administrators to manage users, permissions, configurations, and system operations.",
    },
    {
      value: "supervisor",
      label: "Supervisor",
      description: "For supervisors to monitor field operations, review activities, and oversee revenue collection performance.",
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

/**
 * Release record returned by MobileAppReleaseResource.
 *
 * IMPORTANT:
 * - id is a UUID string, not a number.
 * - app_type identifies the target mobile application.
 * - APK information is nested under the apk property.
 */
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

  /**
   * True when the release has a published, downloadable APK.
   */
  is_downloadable: boolean;

  /**
   * Associated APK metadata.
   * Null when no APK file is associated with the release.
   */
  apk: MobileAppReleaseApk | null;

  /**
   * API-generated download URL.
   * Null when the release is not downloadable.
   */
  download_url: string | null;

  /**
   * Available when Laravel eager-loads the creator relationship.
   */
  creator?: MobileAppReleaseCreator | null;

  created_at: string;
  updated_at: string;
}

/* -------------------------------------------------------------------------- */
/* Summary Statistics                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Summary statistics returned in the pagination metadata.
 *
 * Statistics should be scoped to the selected application type
 * when the backend receives an app_type filter.
 */
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

/**
 * Response for release operations such as publish and withdraw.
 */
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
 * Payload for creating a release.
 *
 * Send multipart/form-data when uploading the APK.
 * Application type is required.
 */
export interface CreateMobileAppReleasePayload {
  app_type: MobileAppType;

  version_name: string;
  version_code: number;

  apk: File;

  release_notes?: string | null;
  is_mandatory?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Update Payload                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Payload for updating a draft release.
 *
 * Application type cannot be changed after creation.
 * APK replacement is optional.
 */
export interface UpdateMobileAppReleasePayload {
  version_name?: string;
  version_code?: number;

  apk?: File | null;

  release_notes?: string | null;
  is_mandatory?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Release Filters                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Filters for listing mobile app releases.
 */
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

/**
 * Filters used by the frontend list page.
 */
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

/**
 * Publishing is controlled by the backend.
 *
 * The backend automatically sets is_latest for the selected app_type.
 */
export type PublishMobileAppReleasePayload = Record<string, never>;

/* -------------------------------------------------------------------------- */
/* Withdraw Payload                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Payload for withdrawing a release.
 */
export interface WithdrawMobileAppReleasePayload {
  reason?: string;
}


export interface LatestReleaseResult {
  release: MobileAppRelease | null;
  notFound: boolean;
}

// export interface MobileAppRelease {
//     id: string;
//     app_type: MobileAppType;
//     version_name: string;
//     version_code: number;
//     status?: string;
//     is_downloadable: boolean;
//     download_url?: string | null;
//     apk_download_url?: string | null;
//     is_mandatory:boolean;
//     apk?: {
//       uuid?: string;
//       original_name?: string | null;
//       extension?: string | null;
//       size_bytes?: number | null;
//     } | null;
//   };