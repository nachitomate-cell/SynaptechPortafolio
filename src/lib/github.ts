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
  }));
}
