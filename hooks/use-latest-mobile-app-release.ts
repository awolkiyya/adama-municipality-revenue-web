"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getLatestMobileAppRelease } from "../services/mobile-app-release.service";
import { MobileAppRelease, MobileAppType } from "@/types/mobile-app-release";


interface UseLatestMobileAppReleaseReturn {
  release: MobileAppRelease | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  retry: () => void;
}

export function useLatestMobileAppRelease(
  appType: MobileAppType,
): UseLatestMobileAppReleaseReturn {
  const [release, setRelease] =
    useState<MobileAppRelease | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [notFound, setNotFound] = useState(false);

  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((previous) => previous + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLatestRelease() {
      setLoading(true);
      setError(null);
      setNotFound(false);
      setRelease(null);

      try {
        const latestRelease =
          await getLatestMobileAppRelease(
            appType,
            controller.signal,
          );

        if (controller.signal.aborted) {
          return;
        }

        if (!latestRelease) {
          setNotFound(true);
          return;
        }

        setRelease(latestRelease);
      } catch (cause: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load the app release. Please try again.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadLatestRelease();

    return () => {
      controller.abort();
    };
  }, [appType, retryCount]);

  return {
    release,
    loading,
    error,
    notFound,
    retry,
  };
}