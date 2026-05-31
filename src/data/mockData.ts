import type { SynapseProject } from "../types";

/**
 * Current SynapTech SpA portfolio, grouped by category. Every project starts
 * active (connected); inactive ones can be toggled off from the UI to show them
 * as disconnected synapses.
 */
export const INITIAL_PROJECTS: SynapseProject[] = [
  // Patio Curauma
  { id: "club-patio-curauma", name: "Club Patio Curauma", category: "Patio Curauma" },

  // SaaS Multitenant (producto propio para barberías y salones)
  { id: "barberia-ferraza", name: "Barbería Ferraza", category: "SaaS Multitenant" },
  { id: "barberia-elegance", name: "Barbería Elegance", category: "SaaS Multitenant" },
  { id: "chameleon-barber", name: "Chameleon Barber Studio", category: "SaaS Multitenant" },
  { id: "barberia-djones", name: "Barbería D'Jones", category: "SaaS Multitenant" },
  { id: "aura-salon", name: "Aura Salon", category: "SaaS Multitenant" },

  // Consultora Minera Sonqollay
  { id: "sonqollay-app", name: "SonqollayAPP", category: "Consultora Sonqollay" },
  { id: "sonqollay-db", name: "Base de datos Sonqollay", category: "Consultora Sonqollay" },
  { id: "label-studio-ext", name: "Extensión Label Studio", category: "Consultora Sonqollay" },

  // Restaurantes
  { id: "tohome", name: "ToHome", category: "Restaurantes" },
  { id: "calipso-concon", name: "Calipso Concón", category: "Restaurantes" },
];
