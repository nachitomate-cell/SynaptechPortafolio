/**
 * A peripheral node in the synaptic network. Each one represents a client or
 * project connected to the SynapTech SpA core.
 */
export interface SynapseProject {
  id: string;
  name: string;
  /** Optional short descriptor shown alongside the label. */
  category?: string;
  /**
   * Whether the project is active and connected. Inactive projects appear
   * dimmed and disconnected from the network. Treated as active when omitted.
   */
  active?: boolean;
  /** URL of the related GitHub repository, shown in the info modal. */
  repoUrl?: string;
  /** Optional short description shown in the info modal. */
  description?: string;
  /** Lifecycle status (see data/statuses.ts). Defaults to "en-curso". */
  status?: import("./data/statuses").ProjectStatus;
  /** Ids of other projects this one is linked to (symmetric edges). */
  connections?: string[];
  /** Live GitHub metadata (filled on import or refresh). */
  stars?: number;
  language?: string;
  /** ISO timestamp of the last push, for "actualizado hace…". */
  pushedAt?: string;
  /** Enriched detail: preview image, live demo and highlight bullets. */
  imageUrl?: string;
  demoUrl?: string;
  highlights?: string[];
}

/**
 * A project after a layout has resolved its on-screen position. Coordinates are
 * absolute pixels within the canvas.
 */
export interface PositionedProject extends SynapseProject {
  x: number;
  y: number;
  /** Angle (radians) of the node relative to its parent, for label placement. */
  angle: number;
}

/**
 * A category cluster in the "por categorías" view: a hub positioned around the
 * core, with its member projects positioned around the hub.
 */
export interface PositionedCategory {
  id: string;
  name: string;
  accent: string;
  x: number;
  y: number;
  angle: number;
  projects: PositionedProject[];
}
