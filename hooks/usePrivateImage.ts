import { fetchPrivateImage } from "@/services/user.service";
import { useEffect, useState } from "react";

export function usePrivateImage(path?: string | null) {
  const [url, setUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!path) return;

    let alive = true;
    setLoading(true);

    fetchPrivateImage(path)
      .then((res) => {
        if (alive) setUrl(res);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [path]);

  return { url, loading };
}