import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SynapseProject } from "../types";
import { INITIAL_PROJECTS } from "../data/mockData";

/**
 * Domain store for the portfolio (the SynapTech projects / synapses).
 *
 * Persisted to localStorage via Zustand's `persist` middleware so additions,
 * deletions, power toggles, descriptions and repo links survive reloads. The
 * persistence backend is encapsulated here: swapping localStorage for a remote
 * API (Supabase/Firestore/etc.) later only touches this file, not the UI.
 */
interface ProjectState {
  projects: SynapseProject[];
  addProject: (name: string, category: string) => void;
  /** Bulk-import projects (e.g. from GitHub); skips repos already present. */
  importProjects: (
    items: {
      name: string;
      category: string;
      repoUrl: string;
      language?: string;
      stars?: number;
      pushedAt?: string;
    }[],
  ) => void;
  deleteProject: (id: string) => void;
  toggleActive: (id: string) => void;
  updateProject: (id: string, patch: Partial<SynapseProject>) => void;
  /** Add/remove a symmetric link between two projects. */
  toggleConnection: (a: string, b: string) => void;
  /** Replace the whole portfolio (e.g. importing a JSON backup). */
  replaceProjects: (projects: SynapseProject[]) => void;
  resetProjects: () => void;
}

/** URL-safe, collision-resistant id from a project name. */
function makeId(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slug || "proyecto"}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: INITIAL_PROJECTS,

      addProject: (name, category) =>
        set((s) => ({
          projects: [...s.projects, { id: makeId(name), name, category }],
        })),

      importProjects: (items) =>
        set((s) => {
          const existing = new Set(
            s.projects.map((p) => p.repoUrl).filter(Boolean),
          );
          const toAdd = items
            .filter((i) => !existing.has(i.repoUrl))
            .map((i) => ({
              id: makeId(i.name),
              name: i.name,
              category: i.category,
              repoUrl: i.repoUrl,
              language: i.language,
              stars: i.stars,
              pushedAt: i.pushedAt,
              active: true,
            }));
          return { projects: [...s.projects, ...toAdd] };
        }),

      deleteProject: (id) =>
        set((s) => ({
          // Drop the project and scrub it from everyone's connection list.
          projects: s.projects
            .filter((p) => p.id !== id)
            .map((p) =>
              p.connections?.includes(id)
                ? { ...p, connections: p.connections.filter((c) => c !== id) }
                : p,
            ),
        })),

      toggleActive: (id) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, active: p.active === false } : p,
          ),
        })),

      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...patch } : p,
          ),
        })),

      toggleConnection: (a, b) =>
        set((s) => {
          if (a === b) return s;
          const link = (p: SynapseProject, other: string) => {
            const cur = p.connections ?? [];
            const next = cur.includes(other)
              ? cur.filter((c) => c !== other)
              : [...cur, other];
            return { ...p, connections: next };
          };
          return {
            projects: s.projects.map((p) =>
              p.id === a ? link(p, b) : p.id === b ? link(p, a) : p,
            ),
          };
        }),

      replaceProjects: (projects) => set({ projects }),

      resetProjects: () => set({ projects: INITIAL_PROJECTS }),
    }),
    {
      name: "synaptech-projects",
      version: 1,
    },
  ),
);
