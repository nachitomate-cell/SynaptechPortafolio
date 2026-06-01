/**
 * Project lifecycle statuses (independent of the active/connected flag). Used by
 * the info modal, the summary panel and the filters. Colors are semantic (not
 * brand decoration), kept tasteful against the dark theme.
 */
export type ProjectStatus =
  | "planificacion"
  | "en-curso"
  | "entregado"
  | "mantenimiento"
  | "pausado";

export interface StatusMeta {
  id: ProjectStatus;
  label: string;
  color: string;
}

export const PROJECT_STATUSES: StatusMeta[] = [
  { id: "planificacion", label: "Planificación", color: "#a78bfa" },
  { id: "en-curso", label: "En curso", color: "#fbbf24" },
  { id: "entregado", label: "Entregado", color: "#a3d94a" },
  { id: "mantenimiento", label: "Mantenimiento", color: "#38bdf8" },
  { id: "pausado", label: "Pausado", color: "#a1a1aa" },
];

/** Status assumed when a project has none set. */
export const DEFAULT_STATUS: ProjectStatus = "en-curso";

export function statusMeta(status: ProjectStatus | undefined): StatusMeta {
  return (
    PROJECT_STATUSES.find((s) => s.id === (status ?? DEFAULT_STATUS)) ??
    PROJECT_STATUSES[1]
  );
}
