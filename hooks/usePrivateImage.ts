
import { useEffect, useState } from "react";

import { fetchPrivateImage } from "@/services/user.service";

type PrivateImageState = {
  path: string | null;
  url: string | undefined;
  loading: boolean;
  error: boolean;
};

const INITIAL_STATE: PrivateImageState = {
  path: null,
  url: undefined,
  loading: false,
  error: false,
};

export function usePrivateImage(path?: string | null) {
  const [state, setState] = useState<PrivateImageState>(INITIAL_STATE);

  useEffect(() => {
    if (!path) {
      return;
    }

    let active = true;
    let objectUrl: string | undefined;

    fetchPrivateImage(path)
      .then((url) => {
        objectUrl = url;

        if (!active) {
          URL.revokeObjectURL(url);
          return;
        }

        setState({
          path,
          url,
          loading: false,
          error: false,
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setState({
          path,
          url: undefined,
          loading: false,
          error: true,
        });
      });

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = undefined;
      }
    };
  }, [path]);

  const normalizedPath = path ?? null;
  const isCurrentPath = state.path === normalizedPath;

  // Derive the loading state instead of resetting state inside an effect.
  const loading =
    Boolean(normalizedPath) &&
    (!isCurrentPath || state.loading);

  return {
    url: normalizedPath && isCurrentPath ? state.url : undefined,
    loading,
    error: Boolean(normalizedPath && isCurrentPath && state.error),
  };
}
