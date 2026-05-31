/**
 * Project categories for SynapTech SpA, mirroring the real portfolio groupings.
 * Each category carries an accent within the brand's green family so the "por
 * categorías" view can distinguish clusters while staying on-brand.
 */
export interface Category {
  id: string;
  name: string;
  /** Accent hex (green-family) used for the hub, its synapses and labels. */
  accent: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "patio-curauma", name: "Patio Curauma", accent: "#92c83a" },
  { id: "saas-multitenant", name: "SaaS Multitenant", accent: "#6ec83a" },
  { id: "consultora-sonqollay", name: "Consultora Sonqollay", accent: "#3fb58a" },
  { id: "restaurantes", name: "Restaurantes", accent: "#c9d83a" },
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
