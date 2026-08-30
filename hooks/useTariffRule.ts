import { TariffRuleRecord, UseTariffRuleResult } from "@/types/revenue/tariff-form";
import { useEffect, useState } from "react";

export function useTariffRule(id: string): UseTariffRuleResult {
  const [data, setData] = useState<TariffRuleRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setIsError(false);

      try {
        const res = await fetch(`/api/tariff-rules/${id}`);
        if (!res.ok) throw new Error(`Failed with status ${res.status}`);

        const json = (await res.json()) as TariffRuleRecord;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setIsError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, refetchToken]);

  return {
    data,
    isLoading,
    isError,
    refetch: () => setRefetchToken((t) => t + 1),
  };
}