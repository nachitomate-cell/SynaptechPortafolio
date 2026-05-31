/**
 * Default project categories for SynapTech SpA. Each category carries an accent
 * within the brand's green family so the "por categorías" view can distinguish
 * clusters while staying on-brand.
 */
export interface Category {
  id: string;
  name: string;
  /** Accent hex (green-family) used for the hub, its synapses and labels. */
  accent: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "retail", name: "Retail", accent: "#92c83a" },
  { id: "servicios", name: "Servicios", accent: "#5fb37a" },
  { id: "educacion", name: "Educación", accent: "#b6d94a" },
  { id: "salud", name: "Salud", accent: "#3fb58a" },
  { id: "gastronomia", name: "Gastronomía", accent: "#c9d83a" },
  { id: "tecnologia", name: "Tecnología", accent: "#6ec83a" },
];

/** Brand green, used as a fallback for categories outside the defaults. */
export const BRAND_ACCENT = "#a3d94a";

/** Resolves the accent for a category name, falling back to brand green. */
export function accentForCategory(name: string | undefined): string {
  if (!name) return BRAND_ACCENT;
  const match = DEFAULT_CATEGORIES.find(
    (c) => c.name.toLowerCase() === name.toLowerCase(),
  );
  return match?.accent ?? BRAND_ACCENT;
}
