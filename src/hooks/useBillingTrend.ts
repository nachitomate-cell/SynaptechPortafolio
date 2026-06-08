import { useEffect, useRef, useState } from "react";

/** Daily GCP spend + projection for the current month (see /api/billing/trend). */
export interface BillingTrend {
  month: string;
  currency: string;
  total: number;
  daysElapsed: number;
  daysInMonth: number;
  projectedTotal: number;
  series: { day: number; cumulative: number }[];
}

export interface BillingTrendState {
  trend: BillingTrend | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches the month's daily spend series + projection once on mount. Degrades
 * gracefully: on failure the dashboard simply omits the trend panel.
 */
export function useBillingTrend(): BillingTrendState {
  const [trend, setTrend] = useState<BillingTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/billing/trend", { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as BillingTrend;
        if (aliveRef.current) setTrend(json);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (aliveRef.current) {
          setError(err instanceof Error ? err.message : "Error");
        }
      } finally {
        if (aliveRef.current) setLoading(false);
      }
    })();
    return () => {
      aliveRef.current = false;
      controller.abort();
    };
  }, []);

  return { trend, loading, error };
}
