import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FRONTEND_TO_GCP_PROJECT } from "../data/gcpProjects";

/** Raw payload returned by /api/billing (keyed by GCP project id). */
interface BillingPayload {
  updatedAt: string;
  month: string;
  currency: string;
  total: number;
  projects: Record<string, number>;
}

export interface BillingState {
  /** Cost per *frontend* node id (already translated from GCP project ids). */
  byNode: Record<string, number>;
  /** Sum of every project's cost for the current month. */
  total: number;
  currency: string;
  month: string | null;
  updatedAt: string | null;
  loading: boolean;
  error: string | null;
  /** Force an immediate refetch (e.g. a manual "refresh" button). */
  refresh: () => void;
}

/** How often to silently refetch while the app stays open (15 min). */
const REFRESH_MS = 15 * 60 * 1000;

/**
 * Fetches month-to-date GCP billing from /api/billing and exposes it keyed by
 * the frontend node ids used across the dashboard. Refetches on an interval and
 * whenever the tab regains focus, and degrades gracefully: on any failure the
 * costs are simply absent (the UI just doesn't render a price), never broken.
 */
export function useBilling(): BillingState {
  const [data, setData] = useState<BillingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bumping this triggers a refetch without re-creating the effect each render.
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  // Avoid setting state after unmount (fast navigations / strict-mode remounts).
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setError(null);
        const res = await fetch("/api/billing", { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as BillingPayload;
        if (aliveRef.current) setData(json);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (aliveRef.current) {
          setError(err instanceof Error ? err.message : "Error desconocido");
        }
      } finally {
        if (aliveRef.current) setLoading(false);
      }
    };

    void load();

    const interval = setInterval(load, REFRESH_MS);
    const onVisible = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      controller.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [nonce]);

  // Translate GCP-keyed costs into frontend-node-keyed costs. When several nodes
  // share one GCP project, each shows that project's full cost (the header total
  // still counts each GCP project once, straight from the API).
  const byNode = useMemo(() => {
    const out: Record<string, number> = {};
    if (!data) return out;
    for (const [nodeId, gcpId] of Object.entries(FRONTEND_TO_GCP_PROJECT)) {
      const cost = data.projects[gcpId];
      if (cost != null) out[nodeId] = cost;
    }
    return out;
  }, [data]);

  return {
    byNode,
    total: data?.total ?? 0,
    currency: data?.currency ?? "USD",
    month: data?.month ?? null,
    updatedAt: data?.updatedAt ?? null,
    loading,
    error,
    refresh,
  };
}
