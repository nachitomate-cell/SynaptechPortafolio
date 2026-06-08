/**
 * Maps each portfolio node (by its frontend `id`, see data/mockData.ts) to the
 * GCP `project-id` whose billing it represents. The /api/billing endpoint keys
 * its response by GCP project id; this dictionary lets the UI translate that
 * back to the synapse nodes on screen.
 *
 * ⚠️ Replace the placeholder GCP ids below with your real Google Cloud
 * `project-id`s (the slug, e.g. "synaptech-curauma-prod", NOT the display name
 * and NOT the numeric project number). Several frontend nodes may legitimately
 * map to the same GCP project if they live in one shared cloud project.
 */
export const FRONTEND_TO_GCP_PROJECT: Record<string, string> = {
  // Patio Curauma  ·  billing 01335B-EEAF2A-5F253C
  "club-patio-curauma": "studio-7914495232-557f1",

  // SaaS Multitenant  ·  billing 0146C3-D72397-1E0E66
  // Solo Elegance tiene proyecto GCP propio hoy. Las demás barberías no tienen
  // proyecto cloud todavía, así que no muestran costo. Añade su `project-id`
  // aquí cuando lo crees:
  "barberia-elegance": "barberia-elegance",
  // "barberia-ferraza": "barberia-ferraza-prod",
  // "chameleon-barber": "chameleon-barber-prod",
  // "barberia-djones": "barberia-djones-prod",
  // "aura-salon": "aura-salon-prod",

  // Consultora Minera Sonqollay  ·  billing 01335B-EEAF2A-5F253C
  "sonqollay-app": "sonqollayapp",
  // "sonqollay-db" y "label-studio-ext" no tienen proyecto GCP separado.

  // Restaurantes  ·  billing 0146C3-D72397-1E0E66
  "calipso-concon": "calipso-a7266",
  // "tohome": "tohome-prod",
};

/** GCP project id backing a given frontend node, if any. */
export function gcpProjectFor(frontendId: string): string | undefined {
  return FRONTEND_TO_GCP_PROJECT[frontendId];
}

/**
 * Formats a cost for the compact node label, e.g. 12.4 → "$12.40". Keeps it
 * deliberately short (no thousands separators needed at this scale).
 */
export function formatCost(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Unknown currency code → fall back to a plain "$" prefix.
    return `$${amount.toFixed(2)}`;
  }
}
