/**

* Mobile App Release Types
*
* These types represent the mobile app release API contracts
* returned by Laravel's MobileAppReleaseResource.
  */

export type MobileAppReleaseStatus =
| "draft"
| "published"
| "withdrawn";

/**

* APK file information returned by the API.
  */
  export interface MobileAppReleaseApk {
  uuid: string;
  original_name: string;
  extension: string | null;
  size_bytes: number;
  checksum: string | null;
  mime_type: string | null;
  status: string;
  }

/**

* Creator information returned when the creator relationship
* is included in the API response.
  */
  export interface MobileAppReleaseCreator {
  id: string;
  name: string;
  email?: string;
  }

/**

* Release record returned by MobileAppReleaseResource.
*
* IMPORTANT:
* id is a UUID string, not a number.
* APK information is nested under the apk property.
  */
  export interface MobileAppRelease {
  id: string;

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

/**

* Summary statistics returned in the pagination metadata.
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

/**

* Payload for creating a release.
*
* Send multipart/form-data when uploading the APK.
  */
  export interface CreateMobileAppReleasePayload {
  version_name: string;
  version_code: number;
  apk: File;
  release_notes?: string | null;
  is_mandatory?: boolean;
  }

/**

* Payload for updating release information.
*
* APK replacement is optional.
  */
  export interface UpdateMobileAppReleasePayload {
  version_name?: string;
  version_code?: number;
  apk?: File | null;
  release_notes?: string | null;
  is_mandatory?: boolean;
  }

/**

* Filters for listing mobile app releases.
  */
  export interface MobileAppReleaseFilters {
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
  search?: string;
  status?: MobileAppReleaseStatus | "all";
  page?: number;
  per_page?: number;
  }

/**

* Payload for publishing a release.
  */
  export interface PublishMobileAppReleasePayload {
  is_latest?: boolean;
  }

/**

* Payload for withdrawing a release.
  */
  export interface WithdrawMobileAppReleasePayload {
  reason?: string;
  }
