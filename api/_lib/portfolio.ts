import { getRedis } from "./push.js";

/**
 * Server-side persistence for the portfolio (the SynapTech projects/synapses),
 * stored in the same Upstash Redis used by push. Lets the dashboard sync across
 * devices instead of living only in each browser's localStorage.
 *
 * Reads are public; writes are gated by PORTFOLIO_EDIT_TOKEN (see api/portfolio).
 */

const KEY = "portfolio:data";

/** A project is opaque here; we only require an id + name to accept it. */
export interface StoredProject {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface StoredPortfolio {
  projects: StoredProject[];
  updatedAt: string;
}

export async function getPortfolio(): Promise<StoredPortfolio | null> {
  const data = await getRedis().get<StoredPortfolio>(KEY);
  return data ?? null;
}

export async function setPortfolio(
  projects: StoredProject[],
): Promise<StoredPortfolio> {
  const payload: StoredPortfolio = {
    projects,
    updatedAt: new Date().toISOString(),
  };
  await getRedis().set(KEY, payload);
  return payload;
}

/** Validate an incoming array shape before persisting it. */
export function isValidPortfolio(value: unknown): value is StoredProject[] {
  return (
    Array.isArray(value) &&
    value.every(
      (p) =>
        p &&
        typeof p === "object" &&
        typeof (p as StoredProject).id === "string" &&
        typeof (p as StoredProject).name === "string",
    )
  );
}
