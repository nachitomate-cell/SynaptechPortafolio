import type { SynapseProject } from "../types";

/**
 * Initial network seeded so the dashboard renders a populated graph on first
 * paint. These are real SynapTech SpA engagements.
 */
export const INITIAL_PROJECTS: SynapseProject[] = [
  { id: "patio-curauma", name: "Patio Curauma", category: "Retail" },
  { id: "barberia-ferraza", name: "Barbería Ferraza", category: "Servicios" },
  {
    id: "colegio-diego-thompson",
    name: "Colegio Diego Thompson",
    category: "Educación",
  },
  { id: "diagnomed", name: "Diagnomed", category: "Salud" },
  { id: "vida-sana", name: "Vida Sana", category: "Retail" },
];
