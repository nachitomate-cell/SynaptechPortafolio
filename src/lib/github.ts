// Minimal client for GitHub's public REST API. Fetches a user's public
// repositories so they can be imported as synapses. No auth required (CORS is
// allowed by api.github.com); subject to the unauthenticated rate limit.

export interface RepoInfo {
  id: number;
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  language: string | null;
  archived: boolean;
  stars: number;
  pushedAt: string;
}

/** Live metadata for a single repository. */
export interface RepoMeta {
  stars: number;
  language: string | null;
  pushedAt: string;
}

/** Extracts {owner, repo} from a GitHub URL, or null if it isn't one. */
export function parseRepoUrl(
  url: string | undefined,
): { owner: string; repo: string } | null {
  if (!url) return null;
  const m = url.match(/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i);
  return m ? { owner: m[1], repo: m[2] } : null;
}

/** Fetches live metadata (stars, language, last push) for one repository. */
export async function fetchRepoMeta(
  owner: string,
  repo: string,
): Promise<RepoMeta> {
  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    { headers: { Accept: "application/vnd.github+json" } },
  );
  if (res.status === 403)
    throw new Error("Límite de la API de GitHub alcanzado. Intenta más tarde.");
  if (!res.ok) throw new Error(`Error de GitHub (${res.status}).`);
  const r = await res.json();
  return {
    stars: r.stargazers_count ?? 0,
    language: r.language ?? null,
    pushedAt: r.pushed_at ?? "",
  };
}

export async function fetchUserRepos(username: string): Promise<RepoInfo[]> {
  const user = username.trim().replace(/^@/, "");
  if (!user) return [];

  const res = await fetch(
    `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=updated`,
    { headers: { Accept: "application/vnd.github+json" } },
  );

  if (res.status === 404) throw new Error("Usuario de GitHub no encontrado.");
  if (res.status === 403)
    throw new Error("Límite de la API de GitHub alcanzado. Intenta más tarde.");
  if (!res.ok) throw new Error(`Error de GitHub (${res.status}).`);

  const data: unknown = await res.json();
  if (!Array.isArray(data)) return [];

  return data.map((r) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    description: r.description ?? "",
    htmlUrl: r.html_url,
    language: r.language,
    archived: !!r.archived,
    stars: r.stargazers_count ?? 0,
    pushedAt: r.pushed_at ?? "",
  }));
}
