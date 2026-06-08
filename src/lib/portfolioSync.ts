import type { SynapseProject } from "../types";

/** Read the server-stored portfolio, or null if none has been saved yet. */
export async function fetchRemotePortfolio(): Promise<SynapseProject[] | null> {
  const res = await fetch("/api/portfolio");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { projects: SynapseProject[] | null };
  return data.projects ?? null;
}

/** Persist the portfolio to the server. Requires the owner's edit token. */
export async function saveRemotePortfolio(
  projects: SynapseProject[],
  token: string,
): Promise<void> {
  const res = await fetch("/api/portfolio", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-edit-token": token,
    },
    body: JSON.stringify({ projects }),
  });
  if (!res.ok) {
    const msg = res.status === 401 ? "Token de edición inválido" : `HTTP ${res.status}`;
    throw new Error(msg);
  }
}
