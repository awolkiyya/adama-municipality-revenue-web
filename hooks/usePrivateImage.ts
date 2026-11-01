
import { fetchPrivateImage } from "@/services/user.service";
import { useEffect, useState } from "react";

type PrivateImageState = {
  path: string | null;
  url: string | undefined;
  loading: boolean;
};

export function usePrivateImage(path?: string | null) {
  const [state, setState] = useState<PrivateImageState>({
    path: null,
    url: undefined,
    loading: false,
  });

  useEffect(() => {
    if (!path) {
      return;
    }

    let alive = true;

    fetchPrivateImage(path)
      .then((res) => {
        if (alive) {
          setState({
            path,
            url: res,
            loading: false,
          });
        }
      })
      .catch(() => {
        if (alive) {
          setState({
            path,
            url: undefined,
            loading: false,
          });
        }
      });

    return () => {
      alive = false;
    };
  }, [path]);

  const isCurrentPath = state.path === (path ?? null);

  return {
    url: isCurrentPath ? state.url : undefined,
    loading: Boolean(path) && (!isCurrentPath || state.loading),
  };
}
