import { api } from "@/lib/api";
import { MobileAppRelease, MobileAppType } from "@/types/mobile-app-release";

const BASE_URL = "/mobile-app-releases";


function isMobileAppRelease(
  value: unknown,
): value is MobileAppRelease {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const release = value as Record<string, unknown>;

  return (
    typeof release.id === "string" &&
    typeof release.version_name === "string" &&
    typeof release.is_downloadable === "boolean"
  );
}

export async function getLatestMobileAppRelease(
  appType: MobileAppType,
  signal?: AbortSignal,
): Promise<MobileAppRelease | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error(
      "The API address is not configured. Please contact the system administrator.",
    );
  }

  try {
    const response = await api.get(
      `${BASE_URL}/latest`,
      {
        params: {
          app_type: appType,
        },
        signal,
      },
    );

    const payload = response.data;

    const body =
      typeof payload === "object" &&
      payload !== null &&
      "data" in payload
        ? (payload as { data: unknown }).data
        : payload;

    if (!isMobileAppRelease(body)) {
      throw new Error(
        "The release information returned by the server is invalid.",
      );
    }

    if (
      body.app_type &&
      body.app_type !== appType
    ) {
      throw new Error(
        "The server returned a release for a different application.",
      );
    }

    return body;
  } catch (error: unknown) {
    /*
     * No published release is an expected business condition.
     */
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error
    ) {
      const apiError = error as {
        response?: {
          status?: number;
        };
      };

      if (apiError.response?.status === 404) {
        return null;
      }
    }

    throw error;
  }
}