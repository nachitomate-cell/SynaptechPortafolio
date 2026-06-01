import type { SynapseProject } from "../types";

/**
 * Current SynapTech SpA portfolio, grouped by category. Every project starts
 * active (connected); inactive ones can be toggled off from the UI to show them
 * as disconnected synapses. A few entries seed statuses, project-to-project
 * connections and enriched detail to showcase those features out of the box.
 */
export const INITIAL_PROJECTS: SynapseProject[] = [
  // Patio Curauma
  {
    id: "club-patio-curauma",
    name: "Club Patio Curauma",
    category: "Patio Curauma",
    status: "entregado",
    highlights: ["Reservas online", "Panel de socios", "Pagos integrados"],
  },

  // SaaS Multitenant (producto propio para barberías y salones).
  // Las instancias comparten la misma base multitenant → quedan enlazadas.
  {
    id: "barberia-ferraza",
    name: "Barbería Ferraza",
    category: "SaaS Multitenant",
    status: "en-curso",
    connections: ["barberia-elegance", "chameleon-barber"],
  },
  {
    id: "barberia-elegance",
    name: "Barbería Elegance",
    category: "SaaS Multitenant",
    status: "en-curso",
    connections: ["barberia-ferraza"],
  },
  {
    id: "chameleon-barber",
    name: "Chameleon Barber Studio",
    category: "SaaS Multitenant",
    status: "en-curso",
    connections: ["barberia-ferraza", "aura-salon"],
  },
  {
    id: "barberia-djones",
    name: "Barbería D'Jones",
    category: "SaaS Multitenant",
    status: "mantenimiento",
    connections: ["aura-salon"],
  },
  {
    id: "aura-salon",
    name: "Aura Salon",
    category: "SaaS Multitenant",
    status: "en-curso",
    connections: ["chameleon-barber", "barberia-djones"],
  },

  // Consultora Minera Sonqollay
  {
    id: "sonqollay-app",
    name: "SonqollayAPP",
    category: "Consultora Sonqollay",
    status: "mantenimiento",
    connections: ["sonqollay-db"],
  },
  {
    id: "sonqollay-db",
    name: "Base de datos Sonqollay",
    category: "Consultora Sonqollay",
    status: "entregado",
    connections: ["sonqollay-app", "label-studio-ext"],
  },
  {
    id: "label-studio-ext",
    name: "Extensión Label Studio",
    category: "Consultora Sonqollay",
    status: "planificacion",
    connections: ["sonqollay-db"],
  },

  // Restaurantes
  {
    id: "tohome",
    name: "ToHome",
    category: "Restaurantes",
    status: "planificacion",
    highlights: ["Delivery propio", "Sin comisiones"],
  },
  {
    id: "calipso-concon",
    name: "Calipso Concón",
    category: "Restaurantes",
    status: "pausado",
  },
];
