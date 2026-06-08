import { useEffect, useRef, useState } from "react";
import { useProjectStore } from "../store/projectStore";
import { fetchRemotePortfolio, saveRemotePortfolio } from "../lib/portfolioSync";

export type SyncStatus =
  | "loading" // initial fetch in flight
  | "synced" // up to date with the server
  | "saving" // pushing a change
  | "local" // server has no copy / not editing — local only
  | "error";

/**
 * Two-way sync between the Zustand portfolio store and the server copy.
 *
 *  - On mount, loads the server portfolio (if any) and hydrates the store, so
 *    every device shows the same data.
 *  - When an edit token is set, debounced-saves local changes back to the server
 *    (and seeds the server the first time if it was empty).
 *
 * Without a token the dashboard still works fully — it just stays local
 * (localStorage), exactly as before.
 *
 * Disabled entirely in shared/read-only mode (`enabled = false`).
 */
export function usePortfolioSync(token: string, enabled = true): SyncStatus {
  const replaceProjects = useProjectStore((s) => s.replaceProjects);
  const [status, setStatus] = useState<SyncStatus>("loading");
  const hydratedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Initial load (once).
  useEffect(() => {
    if (!enabled) {
      setStatus("local");
      hydratedRef.current = true;
      return;
    }
    let alive = true;
    (async () => {
      try {
        const remote = await fetchRemotePortfolio();
        if (alive && remote && remote.length) replaceProjects(remote);
        if (!alive) return;
        // Seed the server on the owner's first authorized visit.
        if (token && !remote) {
          await saveRemotePortfolio(
            useProjectStore.getState().projects,
            token,
          ).catch(() => {});
        }
        setStatus(token ? "synced" : "local");
      } catch {
        if (alive) setStatus("local");
      } finally {
        hydratedRef.current = true;
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Save local changes back to the server when authorized (debounced).
  useEffect(() => {
    if (!enabled || !token) return;
    const unsub = useProjectStore.subscribe((state, prev) => {
      if (!hydratedRef.current || state.projects === prev.projects) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setStatus("saving");
      const snapshot = state.projects;
      saveTimer.current = setTimeout(async () => {
        try {
          await saveRemotePortfolio(snapshot, token);
          setStatus("synced");
        } catch {
          setStatus("error");
        }
      }, 1200);
    });
    return () => {
      unsub();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [enabled, token]);

  return status;
}
